# Claude CoWork: finish the 3 November homepage in Shopify (favicon, share image, phone checks)

Status: ASSIGNMENT, not a result. Written 3 November 2026 for Krish to run in CoWork on his own computer. Krish's 3 November phone homepage went to the live theme from `claude/kind-keller-hnovrq` on his go: the two-screen phone page, the pinned pink button, the Christmas offer card, and the head lines (`snippets/hs-head.liquid`) through the push's `head_heartside` option. What is left can only be done inside Shopify admin and on his phone.

## Why this exists, in Krish's terms

Krish, 3 November: "the browser favicon, social share, GEO, and SEO… I don't think it is [11 out of 10]. The favicons don't even show." On 3 November the live site sent one 32 px icon only. `/favicon.ico` and the touch icon were "not found", and every shared link showed an old card that still sells an ornament and a mug with words on it. The theme now sends every icon size. The two jobs below are store settings, which the theme cannot change.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027 (U5 this week: $69 against $658). A shared link that looks current, and an icon a buyer recognises in a tab and in search, both feed the number this month.

## Rules that hold for the whole run

- Change nothing you cannot read back afterwards. After every change, read it back from the system you changed.
- Record what you replace (its name, where it was, a screenshot), so Krish can put it back.
- Never put a credential, the store handle, the theme id or Krish's personal email in the report or in any file in the repository. Use hello@krishraja.com where a contact is needed.
- Stop and ask Krish, in this chat, before each step marked **STOP**. A yes covers that one step only.
- Never use a real card, never confirm a Printful order, never message a customer.

## Before you start

Pull `krishanraja/heartside` and check out `claude/kind-keller-hnovrq`, or `main` if that branch has been merged. Read `now-notes/2026-11-03-phone-homepage-two-screens.md` and the "3 November" section of `shopify/README.md`. Run once: `cd tools/preview && npm ci && npx playwright install chromium`.

## Part 1: read the live push back (no changes)

1. Run `node tools/preview/live-gate.mjs` and `node tools/preview/handle-check.mjs --warn-media` from `tools/preview`.
   - Every page and view should pass, except the **head (/)** block, which will still list `/favicon.ico` and the share image until Parts 2 and 3 are done.
   - Report every line that fails, word for word.
2. On Krish's phone, open heartside.io in Chrome:
   - The page is about two screens long.
   - The pink "Make one for my dog" button stays at the bottom while scrolling.
   - The offer card shows "Christmas offer", "N days left", "Free US shipping" and "15% off 2 gifts, 20% off 3".
   - Screenshot the first and second screen.

## Part 2: /favicon.ico (browsers and Google ask for it at the root)

3. **STOP, then upload.** Upload `design/brand-v4/favicon.ico` from the repository to Shopify admin > Content > Files. Copy its file address (it starts with `https://cdn.shopify.com/`).
4. **STOP, then redirect.**
   - In Online Store > Navigation > URL Redirects, add a redirect from `/favicon.ico` to that file address.
   - Read it back: `curl -sI https://heartside.io/favicon.ico` must end at an `image/` content type with HTTP 200.

## Part 3: the share image

5. **Wait for the card.** Codex is building it from `codex/queue/share-card-2026-11-03.md`.
   - Run `git fetch origin codex/share-card-2026-11-03`.
   - If the branch does not exist yet, stop here and tell Krish; Parts 1 and 2 still stand.
   - When it exists, open `design/share-card-2026-11-03/share-1200x630.jpg` from that branch at full size and check it against `design/share-card-2026-11-03/brief.md`: no ornament, no words printed on a gift, every line whole.
   - Show it to Krish.
6. **STOP, then set it.**
   - Upload the 1200x630 file to Content > Files.
   - Set it as the social sharing image in Online Store > Preferences. If Helio's Theme settings has its own social sharing image, set it there too.
   - Record what it replaced (`heartside-share-1200x630.jpg`).
   - Read it back: the home page's `og:image` names the new file and loads over https.
7. Paste heartside.io into a message to Krish's own number (not a customer) and screenshot the preview card. Shared-link previews cache for a while; if the old card shows, say so and try again later.

## Part 3b: search

8. If Krish has Google Search Console for heartside.io, request indexing of the home page so the new icon is picked up sooner. Report only that it was requested.

## Part 4: close

9. Run `node tools/preview/live-gate.mjs` again; the **head (/)** block should now say `ok`.
10. Report three things:
    - what passed;
    - what you changed, with each item it replaced;
    - the screenshots.

    Do not edit `NOW.md`. Write the result to `now-notes/2026-11-0X-homepage-head.md` with three lines: Status, Next, and "North Star check (date): holds."
