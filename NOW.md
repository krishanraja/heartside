---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-11-12
head: a5f0802
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

<!-- north-star-state {"week_of":"2026-11-09","week_target":1084,"current":45,"current_as_of":"2026-11-11","current_source":"Shopify Admin API, orders net of refunds, trailing 28 days, read by Control Center","urgency":5,"urgency_reason":"under 40% of the week's target two weeks running (4% now)"} --> **North Star number: U5, stalled.** Shopify net sales, trailing 4 weeks: $45, against $1,084 this week, on the way to $50,000 by 22 February 2027. Everything else pauses unless it moves the number.

> This is the single current release-state and next-action record. [`docs/SCOPE.md`](docs/SCOPE.md) owns approved scope; [`docs/ECONOMICS.md`](docs/ECONOMICS.md) records the 26 October economic decision: maximize expected total net operating profit subject to a 30% net operating margin floor after all attributable business costs. The earlier mandatory 50% floor is superseded. Configured prices and modeled margins are not realized margin. Later live readback beats this dated record. Earlier checkpoints have moved to [`docs/history/`](docs/history/README.md).

## What it is

Heartside's current core is an illustrated mug, a word-free sherpa blanket, and a portrait available unframed or framed. Every gift is artwork only, with no words printed on it (Ruling, Krish, 2026-10-31); the note in the dog's voice comes in the box and on a free digital card. Buddy, the brand's dachshund host, gathers the buyer's details, and Teeinblue prepares personalized artwork for Printful production with manual order review. The ornament is on hold, the pillow is a conditional pilot, and the book is planned for 2027. Theme code is in `shopify/` and text workflows in `n8n/`. Lead line: "Your dog loves you too." The 21 October positioning and handoff files are historical snapshots; do not use their old range or prices.

## Who it is for and why it matters for Mindmake

The buyer is a US dog owner looking for a gift that sounds like their dog (`docs/NORTH_STAR.md`). The current core retail baseline is USD45 for the illustrated mug, USD59 for an unframed portrait, USD119 framed, and USD129 for the word-free blanket. Representative regional delivery estimates and approved all-cost margin scenarios are modeled; actual net margin remains to be measured from fulfilled orders. It is a consumer product, not sold to Mindmake's buyer. The earlier store and product decisions are preserved in [`docs/history/`](docs/history/README.md).

Angles a writer can use:

- **The AI never has the last word.** The text workflows include guard code, and Teeinblue orders remain on manual review. The independent live acceptance prompt checks the published version and actual order behavior.
- **Taste beats a passing test.** The current mug's landscape mockups require visual and print review. Historical mug mockup decisions are archived in `docs/history/`.
- **A blind model test picked the writer.** On 22 Oct a voice lab ran held-out dogs across Gemini, OpenAI and Claude (`14cbf98`), and Krish then ruled that Claude Sonnet writes the whole note (`17a800c`).
- **Docs that lied about the product.** The buyer's hidden chat answers were documented as reaching each order, and never did until 21 Oct (`5440649`).

Objection it answers: "AI-written personalization is generic." The record shows the work it took to make a Border Collie and a Poodle sound different on the same answers (`fd00399`, `9aa8f98`).

## Where it is right now (as of 2026-11-12)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119) and word-free sherpa blanket ($129). The reviewed theme was published on 27 October, the storefront password is off, and uncookied readback returned HTTP 200 on the homepage and all three product pages with all ten variants at the expected prices. That is route and configuration acceptance, not a fresh interactive checkout. A fee-free compatibility order for one $129 blanket reached Teeinblue and produced an inspectable 15,900 x 18,900 print file; fulfilment stays on manual review. It is not a physical sample, and physical quality and real paid fulfilment are future evidence, not launch claims. Krish will place the real sample blanket order himself.

**Payments (28 October):** CoWork switched Shopify Payments off for the mock orders on 28 October. A 29 October note says real payment methods were restored, but no readback is recorded here, so treat it as unverified until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back.

**The 28 October acceptance fixes** (PR [#65](https://github.com/krishanraja/heartside/pull/65), record [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md)) reached buyers when the theme was published on 30 October. The one-screen journey (Track B) was built from Krish's 29 October brief and is live since 2 November.

**Live since 27 and 28 October:** the journey redesign ([record](docs/evidence/2026-10-27-go-live.md)), the 15% and 20% bundle and the $29 Artist's touch add-on, and the example paintings on the first screen ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style because CoWork applied the 27 October prompt spec on 28 October. Two High findings were recorded open for Krish on 28 October: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

Earlier handoffs, execution queues, pricing scenarios and pre-release checkpoints are in [`docs/history/`](docs/history/README.md) for provenance only.

- on the note step Buddy's line is one line ("It comes with the gift. Pick its tone.") so the note card has more room, and while a note writes its status sits on one line with its dots, with Write it again hidden until the note lands. (2026-11-11)
- the dachshund carrying a heart letter (design/brand-v5/) is the favicon at every size and, through the theme push's new `logo` input, the top-left header icon (heartside-icon-dachshund.png in Shopify Files, 44 px, 36 on phones, rounded corners). (2026-11-10)
- heartside.io is set up to be found in search and AI answers. 19 Answers articles (13 new, written for the questions people ask: custom dog mug from a photo, a blanket with my dog's face, dog mom and dog dad gifts, Secret Santa under $50, what the note should say, delivery times) each carry a direct answer as FAQ data and their own search description. The products, the All gifts collection, Answers and contact now carry search titles and short descriptions; the empty frontpage collection and the printable card page are hidden from search. Structured data adds free US shipping with handling and transit days to every offer, an FAQ on the homepage, and the Answers list; /llms.txt carries the full picture for AI assistants. Everything was checked on the live site except the theme code, which goes live with this merge and push. (2026-11-10)

## What changed recently

- 2026-11-10 Krish replaced the wordmark and the watercolor heart with the dachshund icon on 10 Nov.
- 2026-11-10 Krish asked to be discoverable in every way by search and AI; the store had six answers and product titles without search terms.
- 2026-11-10 Krish's Facebook ad still showed the October card (the retired worded print, ornaments and pillows); the new set shows the current gifts and the note.
- 2026-11-10 the reviewer photos Krish added in the theme editor are kept in the repo, so a theme push can no longer wipe them.
- 2026-11-10 Krish found on his phone that the keyboard covered the chat and its email form, and that the review cards were cut off at the top and bottom.
- 2026-11-10 Krish supplied the reviewers' own words; buyers now see what people say right under the showcase.
- 2026-11-10 buyers can now get answers and a person from any page, and the growth repo has one verified place to sell from.
- 2026-11-10 the Shopify token moved out of every saved n8n run. It protects the order path every sale runs through; it does not move the number directly.
- 2026-11-10 order #1013 showed that shipments never reached Shopify, and that buyers saw an example dog in place of their painting. Fulfillment now flows back to Shopify, and every order email shows the painting. The order page gets the painting once the app is deployed.
- 2026-11-09 Documentation only; no product or sales number moved.

## What is next and what is waiting on Krish

- Next (2026-11-11): Krish checks the note step on his phone once the theme is pushed.
- **Waiting on Krish:**
  - **CoWork run:** his yes is given up front (Ruling, Krish, 28 October: "Remove all the approvals. Just have this co-work prompt punch through everything."). He is still needed for his own phones in Part 2.3 and order 5, and for the screen recording. The painting cap stays at 14 (about $1.80).
  - **Still open:**
    - whether to lift the one-per-design cap;
    - the real blanket sample order;
    - the mug price, which is below the 30% floor;
    - whether the Artist's touch may name him;
    - one reminder email, before Christmas delivery closes, to customers tagged `buddy-reminder`.
  - He can change the add-on's $29 price or end the bundle in Shopify at any time.
  - The checkout merge app stays through Christmas at $69 a month (Ruling, Krish, 28 October), and is reviewed in January against measured conversion.
  - Do not claim physical quality or paid-order fulfillment until the sample is inspected.
  - **From the photo-first release (5 November; record `docs/evidence/2026-11-04-photo-first-journey.md`):**
    - rotate the n8n API key, including the copy pasted into a helper session's chat, and scope the environment's n8n secret to the API and MCP paths;
    - Ruling (Krish, 2026-11-05): he runs Facebook ads, so the blanket keeps its studio photo as its variant picture, and checkout's nested line keeps showing that example blanket. The dog-free tile CoWork attached that day was taken off the same day: the variant picture is the studio photo again and the tile is no longer on the product (it stays in Shopify Files). The mug and the portrait show an example dog there too, for the same reason;
    - the taste and trust calls in section 7 of the record, and whether to spend paints proving a mug brief that puts the dog's face on the front.
- **Open finding:** three never-publish items have been in public repository files since early October. The Shopify store handle is in two workflow files, the n8n builder and the workflows and guards it generates, the order QC script with its test and setup guide in `tools/qc/`, archived prompts, handoffs and store notes in `docs/archive/` and `docs/history/`, and dated evidence prompts and a report in `docs/evidence/`. Teeinblue campaign ids are in `design/teeinblue/mug-v3/README.md` and dated evidence reports. The n8n instance address and the two chat webhook addresses are the setting defaults in `shopify/sections/hs3-chat.liquid`, and are also in one dated evidence record and three history files; the chat calls those webhooks from the buyer's browser, so any visitor can see them. None is a credential. Moving the handle to a repository variable, a private n8n origin list and placeholders in the order QC files, taking the webhook defaults out of the section in favor of the theme setting, and removing the handle, the ids and the addresses from the documents, is proposed as a separate task.
- North Star check (2026-11-11): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
