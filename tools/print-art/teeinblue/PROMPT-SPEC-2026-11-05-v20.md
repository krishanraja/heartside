# Painter prompt spec v20: the place first, and a Roast you can see (5 November 2026)

Recipe version `actual-dog-recipes-v20-place-first`, recipes SHA-256 `b7f9f69c4dd77e9580e0e5427a90647e186a4705a3a9d92c5cf00f8b25126c94`. It follows v19 (`PROMPT-SPEC-2026-11-04-v19.md`).

Status: theme-only. It ships with the next theme push. Nothing changes in Teeinblue: the four saved blocks are byte for byte v19.

## Why

Krish, after his phone run on 5 November: "I picked roast for this particular painting and that hasn't really come through in the artwork. Nor do the other data inputs seem to have. Is this because of where the painting is happening in comparison to where the data collection is happening?"

Yes, for the answers. On the photo-first path the painter starts before any question is asked, so name, breed, pronoun, person, home, spot, together and meaning only ever shaped the note. Roast did reach the painter, but v19's Roast text described a relaxed, content dog on a couch in warm light. That reads as Warm. Investigation and review: `docs/review/asks-2026-11-05/roast-report.md` and `roast-review.md`.

Rulings (Krish, 5 November):
- One question on the home page, after the feel: where the dog rules the house (the couch, the bed, your feet, wherever you are). The painting uses that place for every gift, with no wait on the gift page.
- Roast is tested in two person-out-of-frame directions, "your seat, taken" and "a throne of cushions", with about 8 real Teeinblue paintings, judged blind against the photo.

## What changed

1. **The place stages every tone** (`brief.likeness.places`), on the mug, the portrait and the card. Each cell replaces the tone's own text:
   - **Sentimental, Warm and Hilarious:** only the "Scene:" sentence changes. For example, Warm on the bed: "Scene: on the bed in a bright bedroom at home, softly out of focus."
   - **Roast:** the cell carries the whole staging below.
   - **No answer, or "wherever you are":** the tone keeps its own scene.
   - **The blanket:** unchanged. Its figures stand on a plain ground with no setting.
2. **Roast shows who lost out, told by the situation alone, with nobody in the picture** (SCOPE rule 3: the person stays out of frame).
   - **Bed** (the round-2 winner): "The dog has taken the person's side of the bed for itself: every one of the bed's own pillows is piled up under it, and it lies at ease on top at its own real size and build, while the bed's own comforter lies pushed half off onto the floor."
   - **Couch, and the tone's own scene:** "a throne of cushions". "Every one of the couch's own cushions is piled up in the middle of the couch into a soft throne, and the dog sits at ease on top at its own real size and build ... with only the bare seat left for anyone else."
   - **Feet:** "The dog has taken the floor in front of the couch for itself, right where the person's feet go: every one of the couch's own cushions is pulled down and piled up on the rug under it ..."
   - The cushions and pillows are named as the furniture's own, so the guard ("No toy, clothing or prop that is not in the photo") stays byte for byte v19 and does not contradict them.
3. **"Cosy" becomes "cozy"** in Sentimental's own scene (US spelling).

The face lock (Energy), the guard and the fill line are unchanged. Every older path (`likeness` absent) is byte for byte v18.

## Field limits

Across every style, tone, format and place, Tone direction is at most 769 of the field's 1,200 characters, and Energy is 261 of 300.

The four saved blocks, byte for byte as v19:
- mug `aa41590e9e59effb331bbea91d4064a1eb5c3eb7c6bfa47f595a7144041194c6`;
- portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`;
- blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`;
- card `1868aab7a1bf48770259028da9c443ada62311ae4cb0b0c004af5d34bfebacbd`.

## Verified

Ten paintings went through Teeinblue's own painter on the live store, with the brief swapped in the browser before the send and nothing added to a cart. Three blind judges (a pet portrait artist, a cynical Christmas buyer and the dog's cynical owner, all AI personas, so this is triage, not an independent verdict) scored them against the photo. Record: `docs/evidence/2026-11-05-roast-and-place.md`.

| Painting | Likeness (artist / owner) | Reads as Roast (artist / buyer / owner) | Body length |
|---|---|---|---|
| v19 Roast as shipped (control) | 6 / 7 | yes, just / maybe / yes | stretched (all three) |
| "your seat, taken", 2 paintings | 6 to 7 / 6.5 to 8 | no / no / weak | right |
| throne of cushions, couch, 2 paintings | 7 / 7.5 to 8.5 | weak / maybe / moderate | right |
| throne, the whole small couch, throw on the floor, 2 paintings | 6 / 7 | weak / maybe / yes | stretched (all three) |
| **bed: the person's side, pillows under the dog** | **7 / 8** | **yes, mild / maybe, the buyer's pick / yes, the owner's pick** | **right** |
| feet, a pug on the couch's cushions on the rug (portrait) | 7 (artist) | no: reads Sentimental | slightly |
| Warm on the bed (a calm tone with a place) | 7 / 7 | correctly read as Warm | slightly |

"Your seat, taken" is dropped. The whole-couch throne is dropped because it stretched the body again, the defect v19 removed. Hilarious and Sentimental with a place, and every place on the portrait and card, are untested in paint; their change is one scene sentence each.

## Not yet proven

- The couch and feet Roast read only weakly. The judges' common advice is to put the dog in the person's own spot with a visible sign that the person was there (the bed winner's pattern). A couch text in that pattern is proposed in the evidence record and needs a few paintings and Krish's approval.
- Krish's own blind pick of which painting reads as Roast is the gate; the AI judges are triage.
