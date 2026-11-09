---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-11-09
head: b4897a6
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

<!-- north-star-state {"week_of":"2026-11-02","week_target":658,"current":69,"current_as_of":"2026-11-05","current_source":"Shopify Admin API, orders net of refunds, trailing 28 days, read by Control Center","urgency":5,"urgency_reason":"under 40% of the week's target two weeks running (10% now)"} --> **North Star number: U5, stalled.** Shopify net sales, trailing 4 weeks: $69, against $658 this week, on the way to $50,000 by 22 February 2027. Everything else pauses unless it moves the number.

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

## Where it is right now (as of 2026-11-09)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119) and word-free sherpa blanket ($129). The reviewed theme was published on 27 October, the storefront password is off, and uncookied readback returned HTTP 200 on the homepage and all three product pages with all ten variants at the expected prices. That is route and configuration acceptance, not a fresh interactive checkout. A fee-free compatibility order for one $129 blanket reached Teeinblue and produced an inspectable 15,900 x 18,900 print file; fulfilment stays on manual review. It is not a physical sample, and physical quality and real paid fulfilment are future evidence, not launch claims. Krish will place the real sample blanket order himself.

**Payments (28 October):** CoWork switched Shopify Payments off for the mock orders on 28 October. A 29 October note says real payment methods were restored, but no readback is recorded here, so treat it as unverified until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back.

**The 28 October acceptance fixes** (PR [#65](https://github.com/krishanraja/heartside/pull/65), record [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md)) reached buyers when the theme was published on 30 October. The one-screen journey (Track B) was built from Krish's 29 October brief and is live since 2 November.

**Live since 27 and 28 October:** the journey redesign ([record](docs/evidence/2026-10-27-go-live.md)), the 15% and 20% bundle and the $29 Artist's touch add-on, and the example paintings on the first screen ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style because CoWork applied the 27 October prompt spec on 28 October. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

Earlier handoffs, execution queues, pricing scenarios and pre-release checkpoints are in [`docs/history/`](docs/history/README.md) for provenance only.

- `docs/SYNC.md` and `design/CANVA-SOURCES.md` describe Krish's 9 Nov Drive layout: `01_Identity`, `02_Imagery` and `04_Decks` directly under `Heartside/`, `03a_Social-Production` (iterating) and `03b_Social-Schedule` (ready to post), `09_OLD - Historical-and-Source`, with folder IDs. (2026-11-09)
- the cart drawer offers both gifts not in the cart side by side, each with its own Add to cart, and a tab on the left edge brings it back after any close. The home strip leads with "Fast, free US shipping", the button reads "Design yours in minutes", the line under each dog's name is "Their true self, made the perfect gift", and the Juno carousel set shows one mug, not two. (2026-11-06)
- the full purchase path is proven live after today's fixes. Two buyers went through Teeinblue's real painter on heartside.io to the checkout page, with nothing typed or paid. A single mug painted in 46 s and was added in 20 s, with its checkout picture. Three gifts in Roast painted in 39 to 54 s each and were added in 16 to 23 s each, every line with its picture, at 20% off ($234.40). Every question was asked once. A weekly real-engine run (.github/workflows/real-buyer.yml, Mondays, about $1.30 a week, approved by Krish) now sends six awkward buyers through the same path and opens a real-buyer issue when one fails. The hourly storefront guard asks the cart path with the HS_CANARY_DESIGN_ID secret, and both checks read ok. (2026-11-06)
- the Christmas card in the cart shows the card itself, built from the painting's print file (the file Printful prints), never the mug's product mockup. A tap on it opens the real card (pages/card, the page the printer renders) with the note inside. The cart's "one more gift" drawer opens by itself again on phones: its window now runs from when the cart is drawn, not from the page's start, which had closed before a live phone's cart was drawn. (2026-11-06)
- the cart is open and watched. A failed checkout picture blocked every add on 6 Nov (Krish's phone, 08:52 UTC), because Shopify's app proxy turns the registration workflow's 503 "not ready yet" into its own 500 page while Teeinblue writes its copy only seconds after Add to cart. Live since theme push run 181 (10:07 UTC): a 500 is asked again inside the 90-second budget, and past it the design goes in without its picture. The checkout workflow now answers "not ready yet" with a 202 pending and writes one row per failed answer (code, status, never a token or a design) to the n8n data table "Heartside checkout failures", tested with pinned data and published on Krish's yes; a live probe gets 202 for a made-up design and 200 ready for a finished one. The hourly storefront guard now asks the cart path too (tools/preview/cart-path-check.mjs, with the HS_CANARY_DESIGN_ID secret Krish adds). On Krish's yes, the text fixes go live with this: the reveal line one line so the picture is bigger, the tick centred, every dock line one line, support lines two at most (checked on every journey screen), "Writing it roast" replaced per tone, and the audit's possessive, frame-label, portrait-title and offer fixes. Runbook: docs/RUNBOOK-cart.md. (2026-11-06)
- Buddy guides the journey on heartside.io (theme push run 179, 6 Nov 08:43 UTC, on Krish's "looks good"): he says the line under each question and keeps the buyer company in the painting studio, in place of the paw and the drifting icons. The nine changed theme files read back from the live theme with MD5s equal to main; the live gate is all clear on desktop, iPhone, Instagram and Android; the live photo step shows Buddy beside its line with no page errors (no painting made). (2026-11-06)

## What changed recently

- 2026-11-09 Documentation only; no product or sales number moved.
- 2026-11-06 Krish found the drawer gone for good after one tap outside, the drawer offering one gift at a time, and the Juno set showing the real mug pasted twice (6 Nov). The drawer's two cards and Check out fit one phone screen from 320x568 up. A gift still goes in the cart only once Teeinblue has painted it, so Add to cart takes the buyer to that painting, from the same photo with nothing asked. Juno was rebuilt from the same clean plate with no generation, and hero-sets.py --check now fails any set with more than one mug.
- 2026-11-06 the cart is watched hourly and weekly, so a break on the path to purchase is found within the hour, not by Krish on his phone.
- 2026-11-06 the card a buyer sees in the cart is the card Printful prints, and the bundle drawer reaches the buyers it was built for.
- 2026-11-05 Krish's five asks from his phone run went live on his yes (theme push run 177, PRs #121 to #129): the place question stages the painting, the journey's screens move without jutter, and pages load faster (lab: first question 12.2 s to 8.2 s). Details in docs/history/LOG.md.
- 2026-11-05 Roast now winks, because a situation alone did not read as Roast in thirteen real paintings and lettering was cancelled as too risky (Krish, 5 Nov).
- 2026-11-04 Krish called the "Checking the photo" screen horrible (it cropped the photo), found the tones "way too similar to each other" and the copy cut off, and could not untick the blanket. The causes: a visible check, a fade mask over the note, one set of backup lines shared by every tone, a live note writer that predated the tone prompt, and a gift page that locked its own gift. Over the top was renamed Roast and redefined.
- 2026-11-03 the live site sent only one 32 px icon. /favicon.ico and the touch icon were 404, the theme colour was empty, and the share image still advertises the ornament and the worded mug.
- 2026-11-02 Krish found the second "Painting" screen, the repeated chooser and the cut-off cart offer tacky in a real purchase, and his order sat at Teeinblue for six hours waiting for a manual send. Shopify forbids store pages inside frames, so background painting was replaced by one continuous automatic add.

## What is next and what is waiting on Krish

- Next (2026-11-09): none for heartside; the growth engine's `docs/DRIVE-MAP.md` owns the Drive map.
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
- North Star check (2026-11-09): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
