# Explicit note update: local implementation and verification

Target: Heartside checkout on `fix/photo-identity-and-funnel-truth`, parent commit `29f5e78`; local candidate only. No Shopify draft/live theme or workflow was deployed. Rollback is the parent versions of hs3.js and hs3.css. Actual image generation remains separate and unqualified.

QA contract: synthetic Pip/Alex, real hs3 JavaScript/CSS served from the working tree by `tools/preview/tone-fixture-server.mjs`, at `http://127.0.0.1:4318/tone`. Server binds loopback only and serves a synthetic writer. CSP forbids external connections. No photo upload, real provider invocation, purchase or fulfillment. Task writes are restricted to this disposable local fixture's session storage. Screenshots go to this chat's outputs directory.

Predeclared pass signals: (1) choosing tones sends zero writer requests until Update note; (2) explicit update sends once and preserves edits; (3) uncertainty/reload prevents another dispatch; (4) late replies only apply to matching inputs, with exact cached reuse; (5) phone 390x844 and desktop 1280x900 keep the control readable, keyboard operable and within the viewport. Check source/minified unit tests, existing adjacent regressions, CSS/JS/Liquid checks and rendered local UI. Local proof cannot certify provider billing, Shopify rendering or artwork quality. The reveal mockup gate remains required before any deploy.

Implementation: note selection is separate from update. A complete copy-request payload plus a version identifies the cached result; legacy tone-only cache is not trusted. Persist pending state before dispatch; storage failure prevents the call. A missing response remains uncertain across reload. In-page late replies can settle the matching request. User-edited lines remain authoritative. No automatic retry or refresh generation. Server-side request reconciliation/idempotency remains unverified; no client claim of universal duplicate-charge prevention.

Automated checkpoint: 26 tests pass, thirteen each against source and minified hs3, covering the above dispatch/state cases plus changed answers/recipient, invalid responses, exhausted budget, failed storage and adjacent typed-answer timeout behavior. Existing line/wrapping, factual-profile and minifier checks pass; the Liquid fixture renderer completes.

Rendered verification in Codex IAB, October 24, with source SHA-256 `778e6fb52eed194b8a77fe9454fd2f73cf8743177b6e576852b7ac5b8ab26108` read from the served fixture:

| Task | Observed result |
|---|---|
| Slider keyboard selection | Initial test reproduced focus loss on rerender. Repaired by keeping the slider mounted; repeated Home/End/arrow keys retain Note tone focus. Zero fixture requests during selection. |
| Double-click Update note | Exactly one local writer request; disabled while pending; resulting copy appears. |
| Edit then change tone | Exact synthetic manual text survives the second request and reload. Request counter remains two after reload. |
| Reload while pending | Existing words remain; status says update unconfirmed and another update is paused; button disabled; counter remains three. |
| Delayed stale reply and return | A 14-second fixture reply arrives after the 11-second deadline and after selection changes. It does not replace current words. Returning to the original tone and pressing Update reuses it; counter stays four. The tool's short wait limit missed the narrow timeout display, so that particular timed transition is proven by unit tests; reload uncertainty was inspected directly. |
| Phone 390x844 / desktop 1280x900 | No horizontal or vertical document overflow, 44px Update control, full control/status within viewport. Screenshots saved for phone, desktop and paused reload state. |

Two fixture-stats fetch errors occurred while the local server was deliberately restarted after the focus repair. They are fixture lifecycle errors, not provider or storefront failures. No product-script error was observed in the checked tab log. The browser fixture uses the existing mug renderer only to inspect this control; it is not a new website mockup or a product/artwork approval.

Remaining: shared six-style artwork UI/provider integration, server-side request receipts/reconciliation, actual billing, original source dimensions, Shopify preview parity and required reveal mockup gate. A reload cannot recover a lost server result without a supported reconciliation endpoint; this candidate preserves words and pauses requests rather than guessing. These limits block release acceptance, not the verified local note-control repair.
