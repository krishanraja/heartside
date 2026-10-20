# For Cowork: the gift lines are now a message from the dog (20 Oct 2026)

## What Krish asked

On a cart showing a Morning Mug for Mowgli ("Brings the stick back every single time." / "Understands every word. Pretends he doesn't." / "Already planning the next throw."), Krish said the text wasn't good enough: "It should be a message from your dog in their personality style... capture their demeanour, cross reference the corpus, and create literally a humanized warm message from the dog to the person with some humour and dog anthropomorphisms. Make sure all products create a warm message with 10000X personality."

## Why it read badly

The 13 Oct rule "gift lines never use I" forced every line to describe the dog from outside. The AI then slipped into third person ("Pretends he doesn't."), and nothing checked for it.

## Ruling (Krish, 2026-10-20), recorded in V3 section 13

- On every gift, I, me and my are the dog; you is the person. Warm first, funny second, with a dog's logic and a straight face.
- Never he, she, the dog's name or the person's name in a line. No exclamation marks, no "Dear". "Love, [dog]" is the only sign-off, and the 15 Oct letter direction stays rejected.
- This replaces the 13 Oct "no I" rule and the 15 Oct "no breed question yet".

## What shipped

- **All 36 scripted chip lines rewritten** (`shopify/assets/hs3.js`). Each one fits the mug's two rows and the 44-character Teeinblue fields. Examples:
  - "I wait by the door. Weekends too. Obviously."
  - "I took your side of the bed. Not sorry."
  - "You have coffee. I have hope of toast."
  - "Where you go, I go. Bathroom included."
  - "I'm your shadow. Where else would I be?" (this meaning line also carries the ornament on its own)
  - If the buyer skips everything: "Best part of my day? You walking in." / "I'm never far from you." / "Any time with you is my favorite time." / "I'm yours. Always."
- **The AI writes for every buyer.** Compose now runs at every reveal, not only after a typed answer. It rewrites the four lines as one message in that dog's personality. The scripted lines show at once and are the fallback. Cost: one extra Gemini flash-lite call per buyer.
- **The theme checks the voice.** An AI line with he, she or the dog's name is dropped for the scripted line or the buyer's own words.
- **Breed corpus.** Step 1 has an optional "Breed, if you know it" field; it adds no new step. An exact corpus match (for example "border collie": Border Collie, Herding Manager) sends its archetype to the AI as a light tone signal. The breed and its type are never shown to the buyer.
- **n8n source** (`n8n/build.mjs`, `shared.js`) has a new gift-line voice in both prompts. Enforce rules now allow I and reject he/she, names and "!". Guard accepts `dog.breed` and `dog.tone`. Tests: `n8n/test-voice.mjs`.

## Status

| Piece | State | Evidence |
|---|---|---|
| Theme | **Live.** Merged as https://github.com/krishanraja/heartside/pull/31, pushed to "Heartside launch" (#197492998526) by run 56 (https://github.com/krishanraja/heartside/actions/runs/39411910260), green, 11:01 UTC | heartside.io serves `hs-breeds.js` and the new `hs3.js` (contains "I took your side of the bed. Not sorry." and the voice check) |
| n8n webhooks | **Not yet updated.** The session's safety check blocked the n8n API call as a production deploy. | The live workflows still run the 13 Oct prompts |
| Tests | Pass | `tools/preview` chat, reveal and hs3-lines: all passed. `n8n/test-voice.mjs`: 9 of 9. Theme check: 0 offenses |

## Open, in order

1. **Publish the two n8n workflows from `n8n/compose.js` and `n8n/typed.js`.** This is urgent: compose now runs for every buyer, but the old compose prompt still forbids "I". Its dog-voice lines fail the old rules and fall back to the new scripted lines, which is safe. But if the old model rewrites a chip line without "I" ("Waits by the door for you."), that older-style line can show. Steps are in `n8n/README.md` > "Change them". Afterwards, run one live compose call and confirm the lines say I.
2. Watch the "Heartside AI calls" table for a day. Compose rows should now arrive for every buyer, and the fallback rate should stay under about 1 in 10.
3. Krish to judge 5 real reveals: does each read as that dog talking?

## The mug page after "Teeinblue has the five mug colors" (checked live, 20 Oct, 390 px)

| Check | Result |
|---|---|
| Shopify images | **Fine, nothing to restore.** The product holds exactly the 10 approved images (dog face and note face per color). Each matches the repo's approved file (mean pixel difference under 0.5/255, JPEG only). There are no Teeinblue mockups. Each variant's image is its own dog face. Black is the first variant. |
| Gallery | **Fine.** Each color opens on its own dog face, with only its own pair as thumbnails. |
| Description and Your Words | **Fine.** Heartside's description shows. Your Words reads "From Mowgli to Sam / Copied into the preview", and Teeinblue's fields hold the three dog-voice lines and "Love, Mowgli". |
| Cart thumbnail | **Fine.** A Black line shows the whole black mug, handle included, with Color: Black, the three lines and "Love, Mowgli". The Printful SKU on the line wasn't read; order QC checks it on every order. |
| Teeinblue Preview, per color | **Still wrong.** Every color shows all 10 slides, all five mugs. With Red picked it opened on a black mug. |
| Teeinblue Preview, note-face curve | **Still flat.** The rows run straight across the mug; they don't bow with it as in the approved image. |

The last two are the two Teeinblue settings in `docs/evidence/claude-code-2026-10-19/COWORK-MUG-PREVIEW-FIX.md`: each mockup pair assigned to its own color only, and perspective on for every mockup. Neither has taken effect yet. When saving, untick Images and Description.

**New, from today's voice change:** the 10 approved Shopify images still show the old third-person lines ("Waits at the door for you, weekends too."), while every buyer's Preview and print now use the dog's own voice. Re-rendering them with the new lines is a change to approved images, so it waits for Krish.
