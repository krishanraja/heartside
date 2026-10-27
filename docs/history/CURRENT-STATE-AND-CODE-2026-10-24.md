# Current implementation checkpoint

Latest resumption checkpoint: read `07-SESSION-HANDOFF.md` and repository `NOW.md` first when reconciling this older baseline. Six-style recipes/shared controls and approved tone routing are now implemented in the unpublished theme; the six actual generated outputs are still NOT RUN. The baseline table below is dated implementation history, not a direction to rebuild completed work. Exact latest native versions are in the private addendum.

Checkpoint evidence spans October 23 and 24, 2026. This is a handoff snapshot, not a new live acceptance run. Recheck any external state before mutation. Exact private identifiers are in the local-only operations companion.

## Repository and deployment

- Owning repository: `krishanraja/heartside`, public. Working checkout: `C:/Users/krish/dev/heartside/heartside`.
- Working branch: `fix/photo-identity-and-funnel-truth`. Code/research base before this pack: `c58ae43b67d57090e9037fd085354402aaefd8e8`. The final pack commit is recorded in the portable bundle's checkpoint metadata.
- [Draft PR 51](https://github.com/krishanraja/heartside/pull/51) is the ongoing draft branch, not approved for live release. PRs 49 and 50 are completed approvals, not tasks to repeat.
- Existing unpublished Shopify theme contains the acceptance templates. Theme deployment workflow has live-target, name and editor-edit guards and backups. Preserve them. A local branch head is not the deployed theme head.
- Live theme releases must use the exact approved main revision. Never deploy a stale branch over live changes. Reconcile current main and editor edits before release.
- Growth repository is `krishanraja/growth-heartside`. It consumes the product canon after approval/release; do not create ads from speculative product claims.

## What is implemented or observed

| Area | Established checkpoint | Remaining proof |
|---|---|---|
| AI note composition | Approved tone instructions and five-call session limit recorded published; Buddy rename in compose and typed-answer workflows recorded published/read back | New complete runtime path after any further changes |
| Portrait customer generation | Same-photo San Francisco case displayed the dog, Golden Gate Bridge and note/signature in the actual draft Shopify theme editor | Original generated source detail, final ordered print source, full six-style behavior |
| Portrait request handling | Saved/pending distinction, deliberate generation, stale request corrections and disabled ordering in acceptance route | Failure recovery on actual native service and all new shared states |
| Blanket native artwork | Word-free personality template, one selected 50 x 60 variant and artwork placement prepared; native schema/form checks passed | Live customer generation likeness, actual private Shopify binding and production source |
| Blanket factual input | Profile builder excludes breed stereotypes, unrelated fields and stale branch chips; preserves negations; fixtures passed | Native provider obeys those facts and preserves every repeated dog portrait |
| Mug | Existing product and print/reveal machinery; upgrade concept only | Final upgraded design, style/tone adapters and actual production proof |
| Ornament | Replacement supplier has separate front/back listed publicly | Exact configured provider/quote, connected mapping, readable final art and physical quality |
| Pillow | Existing 16 x 16 product base available in connected catalog | Bounded pilot artwork, economics, integration and sample |
| Shared six styles | Candidate board prepared | Production recipes, all identity/style/tone/format acceptance |
| Prices | Catalog costs and public shipping researched October 24 | Full net-margin inputs and calibrated prices; none certified at 50% |

## Two active external blockers

**Original image source.** Customer preview exposed a 680 x 1024 derivative. Portrait final canvas was 3600 x 5400. Blanket artwork was placed into a 15900 x 18900 canvas. None of those facts establishes native generated detail. Need a supported original export or authoritative answer establishing which source Teeinblue sends to production and how it scales it. Also verify failure, timeout and billable regeneration behavior.

**Private blanket binding.** The acceptance product is recorded Draft with null public URL after recovery. Teeinblue's existing-product selector requires Active; Active automatically restored an agentic channel publication even after Online Store was cleared. Unlisted did not enable selection. The connector rejected explicit unpublishing. Do not repeat status toggles or route around the rejection. Obtain a supported private connection route and verify publications, form presence and purchase blocking independently.

Support follow-up was scheduled for Monday October 26 at 9 AM Europe/London. Check the existing automation and email thread, send the authorized single follow-up only if unanswered, and add no duplicate schedule. Work on independent economics, product adapters and local tests while waiting.

## Code map

| Surface | Entry points | Intended use |
|---|---|---|
| Buyer chat/reveal | `shopify/sections/hs3-chat.liquid` | Shared profile, gift choice, tone/style UX; read current dependencies before editing |
| Personalization bridge | `shopify/assets/hs2.js`, `shopify/assets/hs2.css` | Native form bridge, state, layout and private acceptance behavior |
| Grounded personality | `shopify/assets/hs-artwork-profile.js` | Fact extraction and bounds, preserving negation and source answers |
| Portrait/blanket templates | `shopify/templates/product.city-art-preview.json`, `product.blanket-art-preview.json` | Existing isolated acceptance routes; do not create duplicate routes blindly |
| Native artwork snapshots | `tools/print-art/teeinblue/draft-artwork.json`, `draft-personality-blanket.json` | Read native definitions before writes; files are not proof of live parity |
| Blanket prompt | `tools/print-art/blanket-prompt.txt` | Identity and grounded pattern constraints |
| Deterministic print tools | `tools/print-art/` | Text compositing, source inspection and dry-run tools; manual upload route is fallback, not a second primary system |
| AI instructions/rules | `n8n/build.mjs`, `n8n/shared.js`, `n8n/compose.js`, `n8n/guard-compose.js`, `n8n/enforce-compose.js` | Inspect source of generated workflow code; edit generators rather than conflicting outputs |
| Browser/local fixtures | `tools/preview/` | Mechanics tests and rendered regression checks |
| Deployment | `.github/workflows/shopify-theme-push.yml` | Named theme target, backups, exact revision and live safeguards |
| Order QC | `.github/workflows/order-qc.yml`, `tools/qc/` | Existing human-review pipeline; tagging is not fulfillment acceptance |

## Checks known to exist

From `tools/preview/`, run applicable changes through `node artwork-profile-test.mjs`, `node city-art-bridge.mjs`, `node blanket-art-bridge.mjs` and `node minify-check.mjs`. Inspect script setup before running; some need fixture servers/rendered files. For reveal changes, `node mockup-gate.mjs` is required. Package dependencies live in `tools/preview/package.json`; there is no repository-root package.json.

From `n8n/`, `node build.mjs`, `node test-rules.mjs` and `node test-voice.mjs` are relevant to writer/rule changes. Building produces files; inspect their diff. Do not invoke paid provider labs or publish workflows as a side effect of local tests.

From the repository root, `python tools/print-art/test_build.py` and `python tools/print-art/test_generate.py` exercise the deterministic fallback tools. Their success does not prove the native Teeinblue source. Discover the actual theme-check command from current repository setup rather than inventing one.

After local checks, inspect the actual unpublished storefront/native provider path. After any deployment, verify the exact artifact consumed downstream, not only a green workflow. Save private photos/order evidence outside the public repository. Commit only redacted evidence and code.

## Continuation discipline

Before editing, inspect git status and preserve user work. Do not overwrite current native artwork from a stale JSON snapshot. Re-read target, validate full payload, write within scope, then read it back and compare intended/unchanged fields. Stop after two failed repair cycles on the same mechanism; diagnose the owning system rather than trying arbitrary alternatives.

At each checkpoint: update one queue row, evidence and NOW.md. State verified, inferred and blocked separately. A planned stage is not done. Never replace a failed economic or quality gate with a prose claim.
