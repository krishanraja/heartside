# Claude CoWork: the portrait becomes artwork only (option A)

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. Work only from `main` of `krishanraja/heartside`. It follows CoWork's release report (31 October) and replaces step 3 of `COWORK-RELEASE.md` and all of `COWORK-PORTRAIT-LINK.md`, whose premise was wrong.

## Why this exists, in Krish's terms

On 31 October Krish chose option A for the portrait: the painting fills the whole 12 × 18 print. The cream "note paper" strip along the bottom sixth comes off the artwork, with everything on it:
- the paw;
- the note;
- "Love, " and the dog's name.

The note already reaches the recipient on the packing slip in every box and on the free digital card. The mug is already artwork only. Until this run, the live portrait still prints the note and signature.

The theme side is done. Painter instructions v17 (`tools/print-art/teeinblue/PROMPT-SPEC-2026-10-31-v17.md`) stop asking for a note area on the portrait. The saved painting prompt in Teeinblue does not change.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## What the release run found (read it before you start)

- **The live portrait's campaign** is **"Heartside City Screenprint - DRAFT 2026-10-23"**:
  - two products: Framed (3 variants) and Unframed (1);
  - tag `gifts-v3`.
- **"Your Dog's Portrait" is a different campaign.** It made an old draft product, and its Edit URL is `your-dogs-portrait`. That is why every Update of it failed with "Handle already in use". **Never Update "Your Dog's Portrait".**
- **Both campaigns share one artwork**, "Heartside City Screenprint - DRAFT v1". Editing that artwork changes what both campaigns hold. Only an Update of the live campaign reaches the store.

## Rules that hold for the whole run

- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- For every change, record before and after with a screenshot, so Krish can put it back. Teeinblue's artwork History is the rollback.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save. Use hello@krishraja.com where a contact is needed.
- No orders. Never place, pay for, confirm or cancel an order. Never touch Printful or n8n.
- **Teeinblue Update: untick every sync box first**, including all four Variants sub-boxes. The live campaign holds an old $39 price while the live portrait is $59 to $119, so never Update it with Variants or Price ticked.
- After any Teeinblue save:
  - read back the blanket on the storefront: title "Your Dog's Personality Blanket", price $129;
  - run `node tools/preview/handle-check.mjs --warn-media`.

  If anything is wrong, stop and tell Krish.

## Before you start

Pull `main`. Read `NOW.md` and this file. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

**Check the live theme carries painter v17.** Open `https://heartside.io/products/your-dogs-portrait`, find the script `hs-artwork-engine.js` in the page source, and confirm it contains `actual-dog-recipes-v17-artwork-only-portrait`. If it does not, stop and tell Krish. The Claude Code session pushes v17 to the live theme first, on his go.

## Steps

1. **Report the artwork's layers (no changes).** Open the artwork "Heartside City Screenprint - DRAFT v1". List every layer with:
   - its name and type (photo/AI, image, text, shape);
   - its position and size on the 3600 × 5400 print;
   - whether a buyer fills it.

   Mark which of these exist:
   - the Photo (AI painting) layer;
   - the cream note strip;
   - the paw;
   - the note text ("Your note");
   - the signature that prints "Love, " and the dog's name;
   - the "Dog's name" field;
   - any **City** layer.

   **Say exactly what the City layer does.** Does it print as words on the artwork, or does it only feed the painting? If it prints as words anywhere, stop at step 2 and ask Krish whether it stays.

2. **STOP: the new layout.** Show Krish the layer list and this plan, and ask:
   - the Photo (AI painting) layer is resized to fill the whole print, 3600 × 5400, from the top-left corner, so nothing is cropped or stretched;
   - these layers are deleted: the cream note strip, the paw, the note text, the signature, and the "Dog's name" field;
   - nothing else changes, and the AI painting prompt is not edited.

   After his yes, make exactly those changes and save the artwork. Screenshot the before and after canvas.

3. **STOP: Update the live campaign only.** Open **"Heartside City Screenprint - DRAFT 2026-10-23"**, never "Your Dog's Portrait". Show Krish the sync boxes, all unticked, then press Update with Clear cache on after his yes. Read back:
   - the live portrait's title, handle `your-dogs-portrait`, ACTIVE status, and prices ($119 framed, $59 unframed);
   - with the theme's `hs2.js` blocked, the portrait personaliser shows no note, signature or name field;
   - Bear is still the default picture, now filling the whole preview;
   - the blanket at $129, and `handle-check --warn-media` all clear.

   If Update fails, stop and report the exact message.

4. **Test painting (one Teeinblue credit; Design testing, no order, never added to a cart).**
   - Use the test photo `assets/photos/golden-puppy-asleep.jpg`, style Vintage screenprint, tone Warm. Let the theme compose the Style, Tone and Energy text, as a buyer's order would.
   - Report: does the painting fill the whole print? Is there any cream strip, empty patch or text? Is any object in it that nobody named?
   - Save the file as `portrait-artwork-only-test.jpg`.

5. **STOP, recommended: retire the second campaign.**
   - "Your Dog's Portrait" made only the old draft product, `portrait-reference-draft-2026-10`, and every Update of it fails.
   - Show Krish the campaign and ask. After his yes, archive or unpublish it in Teeinblue, whichever Teeinblue offers, without pressing Update.
   - Read back that the live campaign and the live portrait are unchanged.

6. **Final readback (no changes):** `node tools/preview/live-gate.mjs` all clear; `handle-check --warn-media` all clear; the portrait page at 390 px shows the painting with no strip in the preview.

## Report

Return:
- the layer list, before and after, with screenshots;
- the City layer's role;
- the Update result;
- the readbacks;
- the test painting;
- anything you skipped and why.

Say plainly which things are verified by readback and which are not.

Krish brings the report back to the Claude Code session. That session then checks the next portrait order's print file, and the note on its packing slip, when one comes in.
