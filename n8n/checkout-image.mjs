// Candidate service core. Importing this module performs no network operations.
// The runtime supplies its managed Shopify transport; no credential is accepted
// from the shopper, and creation must be explicitly enabled in server config.
export const IMAGE_FILES_QUERY = `query CheckoutImages($query: String!) {
  files(first: 10, query: $query) { nodes {
    id alt fileStatus fileErrors { code }
    ... on MediaImage { image { url width height } }
  } pageInfo { hasNextPage } }
}`;
export const IMAGE_CREATE_MUTATION = `mutation CheckoutImageCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) { files { id alt fileStatus } userErrors { code field } }
}`;
export const IMAGE_READ_QUERY = `query CheckoutImage($id: ID!) {
  node(id: $id) { ... on MediaImage {
    id alt fileStatus fileErrors { code } image { url width height }
  } }
}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const fail = code => { throw new Error(code); };
const check = (condition, code) => { if (!condition) fail(code); };

export function checkoutImageRequest(request, config) {
  check(request && Object.keys(request).every(k => ['customizationId', 'variantId'].includes(k)), 'invalid_request_fields');
  check(typeof request.customizationId === 'string' && UUID.test(request.customizationId), 'invalid_customization');
  check(typeof request.variantId === 'string' && config.allowedVariantIds.includes(request.variantId), 'unsupported_variant');
  check(/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/(?:[0-9]+\/){3}files\/$/.test(config.shopifyImagePrefix), 'invalid_shop_cdn');
  const id = request.customizationId;
  return { customizationId: id, variantId: request.variantId,
    filename: `heartside-checkout-${id}.jpg`,
    marker: `Heartside checkout artwork ${id}`,
    source: `https://cdn.teeinblue.com/customizations/${id}.jpg` };
}

// This cap is this endpoint's resource budget, not a claimed Teeinblue limit.
export async function verifyNativePreview(source, fetchImpl = globalThis.fetch) {
  check(/^https:\/\/cdn\.teeinblue\.com\/customizations\/[0-9a-f-]{36}\.jpg$/.test(source), 'invalid_preview_source');
  const response = await fetchImpl(source, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  check(response.ok && response.status === 200, 'preview_unavailable');
  check(response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'image/jpeg', 'preview_not_jpeg');
  const maxBytes = 8 * 1024 * 1024;
  check(Number(response.headers.get('content-length') || 0) <= maxBytes, 'preview_too_large');
  check(response.body && typeof response.body.getReader === 'function', 'preview_body_missing');
  const reader = response.body.getReader();
  let bytes = 0;
  const prefix = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      check(bytes <= maxBytes, 'preview_too_large');
      for (let i = 0; prefix.length < 3 && i < value.length; i++) prefix.push(value[i]);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  check(bytes >= 4 && prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255, 'preview_invalid_jpeg');
  return { source, bytes };
}

/**
 * adminGraphql is bound to ONE shop and a managed credential by the runtime.
 * verifyPreview is injected for tests only; production uses verifyNativePreview.
 * Returns pending without recreating/replacing images when processing is slow.
 * A request's native UUID is a vendor reference, not a buyer-authentication claim.
 */
export async function prepareCheckoutImage(request, config, dependencies) {
  const identity = checkoutImageRequest(request, config);
  const { adminGraphql, verifyPreview = verifyNativePreview } = dependencies;
  check(typeof adminGraphql === 'function', 'shopify_transport_required');
  const call = async (query, variables) => {
    const response = await adminGraphql(query, variables);
    check(response && !response.errors?.length && response.data, 'shopify_response_invalid');
    return response.data;
  };
  const lookup = async () => {
    const data = await call(IMAGE_FILES_QUERY, { query: `filename:${identity.filename}` });
    check(data.files && Array.isArray(data.files.nodes) && !data.files.pageInfo?.hasNextPage, 'file_lookup_ambiguous');
    check(data.files.nodes.length <= 1, 'file_lookup_ambiguous');
    const file = data.files.nodes[0];
    if (file) check(file.alt === identity.marker, 'file_identity_conflict');
    return file;
  };
  let file = await lookup();
  if (!file) {
    check(config.allowCreate === true, 'image_creation_disabled');
    await verifyPreview(identity.source);
    let created;
    try {
      created = await call(IMAGE_CREATE_MUTATION, { files: [{ originalSource: identity.source,
        filename: identity.filename, alt: identity.marker, contentType: 'IMAGE', duplicateResolutionMode: 'RAISE_ERROR' }] });
    } catch (error) {
      if (error.message === 'shopify_response_invalid') throw error;
      // Ambiguous create: reconcile once, never issue a second mutation here.
      file = await lookup();
      if (!file) return { state: 'pending', code: 'create_unconfirmed', retryAfterSeconds: 5 };
    }
    if (created) {
      check(created.fileCreate && Array.isArray(created.fileCreate.userErrors), 'create_response_invalid');
      const errors = created.fileCreate.userErrors;
      if (errors.length) {
        check(errors.every(e => e.code === 'FILENAME_ALREADY_EXISTS'), 'image_create_rejected');
        file = await lookup();
        if (!file) return { state: 'pending', code: 'duplicate_not_visible', retryAfterSeconds: 5 };
      } else {
        check(created.fileCreate.files?.length === 1, 'create_response_invalid');
        file = created.fileCreate.files[0];
      }
    }
  }
  check(file && /^gid:\/\/shopify\/MediaImage\/[0-9]+$/.test(file.id), 'invalid_image_file');
  // Independent authoritative readback also covers files reported READY on create.
  const expectedFileId = file.id;
  file = (await call(IMAGE_READ_QUERY, { id: expectedFileId })).node;
  check(file && file.id === expectedFileId && file.alt === identity.marker, 'file_identity_conflict');
  check(!file.fileErrors?.length && file.fileStatus !== 'FAILED', 'image_processing_failed');
  if (file.fileStatus !== 'READY') return { state: 'pending', code: 'image_processing', retryAfterSeconds: 3 };
  check(file.image?.width > 0 && file.image?.height > 0, 'ready_image_missing');
  const url = new URL(file.image.url);
  check(url.origin === 'https://cdn.shopify.com' && url.pathname === new URL(config.shopifyImagePrefix).pathname + identity.filename &&
    !url.hash && !url.username && !url.password && [...url.searchParams].every(([k, v]) => k === 'v' && /^[0-9]+$/.test(v)), 'image_url_mismatch');
  return { state: 'ready', customizationId: identity.customizationId, variantId: identity.variantId,
    fileId: file.id, imageUrl: url.href,
    properties: { _hs_checkout_image: url.href, _hs_checkout_parent: 'true',
      _hs_checkout_bundle_id: identity.customizationId + '-' + identity.variantId } };
}
