# Breed example batch, 29 October 2026

Every gift we can show today is the same pug. This batch paints six popular breeds, one in each of the six styles, and each breed in all four tones of the slider: Sentimental, Warm, Hilarious and Over the top. The tones rotate across the portrait, the blanket and the mug, so every tone appears on every gift. Each dog has a toy and something it wears, so the accessories show too.

| Dog | Breed | Style | Sentimental | Warm | Hilarious | Over the top |
|---|---|---|---|---|---|---|
| Maple | Golden Retriever | Painterly | Portrait | Mug | Blanket | Portrait |
| Bear | Labrador Retriever | Cinematic | Blanket | Portrait | Mug | Blanket |
| Bao | French Bulldog | Comic book | Mug | Blanket | Portrait | Mug |
| Clover | Goldendoodle | Vintage screenprint | Portrait | Mug | Blanket | Portrait |
| Frank | Dachshund | Fine ink drawing | Blanket | Portrait | Mug | Blanket |
| Juno | German Shepherd | Cut-paper collage | Mug | Blanket | Portrait | Mug |

- `jobs.json`: 24 paintings in two stages. **Stage 1** has 6: one per breed, each in a different tone and gift, so every style and every tone is seen once. **Stage 2** has the other 18 and runs only after a person has reviewed stage 1.
- `prompts/<id>.txt`: the complete painting prompt for each job, built by `tools/print-art/breed-batch.mjs`. It is the store's own painting prompt with its fields filled exactly as the storefront fills them. The dog's moment is the one-sentence brief the phone builds from the buyer's taps, which is also in `jobs.json` as `brief`. Never edit a prompt by hand. `node tools/print-art/breed-batch.mjs --check` fails if one is stale.

**Approval.** Nothing is generated until Krish says yes to that stage and its count, below. Every asset is labelled Example wherever Heartside uses it, and a person reviews each one before use.

## The brief for the growth session

Send this unchanged, with the stage number filled in.

> You are making the example creative for Heartside, a store that paints a buyer's own dog onto a mug, a sherpa blanket or a framed portrait, with a short line from the dog. These assets will be used on the website, in paid ads, in organic social posts and as recurring dog characters, so make them clean, consistent and reusable.
>
> **Source.** The job list is `design/examples-2026-10-29-breeds/jobs.json` in the `krishanraja/heartside` repository, and each job's prompt is at its `prompt_file`. Run only the jobs whose `stage` is `<N>`.
>
> **Where to put things.** Work in your own repository. Put everything under `assets/heartside-examples-2026-10-29/`, with the folders named below, and do not push to heartside. When a stage is done, reply with that folder's path and the commit, and Heartside copies the approved files across.
>
> ### Step 1. The reference photo (stage 1, once per breed)
> Find one real photo of the breed under a free licence, such as Unsplash or Pexels. Choose a single dog, face clearly visible, good light, no people, and no text or watermark. Save it as `photos/<dog>.jpg`, with `<dog>` being the job's `dog` value. Record the photographer, the source URL and the licence in `credits.json`. Never use a generated dog as the photo: it stands in for a real customer's dog.
>
> ### Step 2. The painting (one per job)
> 1. Use the photo as the reference for the dog's identity only: the same face, ears, coat colour and markings, the same proportions. Do not copy its pose, framing or background.
> 2. Use the full text of the file at `prompt_file` as the prompt, unchanged. Do not shorten, summarise or add to it.
> 3. Generate one image at `size` with the same image model the store's painter uses (OpenAI's image model, as an edit from the photo), at its highest quality.
> 4. If it comes back in another shape, crop to `size` around the dog. Never add bars, borders or padding.
> 5. Save it as `paintings/<id>.png`. This is the master: everything below is made from it, and the painting itself is never repainted or restyled.
>
> ### Step 3. Reusable cuts of each painting
> - `cutouts/<id>.png`: the dog alone, from the painting, on a transparent background, at full resolution. These are used for stickers, ad overlays and the recurring characters, so make the edges clean.
> - `crops/<id>-1x1.png` (1080×1080), `-4x5.png` (1080×1350) and `-9x16.png` (1080×1920): the painting fitted to each ratio. Extend only the background where the painting is too small, in the painting's own style, and never alter the dog. Keep the dog's face inside the middle 80% so captions and buttons don't cover it.
>
> ### Step 4. Product mockups (the main deliverable)
> Place the master painting onto Heartside's real products. Composite the painting image itself as the product's printed surface, following the product's curve, folds or frame, so the painting stays exact. Never regenerate the art inside the mockup. Products, as sold on heartside.io:
> - **Mug** (`/products/your-dogs-illustrated-mug`): 11 oz white ceramic, with the inside and handle in black, dark blue, dark green, red or pink. The painting wraps the side, and the handle is on the right.
> - **Blanket** (`/products/your-dogs-personality-blanket`): 50 × 60 inch sherpa fleece, printed edge to edge, with no words.
> - **Portrait** (`/products/your-dogs-portrait`): a 12 × 18 inch vertical print in a simple thin frame.
>
> Each job's painting goes on its own `format` gift. Make three scenes per painting:
> 1. **Studio:** the product alone on a soft cream background, evenly lit. This is the shop shot.
> 2. **Home:** the product in a real, lived-in home moment that fits the tone:
>    - Sentimental: quiet morning light.
>    - Warm: a cheerful kitchen or sofa.
>    - Hilarious: a bright, playful setting.
>    - Over the top: a grand, theatrical setting, such as velvet, gold light or a spotlight.
> 3. **In hand:** the mug held in two hands, the blanket draped over a sofa arm, or the portrait being hung on a wall. Hands and arms are fine; show no faces.
>
> Save each scene at 1:1, 4:5 and 9:16, as `mockups/<id>/<scene>-<ratio>.png`. The scene is `studio`, `home` or `hand`; the ratio is `1x1`, `4x5` or `9x16`.
>
> **The set, once per breed:** that breed's three gifts together, the mug, the blanket and the portrait, each carrying one of that breed's paintings, in one home scene. This is the bundle shot. Save it as `mockups/<dog>-set/home-<ratio>.png` at all three ratios.
>
> ### Step 5. The manifest
> Write `manifest.json`: one entry per file, with:
> - `file`, `job` (or the dog, for a set), `breed`, `style`, `tone`, `gift`;
> - `kind`: `painting`, `cutout`, `crop`, `mockup` or `set`;
> - `scene` and `ratio`;
> - `uses`: any of `site`, `ad`, `social`, `character`.
>
> ### Rules for every asset
> - No words, letters, logos, watermarks or signatures anywhere. Heartside adds the dog's line and any captions itself, so leave the mug's and the portrait's text area as on the product, plain.
> - No props, costumes or accessories beyond the ones in the job's `brief`. No other dogs. No people's faces.
> - The dog in every asset is exactly the dog in its painting.
>
> ### Limits
> - Stage 1: at most 6 paintings, 6 cutouts and 18 mockup scenes.
> - Stage 2: at most 18 paintings, 18 cutouts, 54 mockup scenes and 6 sets.
> - Ratio variants and crops are edits of an image you already made, not new generations.
> - One attempt per item and no retries. Report anything that failed instead.
> - When finished, list every job id with its paintings, cutouts and mockups, and whether each is done or failed, with the reason for any failure.

## What Heartside does with them

- **Product pages and the gift chooser:** Heartside places each approved painting on its own Printful product mockups, so the site matches what Printful prints. The growth session's mockups are for ads, social posts and the landing page.
- **Style cards:** each breed's best painting becomes the example for its style.
- **The landing example and the profile screen:** they show the buyer's own breed where one exists, and fall back to the nearest breed group.
- **Captions:** every placement says Example.

## Review before use

For each painting, a person checks the following, and the same checks apply to every cutout, crop and mockup made from it:
- It is the same dog as the photo.
- There are no words or signatures.
- Nothing appears that the brief does not name.
- The mood reads as its tone at a glance:
  - **Sentimental:** quiet and tender.
  - **Warm:** bright, with one small beat.
  - **Hilarious:** one clear comic premise.
  - **Over the top:** grand, theatrical and smug.
- The whole image is in its medium.
- On a mockup, the painting is unchanged.

Write one line per job in `review.md`: kept or rejected, and why. A rejected item is not regenerated without a new yes from Krish.
