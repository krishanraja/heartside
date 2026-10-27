# Tone drives the imagery on every gift, with breed energy and buyer-tagged toys

October 27, 2026. Status: implemented in the recipes, preparation engine, facts profile, product-page copy, native prompt candidates and tests. Not deployed to the theme, not applied to any Teeinblue campaign, not committed. No image was generated and no model or vendor service was called.

## Owner rulings

- `Ruling (Krish, 2026-10-27): the tone slider drives the imagery on every gift (mug, portrait and blanket), not only the words. Supersedes the 24 Oct tone routing.`
- `Ruling (Krish, 2026-10-27): the breed corpus archetype sets the dog's energy (mood, pose, expression). Props and habits come only from what the buyer told Buddy or uploaded. Amends SCOPE rule 3.`
- Krish's instruction the same day: buyers can tag a favorite toy and a collar or accessory, each with a short plain-text description they type, with no AI step.

The recipes record both rulings in `ownerRuling` fields (`toneRouting.ownerRuling` and `energy.ownerRuling` in `tools/print-art/recipes-v1.json`). The 24 October record, `2026-10-24-tone-routing.md`, stays as history. Whoever commits this change should carry both ruling lines in the commit body. SCOPE rule 3 now reads, in effect: personality motifs and props come only from actual answers or uploads; breed may set the dog's energy, meaning its mood, pose and expression, and never a habit or prop. The text of `docs/SCOPE.md` itself was outside this change and still needs that amendment.

## What changed

| Area | Before | Now |
|---|---|---|
| Recipes | `actual-dog-recipes-v3-painted-dog`. Tone changed only the words on mug and portrait; their art used fixed Warm staging. | `actual-dog-recipes-v4-tone-imagery`, recipe SHA-256 `52e7b1132c1e7cd4fb1f9e77d6e99d0a2b68ccee204cb3e01722ebf77c25bb74`. The selected tone drives the art on every format. Each tone has its own staging, expression, light, composition and humor level. A new `energy` section maps every breed archetype to a mood and pose modifier or to none. |
| Engine (`artwork-system.mjs`) | `imageKey` used Warm for text products, so a tone change reused mug and portrait art. | `imageKey` includes the selected tone and the energy code on every format. Exact note and signature stay out of it and remain deterministic text layers on mug and portrait. Payload version 3. New `energyFor(lookup)`. `selectTone` reports `newArtworkNeeded`. |
| Facts | Four sources, at most four facts. | Adds `toy` and `accessory` (buyer-typed, at most 80 characters each), at most six facts and one per source, inside the same 1600-character serialized limit. Breed, energy and any other source are still rejected. |
| Facts profile (`hs-artwork-profile.js`) | Read chat chips and typed answers. | Also reads plain strings `s.toy` and `s.accessory`, collapses whitespace, and omits rather than cuts an over-long description. Exposes `HSArtworkProfile.limits`. |
| Browser engine (`hs-artwork-engine.js`) | Generated from v3. | Regenerated with `node tools/print-art/build-browser.mjs`. Exports `energyFor`. Parity check passes. |
| Native prompts (`native-candidate.mjs`) | Mug and portrait carried a fixed Warm direction and no tone placeholder. | All three campaigns read `{{Artwork tone}}` and a new `{{Energy}}`, with energy placed after `{{Personality}}`. The candidate template adds a hidden `Energy` text layer that defaults to `none`. The exact text and hashes are in `tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md`. |
| Product-page copy (`hs-artwork-choices.js`) | "Your artwork stays the same." | "Tone sets the mood of the painting and the words." The word-free blanket and the native note variants have their own versions, and every variant ends: "After you create artwork, changing the tone means making a new version." |
| Six-style packet compiler | Substituted option ids and had no Energy value. | Substitutes option labels, which is what `hs2.js` selects, and `Energy: none`. Its expected portrait prompt hash moves from `add9201...` to `7e555957...`. |

### Tone art direction

| Tone | Humor | Staging and expression | Light and composition | Guard |
|---|---|---|---|---|
| Sentimental | None | Quiet, tender moment; dog settled and close; soft, relaxed eyes and gentle gaze | Low warm golden side light, muted palette; uncluttered, generous space, face as focus | No invented event, grief, tears, illness or sad dog |
| Warm with a wink | Light, one gentle beat | Bright everyday moment; one small wink toward a stated habit, toy or accessory, or in the expression only | Clear warm daylight; lively but balanced, slightly off center | Keeps a warm portrait rather than inventing a joke |
| Hilarious | High, one clear premise | Exaggerates the drama or scale of a stated thing, never the anatomy or the fact; with nothing stated, comedy comes from pose and expression alone | Bright, punchy, high contrast; close or low viewpoint, bold diagonals | No fear, pain, illness, danger, humiliation, scolding or invented costume |

Identity, grounding and the negative rules stay first in every prompt. A shared tone header says identity, stated facts and format geometry take precedence over the tone. Tests require each tone to name all five dimensions and to contain none of the listed object words.

## Why props and habits stay buyer-only

Breed is grounding, not destiny (`breeds-corpus/dog_corpus_completed_readme.md`). A breed tells you how dogs like this one often carry themselves. It cannot tell you that this Beagle steals socks or that this Retriever fetches. Drawing a breed-typical prop on a real dog puts a stranger's habit on it, and the buyer sees at once that the gift is about a breed, not about their dog. That breaks the promise the North Star rests on: a gift that sounds, and now looks, like their dog.

So the energy modifier changes only mood, posture, pose and expression. It enters the prompt after identity and the quoted facts, and its rule forbids adding or implying any prop, object, toy, food, clothing, activity, habit, place or scene. Directions are tested against a list of object and place words. The energy code is not a fact: a `breed` or `energy` fact is rejected by the engine and dropped by the profile. Toy and accessory descriptions are the buyer's own words, quoted as JSON data, and a typed instruction stays quoted data.

## Energy map

Energy comes from `energyFor(HSBreeds.lookup(breed))`. Only an exact corpus match carries an archetype. The code is a neutral word because `hs-breeds.js` says the archetype is never shown, and a form value might be visible somewhere in the order.

| Archetype (internal) | Code | Direction |
|---|---|---|
| Herding Manager | `alert-focused` | Alert and attentive: head up, eyes bright and focused just past the viewer, a poised, ready posture or an upright sit. |
| Retriever | `eager-open` | Open-hearted and eager: soft, shining eyes, a relaxed open-mouth smile, body angled warmly toward the viewer. |
| Doodle Wildcard | `poised-playful` | Poised and a little theatrical: chin slightly lifted, a pleased, knowing expression, a composed sit or a light playful head tilt. |
| Companion Velcro | `devoted-close` | Devoted and close: an adoring gaze fixed on the viewer, a gentle head tilt, a snug, leaning-in posture. |
| Terrier Menace | `bold-cheeky` | Bold and cheeky: chest out, chin up, a confident, mischievous look, a proud, planted stance. |
| Scent Detective | `curious-unhurried` | Curious and unhurried: nose slightly forward, a calm, interested gaze, a relaxed, settled posture. |
| Spitz Commentator | `cool-independent` | Self-possessed and dry: a composed sideways glance, a faintly unimpressed, knowing expression, an upright, dignified sit. |
| Sighthound Sofa Missile | `elegant-languid` | Elegant and languid: one long, relaxed line through the body, a gentle, dreamy expression, a graceful recline or a quiet stand. |
| Guardian | `steady-calm` | Steady and calm: a grounded, square posture, a level, kind, watchful gaze, quiet strength with no threat display. |
| Working Goofball | `joyful-bouncy` | Joyful and wholehearted: a big open grin, a loose, slightly clumsy, bouncy posture full of happy energy. |
| Parent Envelope | none | Named two-parent crosses. The breed file carries no parent archetypes, and energies are never averaged. |
| Rescue Mystery | none | Mixed or unknown breed. The buyer's own details decide. |

Energy is also none when the buyer typed no breed or a name with no exact match ("lab mix", "Labradoor", "catahoula"), and for any lookup whose kind is `mixed`. These twelve archetypes are every archetype present in `shopify/assets/hs-breeds.js`, and a test fails if that file gains one the map does not cover. One judgment call: named doodle crosses such as Goldendoodle keep the Doodle Wildcard energy, because the note writer already gives them that voice. Setting `"Doodle Wildcard": null` in the recipes drops it.

The shared energy rule also keeps ear shape and carriage, muzzle, eyes, coat and markings unchanged. When the photo does not establish the body, it keeps a head and shoulders view and carries the energy in the face and head.

## What this means for the buyer

Tone is now part of the image identity on every gift. On mug and portrait, changing the tone after artwork exists no longer reuses that artwork. The preview becomes stale, and the buyer must deliberately make a new version, which is a new billed generation. Selecting a tone still dispatches nothing, and the single-request guard and no-automatic-retry rules are unchanged. Editing only the exact words still reuses the matching image. The product-page helper now says so, and the engine's `selectTone` returns `newArtworkNeeded` so the storefront can say it at the moment of change.

The storefront scripts that send values to Teeinblue (`shopify/assets/hs2.js`, and `hs3.js` for sharing the energy code and collecting the toy and accessory) were outside this change. Until `hs2.js` sends the selected tone, mug and portrait still send `Warm with a wink`. For that reason `toneRouting.textProductImageTone` stays in the recipes as a deprecated value. The engine ignores it, and removing it before `hs2.js` changes would make `answer('art_tone')` throw on mug and portrait pages. One integration test describes the required `hs2.js` staleness behavior and is marked TODO until that change lands. A dry run of the proposed `hs2.js` edits on an in-memory copy passed those assertions.

## Test evidence

Run on October 27, 2026, Node v22.22.0, in this working tree.

| Command | Result | Exit |
|---|---|---|
| `node --test tools/print-art/*.test.mjs tools/preview/artwork-integration.test.mjs` | 58 tests: 57 pass, 0 fail, 1 todo (the `hs2.js` staleness test above) | 0 |
| `node tools/preview/artwork-profile-test.mjs` | PASS | 0 |
| `node tools/print-art/build-browser.mjs --check` | Browser engine matches source | 0 |
| `python3 tools/print-art/test_build.py` | print-art safety and 300 DPI output passed | 0 |
| `python3 tools/print-art/test_generate.py` | passed without an API call | 0 |
| `node --test tools/preview/*.test.mjs` (wider check) | 228 tests: 227 pass, 0 fail, 1 todo (baseline before the change: 227 of 227) | 0 |
| `node tools/preview/minify-check.mjs` | All assets minify | 0 |
| `node tools/print-art/prepare-six-style-test.mjs` | Six unique fingerprints, no network | 0 |

New assertions cover these cases:

- Three distinct image keys and prompts per format, one per tone.
- Words-only edits keep the image key on every format.
- Each tone names all five dimensions, with no object words and explicit distress guards.
- Every archetype in `hs-breeds.js` is mapped, and unknown, mixed and two-parent breeds get none.
- Energy changes the image key on every format, sits after identity and facts, never appears in facts, and rejects unlisted codes.
- A `breed` fact is still rejected, and `energy`, `tone` and `dog_type` facts are rejected too.
- Toy and accessory are accepted at 80 characters and rejected or omitted at 81.
- Six facts are the maximum, one per source, and six maximum-length plain facts fit within 1600 characters.
- The spec's prompt blocks equal `nativePrompt()` exactly, with matching SHA-256.
- The candidate template's hidden Energy layer exists.
- The new product-page copy contains no "stays the same", no exclamation mark and no em dash.
- Browser and Node engines produce identical results for 180 configurations, with and without energy and toy and accessory facts.

## Not verified

- No generation was run. Likeness, whether each tone reads as intended, humor quality and whether energy matches the dog all need the example batch and a person's review against the source photos.
- Teeinblue was not changed. The new prompts are about 9,100 characters, against about 4,300 before, and no vendor prompt limit is recorded. Applying them is a vendor change in Krish's browser session with his approval, followed by hash readback, as the spec describes.
- Expected placeholder substitution is not provider-observed substitution. How Teeinblue treats an empty text layer, and whether form-only values appear to buyers in cart or order properties, are unknown.
- The 24 October six-style screen's expected prompts and fingerprints change with this contract. Whether that conditional approval carries over is Krish's decision. This note does not amend it.
- If heavy quoting pushes the facts past 1600 characters, the whole profile still falls back to no facts, as before. Ordinary typed answers fit.
- `docs/SCOPE.md` rule 3 and `NOW.md` were not edited.

North Star check: holds. This makes the art more personal and more shareable, which serves "most orders come from people who saw someone else's", but it moves no sales by itself. No revenue change is claimed.
