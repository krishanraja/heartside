# Claude Code, 19 October (third session): Order QC signs in with client credentials

North Star part: launch readiness for "Heartside is the gift US dog owners reach for first". Every mug order gets a QC verdict before anyone confirms it in Teeinblue, and the check no longer depends on a hand-made token that someone has to create, store and rotate.

Nothing ran against Shopify in this session, and product data, prices, discounts, Printful settings and the theme are untouched.

## What changed

**`tools/qc/order_qc.py`**
- A new `access_token()` makes the client credentials grant: one POST to `https://bnf1em-ge.myshopify.com/admin/oauth/access_token` with `grant_type=client_credentials`, `client_id` and `client_secret`, form-encoded.
- The returned `access_token` is used as `X-Shopify-Access-Token` for the rest of the run, on Admin API `2026-07` (unchanged).
- Why in Python and not a shell step: the token then lives only in that one process's memory. A shell step would have to hand it to the next step through `$GITHUB_ENV`, which is a file on the runner, and the brief says never to write it to a file.
- **Masking:** on GitHub Actions the first thing printed after the exchange is `::add-mask::<token>`, before any other output. The runner swallows that line and hides the token from then on.
- **Logs:** the workflow no longer pipes the script through `tee`. The mask line must reach the runner's stdout, but `tee` would also have copied it into `qc-out/log.txt`, the artifact and the job summary. The script now writes its own `log.txt` with only the result lines.
- **Failure:** the run exits 2 with `::error::`. `qc-out/auth-error.txt` holds only "HTTP <status>: <Shopify's error and error_description>", or "could not reach Shopify (...)" when there is no reply. The client ID and secret are blanked out even if Shopify repeats them. Nothing else is checked or tagged on that run.
- Missing secrets: exit 1 before any call.

**`.github/workflows/order-qc.yml`**
- Reads `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`, and checks that both are set. `SHOPIFY_ORDERS_TOKEN` is gone.
- A Summary step runs whether the check passed or failed, and shows `log.txt`, so a failed sign-in shows its status and error text in the summary.
- **"Tell Krish the sign-in failed"** opens an issue assigned to krishanraja with the status and error text and the run link. It uses the same rule as the holds issue: scheduled runs and manual runs with dry run off. A dry run opens no issue (its own description says so), and the person running it sees the red run.
- Dry run is still the default, and the four cron lines are still commented out.

**`tools/qc/ORDER-QC-SETUP.md`** now describes the Dev Dashboard app, the two secrets, how a run signs in, what happens on failure, and the same try-then-switch-on steps. It says there is no `SHOPIFY_ORDERS_TOKEN`.

## Evidence

`python3 tools/qc/test_order_qc.py`: **all passed** (11 earlier checks plus 9 new ones, with a stand-in Shopify and no network). The new ones:

- one POST to the store's `/admin/oauth/access_token` with exactly `grant_type`, `client_id` and `client_secret`;
- the first printed line is `::add-mask::<token>`, and the token appears on no other line;
- no file the run writes (log, summary data, cards, reports) contains the token or the secret;
- the script writes its own `log.txt` for the summary;
- Admin API calls carry the token as `X-Shopify-Access-Token`, on `2026-07`;
- a refused exchange (HTTP 401, `invalid_client`) exits 2, and `auth-error.txt` reads "HTTP 401: invalid_client: ...";
- even when Shopify's error text repeats the client ID and secret, neither appears in the error file or the output;
- the failure shows as `::error::`;
- missing secrets stop the run before any call.

The workflow YAML parses. It has not run on GitHub yet: Krish's first manual dry run is the live test of the sign-in.

## Open

- Krish: merge the PR, then run Actions > Order QC with dry run ticked and read the summary. The summary is where a sign-in failure would show its status and error text.
- After a good dry run and one real run: switch the schedule on (Claude Code), then turn off the Claude task "Heartside order QC" (Krish).

## First dry run (after merge, 19 Oct)

Run 1 of Order QC (https://github.com/krishanraja/heartside/actions/runs/39222271157), from main at 34a56af, dry run:

- **Sign-in worked.** The client credentials exchange returned a token, the log shows only `***` for the client ID and secret, and Shopify accepted Admin API `2026-07`.
- **The order query failed:** `ACCESS_DENIED`, "Access denied for product field. Required access: `read_products` access scope." The query asked each line item for `product { handle }`, which needs `read_products`, and the app rightly has only `read_orders` and `write_orders`.

Fix (this PR):
- Mugs are found by the line item's own title, "The Morning Mug", which `read_orders` covers. The scope stays as it is.
- Any error after sign-in now writes a one-line `log.txt`, so it shows in the run summary instead of only a traceback. The token is replaced with `[token]` if it ever appears.
- New tests: the query has no product field, and a refused query fails with Shopify's error and no token.
- The corrected query was run read-only against the store and validated. The only untagged, unfulfilled order since 5 Oct is #1001 (Tiny Me, For The Tree, no mug), so a dry run should check nothing and pass.

## Second dry run: green

Run 2 (https://github.com/krishanraja/heartside/actions/runs/39222627566), from this PR's branch at 399dd88, dry run:

- Every step was green. Signed in, queried, and wrote the summary: "DRY RUN: nothing tagged. 0 checked, 0 held, 0 waiting for a print file, 1 without a mug." That matches the store: #1001 is the only untagged, unfulfilled order, and it has no mug.
- The log shows the client ID and secret only as `***`, and no token line. The artifact holds log.txt, summary.json and holds.json (506 bytes); the tests already show no file holds the token.
- Neither issue step ran: no holds, and the sign-in worked.

Still to do: merge this PR, so main runs the fixed query. Then one real run once a mug order exists, switch the schedule on (Claude Code), and turn off the Claude task "Heartside order QC" (Krish).

## On main, and switched on (Krish: "merge 21, and do the rest")

- PR #21 merged (f75f7f0).
- Dry run 3 from main (https://github.com/krishanraja/heartside/actions/runs/39223283688): green.
- Real run 4 from main, dry run off (https://github.com/krishanraja/heartside/actions/runs/39223346430): green. "0 checked, 0 held, 0 waiting for a print file, 1 without a mug." The holds step ran and said "No holds." Nothing was tagged, because no mug order exists yet.
- The schedule is switched on in this PR: 07:56 and 16:56 London time.
- **Still Krish's:** the Claude scheduled task "Heartside order QC" is not among the account's cloud scheduled tasks (checked with the scheduled-task listing), so it lives in the Cowork desktop app and can't be turned off from Claude Code. Turn it off there, so the two never tag the same order.
- The first real tag comes with the first Morning Mug order. Check that order for `qc-pass` or `qc-hold` and one note line.
