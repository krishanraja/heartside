---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-11-05
head: 8e04dba
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

## Where it is right now (as of 2026-11-05)

The three current core products are active in Shopify: illustrated mug ($45), unframed/framed portrait ($59/$119) and word-free sherpa blanket ($129). The reviewed theme was published on 27 October, the storefront password is off, and uncookied readback returned HTTP 200 on the homepage and all three product pages with all ten variants at the expected prices. That is route and configuration acceptance, not a fresh interactive checkout. A fee-free compatibility order for one $129 blanket reached Teeinblue and produced an inspectable 15,900 x 18,900 print file; fulfilment stays on manual review. It is not a physical sample, and physical quality and real paid fulfilment are future evidence, not launch claims. Krish will place the real sample blanket order himself.

**Payments (28 October):** CoWork switched Shopify Payments off for the mock orders on 28 October. A 29 October note says real payment methods were restored, but no readback is recorded here, so treat it as unverified until Part 0 of the [CoWork prompt](docs/review/COWORK-LIVE-ACCEPTANCE.md) reads it back.

**The 28 October acceptance fixes** (PR [#65](https://github.com/krishanraja/heartside/pull/65), record [`docs/evidence/2026-10-28-acceptance-fixes.md`](docs/evidence/2026-10-28-acceptance-fixes.md)) reached buyers when the theme was published on 30 October. The one-screen journey (Track B) was built from Krish's 29 October brief and is live since 2 November.

**Live since 27 and 28 October:** the journey redesign ([record](docs/evidence/2026-10-27-go-live.md)), the 15% and 20% bundle and the $29 Artist's touch add-on, and the example paintings on the first screen ([record](docs/evidence/2026-10-28-examples-live.md)). Real orders paint with the chosen tone and style because CoWork applied the 27 October prompt spec on 28 October. Two High findings stay open for Krish: no print check yet covers the current products, and the $45 mug sits below the 30% floor in every modeled case.

Earlier handoffs, execution queues, pricing scenarios and pre-release checkpoints are in [`docs/history/`](docs/history/README.md) for provenance only.

- Live on heartside.io since 5 November, on Krish's "Yes, push it live": PR #118 merged (f6c55b1) with all 875 offline tests green, then theme push run 176 from main to the published theme with the December 4 deadline. All 18 changed theme files read back from the live theme match main byte for byte, and the memo strip carries 2026-12-04. A no-paint walk on heartside.io saw the new tone names, the December 4 line, the live detector catching a two-dog photo before painting, and the easel on a journey gift page; the read-only presentation gate is all clear after its home check was pointed at the photo-first start button. (2026-11-05)
- The photo-first journey is built, judged and fixed (PR #118). Krish's 4 November purchase found three paintings, a mug that did not look like his dog and a page that changed size; the journey now runs photo, look, feel and gifts once, paints the exact dog with face-locked tones (recipes v19: two blind judges scored the likeness 7 to 8.5 against 4 to 5.5 for the live brief), and asks the questions while it paints. Eleven buyer runs through Teeinblue on a test theme went to blind judges with two refuters per blocker, and two code reviews (13 findings, then 5 on the fixes themselves) were fixed, each with a test that fails on the old code where one could be written; what needs Krish, paints or a store setting is listed in the record instead: the empty studio is now the buyer's own photo on the easel, the desktop questions use the full card, a photo with two dogs is caught before painting, the mug reveal shows the whole print, the progress line only moves forward, and the Christmas date is at the reveal. The 28 logged n8n executions that could hold the API key were deleted on Krish's approval. Record: docs/evidence/2026-11-04-photo-first-journey.md. (2026-11-05)
- The painting wait's speech bubble no longer resizes the page while the dog's lines type, and the dog's face stays a circle (Krish, 4 Nov: "Nothing on this page must randomly change size with volatility like that when text is generating"). hs-wait.js measures every line the dog or Buddy could say and holds the bubble at the tallest; the typewriter lays out the whole line from the first letter. tools/preview/wait-room.browser.test.mjs now watches the line under the bubble through typing, a treat and a breed fact (fails on the old code, passes now). Merged to main on Krish's word; not yet pushed to the live theme. The same phone run found the journey paints up to three times (the site guesses the blanket, its many-dog pattern is cropped onto every gift tile, and choosing the mug paints again with an invented scene and a second colour row). Krish approved a plan: photo first, one likeness master painted in the background, gift and colour chosen once, real product mockups, one premium shell. (2026-11-04)
- Documentation brought up to date with the 4 November release. NOW.md has one accurate live bullet for the day; README.md, NOW.md and SCOPE.md say every gift is artwork only; SCOPE.md records the 4 November rulings (four distinct tones, Roast, true breed facts, the hidden photo check, untickable gifts) and that Track B is built and live; shopify/README.md, tools/print-art/ARTWORK-SYSTEM.md, the test board README, the breed batch README and breeds-corpus/lookup/README.md describe v18, the painting wait and the breed facts. CI now checks the breed facts are fresh. The North Star number is re-read at $45 net (gross $69 less a $24 reversal; $69 had been gross). (2026-11-04)
- **Live on heartside.io since 4 November, on Krish's yes** (PRs #114, #115 and #116; theme push runs 173, 174 and 175 passed every step, and each pushed file read back from the live theme matches main byte for byte):
  - **One wait, not two.** The photo check runs out of sight: a passing photo goes straight to the painter, and only a refused photo is shown, whole, with Buddy's reason.
  - **The painting wait is a small studio** (`hs-wait.js`): the photo paints in from gray, the dog talks from the studio in its own voice, a true and sourced breed fact appears every third beat (`breeds-corpus/fun_facts.csv` via `hs-breed-facts.js`), the buyer can give treats, and the tab says when the painting is ready.
  - **Every gift can be unticked**, the painted one too, and the note never cuts off.
  - **Four distinct tones; Over the top is shown as Roast** (the id stays `over_the_top`). Roast is the dog lightly mocking the person getting the gift; Hilarious is the dog being funny about itself.
  - **The Roast painting is a visible roast** (recipes v18, `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-04-v18.md`; theme only, saved Teeinblue blocks unchanged): every breed's scene judges its person, one place per picture, sharper faces.
  - **The compose note writer is published in n8n.** Voice, Guard and Enforce read back equal to the repo. The live writer had predated the four-tone prompt until then, which likely explains the tones sounding alike.
  - **Test paintings:** 12 (33 Higgsfield credits, booked and settled), in `design/pipeline-test-board/review.md`. Of the six from the shipping prompts, four land clearly and the retriever and husky land gently; both faces were sharpened afterwards and are not yet repainted. (2026-11-04)

## What changed recently

- 2026-11-04 Krish called the "Checking the photo" screen horrible (it cropped the photo), found the tones "way too similar to each other" and the copy cut off, and could not untick the blanket. The causes: a visible check, a fade mask over the note, one set of backup lines shared by every tone, a live note writer that predated the tone prompt, and a gift page that locked its own gift. Over the top was renamed Roast and redefined.
- 2026-11-03 the live site sent only one 32 px icon. /favicon.ico and the touch icon were 404, the theme colour was empty, and the share image still advertises the ornament and the worded mug.
- 2026-11-02 Krish found the second "Painting" screen, the repeated chooser and the cut-off cart offer tacky in a real purchase, and his order sat at Teeinblue for six hours waiting for a manual send. Shopify forbids store pages inside frames, so background painting was replaced by one continuous automatic add.
- 2026-10-31 Krish asked to build the card add-on after choosing card design A; the card product stays a draft because the All gifts collection would list it on the live store.
- 2026-10-31 Teeinblue's Printful drafts carry the Shopify order name as their external id, which links each draft to its paid order and its note. Orders confirm only after startAfter (31 Oct 2026 15:20 UTC), so the old test drafts are never charged.
- 2026-10-31 Teeinblue's print files are the card's source: the portrait's is 3600 x 5400, the mug's is a 2700 x 1050 wrap. The mug wrap covers the whole strip with the painting (it is not fitted to the strip's height), so the real-mug gallery pictures built on 31 Oct show the painting smaller than the mug will print it; they need re-rendering with the painting covering the wrap. The wide layout on the card front needs a second design pass.
- 2026-10-31 The checkout warning from 29 October sits beside two active cart transforms, Teeinblue's add-on price and the Function Studio merge that shows the buyer's design at checkout; a full personalised checkout, stopped before payment, is the next check. The Printify app no longer appears in Shopify's installed apps; this run did not remove it.
- 2026-10-31 Ruling (Krish, 2026-10-31): the automation confirms each Printful order once the note is on it (standing approval, reversible). Ruling (Krish, 2026-10-31): the digital card is free with every gift, and an optional $12 printed card is offered, saying it ships in its own envelope. Ruling (Krish, 2026-10-31): the printed card is Christmas-themed (the gift's painting in a festive border, the note inside) and disappears at 11:59 pm ET on Thursday 3 December 2026, enforced by the theme, the product and the workflow. Krish's live test is a mug and a blanket with the note, ordered as a customer once launch ready.
- 2026-10-31 Ruling (Krish, 2026-10-31): the dog's note prints on the packing slip in every box once a test proves it, the paid add-on is a designed digital card, and a set is presented as a planned arrival of separate boxes. He approved a human Printful ticket, switching off backup facilities, and one real three-gift test order (docs/review/COWORK-NOTE-SLIP-TEST.md).
- 2026-10-31 Krish, 31 October: "the mug mocks look stretched, all the dogs faces look widely stretched" and "they dont look like what the product will actually be". Ruling (Krish, 2026-10-31): the gifts are artwork only, and the note in the dog's voice becomes an optional gift-card upsell, released together with the card. He needs no hand packing and no stream of parcels, so docs/review/COWORK-GIFT-NOTE-DISCOVERY.md (read only) asks the live platforms how a note and a bundle reach one address in one parcel. The homepage pictures still show the AI mug.
- 2026-10-31 Krish, 31 October: "it looks so intense to just have all the pictures visible at once". The showcase drew about 20 tiles at once; it now draws two pictures in motion plus the photo-to-gift slider. The mug's four colour thumbnails had been hidden by an older colour-pair rule, and the first thumbnail stayed marked when a colour opened on its own picture. docs/review/COWORK-PORTRAIT-LINK.md asks CoWork to unlink the old draft product from the portrait campaign and retire The Morning Mug campaign.
- 2026-10-30 Rollback is to delete the 22 added media items with productDeleteMedia (alts listed above); the previous order then stands. On the live 28 Oct theme a variant opens on its own picture while the thumbnail row still highlights the first thumbnail. docs/review/COWORK-AUDIT-FOLLOWUPS.md hands CoWork the steps that need admin or Teeinblue: publish the draft theme, the note placeholder, the portrait handle conflict, the Teeinblue script on the homepage, and a read-only look at The Morning Mug.

## What is next and what is waiting on Krish

- Next (2026-11-05): Krish pastes the drafted Christmas paragraph into the shipping policy (section 10 of docs/evidence/2026-11-04-photo-first-journey.md).
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
    - run `docs/review/COWORK-SHIPPING-POLICY-CHRISTMAS.md` in CoWork: it puts the December 4 paragraph in the shipping policy and reads it back;
    - rotate the n8n API key, including the copy pasted into a helper session's chat, and scope the environment's n8n secret to the API and MCP paths;
    - left as it is unless he says otherwise: opened up, checkout's order line shows the product's own catalog photo (an example dog) under the buyer's painting. The print is right. Swapping the variant photo for the dog-free checkout tile would also change the blanket page's opening photo and make the tile the blanket's picture on any Facebook, Instagram or Google catalog it is listed in;
    - the taste and trust calls in section 7 of the record, and whether to spend paints proving a mug brief that puts the dog's face on the front.
- **Open finding:** three never-publish items have been in public repository files since early October. The Shopify store handle is in two workflow files, the n8n builder and the workflows and guards it generates, the order QC script with its test and setup guide in `tools/qc/`, archived prompts, handoffs and store notes in `docs/archive/` and `docs/history/`, and dated evidence prompts and a report in `docs/evidence/`. Teeinblue campaign ids are in `design/teeinblue/mug-v3/README.md` and dated evidence reports. The n8n instance address and the two chat webhook addresses are the setting defaults in `shopify/sections/hs3-chat.liquid`, and are also in one dated evidence record and three history files; the chat calls those webhooks from the buyer's browser, so any visitor can see them. None is a credential. Moving the handle to a repository variable, a private n8n origin list and placeholders in the order QC files, taking the webhook defaults out of the section in favor of the theme setting, and removing the handle, the ids and the addresses from the documents, is proposed as a separate task.
- North Star check (2026-11-05): holds.

## Read next

- [North Star](docs/NORTH_STAR.md): owner-approved ambition and measurement.
- [Current scope](docs/SCOPE.md): products, buyer experience and release boundaries.
- [Economics](docs/ECONOMICS.md): current prices, modeled costs and margin decision.
- [Sync](docs/SYNC.md): repository and Drive source mapping.
- [Live acceptance](docs/review/COWORK-LIVE-ACCEPTANCE.md): the CoWork prompt for the 28 October release: payments, the platforms, the theme release with Krish's phone tests, and five recorded mock orders. [Repository acceptance](docs/review/CLAUDE-CODE-REPOSITORY-ACCEPTANCE.md): the brief, answered in [the 27 October report](docs/evidence/2026-10-27-repository-acceptance.md).

## Do not trust

The dated V2/V3 briefs, old CoWork prompts, 50% margin calculations, pre-release handoffs and old module guides were superseded by the 27 October current sources above. They are retained under [history](docs/history/README.md) for provenance only.
