# Tone pipeline test board, 29 October 2026

Recipes v15 gives every corpus archetype a character for each tone and lets a composer pick the comic scene from every answer the buyer tapped. This board is how Krish judges it before any buyer sees it: six archetypes, one breed and one style each, every one in all four tones, all on the portrait so the tones compare like for like. He judges each picture at the $119 standard: it reads as its tone at a glance, and it feels like that dog. Only what he approves is kept.

**Count: 24 paintings.** Nothing is painted until Krish says yes to this count. An optional A/B adds **12 control paintings**, the Hilarious and Over the top cases as v15 ships with both ruling switches off; the Sentimental and Warm controls are identical to the board prompts, so they need no painting.

| Archetype | Breed | Style | Taps (home, spot, together, meaning, toy, wears) |
|---|---|---|---|
| Retriever | Golden Retriever | Painterly | brings something, couch, coffee, best friend, tennis ball, bandana |
| Terrier Menace | Jack Russell Terrier | Comic book | spins, couch, walk, boss of the house, squeaky toy, collar |
| Sighthound Sofa Missile | Greyhound | Vintage screenprint | plays it cool, couch, naps, shadow, stuffed toy, sweater |
| Scent Detective | Beagle | Fine ink drawing | waits at the door, feet, walk, best friend, rope toy, harness |
| Herding Manager | Border Collie | Cut-paper collage | waits at the door, wherever you are, walk, shadow, frisbee, bandana |
| Spitz Commentator | Siberian Husky | Cinematic | plays it cool, bed, movie, boss of the house, big stick, harness |

- `board.json`: the 24 cases, with the taps, the breed's archetype as `characterFor(HSBreeds.lookup(breed))` gives it, the scene the composer picked and why (`scene`: the answer, whether it was the archetype's own take, and its score), the one-sentence brief the phone would show, and the three filled fields.
- `prompts/<id>.txt`: the board prompt, the store's own portrait prompt filled exactly as the storefront fills it, with both proposed ruling switches on (`recipes.brief.character.rulings`).
- `control/<id>.txt`: the same case as v15 ships, both switches off.
- Built by `node tools/print-art/pipeline-test-board.mjs`; `--check` fails if any file is stale. Never edit a prompt by hand.

## How to paint it, once Krish says yes

Use the breed example method in `design/examples-2026-10-29-breeds/README.md`, Steps 1 and 2 only: one real photo per breed under a free licence, credited; the photo for who the dog is, never how the picture looks; the full prompt unchanged; one image at `size` with the store's image model; one attempt per case, no retries; save as `out/<id>.png`. No cutouts, crops or mockups for the board.

## What Krish is deciding with it

1. Whether the archetype's own take may shape the Hilarious and Over the top situation (`archetypeScenes`). Compare `prompts/` with `control/` on the 12 comic cases.
2. Whether a Hilarious archetype scene may add the one small prop its joke names (`jokeProp`). On this board two cases carry one: the Terrier's tiny dictator (a tiny podium) and the Scent Detective on the walk (a small magnifying glass).
3. Whether the character lines read as that breed in Sentimental and Warm. These ship on; they shape only mood, pose and expression.

Each picture gets one line in `review.md`: kept or rejected, and why.
