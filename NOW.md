---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-31
head: 499e137
lifecycle: live
production_url: https://heartside.io
state_doc: NOW.md
history_log: docs/history/LOG.md
truth_files: []
authority_order: [docs/NORTH_STAR.md, NOW.md, docs/SCOPE.md, docs/ECONOMICS.md, docs/SYNC.md]
steward: https://github.com/krishanraja/ai-harness/blob/main/docs/steward/RUNBOOK.md
never_publish: [any credential or the name of any credential, the Shopify store handle and the live theme id, the n8n instance address and its webhook URLs, the Teeinblue campaign ids and Printful product ids, the Google Drive folder link, Krish's personal email address, any customer's order or chat answers or dog's name or photo]
---
# Heartside (heartside.io): where it is right now

<!-- north-star-state {"week_of":"2026-10-26","week_target":250,"current":24,"current_as_of":"2026-10-28","current_source":"Shopify Admin API, orders net of refunds, trailing 28 days, read by Control Center","urgency":4,"urgency_reason":"at 10% of this week's target"} --> **North Star number: U4, far behind.** Shopify net sales, trailing 4 weeks: $24, against $250 this week, on the way to $50,000 by 22 February 2027. A bold swing every day; work that does not move the number waits.

> This is the single current release-state and next-action record. [`docs/SCOPE.md`](docs/SCOPE.md) owns approved scope; [`docs/ECONOMICS.md`](docs/ECONOMICS.md) records the 26 October economic decision: maximize expected total net operating profit subject to a 30% net operating margin floor after all attributable business costs. The earlier mandatory 50% floor is superseded. Configured prices and modeled margins are not realized margin. Later live readback beats this dated record. Earlier checkpoints have moved to [`docs/history/`](docs/history/README.md).

## What it is

Heartside's current core is an illustrated mug, a word-free sherpa blanket, and a portrait available unframed or framed. The mug and portrait carry a short note and signature; the blanket carries illustrations without printed words. Buddy, the brand's dachshund host, gathers the buyer's details, and Teeinblue prepares personalized artwork for Printful production with manual order review. The ornament is on hold, the pillow is a conditional pilot, and the book is planned for 2027. Theme code is in `shopify/` and text workflows in `n8n/`. Lead line: "Your dog loves you too." The 21 October positioning and handoff files are historical snapshots; do not use their old range or prices.

## Who it is for and why it matters for Mindmake

The buyer is a US dog owner looking for a gift that sounds like their dog (`docs/NORTH_STAR.md`). The current core retail baseline is USD45 for the illustrated mug, USD59 for an unframed portrait, USD119 framed, and USD129 for the word-free blanket. Representative regional delivery estimates and approved all-cost margin scenarios are modeled; actual net margin remains to be measured from fulfilled orders. It is a consumer product, not sold to Mindmake's buyer. The earlier store and product decisions are preserved in [`docs/history/`](docs/history/README.md).

Angles a writer can use:

- **The AI never has the last word.** The text workflows include guard code, and Teeinblue orders remain on manual review. The independent live acceptance prompt checks the published version and actual order behavior.
- **Taste beats a passing test.** The current mug's landscape mockups require visual and print review. Historical mug mockup decisions are archived in `docs/history/`.
- **A blind model test picked the writer.** On 22 Oct a voice lab ran held-out dogs across Gemini, OpenAI and Claude (`14cbf98`), and Krish then ruled that Claude Sonnet writes the whole note (`17a800c`).
- **Docs that lied about the product.** The buyer's hidden chat answers were documented as reaching each order, and never did until 21 Oct (`5440649`).

Objection it answers: "AI-written personalization is generic." The record shows the work it took to make a Border Collie and a Poodle sound different on the same answers (`fd00399`, `9aa8f98`).

## Where it is right now (as of 2026-10-31)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119) and word-free sherpa blanket ($129). The reviewed theme was published on 27 October, the storefront password is off, and uncookied readback returned HTTP 200 on the homepage and all three product pages with all ten variants at the expected prices. That is route and configuration acceptance, not a fresh interactive checkout. A fee-free compatibility order for one $129 blanket reached Teeinblue and produced an inspectable 15,900 x 18,900 print file; fulfilment stays on manual review. It is not a physical sample, and physical quality and real paid fulfilment are future evidence, not launch claims. Krish will place the real sample blanket order himself.

**Payments (28 October):** CoWork switched Shopify Payments off for the mock orders on 28 October. A 29 October note says real payment methods were restored, but no readback is recorded here, so treat it as unverified until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back.

**The 28 October acceptance fixes** (PR [#65](https://github.com/krishanraja/heartside/pull/65), record [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md)) reached buyers when the theme was published on 30 October. The one-screen journey (Track B) is not built; nothing is built until Krish says yes to its mock-up.

**Live since 27 and 28 October:** the journey redesign ([record](docs/evidence/2026-10-27-go-live.md)), the 15% and 20% bundle and the $29 Artist's touch add-on, and the example paintings on the first screen ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style because CoWork applied the 27 October prompt spec on 28 October. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

Earlier handoffs, execution queues, pricing scenarios and pre-release checkpoints are in [`docs/history/`](docs/history/README.md) for provenance only.

- Decided, not built. The two CoWork discovery reports (docs/evidence/2026-10-31-gift-note-discovery/) show Printful ships the mug, the portrait and the blanket each in its own parcel with no consolidation at any price, and every Printful card ships as one more parcel; the only per-order text inside a gift's own box is the packing-slip gift message. A live checkout probe on 31 October (mug, and mug with the Artist's touch, to a New York address, stopped before payment) loaded free shipping and every payment method with no error; the only orders since 27 October are refunded tests. (2026-10-31)
- Live on the three gift pages since 31 October, on Krish's yes. The mug gallery holds 11 pictures: Maple on the real black mug first, the four colours, five more breeds on the real mug, and the set with the real mug; the Black variant shows its new picture. The portrait and blanket galleries carry the Bear set with the real mug. Every real-mug picture is the approved painting wrapped onto Printful's own mug photo at its true proportions (tools/realphoto/variant_mugs.py), artwork only; in the sets the room is mirrored so the painted face shows. The nine stretched AI mug pictures and the two old Bear sets are detached, not deleted, so they stay in Shopify Files. handle-check --warn-media: all clear (18 checks). (2026-10-31)
- On a fresh unpublished copy, "Heartside 31 Oct showcase draft", not live. The homepage showcase shows one set at a time, fading on by itself every 2.2 seconds, with ticks, a swipe that skips and a pause button. Styles, gifts and moods are one row of 19 pictures that drifts by on its own and runs faster under a flick, with its own pause button. Both stop off screen, in a hidden tab, under the pointer and on keyboard focus, and with reduced motion neither moves. On gift pages a variant's own picture (a mug colour, a frame finish) is the one variant thumbnail on show and the one marked current, and the row now reaches all 13 and 14 pictures. The 31 October CoWork report is recorded with a correction: buyers already see Bear and the right note words on the portrait, and the handle error only blocks later Teeinblue changes to it. (2026-10-31)
- Live on all three gift products since 30 October, on Krish's yes. The mug gallery now holds 13 pictures: home, studio and hand, then Maple on the pink, red, dark blue and dark green mugs (each colour variant shows its own), then a doodle, a French bulldog, a dachshund, a Labrador and a German shepherd, then the set. The portrait holds 14: home, studio and hand, then Bear in red oak, white and unframed (each finish variant shows its own), then five more breeds, the set, and the two hidden references last. The blanket holds 10: home, studio and hand, five more breeds, the set, and the hidden blank last. Every alt begins "Example:". The colour and finish pictures are free composites on Printful's own photos; the breed pictures are the growth session's approved mockups. Read back through the Admin API: every item READY, every variant with its own picture, the blanket still "Your Dog's Personality Blanket" at $129. handle-check --warn-media: all clear (18 checks). Live phone screenshots of the pink mug and the red oak portrait each show their own picture. (2026-10-30)
- Merged to main, not live (30 October): the showcase opens on the six sets as a large swipe row, with one dog in four moods and a slider that opens on the painting; the journey shows three parts ("1 of 3"); gift pages open with name, price and shipping line, then one "Make one for my dog" card. It goes to the draft theme, then live on Krish's word.
- The live theme is "Heartside 28 Oct fixes", published 30 October from main; the old theme stays as the rollback. Teeinblue's saved prompts match PROMPT-SPEC-2026-11-03.md (v15). handle-check and live-gate ended all clear on the morning of 30 October (report: docs/evidence/2026-10-30-showcase-go-live/REPORT.md). Still open: the portrait campaign's Update fails because a draft "Your Dog's Portrait" holds the clean handle; the legacy "The Morning Mug" campaign shows "Update required: 1"; the blanket's one variant shows the blank supplier picture at checkout; Krish's phone walkthroughs and the four-tone test personalisations are not done. (2026-10-30)
- Recipes v15 (spec tools/print-art/teeinblue/PROMPT-SPEC-2026-11-03.md): the blanket is a scattered pattern of eight to twelve small separate figures, after Krish called the overlapping poses a "dog centipede"; each breed has a character line per tone. Rulings in recipes.brief.character.rulings: archetypeScenes on, jokeProp off. Recipes v10 to v14 are in git history and docs/history/LOG.md. (2026-10-30)

## What changed recently

- 2026-10-31 Ruling (Krish, 2026-10-31): the dog's note prints on the packing slip in every box once a test proves it, the paid add-on is a designed digital card, and a set is presented as a planned arrival of separate boxes. He approved a human Printful ticket, switching off backup facilities, and one real three-gift test order (docs/review/COWORK-NOTE-SLIP-TEST.md).
- 2026-10-31 Krish, 31 October: "the mug mocks look stretched, all the dogs faces look widely stretched" and "they dont look like what the product will actually be". Ruling (Krish, 2026-10-31): the gifts are artwork only, and the note in the dog's voice becomes an optional gift-card upsell, released together with the card. He needs no hand packing and no stream of parcels, so docs/review/COWORK-GIFT-NOTE-DISCOVERY.md (read only) asks the live platforms how a note and a bundle reach one address in one parcel. The homepage pictures still show the AI mug.
- 2026-10-31 Krish, 31 October: "it looks so intense to just have all the pictures visible at once". The showcase drew about 20 tiles at once; it now draws two pictures in motion plus the photo-to-gift slider. The mug's four colour thumbnails had been hidden by an older colour-pair rule, and the first thumbnail stayed marked when a colour opened on its own picture. docs/review/COWORK-PORTRAIT-LINK.md asks CoWork to unlink the old draft product from the portrait campaign and retire The Morning Mug campaign.
- 2026-10-30 Rollback is to delete the 22 added media items with productDeleteMedia (alts listed above); the previous order then stands. On the live 28 Oct theme a variant opens on its own picture while the thumbnail row still highlights the first thumbnail. docs/review/COWORK-AUDIT-FOLLOWUPS.md hands CoWork the steps that need admin or Teeinblue: publish the draft theme, the note placeholder, the portrait handle conflict, the Teeinblue script on the homepage, and a read-only look at The Morning Mug.
- 2026-10-30 The 30 October audit found that every gift showed one dog, that colour and finish pictures were missing, and that the sets were small tiles at the bottom. It also found the moods row mixed products and the slider opened on a plain photo. The Teeinblue SDK loads on the homepage from its app embed, not the theme, so it is on CoWork's list.
- 2026-10-30 Fixes from the 30 October live audit. "Step 1 of 13" told the buyer how long the journey was before it began. "A stock-photo dog" cooled the showcase. Landscape phones couldn't tap the fourth answer. The homepage had no footer. The two buttons didn't match.
- 2026-10-30 Fixes from the 30 October live audit. The gift page's price sat a screen and a half down, beneath Buddy's chat box. The page dropped about 100px after it drew (layout shift 0.12 on phones, 0.43 on desktop). No price showed before the 13 questions. The live memo's "Dec 11" is a form the countdowns can't read, so they counted to Christmas morning instead of the order-by date.
- 2026-10-30 Krish approved the go-live end to end, and CoWork ran it. The draft theme failed the live gate because Helio's transparent home header covered the journey's first screen, so CoWork turned the transparent home header off in the theme settings. The journey now also pads its first screen under any overlapping header itself, so the gate stays clear if that setting is switched back on.
- 2026-10-30 CoWork pressed Update on the blanket campaign with every data-sync box ticked. That renamed the handle to heartside-personality-blanket-draft-2026-10-23 (restored, with a 301), and set the title to "Heartside Personality Blanket - DRAFT 2026-10-23" and the price to $89. Krish approved restoring the pinned title and the $129 price, and the storefront confirms both. The apply steps now say to untick every "Choose data to sync to Shopify" box before any click on Update.
- 2026-10-30 The first screen and the gift pages now show real breeds on the real gifts, to convert better; the effect on the trailing four-week number is not measured yet.
- 2026-10-29 Recipes v11. Hilarious no longer borrows Over the top's velvet cushion and spotlight, its joke keeps the stated place, held toys keep the owner's verb, no unnamed leash, blankets stay in the stated place, and the collage dog is cut paper. Ruling (Krish, 2026-10-29): Hilarious no longer uses the velvet cushion or spotlight; Over the top is the one tone that may.
- 2026-10-29 A Teeinblue campaign Update renames the product handle to the campaign title on most runs (28 Oct, 29 Oct twice). Every Update is followed by the storefront check and the repository handle check before anything else.
- 2026-10-29 The growth session has its two answers, a recalibration and the mandate to drive organic growth. Ruling (Krish, 2026-10-29): the customer email is krish@heartside.io.
- **28 October, night:** PR #65 is merged as `8da4514` with CI green. Ruling (Krish, 28 October): "Remove all the approvals. Just have this co-work prompt punch through everything." The [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) now carries his yes up front. It keeps one hold (the theme goes live only if the copy passed its gates and the phone tests), the never list (no real card, no Printful confirmation, no message to a customer) and the cap of 14 paintings.
- **27 October:** The journey redesign went live with the bundle and the Artist's touch add-on after an independent review and a real-store check on an unpublished copy; the three core products and reviewed theme went live with normal payments, and the fee-free blanket order confirmed the accepted artwork reached Teeinblue. Scope and economics moved to stable documents ([scope](docs/SCOPE.md), [economics](docs/ECONOMICS.md)) because dated notes could mislead a reviewer.

## What is next and what is waiting on Krish

- Next (2026-10-31): Krish runs COWORK-NOTE-SLIP-TEST.md and places the test order himself; the slip automation and the digital card are built once the slips are seen.
- **Waiting on Krish:**
  - **CoWork run:** his yes is given up front (Ruling, Krish, 28 October: "Remove all the approvals. Just have this co-work prompt punch through everything."). He is still needed for his own phones in Part 2.3 and order 5, and for the screen recording. The painting cap stays at 14 (about $1.80).
  - **Track B:** his first reaction to the mock-ups, then a yes before any code.
  - **Still open:**
    - whether to lift the one-per-design cap;
    - the real blanket sample order;
    - the mug price, which is below the 30% floor;
    - whether the Artist's touch may name him;
    - one reminder email, before Christmas delivery closes, to customers tagged `buddy-reminder`.
  - He can change the add-on's $29 price or end the bundle in Shopify at any time.
  - The checkout merge app stays through Christmas at $69 a month (Ruling, Krish, 28 October), and is reviewed in January against measured conversion.
  - Do not claim physical quality or paid-order fulfillment until the sample is inspected.
- **Open finding:** three never-publish items have been in public repository files since early October. The Shopify store handle is in two workflow files, the n8n builder and the workflows and guards it generates, the order QC script with its test and setup guide in `tools/qc/`, archived prompts, handoffs and store notes in `docs/archive/` and `docs/history/`, and dated evidence prompts and a report in `docs/evidence/`. Teeinblue campaign ids are in `design/teeinblue/mug-v3/README.md` and dated evidence reports. The n8n instance address and the two chat webhook addresses are the setting defaults in `shopify/sections/hs3-chat.liquid`, and are also in one dated evidence record and three history files; the chat calls those webhooks from the buyer's browser, so any visitor can see them. None is a credential. Moving the handle to a repository variable, a private n8n origin list and placeholders in the order QC files, taking the webhook defaults out of the section in favor of the theme setting, and removing the handle, the ids and the addresses from the documents, is proposed as a separate task.
- North Star check (2026-10-31): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
