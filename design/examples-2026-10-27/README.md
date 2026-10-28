# Example batch, 27 October 2026

Krish asked for real examples on the site that show different personalities and the slider at work. This folder holds the jobs; the images come back into `out/` from a local Claude session that sends them to Codex (route A in `docs/evidence/2026-10-27-example-batch-spec.md`).

- `jobs.json`: 19 jobs, cap 20. Three stock dogs (photos already in this repository under `assets/photos/`; Krish confirmed they are not customer photos), each in one style: the pug in Vintage screenprint, the poodle in Painterly, the golden puppy in Cut-paper collage. Each dog appears in Sentimental and Hilarious on the mug, the portrait and the blanket, plus the pug portrait at Warm with a wink, so the slider demo can show one dog at all three stops.
- `prompts/<id>.txt`: the complete prompt for each job. It is the committed Teeinblue prompt (`nativePrompt` in `tools/print-art/native-candidate.mjs`) with its four fields filled exactly as the storefront fills them: style, tone, energy from the breed (pug and poodle `devoted-close`, golden retriever `eager-open`), and personality facts that are plain and true of the photo.
- This batch is kept as generated. `tools/print-art/example-batch.mjs` neither rebuilds nor checks it. Never edit a prompt by hand.

The example names (Waffles, Rosie, Maple) are labels for examples only. Every image is shown on the site as an Example, and a person reviews each one before it is used.

## The brief for Codex

Send this to Codex unchanged.

> Generate 19 example images for Heartside, a store that makes illustrated gifts of people's dogs. The job list is `design/examples-2026-10-27/jobs.json` in this repository. For each job, in order:
>
> 1. Use the photo at `photo` as the reference image. The dog in the result must be that exact dog: same face, ears, coat color and markings, same proportions.
> 2. Use the full text of the file at `prompt_file` as the prompt, unchanged. Do not shorten, summarize or add to it.
> 3. Generate one image at `size` with your image generation tool at its highest quality, as an edit or reference generation from the photo, not text alone.
> 4. Save it as a PNG at `output`, creating `design/examples-2026-10-27/out/` if needed.
>
> Hard limits: at most 20 image generations in total. A job may be retried once only if the result clearly shows a different dog, contains words, letters or a signature, or failed to generate, and only while the total stays at or under 20. Never add text, watermarks, logos or signatures. Do not change any other file. When finished, list every job id with its output path and one of: done, retried, or failed (with the reason).

## Review before use

For each image, a person checks: the dog is recognizably the photo's dog; the tone reads as intended (Sentimental quiet and tender, Hilarious one clear comic beat, Warm with a wink in between); no words, letters or signatures in the art; no invented props, costumes or places; the mug keeps its right third quiet for the note. Record one line per job in `review.md`: kept or rejected, and why. Rejected images are not regenerated without a new yes from Krish.
