# Claude Code: Heartside repository acceptance after the main merge

Copy the following assignment into a separate Claude Code session rooted in the Heartside repository. Run it against the exact current `main` revision. This is the repository companion to [`COWORK-LIVE-ACCEPTANCE.md`](COWORK-LIVE-ACCEPTANCE.md); CoWork owns independent customer and operational review in Shopify, Teeinblue and Printful.

## Assignment and authority

Independently audit the complete current Heartside repository, repair concrete repository defects, and provide a reproducible acceptance report bound to the exact main commit reviewed. Your purpose is to establish whether the code and deployment artifacts support a reliable personalized gift purchase. A passing fixture, merged PR or successful deployment does not prove the public store or supplier flow works.

Read the applicable AGENTS.md files, canonical operating contract and required skills, then `docs/NORTH_STAR.md`, `NOW.md`, `docs/SCOPE.md`, `docs/ECONOMICS.md`, `docs/SYNC.md` and `docs/HARNESS_CONTEXT.md`. `NOW.md` is the single current state/price/next-action source; `SCOPE.md` holds approved scope; live provider readback establishes dynamic truth. The old V2/V3, positioning, handoff, queue, economics and module guides are in `docs/history/` and cannot override current facts even when their original words say "current". The generated `HARNESS_CONTEXT.md` must match its owning ai-harness profile; do not hand-edit its publisher-owned region.

Expected release baseline to verify, not assume: five-color 11 oz illustrated mug at $45, word-free 50×60 sherpa blanket at $129, and 12×18 portrait at $59 unframed or $119 framed in black, white or red oak. Buddy is the host; the customer dog identity is independent. Ornament held, pillow conditional, book future. The October 26 owner ruling seeks maximum expected total net operating profit subject to a 30% all-attributable-costs net operating margin floor. Prior 50% figures and the old $29, $89 and $24 product prices are historical; $29 is now only the price of the Artist's touch add-on. The add-on and the automatic bundle (15% off two gifts, 20% off three or more, gifts only) have been live since 27 October. The core release was merged/published on 27 October; the owner has not yet placed or inspected the real paid blanket sample. The 28 October acceptance fixes (PR #65) are in source but not live until CoWork pushes the theme, publishes the two n8n workflows and applies the 28 October Teeinblue prompt spec, in the CoWork run the owner approved up front; the same theme push ships PR #64's cart fix, which is merged but not live. Until then, drift between source and the live store that these changes explain is expected and is not a parity defect.

## Documentation consistency is a release check

Audit every active first-read document in the root, `docs/`, `shopify/`, `n8n/`, `tools/qc/`, `design/`, `assets/` and `ornament/`. Confirm that each current entrypoint links to `NOW.md` and `docs/SCOPE.md`, contains no unqualified old host/product/price/margin/launch claim, and has working links to files after the history move. Check that `docs/` root contains only current `NORTH_STAR.md`, `SCOPE.md`, `ECONOMICS.md`, `SYNC.md` and publisher-owned `HARNESS_CONTEXT.md`; acceptance prompts live in `docs/review/`, dated material in `docs/history/`, `docs/archive/` or `docs/evidence/`. Keep old evidence intact and separated. Search stale strings across the **active** set, classify every hit, repair misleading active copy and report any generated-source conflict through its owner. A historical file's original assertion is not a contradiction once the path and entrypoint clearly mark it as dated evidence. Do not claim "no conflicts" from an unchecked grep or move alone.

You may inspect the repository and available authenticated GitHub evidence, run local offline checks, make focused code/documentation repairs, and open corrective PRs. Keep existing unrelated work intact. Do not merge your own corrective PR, deploy a theme, change Shopify products/settings/payments, publish or activate an n8n workflow, call paid AI, upload customer photos, submit an order, confirm supplier fulfillment, install apps, purchase anything, or contact vendors. Do not reuse historical approvals as authority for a new live action. No native desktop control. Ordinary investigation and reversible repository repairs do not require repeated questions; stop only for a genuinely consequential unresolved choice.

Keep credentials, cart tokens, private runtime configuration, customer addresses, names, photos, customization payloads and full order identifiers out of commits, reports, screenshots and logs. Use synthetic test data. Put private working evidence in an appropriate ignored scratch directory, never the profile root. Report missing access precisely and continue independent work.

## 1. Establish the actual release and audit baseline

1. Inspect `git status --short`, remote identity, branch, HEAD, upstream and recent history. Fetch without resetting or discarding local work. Find the actual release PR and merge commit from GitHub; do not assume a historical PR number or worker branch is current.
2. Confirm the requested release has merged and is reachable from current `origin/main`. Record the SHA under audit, PR URL, merge SHA, CI run URLs, timestamps and job conclusions. If merge is incomplete, record that precondition and audit the available candidate separately; do not label it post-merge acceptance.
3. Create an isolated corrective branch/worktree from the verified main SHA if changes are needed. Record the clean starting state. Review the release diff as well as the surrounding active code: this is not merely a changed-line review.
4. Inventory source, generated outputs, dependencies/lockfiles, scripts, workflows, theme files, n8n artifacts, QC and economics tools. There is not necessarily a root npm package or universal build command. Read scripts before executing them; distinguish local fixture tests from provider calls, workflow dispatches, uploads and production jobs.
5. Identify the accepted baseline, current product routes and release evidence. Historical evidence is context, not current proof. If the source changed after a live receipt, explicitly mark that receipt as applying to the earlier revision until reconciled.

## 2. Execute and document the repository checks

Use the checked-in lockfile for `tools/preview` dependencies (`npm ci` there when installation is needed, then `npx playwright install chromium` there, since `npm ci` does not download the Chromium that many of the Node tests and `chat.mjs` launch; CI runs it with `--with-deps`). Record Node, Python, dependency and browser-tool versions. Check compatibility with the Node version used by CI, rather than assuming a locally newer runtime proves CI compatibility. Install only the dependencies actually required by existing project instructions; do not upgrade the stack merely to make a test pass.

From the repository root, these are the existing offline test entry points to inspect and run. Discover newly added tests too. Capture command, working directory, exit code and counts. PowerShell example for the Node test files:

```powershell
$heartsideTests = @(Get-ChildItem tools/preview, tools/print-art -File -Filter '*.test.mjs' | ForEach-Object { $_.FullName })
node --test $heartsideTests
node tools/preview/render.mjs; node tools/preview/chat.mjs
node tools/preview/artwork-profile-test.mjs
node tools/preview/minify-check.mjs
node tools/preview/theme-check.mjs --baseline
node tools/preview/copy-lint.mjs --baseline tools/preview/copy-lint-baseline.json
node tools/print-art/build-browser.mjs --check
node tools/print-art/example-batch.mjs --check
node n8n/test-rules.mjs
node n8n/test-voice.mjs
node n8n/test-checkout-image.mjs
node n8n/test-checkout-image-workflow.mjs
python tools/print-art/test_build.py
python tools/print-art/test_generate.py
python tools/qc/test_order_qc.py
python tools/qc/test_mug_qc.py
python tools/economics/test_net_margin.py
python tools/print-art/example-assets.py --check
node n8n/build.mjs; git diff --exit-code -- n8n/
git diff --check
```

Run commands individually or in a runner that preserves every exit code; do not let the final success hide earlier failures. Inspect the current versions before execution: the voice tests and image-generation contract test use local fixtures/mocks, and must remain offline. Missing fixture files, optional fonts or Python packages are explicit gaps, not passes. Do not run the actual generation, voice-lab, supplier/order processing or production webhook scripts to resolve a fixture failure. Since 28 October the n8n rule tests exit 1 on any failed case; still treat any failure output as failure. `.github/workflows/offline-tests.yml` is the list of offline checks CI runs; any command it runs that is missing above is a gap in this brief. CI also runs `.github/workflows/harness-repository-context.yml` on every pull request and every push to main. It checks the managed context hashes and word budgets in `AGENTS.md` and `docs/HARNESS_CONTEXT.md`, the `@AGENTS.md` entry in `CLAUDE.md` and the closeout hook's hash. On a pull request it also runs `node .claude/hooks/harness-closeout.mjs --ci --base <base sha> --head <head sha>`. That check fails a pull request that changes anything besides `NOW.md`, `docs/history/` or `docs/HARNESS_CONTEXT.md` unless `NOW.md` also changes, its `as_of` is set to the date of the work and it carries exactly one dated North Star check line under "What is next and what is waiting on Krish". A corrective PR must pass both workflows.

Also validate relevant JS syntax, JSON/schema shape, Liquid references, CSS references, imported module paths and generated asset inclusion. Inspect all GitHub workflow checks and run the equivalent local commands where safe. For local rendered previews use `tools/preview`'s documented render/screenshots entry points after inspecting their inputs and destinations. A stub-rendered page is not the real Shopify page; report that boundary.

Theme Check runs against a partial Helio overlay with stub layout/config/locales. Preserve the full output. Compare identical commands on the accepted baseline and candidate, classify inherited missing-theme dependencies separately from introduced errors, and inspect those dependencies in a read-only complete-theme snapshot if available. Never report “lint passes” when it exits nonzero, nor suppress all offenses to make CI green. Record baseline, introduced and unresolved findings independently.

## 3. Review every active customer path in source

Build a source map from homepage/navigation through conversation, photo/art acceptance, native product templates, cart, hosted-checkout handoff and order/QC contracts. Verify event wiring and failure behavior, not just the existence of helper functions.

- Current core scope: 11oz illustrated mug with five offered colors; word-free 50×60 sherpa blanket; 12×18 portrait, unframed or framed in the approved finishes. Confirm the latest release packet against the USD baseline: $45 mug, $59 unframed portrait, $119 framed portrait and $129 blanket. The ornament is held; pillow is not automatically core; book is future scope. Do not reactivate excluded products.
- Check ordinary default routes for `your-dogs-illustrated-mug`, `your-dogs-personality-blanket`, and `your-dogs-portrait`; a working `?view=` preview is insufficient. Review JSON template assignments and storefront navigation handoff requirements.
- Buddy is the host; the customer's dog identity remains separate. Trace self-recipient `Me`/`Your first name`, other relationships, pronouns, back/forward/reload, state migration and safe field validation. Check shared personalization across products, supplied-only personality/location facts, selected style and note tone.
- Trace photo normalization/storage, actual-dog identity, crop/orientation, obscured-body limitations, source replacement, and explicit accepted-art binding. Changing photo/style must invalidate stale acceptance. Restored artwork must not trigger a hidden generation or reuse approval for a different input. No-photo/no-accepted-art paths must fail closed, including quick-add, search, sticky and accelerated affordances.
- Check request cancellation, duplicate clicks, stale asynchronous responses, disabled buttons, useful errors, retry limits, network loss and accessibility of validation/recovery. Review escaping, Unicode/apostrophes, maximum text/name lengths and layout overflow. Check source and served/minified behavior.
- Audit active references to old handles, example dogs, old prices, obsolete products, old artwork engines, unused templates and debug/test controls. Distinguish historical documentation and legitimate example galleries from executable stale code. Do not mass-delete history or replace every mention of an example dog.

## 4. Treat cart quantity and artwork integrity as release-critical

Read `shopify/assets/component-cart-items.js`, `hs-cart-quantity.js`, the cart Liquid, checkout-image integration and corresponding tests together. The current Function Studio Dynamic Merge representation can show one parent with multiple native components; parent quantity alone does not prove purchase quantity. Earlier direct child updates returned success without changing quantity. Do not reintroduce an optimistic success assumption.

Verify with meaningful fixtures and adversarial failure cases:

- Exact native variant, all customization attributes, source/design references, selected options and accepted artwork stay intact at one unit. Each design is one gift. Its plus is served disabled and inert, `component-cart-items.js` turns it off again after every redraw, and a raise is refused with "Each design is one gift, so it stays at one. Nothing was changed." A $129 blanket stays $129 before shipping and tax. Other cart lines remain identical. Lifting the cap is Krish's open decision.
- A replacement can change the component view key. Post-refresh verification must use the fresh key from verified readback or an equally exact identity match, not the removed key. The actual persisted quantity and rendered row must agree.
- The pending exact payload is saved before removal; unavailable storage prevents mutation. No raw cart token is persisted. Restore after refresh binds to the correct cart and preserves the existing design without AI.
- Definitive rejection and uncertain network outcomes differ. An unknown add result must not cause a blind retry or duplicate; read-only reconciliation must settle it before another mutation. Changed other lines, ambiguous components and unavailable variants fail safely. Recovery offers an understandable route to retry/restore or explicitly abandon the saved item only where the outcome is known.
- Checkout controls remain blocked during pending recovery, and own cart events do not race a second section refresh. Check cart page, drawer and accelerated checkout surfaces. Explicitly document that a client-side gate does not establish server enforcement against a separately opened checkout URL; do not claim stronger protection than exists.
- Checkout-image preparation is bound to the intended accepted design; stale catalog/example thumbnails cannot substitute for it. Price comes from authoritative merchandise/transform rules, not trusted client attributes. Tampered image/property/price inputs must not let a buyer alter another design or price.

Local mocks establish code behavior only. Hand CoWork the exact outstanding live checks for retained accepted artwork, fresh readback, hosted checkout and the existing final compatibility-order receipt. Do not create new artwork or orders to complete repository acceptance.

## 5. n8n, generated artifacts and security

Read builders and generated outputs together: `n8n/build.mjs`, shared guards/enforcers, typed/compose artifacts and prompts, checkout-image sources, builder/config/workflow and retention code. In an isolated worktree regenerate deterministic public artifacts and inspect the diff. Run `node n8n/build.mjs` from the directory its code expects after inspection. Check browser artwork generation with its `--check` mode. A clean generated diff is evidence; a manually edited generated file that the builder overwrites is a defect.

`n8n/build-checkout-image-workflow.mjs` takes a private configuration path and output path. Never copy real credentials or private runtime values into Git to regenerate it. Use synthetic fixture configuration or approved private scratch inputs, compare normalized structural/code hashes, and report deployment-specific fields separately. Never import or publish the generated workflow from this assignment.

Review input schemas, maximum sizes, HMAC/app-proxy verification and replay exposure, authorization boundaries, URL/host allowlists, redirects/SSRF, MIME and image decoding, rate limits, idempotency/concurrency, cache identity, pending/ready responses, retries, timeouts, retention and cleanup behavior. Origin checks alone are not authentication. Inspect error and execution-data handling for secrets/photos/customer-text leakage. Verify file-preparation app scope assumptions against documented contracts without adding scopes.

Check typed and compose prompt parity for self-recipient and supplied facts; timeout/fallback must preserve useful buyer input without invented claims. Check model/credential references for stale assumptions, but do not make paid calls. Generated workflow JSON is not proof of the active published n8n definition: request a sanitized read-only published-definition comparison from the release owner/CoWork and separate draft, published and executed states. Scheduled cleanup requires an observed run receipt, not just an enabled schedule.

Scan tracked files and relevant release history for accidentally committed secrets, private config, cart tokens and customer data, using an available established scanner plus targeted inspection. Never print discovered values. Report file/line, secret category and exposure scope; prepare removal/remediation guidance, but do not rotate credentials, rewrite history or disable integrations without separate authority. Review dependency vulnerabilities, unsafe workflow permissions, shell interpolation, untrusted event payloads and supply-chain pins. Do not treat a scanner's green result as a complete security review.

## 6. Economics, print and operational contracts

Audit current economics inputs and tests against the approved **30% modeled all-cost net operating margin floor**, not the superseded 50% rule. Verify variant/format-specific product and shipping costs, payment fees, app allocation, AI/retry assumptions, discounts, taxes treatment, returns/remakes and sensitivity. Identify estimates and missing actual costs; do not invent a supplier quote or change retail pricing unilaterally. Model correctness does not prove willingness to pay.

Review print geometry, dimensions, resolution, fit, bleed/safe areas, mug wrap/text layout, blanket word-free output and framed/unframed mappings against current manifests and native contracts. Inspect whether order QC still encodes an obsolete photo-cutout mug layout and could falsely pass/reject the new design. Test fixtures must represent the current artwork system. Automated image/QC checks cannot certify likeness, invented anatomy, print sharpness or physical sample quality; hand those visual/physical gates to the proper reviewer.

Review order-QC workflow permissions, dry-run/default behavior, idempotency, issue/tag actions and fulfillment assumptions. Do not execute its production schedule manually. Explicitly identify products not covered by automation and any manual hold that remains necessary.

## 7. Prove source-to-deployed parity without deploying

Obtain the release owner's final deployment packet or inspect existing read-only artifacts: exact main SHA, workflow run SHA/inputs, target theme identity/role, backup manifest and successful completion. Compare repository-owned source/assets/templates with a sanitized read-only snapshot of the actual candidate and public theme. Verify the final default product template routing and the assets the page really loads, not just files present in the theme.

Separate expected runtime settings from code drift. Public source may intentionally contain disabled flags or blank/private identifiers; pushing those defaults can break the live integration. Preserve and document the release owner's sanctioned runtime configuration rather than copying secrets into Git or overwriting it. A candidate theme is not the published theme, and a published theme with a different asset revision is not parity.

Inspect the guarded theme-push workflow: exact target identity, live-role guard, backup, editor-edit protection and `--nodelete`. Source deletion does not remove a remote file under `--nodelete`. Specifically require evidence that temporary `product.checkout-image-check.liquid` diagnostics and any other private QA surfaces were removed from the remote released theme as well as Git. Identify unexpected retained remote files; do not delete them yourself.

For n8n compare normalized source/code and active published revision, not exported credential IDs or unsanitized execution data. Record any unavailable snapshots as an explicit parity gap. CoWork verifies current payment restoration, market prices, supplier holds, public availability and actual checkout/order behavior; do not infer those from repository defaults.

## 8. Repair workflow and final acceptance report

For each defect, record severity, exact source location, user consequence, reproduction, expected/actual result and evidence. Fix verified defects on the corrective branch with the smallest coherent change. Add regression tests that expose the failure, run the original failing check and adjacent checks, regenerate affected artifacts and review the diff for unrelated changes. Do not weaken assertions or remove safety gates to make a suite pass.

Update `NOW.md` and relevant current documentation with the actual change and remaining acceptance gates. Commit only intended files, push the corrective branch and create a reviewable PR against current main. Its description must explain the final problem/behavior, validation and live follow-up; include no private payloads. Record commit/PR/CI evidence, wait for required checks, inspect failures and correct them. Do not merge or deploy. If no code correction is needed, provide the evidence-backed audit without manufacturing a PR.

Deliver one report containing:

1. Exact audited main SHA, release PR/merge identity, toolchain and audit time.
2. Check matrix with command/surface, result, count/exit code, evidence and limits. Separate PASS, FAIL and NOT VERIFIED; list inherited lint findings explicitly.
3. Prioritized findings, repaired findings and corrective PR/commit/check links.
4. Source/generated/runtime parity matrix, including intentional settings differences, default templates, published n8n and remote diagnostic cleanup.
5. Outstanding CoWork/release-owner checks, each with the concrete evidence needed to close it. Do not duplicate live work already proved for the same revision.
6. A bounded conclusion: repository acceptance passes or remains blocked, and why. State separately whether live acceptance and physical sample inspection remain outstanding. Never declare the entire store launch-ready solely from repository tests.

Continue autonomously through this finite audit and justified corrective work. Return only when the report and any corrective PR are concrete, or a genuine external blocker prevents further useful progress.
