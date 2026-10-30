---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-30
head: 54b6b0e
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

## Where it is right now (as of 2026-10-30)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119) and word-free sherpa blanket ($129). The reviewed theme was published on 27 October, the storefront password is off, and uncookied readback returned HTTP 200 on the homepage and all three product pages with all ten variants at the expected prices. That is route and configuration acceptance, not a fresh interactive checkout. A fee-free compatibility order for one $129 blanket reached Teeinblue and produced an inspectable 15,900 x 18,900 print file; fulfilment stays on manual review. It is not a physical sample, and physical quality and real paid fulfilment are future evidence, not launch claims. Krish will place the real sample blanket order himself.

**Payments are unverified (28 October).** About 09:13 CoWork switched Shopify Payments off and the Bogus Gateway on for the mock orders, and no readback since says it was switched back. A read-only check found no digital wallets at checkout, which fits Payments still being off; the Claude Code session cannot read the setting. Until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back, treat the store as unable to take a real payment. The same step reads back the three $49 market prices on The Heartside Sling.

**The 28 October acceptance fixes are merged, not live.** PR [#65](https://github.com/krishanraja/heartside/pull/65) (main at `8da4514`) fixes what CoWork's mock orders and Krish's Android walkthrough found: the silent Android photo failure, a redo shipping the old design, cut long names, Buddy inventing "toast" and a cramped phone journey. Record: [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md). None of it reaches buyers until CoWork pushes the theme, attaches the checkout tiles, publishes the two n8n workflows (the live ones match `n8n/prompts.json` only after that) and applies the 28 October Teeinblue prompt spec; Krish approved that run up front. The storefront guard runs from main. Its hourly schedule had not fired once by 05:00 UTC on 29 October, though the workflow is active; run by hand on main at 05:44 UTC it read all clear on all 15 checks, with no blank variant picture and the Artist's touch on its own picture, so the checkout tiles were already attached by then. Whether the hourly schedule starts on its own is still to be seen in the Actions tab. The one-screen journey (Track B) is not built; nothing is built until Krish says yes to its mock-up.

**Live since 27 and 28 October:** the journey redesign ([record](docs/evidence/2026-10-27-go-live.md)), the 15% and 20% bundle and the $29 Artist's touch add-on, and the example paintings on the first screen ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style because CoWork applied the 27 October prompt spec on 28 October. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

Earlier handoffs, execution queues, pricing scenarios and pre-release checkpoints are in [`docs/history/`](docs/history/README.md) for provenance only.

## What changed recently

- **29 October (merged, not live):** CoWork's gate run on the theme copy, and its screenshots, showed three defects of PR #65, now fixed on main with tests that fail on the old code. If CoWork's report brings them back, they are already fixed: the copy has to be pushed again from current main (Part 2.1) to carry the fixes, and a gate run from another branch has to merge main first.
  - The live gate failed on every product page: the Artist's touch button is inline-flex, so its "$29" read as a separate line and as the retired $29 price, and buyers saw "touch,$29" with no space. The button's words and price are now one run of text, and the gate allows any whitespace after the comma.
  - On the mug and the portrait, "Your design" was the current thumbnail over Teeinblue's sample pug, with no Example label. A gift page reached without the chat now keeps the labeled example photo on show until the buyer's painting is in the preview, as the blanket did; after the chat the preview stays on show with its own Example label until the painting is in it.
  - The product price read "$119.00" beside "Framed $119". It now reads "$119", as the product cards and the home page do. The cart still shows "$45.00" (Helio's cart formats).
- **28 October, night:** PR #65 is merged as `8da4514` with CI green. Ruling (Krish, 28 October): "Remove all the approvals. Just have this co-work prompt punch through everything." The [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) now carries his yes up front. It keeps one hold (the theme goes live only if the copy passed its gates and the phone tests), the never list (no real card, no Printful confirmation, no message to a customer) and the cap of 14 paintings.
- **28 October, evening (merged, not live):** The acceptance fixes in PR #65 ([record](docs/evidence/2026-10-28-acceptance-fixes.md)): every photo outcome shows where the buyer tapped and gives up in plain words after 20 seconds; a redo ends with both designs in the cart; names get a count and short forms; Buddy can no longer name a food, toy or place the buyer didn't; the cart groups each add-on under its gift; an hourly guard opens one issue if a product address, checkout picture or the Artist's touch picture breaks. An independent review confirmed 29 findings, all fixed before the merge, each code fix with a test that fails on the old code. Safari's photo handling is proven only by the iPhone test in the CoWork prompt, since no WebKit runs here.
- **28 October:** The slider now moves the painting. Eight kept example paintings sit behind the `examples_on` switch, set on (Krish's ruling), live through [#62](https://github.com/krishanraja/heartside/pull/62). Two images read Warm instead of Hilarious and stay off the site (`design/examples-2026-10-28/review.md`). The first batch of 19 images showed the tone barely changing the art, so the art prompt was redesigned to send only the chosen style, tone and energy text.
- **27 October:** The journey redesign went live with the bundle and the Artist's touch add-on after an independent review and a real-store check on an unpublished copy; the three core products and reviewed theme went live with normal payments, and the fee-free blanket order confirmed the accepted artwork reached Teeinblue. Scope and economics moved to stable documents ([scope](docs/SCOPE.md), [economics](docs/ECONOMICS.md)) because dated notes could mislead a reviewer.

## What is next and what is waiting on Krish

- Next: Krish runs the rewritten [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) on his computer, starting with Part 0, because the store may not be able to take payments. CoWork had started by 01:42 UTC on 29 October; its copy predates the 29 October fixes, so Part 2.1 is run again from current main before the gates.
  - **Part 0:** puts Shopify Payments back on and reads back the Sling's $49 prices.
  - **Part 1:** applies the 28 October Teeinblue prompt spec, which makes the stated toy appear, and turns off Teeinblue's crop dialog by a stated rule, unless that would remove the buyer's way to fix the framing. It also publishes the two rebuilt n8n workflows, brands checkout and sets "Thank you. Your order is in.", and records the platforms.
  - **Part 2:** pushes the theme to a copy, runs the gates, and tests the photo on Krish's own Android phone in Edge and Chrome and on his iPhone, with the photo log. A real photo must add on all three before it pushes live. Then it attaches the checkout tiles, which only the new theme hides from the product pages, and runs the gates on production. Last, it looks up Printful's published Christmas cut-offs and sets the earliest as the store's last order date for Christmas.
  - **Part 3:** runs five mock orders with test payments, then restores payments and cleans up, canceling the four test orders from 28 October too.
  - Krish brings the recording, the photo logs and the report back to the Claude Code session, which judges each order and fixes what it finds.
  - The number, $24 against $250 this week, is next measured from Shopify orders net of refunds.
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
- North Star check (2026-10-29): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
