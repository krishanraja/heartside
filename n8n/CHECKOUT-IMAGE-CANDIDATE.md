# Native checkout image preparation

Local executable service core and importable inactive n8n workflow; no workflow deployed or credential bound. This advances the personalized checkout flow while keeping the original native product, price and print fulfillment. It does not generate artwork or change product media.

## HTTP contract for the frontend adapter

POST JSON accepts only `{customizationId, variantId}` as strings. The server owns the supported variant list, Shopify account/transport, CDN prefix and `allowCreate` setting. A UUID is a native vendor reference, not proof of customer identity. Never accept a preview URL, price, file ID, properties bag, Shopify hostname or credential from the request.

On ready, HTTP200 with `Cache-Control:no-store`:

```json
{
  "state": "ready",
  "customizationId": "11111111-2222-4333-8444-555555555555",
  "variantId": "12345",
  "fileId": "gid://shopify/MediaImage/99",
  "imageUrl": "https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-11111111-2222-4333-8444-555555555555.jpg?v=123",
  "properties": {
    "_hs_checkout_image": "https://cdn.shopify.com/s/files/1/1111/2222/3333/files/heartside-checkout-11111111-2222-4333-8444-555555555555.jpg?v=123",
    "_hs_checkout_parent": "true",
    "_hs_checkout_bundle_id": "11111111-2222-4333-8444-555555555555-12345"
  }
}
```

The example UUID, variant and file ID are synthetic; the three-part CDN prefix is synthetic and matches the observed path structure. `fileId` is required. The numeric `v` query parameter is a normal Shopify version, not an image resize.

Pending is HTTP202 with `{state:'pending',code,retryAfterSeconds:3|5}` and no URL. Invalid input is400; transport/processing/permission failures are503 with a generic error code. Do not return provider exception text or credentials. Frontend merges the three properties into the native bag, preserving every existing native property. It must check echoed IDs before using the response. It must not retry native upload or generation.

## Core and idempotency

`prepareCheckoutImage(request, serverConfig, dependencies)` accepts a managed `adminGraphql(query,variables)` transport. It does not contain or retrieve a token. Its source fetch is always `https://cdn.teeinblue.com/customizations/<validated UUID>.jpg`, rejects redirects and non-JPEG responses, and caps the streamed response at8MiB/10seconds. These are endpoint resource budgets, not vendor limits.

File name and marker derive only from the UUID. Search before create; reject ambiguous results or mismatched markers. `fileCreate` uses `RAISE_ERROR`, never replace or append. Concurrent filename collision reconciles by reading the existing file. An ambiguous create timeout triggers one lookup, never a second mutation in the same call. The next request again searches before creating. Read back by file ID before returning READY. Processing files remain pending; failed files are not deleted, replaced or regenerated automatically.

This uses Shopify's supported external-URL import. The preview is checked first, then Shopify retrieves that same URL. This does not pin immutable source bytes across those two fetches. If native customization URLs can change after acceptance, introduce revision-aware staged upload before release rather than silently claiming byte identity. The native checkout UUID contract must be confirmed against the actual flow.

## Existing n8n runtime binding

Keep this separate from Buddy's model webhooks. `checkout-image.workflow.json` is generated from `build-checkout-image-workflow.mjs` and `checkout-image.config.json`. It is inactive, its embedded service switch is false, and no credential IDs or secrets are included. The generated Code nodes embed the pure functions from `checkout-image-steps.mjs`; they do not import local modules or access managed credentials. `test-checkout-image-workflow.mjs` executes the generated graph with synthetic HTTP/Crypto adapters, not a live n8n tenant.

Required sequence: input/variant guard; managed Crypto HMAC; signature verification; managed token acquisition; Files lookup; if absent fixed-source HEAD check; one fileCreate; independent file readback on the next frontend poll; ready/pending/error response. The workflow HEAD check requires JPEG and an advertised length below8MiB, and rejects redirects. Unlike the standalone core's streamed GET, it does not inspect JPEG magic or enforce the eventual download size; Shopify performs the actual import and must return a READY MediaImage with dimensions before success. Neither implementation pins source bytes across Shopify's later fetch.

All HTTP nodes have six-second timeouts, redirects and automatic retries disabled. Each endpoint call acquires one fresh token rather than persisting an expiring static token. Successful, failed, manual and progress execution storage is disabled. A transient token necessarily exists in the token HTTP node's runtime output and the subsequent request headers; no response or Code output copies it. Do not manually execute/view that node with production credentials or export execution data. Verify tenant error-workflow/logging policy before activation. The request limiter must also be verified on deployment; CORS alone is not access control. No user-photo enumeration/list endpoint is exposed.

The storefront POST must use same-origin `/apps/heartside-artwork`, with customizationId and variantId in both query and JSON body. Shopify signs the query, not the body. The guard canonicalizes all decoded query parameters, including repeated values, validates the shop/path/timestamp, and requires both ID copies to match. The default proposed proxy path is configuration, not an existing deployed route. The proxy authenticates Shopify's forwarding and the shop; it does not prove ownership of a guessed native UUID. [Shopify app-proxy authentication](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies).

There is no per-design Function Studio API call. The merge function is configured once, with merchant-owned zero discount and original variant selection. The service only supplies image and grouping metadata. A shared UUID can reuse one file across formats while grouping remains distinct by UUID plus variant.

## Minimum access and readback

The dedicated app needs read_files/write_files and write_app_proxy. No product/order/customer/fulfillment write scope is required, and no Function Studio write token is required per buyer. The token response must contain write_files and write_app_proxy, may contain read_files and the implied read_app_proxy, and fails closed for any other scope. Existing order-QC read_orders/write_orders authority is not reused. [Files](https://shopify.dev/docs/api/admin-graphql/latest/queries/files), [fileCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate).

Secure credential setup uses two managed references: (1) Crypto v2 credential, field hmacSecret = this dedicated Shopify app's client secret; (2) Custom Auth credential JSON with body.client_id and body.client_secret for the same app. Enter secrets directly in n8n Credentials, never in the configuration file, workflow nodes, chat or evidence. Custom Auth body injection is documented by [n8n](https://docs.n8n.io/integrations/builtin/credentials/httprequest/#using-custom-auth). The token node sends JSON grant_type=client_credentials to the fixed shop's `/admin/oauth/access_token`; Shopify's [official SDK implementation](https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-api/lib/auth/oauth/client-credentials.ts) confirms this JSON encoding. Tokens last24hours and can be reacquired; app and shop must belong to the same organization. [Shopify client credentials](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant).

Do not substitute generic OAuth2 and assume its Bearer header is accepted: Shopify documents X-Shopify-Access-Token. The built-in Shopify OAuth credential has the right header but currently hides its grant type and broad default scope. This workflow avoids both uncertainties using managed Custom Auth and a transient token header reference. Current public n8n source documents Crypto v2 credential support; the actual Cloud tenant must still show Crypto v2 and Custom Auth before binding. No custom node or additional host is required by the candidate.

Build/import procedure: copy checkout-image.config.json to a private configuration file; retain the private reviewed variant IDs, shop hostname and actual CDN prefix; the committed configuration uses synthetic fixtures; add cryptoCredentialId and shopifyCredentialId using metadata IDs only; set enabled=true only for the authorized runtime check; run `node n8n/build-checkout-image-workflow.mjs PRIVATE_CONFIG_PATH PRIVATE_OUTPUT_PATH`. Import the output inactive into the existing n8n Cloud tenant, bind/read back both credentials and the exact app-proxy path, then activate only under the parent's deployment authority. Never import over Buddy's typed/compose workflows. Rollback is disable the storefront flag and deactivate this separate workflow.

Schema fields were discovered via the Shopify connector. Its validation tool returned 'validation skipped', so there is no claimed runtime mutation validation. No fileCreate was executed. Before storefront enablement, use one already-generated preview under approved write authority to prove lookup/create/READY/reuse in the exact managed runtime, inspect one changed design and one same-ID different-variant request, and verify failed preparation leaves cart unchanged.

Tests: `node --test n8n/test-checkout-image.mjs n8n/test-checkout-image-workflow.mjs tools/checkout/function-studio-probe.test.mjs tools/checkout/transform-candidate.test.mjs`.

Read-only native preview check on27October succeeded against the accepted existing preview: JPEG172999bytes. No new generation, Shopify mutation or image edit.
