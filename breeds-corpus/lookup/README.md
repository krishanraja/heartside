# Breed lookup for the chat

`hs-breeds.js` turns whatever a buyer types as their dog's breed into one corpus row and the name to show them. It is built from the CSVs one folder up. Since 20 Oct the theme loads a copy (`shopify/assets/hs-breeds.js`, re-copy it after a rebuild) for the optional "Breed, if you know it" field on the chat's first step; an exact match's `tone` goes to the AI so the gift lines sound like that kind of dog.

```js
HSBreeds.lookup('Pittie')
// { id: 'american-staffordshire-terrier', name: 'Pit Bull', kind: 'breed', exact: true, tone: 'Terrier Menace' }
HSBreeds.lookup('Labradoor')
// { id: 'mixed-breed', name: 'Mixed Breed', kind: 'mixed', exact: false, tone: 'Rescue Mystery' }
```

- **`name`** is the only field a buyer may see. It comes from `us_display_names.csv`, then the corpus name.
- **`exact`** is false when nothing matched. The chat should treat that as "we don't know the breed", not say "Mixed Breed" back.
- **`tone`** is the primary `dog_type`. The audit allows it only as a light tone signal; never show it.
- Size, exercise and the secondary type are not in the file at all (`AUDIT-2026-10-15.md` found them wrong).

## Rules it follows

1. Normalize as `dog_corpus_completed_readme.md` section B says. It reproduces every one of the 858 corpus and addition keys exactly; letters with no ASCII base (the corpus has "ø") are dropped, as the corpus build did.
2. Krish's call (15 Oct, "pit" added 19 Oct): "pit bull", "pitbull", "pittie" and "pit" show "Pit Bull" and use the American Staffordshire Terrier row.
3. Then `us_lookup_additions.csv`, then `breed_lookup_normalized.csv`, exact match only.
4. No match: if the words name exactly one family ("poodle mix"), that family row; otherwise the mixed-breed row. Never a near spelling.

## Change it

Edit the CSVs or `build.mjs`, then `node build.mjs && node test.mjs`. `node build.mjs --check` fails if `hs-breeds.js` is stale. To wire it into the chat later, copy `hs-breeds.js` to `shopify/assets/` and load it before `hs3.js`.

## Gaps (found 15 Oct, updated 19 Oct)

Of 93 names US owners commonly type, 16 found no exact row on 15 Oct.

**Fixed 19 Oct** (Cowork's rows in `us_lookup_additions.csv` and `us_display_names.csv`, merged in https://github.com/krishanraja/heartside/pull/14): Bloodhound, Great Pyrenees ("pyrenees", "great pyr", "pyr", "pyrenean mountain dog"), Saint Bernard ("st bernard", "St. Bernard"), Samoyed ("sammy"), Dalmatian and Portuguese Water Dog ("pwd"). They were in the corpus under registry names. "Papillon" now shows "Papillon" instead of "Epagneul Nain Continental".

**Still open, on purpose** (`exact: false`, so the chat treats the breed as unknown): Miniature American Shepherd, American Bully, "bully", Catahoula, Plott Hound, Treeing Walker Coonhound, Black Mouth Cur, Mountain Cur and "doodle". The corpus has no row for any of them, and pointing one at a near breed would show the buyer the wrong name.

**Ruled 19 Oct:** "pit" on its own now shows "Pit Bull" on the AmStaff row, beside "pit bull", "pitbull" and "pittie" (Krish).

Mixes such as "lab mix" fall back to the mixed-breed row by design.
