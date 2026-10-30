# Claude CoWork: the live audit's follow-ups that need Shopify admin and Teeinblue

Status: ASSIGNMENT, not a result. Written 30 October 2026 for Krish to run in CoWork on his own computer, after the live conversion audit and its fix batches (#85, #86, #87) were merged to `main` and the new gallery pictures were attached to the three gift products. Work only from `main`. If `main` does not contain `tools/preview/gift-page-audit.test.mjs` and `now-notes/2026-10-30-gallery-mocks.md` (or the 30 October gallery entry folded into `NOW.md`), stop and tell Krish.

## Why this exists, in Krish's terms

The audit looked for anything that could cost even a sliver of conversion. The theme fixes are built and pushed to an unpublished copy; the gallery pictures are already live. What is left can only be done by a person in Shopify admin and in Teeinblue: publishing the theme, two Teeinblue fields that still talk about a chat that no longer exists, one handle conflict, and one script that loads where it is not needed. Every picture on the store is an Example and says so. Nothing here is a customer, an order, a review or a result, and you must never describe it as one.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027. This run moves it by putting the audit's fixes in front of buyers.

## Rules that hold for the whole run

- Change nothing you cannot verify afterwards. After every change, read it back from the system you changed.
- Record what you replaced: for every field, setting or theme you change, write where it was, what it said before and what it says now, with a screenshot, so Krish can put it back.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, a webhook address or Krish's personal email in the report or in any file you save to the repository. Use hello@krishraja.com where a contact is needed.
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only. The steps without a STOP are internal checks and may run straight on.
- Never use a real card, never confirm a Printful order, never message a customer.
- **Teeinblue Update: untick every sync box first.** Before any click on Update in Teeinblue, open the Update dropdown and untick every "Choose data to sync to Shopify" box. On 30 October an Update with the boxes ticked renamed the blanket's handle and set its title to "Heartside Personality Blanket - DRAFT 2026-10-23" and its price to the campaign's $89. After any Teeinblue save, read back the blanket on the storefront: title "Your Dog's Personality Blanket", price $129 (the values pinned in `tools/preview/catalog.mjs`), and run `node tools/preview/handle-check.mjs --warn-media`. If anything is wrong, stop and tell Krish.
- Do not touch product media. The gallery pictures were attached on 30 October (mug 13, portrait 14, blanket 10, every variant with its own picture); the handle check confirms them.

## Before you start

Pull `main` of `krishanraja/heartside` to a local folder. Read `NOW.md` (and any `now-notes/2026-10-30-*.md` still present) and `docs/SCOPE.md`. Run once: `cd tools/preview && npm ci && npx playwright install chromium`. Recheck every fact in its own system; later live readback beats this file.

## Steps

1. **Check the draft theme.** In Shopify admin, Online Store, Themes, find the unpublished theme "Heartside audit fixes draft" and note its id for your own commands only. If `git log` shows a change under `shopify/` on `main` after 30 October, push `main` to that theme first with the guarded push workflow (the name must match exactly). Then run `node tools/preview/live-gate.mjs --query "preview_theme_id=<id>"` and `node tools/preview/handle-check.mjs --theme <id> --warn-media`. Both must end all clear.
2. **STOP: publish the draft theme.** Show Krish both gate outputs and ask. After his yes, publish "Heartside audit fixes draft" in Shopify admin. The theme that is live now, "Heartside 28 Oct fixes", stays in the library as the rollback; do not delete it. Read back production at phone width (390 px) and desktop: HTTP 200; on each gift page the title and price show above the "Make one for my dog" button; the memo bar is on one line; the homepage shows the sets row first. Then run `node tools/preview/live-gate.mjs` and `node tools/preview/handle-check.mjs --warn-media` against production; both must end all clear. If either fails, publish "Heartside 28 Oct fixes" again and tell Krish.
3. **STOP: the note placeholder in Teeinblue.** In the mug campaign and the portrait campaign, the note field's placeholder still reads "Your words from the chat with Buddy" (or close to it). The chat is gone; the theme now covers this on the page, but Teeinblue's own text should match. Show Krish the two fields and ask. After yes, set each to `Your note, a line or two`, save, and follow the Update rule above (every box unticked, then the blanket read-back and the handle check). Read the placeholder back on the live gift page with the personaliser open.
4. **STOP: the portrait campaign's handle conflict.** Teeinblue reports that the portrait campaign cannot claim its clean handle because an unpublished draft product, "Your Dog's Portrait", holds `heartside-unframed-portrait-reference`. Read both products in Shopify admin and report: which is live, which is the draft, their handles and their status. Show Krish and ask. After yes, resolve it without touching the live portrait product: change the draft product's handle (for example to `portrait-reference-draft-2026-10`) or archive the draft, whichever Krish picks. Then in the portrait campaign set the personaliser's default artwork to Bear (the `scene-portrait-studio` Example) and Update, every box unticked. Read back: the live portrait's handle is still `your-dogs-portrait`, its title and prices unchanged, the blanket at $129, and the handle check all clear.
5. **STOP: the Teeinblue script on the homepage.** The homepage loads the Teeinblue personaliser script although nothing on it personalises; it costs load time on the first screen a buyer sees. In the theme editor, open App embeds, Teeinblue, and see whether its settings let it load only on product pages. Report what the settings offer. If they allow it, show Krish and ask; after yes, limit it to product pages, save, and read back: the homepage no longer requests the Teeinblue script, and each gift page's personaliser still opens and takes a photo. If the settings do not allow it, say so and change nothing.
6. **Report only: "The Morning Mug".** Teeinblue shows "Update required: 1" against the legacy campaign "The Morning Mug". Open it, read what the update would change, and report it with a screenshot. Press nothing on it. Its old product address already redirects to the illustrated mug.

## Krish's own steps, not CoWork's

The phone walkthroughs and the four-tone test from the showcase go-live prompt (`COWORK-SHOWCASE-GO-LIVE.md`, steps 11 to 13) stay with Krish. Do not run them.

## Report

Return: each step's result; every field and setting you changed, before and after, with screenshots; the gate and handle-check outputs before and after publishing; the blanket's title and price after every Teeinblue save; what the Teeinblue app embed's settings offer; what "The Morning Mug" update would change; anything you skipped and why. Say plainly which things are verified by readback and which are not.

Krish brings the report back to the Claude Code session, which judges it and fixes what it finds.
