# Order QC on GitHub Actions: setup

The order check (`.github/workflows/order-qc.yml`) signs in to Shopify as the Dev Dashboard app **Heartside order QC**, installed on bnf1em-ge.myshopify.com with only `read_orders` and `write_orders`. It uses the app's client credentials: there is no long-lived token to make, copy or store.

## How it signs in

At the start of every run, `tools/qc/order_qc.py` sends one request to `https://bnf1em-ge.myshopify.com/admin/oauth/access_token` with `grant_type=client_credentials` and the app's client ID and secret. Shopify answers with an access token that lasts about 24 hours. The run uses it for its order calls as `X-Shopify-Access-Token`, then forgets it.

- The token is masked in the run's log the moment it arrives. It is never printed, and never written to the log, the job summary, an issue or a file.
- If Shopify refuses, the run fails with Shopify's HTTP status and its error text only, with the client ID and secret blanked out even if Shopify repeats them. A scheduled run, or a manual run with dry run off, also opens a GitHub issue assigned to Krish.

## Setup (done by Krish, 19 Oct)

1. **Dev Dashboard app.** "Heartside order QC", with only `read_orders` and `write_orders`, installed on bnf1em-ge.myshopify.com.
2. **Two repository secrets** at https://github.com/krishanraja/heartside/settings/secrets/actions:
   - `SHOPIFY_CLIENT_ID`: the app's client ID.
   - `SHOPIFY_CLIENT_SECRET`: the app's client secret.

   Both go only into GitHub's secret fields, never into a chat, a document or a commit. If the secret is ever rotated in the Dev Dashboard, update `SHOPIFY_CLIENT_SECRET` the same day, or the next run fails to sign in.

There is no `SHOPIFY_ORDERS_TOKEN`, and the workflow no longer reads one.

## Try it, then switch it on

1. **Actions > Order QC > Run workflow**, with **dry run** ticked (the default). It signs in, checks the orders and shows the result in the run's summary, but tags nothing and opens no issue.
2. If the summary looks right, run it once more with dry run unticked. It tags the orders and writes the note lines.
3. Done 19 Oct: the schedule is on (07:56 and 16:56 London). Still Krish's: turn off the Claude scheduled task "Heartside order QC" in the Cowork app, so the two never tag the same order.

The Admin API version is `2026-07`. If a run fails on the version, Claude Code moves it.

## What it does on each run

At 07:56 and 16:56 London time it looks at unfulfilled orders from the last 14 days that have no `qc-pass` or `qc-hold` tag. For each Morning Mug on them it runs `tools/qc/mug_qc.py` on the print file (`_tib_design_link_1`) with that mug's Line 1 to Line 3 and Signed. Then it:

- checks the mug's color: the Printful variant Teeinblue will make (`_tib_fulfilled_sku`) must be the color the buyer chose (the Shopify variant). A mismatch is a hold;
- tags the order `qc-pass`, or `qc-hold` if any mug on it fails;
- adds one line to the order note;
- opens a GitHub issue assigned to Krish when anything is on hold (GitHub emails him and notifies the GitHub app), with the cards in the run's artifact.

Orders without a mug are left untagged. A mug whose print file isn't ready yet is tried again on the next run. It never confirms anything in Teeinblue or Printful: a person still does that, after reading the card.
