# Claude CoWork: the last three tidy-ups after the closeout

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. Work only from `main` of `krishanraja/heartside`. It follows the closeout report (`docs/evidence/2026-10-31-closeout/REPORT.md`).

Krish approved all three steps in the Claude Code session on 31 October. Even so, **confirm with him in this chat immediately before each deletion or uninstall**, naming the exact target. A yes covers that one step only.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Rules that hold for the whole run

- Take a screenshot before and after every change.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's details or Krish's personal email in the report or in any file you save. Use hello@krishraja.com where a contact is needed.
- No orders. Never touch n8n or Printful.
- **Never press Update on any Teeinblue campaign in this run.** If something seems to need an Update, stop and ask Krish.
- Teeinblue re-ticks every sync box whenever the editor reloads. That doesn't matter here, because nothing gets updated, but don't click the Update button by mistake.

## Before you start

Pull `main`. Read `NOW.md`, the closeout report and this file. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

## Steps

1. **STOP: remove the archived "Your Dog's Portrait" campaign for good.**
   - In Teeinblue, open the archived campaign "Your Dog's Portrait". It made only the deleted draft product, and it still holds the address `your-dogs-portrait`.
   - Choose Delete campaign, then **Remove**, with **"Remove artworks & product bases" unticked**. The artwork "Heartside City Screenprint - DRAFT v1" is shared with the live campaign and must stay.
   - If the confirm box names anything other than that campaign, or offers to unlink or delete a Shopify product, cancel it and report the exact wording.
   - **Read back:**
     - the campaign no longer appears, archived or otherwise;
     - the artwork "Heartside City Screenprint - DRAFT v1" still exists;
     - the live portrait `/products/your-dogs-portrait` is still ACTIVE, at $119 ×3 and $59.

2. **The live campaign takes its own address.**
   - Open "Heartside City Screenprint - DRAFT 2026-10-23". Set its Edit URL (handle) to `your-dogs-portrait`, then **Save. Do not press Update.**
   - If Teeinblue refuses, report the exact message and stop this step.
   - **Read back:**
     - the Edit URL shows `your-dogs-portrait` after a page reload;
     - the live portrait's title is "Your Dog's Portrait", with handle `your-dogs-portrait`, ACTIVE, at $119 ×3 and $59;
     - the 301 from `heartside-city-screenprint-draft-2026-10-23` still reaches `/products/your-dogs-portrait`.

3. **STOP: uninstall two apps.** In Shopify admin, Settings, Apps:
   1. **Printify: Print on Demand.** No product uses it. Uninstall.
   2. **Dropshipper-ai.** Krish didn't set it up for Heartside. Uninstall.

   Before each one, check the app's page for any product or setting that still uses it. If you find one, stop and tell Krish.

   **Read back:**
   - neither app appears under Installed;
   - Settings, Billing shows no charge for either;
   - the live mug ($45, five colours), blanket ($129), portrait ($119 and $59) and card ($12) are all still ACTIVE.

4. **Final readback (no changes):**
   - `node tools/preview/live-gate.mjs` is all clear;
   - `node tools/preview/handle-check.mjs --warn-media` is all clear;
   - the portrait gallery still shows Bear in each frame, the set and the breed pictures. The rebuild from 31 October should be untouched.

## Report

Return:
- each step's before and after, with screenshots;
- the exact confirm-box wording from step 1;
- the Edit URL result;
- each readback;
- anything you skipped, and why.

Say plainly which things are verified by readback and which are not.
