# Claude CoWork: close out the small things left after the artwork-only release

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. Work only from `main` of `krishanraja/heartside`. It follows the portrait report (`docs/evidence/2026-10-31-portrait-artwork-only/REPORT.md`) and Claude Code's review of it.

## Why this exists, in Krish's terms

The release is live. Krish asked to close out every small thing left. The Claude Code session made a recommendation on each and did what it could itself (listed at the end). This run does the rest, which needs Teeinblue, Printful or Shopify admin by hand.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## Rules that hold for the whole run

- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only. Several steps delete something; each deletion needs its own yes, right before it.
- For every change, record before and after with a screenshot, so Krish can put it back.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save. Use hello@krishraja.com where a contact is needed.
- No orders. Never place, pay for, confirm or cancel an order. Never touch n8n.
- **Teeinblue Update:**
  - untick every sync box first, including all four Variants sub-boxes and Price;
  - Update only "Heartside City Screenprint - DRAFT 2026-10-23", never "Your Dog's Portrait".
- **After any Teeinblue Update of the portrait campaign:**
  1. Check the live portrait's handle. If Teeinblue renamed it, set it back to `your-dogs-portrait`.
  2. Keep a 301 from the title handle (`heartside-city-screenprint-draft-2026-10-23`) to `/products/your-dogs-portrait`.
  3. Run `node tools/preview/handle-check.mjs --warn-media` until it is all clear.
- **After any Teeinblue save:** read back the blanket ("Your Dog's Personality Blanket", $129).

## Before you start

Pull `main`. Read `NOW.md`, the portrait report above and this file. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

## Steps

### Teeinblue

1. **STOP: retire the stray portrait campaign "Your Dog's Portrait".** Recommended.
   - It only made the hidden draft product `portrait-reference-draft-2026-10`, a DRAFT tagged not-for-sale that buyers can't see.
   - Its Edit URL claims `your-dogs-portrait`, which blocks the live campaign from owning that address.
   - Retiring it means "Unlink product from Shopify", **which deletes that draft product**, then "Mark as archive".

   Show Krish the campaign and the draft product, and ask. After his yes, do both. Read back:
   - the draft product is gone;
   - the live portrait is unchanged: handle, ACTIVE, $119 and $59;
   - handle-check is all clear.

2. **The live campaign keeps its own address.**
   - In "Heartside City Screenprint - DRAFT 2026-10-23", find the campaign's Edit URL (or handle) setting, and report what it says.
   - **STOP:** if it can be set, ask Krish, then set it to `your-dogs-portrait` and save without pressing Update. Future Updates then stop renaming the live product.
   - If Teeinblue refuses because the address is taken, report the exact message. The handle rule above still covers every Update.

3. **STOP: the portrait artwork, two small changes, then one Update.** Show Krish these, and ask:
   1. **The edge.** The Photo layer leaves a 7 px clear column on the left and right of the print file. Widen it slightly past the canvas on every side, to x −12, y −12, width 3624, height 5424, so the painting reaches every edge of an unframed print. Change nothing else on that layer, and don't edit its prompt.
   2. **City, recommended removal.** The "City" layer sits off the canvas, prints nothing and feeds no prompt; it only asks the buyer an optional question that does nothing. Delete it.

   After his yes:
   - make both changes and save the artwork;
   - Update the live campaign, every box unticked;
   - apply the portrait rule above.

   Read back:
   - the live personaliser has no City field (with `hs2.js` blocked);
   - Bear still fills the preview;
   - handle, ACTIVE and prices unchanged.

   Then make **one test design** (one Teeinblue credit; Design testing, no order). Use `assets/photos/golden-puppy-asleep.jpg`, Vintage screenprint, Warm with a wink. Report:
   - whether the print file has any clear or white column or row at any edge (check the four corners and edges at full size);
   - whether any text, strip or unnamed object appears.

4. **STOP: retire the legacy mug campaign "The Morning Mug".** Recommended.
   - It links to the ARCHIVED product `the-morning-mug` and still shows "Update required". One careless press would write old data onto that product.
   - "Unlink product from Shopify" **deletes that archived product**; then "Mark as archive". Never press its Update.

   Show Krish and ask. After his yes, do both. Read back:
   - `/products/the-morning-mug` returns 301 to `/products/your-dogs-illustrated-mug`. If not, create that redirect in Shopify admin, Navigation, URL redirects.
   - The live mug is unchanged: $45, five colours.

### Printful

5. **STOP: replace the Printful key that Teeinblue shows in plain text.** Recommended, because the key sits on a third-party screen that anyone with Teeinblue access can read. Krish does the token steps himself; CoWork guides and reads back. Do it when no order is waiting at Printful.
   1. Krish creates a new private token in Printful (developers.printful.com, Heartside's store), with the scopes Teeinblue's Printful connection needs. Teeinblue's help article names them; report which article you used.
   2. Krish pastes it into Teeinblue's Printful connection and saves. CoWork reads back that the connection shows Connected.
   3. Krish revokes the old key in Printful. Leave the token named "Heartside n8n note and confirm" alone; the order workflows use it.
   4. Read back: Teeinblue still Connected; Printful's API tokens list shows the old key gone and the n8n token present (names only).

6. **Delete the probe file.** In Printful's File library, delete the hidden file `heartside-card-probe.pdf` that the Claude Code session's render test added on 31 October. It is attached to nothing. Nothing else in the library changes.

### Shopify admin

7. **STOP: cancel the Spocket trial.** Krish didn't mean to keep it running. In Shopify admin, Settings, Apps, find Spocket and uninstall it, which ends its billing. Read back:
   - it no longer appears under installed apps;
   - Settings, Billing shows no Spocket subscription.
   - If Spocket also has its own account at spocket.co, tell Krish so he can close it.

8. **STOP: tidy the theme library.** Delete only these two unpublished themes:
   - "Heartside 31 Oct artwork only", stuck processing since 31 October;
   - "Heartside 31 Oct showcase draft", broken (a 2-byte settings file).

   Keep the live "Heartside 31 Oct showcase" and the previous live theme "Heartside audit fixes draft", which is the rollback. Read back the library and the live theme.

9. **Read only: the checkout warning.** In Settings, Checkout, report whether the warning "There were errors during checkout starting October 29, 2026" still shows, and its wording. Change nothing. The Claude Code session found that a personalised mug and blanket, the 15% bundle and the $12 card all reach the payment step with no error.

10. **Final readback (no changes):** `node tools/preview/live-gate.mjs` all clear; `handle-check --warn-media` all clear; the blanket at $129; the portrait at $119 and $59.

## Already done by the Claude Code session (31 October, no action needed)

- **Stray tags removed from the live gifts:** the mug's `not-for-sale` and `artwork-acceptance-draft`, and the blanket's `artwork-acceptance-draft`. Both stay in "All gifts".
- **Checkout:** a full checkout with a personalised mug, a personalised blanket and the $12 card, stopped before payment, showed the 15% bundle on the gifts only, the card at $12, free shipping and no warnings.
- **Printify:** no product depends on Printify, so its removal on 31 October breaks nothing. Leave it uninstalled.
- **Function Studio** (the checkout image transform, $69 a month): keep it through Christmas, as Krish ruled on 28 October. Two transforms run together cleanly in the checkout test.
- **`COWORK-PORTRAIT-LINK.md`** is marked superseded.

## Report

Return:
- each step's before and after, with screenshots;
- the Edit URL finding;
- the test design's edge check;
- each readback;
- anything you skipped and why.

Say plainly which things are verified by readback and which are not.
