# Photo first, the exact dog, one flow: evidence (4 and 5 November 2026)

Krish's real purchase on 4 November (his Border Collie, Cinematic, Roast, a mug) found the journey broken.
- Three paintings, the blanket's pattern on every gift tile, two colour choices and a raw crop box.
- A speech bubble that resized the page as it typed.
- A mug that did not look like his dog.

He asked for:
- photo first, every choice once, then the purchase;
- the exact dog in the chosen style;
- real product views;
- the cause of the regression;
- ten cynical buyers through the real engine, with critical judges;
- delivery dates that are true;
- merge and push live.

This page records what was measured and how. Nothing here was paid for by a buyer, and every test buyer stopped at the checkout page with nothing typed.

## 1. What regressed in the painting (through Teeinblue's own painter)

**Method.**
- The same photo of Mowgli and the same answers (Border Collie, couch, coffee, a bone, a bandana, Cinematic).
- The mug was painted on heartside.io by Teeinblue's painter.
- The page's brief was swapped before the send for v17 (31 Oct), v18 (live on 4 Nov) and v19 (this change).
- Two blind judges scored each painting's face against the photo, out of 10: a pet portrait artist, and the dog's cynical owner.

| Version | Judge 1 | Judge 2 | Face |
|---|---|---|---|
| v18 Roast (live) | 5.5, 5 | 5, 4 | smug side-eye, a bone in the mouth, a plain bandana instead of his plaid one |
| v17 Roast | 6, 5.5 | 6, 6 | heavy-lidded, a bone in the mouth, a plain bandana |
| v19 Roast | 7.5, 7 | 8, 8 | his own open-mouth pant, his plaid bandana and collar |
| v19 Warm | 8.5 | 8 | his own face |
| v19 Hilarious | 8.5 | 7 | his own face |

**Cause.**
- v18 changed only Roast. It asked for "a dramatic, exaggerated side-eye down the lens, one brow raised, smug". Asking the painter to rebuild the face fights the identity line, and the identity loses.
- Teeinblue's three-value tone select also received "Hilarious" for Roast.

**v19, face-locked tones.**
- The Energy field locks the face and the build to the photo.
- Each tone changes only the staging, body, camera, light and colour.
- Roast is told by the situation: the dog has taken the whole couch.
- Spec: `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-04-v19.md`.

**Defects found and fixed:**
- Both judges found every lying pose stretched far beyond the dog's real build. Roast said "stretched out across the whole couch". The build is now locked too.

**Defects found and not fixed:**
- Every version paints the eyes amber, not the photo's grey-green hazel. This is left as a residual.

## 2. What regressed in the note

The note writer is the n8n compose workflow (Claude Sonnet). The 4 November publish caused two faults.

1. **A copied example.** The prompt's own example of "but" was "Our morning coffee smells good, but I still prefer my bone." The model copied it word for word into real notes for coffee and bone answers (executions 50395, 50396). It is replaced, and every line in every tone must first be a true, natural sentence.
2. **Over-long examples.** The four tone examples modelled meaning lines of 46 to 62 characters. The meaning line is printed on the gift and must fit in 44, so the writer threw long lines away and fell back to "I'm yours, always.".
   - Production since the publish (7 model calls, read only): 3 raw meaning lines over 44, and 1 printed fallback.
   - The same answers with the old examples, through the real model: 3 of 4 tones fell back.
   - With examples that fit and state their length: 6 of 6 kept their own line.

The compose writer was published on 5 November. Its live system message was hash-checked against `n8n/prompts.json` (MD5 b57cf714…, 18,404 characters). The old one was hash-checked against `beaaff9`. The workflow diff shows that only that one field changed.

**Typed writer (not published).**
- Its live prompt is still the 29 October one, and it never carried the copied example.
- Main's typed prompt has had other, never-published changes since at least 31 October: the comic characters and an 80-character rule.
- Publishing it would ship them untested, so its draft was put back to the live content.
- This is a finding for Krish, not a change.

## 3. Ten buyers through the real engine

**Setup.**
- Ten personas on a test copy of the live theme (unpublished), through heartside.io's preview, with Teeinblue's real painter.
- Personas:
  - a last-minute buyer who reads the shipping policy first;
  - a buyer with refused photos;
  - a three-gift buyer;
  - a reloader;
  - a double tapper;
  - a long dog name;
  - a typed breed;
  - a slow network;
  - two dogs in one photo;
  - a large camera original.
- Each stops at the checkout page.

**Run 1.**
- All ten were told "Your photo didn't come with you to this page" while it was on the page.
- Cause: the gift page called a photo lost if nothing was painting five seconds after it opened, and Teeinblue opens slower than that on the live store.
- Fix: hs2.js `journeyStatus()` says what it knows, and "lost" means the photo is really absent. A 9-second slow-painter test fails on the old code and passes now.

**Run 2.**
- **The double tap.** Double-tapping the style's Next skipped the tone screen and kept Warm unseen. A double tap's second tap is now ignored once the first has moved the screen on.
- **The address.** After the note, the address still said `#ask=words`. It is now cleared.
- **The rest were the test harness's own faults:** waiting for the page's load event, and not shortening a refused long name. These are fixed in the harness.

**Run 3.** Five of ten reached checkout: two mugs, two blankets and a portrait.

| Found | Fix |
|---|---|
| The portrait's and a blanket's first Add failed with "Checkout artwork is not ready". The second tap went through. The first checkout registration of a large print file outlived the request or the app proxy, and the client gave up at once. The gift page also gave up at 36 seconds. | `hs-checkout-image.js` asks the same registration again after a proxy timeout (502 or 504) or an over-long request, inside the same 90-second, 12-request budget. The gift page waits out that budget, shows hs2's own words ("Getting Pepper's picture ready for checkout"), and presses once more by itself if hs2 says the copy failed. |
| A reload, or Back then Forward, mid-paint orphaned the painting. The buyer waited 8 minutes on "Almost there". | Once the painter has been open 20 seconds with nothing painting, nothing saved and nothing to restore, the frame says "The painting stopped" and one tap paints again from the same photo. A reload right after the send also lost the photo itself, because its time was written before the photo was stored. The time is now recorded first, and the restore accepts either. |
| On a 320 px phone, a typed breed's suggestions were under the button. | The search replaces the list, and the screen can scroll. |
| A double tap on a gift card chose it and took it back. | A double tap on a card or a colour is one tap. |
| Layout shift of 0.3 to 0.74 on the home hero and the gift page's first seconds. | The hero is laid out as it will run. The journey's padding is set before the first paint. Journey mode is set while the page parses, so the product page never paints under the panel. Measured locally: home 0.40 to 0.001, gift page 0.28 to 0. |

Each fix has a test that fails on the old code where one could be written.

## 4. The test buyers' Teeinblue paintings

About 26 to 28 paintings went through Teeinblue in the ten-buyer runs and the diagnostics, inside the 30 approved. That includes run 1's sends, which the buyers did not see. Ten manual note-writer runs went through n8n.

## 5. A credential in n8n's execution log (found 5 November)

- **How it got there:** this cloud session's network proxy adds the n8n API key to every request to the n8n host. The test browsers called the public note webhooks, so n8n stored the key in their request headers.
- **Where it is:** confirmed in compose executions 50411, 50412, 50419, 50420, 50424, 50426 and 50427. Likely also in the ten-buyer runs on 5 November and in the typed writer.
- **The value is not copied anywhere.**
- **From then on:** the test browsers block n8n, and the notes were tested inside n8n, where no header is added.
- **Needs Krish:**
  - rotate the key;
  - scope the environment's n8n secret to the API and MCP paths;
  - approve deleting those executions.

## 6. Not proven

- The checkout registration's server side: that n8n workflow is not visible to the connector. The fix follows the client's own design for transient failures, and is inferred from the page's words and the second tap.
- Teeinblue's own script failed some fetches in this environment, and one run hit a bot check. Neither is from the theme.
