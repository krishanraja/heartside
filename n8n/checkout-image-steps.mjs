// Pure functions shared by generated n8n Code nodes and the local graph tests.
export function proxyGuard(input, config, now = Date.now()) {
  const reject = (code, httpStatus = 400) => ({ httpStatus, body: { state: 'error', code } });
  if (!config.enabled) return reject('image_preparation_disabled', 503);
  const query = input.query;
  const body = input.body;
  if (!query || !body || Array.isArray(body) || Object.keys(body).some(k => !['customizationId', 'variantId'].includes(k))) return reject('invalid_request');
  const known = ['signature', 'shop', 'path_prefix', 'timestamp', 'customizationId', 'variantId'];
  if (known.some(k => typeof query[k] !== 'string')) return reject('invalid_proxy_request', 403);
  if (!/^[0-9a-f]{64}$/.test(query.signature) || query.shop !== config.shop || query.path_prefix !== config.proxyPath) return reject('invalid_proxy_request', 403);
  if (!/^[0-9]{10}$/.test(query.timestamp) || Math.abs(now / 1000 - Number(query.timestamp)) > 300) return reject('expired_proxy_request', 403);
  if (body.customizationId !== query.customizationId || body.variantId !== query.variantId) return reject('signed_request_mismatch', 403);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(body.customizationId) || !config.allowedVariantIds.includes(body.variantId)) return reject('invalid_artwork_request');
  const pairs = [];
  for (const [key, value] of Object.entries(query)) {
    if (key === 'signature') continue;
    const values = Array.isArray(value) ? value : [value];
    if (!values.every(v => typeof v === 'string') || key.length > 200 || values.join(',').length > 2048) return reject('invalid_proxy_request', 403);
    pairs.push(key + '=' + values.join(','));
  }
  const customizationId = body.customizationId;
  return { request: { customizationId, variantId: body.variantId }, signature: query.signature,
    canonical: pairs.sort().join(''),
    filename: `heartside-checkout-${customizationId}.jpg`, marker: `Heartside checkout artwork ${customizationId}`,
    source: `https://cdn.teeinblue.com/customizations/${customizationId}.jpg`, config };
}

export function proxyVerified(context, computed) {
  const bad = { httpStatus: 403, body: { state: 'error', code: 'invalid_proxy_signature' } };
  if (!context.canonical || typeof computed !== 'string' || !/^[0-9a-f]{64}$/.test(computed)) return bad;
  // Fixed-length hexadecimal comparison; the secret itself never reaches Code.
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= computed.charCodeAt(i) ^ context.signature.charCodeAt(i);
  if (difference) return bad;
  const { signature, canonical, ...verified } = context;
  return verified;
}

export function lookupStep(response, context) {
  const bad = { httpStatus: 503, body: { state: 'error', code: 'image_lookup_failed' } };
  if (response.statusCode !== 200 || response.body?.errors?.length) return bad;
  const files = response.body?.data?.files;
  if (!Array.isArray(files?.nodes) || files.pageInfo?.hasNextPage || files.nodes.length > 1) return bad;
  if (!files.nodes.length) return { ...context, needsCreate: true };
  const file = files.nodes[0];
  if (file.alt !== context.marker || !/^gid:\/\/shopify\/MediaImage\/[0-9]+$/.test(file.id)) return bad;
  return { ...context, fileId: file.id, needsCreate: false };
}

export function tokenStep(response, context) {
  const body = response.body;
  const scopes = typeof body?.scope === 'string' ? body.scope.split(',').map(x => x.trim()).filter(Boolean) : [];
  if (response.statusCode !== 200 || typeof body?.access_token !== 'string' || !/^[A-Za-z0-9_-]{20,512}$/.test(body.access_token) ||
      !Number.isSafeInteger(body.expires_in) || body.expires_in < 60 || !scopes.includes('write_files') || !scopes.includes('write_app_proxy') ||
      scopes.some(s => !['read_files', 'write_files', 'read_app_proxy', 'write_app_proxy'].includes(s))) {
    return { httpStatus: 503, body: { state: 'error', code: 'shop_authentication_failed' } };
  }
  // Keep the transient token only in the managed HTTP node's runtime output.
  // No token, provider response, or credential is copied into this Code output.
  return context;
}

export function previewHeadStep(response, context) {
  const headers = response.headers || {};
  const mime = String(headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const length = Number(headers['content-length']);
  if (response.statusCode !== 200 || mime !== 'image/jpeg' || !Number.isSafeInteger(length) || length < 4 || length > 8 * 1024 * 1024) {
    return { httpStatus: 503, body: { state: 'error', code: 'preview_unavailable' } };
  }
  return { ...context, previewBytes: length };
}

export function createStep(response) {
  // A timed-out request may already have created the file. No mutation retry here;
  // the next frontend poll begins with the authoritative deterministic-name lookup.
  if (response.error || response.statusCode >= 500) return { httpStatus: 202, body: { state: 'pending', code: 'create_unconfirmed', retryAfterSeconds: 5 } };
  const result = response.body?.data?.fileCreate;
  if (response.statusCode !== 200 || response.body?.errors?.length || !Array.isArray(result?.userErrors)) return { httpStatus: 503, body: { state: 'error', code: 'image_creation_failed' } };
  if (result.userErrors.length && !result.userErrors.every(e => e.code === 'FILENAME_ALREADY_EXISTS')) return { httpStatus: 503, body: { state: 'error', code: 'image_creation_failed' } };
  if (!result.userErrors.length && result.files?.length !== 1) return { httpStatus: 503, body: { state: 'error', code: 'image_creation_failed' } };
  return { httpStatus: 202, body: { state: 'pending', code: 'image_processing', retryAfterSeconds: 3 } };
}

export function readyStep(response, context) {
  const bad = { httpStatus: 503, body: { state: 'error', code: 'image_readback_failed' } };
  const file = response.body?.data?.node;
  if (response.statusCode !== 200 || response.body?.errors?.length || !file || file.id !== context.fileId || file.alt !== context.marker || file.fileErrors?.length || file.fileStatus === 'FAILED') return bad;
  if (file.fileStatus !== 'READY') return { httpStatus: 202, body: { state: 'pending', code: 'image_processing', retryAfterSeconds: 3 } };
  if (!(file.image?.width > 0 && file.image?.height > 0)) return bad;
  // URL is not exposed by n8n 2.43.5's JS task runner. The server-validated
  // prefix and deterministic filename permit exact matching without a parser.
  const imageUrl = file.image.url;
  const expected = context.config.shopifyImagePrefix + context.filename;
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(expected) || (imageUrl !== expected && !/^\?v=[0-9]+$/.test(imageUrl.slice(expected.length)))) return bad;
  const { customizationId, variantId } = context.request;
  return { httpStatus: 200, body: { state: 'ready', customizationId, variantId, fileId: file.id, imageUrl,
    properties: { _hs_checkout_image: imageUrl, _hs_checkout_parent: 'true', _hs_checkout_bundle_id: customizationId + '-' + variantId } } };
}
