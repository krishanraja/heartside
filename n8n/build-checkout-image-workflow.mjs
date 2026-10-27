import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { IMAGE_FILES_QUERY, IMAGE_CREATE_MUTATION, IMAGE_READ_QUERY } from './checkout-image.mjs';
import { proxyGuard, proxyVerified, tokenStep, lookupStep, previewHeadStep, createStep, readyStep, admissionInput, admissionInserted, admissionDecision } from './checkout-image-steps.mjs';

export function buildCheckoutImageWorkflow(config) {
  if (!config || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.shop) || !/^\/apps\/[a-z0-9-]+$/.test(config.proxyPath) || !/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/(?:[0-9]+\/){3}files\/$/.test(config.shopifyImagePrefix) || !Array.isArray(config.allowedVariantIds) || !config.allowedVariantIds.length || !config.allowedVariantIds.every(x => /^[0-9]+$/.test(x))) throw new Error('invalid_server_configuration');
  if (Object.keys(config).some(k => !['shop', 'proxyPath', 'shopifyImagePrefix', 'allowedVariantIds', 'enabled', 'cryptoCredentialId', 'shopifyCredentialId', 'admissionTableId'].includes(k))) throw new Error('unsupported_configuration_field');
  for (const key of ['cryptoCredentialId', 'shopifyCredentialId', 'admissionTableId']) if (config[key] !== undefined && !/^[A-Za-z0-9_-]{1,100}$/.test(config[key])) throw new Error('invalid_managed_reference');
  if (config.enabled && (!config.cryptoCredentialId || !config.shopifyCredentialId)) throw new Error('managed_credentials_required');
  const publicConfig = { shop: config.shop, proxyPath: config.proxyPath, shopifyImagePrefix: config.shopifyImagePrefix, allowedVariantIds: config.allowedVariantIds, enabled: config.enabled === true };
  const nodes = []; const connections = {};
  const add = (name, type, typeVersion, parameters, extra = {}) => { const node = { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name, type: 'n8n-nodes-base.' + type, typeVersion, position: [nodes.length * 180, 0], parameters, ...extra }; nodes.push(node); return node; };
  const link = (from, to, output = 0) => { const entry = connections[from] ||= { main: [] }; while (entry.main.length <= output) entry.main.push([]); entry.main[output].push({ node: to, type: 'main', index: 0 }); };
  const code = (name, fn, args) => add(name, 'code', 2, { mode: 'runOnceForAllItems', jsCode: `const step = ${fn.toString().replace(/\r\n?/g, '\n')};\nreturn [{json:step(${args})}];` });
  const branch = (name, expression) => add(name, 'if', 2.2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), leftValue: expression, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} });
  const responseOptions = { timeout: 6000, redirect: { redirect: { followRedirects: false } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } };
  const http = (name, query, variables) => add(name, 'httpRequest', 4.2, { method: 'POST', url: `https://${config.shop}/admin/api/2026-10/graphql.json`,
    authentication: 'none', sendHeaders: true,
    headerParameters: { parameters: [{ name: 'X-Shopify-Access-Token', value: "={{ $('Acquire shop token').first().json.body.access_token }}" }] },
    // n8n splits at }} even within quoted strings. Encode query closing braces
    // without changing the GraphQL text, and separate the nested variables object.
    sendBody: true, specifyBody: 'json', jsonBody: `={{ JSON.stringify({query:${JSON.stringify(query).replace(/}/g, '\\u007d')},variables:(${variables})}) }}`,
    options: responseOptions }, { retryOnFail: false, onError: 'continueRegularOutput' });

  add('Webhook', 'webhook', 2.1, { httpMethod: 'POST', path: 'heartside-checkout-image', authentication: 'none', responseMode: 'responseNode', options: {} });
  code('Proxy input', proxyGuard, `$input.first().json, ${JSON.stringify(publicConfig)}`);
  branch('Input allowed', '={{ !$json.httpStatus }}');
  add('Proxy HMAC', 'crypto', 2, { action: 'hmac', type: 'SHA256', binaryData: false, value: '={{ $json.canonical }}', dataPropertyName: 'computedSignature', encoding: 'hex' }, { onError: 'continueRegularOutput', ...(config.cryptoCredentialId ? { credentials: { crypto: { id: config.cryptoCredentialId } } } : {}) });
  code('Verified request', proxyVerified, `$('Proxy input').first().json, $input.first().json.computedSignature`);
  branch('Signature valid', '={{ !$json.httpStatus }}');
  if (config.admissionTableId) {
    const tableId = { __rl: true, mode: 'id', value: config.admissionTableId };
    const table = (name, parameters, extra = {}) => add(name, 'dataTable', 1.1, { resource: 'row', dataTableId: tableId, ...parameters }, { retryOnFail: false, ...extra });
    code('Admission input', admissionInput, '$input.first().json');
    table('Append admission attempt', { operation: 'insert', columns: { mappingMode: 'defineBelow', value: { shopKey: '={{ $json.admission.shopKey }}', minuteBucket: '={{ $json.admission.minuteBucket }}' }, schema: [
      { id: 'shopKey', displayName: 'shopKey', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
      { id: 'minuteBucket', displayName: 'minuteBucket', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
    ] }, options: { optimizeBulk: false } }, { alwaysOutputData: true, onError: 'continueRegularOutput' });
    code('Admission inserted', admissionInserted, "$input.all().map(i => i.json), $('Admission input').first().json");
    branch('Admission insert valid', '={{ !$json.httpStatus }}');
    table('Read admission bucket', { operation: 'get', matchType: 'allConditions', filters: { conditions: [
      { keyName: 'shopKey', condition: 'eq', keyValue: '={{ $json.admission.shopKey }}' },
      { keyName: 'minuteBucket', condition: 'eq', keyValue: '={{ $json.admission.minuteBucket }}' },
    ] }, returnAll: false, limit: 31, orderBy: true, orderByColumn: 'id', orderByDirection: 'ASC' }, { alwaysOutputData: true, onError: 'continueRegularOutput' });
    code('Admission decision', admissionDecision, "$input.all().map(i => i.json), $('Admission inserted').first().json");
    branch('Admission allowed', '={{ !$json.httpStatus }}');
    for (const [from, to, output] of [
      ['Admission input', 'Append admission attempt'], ['Append admission attempt', 'Admission inserted'], ['Admission inserted', 'Admission insert valid'],
      ['Admission insert valid', 'Read admission bucket', 0], ['Admission insert valid', 'Respond', 1], ['Read admission bucket', 'Admission decision'],
      ['Admission decision', 'Admission allowed'], ['Admission allowed', 'Acquire shop token', 0], ['Admission allowed', 'Respond', 1],
    ]) link(from, to, output);
    // Separate hourly trigger only cleans this shop's operational rows. It cannot
    // touch current admission buckets, customizations, images or Shopify records.
    add('Admission retention', 'scheduleTrigger', 1.2, { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } }, { disabled: config.enabled !== true });
    table('Delete expired admission attempts', { operation: 'deleteRows', matchType: 'allConditions', filters: { conditions: [
      { keyName: 'shopKey', condition: 'eq', keyValue: config.shop },
      { keyName: 'minuteBucket', condition: 'lt', keyValue: '={{ Math.floor(Date.now() / 60000) - 120 }}' },
    ] }, options: { dryRun: false } });
    link('Admission retention', 'Delete expired admission attempts');
  }
  add('Acquire shop token', 'httpRequest', 4.2, { method: 'POST', url: `https://${config.shop}/admin/oauth/access_token`,
    authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth', sendBody: true, specifyBody: 'json',
    jsonBody: JSON.stringify({ grant_type: 'client_credentials' }), options: responseOptions },
    { retryOnFail: false, onError: 'continueRegularOutput', ...(config.shopifyCredentialId ? { credentials: { httpCustomAuth: { id: config.shopifyCredentialId } } } : {}) });
  code('Shop token valid', tokenStep, `$input.first().json, $('Verified request').first().json`);
  branch('Shop authenticated', '={{ !$json.httpStatus }}');
  http('Find image', IMAGE_FILES_QUERY, `{query:'filename:'+$json.filename}`);
  code('Lookup decision', lookupStep, `$input.first().json, $('Verified request').first().json`);
  branch('Lookup valid', '={{ !$json.httpStatus }}');
  branch('Image exists', '={{ !$json.needsCreate }}');
  http('Read image', IMAGE_READ_QUERY, `{id:$json.fileId}`);
  code('Ready response', readyStep, `$input.first().json, $('Lookup decision').first().json`);
  add('Check native preview', 'httpRequest', 4.2, { method: 'HEAD', url: '={{ $json.source }}', authentication: 'none', options: { ...responseOptions, response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } } } }, { retryOnFail: false, onError: 'continueRegularOutput' });
  code('Preview verified', previewHeadStep, `$input.first().json, $('Lookup decision').first().json`);
  branch('Preview valid', '={{ !$json.httpStatus }}');
  http('Create image once', IMAGE_CREATE_MUTATION, `{files:[{originalSource:$json.source,filename:$json.filename,alt:$json.marker,contentType:'IMAGE',duplicateResolutionMode:'RAISE_ERROR'}]}`);
  code('Processing response', createStep, '$input.first().json');
  add('Respond', 'respondToWebhook', 1.5, { respondWith: 'json', responseBody: '={{ JSON.stringify($json.body) }}', options: { responseCode: '={{ $json.httpStatus }}', responseHeaders: { entries: [{ name: 'Cache-Control', value: 'no-store' }] } } });

  for (const [from, to, output] of [
    ['Webhook', 'Proxy input'], ['Proxy input', 'Input allowed'], ['Input allowed', 'Proxy HMAC', 0], ['Input allowed', 'Respond', 1],
    ['Proxy HMAC', 'Verified request'], ['Verified request', 'Signature valid'], ['Signature valid', config.admissionTableId ? 'Admission input' : 'Acquire shop token', 0], ['Signature valid', 'Respond', 1],
    ['Acquire shop token', 'Shop token valid'], ['Shop token valid', 'Shop authenticated'], ['Shop authenticated', 'Find image', 0], ['Shop authenticated', 'Respond', 1],
    ['Find image', 'Lookup decision'], ['Lookup decision', 'Lookup valid'], ['Lookup valid', 'Image exists', 0], ['Lookup valid', 'Respond', 1],
    ['Image exists', 'Read image', 0], ['Read image', 'Ready response'], ['Ready response', 'Respond'],
    ['Image exists', 'Check native preview', 1], ['Check native preview', 'Preview verified'], ['Preview verified', 'Preview valid'],
    ['Preview valid', 'Create image once', 0], ['Preview valid', 'Respond', 1], ['Create image once', 'Processing response'], ['Processing response', 'Respond'],
  ]) link(from, to, output);
  return { name: 'Heartside checkout image preparation - candidate', active: false, nodes, connections,
    settings: { executionOrder: 'v1', executionTimeout: 30, saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false, saveExecutionProgress: false } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw new Error('Usage: node n8n/build-checkout-image-workflow.mjs PRIVATE_CONFIG_PATH OUTPUT_PATH');
  const config = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  writeFileSync(process.argv[3], JSON.stringify(buildCheckoutImageWorkflow(config), null, 2) + '\n');
}
