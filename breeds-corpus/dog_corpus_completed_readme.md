# Completed dog breed and crossbreed lookup corpus

This package contains **370 canonical entities** and **827 unique normalized lookup queries**. It is designed for broad product grounding on a novelty dog-toy website. It is not a veterinary, training, safety, or deterministic behaviour dataset.

## A. What changed

- Preserved the original 365 canonical records: 344 FCI-grounded breeds, 20 named crosses and one mixed-breed fallback.
- Added five explicit `breed-family` fallback entities: Poodle, Bulldog, Schnauzer, Cocker Spaniel and Sighthound families.
- Added `secondary_dog_type`, `parent_1`, `parent_2` and numeric `lookup_priority` to every canonical row.
- Populated both parents for every named cross. Cross traits remain a parent envelope; they are not calculated averages.
- Expanded aliases with curated abbreviations and short forms, English equivalents, accent-free forms, safe compact forms and selected spelling variants.
- Replaced placeholder pure-breed trait fields with conservative FCI-group and functional-name bands. These are broad product categories, not personality predictions.
- Produced a deduplicated one-query-per-row lookup layer for frontend matching.

Canonical counts: breed 344; crossbreed 20; mixed 1; breed-family 5.

## B. Matching rules

1. Normalize user input: Unicode-decompose accents, lowercase, replace `&` with `and`, remove apostrophes, replace other punctuation with spaces, collapse whitespace and trim.
2. Exact-match the normalized value against `query` in `breed_lookup_normalized`.
3. Use `canonical_id` to retrieve the full row from `dog_corpus_completed`.
4. If no query matches and the user supplied known parents, apply a runtime parent envelope. Do not invent a new fixed crossbreed profile.
5. If the user supplied an ambiguous family term, use a family fallback when that query is not already owned by a specific breed.
6. Otherwise use `mixed-breed` or request a more specific breed. Unknown names must not be forced onto a near spelling without a separately tested fuzzy-match threshold.

The lookup table contains lowercase normalized keys. `display_query` is retained for debugging and UI inspection only.

## C. Reliability model

- **Pure breeds — medium confidence.** Registry identity and FCI grouping are stable. Practical and behavioural bands are deliberately broad and cannot predict an individual dog.
- **Named crosses — low confidence.** Crosses are open-ended. Parent variety, generation and inheritance can change size, coat, shedding, exercise and play style. Use the two parents as an envelope, never as deterministic averages.
- **Family fallbacks — low confidence.** These rows resolve ambiguous input; they are not official breeds.
- **Mixed fallback — low confidence.** Observed size, coat, play style and behaviour should override breed guesses.

Breed is grounding, not destiny. No field supports claims that a dog is always child-safe, aggressive, affectionate, hypoallergenic or otherwise guaranteed to behave in a particular way.

## D. Priority and collision rules

Each alias collision is resolved deterministically by:

1. higher numeric `lookup_priority`;
2. entity class: pure breed, named crossbreed, breed-family fallback, mixed fallback;
3. stable lexical `canonical_id` tie-break.

Assigned priorities are 100 for pure breeds, 80 for named crosses, 50 for family fallbacks and 10 for the mixed fallback. This means a family row can contain an ambiguous alias for documentation while a specific pure breed still owns the production query. 5 cross-entity collisions were resolved during generation; the build writes `collision_audit.json` as a non-deliverable QA artifact.

## E. Suggested frontend usage

```text
normalized = normalize(userInput)
match = lookupByQuery[normalized]
entity = match ? corpusById[match.canonical_id] : corpusById["mixed-breed"]
```

Use the canonical entity's broad fields for toy/product logic. For crossbreeds, surface `parent_1`, `parent_2`, `secondary_dog_type = Parent Envelope` and the uncertainty note. If an exact breed is unknown, prefer an explicit family or mixed fallback over a guessed specific breed.

## Data notes

- `source_urls` and registry metadata from the original corpus were preserved.
- Blank RKC fields mean no RKC mapping was established in this bounded pass; blank does not mean the breed is absent from the Royal Kennel Club.
- Size, exercise, grooming, coat and shedding values are intentionally categorical and sometimes variable.
- CSV files use UTF-8 with BOM for practical spreadsheet compatibility; JSON uses UTF-8.
