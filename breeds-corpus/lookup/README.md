# Breed lookup for the chat

`hs-breeds.js` turns whatever a buyer types as their dog's breed into one corpus row and the name to show them. It is built from the CSVs one folder up and is not loaded by the theme yet: the chat has no breed question (Krish, 15 Oct: don't add one yet).

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
2. Krish's call (15 Oct): "pit bull", "pitbull" and "pittie" show "Pit Bull" and use the American Staffordshire Terrier row.
3. Then `us_lookup_additions.csv`, then `breed_lookup_normalized.csv`, exact match only.
4. No match: if the words name exactly one family ("poodle mix"), that family row; otherwise the mixed-breed row. Never a near spelling.

## Change it

Edit the CSVs or `build.mjs`, then `node build.mjs && node test.mjs`. `node build.mjs --check` fails if `hs-breeds.js` is stale. To wire it into the chat later, copy `hs-breeds.js` to `shopify/assets/` and load it before `hs3.js`.

## Gaps found on 15 Oct (for the next data pass)

Of 93 names US owners commonly type, these find no exact row: Bloodhound, Great Pyrenees, Saint Bernard (and "st bernard"), Samoyed, Dalmatian, Portuguese Water Dog, Miniature American Shepherd, American Bully, "bully", "pit", Catahoula, Plott Hound, Treeing Walker Coonhound, Black Mouth Cur, Mountain Cur and "doodle". The first six are in the corpus under registry names, like the nine the audit fixed. "Papillon" matches but shows "Epagneul Nain Continental". Mixes such as "lab mix" fall back to the mixed-breed row by design.
