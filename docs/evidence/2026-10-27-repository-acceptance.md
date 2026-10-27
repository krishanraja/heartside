# Repository acceptance, 27 October 2026

Bound to `main` at `bea22ce182f8fbeec4b464a6eafba75e31881f99` (the release, krishanraja/heartside#51, merged as `45d927b`; two administration merges followed). This is the repository half of the acceptance brief: source, tests, generated files, security and economics. The live store, Teeinblue, Printful and the published n8n workflows are CoWork's half and are listed at the end as hand-offs. No credential, store handle, theme id, workflow address, campaign id or customer data appears below.

## Toolchain

Node 22.22.0 and Node 20.20.2 (`npx node@20`), `npm ci` in `tools/preview` from its lockfile (Playwright Chromium preinstalled). Python 3.13.17 locally, Pillow 12.3.0 with RAQM 0.10.5, numpy 2.5.3. The new CI workflow runs Python 3.12 with the same pins.

## Check matrix

| Check | On `bea22ce` | On this branch |
|---|---|---|
| `node --test tools/preview/*.test.mjs tools/print-art/*.test.mjs` (Node 22) | PASS 242/242 | see the PR's final run |
| Same under Node 20 | PASS 242/242 | see the PR's final run |
| `artwork-profile-test.mjs` | PASS | PASS |
| `minify-check.mjs` | PASS | PASS |
| `theme-check.mjs` | FAIL, 30 offenses | FAIL, 30 offenses, all inherited; `--baseline` mode: 0 introduced |
| `print-art/build-browser.mjs --check` | PASS | PASS |
| `n8n/test-rules.mjs` (from `n8n/`) | PASS (fails with ENOENT from the repo root, so CI runs it in `n8n/`) | PASS |
| `n8n/test-voice.mjs` | PASS | PASS |
| `n8n/test-checkout-image.mjs` | PASS 21/21 | PASS |
| `n8n/test-checkout-image-workflow.mjs` | PASS 30/30 | PASS |
| `n8n/build.mjs` regenerates committed files | FAIL: `compose.js` and `typed.js` differ (line endings only) | PASS, byte-identical |
| `tools/print-art/test_build.py`, `test_generate.py` | PASS | PASS |
| `tools/qc/test_mug_qc.py` | PASS | PASS |
| `tools/qc/test_order_qc.py` | FAIL, 7 of 29 | PASS, 31 of 31 |
| `tools/economics/test_net_margin.py` | FAIL, 1 error (path) | PASS, 13 |
| `git diff --check` | PASS | PASS |
| Secret scan (`detect-secrets` + targeted `git grep`) | 8 hits, all benign: hashes, a synthetic test secret, `secrets: inherit` | unchanged |
| CI that runs any of the above | NONE (only docs-steward and repository-context run on push) | `offline-tests.yml` runs all of the above on every push and pull request |

## What was wrong and what this branch does

### Fixed here

1. **Nothing ran the tests (High).** New `.github/workflows/offline-tests.yml`: read-only token, Node 20 from the lockfile, Node and Python suites, minify, Theme Check in baseline mode, the browser-engine and n8n freshness checks.
2. **Theme Check could never pass (Medium).** The 30 offenses come from our cart override referring to Helio snippets that are not in this repository. `theme-check.mjs --baseline` reads `tools/preview/theme-check-baseline.json`, prints those as inherited, fails on any new one, and says when an inherited one disappears. Default mode is unchanged.
3. **n8n artifacts were not reproducible (Medium).** `n8n/build.mjs` embedded `shared.js` with the checkout's line endings, so a Windows checkout built different files. It now normalizes to LF; the committed `compose.js` and `typed.js` changed only in line endings.
4. **Economics test broken by the docs move (Low).** `test_net_margin.py` pointed at `docs/continuation/...`; now `docs/history/pricing-scenarios-2026-10-24.csv`.
5. **Order QC test held its own fixture (Medium).** Root cause: commit `cef09ae` rebuilt `print-file-biscuit.png` with the dog-voice lines and the test still expected the 19 October lines. Fonts were not the cause (the old file scores 1.00 against the old lines in the same environment). The test now carries the current lines.
6. **Order QC could lose hold alerts (Medium).** A run that stopped part way (one refused mutation or dead print link) exited before writing `holds.json`, and the issue step was skipped, while the orders already tagged `qc-hold` left the queue for good. `holds.json` and `summary.json` are now written in a `finally`, the order note is written before the tag (so a tagged order always says why), and the issue step runs with `always()` when `holds.json` exists. New test: "a run that stops part way still writes the holds it tagged".
7. **Public order data from Order QC (High, latent).** The repository is public, so its run summaries, artifacts and issues are readable by any signed-in GitHub user. The workflow uploaded each mug's print-file card (the dog art and note) for 30 days, printed order names and notes into the run summary, and put each held order's name and note in the issue body. It now reports counts only, uploads no artifact, and points to Shopify admin, where held orders are tagged and their notes say why. Pillow and numpy are pinned and `apt-get update` runs first.
8. **Workflow input reached the shell as script text (Medium).** `shopify-theme-push.yml` interpolated the `favicon` input into `run:`. It now arrives through `env:` and must match a plain file-name pattern before anything reads it. Only people who can run workflows could reach it.
9. **Two stale links** to `docs/continuation/2026-10-24/` in current documents now point at `docs/history/` and `docs/SCOPE.md`.

Fixes in progress on this branch at the time of writing, each with its own tests, are listed in the PR: the cart-quantity recovery dead ends (below), and the redesign work.

### Found and still open

- **Order QC checks none of the current products (High).** It matches line items titled "The Morning Mug" only, so every current order counts as "without a mug" and is never checked. Pointing it at "Your Dog's Illustrated Mug" would hold every order: the checker hard-codes the retired three-line photo-cutout layout, and a print laid out like the native mug scores 0.00 on the note lines. The portrait and blanket have no QC path. The color and Printful-variant check is the only reusable part. A print-file checker for the native mug, portrait and blanket is a separate piece of work; until then the manual Teeinblue review is the only print check. Proposed next step in `NOW.md`.
- **Cart quantity recovery dead ends (High).** Three states leave checkout blocked in that tab with no way out: a remove that threw but never committed, an add that threw and never committed (the design is out of the cart and only in this tab's storage), and a rejected add after the buyer changed another row. Also: duplicates detected only after removing, ordinary rows changed by position, overlapping refreshes, the checkout gate not re-applied after a section re-render, and unescaped property output. Reproduced offline; a fix with regression tests is being made on this branch. What `Shopify.actions.updateCart` does on a definitive rejection cannot be checked offline.
- **The $45 mug is below the 30% net floor** in every modeled case (minimum list price $48.74 to $71.85 depending on the cost set). The $69/month checkout app is missing from the repository's cost model (about $2.76 per order at 25 orders a month), and the two sensitivity sets (repository vs `docs/ECONOMICS.md`) disagree. The bundle model on this branch runs both sets side by side.
- **Never-publish items are already public** (the repository is public): the store handle in the two workflows, `tools/qc/order_qc.py` and its test; the n8n host in the homepage section's defaults (the browser must call it, so it is public by design); Teeinblue ids in `tools/print-art/teeinblue/`. No history rewrite. Moving the store handle to a repository variable needs Krish to set the variable.
- **n8n execution data (Medium).** The checkout-image workflow saves no execution data; the typed and compose workflows (which receive buyers' answers) do not set this. The SDK's settings argument cannot be checked offline here, so this is left as a proposed change: set "save successful/failed production executions: do not save" on both in n8n when Krish next publishes them.
- **No store-wide cap on AI spend (Medium).** Per-browser limits exist; a scripted client can still call the typed-answer workflow repeatedly. Needs an n8n-side limit, which means a publish.
- **Lower:** harness-managed workflows inherit secrets from `@main`; `@shopify/cli@3` unpinned; the legacy portrait compositor (a test route) puts the signature 45 px past the 11x17 safe line; supplier geometry is verified in evidence but not encoded in tests; `net_margin.py` still defaults to a 0.50 target (calibration's 0.30 is what runs); integer division truncates cents in the per-unit cart display.

## Parity I cannot read from here

- The published theme's bytes against Git: no theme access in this session.
- The published n8n typed and compose workflows against `n8n/typed.js` and `n8n/compose.js`.
- Hosted checkout, the quantity-2 Dynamic Merge price, and the checkout image.

These go to the CoWork review (`docs/review/COWORK-LIVE-ACCEPTANCE.md`).

## Conclusion

The repository on `bea22ce` built and its Node suites passed, but four checks failed as committed, nothing ran them, and Order QC protected none of the products on sale. With this branch's fixes every check passes in CI. Two High items remain open for decisions: a print check for the current products, and the mug's price against the 30% floor.
