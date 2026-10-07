# Prompt for Claude Code: after the 5 October admin run

Paste everything below the line into a Claude Code session on `krishanraja/heartside`. The full log is in `docs/ADMIN-RUN-2026-10-04.md`, section 7.

---

You are working on the Heartside theme in `krishanraja/heartside` (Shopify store `bnf1em-ge`, heartside.io, US-only, launching 20 October 2026). A browser session did the admin and Teeinblue work today and tested the preview theme on an iPhone 13 emulation. Most of it passed. This prompt covers what is left for code.

The comedy is the product: deadpan HR language from the dog, sincere and never mean. Every claim on a product page has to be true of the product Printful makes, because a customer who gets something different from the page loses trust in the joke too. Same hard rules as before: never publish a theme, no edits in Shopify's code editor, no invented reviews, scarcity or dates, krish@heartside.io only, US spelling, no "not X, it's Y" lines.

## What the browser session changed (do not undo it)

- Teeinblue artwork 1329726 (The Annual Review): new `poster-background.png`; the "The remote" layer (open incident report) is now at y 3581 and "Squirrels" (known enemy) at y 4122. x, size and the area-for-improvement layer are unchanged. Make `design/poster-template/layers.json` match.
- Both poster campaigns were updated with Description unticked. A campaign update rewrites the Shopify product photos, so any future update means re-adding our own photos afterwards.
- Product photos from `design/mockups/` were uploaded with alt text to the poster, framed poster and pillow. Krish is moving them to position 1 himself.
- No theme editor settings were changed this run.

## What passed in the phone test (add any missing case to `tools/preview/shots.mjs`)

- Approve with no names returns to step 1 with "HR needs both names for the file." and shows the dog's name field.
- Homepage answers arrive in Teeinblue, including the three joke choices (Your phone, The couch, The cat selected correctly).
- Framed poster: one price ($89), one Add To Cart, the description starts "The same review, framed and ready to hang."
- Cart line for Red Oak: $89, all six answers present. Landing page behaves the same.
- Two-line answers on the printed poster clear the headings below them.

## 1. Fix: the framed poster's picker is labelled "color"

The three frames (Black, Red Oak, White) sit under a lowercase "color" label. The brief was "Frame". Teeinblue renders this picker itself, so check whether the label comes from the product option name or from Teeinblue's block. If the theme can relabel it, do that. If only the Shopify option name can change it, say so and Krish will change it in admin.

## 2. Copy that makes claims Printful's own pages don't support

Printful's product text says the framed poster has an Ayous wood frame, "hanging hardware included" and an acrylic front protector. It does not say the hardware is "already on".

- Framed description: change "with the hanging hardware already on" to "with hanging hardware included". Keep the wood frame. Add the acrylic front only if you want it; it is true.
- Pillow: Printful's text confirms a shape-retaining insert is included. It does not say the print runs on both sides. Keep "printed edge to edge" if the Teeinblue print area is the full front. Remove any "same photo on both sides" line until Krish confirms it in Printful. List it for him.
- Ornament: ceramic, 2.99 in across and the same design on both sides are all confirmed. No change.

## 3. The ornament photo (`design/mockups/ornament-tree-*`)

It was built from the spec and does not match what Teeinblue prints. Teeinblue's version has a double red ring and red ring text, the wording starts top right and runs clockwise, the photo is smaller with no outline, and the name is black Fraunces under the photo. Rebuild the ornament face and photo from Teeinblue's version, which is saved in this repo's session outputs as `teeinblue-ornament-preview.png` (Krish will attach it). Red matches the APPROVED stamp on the poster, so keep Teeinblue's look and fix the photo, not the artwork. Do not use the ornament photo as image 1 or on the homepage card until the rebuilt one is checked against a fresh Teeinblue preview.

## 4. Things to look at and report, not change on your own

- The homepage review builder has a button "+ Hear Biscuit read it out loud · 15s video · $12". Check that it sells something that exists and is fulfilled. If it doesn't, hide it and tell Krish.
- The countdown "Christmas morning in 80 days" is computed in the theme. It is fine as a countdown to 25 December. Confirm it makes no delivery promise.

## Needs Krish in the admin (not code)

1. Drag the new photos to the first position in Shopify (poster, framed 1 and 2, pillow).
2. Fix the ornament campaign's mockup in Teeinblue: the live preview is a blank ornament because the campaign mockup has no print area.
3. Publish "Heartside launch". After that, assign the product templates: `review` for both Annual Review products, `heartside` for the Body Double and Tiny Me.
4. Add the six email-authentication CNAMEs in Vercel DNS and click the sender verification email.
5. Connect the Facebook & Instagram channel, then paste the pixel ID into `shopify/pixels/hs2-funnel.js`.
6. Store address: Shopify's store address is locked to the business entity's country (UK). A US virtual address needs the entity country changed, which is a tax and markets decision.

Payments stay on Shopify Payments. Krish connected Stripe too; do not use it for checkout.

## Done when

- [ ] The frame picker reads "Frame", or you have said why it can't from the theme.
- [ ] Framed and pillow copy match Printful's own wording.
- [ ] The ornament photo is rebuilt from Teeinblue's version and checked against a fresh preview.
- [ ] `layers.json` carries y 3581 and 4122.
- [ ] A short report for Krish: what changed, any new copy to approve, and the voice-video question answered.
