---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-28
head: 83ad83005490fbad23330c09f7832823acc0e722
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

Objection it answers: "AI-written personalisation is generic." The record shows the work it took to make a Border Collie and a Poodle sound different on the same answers (`fd00399`, `9aa8f98`).

## Where it is right now (as of 2026-10-28)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119), and word-free sherpa blanket ($129). Old duplicate products have been archived or held, and the old core handles redirect to the clean ones. The reviewed theme, with native purchase and actual-design checkout settings enabled for all three products, was published on 27 October. The storefront password was removed. Independent uncookied public readback returned HTTP 200 without a password page for the homepage and all three clean product URLs, confirmed the reviewed theme as live, and found all ten current variants available at the expected prices. This is route/configuration acceptance, not a fresh interactive checkout. Normal Shopify Payments is accepting payments; its test gateway is off, and the three pre-existing $49 US market prices remain intact.

One approved fee-free compatibility order passed for a single $129 blanket with the saved accepted artwork. Shopify recorded it as test/paid/unfulfilled; Teeinblue received the original variant and a completed design without a rendering error. The order-linked original print file was downloaded and inspected at 15,900 × 18,900 RGBA PNG. Supplier fulfillment remains held for manual review. No real customer charge or new AI generation is included in this proof. The order is not a physical sample and does not establish production print quality for every gift.

The retained personalized cart changed quantity 2→1 with its exact component, attributes and prepared image intact; checkout read back $129 and the actual accepted design as its main image. The typed-answer workflow's self-recipient correction is published and independently matches `n8n/prompts.json`. The temporary checkout-image QA template was removed from the candidate theme and from the source tree. The Drive brand folder has been cleaned into the existing identity, imagery, social, decks and historical sections. The current Canva handoff is `design/CANVA-SOURCES.md`, mirrored to Drive `01_Identity/CANVA-BRAND-KIT-GUIDE.md`. Product mockups sit by mug, blanket and portrait under `02_Imagery`; the blank blanket template and technical records are separate from social-use images. The existing Canva Brand Kit has been identified but not edited.

Release source was merged to main at `45d927b40797f67962d240a9997e8c75afe84991`; theme publication and password removal are complete. Krish will place the real sample blanket order himself. Physical sample and real paid fulfillment remain future evidence, not launch claims.

**The 27 October redesign is live.** Merged as `b1d3f7e` ([krishanraja/heartside#54](https://github.com/krishanraja/heartside/pull/54)) and pushed to the live theme through the guarded workflow after an unpublished copy passed the same checks: one Heartside around every page, every chat step at its own address so Back, Forward and reload land where expected, the product image glitch fixed, Shopify's prices and photos everywhere, "Free US shipping on every order.", the pink heart favicon, an on-device photo check before any upload, the story and slider demo, a Christmas countdown, several gifts at once, one redo per gift after carting, Buddy's 404 and empty cart, and a Christmas reminder offer by email. The bundle (15% off two gifts, 20% off three, automatic) and the $29 Artist's touch add-on are live. Production read back clean in a real browser at phone and desktop sizes, and a QA cart showed the bundle applying exactly. Record: [`docs/evidence/2026-10-27-go-live.md`](docs/evidence/2026-10-27-go-live.md); what changed and why: [`docs/evidence/2026-10-27-journey-redesign.md`](docs/evidence/2026-10-27-journey-redesign.md). Tone-driven imagery and breed energy reach the art only once Krish applies the Teeinblue prompt spec in his session. The repository acceptance and its fixes ([report](docs/evidence/2026-10-27-repository-acceptance.md)) are in the same merge, with CI running every offline check. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

The earlier handoffs, execution queues, pricing scenarios, module notes and pre-release NOW checkpoints have been moved to [`docs/history/`](docs/history/README.md). They preserve provenance and must not be used as a current product, price or operations source.

## What changed recently

- **28 October, later (live):** Krish's own walk-through found four problems, fixed and live through [krishanraja/heartside#59](https://github.com/krishanraja/heartside/pull/59) (record: [`docs/evidence/2026-10-28-product-cart-live.md`](docs/evidence/2026-10-28-product-cart-live.md)): the cart thumbnail flickered (the product photo, the design and Teeinblue's spinner took turns after every cart redraw; the server now draws the design itself and the cart is read once per change), the wait while Teeinblue paints looked broken (a painting card now shows the buyer's photo being painted, lines from their own choices and an eased bar, then reveals the design), the review tickbox sat above the picture (it is now a large confirmation directly under the finished design, and a blocked Add to cart points at it), and there was no way to add a toy or collar (the product page now takes their words, which reach the painting, and photos of them for our artist with the Artist's touch, added with the gift). The redo and Artist's touch offers moved out of the cart's narrow picture column. CoWork Part B on production then held for three defects: a design at quantity 2 checked out as 4 (Shopify's checkout merge doubles a design line above one), the phone menu drawer showed the framed price and a blank picture, and the cart layout (fixed in #59). The follow-up, live through [krishanraja/heartside#60](https://github.com/krishanraja/heartside/pull/60), keeps every design at one unit, gives the phone drawer Heartside's own menu with Shopify's prices, and makes the tax line true ("Any tax is shown at checkout"); production read back clean.
- **28 October, evening:** The slider now moves the painting. Eight example paintings from the second batch, each made with the single-direction prompts and kept after review, are on the first screen behind the gift section's `examples_on` switch, set on (Krish's ruling): the "Try the slider" demo swaps the pug portrait at Sentimental, Warm with a wink and Hilarious, and a "Same slider, every gift" strip shows golden retriever mugs at two tones, a portrait, a blanket and the pug mug, each labelled as an example. Two images read Warm instead of Hilarious and stay off the site (`design/examples-2026-10-28/review.md`). The preview copy passed Part A at phone and desktop sizes. Real orders paint the same way only once Teeinblue has the prompt spec (Part 1.1 of the [final CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md)).
- **28 October:** The first example batch (19 Codex images from Krish's local relay session, on branch `examples/2026-10-27`) showed the tone barely changing the art and the golden puppy ignoring its style. The art prompt is redesigned so the store sends only the chosen style, tone and energy text in hidden fields (Krish's ruling); a staged second batch (cap 10) tested it, and its kept images are the examples above.
- **27 October, later:** Follow-ups went live the same way: the Christmas reminder capture on the choose screen, the mug reveal opening on the dog's side, and review polish (an Artist's touch line whose design left the cart now says so; "Not sure" on the home follow-up).
- **27 October:** The journey redesign went live, with the bundle discount and the Artist's touch add-on, after an independent review and a real-store check on an unpublished copy. Krish's rulings are in the commit bodies. The [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) is rewritten: Part A is automated (`tools/preview/preview-acceptance.mjs`), Part B (production) is due, Part C runs on his word.
- **27 October:** The three core products and reviewed theme went live with normal payments. The fee-free blanket compatibility order confirmed the accepted artwork reached Teeinblue and produced an inspectable print file; physical print quality and a real paid order still await Krish's sample. See the release checkpoint above and the [live acceptance assignment](docs/review/COWORK-LIVE-ACCEPTANCE.md).
- **27 October:** The current scope and economics were moved to stable documents because dated continuation notes and older price briefs could mislead a reviewer. The active sources are [scope](docs/SCOPE.md) and [economics](docs/ECONOMICS.md); older material is indexed in [history](docs/history/README.md).

## What is next and what is waiting on Krish

- **Next action:** Krish runs the [final CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) on his computer: Part 1 makes the platforms match the store (the Teeinblue prompt spec first, then reads of the checkout merge, discounts, tax, Inbox, Printful and the Christmas cut-off), Part 2 checks every page, price and mockup on production, and Part 3 runs five mock orders through test payments, each with its own edge cases, which he screen-records. He brings the recording and the report back to the Claude Code session, which judges each order for UX and quality and fixes what it finds. The number, $24 against $250 this week, is next measured from Shopify orders net of refunds.
- **Waiting on Krish:** his yes at each approval step of that prompt (the three Teeinblue campaigns, the test-payment window, a cap of 10 paintings, the restore and the clean-up); whether to keep the checkout merge app past its trial on 1 November ($69 a month; without it checkout shows the catalog picture instead of the design) and whether to lift the one-per-design cap; the real blanket sample order; the mug price (below the 30% floor); whether the Artist's touch may name him; and one reminder email, before Christmas delivery closes, to customers tagged `buddy-reminder`. He can change the add-on's $29 price or end the bundle in Shopify at any time. Do not claim physical quality or paid-order fulfillment until the sample is inspected.
- North Star check (2026-10-28): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the final CoWork prompt, with platform changes, the end-to-end check and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
