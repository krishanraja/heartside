---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-27
head: 785e0d7f609c3146ea46020a042d4ac6dc1e4853
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

<!-- north-star-state {"week_of":"2026-10-26","week_target":250,"current":0,"current_as_of":"2026-10-24","current_source":"Shopify analytics September 27-October 24 plus order transaction readback: one $24 order fully refunded","urgency":4,"urgency_reason":"last measured zero net sales against the October 26 weekly target; fresh measurement pending"} --> **North Star number: U4 at the last measured checkpoint (24 October).** Shopify net sales, trailing four weeks: $0 after the recorded full refund versus the $250 target for the week of 26 October. This is a dated measurement, not a claim about today's sales. Refresh Shopify orders net of refunds before recalculating urgency.

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

## Where it is right now (as of 2026-10-27)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119), and word-free sherpa blanket ($129). Old duplicate products have been archived or held, and the old core handles redirect to the clean ones. The reviewed theme, with native purchase and actual-design checkout settings enabled for all three products, was published on 27 October. The storefront password was removed. Independent uncookied public readback returned HTTP 200 without a password page for the homepage and all three clean product URLs, confirmed the reviewed theme as live, and found all ten current variants available at the expected prices. This is route/configuration acceptance, not a fresh interactive checkout. Normal Shopify Payments is accepting payments; its test gateway is off, and the three pre-existing $49 US market prices remain intact.

One approved fee-free compatibility order passed for a single $129 blanket with the saved accepted artwork. Shopify recorded it as test/paid/unfulfilled; Teeinblue received the original variant and a completed design without a rendering error. The order-linked original print file was downloaded and inspected at 15,900 × 18,900 RGBA PNG. Supplier fulfillment remains held for manual review. No real customer charge or new AI generation is included in this proof. The order is not a physical sample and does not establish production print quality for every gift.

The retained personalized cart changed quantity 2→1 with its exact component, attributes and prepared image intact; checkout read back $129 and the actual accepted design as its main image. The typed-answer workflow's self-recipient correction is published and independently matches `n8n/prompts.json`. The temporary checkout-image QA template was removed from the candidate theme and from the source tree. The Drive brand folder has been cleaned into the existing identity, imagery, social, decks and historical sections. The current Canva handoff is `design/CANVA-SOURCES.md`, mirrored to Drive `01_Identity/CANVA-BRAND-KIT-GUIDE.md`. Product mockups sit by mug, blanket and portrait under `02_Imagery`; the blank blanket template and technical records are separate from social-use images. The existing Canva Brand Kit has been identified but not edited.

Release source was merged to main at `45d927b40797f67962d240a9997e8c75afe84991`; theme publication and password removal are complete. Closeout still requires independent public no-preview product and checkout review plus the separate CoWork live and Claude Code repository acceptance assignments in `docs/`. Krish will place the real sample blanket order himself. Physical sample and real paid fulfillment remain future evidence, not launch claims.

The earlier handoffs, execution queues, pricing scenarios, module notes and pre-release NOW checkpoints have been moved to [`docs/history/`](docs/history/README.md). They preserve provenance and must not be used as a current product, price or operations source.

## What changed recently

- **27 October:** The three core products and reviewed theme went live with normal payments. The fee-free blanket compatibility order confirmed the accepted artwork reached Teeinblue and produced an inspectable print file; physical print quality and a real paid order still await Krish's sample. See the release checkpoint above and the [live acceptance assignment](docs/review/COWORK-LIVE-ACCEPTANCE.md).
- **27 October:** The current scope and economics were moved to stable documents because dated continuation notes and older price briefs could mislead a reviewer. The active sources are [scope](docs/SCOPE.md) and [economics](docs/ECONOMICS.md); older material is indexed in [history](docs/history/README.md).

## What is next and what is waiting on Krish

- **Next action:** complete independent live customer-route and repository acceptance using [`CoWork`](docs/review/COWORK-LIVE-ACCEPTANCE.md) and [`Claude Code`](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md), then Krish places the real blanket sample order. Do not claim physical quality or paid-order fulfillment until that sample is inspected.
- North Star check (2026-10-27): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md) and [repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): independent checks still to run.

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
