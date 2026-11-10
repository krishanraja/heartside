# Claude CoWork: the buyer's painting on the order status page

Status: ASSIGNMENT, not a result. Issued 10 November 2026. Krish runs it in CoWork on his own computer and brings your report back to the Claude Code session.

**Krish's approval.** Krish approved building and installing this (10 November 2026: "Yes, build the order page extension"). Run it straight through. Stop and ask him only where a step says so.

## Why

On #1013's order status page in customer accounts, the mug line shows the example golden retriever. Shopify draws that picture from the product variant, and there is no setting to change it per order. The app in `shopify/apps/order-painting/` adds "Your painting" under each painted line. Read its `README.md` first.

## Before you start

- Pull branch `ccr-00dfb7a0-l0vbjn` of `krishanraja/heartside`, or `main` if Krish says it has merged.
- You need Node 20 or later.
- Never write a credential, the store's myshopify address or any customer detail into a file or report.

## Part 1: create and deploy the app

From `shopify/apps/order-painting/`:

1. Run `npm install`.
2. Run `npx shopify app config link`.
   - Sign in as Krish, in the same organization as the "Heartside n8n orders" app.
   - Choose **Create a new app** and name it "Heartside order painting".
   - This fills `client_id` in `shopify.app.toml`. Do not commit that change; report the app's name only.
3. Run `npx shopify app deploy` and confirm the release.
4. In the Dev Dashboard, set the app's distribution to custom, for the Heartside store only, and install it on the store. It asks for no scopes.

If the CLI asks for anything this prompt does not cover, stop and report the exact question.

## Part 2: check it on #1013

1. On Krish's phone or in a private window, sign in to customer accounts as Krish and open order #1013.
2. Under the mug line, "Your painting" must show the comic-book painting of his dog with the big stick.
3. Take a cropped screenshot of the line and the painting, showing no address or email.
4. If the painting does not appear:
   - check that the app is installed;
   - check that customer accounts, under Settings and then Checkout and accounts (Customize), does not list the extension as needing placement;
   - report what the page shows.
   Change no code. Claude Code will switch to the Customer Account API fallback described in the README.

## Part 3: nothing else changes

- Change no product, variant picture or email template.
- Rollback: uninstall the app from the store.

## Report

Write `docs/evidence/2026-11-10-order-painting/REPORT.md`, with one line for each part: done, blocked (with the reason), or not attempted. Include the app's name, the deployed version, and whether the painting showed.
