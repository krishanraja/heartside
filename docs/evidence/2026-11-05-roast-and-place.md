# Roast and the place answer, through Teeinblue (5 November 2026)

Krish, 5 November: "I picked roast for this particular painting and that hasn't really come through in the artwork. Nor do the other data inputs seem to have." His rulings: one question on the home page after the feel (where the dog rules the house), and Roast tested in two person-out-of-frame directions with about 8 to 10 real paintings, judged blind. Investigation: `docs/review/asks-2026-11-05/roast-report.md` and `roast-review.md`. Spec: `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-05-v20.md`.

## How it was run

- Ten paintings in total, the approved ceiling, at about $0.13 each.
- Each one went through Teeinblue's own painter on heartside.io, on the live v19 theme. The test page swapped only the Tone direction's mood text before the send; the live engine wrote the guard and the fill line.
- Each run stopped at the painting. Nothing was added to a cart, no n8n host was called, and the saved Tone direction was read back from the page and matched the candidate every time.
- The photo was Krish's own Border Collie on the mug, in Cinematic, and the repo's pug photo on the portrait.
- Three blind judges scored each round against the photo: a pet portrait artist, a cynical Christmas buyer and the dog's cynical owner. All three are AI personas, so this is triage, not an independent verdict.

## Round 1: the two ruled directions and the shipped control

| Painting | Likeness (artist / buyer / owner) | Reads as Roast (artist / buyer / owner) |
|---|---|---|
| v19 Roast as shipped | 6 / 7 / 7 | yes, just / maybe / strongest, but the body is stretched (all three) |
| "your seat, taken" 1 | 6 / 8 / 8 | no / no / weak |
| "your seat, taken" 2 | 7 / 8 / 6.5 | no / no / weak, plus a stray paw (two judges) |
| throne of cushions 1 | 7 / 8 / 8.5 | weak / maybe / moderate; the owner's pick for their own mug |
| throne of cushions 2 | 7 / 7 / 7.5 | weak / maybe / moderate |

"Your seat, taken" was dropped. The judges' shared advice: show where the person was pushed out, and get the takeover from the pose, not from stretching the body.

## Round 2: the throne, improved, in each place

| Painting | Likeness (artist / buyer / owner) | Reads as Roast | Body |
|---|---|---|---|
| the whole small couch, throw on the floor, 1 | 6 / 5 / 7 | weak / maybe / yes | stretched (all three) |
| the whole small couch, throw on the floor, 2 | 6 / 6 / 7 | weak / maybe / yes | stretched (all three) |
| **bed: the person's side, pillows under the dog, comforter pushed back** | **7 / 7 / 8** | **yes, mild / maybe, the buyer's pick / yes, the clearest, the owner's pick** | **right** |
| feet: the pug on the couch's cushions on the rug (portrait) | 7 / 7 | no: reads Sentimental, "needs to be in the person's spot" | slightly |
| Warm on the bed (control for a calm tone with a place) | 7 / 8 / 7 | correctly read as Warm, "made for a different tone" | slightly |
| throne of cushions 1 again (round-1 best) | 7 / 7 / 8 | weak | right |
| v19 Roast as shipped again | 6 / 6 / 7 | no / no / weak to yes | stretched |

## What v20 ships

- **Bed:** the round-2 winner.
- **Couch, "wherever you are" and no answer:** the throne of cushions. It is the tested text that keeps the dog's real build; its Roast is weak to moderate.
- **Feet:** the tested floor-cushion text. It keeps the place the buyer chose, but its Roast reads weakly.
- **Sentimental, Warm and Hilarious:** each place changes only the Scene sentence. Warm on the bed was painted and read as Warm; the rest are untested in paint.

## Open, for Krish

- Krish's own blind pick is the gate. The sheet of all ten paintings is in the session's scratch folder, not in the repo.
- A stronger couch Roast in the bed winner's pattern (the person's own corner, the cushions under the dog, the couch's throw on the floor, no armrest-to-armrest pose) is untested. Two or three paintings would settle it, and they need his approval.
- Likewise for the feet: the judges say the dog has to be in the person's own spot for the joke to land, which the "feet" answer does not give.

## Later the same day: lettering proposed and cancelled, then the wink

- **Krish's picks from the blind sheet:** 2 and 7, both the cushion throne. That is the couch text on main. "None of them really look like roast as such."
- **Couch tests:** three more paintings tried a couch Roast in the bed winner's pattern. The gain was small, and nothing changed.
- **Lettering on the Roast mug:**
  - Proposed: a Teeinblue text layer. The AI never paints letters.
  - Mockups: a stress test of four handwritten fonts on 12 backgrounds found that where the words sit matters more than the font.
  - Cancelled by Krish the same day: "It's going to add way too many more variables that might go wrong, not to mention design issues, and we don't have time for that."
- **The wink:**
  - Krish: "maybe winking or like a cheeky grin, something a bit more anthropomorphic". Smug was ruled out, since v18's smug face cost the likeness.
  - Four paintings, approved by Krish, on the cushion throne on his Border Collie's mug. Roast had its own face rule ("only the expression is playful. Never grumpy, mean, smug or exaggerated.").
  - The wink showed in both of its paintings, with the face, ears, blaze, bandana and build unchanged.
  - The cheeky grin looked unchanged, because the photo already grins.
  - Krish: "Wink 1 is good." It ships as recipes v21 (`tools/print-art/teeinblue/PROMPT-SPEC-2026-11-05-v21.md`).
  - Not yet painted with the wink: the bed and feet scenes, the portrait and the card.
