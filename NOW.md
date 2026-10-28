---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-28
head: 8da4514
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

## Where it is right now (as of 2026-10-28)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119), and word-free sherpa blanket ($129). Old duplicate products have been archived or held, and the old core handles redirect to the clean ones. The reviewed theme, with native purchase and actual-design checkout settings enabled for all three products, was published on 27 October. The storefront password was removed. Independent uncookied public readback returned HTTP 200 without a password page for the homepage and all three clean product URLs, confirmed the reviewed theme as live, and found all ten current variants available at the expected prices. This is route/configuration acceptance, not a fresh interactive checkout.

One approved fee-free compatibility order passed for a single $129 blanket with the saved accepted artwork. Shopify recorded it as test/paid/unfulfilled; Teeinblue received the original variant and a completed design without a rendering error. The order-linked original print file was downloaded and inspected at 15,900 × 18,900 RGBA PNG. Supplier fulfillment remains held for manual review. No real customer charge or new AI generation is included in this proof. The order is not a physical sample and does not establish production print quality for every gift.

The retained personalized cart changed quantity 2→1 with its exact component, attributes and prepared image intact; checkout read back $129 and the actual accepted design as its main image. The typed-answer workflow's self-recipient correction was published on 27 October and matched `n8n/prompts.json` then. PR #65 changed `n8n/prompts.json` again, so the live workflows match it only after CoWork publishes them in Part 1.3. The temporary checkout-image QA template was removed from the candidate theme and from the source tree. The Drive brand folder has been cleaned into the existing identity, imagery, social, decks and historical sections. The current Canva handoff is `design/CANVA-SOURCES.md`, mirrored to Drive `01_Identity/CANVA-BRAND-KIT-GUIDE.md`. Product mockups sit by mug, blanket and portrait under `02_Imagery`; the blank blanket template and technical records are separate from social-use images. The existing Canva Brand Kit has been identified but not edited.

Release source was merged to main at `45d927b40797f67962d240a9997e8c75afe84991`; theme publication and password removal are complete. Krish will place the real sample blanket order himself. Physical sample and real paid fulfillment remain future evidence, not launch claims.

**Reconciliation finding: payments (28 October).**
- On 28 October, at about 09:13, CoWork switched Shopify Payments off and the Bogus Gateway on for the mock orders.
- No readback since says Payments was switched back. A read-only check from the Claude Code session found no digital wallets offered at checkout, which fits Payments still being off. The session cannot read the payment setting itself.
- Until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back, treat the store as unable to take a real payment.
- The three pre-existing $49 market prices on The Heartside Sling are read back in the same step.

**The 28 October acceptance fixes are merged, not live.** CoWork's mock orders and Krish's Android walkthrough found that a buyer could not reliably finish:
- the photo silently failed on Android;
- a redo shipped the old design;
- long names printed cut;
- Buddy invented "toast";
- the phone journey was cramped.

PR [#65](https://github.com/krishanraja/heartside/pull/65) fixes all 19 items of the fix prompt plus what the recordings showed, with every new test shown failing on the old code. It also adds the hourly storefront guard and checkout tiles for the blank variant pictures.
- What changed and why: [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md).
- None of it reaches buyers until CoWork pushes the theme, attaches the checkout tiles in Shopify admin, publishes the two n8n workflows and applies the 28 October Teeinblue prompt spec. Krish approved the whole CoWork run up front, so it runs straight through with no approval stops. The same push ships #64's cart fix.
- The hourly storefront guard is not held back: it runs from main since the merge. Until the tiles go on, it opens one issue, "Storefront guard: a storefront check failed", about the blank variant pictures and the heart stand-in. Krish closes it once a run is all clear.
- The new one-screen journey (Track B) is not built. Its rendered mock-up is ready for Krish's first reaction, shared with him privately in the session, and nothing is built until he says yes.

**The 27 October redesign is live.** Merged as `b1d3f7e` ([krishanraja/heartside#54](https://github.com/krishanraja/heartside/pull/54)) and pushed to the live theme through the guarded workflow after an unpublished copy passed the same checks: one Heartside around every page, every chat step at its own address so Back, Forward and reload land where expected, the product image glitch fixed, Shopify's prices and photos everywhere, "Free US shipping on every order.", the pink heart favicon, an on-device photo check before any upload, the story and slider demo, a Christmas countdown, several gifts at once, one redo per gift after carting, Buddy's 404 and empty cart, and a Christmas reminder offer by email. The bundle (15% off two gifts, 20% off three, automatic) and the $29 Artist's touch add-on are live. Production read back clean in a real browser at phone and desktop sizes, and a QA cart showed the bundle applying exactly. Record: [`docs/evidence/2026-10-27-go-live.md`](docs/evidence/2026-10-27-go-live.md); what changed and why: [`docs/evidence/2026-10-27-journey-redesign.md`](docs/evidence/2026-10-27-journey-redesign.md). Tone-driven imagery and breed energy reach the art through the 27 October Teeinblue prompt spec, which CoWork applied to the three campaigns on 28 October and read back by hash. The repository acceptance and its fixes ([report](docs/evidence/2026-10-27-repository-acceptance.md)) are in the same merge, with CI running every offline check. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

**The example paintings are live (28 October).** The first screen's slider now swaps a painted example at each tone, and a "Same slider, every gift" strip shows labeled examples on every gift ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style: CoWork applied the 27 October prompt spec to the three campaigns on 28 October.

The earlier handoffs, execution queues, pricing scenarios, module notes and pre-release NOW checkpoints have been moved to [`docs/history/`](docs/history/README.md). They preserve provenance and must not be used as a current product, price or operations source.

## What changed recently

- **28 October, night:** PR #65 is merged to main as `8da4514`, with CI green there. Ruling (Krish, 28 October): "Remove all the approvals. Just have this co-work prompt punch through everything." The [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) now carries his yes up front and runs straight through. It keeps one hold: the theme goes live only if the copy passed its gates and the phone tests, and otherwise Part 3 runs on the copy. It also keeps the never list (no real card, no Printful confirmation, no message to a customer, nothing it does not name) and the cap of 14 paintings.
- **28 October, evening (merged, not live):** The acceptance fixes in PR #65 ([record](docs/evidence/2026-10-28-acceptance-fixes.md)).
  - **Photo:** every photo outcome shows where the buyer tapped. The picker opens in one tap. Uploads are capped at 4096 px. The on-device check, the dog check included, takes at most 10 seconds and then lets the photo go on, and HEIC is refused with guidance. Getting a photo ready gives up after 20 seconds in plain words. Safari's own photo encoding is cleaned of its metadata instead of refused; no WebKit runs here, so the iPhone test in the CoWork prompt is the proof. `?hsdebug=photo` gives a device log.
  - **Redo:** it survives a slow checkout picture and ends with both designs in the cart.
  - **Names and words:** names get a count and short forms. Typed answers are tidied. Buddy can no longer name a food, toy, object or place the buyer didn't. A cross gets a breed energy only when both parents match. A stated toy always appears once the new prompt spec is applied.
  - **Layout:** the phone journey keeps its button in the first screen and Next above the keyboard, and Teeinblue's own chrome is hidden.
  - **Confirming:** the one tick under the design also ticks Teeinblue's hidden agreement box, and ends "I'm responsible for the photo and words I chose." The blanket's ends "the photo I chose".
  - **Cart:** it groups each add-on under its gift. A design's plus stays off after the cart redraws, and the first of two versions is tagged "First version".
  - **Guards:** an hourly guard opens one issue if a product address, the chat's links, a checkout picture or the Artist's touch picture breaks. The handle check names each blank variant by gift and title, and tells the heart stand-in from the new tile.
  - **Review:** an independent review of the PR confirmed 29 findings, all fixed before the merge. Each code fix has a test that fails on the code before it, and doc tests guard most of the CoWork prompt's fixes. Among them: Safari photos, a cross picked from the list losing its energy, browser Forward skipping the name limit, a gift for "Me" calling the buyer by name, a live-gate check that the healthy blanket page failed, and a CoWork prompt that put the checkout tiles on before the theme that hides them was live.
  - The [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) is rewritten for the release. Today's earlier version is in [history](docs/history/COWORK-PROMPT-2026-10-28.md).

- **28 October, after Part B (not live yet):** A read-back on production with a real prepared design showed the one-per-design rule holding (pressing plus kept the cart at one unit and $129), but the buyer was told nothing: the refusal only reached the console, and the plus stayed pressable. The cart row now says "Each design is one gift, so it stays at one. Nothing was changed." in its own error area, and a design's plus is served disabled. Since PR #65 it is also inert, and `component-cart-items.js` turns it off again after every redraw, because Helio's quantity selector turned it back on. The new offline cases fail on the old code and pass on the new; it is in main but not live, and it ships with the PR #65 theme push in Part 2 of the CoWork prompt. It is a small cart fix, not a lever on the number; whether to lift the one-per-design cap and the real sample order stay the larger ones.
- **28 October, later (live):** Krish's own walk-through found four problems, fixed and live through [krishanraja/heartside#59](https://github.com/krishanraja/heartside/pull/59) (record: [`docs/evidence/2026-10-28-product-cart-live.md`](docs/evidence/2026-10-28-product-cart-live.md)): the cart thumbnail flickered (the product photo, the design and Teeinblue's spinner took turns after every cart redraw; the server now draws the design itself and the cart is read once per change), the wait while Teeinblue paints looked broken (a painting card now shows the buyer's photo being painted, lines from their own choices and an eased bar, then reveals the design), the review tickbox sat above the picture (it is now a large confirmation directly under the finished design, and a blocked Add to cart points at it), and there was no way to add a toy or collar (the product page now takes their words, which reach the painting, and photos of them for our artist with the Artist's touch, added with the gift). The redo and Artist's touch offers moved out of the cart's narrow picture column. CoWork Part B on production then held for three defects: a design at quantity 2 checked out as 4 (Shopify's checkout merge doubles a design line above one), the phone menu drawer showed the framed price and a blank picture, and the cart layout (fixed in #59). The follow-up, live through [krishanraja/heartside#60](https://github.com/krishanraja/heartside/pull/60), keeps every design at one unit, gives the phone drawer Heartside's own menu with Shopify's prices, and makes the tax line true ("Any tax is shown at checkout"); production read back clean.
- **28 October:** The slider now moves the painting. Eight example paintings from the second batch, each made with the single-direction prompts and kept after review, are on the first screen behind the gift section's `examples_on` switch, set on (Krish's ruling): the "Try the slider" demo swaps the pug portrait at Sentimental, Warm with a wink and Hilarious, and a "Same slider, every gift" strip shows golden retriever mugs at two tones, a portrait, a blanket and the pug mug, each labeled as an example. Two images read Warm instead of Hilarious and stay off the site (`design/examples-2026-10-28/review.md`). Live through [krishanraja/heartside#62](https://github.com/krishanraja/heartside/pull/62); production read back clean (record: [`docs/evidence/2026-10-28-examples-live.md`](docs/evidence/2026-10-28-examples-live.md)), and the desktop strip now lines up in one row. Real orders paint the same way since CoWork applied the 27 October prompt spec on 28 October.
- **28 October:** The first example batch (19 Codex images from Krish's local relay session, on branch `examples/2026-10-27`) showed the tone barely changing the art and the golden puppy ignoring its style. The art prompt is redesigned so the store sends only the chosen style, tone and energy text in hidden fields (Krish's ruling); a staged second batch (cap 10) tested it, and its kept images are the examples above.
- **27 October, later:** Follow-ups went live the same way: the Christmas reminder capture on the choose screen, the mug reveal opening on the dog's side, and review polish (an Artist's touch line whose design left the cart now says so; "Not sure" on the home follow-up).
- **27 October:** The journey redesign went live, with the bundle discount and the Artist's touch add-on, after an independent review and a real-store check on an unpublished copy. Krish's rulings are in the commit bodies. The CoWork prompt was rewritten that day in three parts: Part A's checks were automated in `tools/preview/preview-acceptance.mjs`, Part B (production) ran on 28 October and held for three defects, and Part C was to run only on his word. That version is in git history; the current prompt is [`docs/review/COWORK-LIVE-ACCEPTANCE.md`](docs/review/COWORK-LIVE-ACCEPTANCE.md).
- **27 October:** The three core products and reviewed theme went live with normal payments. The fee-free blanket compatibility order confirmed the accepted artwork reached Teeinblue and produced an inspectable print file; physical print quality and a real paid order still await Krish's sample. See the release checkpoint above and the [live acceptance assignment](docs/review/COWORK-LIVE-ACCEPTANCE.md).
- **27 October:** The current scope and economics were moved to stable documents because dated continuation notes and older price briefs could mislead a reviewer. The active sources are [scope](docs/SCOPE.md) and [economics](docs/ECONOMICS.md); older material is indexed in [history](docs/history/README.md).

## What is next and what is waiting on Krish

- **Next action:** Krish runs the rewritten [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) on his computer, starting with Part 0, because the store may not be able to take payments.
  - **Part 0:** puts Shopify Payments back on and reads back the Sling's $49 prices.
  - **Part 1:** applies the 28 October Teeinblue prompt spec, which makes the stated toy appear, and lets Krish choose whether to turn off Teeinblue's crop dialog. It also publishes the two rebuilt n8n workflows, brands checkout and sets "Thank you. Your order is in.", and records the platforms.
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
- North Star check (2026-10-28): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
