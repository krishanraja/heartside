# Order QC on GitHub Actions: Krish's one-time setup

The order check (`.github/workflows/order-qc.yml`) needs one Shopify token that can read and write orders and nothing else. Only Krish can make it. It takes about five minutes. Never paste the token into a chat, a document or a commit. It only goes into the GitHub secret in step 2.

## 1. Make the Shopify app (Shopify admin)

1. **Settings > Apps and sales channels > Develop apps.** If asked, allow custom app development.
2. **Create an app.** Name it `Heartside order QC`.
3. **Configuration > Admin API integration > Configure.** Tick only **`read_orders`** and **`write_orders`**. Save.
4. **API credentials > Install app**, then **Reveal token once** under Admin API access token. Copy it.

## 2. Add the secret (GitHub)

1. Open https://github.com/krishanraja/heartside/settings/secrets/actions.
2. **New repository secret.** Name: `SHOPIFY_ORDERS_TOKEN`. Value: the token from step 1. Save.

## 3. Try it, then switch it on

1. **Actions > Order QC > Run workflow**, with **dry run** ticked. It checks the orders and shows the result in the run's summary, but tags nothing.
2. If the summary looks right, run it once more with dry run unticked. It tags the orders and writes the note lines.
3. Ask Claude Code to switch the schedule on (it uncomments four lines in the workflow) and to turn off the Claude scheduled task "Heartside order QC", so the two never tag the same order.

## What it does on each run

At 07:56 and 16:56 London time it looks at unfulfilled orders from the last 14 days that have no `qc-pass` or `qc-hold` tag. For each Morning Mug on them it runs `tools/qc/mug_qc.py` on the print file (`_tib_design_link_1`) with that mug's Line 1 to Line 3 and Signed. Then it:

- tags the order `qc-pass`, or `qc-hold` if any mug on it fails;
- adds one line to the order note;
- opens a GitHub issue assigned to Krish when anything is on hold (GitHub emails him and notifies the GitHub app), with the cards in the run's artifact.

Orders without a mug are left untagged. A mug whose print file isn't ready yet is tried again on the next run. It never confirms anything in Teeinblue or Printful: a person still does that, after reading the card.
