# Native billing isolation checkpoint — 24 October 2026

Status: setup partly complete; six-style execution remains blocked. No source upload, generation action, new output, sample order or payment occurred. This receipt updates the existing queue; it does not create a second checklist.

## Freshness and frozen inputs

- Heartside began clean at `09228f5487aaaec701d1e73c9a22802878ff2122` on `fix/photo-identity-and-funnel-truth`; remote and open draft PR 51 matched. The separately verified successful unpublished deployment remains `989d23bf9788f075f27ac8dbf8ada2413367984a`, workflow 40098927875.
- Growth began clean at `f93d3cad6c8d895e92a02413ef527073ff3ad9e5`, branch `codex/buddy-host-20261023`, one commit ahead of its tracked remote. No growth changes were made.
- Authenticated Shopify readback confirmed the review theme UNPUBLISHED and both private products DRAFT with null public URLs. Editor Save was disabled; the mug reference still identified generation and ordering as paused. No theme save or deployment occurred.
- Native portrait/campaign, isolated mug and blanket versions matched the private handoff. One store is connected to the Teeinblue account. Sunburst/High remained selected; photo-effect resolution setting 3840 and use-layer-output-size remained unchanged. These settings do not prove actual provider output dimensions.
- Revision-2 plan SHA-256 `695e7c6a60dd68856d80cbd4687bc55f1734d4ff00d65b5417ced89948517715`; normalized source SHA-256 `2b19e44d9abdeac40112a1cbbb50cea31a4a913255ec232360b89f9cd2044370`; current native prompt SHA-256 `359fc96c1a64c6af182397b8f718e8a66ab60e16dbf924c83f7891f2082ce83b` all matched. The offline compiler returned six unique fingerprints and `executionReady=false`. Existing packet/results were not overwritten.
- Existing support thread still contained only the original sent message. The single Monday 26 October 09:00 Europe/London follow-up remains active; no message or automation was duplicated.

## Owner-approved setup and persisted readback

Krish explicitly approved an isolated OpenAI artwork-test project, a USD 1 hard API limit, an image-only credential for the existing Teeinblue route, and disabling account-wide native backup-model switching. This approval does not certify the USD 5 all-in boundary or authorize an overrun.

The isolated project was created once. After reload, its limits page showed **Limit enforced**, USD 0.00 / USD 1.00, and only `gpt-image-2.5-sunburst` allowed. All other current and future models are blocked. The shared project's controls were not changed.

Teeinblue's account-wide automatic backup-model switch was previously on. It was saved off in Gen AI Effects Service and verified off after reload. Sunburst/High remained selected. This account has one connected store.

The new credential form is prepared, not submitted: correct isolated project, Restricted permissions, only Images (`/v1/images`) Request, seven-day expiry. The user must create/copy the secret and enter/save it directly in the existing Teeinblue OpenAI connection. No new secret has been read, copied or stored by the agent. Native connection replacement is not yet verified.

Subsequent connection check: the owner reported Connected, but refreshing the isolated project's API-key inventory still returned zero results with All project keys selected. The retained creation form had not been submitted; it was dismissed before the refresh. Native settings reloaded with Sunburst/High and backup switching off. The connection report is recorded but attribution to the capped project is unverified; the owner was asked which project was selected for creation. No validation generation or upload was attempted.

## Billing evidence and limits

The existing dedicated integration filter still showed USD 0.37, three requests and 2,644 input tokens for 18–24 October. It remains historical usage, not a six-request quote. Relevant image receipts were not found in the shared project's Responses logs; unrelated request contents were not inspected.

The latest account credit invoice shows 8.88% sales tax. A USD 1 API subtotal would therefore be USD 1.0888 with that tax alone; this arithmetic is not an all-in ceiling. Any payment/FX charges and exact tax application to this run remain unverified. Shared prepaid auto-reload is enabled and was not modified; credit balance and reload are not spend caps.

[OpenAI spend-limit documentation](https://developers.openai.com/api/docs/guides/spend-limits) and the actual limit dialog warn that enforcement is not instantaneous and a small overshoot can occur. The USD 4 difference between the API cap and the approved all-in ceiling is a reserve, not proof of a quantified maximum overshoot.

[Teeinblue connection documentation](https://support.teeinblue.com/en/article/connecting-to-ai-model-services-cotusm/) says generation credits are billed by the provider. No additional Teeinblue image-credit fee was evidenced. Neither documentation nor the available settings established the native request's actual dimensions, image count or same-model retry behavior. Disabling backup-model switching does not prove retries are disabled.

## Remaining execution gate

Next action: complete the prepared secure credential handoff and verify the isolated native connection, then finish E2-B01/B06/B08 before any upload. Preserve the six-action maximum, one output per action, concurrency one and no retries/replacements. Do not increase the USD 1 cap without separate authorization. An unexplained connection failure or uncertain generation response stops execution.

There are still zero actual six-style results. Style quality, original-source lineage, native request cost and product/physical acceptance are not certified. The North Star remains unchanged; this checkpoint advances billing isolation only.
