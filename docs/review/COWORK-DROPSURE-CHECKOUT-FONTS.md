# Claude CoWork: uninstall DropSure, and give the checkout the brand's fonts

Status: ASSIGNMENT, not a result. Written 2 November 2026 for Krish to run in CoWork on his own computer. Work only from `main` of `krishanraja/heartside`.

## Why this exists, in Krish's terms

1. **DropSure.** CoWork's final tidy (31 October) found "DropSure - Dropshipping & POD" still installed, with its own UK stock location, "Dropsure Fulfillment". Heartside doesn't use it. On 2 November Krish said: "yes uninstall DropSure".
2. **Checkout fonts.** On 2 November Krish chose a single font system for Heartside (option A):
   - **Fraunces** for headings and names;
   - **DM Sans** for everything people read or tap;
   - **Courier Prime** only for paperwork.

   His order confirmation page showed other fonts ("the fonts have changed again on this back to fonts that are off-brand"). The theme can't set checkout fonts, and the Claude Code session's Shopify access can't read or change checkout branding, so it is done here by hand.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Rules that hold for the whole run

- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- Take a screenshot before and after every change, so Krish can put it back.
- Never put a credential, the store handle, a theme id, an order number, a customer's details or Krish's personal email in the report or in any file you save.
- No orders. Never place, pay for, confirm or cancel an order. Never touch Teeinblue, Printful or n8n.

## Steps

1. **STOP: uninstall DropSure.**
   - In Shopify admin, go to Settings, then Apps.
   - Open "DropSure - Dropshipping & POD". Check that no live product (mug, blanket, portrait, card) uses its vendor or stocks at its location.
   - If the uninstall box warns about inventory at its locations, read the warning out to Krish and ask again before going on.
   - On his yes, uninstall it, with the reason "Not using app now".
   - **Read back:**
     - it no longer appears under Installed;
     - Settings, then Billing, shows no DropSure charge;
     - the four live products are still ACTIVE at their prices: mug $45, blanket $129, portrait $119 and $59, card $12.

2. **Report the checkout's fonts (no changes).**
   - Go to Settings, then Checkout, then Customize (the checkout editor), then the settings for Typography or Fonts.
   - Report the current heading and body fonts.
   - Report whether the font list offers **Fraunces** and **DM Sans** by name. If the editor also takes uploaded font files, say so.

3. **STOP: set the checkout fonts.** Show Krish the plan:
   - headings in Fraunces;
   - body in DM Sans.

   If Fraunces isn't offered, list the serif fonts that are, and let Krish choose. The files for upload, if the editor takes them, are `shopify/assets/hs-fraunces.woff2` and `shopify/assets/hs-dmsans.woff2` in the repo.

   On his yes, set them and press Save. Change nothing else: no colours, logo or layout.

   **Read back:**
   - a screenshot of the editor's preview: the information step and the Thank you page;
   - the fonts as the editor shows them after a reload.

4. **Final readback (no changes):** run `node tools/preview/live-gate.mjs` until it is all clear.

## Report

Return:
- each step's before and after, with screenshots;
- the fonts the editor offers;
- each readback;
- anything you skipped and why.

Say plainly which things are verified by readback and which are not.
