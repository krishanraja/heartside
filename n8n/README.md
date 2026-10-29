# n8n integration source

This directory contains builders and public workflow source for typed answers, note composition and checkout artwork. [`../NOW.md`](../NOW.md) owns current release status; the independent live review checks active published definitions and actual behavior. The older two-webhook account snapshot is archived in [`../docs/history/N8N-README-2026-10.md`](../docs/history/N8N-README-2026-10.md).

Builder output in Git is not proof of the active n8n version. Regenerate deterministic public artifacts in an isolated checkout, compare the diff, and obtain sanitized active-version readback separately. Keep credentials, private endpoints and customer data outside Git and reports. Do not publish a workflow from this README.

## Buddy's rules, checked after the model

The typed-answer and compose workflows each pass the model's reply through an Enforce rules node before Tag, Respond and Log. Its code comes from `build.mjs` and `shared.js`. The model's reply is treated as data: Enforce keeps only what passes and otherwise falls back to the owner's own words or the page's drafts.

- **No exclamation marks.** `clean()` turns a run of exclamation marks into one period in every reaction, follow-up question, chip, reply, gift line and compose reason. Beside a question mark only the question mark stays, and before a comma, semicolon or colon the exclamation mark is simply dropped. It also collapses two or more periods in a row to one period, with the next word starting a sentence ("I wait at the window. Until your car pulls in."). The single ellipsis character (…) is left as it is. A typed double exclamation mark in the middle of an answer becomes one period, and the next word starts a new sentence ("My best friend. Forever."). The draft line compose falls back to goes through the same `clean()`.
- **No invented props (28 Oct).** `PROPS` in `shared.js` is a closed list of foods, treats, toys, household objects and places. A gift line, Buddy's reaction, a follow-up question, chip or reply, or the compose reason may name one only when the owner's own answers hold it: their typed words, the chip ids, and the fixed words each chip stands for (`CHIP_WORDS`; for example the coffee chip covers coffee, cup, mug and morning, and never food). Draft lines and the prompt never count, because a draft can carry its own invention ("You have your coffee and I wait for toast."). The one exception is the typed home follow-up: the home line it refines counts, because that line was already guarded against the owner's home answer. The dog's and the person's names never count either: a name may appear, but a dog called Biscuit or Latte grounds no cookie or espresso. When something fails:
  - a reaction becomes empty, so the page shows no reaction;
  - a gift line takes the next alternate. In compose it then takes the draft, if every prop in the draft is the owner's, then the page's plain line for that step, so the page still gets all four lines. In a typed answer it then takes the owner's own words, then the previous line;
  - a chip is dropped with its line and reply, and a reply alone becomes empty;
  - a follow-up question drops the whole follow-up, so the chat moves on to the next step.
- **No non-answer chips.** A follow-up chip that is only Not sure, Unsure, No idea, I don't know, Don't know, IDK, Dunno, Skip, None, Nothing, N/A, Other or Something else (`NONANSWER`) is dropped with its line and reply. The page adds its own Not sure and Something else. "Not sure he cares" is a real answer and stays.
- **No guessed pronoun (28 Oct).** The Guard keeps `he` or `she` when the buyer tapped one and sends `they` otherwise, because the chat says "they" until a pronoun is tapped. It used to turn anything that was not `he` into `she`. Both prompts tell the model to call the dog by name or by `dog.pronoun` in Buddy's words, and no prompt example uses she for the dog.
- **A gift for the buyer (28 Oct).** When `recipient.relation` is `self` ("Me"), Buddy is talking to the person, so the reaction, follow-up question, chips, replies and compose reason say you and never the buyer's name. Enforce drops one that names them: a reaction becomes empty, a question or chip drops the follow-up, a reply becomes empty, and the reason becomes empty so the page shows its own. For anyone else it is the other way round, as before: their name, never you. Enforce drops a follow-up question, chip, reply or compose reason that says you, but it does not check the reaction, so a reaction that says you is kept. Gift lines are the dog talking to the person as you either way.
- Names, numbers, line length, the dog's voice, worn lines, grief and profanity are checked as before.

`CHIP_WORDS` follows the chip ids in `shopify/assets/hs3.js`. A new chip there needs its words here, or its draft line falls back to the plain line.

## Build and test

- `node n8n/build.mjs` writes `prompts.json`, `typed.js`, `compose.js`, `guard-*.js` and `enforce-*.js`. Never edit those by hand: CI rebuilds them and fails when the committed copies are stale.
- `cd n8n && node test-rules.mjs && node test-voice.mjs` runs the rule cases offline. Both exit 1 when any case fails, so CI goes red.
- `node n8n/lab.mjs > lab-workflow.js` refreshes `lab-cases.json` from the current prompts for the manual voice lab.

## Publishing the typed and compose workflows

A rule change here reaches buyers only after the rebuilt workflows are published in n8n. Since 29 October a Claude Code session publishes them through the n8n connector (Ruling, Krish, 29 October: "just do it automatically, everything is set to allow in the connectors"), with the version history as the rollback. The fields that carry the rules in "Heartside: typed answer (Buddy AI)" and "Heartside: compose gift lines (Buddy AI)":

- Guard `jsCode`, from `guard-typed.js` or `guard-compose.js`;
- Enforce rules `jsCode`, from `enforce-typed.js` or `enforce-compose.js`;
- the disabled **Voice** node's `options.systemMessage`, from the `typed` or `compose` entry in `prompts.json`. Voice never runs; every model call reads the instructions from it.

Every model call has a deadline (29 October, measured in [`docs/evidence/2026-10-29-timing-report.md`](../docs/evidence/2026-10-29-timing-report.md)). The Gemini node has no timeout option, so Gemini is called through its REST API in an HTTP Request node, and a Set node ("Gemini text", "Backup text") flattens the reply to the `{ text }` Enforce reads:

| Workflow | First call | Backup | Past both |
|---|---|---|---|
| typed | Gemini, 3 s | Gemini, 1.5 s | Enforce keeps the buyer's own words; the page gives up at 5 s |
| compose | Claude, 6.5 s | Gemini, 3.5 s | Enforce keeps the buyer's own lines; the page waits 11 s, then still takes a late note |

After publishing, read back the active Guard code, Enforce rules code and system message of each workflow and compare them with these files.
