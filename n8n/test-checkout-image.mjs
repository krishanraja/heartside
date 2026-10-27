import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutImageRequest, prepareCheckoutImage, verifyNativePreview, IMAGE_FILES_QUERY, IMAGE_CREATE_MUTATION, IMAGE_READ_QUERY } from './checkout-image.mjs';

const uuid = '11111111-2222-4333-8444-555555555555';
const request = () => ({ customizationId: uuid, variantId: '12345' });
const config = () => ({ allowedVariantIds: ['12345', '12346'], shopifyImagePrefix: 'https://cdn.shopify.com/s/files/1/1111/2222/3333/files/', allowCreate: true });
test('accepts observed three-part CDN structure and rejects the old two-part fixture', () => {
  assert.doesNotThrow(() => checkoutImageRequest(request(), config()));
  assert.throws(() => checkoutImageRequest(request(), { ...config(), shopifyImagePrefix: 'https://cdn.shopify.com/s/files/1/1111/2222/files/' }), /invalid_shop_cdn/);
});
function fixture() {
  const identity = checkoutImageRequest(request(), config());
  const file = { id: 'gid://shopify/MediaImage/99', alt: identity.marker, fileStatus: 'READY', fileErrors: [], image: { width: 960, height: 960, url: config().shopifyImagePrefix + identity.filename + '?v=123' } };
  const calls = [];
  let existing;
  const dependencies = { verifyPreview: async source => { calls.push({ source }); }, adminGraphql: async (query, variables) => {
    calls.push({ query, variables });
    if (query === IMAGE_FILES_QUERY) return { data: { files: { nodes: existing ? [existing] : [], pageInfo: { hasNextPage: false } } } };
    if (query === IMAGE_CREATE_MUTATION) { existing = file; return { data: { fileCreate: { files: [file], userErrors: [] } } }; }
    if (query === IMAGE_READ_QUERY) return { data: { node: existing } };
    throw new Error('unexpected_query');
  } };
  return { file, calls, dependencies, setExisting: value => { existing = value; } };
}
test('creates only fixed native preview, reads back READY and returns merge-only properties', async () => {
  const f = fixture(); const result = await prepareCheckoutImage(request(), config(), f.dependencies);
  assert.equal(result.state, 'ready');
  assert.deepEqual(Object.keys(result.properties).sort(), ['_hs_checkout_bundle_id', '_hs_checkout_image', '_hs_checkout_parent']);
  const mutation = f.calls.find(x => x.query === IMAGE_CREATE_MUTATION);
  assert.equal(mutation.variables.files.length, 1);
  assert.equal(mutation.variables.files[0].duplicateResolutionMode, 'RAISE_ERROR');
  assert.equal(mutation.variables.files[0].originalSource, `https://cdn.teeinblue.com/customizations/${uuid}.jpg`);
  assert.equal(f.calls.at(-1).query, IMAGE_READ_QUERY);
});
test('repeated request reuses file without fetch or mutation', async () => {
  const f = fixture(); f.setExisting(f.file);
  await prepareCheckoutImage(request(), config(), f.dependencies);
  assert.deepEqual(f.calls.map(x => x.query), [IMAGE_FILES_QUERY, IMAGE_READ_QUERY]);
});
test('one preview reused across native variants receives distinct merge group IDs', async () => {
  const f = fixture(); f.setExisting(f.file);
  const one = await prepareCheckoutImage(request(), config(), f.dependencies);
  const two = await prepareCheckoutImage({ ...request(), variantId: '12346' }, config(), f.dependencies);
  assert.equal(one.fileId, two.fileId);
  assert.notEqual(one.properties._hs_checkout_bundle_id, two.properties._hs_checkout_bundle_id);
  assert.equal(one.customizationId, two.customizationId);
});
for (const [label, change] of [
  ['untrusted URL', x => { x.url = 'https://example.invalid'; }],
  ['untrusted price', x => { x.price = '0'; }],
  ['unsupported variant', x => { x.variantId = '999'; }],
  ['path traversal', x => { x.customizationId = '../other'; }],
]) test(`rejects ${label} before transport`, async () => {
  const f = fixture(); const input = request(); change(input);
  await assert.rejects(prepareCheckoutImage(input, config(), f.dependencies)); assert.equal(f.calls.length, 0);
});
test('creation disabled fails before source fetch or mutation', async () => {
  const f = fixture(); await assert.rejects(prepareCheckoutImage(request(), { ...config(), allowCreate: false }, f.dependencies), /disabled/);
  assert.equal(f.calls.length, 1);
});
test('processing returns pending and no URL, never recreates', async () => {
  const f = fixture(); f.file.fileStatus = 'PROCESSING'; f.setExisting(f.file);
  const result = await prepareCheckoutImage(request(), config(), f.dependencies);
  assert.equal(result.state, 'pending'); assert.ok(!result.imageUrl);
  assert.ok(!f.calls.some(x => x.query === IMAGE_CREATE_MUTATION));
});
for (const [label, change] of [
  ['failed image', f => { f.fileStatus = 'FAILED'; }],
  ['processing error', f => { f.fileErrors = [{ code: 'INVALID_IMAGE' }]; }],
  ['wrong binding', f => { f.alt = 'another artwork'; }],
  ['outside shop image', f => { f.image.url = 'https://cdn.shopify.com/s/files/1/1111/2222/9999/files/image.jpg'; }],
  ['resize parameter', f => { f.image.url += '&width=20'; }],
  ['ready without image', f => { f.image = null; }],
]) test(`rejects ${label}`, async () => {
  const f = fixture(); change(f.file); f.setExisting(f.file);
  await assert.rejects(prepareCheckoutImage(request(), config(), f.dependencies));
});
test('parallel duplicate response reconciles existing file, does not replace', async () => {
  const f = fixture(); const transport = f.dependencies.adminGraphql;
  f.dependencies.adminGraphql = async (q, v) => {
    if (q === IMAGE_CREATE_MUTATION) { f.setExisting(f.file); f.calls.push({ query: q, variables: v }); return { data: { fileCreate: { files: [], userErrors: [{ code: 'FILENAME_ALREADY_EXISTS' }] } } }; }
    return transport(q, v);
  };
  assert.equal((await prepareCheckoutImage(request(), config(), f.dependencies)).state, 'ready');
  assert.equal(f.calls.filter(x => x.query === IMAGE_CREATE_MUTATION).length, 1);
});
test('lost create response reconciles once; no blind second mutation', async () => {
  const f = fixture(); const transport = f.dependencies.adminGraphql;
  f.dependencies.adminGraphql = async (q, v) => {
    if (q === IMAGE_CREATE_MUTATION) { f.calls.push({ query: q }); throw new Error('timeout'); }
    return transport(q, v);
  };
  const result = await prepareCheckoutImage(request(), config(), f.dependencies);
  assert.equal(result.code, 'create_unconfirmed');
  assert.equal(f.calls.filter(x => x.query === IMAGE_CREATE_MUTATION).length, 1);
});
test('GraphQL200 errors fail, not a false pending or ready response', async () => {
  const f = fixture(); f.dependencies.adminGraphql = async () => ({ errors: [{ message: 'not authorized' }] });
  await assert.rejects(prepareCheckoutImage(request(), config(), f.dependencies), /shopify_response_invalid/);
});
function previewResponse(chunks, contentType = 'image/jpeg', contentLength = '') {
  let i = 0; let cancelled = false;
  return { ok: true, status: 200, headers: { get: name => name === 'content-type' ? contentType : contentLength },
    body: { getReader: () => ({ read: async () => i < chunks.length ? { value: chunks[i++], done: false } : { done: true }, cancel: async () => { cancelled = true; } }) }, isCancelled: () => cancelled };
}
test('native preview verification disables redirects and bounds bytes including absent length', async () => {
  const good = previewResponse([Uint8Array.from([255, 216]), Uint8Array.from([255, 1, 2])]);
  const result = await verifyNativePreview(`https://cdn.teeinblue.com/customizations/${uuid}.jpg`, async (url, options) => { assert.equal(options.redirect, 'error'); assert.ok(options.signal); return good; });
  assert.equal(result.bytes, 5);
  const large = previewResponse([new Uint8Array(8 * 1024 * 1024 + 1)]);
  await assert.rejects(verifyNativePreview(`https://cdn.teeinblue.com/customizations/${uuid}.jpg`, async () => large), /too_large/);
  assert.equal(large.isCancelled(), true);
});
test('HTML success and non-JPEG bytes cannot reach Shopify create', async () => {
  await assert.rejects(verifyNativePreview(`https://cdn.teeinblue.com/customizations/${uuid}.jpg`, async () => previewResponse([], 'text/html')), /not_jpeg/);
  await assert.rejects(verifyNativePreview(`https://cdn.teeinblue.com/customizations/${uuid}.jpg`, async () => previewResponse([Uint8Array.from([1, 2, 3, 4])])), /invalid_jpeg/);
});
