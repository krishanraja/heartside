# Claude CoWork: take the painter upgrades and the new breed example artwork live

Status: ASSIGNMENT, not a result. Written 30 October 2026 for Krish to run in CoWork on his own computer, after the showcase pull request (breed examples, `feature/breed-examples-showcase`) is merged into the release branch and Krish has said the release branch may go to `main`. Work only from `main` after that merge. If `main` does not yet contain `shopify/sections/hs-showcase.liquid` and `design/examples-2026-10-30-showcase/site.json`, stop and tell Krish.

## Why this exists, in Krish's terms

Heartside sells a gift that sounds like the buyer's dog. Today the store still shows a pug and an old golden puppy as its examples, and Teeinblue still paints with the v11 prompt blocks. The new work shows six real breeds in six styles on the mug, the blanket and the portrait, and fixes the blanket ("dog centipede") and the tone pipeline. The feeling Krish wants a visitor to have: "that is my dog, on something I would give." Every picture is an Example and says so. Nothing here is a customer, an order, a review or a result, and you must never describe it as one.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027. This run moves it by making the first screen and the gift pages show the product at its best.

## Rules that hold for the whole run

- Work only from approved files. The approved set is the images in `shopify/assets/hs-ex-*.webp` and the full-size sources in the Drive folder `Heartside/00_Brand-Assets/02_Imagery/Product-Examples`. A full-size file may be used only if its SHA-256 equals `source_sha256` for that image id in `design/examples-2026-10-30-showcase/site.json`. If a hash differs or a file is missing, skip that image and report it. Do not use any other picture of a dog.
- Change nothing you cannot verify afterwards. After every change, read it back from the system you changed.
- Record what you replaced: for every Shopify media item, Teeinblue template or default image you remove or overwrite, write its type, where it was, and a screenshot or filename in the report, so Krish can put it back.
- Never put a credential, the store handle, the theme id, a Teeinblue campaign id, a Printful id, a webhook address or Krish's personal email in the report or in any file you save to the repository. Use hello@krishraja.com where a contact is needed.
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only. The steps without a STOP are internal checks and may run straight on.
- Never use a real card, never confirm a Printful order, never message a customer.

## Before you start

Pull `main` of `krishanraja/heartside` to a local folder. Read `NOW.md`, `docs/SCOPE.md`, `now-notes/2026-10-30-breed-showcase.md` and `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-03.md`. Run once: `cd tools/preview && npm ci && npx playwright install chromium`. Recheck every fact in its own system; later live readback beats this file.

## Part 1: the painter upgrades that are merged but not live

Teeinblue holds the v11 prompt blocks. Recipes v12, v13, v14 and v15 are merged with their specs. The latest, `PROMPT-SPEC-2026-11-03.md` (recipes `actual-dog-recipes-v15-directed-brief`), is the one to apply. The mug, portrait and card blocks are the v13 blocks; the blanket block is new in v15.

1. **The theme first.** The theme writes the latest field text (note area, tone direction, character and meaning), so it goes live before the blocks. Push `main`'s `shopify/` to an unpublished copy of the theme with the push workflow (the copy's name must match exactly). Run `node tools/preview/live-gate.mjs --query "preview_theme_id=<copy id>"` and `node tools/preview/handle-check.mjs --theme <copy id> --warn-media`. Both must pass. The only `warn` lines allowed are the ones the 28 October acceptance prompt names as expected.
2. **STOP: publish the theme.** Show Krish the gate results and ask for yes to push to the live theme. After his yes, push with the live-theme box ticked, and read the live homepage back: HTTP 200, the first screen shows Maple's mug (alt text begins "Example: Maple"), and the page below it shows the showcase section with 28 pictures, each with an Example tag.
3. **Apply the blocks.** In Teeinblue, for the mug, portrait and blanket campaigns, replace the saved prompt with the matching block in `PROMPT-SPEC-2026-11-03.md`, character for character. Compute the SHA-256 of what you pasted and compare it with the spec: mug `d760818e269faeec49aa4f0e636656aa00c9aaec03bfa98575ea0d9adc337bc5`, portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`, blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`. The card block (`1868aab7...`) has no campaign yet: do nothing for it. A hash that differs means you do not save. Record each campaign's previous block hash first.
4. **Handle checks, straight after every Teeinblue change.** Read back the three product handles in Shopify admin (`your-dogs-illustrated-mug`, `your-dogs-portrait`, `your-dogs-personality-blanket`) and run `node tools/preview/handle-check.mjs --warn-media`. Teeinblue renames handles when a campaign is saved; if one changed, restore it, then run the check again. Then run the storefront guard by hand from the Actions tab and read it back.

## Part 2: the artwork

Everything here changes what a buyer sees, so it is one STOP per product and one for the rest.

For each product, the media order is: **at home, studio, in hand, then the set shot**. The first picture a buyer meets sells the gift in a room; the studio picture shows the product plainly; the hand picture gives scale. Alt text on every item starts with "Example:" and uses the `alt` string in `site.json`. The theme draws its own Example tag on product photos, so do not edit the pictures themselves.

| Product | home | studio | in hand | set shot |
|---|---|---|---|---|
| Illustrated mug | `scene-mug-home` | `scene-mug-studio` | `flow-gift` | `set-golden` |
| Word-free sherpa blanket | `scene-blanket-home` | `scene-blanket-studio` | `scene-blanket-hand` | `set-lab` |
| Portrait | `scene-portrait-home` | `scene-portrait-studio` | `scene-portrait-hand` | `set-lab` |

Use the 1080 x 1350 full-size sources from Drive for Shopify media (the theme files are small web copies). Match them to the image ids through `source_sha256`.

5. **STOP, then mug.** Show Krish the mug's new media order as a screenshot of the admin list, and ask. After yes: remove the old pug and golden media from the mug, add the four above in order, set alt text, and read back the product page on production at phone width.
6. **STOP, then blanket.** Same for the blanket.
7. **STOP, then portrait.** Same for the portrait, framed and unframed variant pictures included. The variant pictures that were blank must still show a picture; the handle check's `warn` lines tell you.
8. **STOP, then Teeinblue and the personaliser.** In Teeinblue, for each campaign, set the template preview and the default artwork shown in the personaliser to the matching `studio` image (mug, blanket, portrait), so a buyer who has not uploaded a photo sees the new example and not Teeinblue's sample pug. Where the personaliser cannot take a custom default, say so and leave it.
9. **STOP, then collection and homepage.** Replace the collection images and any homepage or navigation image that still shows the old pug or the old golden puppy. Find them by searching Shopify admin (Files, Collections, Pages, Navigation menus, Theme editor) for those filenames and for the words "pug" and "Pickle". The theme's `hs-ex-*` pictures are already on the first screen and in the showcase.
10. **Anywhere else.** Search the live storefront, the Buddy chat, the cart, the checkout pictures and any email template for the old examples. Report each place. Change only the ones inside this task's scope; list the rest for Krish.

## Part 3: proof

11. One real-device walkthrough per product, recorded by Krish on his phone, from the first screen to the add-to-cart: mug, blanket, portrait. Pause about three seconds on the product's first picture and on the personaliser's default artwork. Write the clock time at each pause in your log.
12. One test personalisation per tone (Sentimental, Warm with a wink, Hilarious, Over the top) with a test photo of a dog and the fee-free test payment route the 28 October prompt describes, on the blanket and one other gift. Confirm that the painting reaches Teeinblue with the chosen tone, that the blanket shows eight to twelve separate figures and no overlapping poses, and that the file is inspectable. Pass requires all four. Restore Shopify Payments afterwards and cancel the test orders.
13. Look at collage and comic blankets first when you judge the scattered pattern: they tend to fill the frame.

## Report

Return: what changed (with the media list and order per product); what you replaced (with screenshots); hashes of the three saved blocks; the gate and handle-check output; each recording clock time; every place the old pug or golden examples still appear; anything you skipped and why. Say plainly which things are verified by readback and which are not.

Krish brings the report back to the Claude Code session, which judges it and fixes what it finds.
