# Example batch, 28 October 2026

The 27 October batch (`../examples-2026-10-27/`) showed that the tone barely changed the picture: the pug's Sentimental, Warm and Hilarious portraits read the same, and both Hilarious mugs read Sentimental. The golden puppy mostly came out photographic instead of Cut-paper collage, and every image was padded with solid bars. The prompts listed every style, tone and energy and asked the model to pick one; the 28 October prompts carry only the chosen mood, medium and energy, put the mood first, and tell the model to use the photo for who the dog is, not for how the picture looks.

- `jobs.json`: 10 jobs in two stages, cap 10. **Stage 1** (cap 3): the pug portrait at Sentimental, Warm with a wink and Hilarious. **Stage 2** (cap 7), only after a person has seen stage 1 show three clearly different moods: the pug and poodle Hilarious mugs, and the golden puppy's mug, portrait and blanket at Sentimental and its mug and portrait at Hilarious, all in Cut-paper collage.
- `prompts/<id>.txt`: the complete prompt for each job, built by `tools/print-art/example-batch.mjs` from the single-direction prompts in `tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md`, the ones these images were painted from. The batch is closed: the script no longer rewrites it, and `node tools/print-art/example-batch.mjs --check` fails if a prompt is not its spec block with the fields filled. Never edit a prompt by hand.

Every image is an Example on the site, and a person reviews each one before it is used.

## The brief for Codex

Send this to Codex unchanged, with the stage number filled in.

> Generate the stage `<N>` example images for Heartside, a store that makes illustrated gifts of people's dogs. The job list is `design/examples-2026-10-28/jobs.json` in this repository. Run only the jobs whose `stage` is `<N>`. For each, in order:
>
> 1. Use the photo at `photo` as the reference for the dog's identity only: the same face, ears, coat color and markings, the same proportions. Do not copy the photo's pose, framing or background unless the prompt asks for it.
> 2. Use the full text of the file at `prompt_file` as the prompt, unchanged. Do not shorten, summarize or add to it.
> 3. Generate one image at `size` with your image generation tool at its highest quality, as an edit or reference generation from the photo.
> 4. If the image comes back in another shape than `size`, crop it to `size` around the dog. Never add solid bars, borders or padding.
> 5. Save it as a PNG at `output`, creating `design/examples-2026-10-28/out/` if needed.
>
> Hard limits: at most 3 generations for stage 1 and 7 for stage 2, one per job, no retries. Never add text, watermarks, logos or signatures. Do not change any other file. When finished, list every job id with its output path and done or failed (with the reason).

## Review before use

For each image, a person checks the four relay checks (same dog, no words or signatures, no invented props or costumes, the file exists) and two more: the mood reads as its tone at a glance (Sentimental quiet and tender, Warm with a wink bright with one small beat, Hilarious one clear comic premise), and the whole image is in its medium. One line per job in `review.md`: kept or rejected, and why. Rejected images are not regenerated without a new yes from Krish.
