# Compose release and native artwork trial

Status: partial verification, not launch acceptance. Checked 23 October 2026.

## Approved compose release

Krish explicitly approved updating and publishing the existing compose workflow with PR #51's note-tone instructions and five-call session limit. No live Shopify theme deployment was authorized by that approval.

- Previous saved and active version: `6803df35-053d-4d04-9013-056dfb828fb5`.
- Saved and published version: `f67b2a25-aac8-48d9-8f61-586e00a25903`.
- Exactly two fields changed: Guard `jsCode` from `n8n/guard-compose.js`, and Gemini backup `options.systemMessage` from the compose entry in `n8n/prompts.json`. Claude already references that same prompt.
- All 14 nodes, connections, settings, credentials, webhook shape and error routes were preserved except those two fields. Static rate counters were omitted from the update and independently read back unchanged. No workflow was created or duplicated.
- The save used `publishIfActive=false`; readback showed the previous version still published. A separate publication of the exact saved version followed, and active-version nodes and connections matched the reviewed definition.
- Private rollback export: `C:\Users\krish\.scratch\heartside-compose-approved-before.json`. Restore its name, nodes, connections and settings through the workflow update endpoint, publish that returned version, then read back the active definition. Keep current rate counters rather than overwriting them with an old snapshot.

### Fresh unpublished-storefront test

A synthetic Milo/Alex six-step chat reached the reveal. The three tone requests reached Guard with their intended values and returned valid notes without rule flags. The browser displayed the returned words.

| Tone | Execution | Route | Server time | Observed example |
|---|---|---|---:|---|
| Warm | 47172 | Primary | 3,815 ms | On our walks I read every smell, and you let me finish. |
| Hilarious | 47173 | Backup | 9,837 ms | I preheat your side of the couch with great care. |
| Sentimental | 47174 | Primary | 5,323 ms | I keep the couch warm and my nose close to you. |

The hilarious setting is connected but the observed backup result is only mildly funny. Do not call final comedy quality accepted. The backup response also approaches the storefront's 11-second budget. This sample of three does not establish reliability or a latency percentile. The execution API did not expose a version ID in the inspected execution location; active-definition readback and Guard's actual tone input are the release evidence, not a fabricated execution-version link.

## Native Teeinblue trial

- The MCP resolved the existing Heartside Shopify store successfully.
- Isolated campaign: `1053873`, Heartside City Screenprint - DRAFT 2026-10-23. It now has a Shopify product, held in DRAFT. See the publication incident below.
- Isolated artwork: `1378371`, Heartside City Screenprint - DRAFT v1. Current verified artwork version: `3057612`. The live framed-print campaign still uses original artwork `1354014`.
- Canvas: 3600 x 5400, PNG sRGB. This is the output canvas, not proof of native AI source resolution or physical print quality.
- Photo layer: GPT image filter, layer-ratio option enabled, requested 3840 resolution, identity-preserving screenprint prompt, no second reference-image charge. The selected provider settings read back as gpt-image-2.5-sunburst / High. Auto fallback is enabled in the account; do not assume every future output came from that model without provider evidence.
- City uses a buyer-supplied value. The optional default is Somewhere quiet, explicitly mapped to an unidentified residential neighborhood. No address-derived city. The default is actually autofilled so a skipped city does not leave the AI variable empty.
- The print uses one small 44-character meaning line, an automatically populated Love signature, and a decorative generic paw. The approved visual target has a single small line, not the old certificate's four-line block. The old first three note layers remain form-only and non-customizable in this isolated draft. They do not print. The live product remains unchanged.
- Grouped layers keep the scene and note separate. The final note is rendered by Teeinblue, not generated as image text. The signature receives the dog's name once; there is no second signature input.
- Stored-artwork validation: zero errors, zero warnings. Form preview: four visible fields (optional city, photo, dog name, note); signature hidden and populated. These are native merchant preview fields, not an accepted Heartside customer UX. Existing chat-to-gift integration and one-field editing still need adaptation for this new draft before release.

### Render verification and correction

The first changed-copy proof failed because paragraph metadata did not match the new text. Converting the note and signature to single-line text layers fixed the actual failed case. The 44-character note and Bartholomew Jr signature rendered correctly, and the default proof also passed with the city default populated.

- Long-copy proof: `74a7602a-d5dd-415f-91ec-33d2796a4e9b`.
- Default proof: `9e93e9ac-03a5-461a-a8ae-5ffd5f61e734`.
- These proofs use the approved 1024 x 1536 concept as a placeholder. They prove layout and exact text, not customer-photo transformation, likeness, resolution or cost. MCP preview rendering does not run upload effects.

### Supplier readback

Teeinblue reports all three 12 x 18 variants available: Black and White have a stored base cost of $34.50; Red Oak $32.77; all sell for $89. This is current Teeinblue catalog data, not a fresh Printful route-specific stock guarantee or a delivered-margin calculation. Shipping, provider usage, fees, tax and remake allowance still apply.

## Native generation and storefront work, later on October 23

- Krish uploaded the prepared reference photo and reported generation complete. Saved placement and generated the native final print file, proof `bb1c2a98-2ef6-4616-9449-87f600005ea6`, printarea `1049669`. Downloaded PNG is 3600 x 5400, 30,531,565 bytes. The Teeinblue output canvas is verified; native AI source dimensions and actual provider cost are not.
- Visual result preserves the reference pug's general facial mask, ears, coloring and curled tail. This is an agent visual assessment, not an owner likeness acceptance or physical print test. The exact separate note and signature render correctly: "I'd choose you every time." and "Love, Milo".
- Output shows Seattle's Space Needle while the current form says San Francisco. Krish is unsure which city was selected at generation time. Treat this as unresolved input/output association, not a proven model failure. Aligned the option title to `City`, matching the prompt's `{{City}}`, to remove a documented mapping ambiguity. This change alone does not prove a fix. A controlled new generation must begin with a recorded city.
- Draft integration adds `product.city-art-preview.json`, opt-in only. The bridge fills the existing meaning line and dog name, supplies a generic optional city, and retains one-field editing. The note alone is carried into order metadata for this route.
- Native AI submission is deliberate, with an attempt marker saved before dispatch. Slow responses are not automatically retried at ten seconds. The marker survives refresh in the same browser session. A changed city needs a new explicit creation action. This is not an account-wide billing cap and does not control direct provider uploads.
- The draft template blocks cart submission until real provider completion, fallback behavior, exact saved source and output checks are accepted. Existing products keep their original flow. Local stand-in tests prove optional city, exact copy, one-field editing, one upload despite a slow response, duplicate-click and refresh protection, stale-city notice and cart blocking. They do not prove Teeinblue's live AI behavior.
- Existing mug/blanket and direct-arrival regressions pass across five screen sizes. JavaScript minification and theme checks pass.
- Commit `cef53a7` deployed only to the existing unpublished theme in run `39988093530`, with the live-theme override false. The private draft-product URL on the primary domain shows that theme and the new template. Teeinblue's personalization form does not populate on this draft-product preview, so real storefront bridge acceptance is still blocked; the local provider stand-in is not a substitute. The draft product remains unavailable for sale. The latest PR head has no GitHub check results yet; do not reuse the previous head's green checks.

### Publication incident and mitigation

The agent clicked Teeinblue's Launch control expecting a store-selection dialog. It published immediately and created Shopify product `16151384260990` at 16:24:30 UTC. This was an error, not an approved release. The agent promptly changed that exact product to DRAFT, then independently queried Shopify: DRAFT, no onlineStoreUrl, and no orders since 16:24:00 UTC. Removed its gifts-v3 tag and assigned the isolated city-art-preview template. Original framed campaign `1043167` still maps to artwork `1354014` and product `16132988535166`. The initial direct HTTP check was rate-limited. A subsequent in-app browser check displayed 404 Not Found and Page not found for the test product URL. The private Shopify product preview remains available. Do not click Launch or Update as exploratory navigation, and do not sync this campaign without checking whether the operation reactivates the Shopify product.

## Controlled San Francisco generation and native editor acceptance

- Krish confirmed that San Francisco remained selected throughout a second upload of the same reference photo. Saved the completed placement and generated final proof `1581b0e6-16d7-483b-80e5-606dcf77e029`, printarea `1049669`.
- Downloaded PNG: 3600 x 5400, 29,350,504 bytes, SHA256 `991291b8662d8b090ca13de28dce72cb568f82336f78e0c0453c3b489d2108a2`. The Golden Gate Bridge, fawn pug, exact "I'd choose you every time." note and "Love, Milo" signature are present. City matching passes this controlled case. This does not establish all-city reliability, exact individual likeness, native source dimensions or generation cost.
- The private `/products_preview` route still fails to populate Teeinblue. Shopify's unpublished theme editor, selecting the city-art-preview template and its DRAFT product, loads the actual provider form at the normal product path. No product activation or theme publication was needed.
- Native form acceptance: changed city to San Francisco, dog name to Milo and note to the exact approved line, with only one text field visible at a time. The summary retained San Francisco and Milo. Clicking Add To Cart was intercepted with the preview-only notice.
- The real mobile view exposed three defects: city/status sharing an overcrowded summary row; Red Oak and White hidden by the mug-specific swatch styling; direct-arrival field navigation remaining visible after closing editing. A scoped draft repair separates summary rows, uses labeled frame choices, closes completed direct-arrival editing and visibly disables preview ordering. Local regression includes these failures. Native post-deploy readback remains required.
- Evidence stays in private scratch: `heartside-sf-native-proof.png`, `heartside-sf-generation-saved.jpg`, `heartside-native-editor-desktop.jpg`, `heartside-native-editor-mobile.jpg`. No photo generation was triggered by the storefront test and no sample was ordered.

## Next action

Customer-form upload and saved-preview acceptance are complete for San Francisco. Finish native source resolution, provider cost, failure handling and the chat-to-artwork production handoff before release. The exact Buddy-only live AI updates are published and independently verified in 2026-10-23-buddy-live-ai-change.md. All product upgrades precede site mockup refresh, and the physical sample remains last.

Sources checked: n8n's official generated update/publish API schemas and Teeinblue's connected artwork schema; [Teeinblue AI effects, variables and upload limits](https://support.teeinblue.com/en/article/how-to-use-gen-ai-effect-feature-to-create-custom-image-effects-l8mqej/).

### Draft release readback

Commit 8bee656 deployed successfully only to the unpublished theme in run 39991340971. After reload, the native mobile form showed the separated summary, all three labeled finishes and disabled Preview only button. Red Oak and White each changed to their matching variant and frame mockup. San Francisco and Milo persisted. The closed editor no longer showed field navigation. Screenshot: heartside-native-editor-mobile-fixed.jpg. Product remains DRAFT. Existing mug/blanket regression passed five viewports; targeted native stand-in test, minification and theme checks passed. GitHub reports no PR checks for this head, so no CI acceptance is inferred. Next is the actual customer-form photo upload, which requires the native file picker.


## Customer generation and Buddy, final October 23 continuation

- Krish uploaded the same photo through the Shopify customer preview with San Francisco unchanged. The saved artwork shows the reference pug, Golden Gate Bridge and SF houses, with the exact small note and Love, Milo signature. Saved placement survived a reload.
- The generated image lives under the provider's image-placement layer, and its upload label says Change photo. The draft now recognizes that actual DOM shape and requires the uploaded thumbnail and artwork image to match. Placeholder and stale-city cases remain excluded. No model-success or print-ready claim is inferred from this UI state.
- Commit ae0808e deployed only to unpublished theme 198394249598 in run 39995750143. Actual mobile readback: waiting/sample overlay removed, redundant request card hidden, View artwork shown, San Francisco/Milo retained, ordering disabled. Screenshot: C:\Users\krish\.scratch\heartside-customer-sf-saved-verified.jpg.
- The accessible web derivative is 680 x 1024. Layout proof 6f630ad3-0902-461f-8537-29750f19bbf9 uses that same web derivative and exact text. It verifies composition, not native source detail or the final order print. No AI generation was triggered in this continuation.
- Buddy appears in the actual unpublished reveal and accessible gift choice. Screenshot: C:\Users\krish\.scratch\heartside-buddy-reveal-verified.jpg. Active theme source, current guidance and AI source were renamed. Growth draft PR #21 carries the matching guidance and validator change.
- Four active Shopify product descriptions now say Buddy, independently read back. The draft city product remains DRAFT with no public store URL. Three Teeinblue source descriptions containing the old host were changed by name only; a second dry-run readback returned unchanged for all three. The mug source still has generic supplier boilerplate and must not overwrite the approved store description during a future sync.
- Existing Teeinblue artwork form placeholders only were renamed: mug version 3058318, blanket 3058319, frame 3058320, ornament 3058321. Independent full-template comparison matches the prior templates with only Biscuit-to-Buddy substitution. The city draft placeholders were renamed in version 3058235. No campaign sync or publication was triggered.
- The approved compose tone change remains published. Both live AI host-name updates are prepared with complete backups, exact active-version checks and a six-field change record, awaiting the separately requested action-time approval.
- Local city bridge regression, minification and theme checks pass after the real provider selector/label corrections. Earlier Buddy chat, rules and voice checks passed. Latest theme head has no GitHub PR checks, so deployment success is not called PR CI acceptance. Growth PR #21 has a passing GitHub PR self-test; Windows baseline failures are documented separately.
- Krish explicitly queued better website mockups after all product upgrades, followed by the physical sample last. Saved in the workboard, both repository guidance and the authorized memory note.

Both prepared Buddy-only live AI updates were subsequently approved and published. See 2026-10-23-buddy-live-ai-change.md for exact active versions and verification. This supersedes the earlier pending-publication checkpoint above.
