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
- Unpublished campaign: `1053873`, Heartside City Screenprint - DRAFT 2026-10-23. Its store-instance list is empty.
- Isolated artwork: `1378371`, Heartside City Screenprint - DRAFT v1. Current verified artwork version: `3057472`. The live framed-print campaign still uses original artwork `1354014`.
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

## Next action

Run one native upload of the existing public-reference pug photo in the unpublished campaign. The controllable in-app browser exposes no file-input setter or file-chooser capability, and clicking Choose an image does not expose a controllable dialog. Krish must select that file. Then inspect the result, actual dimensions, timing, provider usage if available, likeness and exact final print. Keep live campaign publication, live theme deployment and physical sample behind their remaining gates. Sample order remains last.

Sources checked: n8n's official generated update/publish API schemas and Teeinblue's connected artwork schema; [Teeinblue AI effects, variables and upload limits](https://support.teeinblue.com/en/article/how-to-use-gen-ai-effect-feature-to-create-custom-image-effects-l8mqej/).
