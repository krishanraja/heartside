North Star: this work is on the "sounds like their dog" promise and on buyer trust in what gets painted. Both feed net sales, which is U5 at $69 against $658. Nothing was edited, committed or pushed. No photo was painted. My only contact with heartside.io was a plain GET of the home page and three script files.

# Ask 5: why Roast and the answers don't show in the painting

## Answer to Krish

Partly yes, and partly something else.

- **The answers:** yes. On the photo-first path the painter starts before any question is asked. The code deliberately keeps every later answer away from the painting. Name, breed, pronoun, person, home, spot, together and meaning only shape the note and the order.
- **Roast:** no. Roast is chosen before painting and does reach the painter. But the v19 Roast text, written to protect the face, describes a relaxed, content dog on a couch in warm golden light, with nobody there and no props. That is a cozy picture. The only roast in it is "not one inch left for anyone else", which nothing in the picture can show.

## 1. What the painter receives today

**Verified in the code**

- The home page hands over only the style, the tone and the gift: `st.hs_brief_input = { breed: '', pronoun: 'they', archetype: '', likeness: true }` (`shopify/assets/hs-journey.js:294`). The home steps are `['photo','look','tone','gifts']` (`hs-journey.js:57`).
- `briefFields` in `tools/print-art/artwork-system.mjs:240-247` (which `native-candidate.mjs:15-17` calls) returns three fields on this path:
  - **Energy:** the face and build lock (`recipes-v1.json:901`).
  - **Style direction:** the chosen medium.
  - **Tone direction:** the tone's fixed text, the guard (`recipes-v1.json:902`) and the frame-fill line.
- No answer is read on this path, even when one is passed. `hs2.js:716` passes spot, home and the rest, but the likeness branch ignores them.
- For Krish's case (Cinematic, Roast, mug) the Tone direction is 664 characters: "Mood: a loving roast, told by the situation, never the face. The dog has taken over the best spot in the house: lying across the middle of the couch, every cushion claimed and not one inch left for anyone else, perfectly relaxed and content. Scene: a couch at home. Camera: a centered, slightly low view, like a grand portrait. Light: a warm golden light and rich, deep color." It then adds the guard ("its own calm, natural expression ... No toy, clothing or prop that is not in the photo") and the fill line.
- Teeinblue's tone select: `hs2.js:56` sends "Warm with a wink" for Roast.
  - The saved prompts do not read `{{Artwork tone}}` (`PROMPT-SPEC-2026-10-28.md:38`, tested at `artwork-system.test.mjs:322`).
  - The repo's four block hashes match `nativePrompt()`: mug `aa41590e…`, portrait `dddbf245…`, blanket `b6aa708e…`, card `1868aab7…`.
  - So the select has no effect on the picture. It only labels Roast orders "Warm" in Teeinblue's record. That corrects the v19 record's claim that the select pulled the painting the wrong way. This is inferred from the repo: the live saved blocks were not re-read this session.

**Verified with a local Playwright run against `tools/preview/out`** (outside hosts blocked)

- With an instant painter stand-in, the photo was sent at 0.9 s and the first question (`#ask=name`) appeared at 6.1 s.
- With a 9-second stand-in, the photo was sent at 9.9 s, while the name question was already showing.
- Both times the Tone direction at the moment of sending was exactly the v19 Roast text above.

**Verified on heartside.io** (plain GET, no photo): the live `hs-journey.js` has `hs_brief_input={breed:"",pronoun:"they",archetype:"",likeness:!0}` and `HOME=["photo","look","tone","gifts"]`. The live engine carries v19 and the same Roast text. The live `hs2.js` maps Roast to Warm in the select and carries the same answer keys.

**Answers that arrive only after the painting has started:** name, breed, pronoun, person, home, spot, together and meaning (`hs-journey.js:58`), plus the note.
- `journeyAnswers` writes only `dog, person, hs_ship_to, hs_answers, hs_breed_id, hs3_lines, hs3_mug_lines` (`hs2.js:366-375`).
- The code comment there says this is on purpose: "Nothing that painted the picture is touched". The same rule is in the v19 spec, item 3.
- `nativeBlanketInputsReady` (`hs2.js:509-530`) and the photo-prep re-check (`hs2.js:2701`) mean the hidden fields must not change after the send, or the send and the add break.

## 2. Why Roast reads as cozy

1. **The text names only content and comfort:** "perfectly relaxed and content", "calm, natural expression", "warm golden light". There is no visible sign of anyone losing their seat.
2. **The saved prompt removes the only possible foil.** Its person rule says "with a low or worm's-eye camera, leave the person out" (`recipes-v1.json:329`), and Roast asks for "a centered, slightly low view". The guard also forbids any prop. With nobody and nothing to contrast against, one dog at its real size on a couch is just a dog on a couch.
3. **The v19 test never judged the tone.** The evidence record scored the face only (section 1 table, section 7 likeness judge).
   - The v19 test paintings from 5 November are in an earlier session's scratch folder (`scratchpad/live/ab/v19-over_the_top-1.img`, `-2.img`). Both show Mowgli lying open-mouthed on a green couch with knitted throws and cushions: Krish's scene.
   - The v19 Warm painting is the same dog lying on a rug. I compared them on one sheet; this comparison is my own visual reading.
   - The throws are the painter's own addition. My guess is it echoed the plaid bandana. That is inferred.

**Before photo first.** On 4 November (commit `211770a`, `hs-journey.js:50-51`) every question came before the photo. `hs_brief_input` then carried breed, pronoun, archetype, home, spot, together, meaning, toys and accessory (`:277-279`), and `composeScene` (`artwork-system.mjs:140-162`) picked the joke from those answers.
- For Krish's answers, v18 produced: "sprawled across the entire couch ... side-eyeing the camera as if you asked to sit down ... exaggerated side-eye ... one brow raised, smug". It also added "his bone" and a plain bandana.
- So the answers did stage the scene, but the face direction rebuilt the face. Judges scored v18 likeness 4 to 5.5, against 7 to 8 for v19.

**Root cause.** Two things together:
- the photo-first sequence paints from style, tone and photo only;
- the v19 Roast staging has no visible sign of who lost out, and the person rule plus the low camera guarantee there is none.

There is also a scope tension: SCOPE.md line 11 promises the gift "reflects its real personality", and SCOPE rule 3 says personality motifs come only from actual answers. v19 Roast gives every dog the same couch whatever the buyer said.

## 3. Options

### (a) A stronger Roast staging, face untouched

Each candidate replaces `brief.likeness.tones.over_the_top` and is followed by the guard and the fill line. All are 743 to 794 characters in total (the field holds 1,200). None contains "stretch", an expression word, an exclamation mark or an em dash, and all use US spelling.

- **R1, "the last few inches"** (strongest at a glance; a person's knees and hand at the frame edge, never a face):
  "Mood: a loving roast, told by the situation, never the face. The dog has the couch and the person has the last few inches. The dog lies at ease across the seat cushions at its own real size and build, completely at home, looking toward the camera, while at the far end of the couch only the person's knees and one hand show at the frame edge, squeezed onto the arm. Scene: a couch at home. Camera: straight on at seat height, the whole couch in view. Light: bright, warm daylight and rich color."
  - The guard needs one tweak so the painter does not drop the person's clothes: "No toy, prop or clothing on the dog that is not in the photo."
- **R2, "your seat, taken"** (no person in frame):
  "Mood: a loving roast, told by the situation, never the face. Seen from where the person stands, about to sit down: the dog is already in their seat, sitting tall and at ease in the exact middle of the couch at its own real size and build, looking up into the camera as if the seat was always the dog's. Scene: a couch at home, nobody else in the picture. Camera: from standing height, looking down at the seat. Light: bright, warm daylight and rich color."
- **R3, "a throne of cushions"**:
  "Mood: a loving roast, told by the situation, never the face. Every cushion in the room is piled under and around the dog in the middle of the couch, a soft throne, and one small, flat cushion is left on the floor in front of it for the person. The dog sits at ease on top at its own real size and build, completely at home, looking toward the camera. Scene: a couch at home. Camera: centered at seat height, the floor cushion in the foreground. Light: a warm golden light and rich, deep color."

Trade-offs:
- R1 reads fastest, but risks badly drawn hands or limbs. On the mug, the person sits toward the handle end.
- R2 carries no anatomy risk, but the point-of-view joke may need a second look.
- R3 is the safest, and the weakest roast.
- On its own, (a) still uses no answer, so the couch stays invented for every dog.

### (b) Ask one question before painting starts: the dog's spot

Spot is the only question that sets the place without adding a prop or changing the face. Its four options (feet, bed, couch, wherever you are) already exist and are already read by the note writer.

- **(b1) On the first gift page (recommended).** Move spot to the first question and hold the send for that one tap, or for 20 s at most.
  - This keeps Krish's home order (photo, look, feel, gifts) and "the painting screen for a few seconds, then the questions".
  - Cost: the photo goes about 2 to 5 s later than today. That is inferred from the earlier session's 5 November buyer logs (`scratchpad/live/runs2-*.log`: send 3 to 7 s after the page opened, reveal 57 to 80 s) and my local question time of about 6 s.
  - Buyers only feel that delay if they finish all nine screens before the painting is back.
- **(b2) On the home page**, as a new step between tone and gifts.
  - No hold logic and no delay to the painting: one more tap of 2 to 4 s.
  - It changes the order Krish ruled, and the forward-only progress line needs re-scaling (the home page would reach 50% and the studio sits at 45%).
- A second question (meaning, "the boss of the house") would only work as attitude, which v19 rightly forbids. I would not add it.

### (c) Other ways, without a second painting

- **The answers on gifts 2 and 3:** those are painted after the questions. That costs no extra painting, but it breaks the matching set and does nothing for single-gift buyers. Rejected.
- **Using the one free repaint with the answers:** that is a second painting. Rejected, except as something the buyer chooses.
- **Reading the place from the photo:** the COCO-SSD detector already sees couches and beds. But the saved prompt says never reuse the photo's background, and it would be a guess, not the buyer's answer. Rejected.
- **The note and the card:** they already carry the answers and the tone. That is true today, but it doesn't change the picture.

## 4. Recommendation: (a) plus (b1)

Paint once, after one tap that says where the dog rules. Then stage every tone in that place, and give Roast a visible loser.

**`tools/print-art/recipes-v1.json`** (version `actual-dog-recipes-v20-place-first`, rebuilt into `shopify/assets/hs-artwork-engine.js` with `build-browser.mjs`)
- Replace `brief.likeness.tones.over_the_top` with the judges' winner (R1 is my default).
- Add `brief.likeness.places = {couch:{sentimental, warm, hilarious, over_the_top}, bed:{…}, feet:{…}}`. "Wherever you are" and no answer fall back to the tone's own text.
  - Non-Roast tones: only the "Scene:" sentence changes, for example "Scene: curled on the bed at home, softly out of focus." / "Scene: on the couch in a bright, lived-in room, softly out of focus." / "Scene: on the rug at the person's feet, softly out of focus."
  - Roast bed (R1 version): "Mood: a loving roast, told by the situation, never the face. The dog has the bed and the person has the last few inches. The dog lies at ease across the middle of the bed at its own real size and build, its head on the person's pillow, completely at home, looking toward the camera, while only the person's shoulder and one arm show at the frame edge, balanced on the very edge of the mattress. Scene: a bed at home. Camera: straight on at mattress height. Light: soft morning daylight and rich color."
  - Roast feet: "... The person is not going anywhere: the dog lies at ease across the person's feet on the rug at its own real size and build, completely at home, looking up toward the camera, and only the person's feet and ankles show at the frame edge, pinned under the dog. Scene: a rug at home. Camera: from slightly above, looking down at the dog. Light: bright, warm daylight and rich color." The camera is not low, so the saved prompt's person rule allows the feet.
- If R1 wins, apply the guard tweak. Optionally fix "cosy" to "cozy" in the Sentimental text (line 904).

**`artwork-system.mjs:243`** `mood = (lk.places && Object.hasOwn(lk.places, o.spot || '') && lk.places[o.spot][o.tone]) || lk.tones[o.tone]`. The blanket branch stays as it is, because its figures carry no setting.

**`hs-journey.js`**
- `ASK = ['spot','name','breed','pro','person','home','together','meaning']`.
- Spot question text without a name: "Your dog's spot when you are home". Today the default possessive is "Their" (`names()`, line 158).
- In `pick()` (line 743), when the group is spot and the mode is gift, call `window.__hs2api.journeyBrief({spot: v})` before `sendAnswers()`.
- In `handOver()` (line 294), set `st.hs_journey.briefHold = queue[0].gift !== 'blanket'`. The blanket is always last in the gift order, so it is first only when it is the only gift.

**`hs2.js`**
- Add `journeyBrief(p)`: only while `journey()` is on and `state.hs_brief_input.frozen` is not set, and only for a spot chip id. It sets `hs_brief_input.spot`, clears `briefHold`, saves and calls `runBridge()`.
- In `journeyAutoSend` (lines 380-404), before the send, return while `j.briefHold && !state.hs_brief_input.spot && Date.now() - start < 20000`. Don't count held ticks toward the 150-try "stuck" limit.
- At the send (line 400), set `hs_brief_input.frozen = true` and save. Gifts 2 and 3 then reuse the same staging, a late answer never changes the fields, and the existing `nativeBlanketInputsReady` gate makes the field carry the spot at the moment of sending.
- Expose `journeyBrief` on `__hs2api` (line 4535).
- The studio line "The painter is getting ready. A few quick questions while it starts." (`hs-journey-choose.js:226`) stays true. No copy change and no new layout.

**Write a new spec** `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-0X-v20.md`. It is theme-only; the saved blocks don't change.

## 5. Tests that fail today and pass after

- **Unit test, `artwork-system.test.mjs`:**
  - for the mug, portrait and card and every tone, `nativeFieldValues({likeness:true, spot:'bed'})` differs from `spot:'couch'` and contains "bed". Today it fails, because the likeness branch ignores spot.
  - "wherever you are" gives the same text as no answer.
  - the blanket's text is identical with or without spot.
  - every text keeps the guard, is at most 1,200 characters, and contains none of /stretch|side-eye|brow|judging|unimpressed|[!—]|cosy|colour/.
  - the Roast couch text names a person part and no low camera.
- **Browser test, `journey-product.browser.test.mjs`:**
  - the first gift opens on `#ask=spot` with `window.__painted === 0`. Today it fails: the send comes at 0.9 s and the first question is `#ask=name`.
  - after tapping "Your side of the bed", the photo is sent exactly once and the Tone direction equals `nativeFieldValues(...spot:'bed')`.
  - going Back and choosing the couch sends nothing and changes no field.
  - a reload sends nothing.
  - the second gift sends without asking, with "bed" in its Tone direction.
  - no answer: one send after the 20 s hold, with the base text.
  - a blanket-only journey sends at once.
- **Existing tests to update deliberately:**
  - `journey-product.browser.test.mjs:131-168`, which asserts the send comes before `#ask=name`;
  - `:371-391`, which starts at `#ask=name`;
  - `journey-flow.browser.test.mjs:181-186`;
  - the v19 spec-hash assertion at `artwork-system.test.mjs:1016`.

## 6. What must stay true, and the risks

- **One painting per gift:** the sent key plus the frozen brief allow no second send.
- **Nothing changes size:** the spot screen already exists.
- **Face lock and Energy unchanged.**
- **The blanket unchanged.**
- **The matching set:** gifts 2 and 3 use the frozen brief.
- **No copy with exclamation marks or em dashes; US spelling.**
- **Risks:**
  - R1's limbs;
  - the recipe hash change makes a painting saved mid-session count as stale at push time, so a buyer mid-journey makes a new one; push at a quiet hour;
  - the hold's real cost on the live store is inferred, not measured.

## 7. How to prove it

About 8 real Teeinblue paintings, with a cap of 10 for one re-roll. At the record's rate (14 for about $1.80) that is roughly $1.30. They go through a test theme with the brief swapped before the send, as on 5 November.

- **Round 1 (3 paintings):** R1, R2 and R3, each on Mowgli, mug, Cinematic, couch. The existing v19 Roast, Warm and Hilarious paintings are the controls.
- **Round 2 (5 paintings), the winner on:**
  - Mowgli, bed, mug;
  - a small dog (the repo's pug photo), couch, portrait;
  - a large or dark-coated dog, feet, mug;
  - plus Warm on Mowgli with bed, and Sentimental on the pug with couch, to cover the scene changes in the calmer tones (and the guard tweak, if R1 wins).

Judging, blind and as in the record:
- A pet portrait artist and the dog's cynical owner score likeness out of 10 against the photo. The pass mark is 7 or more from both.
- A cynical Christmas buyer, never told the tones, sees each dog's paintings unlabeled at phone reveal size, with the four tone names and their one-liners. The candidate Roast must be named Roast by at least 2 of 3 judges. The v19 Roast control is the baseline; I expect it to be mistaken for Warm.
- Every judge answers yes or no: arrogant, grumpy, mean or smug? Any object not in the photo besides the setting? Any human face or malformed limb? Any yes fails the painting.
- Two refuters challenge each pass and each fail.

## 8. Decisions for Krish

1. Hold the first painting for one tap (b1), add a home step (b2), or neither. Either version moves away from v19's rule that the painting starts before any other answer.
2. Whether a person's knees or hand may appear in a Roast painting (R1), or whether he prefers R2 or R3.
3. Approval for 8 to 10 paintings. The 30-painting cap was reached on 5 November.
4. Whether "reads as its tone" becomes a judged gate alongside likeness.

**Live checks still needed:**
- CoWork reads back the four saved blocks to confirm they still match the repo hashes, which settles whether the Teeinblue select really has no effect;
- the painter's open time on the live store with the hold in place;
- whether Teeinblue repaints when a hidden field changes after the send. The freeze makes that question moot, but the answer is still unknown.

Taste: `get_approved_taste` returned no approved rules for Heartside.

Files are in /tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad:
- probe-send-timing.mjs
- roast-view/v19-four.png
- live/ (an earlier session's folder; I refreshed home.html, hs-artwork-engine.js, hs-journey.js, hs2.js and urls.txt there from a plain GET)