---
repo: krishanraja/heartside
product: Heartside (heartside.io)
as_of: 2026-10-23
head: 6710125
lifecycle: live
production_url: https://heartside.io
state_doc: docs/HANDOFF.md
history_log: docs/history/LOG.md
truth_files: []
authority_order: [docs/NORTH_STAR.md, docs/V3-GIFTS-FROM-YOUR-DOG.md, docs/POSITIONING.md, docs/HANDOFF.md, docs/COWORK-HANDOVER-2026-10-15.md, docs/HANDOVER-2026-10-17.md, docs/SYNC.md]
steward: https://github.com/krishanraja/ai-harness/blob/main/docs/steward/RUNBOOK.md
never_publish: [any credential or the name of any credential, the Shopify store handle and the live theme id, the n8n instance address and its webhook URLs, the Teeinblue campaign ids and Printful product ids, the Google Drive folder link, Krish's personal email address, any customer's order or chat answers or dog's name or photo]
---
# Heartside (heartside.io): where it is right now

## What it is

Heartside sells gifts from your dog: a mug, a sherpa blanket, a framed print and a tree ornament carrying a short message from the dog to the person it loves, in the dog's own voice, signed "Love, [dog]". A buyer answers six short questions in a chat with Biscuit, the brand's AI dachshund host; an AI writes the note from those answers, and Printful makes the gift to order for US customers, with a person checking every order before it prints. A Shopify store (theme code in `shopify/`, deployed by GitHub workflow), Teeinblue for the personalised print file, and two n8n webhooks for the AI (`n8n/`). Lead line: "Your dog loves you too." (`docs/POSITIONING.md`). Heartside is a Mindmaker LLC company (`docs/HANDOFF.md` section 3).

## Who it is for and why it matters for Mindmake

The buyer is a US dog owner looking for a gift that sounds like their dog (`docs/NORTH_STAR.md`); prices run from $19 to $89 with free US shipping (`docs/HANDOFF.md` section 1). It is a consumer product, not sold to Mindmake's buyer. What it proves to that buyer: one founder, working with AI agents (Claude Code for the build, Cowork in the browser, a separate growth engine in `krishanraja/growth-heartside`), took a store from a first commit on 4 October 2026 to a live chat-led store on 19 October (`git log`; `docs/HANDOFF.md` section 3), with the AI fenced in by rules a person can read.

Angles a writer can use:

- **The AI never has the last word.** Every line the model writes goes through rule code that rejects names, invented numbers, stacked fragments and grief (`n8n/README.md`, "Enforce rules"), the theme applies the same check, and Teeinblue holds every order until a person presses confirm (`docs/HANDOFF.md` section 2, rule 9).
- **Taste beats a passing test.** Krish called a mug preview that passed every automated check "ridiculously poor" (15 Oct), so a gate now compares the chat's mug with Teeinblue's real print files (`docs/HANDOFF.md` section 5a, `mockup-gate.mjs`).
- **A blind model test picked the writer.** On 22 Oct a voice lab ran held-out dogs across Gemini, OpenAI and Claude (`14cbf98`), and Krish then ruled that Claude Sonnet writes the whole note (`17a800c`).
- **Docs that lied about the product.** The buyer's hidden chat answers were documented as reaching each order, and never did until 21 Oct (`5440649`).

Objection it answers: "AI-written personalisation is generic." The record shows the work it took to make a Border Collie and a Poodle sound different on the same answers (`fd00399`, `9aa8f98`).

## Where it is right now (as of 2026-10-23)

<!-- north-star-state {"week_of": "2026-10-26", "week_target": 250, "current": null, "current_as_of": null, "current_source": null, "urgency": 4, "urgency_reason": "not measured yet (no Shopify reading this week)"} --> **North Star number: U4, far behind.** Shopify net sales, trailing 4 weeks: not measured yet (no Shopify reading this week), against $250 this week, on the way to $50,000 by 22 February 2027. A bold swing every day; work that does not move the number waits.

Lifecycle: live. The chat-led store has been public at heartside.io since 19 October (`docs/HANDOFF.md` section 3, "The buyer's journey, as live"; `9ea7e34`).

Live and recorded as verified in the repo:

- The four gifts, the chat homepage, the reveal, choose gifts and the share card, each fitting one screen with no scroll on every device since 21 Oct (`docs/HANDOFF.md` section 3; PR #41).
- The buyer's hidden answers (`_hs_answers`, `_hs_lines`, `_hs_ship_to`) reaching the cart line, checked on the live store on 21 Oct (`5440649`).
- Order QC on GitHub Actions twice a day, tagging only and never confirming (`.github/workflows/order-qc.yml`, `5075902`).
- The mug's note at Fraunces 58 px in the live Teeinblue mug artwork, and 61-character Line fields on the storefront mug page (`docs/evidence/cowork-2026-10-22/REPORT-2.md`).
- The compose call (the whole note) on Claude Sonnet with a hand-over to Gemini 3.5 Flash at 7.5 s, and the typed answer on Gemini 3.5 Flash, as `n8n/README.md` records since 22 Oct.

Merged to `main` but not recorded as deployed:

- The 60-character gift lines in `shopify/assets/hs3.js` (PR #44). The brief says the live site keeps writing 44-character lines until the theme deploy, which needs Krish's yes on the day (`docs/evidence/claude-code-2026-10-22/COWORK-60-CHARACTER-LINES.md`).

Blocked or waiting:

- **No real order through the v3 journey yet.** The mock order is the first item of work left (`docs/HANDOFF.md` section 4).
- **The blanket, print and ornament still take 45 characters a line on the storefront.** The 61 limit is saved in their Teeinblue artwork but needs Teeinblue's Update, which Cowork held for Krish's yes because it publishes to the live store (`docs/evidence/cowork-2026-10-22/REPORT-2.md`, step 6).
- The mug's Teeinblue Preview shows all ten slides per colour and prints flat; Christmas order-by dates are not confirmed per product; funnel events fire at the wrong moment (`docs/HANDOFF.md` section 3, "Known gaps right now").
- `docs/HANDOFF.md` section 3 still says the AI runs on Google Gemini and that "Change a word" allows 45 characters; `n8n/README.md` and `docs/V3-GIFTS-FROM-YOUR-DOG.md` section 5 carry the 22 Oct values.

## What changed recently

- 2026-10-23 **The North Star now has a number, a weekly ladder and an urgency rating, so every session knows how far behind it is and how hard to push.** Ruling (Krish, 2026-10-23): every repository chases one aggressive number on a weekly ladder, and urgency U1 to U5 sets its intensity. The number and ladder are in `docs/NORTH_STAR.md`; where it stands is the first line under "Where it is right now". Contract: ai-harness `contract/north-star-metric.md`.
- **2026-10-22: the note sounds like each dog, up to 60 characters a line, written by Claude Sonnet** (PR #44). Krish: "Two-word sentences stacked against two- or three-word sentences are just a clear tell ... A border collie would sound different to a poodle if they were human." The old prompt had taught the staccato ("two short sentences beat one long one"); the new one describes each breed archetype as a person, writes a one-line voice first, and the rules now reject stacked fragments and worn lines such as "not sorry" (`fd00399`, `9aa8f98`). A first round still made a Border Collie, a Poodle and a Beagle sound nearly the same on identical answers, which is why the voice step exists. A blind lab across three providers (`14cbf98`) preceded the ruling for Sonnet; measured Sonnet times were 12.0, 4.3 and about 5.6 s for a full note, so the theme's compose budget went to 11 s (`17a800c`).
- **2026-10-22: Cowork raised the Teeinblue Line fields to 61 and measured the real print files** (`ea79f11`, `66928e6`). The ornament already prints under the 12 pt rule at 44 characters (about 9.6 pt), so its meaning line stays at 44 (`docs/evidence/cowork-2026-10-22/REPORT.md`; ruling in `17a800c`).
- **2026-10-21: one screen, no scroll, on the homepage and the gift page** (PR #41). Krish: "We need radical simplicity of the UI and UX on all devices!" The footer became one policy line and Teeinblue's fields moved behind Change a word (`docs/HANDOFF.md` section 9).
- **2026-10-21: the buyer's chat answers reach the order for the first time** (`5440649`). Teeinblue's Add To Cart posts its own JSON and never reads the product form, so the hidden answers had never reached a cart line although the docs said they did. Found in a live cart test.
- **2026-10-21: deploy only from `main`** (`b343580`). A branch behind main rolled back main's search structured data on the live theme until main was redeployed (`docs/HANDOFF.md` section 5b).
- **2026-10-21: product images in the dog's voice and search groundwork** (`cef09ae`, `89519a8`): all four products' Shopify images carry the new lines; structured data, a brand-first `llms.txt` and an Answers template went in.
- **2026-10-20: the gift lines became the dog talking** (`da6ecb8`, `9fc1c8b`). Krish's ruling: I is the dog, you is the person; never he, she or a name in a line.
- **2026-10-19: the chat became the homepage** (`9ea7e34`), the mug went to five colours with Black first, and order QC moved to GitHub Actions with its schedule switched on (`5075902`).
- **2026-10-18: the North Star was set** (`dfafcf0`): the gift US dog owners reach for first by February 2027, with $10,000 an ordinary month.
- **2026-10-15: mug v3 approved** on real product photos, and an order check that reads each order's real print file before it prints (`ffe773f`; `docs/COWORK-HANDOVER-2026-10-15.md`).
- **2026-10-13: v3, gifts from your dog** (`5f25e34`, `52caa44`): the four everyday gifts replaced the HR poster range, and the chat with Biscuit, with live AI through n8n, replaced the review builder.
- **2026-10-12: positioning set** (`35f0070`): "Heartside: Personalized Dog Gifts" and "Your dog loves you too."
- **2026-10-04 to 07: the v1 and v2 stores** (the ornament, then the "Your dog has notes" poster), now history (`docs/archive/README.md`).

## What is next and what is waiting on Krish

- **Next action:** run `docs/evidence/claude-code-2026-10-21/COWORK-FIRST-MOCK-ORDER.md` with Krish logged in, ending in his mock order of one Black mug and one Couch Blanket, checked through order QC, the hidden answers and both print files, then "Confirm & Send to fulfill" in Teeinblue (`docs/HANDOFF.md` section 4, items 1 and 2). It is the proof that Shopify, Teeinblue and Printful work for the v3 range.
- **Say yes to the 60-character lines going live together:** Teeinblue's Update on the Couch Blanket, Framed Print and Tree Ornament campaigns (`docs/evidence/cowork-2026-10-22/REPORT-2.md`), and the theme deploy of `main`'s `hs3.js` (`docs/HANDOFF.md` section 5b). Deploying the theme first would let the site write lines the three storefront forms still cap at 45.
- Confirm the Christmas order-by date per product in Printful before the theme shows one (`docs/HANDOFF.md` section 4, item 3).
- Open questions in `docs/HANDOFF.md` section 9: whether "Your dog has notes." survives as an end-card line; when to run the five-dog bake-off for the phase-two illustration; whether to offer a bundle discount beyond the $19 ornament.
- North Star check (2026-10-23): holds.

## Read next

1. `docs/NORTH_STAR.md`: the ambition, read every session. Only Krish changes it.
2. `docs/V3-GIFTS-FROM-YOUR-DOG.md`: the product, the journey, the AI and the words on the gifts, with the decision log in section 13. It wins on those.
3. `docs/POSITIONING.md`: names, headlines, bios and the brand line, and what is retired.
4. `docs/HANDOFF.md`: systems, hard rules, state, work left in order, and how to change and deploy the site.
5. `docs/COWORK-HANDOVER-2026-10-15.md`: the approved mug and the rejected directions.
6. `docs/HANDOVER-2026-10-17.md`: the next product work and its acceptance criteria.
7. `docs/SYNC.md`: what lives in this repository and what lives in Google Drive (the repository is canonical).
8. `shopify/README.md`, `n8n/README.md`, `tools/qc/README.md`: the theme, the AI and the order check.

## Do not trust

- `docs/HANDOFF.md` section 3 on the AI model ("two webhooks running Google Gemini") and on 45 characters per line: superseded on 22 Oct by `n8n/README.md` and `docs/V3-GIFTS-FROM-YOUR-DOG.md` sections 5 and 13.
- `docs/COWORK-PROMPT.md`, `docs/COWORK-PROMPT-2026-10-06.md`, `docs/COWORK-PROMPT-2026-10-07.md`, `docs/COWORK-PROMPT-2026-10-13-V3.md` and `docs/COWORK-PROMPT-2026-10-14-V3.md`: prompts that were run, history of the v1 and v2 stores (`docs/HANDOFF.md` section 7). `COWORK-PROMPT.md` stays in `docs/` because the deploy workflow's setup note points to it (`docs/archive/README.md`). The current Cowork prompt is `docs/evidence/claude-code-2026-10-21/COWORK-FIRST-MOCK-ORDER.md`.
- `docs/evidence/claude-code-2026-10-21/COWORK-LAUNCH-AND-TEST-ORDER.md` for the order path: replaced the same evening by `COWORK-FIRST-MOCK-ORDER.md`; only its part 6 (search and AI listings) still runs, after the order (`docs/HANDOFF.md` section 4, item 1).
- `docs/V2-FROM-THE-DOG.md`, `docs/BRIEF.md` and `docs/TEEINBLUE-SETUP.md`: the v2 store, superseded by `docs/V3-GIFTS-FROM-YOUR-DOG.md` (13 Oct). The honesty guardrails in `BRIEF.md` still apply (`docs/HANDOFF.md` section 7).
- `docs/COWORK-HANDOVER-2026-10-15.md` and `docs/HANDOVER-2026-10-17.md` are still current, but only for what they cover (the approved mug; the next product work). The state and the work left are in `docs/HANDOFF.md`.
- `docs/archive/*`: history, do not act on it (`docs/archive/README.md`).
- `content/v1-2026-10-06/`: the first videos, for the retired HR poster. Do not post them.
- `design/BRAND-SYSTEM.md` on the poster voice (marked retired), `design/prototype-v3/Main.dc.html` on its gift lines (retired), and `assets/heartside-fb-cover-1640x624.jpg`, which shows the retired poster (`docs/HANDOFF.md` sections 7 and 8).
