# Claude CoWork: unlink the old draft from the portrait campaign, and retire The Morning Mug campaign

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer, after the audit follow-ups run (`docs/evidence/2026-10-31-cowork-audit-followups/REPORT.md`). Work only from `main`. If `main` does not contain that report, stop and tell Krish.

## Why this exists, in Krish's terms

Buyers already see Bear and the right note words on the portrait. But every Update of the portrait campaign in Teeinblue fails with "Handle 'your-dogs-portrait' already in use". Until that is fixed, no change to the portrait campaign (the note text, the next painter prompt) can reach the store. The likely cause is that the campaign is linked to two Shopify products: the live portrait, and an old draft made on 27 October for an unframed test. Separately, the legacy campaign "The Morning Mug" waits with "Update required", and one careless press would write its old data onto an archived product.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027. This run keeps the portrait campaign changeable, so the painter can keep improving.

## Rules that hold for the whole run

- Change nothing you cannot verify afterwards. After every change, read it back from the system you changed.
- Record what you replaced: for every link, setting or status you change, write what it was and what it is now, with a screenshot, so Krish can put it back.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, a webhook address or Krish's personal email in the report or in any file you save to the repository. Use hello@krishraja.com where a contact is needed.
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- Never use a real card, never confirm a Printful order, never message a customer.
- **Teeinblue Update: untick every sync box first**, including all four Variants sub-boxes. After any Teeinblue save, read back the blanket on the storefront (title "Your Dog's Personality Blanket", price $129) and run `node tools/preview/handle-check.mjs --warn-media`. If anything is wrong, stop and tell Krish.
- The portrait campaign holds a $39 price while the live product is $59 to $119: never Update it with Variants or Price ticked.
- Do not touch product media or the theme.

## Before you start

Pull `main` of `krishanraja/heartside`. Read `NOW.md` and the 31 October report above. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

## Steps

1. **Report: what the portrait campaign is linked to.** In Teeinblue, open the portrait campaign ("Heartside City Screenprint - DRAFT 2026-10-23"). List every Shopify product and variant it is linked to, with each product's title, handle and status as Shopify admin shows them. The live product is "Your Dog's Portrait" at `your-dogs-portrait`, ACTIVE, four variants. The old draft is "Your Dog's Portrait" at `portrait-reference-draft-2026-10`, DRAFT, tagged not-for-sale. If the campaign is linked only to the live product, stop and tell Krish what you found.
2. **STOP: unlink the old draft.** Show Krish the list and ask. After his yes, remove the link between the campaign and the draft product only, so the live product and its four variants stay linked. If Teeinblue offers no way to unlink one product, say so and change nothing. Then press Update with every sync box unticked. Read back:
   - the Update succeeds;
   - the live portrait's title, handle `your-dogs-portrait`, ACTIVE status and prices ($119 framed, $59 unframed) are unchanged;
   - with the theme's `hs2.js` blocked, the portrait personaliser shows the placeholder "Your note, a line or two";
   - the personaliser's default picture is still Bear;
   - the blanket at $129, and `handle-check --warn-media` all clear.
   If the Update still fails, stop and report the exact message.
3. **STOP: retire The Morning Mug campaign.** It links to the archived product `/products/the-morning-mug`. Show Krish the campaign and ask. After his yes, archive or unpublish the campaign in Teeinblue (whichever Teeinblue offers) without pressing its Update. Read back that the campaign no longer appears under "Update required", that `/products/the-morning-mug` still redirects to the illustrated mug, and that the live mug page and price are unchanged.

## Report

Return: the campaign's links before and after; each change with screenshots; the Update result; the readbacks above; anything you skipped and why. Say plainly which things are verified by readback and which are not.

Krish brings the report back to the Claude Code session, which judges it and fixes what it finds.
