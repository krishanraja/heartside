import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { buildCheckoutImageWorkflow } from './build-checkout-image-workflow.mjs';
import { IMAGE_FILES_QUERY, IMAGE_READ_QUERY, IMAGE_CREATE_MUTATION } from './checkout-image.mjs';
import { proxyGuard, proxyVerified, admissionDecision } from './checkout-image-steps.mjs';
// n8n2.43.5 uses Tournament1.14.0. Exercise its actual delimiter/parser path,
// not only JavaScript evaluation after stripping the expression wrapper.
const require = createRequire(new URL('../tools/preview/package.json', import.meta.url));
const { Tournament } = require('@n8n/tournament');
const tournament = new Tournament(error => { throw error; });

const config = () => ({ shop: 'example-shop.myshopify.com', proxyPath: '/apps/heartside-artwork', shopifyImagePrefix: 'https://cdn.shopify.com/s/files/1/1111/2222/3333/files/', allowedVariantIds: ['12345'], enabled: true, cryptoCredentialId: 'test_crypto', shopifyCredentialId: 'test_shopify' });
const uuid = '11111111-2222-4333-8444-555555555555';
const secret = 'synthetic-local-test-only';
const runtimeToken = 'synthetic_runtime_access_token_only';
for (const [name, expected] of [
  ['Find image', { query: 'filename:synthetic.jpg' }],
  ['Read image', { id: 'gid://shopify/MediaImage/99' }],
  ['Create image once', { files: [{ originalSource: 'https://example.invalid/native.jpg', filename: 'synthetic.jpg', alt: 'synthetic-marker', contentType: 'IMAGE', duplicateResolutionMode: 'RAISE_ERROR' }] }],
]) test(`real n8n expression parser: ${name} body preserves GraphQL variables and rejects old adjacent braces`, () => {
  const body = buildCheckoutImageWorkflow(config()).nodes.find(n => n.name === name).parameters.jsonBody;
  const scope = { JSON, $json: { filename: 'synthetic.jpg', fileId: 'gid://shopify/MediaImage/99', source: 'https://example.invalid/native.jpg', marker: 'synthetic-marker' } };
  const result = JSON.parse(tournament.execute(body.slice(1), scope));
  assert.deepEqual(result.variables, expected);
  assert.equal(result.query, { 'Find image': IMAGE_FILES_QUERY, 'Read image': IMAGE_READ_QUERY, 'Create image once': IMAGE_CREATE_MUTATION }[name]);
  assert.equal((body.match(/\}\}/g) || []).length, 1, 'only the final n8n delimiter remains');
  const broken = body.replace(/variables:\((.*)\)\}\) \}\}$/, 'variables:$1}) }}');
  assert.notEqual(broken, body);
  // This is valid JavaScript; n8n splits it prematurely at the inner }}.
  assert.doesNotThrow(() => vm.runInNewContext(broken.slice(3, -2), scope));
  assert.throws(() => tournament.execute(broken.slice(1), scope));
});
test('real n8n splitter also rejects closing delimiters inside quoted GraphQL text', () => {
  const query = 'query { files { id }}';
  const expression = literal => '{{ JSON.stringify({query:' + literal + ',variables:({})}) }}';
  assert.throws(() => tournament.execute(expression(JSON.stringify(query)), { JSON }));
  const protectedQuery = JSON.stringify(query).replace(/}/g, '\\u007d');
  assert.equal(JSON.parse(tournament.execute(expression(protectedQuery), { JSON })).query, query);
});
function signedInput() {
  const body = { customizationId: uuid, variantId: '12345' };
  const query = { ...body, shop: config().shop, path_prefix: config().proxyPath, logged_in_customer_id: '', timestamp: String(Math.floor(Date.now() / 1000)), extra: ['a', 'b'], signature: '0'.repeat(64) };
  query.signature = createHmac('sha256', secret).update(proxyGuard({ body, query }, config()).canonical).digest('hex');
  return { body, query };
}
function fixtureRuntime(tableRows = []) {
  const calls = []; const tableCalls = []; let file;
  return { calls, tableCalls, tableRows, now: Date.now(), setFile: x => { file = x; }, async dataTable(node, parameters) {
    tableCalls.push(node.name);
    if (parameters.operation === 'insert') {
      const row = { id: tableRows.length + 1, ...parameters.columns.value };
      tableRows.push(row); // Models the committed insert before the next node runs.
      return [row];
    }
    if (parameters.operation === 'get') {
      return tableRows.filter(row => parameters.filters.conditions.every(f => row[f.keyName] === f.keyValue)).sort((a, b) => a.id - b.id).slice(0, parameters.limit);
    }
    throw new Error('unexpected table node');
  }, async http(node, parameters) {
    calls.push({ name: node.name, parameters });
    if (node.name === 'Acquire shop token') return { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'read_files,write_files,read_app_proxy,write_app_proxy' } };
    if (node.name === 'Check native preview') return { statusCode: 200, headers: { 'content-type': 'image/jpeg', 'content-length': '1000' }, body: '' };
    assert.equal(parameters.headerParameters.parameters[0].value, runtimeToken);
    const request = JSON.parse(parameters.jsonBody);
    if (node.name === 'Find image') return { statusCode: 200, body: { data: { files: { nodes: file ? [file] : [], pageInfo: { hasNextPage: false } } } } };
    if (node.name === 'Create image once') {
      const input = request.variables.files[0];
      file = { id: 'gid://shopify/MediaImage/99', alt: input.alt, fileStatus: 'READY', fileErrors: [], image: { url: config().shopifyImagePrefix + input.filename + '?v=123', width: 960, height: 960 } };
      return { statusCode: 200, body: { data: { fileCreate: { files: [file], userErrors: [] } } } };
    }
    if (node.name === 'Read image') return { statusCode: 200, body: { data: { node: file } } };
    throw new Error('unexpected HTTP node');
  } };
}
async function runGraph(flow, input, runtime) {
  const byName = new Map(flow.nodes.map(n => [n.name, n])); const outputs = new Map();
  let name = 'Webhook'; let current = input; let steps = 0;
  while (name) {
    assert.ok(++steps < 40, 'acyclic bounded workflow');
    const node = byName.get(name); let branch = 0;
    const first = value => Array.isArray(value) ? value[0] : value;
    const Clock = class extends Date { static now() { return runtime.now; } };
    const scope = { $input: { first: () => ({ json: first(current) }), all: () => (Array.isArray(current) ? current : [current]).map(json => ({ json })) }, $json: first(current), $: n => ({ first: () => ({ json: first(outputs.get(n)) }) }), Date: Clock, Buffer };
    const expression = value => typeof value === 'string' && value.startsWith('={{') ? tournament.execute(value.slice(1), { ...scope, JSON, Math }) : value;
    const resolve = value => Array.isArray(value) ? value.map(resolve) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)])) : expression(value);
    if (node.type.endsWith('.code')) current = vm.runInNewContext(`(function(){${node.parameters.jsCode}})()`, scope)[0].json;
    else if (node.type.endsWith('.crypto')) current = { ...current, computedSignature: createHmac('sha256', secret).update(expression(node.parameters.value)).digest('hex') };
    else if (node.type.endsWith('.if')) branch = expression(node.parameters.conditions.conditions[0].leftValue) ? 0 : 1;
    else if (node.type.endsWith('.httpRequest')) {
      const parameters = resolve(node.parameters);
      current = await runtime.http(node, parameters);
    } else if (node.type.endsWith('.dataTable')) current = await runtime.dataTable(node, resolve(node.parameters));
    else if (node.type.endsWith('.respondToWebhook')) return { status: expression(node.parameters.options.responseCode), body: JSON.parse(expression(node.parameters.responseBody)) };
    outputs.set(name, current);
    const next = flow.connections[name]?.main?.[branch] || [];
    assert.equal(next.length, 1, `exactly one continuation for ${name}`);
    name = next[0].node;
  }
  throw new Error('missing response');
}
test('full generated graph: authenticated creation202, next pollREADY200, no duplicate mutation', async () => {
  const runtime = fixtureRuntime(); const flow = buildCheckoutImageWorkflow(config());
  const first = await runGraph(flow, signedInput(), runtime);
  assert.equal(first.status, 202);
  const second = await runGraph(flow, signedInput(), runtime);
  assert.equal(second.status, 200);
  assert.equal(second.body.properties._hs_checkout_bundle_id, uuid + '-12345');
  assert.equal(second.body.properties._hs_checkout_parent, 'true');
  assert.equal(runtime.calls.filter(x => x.name === 'Create image once').length, 1);
  assert.equal(runtime.calls.at(-1).name, 'Read image');
  assert.equal(runtime.calls.filter(x => x.name === 'Acquire shop token').length, 2);
  assert.ok(!JSON.stringify([first, second]).includes(runtimeToken));
});
for (const [label, mutate] of [
  ['bad signature', x => { x.query.signature = 'a'.repeat(64); }],
  ['changed signed body', x => { x.body.variantId = '54321'; }],
  ['wrong shop', x => { x.query.shop = 'other.myshopify.com'; }],
  ['expired timestamp', x => { x.query.timestamp = '1000000000'; }],
  ['duplicate signed ID', x => { x.query.variantId = ['12345', '54321']; }],
  ['extra body URL', x => { x.body.url = 'https://example.invalid'; }],
]) test(`rejects ${label} before any HTTP side effect`, async () => {
  const input = signedInput(); mutate(input); const runtime = fixtureRuntime();
  const result = await runGraph(buildCheckoutImageWorkflow(config()), input, runtime);
  assert.ok([400, 403].includes(result.status)); assert.equal(runtime.calls.length, 0);
});
test('disabled configuration returns503 before Crypto or HTTP', async () => {
  const c = config(); c.enabled = false; delete c.cryptoCredentialId; delete c.shopifyCredentialId;
  const runtime = fixtureRuntime(); const result = await runGraph(buildCheckoutImageWorkflow(c), signedInput(), runtime);
  assert.equal(result.status, 503); assert.equal(runtime.calls.length, 0);
});
test('credentials are references only and every managed request rejects redirects/retries', () => {
  const flow = buildCheckoutImageWorkflow(config());
  assert.equal(flow.active, false);
  assert.equal(flow.settings.saveDataSuccessExecution, 'none');
  assert.equal(flow.nodes.find(n => n.name === 'Proxy HMAC').typeVersion, 2);
  for (const node of flow.nodes.filter(n => n.type.endsWith('.httpRequest'))) {
    assert.equal(node.retryOnFail, false);
    assert.equal(node.parameters.options.redirect.redirect.followRedirects, false);
    if (node.name === 'Acquire shop token') assert.deepEqual(node.credentials, { httpCustomAuth: { id: 'test_shopify' } });
    else assert.equal(node.credentials, undefined);
  }
  assert.ok(!JSON.stringify(flow).includes(secret));
  assert.throws(() => buildCheckoutImageWorkflow({ ...config(), accessToken: 'not-a-secret' }), /unsupported/);
});

test('three-part Shopify CDN prefix is required', () => {
  assert.doesNotThrow(() => buildCheckoutImageWorkflow(config()));
  assert.throws(() => buildCheckoutImageWorkflow({ ...config(), shopifyImagePrefix: 'https://cdn.shopify.com/s/files/1/1111/2222/files/' }), /invalid_server/);
});

test('checked-in import is reproducible, disabled and restricted to ten synthetic variant fixtures', () => {
  const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
  const registry = read('checkout-image.config.json');
  const actual = read('checkout-image.workflow.json');
  assert.deepEqual(actual, buildCheckoutImageWorkflow(registry));
  assert.equal(registry.enabled, false);
  assert.equal(registry.allowedVariantIds.length, 10);
  assert.equal(new Set(registry.allowedVariantIds).size, 10);
  assert.ok(actual.nodes.every(n => !n.credentials));
  assert.ok(!JSON.stringify(actual).includes(runtimeToken));
});

test('generated workflow is identical when actual step source uses LF or CRLF', async () => {
  const source = readFileSync(new URL('checkout-image-steps.mjs', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
  const builder = readFileSync(new URL('build-checkout-image-workflow.mjs', import.meta.url), 'utf8');
  const dataUrl = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
  const load = async steps => import(dataUrl(builder
    .replace("'./checkout-image.mjs'", JSON.stringify(new URL('checkout-image.mjs', import.meta.url).href))
    .replace("'./checkout-image-steps.mjs'", JSON.stringify(dataUrl(steps)))));
  const lf = await load(source);
  const crlf = await load(source.replace(/\n/g, '\r\n'));
  assert.deepEqual(lf.buildCheckoutImageWorkflow(config()), crlf.buildCheckoutImageWorkflow(config()));
});

for (const [label, response] of [
  ['expired credentials', { statusCode: 401, body: { error: 'secret-provider-message' } }],
  ['missing Files scope', { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'read_files,write_app_proxy' } }],
  ['missing app proxy write scope', { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'read_files,write_files,read_app_proxy' } }],
  ['unexpected broad scope', { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'write_files,write_app_proxy,write_orders' } }],
  ['customer read scope', { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'read_files,write_files,read_app_proxy,write_app_proxy,read_customers' } }],
  ['customer write scope', { statusCode: 200, body: { access_token: runtimeToken, expires_in: 86399, scope: 'read_files,write_files,read_app_proxy,write_app_proxy,write_customers' } }],
]) test(`token acquisition fails closed for ${label}, with no secret in response`, async () => {
  const runtime = fixtureRuntime(); const original = runtime.http;
  runtime.http = async (node, p) => node.name === 'Acquire shop token' ? response : original(node, p);
  const result = await runGraph(buildCheckoutImageWorkflow(config()), signedInput(), runtime);
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { state: 'error', code: 'shop_authentication_failed' });
  assert.equal(runtime.calls.length, 0);
});
test('Shopify documented anonymous query canonicalization includes repeated params', () => {
  const x = signedInput(); const guarded = proxyGuard(x, config());
  assert.ok(guarded.canonical.includes('extra=a,b'));
  assert.ok(guarded.canonical.includes('logged_in_customer_id='));
  assert.equal(proxyVerified(guarded, x.query.signature).request.variantId, '12345');
  assert.equal(proxyVerified(guarded, '0'.repeat(64)).httpStatus, 403);
});
test('provider redirect or bad HEAD prevents fileCreate', async () => {
  const runtime = fixtureRuntime(); const http = runtime.http;
  runtime.http = async (node, p) => node.name === 'Check native preview' ? { statusCode: 302, headers: { location: 'https://example.invalid' } } : http(node, p);
  const result = await runGraph(buildCheckoutImageWorkflow(config()), signedInput(), runtime);
  assert.equal(result.status, 503); assert.ok(!runtime.calls.some(x => x.name === 'Create image once'));
});
test('lost create response yields pending; graph never retries mutation', async () => {
  const runtime = fixtureRuntime(); const http = runtime.http;
  runtime.http = async (node, p) => { const result = await http(node, p); return node.name === 'Create image once' ? { error: 'timeout' } : result; };
  const result = await runGraph(buildCheckoutImageWorkflow(config()), signedInput(), runtime);
  assert.equal(result.body.code, 'create_unconfirmed');
  assert.equal(runtime.calls.filter(x => x.name === 'Create image once').length, 1);
});

test('optional admission branch permits 30 attempts, rejects 31 before any token call', async () => {
  const runtime = fixtureRuntime(); const flow = buildCheckoutImageWorkflow({ ...config(), admissionTableId: 'private_table_fixture' });
  for (let i = 0; i < 30; i++) assert.ok([200, 202].includes((await runGraph(flow, signedInput(), runtime)).status));
  assert.equal((await runGraph(flow, signedInput(), runtime)).status, 429);
  assert.equal(runtime.calls.filter(c => c.name === 'Acquire shop token').length, 30);
  assert.equal(runtime.tableRows.length, 31);
  assert.deepEqual(Object.keys(runtime.tableRows[0]).sort(), ['id', 'minuteBucket', 'shopKey']);
});

test('invalid proxy signature cannot append operational records', async () => {
  const runtime = fixtureRuntime(); const input = signedInput(); input.query.signature = '0'.repeat(64);
  const flow = buildCheckoutImageWorkflow({ ...config(), admissionTableId: 'private_table_fixture' });
  assert.equal((await runGraph(flow, input, runtime)).status, 403);
  assert.equal(runtime.calls.length, 0); assert.equal(runtime.tableCalls.length, 0);
});

test('80 concurrent admissions cannot exceed 30 downstream token calls', async () => {
  const runtime = fixtureRuntime(); const flow = buildCheckoutImageWorkflow({ ...config(), admissionTableId: 'private_table_fixture' });
  const results = await Promise.all(Array.from({ length: 80 }, () => runGraph(flow, signedInput(), runtime)));
  assert.equal(runtime.tableRows.length, 80);
  assert.ok(results.filter(r => r.status !== 429).length <= 30);
  assert.ok(runtime.calls.filter(c => c.name === 'Acquire shop token').length <= 30);
});

test('admission fails closed on failed insert, empty/error read, wrong scope and stale bucket', async () => {
  const flow = buildCheckoutImageWorkflow({ ...config(), admissionTableId: 'private_table_fixture' });
  for (const target of ['Append admission attempt', 'Read admission bucket']) {
    for (const response of [[], [{ error: 'table unavailable' }]]) {
      const runtime = fixtureRuntime(); const execute = runtime.dataTable;
      runtime.dataTable = (n, p) => n.name === target ? response : execute(n, p);
      assert.equal((await runGraph(flow, signedInput(), runtime)).status, 429);
      assert.equal(runtime.calls.length, 0);
    }
  }
  const now = Date.now(), minuteBucket = Math.floor(now / 60000);
  const context = { admission: { shopKey: 'fixture', minuteBucket, rowId: 1 } };
  const own = { id: 1, shopKey: 'fixture', minuteBucket };
  for (const rows of [[{ ...own, shopKey: 'other' }], [{ ...own, id: 2 }], [own, own]]) assert.equal(admissionDecision(rows, context, now).httpStatus, 429);
  assert.equal(admissionDecision([own], context, (minuteBucket + 1) * 60000).httpStatus, 429);
  assert.equal(admissionDecision([own], context, now), context);
});

test('admission uses one bounded page; retention is hourly and cannot delete active or other-shop buckets', () => {
  const flow = buildCheckoutImageWorkflow({ ...config(), admissionTableId: 'private_table_fixture' });
  const get = flow.nodes.find(n => n.name === 'Read admission bucket').parameters;
  assert.equal(get.returnAll, false); assert.equal(get.limit, 31); assert.equal(get.matchType, 'allConditions');
  assert.equal(get.orderByDirection, 'ASC'); assert.equal(get.orderByColumn, 'id');
  const clean = flow.nodes.find(n => n.name === 'Delete expired admission attempts').parameters;
  assert.equal(clean.operation, 'deleteRows'); assert.equal(clean.matchType, 'allConditions');
  assert.deepEqual(clean.filters.conditions[0], { keyName: 'shopKey', condition: 'eq', keyValue: config().shop });
  assert.equal(clean.filters.conditions[1].condition, 'lt');
  assert.equal(clean.filters.conditions[1].keyValue, '={{ Math.floor(Date.now() / 60000) - 120 }}');
  const schedule = flow.nodes.find(n => n.name === 'Admission retention');
  assert.deepEqual(schedule.parameters.rule.interval, [{ field: 'hours', hoursInterval: 1 }]);
  assert.equal(buildCheckoutImageWorkflow({ ...config(), enabled: false, admissionTableId: 'fixture' }).nodes.find(n => n.name === 'Admission retention').disabled, true);
  assert.ok(!buildCheckoutImageWorkflow(config()).nodes.some(n => n.type.endsWith('.dataTable')));
});
