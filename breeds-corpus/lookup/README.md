# Breed lookup for the chat

`hs-breeds.js` turns whatever a buyer types as their dog's breed into one corpus row and the name to show them, and offers checked names while they type. It is built from the CSVs one folder up. The theme loads its own copy (`shopify/assets/hs-breeds.js`), which `node build.mjs` writes too, for the optional "Breed, if you know it" field on the chat's first step. An exact match's `tone` goes to the AI so the gift lines sound like that kind of dog, and the art's breed energy comes from the same lookup.

```js
HSBreeds.lookup('Pittie')
// { id: 'american-staffordshire-terrier', name: 'Pit Bull', kind: 'breed', exact: true, tone: 'Terrier Menace' }
HSBreeds.lookup('Labradoor')
// { id: 'mixed-breed', name: 'Mixed Breed', kind: 'mixed', exact: false, tone: 'Rescue Mystery' }
HSBreeds.suggest('golden retreiver')
// [{ id: 'golden-retriever', name: 'Golden Retriever' }, { id: 'goldendoodle', name: 'Goldendoodle' },
//  { id: 'mixed-breed', name: 'Mixed or not sure' }]
HSBreeds.parents('cavapoo')
// ['Cavalier King Charles Spaniel', 'Poodle']
```

- **`name`** is the only field a buyer may see. It comes from `us_display_names.csv`, then the corpus name.
- **`exact`** is false when nothing matched. The chat should treat that as "we don't know the breed", not say "Mixed Breed" back.
- **`tone`** is the primary `dog_type`. The audit allows it only as a light tone signal; never show it.
- **`parents`** is on a named cross only: what each of its two corpus parents looks up to, one level deep. The art uses it for the cross rule below.
- Size, exercise and the secondary type are not in the file at all (`AUDIT-2026-10-15.md` found them wrong).

## Rules it follows

1. Normalize as `dog_corpus_completed_readme.md` section B says. It reproduces every one of the 858 corpus and addition keys exactly; letters with no ASCII base (the corpus has "ø") are dropped, as the corpus build did.
2. Krish's call (15 Oct, "pit" added 19 Oct): "pit bull", "pitbull", "pittie" and "pit" show "Pit Bull" and use the American Staffordshire Terrier row.
3. Then `us_lookup_additions.csv`, then `breed_lookup_normalized.csv`, exact match only. Each breed's and cross's own display name is an exact query too, when nothing else owns it, so a name the type-ahead offers always finds its own row again.
4. No match: if the words name exactly one family ("poodle mix"), that family row; otherwise the mixed-breed row. `lookup()` never accepts a near spelling.

## The type-ahead: `suggest(text, n)`

Krish, 28 Oct: "There should be some sort of check because I bet tonnes of people will spell things wrong and put in really weird breed names." `HSBreeds.suggest(text, n)` returns up to `n` (default 5) `{ id, name }` choices, and the last one is always `{ id: 'mixed-breed', name: 'Mixed or not sure' }`.

- **Order:** the exact query first ("cavoodle" offers Cavapoo, "pittie" offers Pit Bull), then names that start with what was typed, then other queries that start with it, then names with a later word that starts with it. Within each step, popular breeds come first, then shorter names.
- **"Did you mean":** only when nothing matched as typed, and only for rows in `us_popularity.csv`. It allows 1 edit for 4 or 5 letters and 2 for 6 or more (restricted Damerau-Levenshtein, where swapping two neighboring letters counts as one edit), or, from 6 letters, 1 edit against the start of a longer name, and keeps only the closest spellings found. "golden retreiver" offers Golden Retriever. A near spelling is only ever offered for the buyer to tap; `lookup()` stays exact.
- **Obscure registry names** (for example "Bosanski Ostrodlaki Gonic-barak") are offered only for their exact query or when 5 or more letters match the start of a name.
- **Family rows** ("Poodle family", "Cocker Spaniel family") are never offered by name. Typing "cocker" offers Cockapoo and the English and American Cocker Spaniels.
- "Mixed or not sure" looks up to the mixed-breed row with `exact: false`, so the chat treats it as an unknown breed.

### `us_popularity.csv`

A hand-curated list, made for Heartside on 28 October 2026, of 92 rows (74 breeds and 18 named crosses) that US owners commonly type. It was put together from the 39 common US names checked in `AUDIT-2026-10-15.md`, the rows of `us_lookup_additions.csv` and `us_display_names.csv`, other breeds US owners often have, and the corpus's common named crosses. It is not a published ranking and has no order: it decides only which rows may be offered for a near spelling or from a short start. Each row's `us_display_name` must be the name the file shows, and the build fails if it is not, or if a row is a family or the mixed row. Add or remove rows freely; a change needs no other edit.

## The cross rule

`Ruling (Krish, 2026-10-28): a cross gets a breed energy only when both parents match.` `HSArtworkEngine.energyFor(HSBreeds.lookup(breed))` gives a named cross an energy only when both of its parents, as `lookup().parents` reports them, are exact matches with one archetype; a cross's own archetype (Doodle Wildcard or Parent Envelope) never sets it, and energies are never averaged. With today's corpus that is Maltipoo and Peekapoo (both parents Companion Velcro) and Pomsky (both Spitz Commentator). Every other named cross gets none, Cavapoo and Goldendoodle included, and so does Whoodle, whose Soft Coated Wheaten Terrier parent has no exact row. The chat's `tone` for a cross is unchanged.

## Change it

Edit the CSVs or `build.mjs`, then `node build.mjs && node test.mjs`. `node build.mjs` writes both this folder's `hs-breeds.js` and the theme's copy; `node build.mjs --check` fails if either is stale. `tools/print-art/artwork-system.test.mjs` runs in CI and checks the theme copy against the CSVs, the type-ahead, the parents and the cross rule, on the file as written and as minified. Keep the generated file ES5 (the test parses it as ES5) and small (under 60 KB).

## Gaps (found 15 Oct, updated 28 Oct)

Of 93 names US owners commonly type, 16 found no exact row on 15 Oct.

**Fixed 19 Oct** (Cowork's rows in `us_lookup_additions.csv` and `us_display_names.csv`, merged in https://github.com/krishanraja/heartside/pull/14): Bloodhound, Great Pyrenees ("pyrenees", "great pyr", "pyr", "pyrenean mountain dog"), Saint Bernard ("st bernard", "St. Bernard"), Samoyed ("sammy"), Dalmatian and Portuguese Water Dog ("pwd"). They were in the corpus under registry names. "Papillon" now shows "Papillon" instead of "Epagneul Nain Continental".

**Still open, on purpose** (`exact: false`, so the chat treats the breed as unknown): Miniature American Shepherd, American Bully, "bully", Catahoula, Plott Hound, Treeing Walker Coonhound, Black Mouth Cur, Mountain Cur and "doodle". The corpus has no row for any of them, and pointing one at a near breed would show the buyer the wrong name.

**Seen 28 Oct, not fixed:** "Italian Greyhound" finds its row but shows the registry name "Piccolo Levriero Italiano", so it is left off the popular list until `us_display_names.csv` gives it a US name. Common misspellings that need more than two edits, such as "chiwawa" and "daschund", get no "did you mean".

**Ruled 19 Oct:** "pit" on its own now shows "Pit Bull" on the AmStaff row, beside "pit bull", "pitbull" and "pittie" (Krish).

Mixes such as "lab mix" fall back to the mixed-breed row by design.
