# Handover to Claude Code: homepage head, share card, search and AI facts (3 November 2026)

Status: HANDOVER. Written 3 November 2026 by Claude (Cowork) at the end of the run of `docs/review/COWORK-HOMEPAGE-HEAD-2026-11-03.md`, for a Claude Code session with no other context. Krish merges this branch himself. Read this file top to bottom before you touch anything.

## Why this work exists

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027 (`docs/NORTH_STAR.md`). It sat at U5 this week ($69 against $658). Buyers decide on trust before they see a product page. Three things carry that trust:

- the icon in a tab or a search result;
- the card that shows when someone shares a link;
- what Google and AI assistants say about Heartside when someone asks for a gift from the dog.

On 3 November Krish asked whether the search and AI visibility was 11 out of 10. It was a C+. The technical base was good, but what it told machines was wrong in places. **The most damaging fault was false facts in the files AI reads:**

- `/llms.txt` showed every price as "." (blank);
- `/llms.txt` and all three Answers articles said the mug and portrait carry a printed note.

That broke the 31 October ruling that the gifts are artwork only. A shopper told "the mug has your dog's words on it" by an assistant, who then receives a mug with no words, becomes a refund and a bad review. **Keep that failure mode in mind for every line you write: a machine will repeat it to a buyer.**

What Krish wants a buyer to feel is in the voice: "Your dog loves you too." Warm, specific, never generic paw prints. Plain declarative sentences. No "not X, but Y" constructions and no staccato false binaries.

## Product truth to hold (as of 3 November, read live)

- **The gifts:** an illustrated mug $45, a sherpa blanket $129, and a 12 x 18 in portrait at $59 unframed or $119 framed. Optional on any gift, the Artist's touch, $29 (its price is on the product page; copy-lint treats a written "$29" as a retired price, so leave it out of copy).
- **Artwork only.** Every gift is the dog painted from the owner's photo, with no words printed on it (Ruling, Krish, 2026-10-31). The note in the dog's voice comes in the box and on a free digital card. That is the live product page copy in `snippets/hs-native-artwork.liquid` and `snippets/hs-journey.liquid`.
- **Promises:** free US shipping on every order, US only, and a person checks every order before it prints. Printful makes and ships it.
- **The ornament** is on hold, and nothing may mention it.
- **Contradiction to reconcile:** the first paragraph of `NOW.md` (the "current core" line) still says the mug and portrait carry a note and signature. The live site and the ruling say otherwise. Fix it when you fold the now-notes into `NOW.md` on main. Do not trust that line.

## What is live now (changed in Shopify on 3 November, each read back)

| Change | Where | What it replaced | Readback |
|---|---|---|---|
| Share card `share-1200x630.jpg` (Codex, `codex/share-card-2026-11-03`) | Online Store > Preferences, social sharing image | `heartside-share-1200x630.jpg`, the "or an ornament" card with the worded mugs. It is still in Content > Files, so you can switch back. | Home `og:image` names `share-1200x630.jpg`, 1200x630, https, HTTP 200, visually the new card |
| `favicon.ico` | Content > Files | nothing | byte-identical to `design/brand-v4/favicon.ico` (sha256 53022a93...) |
| URL redirect `/favicon.ico` to that file | Online Store > Navigation > URL Redirects | nothing | **does not take effect**: Shopify answers `/favicon.ico` itself with an empty 404 before redirects apply. It does no harm, so it was left in place. |
| Home meta description | Online Store > Preferences | "...Personalized illustrated mugs, word-free blankets and portraits..." (it implied the mug carries words) | live: "Your dog loves you too. A mug, blanket or portrait painted from your dog's photo, with a note in their voice in the box. Free US shipping. A person checks every order before it prints." |
| 3 Answers articles (`/blogs/answers/...`: partner, how to sign, Christmas) | Shopify blog "Answers" | Each said the mug or portrait carries a printed message, and called only the blanket "word-free". Structure, prices, links and UTM codes are unchanged; only those claims were rewritten. | All three 200, no stale phrase, each says the note "comes in the box", FAQPage markup present |
| Home page indexing request | Google Search Console, heartside.io domain property | n/a | "Indexing requested", priority crawl queue |

Left for Krish to decide:

- **Unused duplicate:** `heartside-share-2026-11-03-1200x630.jpg` in Content > Files. Delete it only on his explicit go.
- **Search results:** the last 28 days show 0 clicks, 9 impressions and an average position of 8.8. That is the baseline to beat.

## What is committed on `claude/kind-keller-hnovrq` but NOT pushed and NOT live

GitHub refused the push from the Cowork session, because the repository was not in its authorized set. The commits travel as patch files Krish applies with `git am`. Once they are on the branch:

1. **`Closeout: homepage head run`**: `now-notes/2026-11-03-homepage-head.md`.
2. **`Search and AI facts: ...`**:
   - `shopify/templates/llms.txt.liquid`: the prices are written in, because `all_products` renders empty in that template. The copy is artwork only, and the flow matches today's chat.
   - `shopify/snippets/hs-schema.liquid`: the home Organization description is artwork only.
   - `tools/preview/live-gate.mjs`: it now reads `/llms.txt` against `catalog.mjs` prices and retired claims (ornament, a gift carrying a note or message, a printed message). `/favicon.ico` now prints a warning instead of failing.
   - `tools/preview/core-schema.test.mjs`: the test now expects the artwork-only description.
3. **This handover file.**

Checks run on that tree:

- `node --test tools/preview/*.test.mjs`: 763 of 763 pass.
- copy-lint: 0 introduced.
- theme-check: 0 introduced.
- The new llms check fails 7 lines on the old file and passes on the new one.

## Your next steps, in order

1. **Get the branch to main.** Krish merges `claude/kind-keller-hnovrq` into main. Deploy only from main (2026-10-21 rule): a branch behind main once rolled back main's structured data on the live theme.
2. **Push the theme from main** through `.github/workflows/shopify-theme-push.yml`, the guarded push.
   - Keep `head_heartside` ticked, so the head lines stay.
   - That deploy is a store write and needs Krish's go at the moment of the push.
   - Rollback: re-run the push from the previous main commit.
3. **Read it back from a machine that can reach heartside.io.** The Cowork cloud network could not, so the scripts there ran as in-browser ports.
   - Run `node tools/preview/live-gate.mjs` and `node tools/preview/handle-check.mjs --warn-media` from `tools/preview`.
   - Pass means:
     - every page and view `ok`;
     - `head (/)` is `ok`, with only the `/favicon.ico` warn line;
     - the new llms lines are silent;
     - `/llms.txt` shows $45, $129, $59 and $119.
   - The layout gate across views (desk, phone, Instagram, Android Edge) has **not run since the 3 Nov push**, so treat it as unverified until this run.
4. **Reconcile `NOW.md`** when folding `now-notes/2026-11-03-homepage-head.md`: the current-core line must say artwork only, with the note in the box.
5. **Grow the Answers library from 3 to about 13.** This moves the number most, slowly. It is a content task, so route it through `krish-content-marketer` and `krish-voice`, with `get_approved_taste` for heartside, and Krish approves each article before it is published.
   - **Format:**
     - the question is the title, and the excerpt is the answer in two or three sentences;
     - template suffix `answers`;
     - prices only from `catalog.mjs`;
     - artwork only, with the note in the box;
     - no ratings or reviews until real ones exist;
     - never hidden text or different content for crawlers.
   - **Suggested questions** (pick by Christmas urgency first):
     - What is the last day to order a personalized dog gift for Christmas? (Order by 10 December, from the memo strip.)
     - Can I get a portrait of my dog painted from a photo?
     - What is a good gift from the dog to Mom?
     - What is a good gift from the dog to Dad?
     - What do you get a dog lover who has everything?
     - Is a custom dog mug a good gift?
     - What is a personalized dog blanket?
     - What photo works best for a dog portrait?
     - What can grandparents get from the grandkids' dog?
     - How long does a personalized dog gift take to arrive?
   - After each publish, add it to nothing by hand: the sitemap and `/llms.txt` already link the library.
6. **Earn outside mentions.** AI shopping answers mostly cite other sites: gift guides, Reddit threads, roundups. None point to heartside.io yet. The strategy lives in `growth-heartside/docs/GEO-AEO.md`, which the Cowork session could not read because the clone timed out. Read it first, and propose 3 to 5 concrete targets to Krish. Pitching or posting anywhere is a send or publish and needs his go.
7. **Optional hardening:** let `storefront-guard.yml` run the llms check hourly, so a price change in Shopify that leaves `/llms.txt` stale opens an issue.

## Still needs Krish's own hands

- **Phone screenshots** of the homepage's first and second screens: about two screens long, the pink "Make one for my dog" button pinned, the Christmas offer card.
- **The shared-link preview:** paste heartside.io into a message to his own number and screenshot the card. If the old card shows, it is the preview cache; try again later.

## Rules that hold

- **Never write into the repository, a report or a log:** the store handle, the theme id, any credential, n8n addresses, Teeinblue or Printful ids, or Krish's personal email. Use hello@krishraja.com. The full list is `never_publish` at the top of `NOW.md`.
- **Approval:** any store write, deploy, publish, send, spend or deletion needs Krish's explicit yes immediately before, for that one action.
- **Readback:** after every change, read it back from the system you changed, and record what it replaced.
- **Close out:** before your session ends, write `now-notes/YYYY-MM-DD-<slug>.md` with `Status:`, `Next:` and "North Star check (date): holds."
