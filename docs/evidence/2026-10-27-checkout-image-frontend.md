# Checkout image preparation frontend

Local implementation only, 27 October 2026. Base a507456. This advances the North Star by closing the reusable actual-design checkout integration gap; no sales change is inferred. Master owns NOW, deployment and launch integration.

The native Teeinblue cart transport now has an optional preparation step. It preserves the native variant, quantity, all existing properties and Shopify section parameters. It adds only `_hs_checkout_image`, `_hs_checkout_parent` and `_hs_checkout_bundle_id` after a ready response from the configured image registrar. Both native fetch and XHR requests wait; a failure sends no cart request and offers an Add to cart retry without suggesting another upload or generation.

## Configuration

The product section adds three settings: `checkout_image_enabled` (false by default), `checkout_image_endpoint` (blank), and `checkout_image_cdn_prefix` (blank). Existing templates are unchanged and the route remains off. Configure the secured app-proxy endpoint and exact own-store Shopify Files prefix only after backend verification. With the flag enabled, missing/invalid settings or a missing script block the cart request.

The endpoint must be an HTTPS URL on the current storefront origin under `/apps/`; relative proxy paths are supported. Requests use same-origin credentials to retain storefront password/customer session handling, with no cross-origin credential forwarding. It receives only `customizationId` and numeric-string `variantId`, in both URL query parameters and JSON. Shopify signs app-proxy query parameters; the backend must verify that signature/timestamp and compare both ID copies. No browser secret, preview URL, price or property bag is sent to the registrar.

Ready200 must echo both IDs and supply a MediaImage file ID, an image URL within the configured Shopify Files namespace (only optional numeric `v` query), and the exact three checkout properties. Bundle identity is customization ID plus hyphen plus variant ID. Pending202 accepts only a3- or5-second retry interval, with at most5 requests and a25-second overall deadline; an individual response including its JSON body has an8-second timeout. No ready response is cached in the browser.

The native artwork review/source, note, signature, owned metadata and selected variant are captured before preparation and compared afterwards. Changes, unchecked review, pending generation or an invalid native purchase state stop the cart. Duplicate transport attempts while waiting are refused. An aborted/reopened XHR cannot submit a late result.

## Verification

-39 focused and adjacent source/minified tests passed: contract validation, native-property preservation, same artwork/different product identity, pending bounds, timeout/invalid JSON/foreign namespace, disabled behavior, duplicate attempt, stale art/variant/note/review and XHR abort/error handling.
-4 headless Chromium fixture cases passed using actual fetch and XHR for source and minified code. A held registration produced no cart request; a temporary failure produced recovery text; retry produced exactly one cart request preserving all8 synthetic native properties. External routes were intercepted with synthetic responses; no real storefront, AI, upload, Shopify File or order was touched.
-Minification checks pass for the new helper and adjacent theme scripts.

These tests establish frontend mechanics and browser behavior against the agreed HTTP contract. They do not establish a deployed authenticated registrar, Shopify file persistence, actual Teeinblue runtime integration or live checkout outcome. Master must verify those after wiring. Rollback is leaving the section flag false or reverting this isolated commit before deployment; no external configuration was changed here.
