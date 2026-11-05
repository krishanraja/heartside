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
- **Deleted on Krish's approval (5 November, "I approve deletion of the logged executions"):** all 28 executions that could hold it, 50411, 50412, 50413, 50416, 50418, 50419, 50420, 50424, 50425, 50426, 50427 and 50559 to 50575, through n8n's API with a key Krish put in the environment for it. Each now reads back 404.
- **Still needs Krish:**
  - rotate the n8n API key, including the copy pasted into a helper session's chat;
  - scope the environment's n8n secret to the API and MCP paths.

## 6. The hardest buyer, after the fixes

Vera, 67, on an iPhone SE (320 px), double-taps everything, types a breed the list does not have (Labradoodle) and reloads while it paints. Through Teeinblue on the test theme:
- the typed breed's search took the list's place and she moved on;
- her reload 41 seconds in brought the page back; at 67 seconds it said "The painting stopped", and one tap painted again from the same photo;
- the framed portrait (red oak, $119) was added on the first press, in 16.8 seconds;
- layout shift: 0.057 on the home flow and 0.081 on the gift page, under the 0.1 line (before the fixes 0.20 to 0.41 and 0.29 to 0.74);
- she reached checkout. Nothing typed, nothing paid.

## 7. The judges

Eleven recorded purchases (ten from run 3, Vera after the fixes) went to a workflow of blind judges: per run, a premium-brand director on the screenshots, a cynical non-technical Christmas buyer on the screens and the delivery lines, and a likeness judge comparing each painting with that buyer's own photo. A synthesis ranked every failure by how many buyers hit it, and two refuters then tried to knock down each blocker against the run's own data and screenshots.

**Scores:** mean buyer trust 4.1 of 10, mean director score 4.0, mean likeness 6.9 over eight paintings (5 to 9). Six of eleven reached checkout; two buyers said they would pay.

**Blockers that survived both refuters, and what was done:**

| Blocker (buyers who hit it) | Done |
|---|---|
| "Painting your dog" sat empty, a title and a Next button, for 11 to 22 seconds (9 of 11). hs2.js shows its painting card only once the photo has gone, and the live store's scripts load late. | The easel: the buyer's own photo, the wash, the brush and a line from the studio, from the first paint of the page, at the card's size; the card takes its place. The studio now ends about six seconds after the tap, at least 2.5 seconds after the scripts run. Test at 320 and 390 px fails on the old code. |
| The mug's reveal showed the dog's back half, and "Up close" cut the face off (all 3 mug buyers). | The second view is now "Whole print", uncropped; the mug's line says it prints all the way round and the arrows turn it. The painter's placement (the brief already says a fifth of the way in from the left) was not followed; changing the brief needs paints, so it stays open, below. |
| The only desktop buyer (1280x800): every question in a 40 px column, the note reading "I w / the / so". | The questions use the studio's own 1040 px card and height on desktop. Test fails on the old code. |
| A photo of two dogs was accepted in 0.3 seconds and one dog was dropped. The dog detector had not loaded yet, and the check fails open. | The detector finishes its check out of sight while the buyer picks the look; if it sees more than one dog, Start painting asks once: another photo, or this one anyway. Two tests. |
| The shipping policy said no Christmas date was set, beside "Order by December 4". | The new paragraph is drafted (below). The Shopify connector has no permission to write policies (`write_legal_policies`), so Krish pastes it in the admin. |
| Checkout's second line showed the product's example dog beside "Dog's name: Honey". | Display only: both refuters found the order line points to the buyer's painting. It is Shopify's merged checkout line, whose child always shows the variant's own photo. Fixing it means dog-free variant photos, a product media change for Krish. |

**Majors fixed in the same pass:** the progress line now only moves forward (gifts 40%, studio 45%, questions 50 to 85%, note 90%, wait 95%, reveal 100%); the home page names the tones as the steps do (Warm, Roast); the last gift's reveal says "Order by December 4 for Christmas delivery to a US address." from the store's own deadline, and only until that day ends; the add says "Adding it to your cart. This can take up to a minute."; the name screens no longer show a stranger's name as a placeholder; the breed line says "It goes in the note. We paint your dog from the photo."; the note screen says a tone there changes the words, never the painting; the wait says "Still painting" and "Most take 1 to 3 minutes", not "Almost there" at 40 seconds.

**Majors left for Krish (taste, trust or store settings):** no reviews or real customers and "Example" on every picture; the painter-in-a-studio copy against "painted with AI"; the note's visibility after the note step and the $12 card beside it; questions that mix the buyer's life with the recipient's; the pre-ticked "Email me with news and offers" at checkout (a checkout setting); the cart line without the dog's name or style; the reveal mockups (Teeinblue's); the hero dog Bear changing colour between products; three gifts painted one after another; a reload still costing a second painting (the painting lives in the page that sent it).

## 8. The code review

A review workflow over the branch, with an adversarial check of each finding, confirmed 13 defects. All are fixed, each with a test that fails on the old code where one could be written:
- a photo refused after it left (the device check, a redrawn photo field, a failed preparation, or a send that vanished) left the buyer on "Almost there" for ever: the page now says why, with "It's my dog. Paint it." where there is an override, otherwise Teeinblue's own photo field;
- a photo chosen in Teeinblue's picker was overwritten by the automatic send;
- the journey's photo was checked a second time, out of sight, where a refusal had nowhere to show;
- Back to a gift already added offered to paint it again: it now says it is in the cart;
- a painter that never opened left only a status line: the page says so, and one tap reloads;
- a second copy merged into one cart line was not counted; the automatic retry used what the first try left of the budget; past the budget the page invited a second add while hs2 was still adding;
- the studio said "Your photo is with the painter" before it was;
- the inline journey check used any gift's key, so a normal gift page could step aside until the scripts loaded;
- taking back a wrong guess left the header hidden;
- Back after the questions stepped through every question's entry;
- the blanket's Roast figure still said "stretched out" (recipes SHA now `5c18af39…`, spec updated, and a test fails if any journey Tone direction says "stretch");
- on phones the reveal's words, picture, repaint link and dock could overlap (tested at five sizes, three gifts).

**A second review, of the fixes themselves** (three dimensions, two refuters per finding), confirmed five more, all fixed with tests that fail on the previous code:
- a double tap on Start painting put its second tap on the two-dog sheet's "Paint this photo anyway", in the same place: the safe answer now sits there, and the sheet ignores a double tap and its first half second;
- the late dog check was skipped when the detector was ready but ran out of time on the photo, and a reload part way through lost it: it now follows the result, and runs again from the photo on the device;
- after an add, Back from Safari's or Firefox's page cache left a busy button: the page now says the gift is in the cart, and a gift taken out of the cart can be painted and added again;
- the easel painted at 5:6 and snapped to the gift's shape when the script ran: the shape is in the page as the server sends it, with the wait room's styles before it;
- the page as sent said "Your photo is with the painter" before it was: it says "The painter is getting ready."
Smaller ones fixed in the same pass: the photo no longer hides the easel's brush, a later gift's progress line starts at 95%, an empty offer pill keeps its space without showing, and a failed add says "Tap the button again" to match the button. Refuted by both refuters: that "This can take up to a minute" understates the add.

## 9. Not proven

- The checkout registration's server side: that n8n workflow is not visible to the connector. The fix follows the client's own design for transient failures, and is inferred from the page's words and the second tap.
- Teeinblue's own script failed some fetches in this environment, and one run hit a bot check. Neither is from the theme.
- The fixes in sections 7 and 8 are proven offline, through the rendered theme in Chromium. The 30-painting cap for live tests was reached, so they have not been re-run through Teeinblue; the first real buyers after go-live are that run.
- The mug painter's placement of the dog: the brief asks for a fifth of the way in from the left, and the paintings put the face near the far edge. Changing the brief needs paints to prove.
- Paths no test buyer took (the judges' completeness critic): a cart with two or three gifts and the bundle discount applied; real Safari, the iOS photo picker, HEIC photos, in-app browsers, tablets and enlarged text (every run was Chromium); checkout past the empty form (shipping lines, Alaska, Hawaii and military addresses, express pay, discount codes); "Paint it again" and the cart's "Make another version" through Teeinblue; Black and White frames and the Dark Blue, Pink and Red mugs in a cart; the Vintage screenprint and Fine ink styles; the Artist's touch and the printed card with the December 4 date; Back from the cart or checkout, a second tab, or coming back later; a stall or an upload cut off without a reload. Teeinblue's script logged "Failed to fetch" in 9 of 11 runs; whether that ever loses a painting is unknown.

## 10. The shipping policy paragraph, for Krish to paste

Shopify admin, Settings, Policies, Shipping policy. Replace the "Christmas." paragraph with:

> **Christmas.** Order by December 4 for Christmas delivery to a US address. That is the last day on which the times above still deliver before Christmas Eve. Orders placed after December 4 may arrive after December 25.
