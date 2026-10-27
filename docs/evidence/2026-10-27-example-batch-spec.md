# Example batch spec, 27 October 2026

Krish asked for more real examples on the site, showing different personalities and the products in use, from "a small real batch" of the dog photos in the brand Drive. This is the spec. Nothing here has been generated, and nothing runs without his yes in the session that spends.

**Update, later on 27 October.** Krish chose route A and starts the local session himself, which is his yes to the capped spend. He confirmed these are stock photos, not customer photos, so the photos (already in `assets/photos/`), the photo-check fixtures and the finished examples are committed. The runnable job list is `design/examples-2026-10-27/` (19 jobs: the 18 below plus the pug portrait at Warm with a wink for the slider demo; cap 20), with the brief for Codex in its README. Styles: pug Vintage screenprint, poodle Painterly, golden puppy Cut-paper collage.

## What to make

Three dogs, two tones, three products: 18 generations, capped at 20 (two spares for a failed render). About $0.13 each through Teeinblue's Gen AI (OpenAI GPT Image), so about $2.50 in all.

| Dog photo (Drive `02_Imagery/Photos`) | Personality it shows |
| --- | --- |
| Pug in autumn leaves | Comic, low to the ground |
| Red poodle, head tilt | Curious, poised |
| Golden puppy | Soft, sleepy, young |

For each dog: Sentimental and Hilarious, on the mug, the portrait and the blanket. The Teeinblue prompts are the committed ones in `tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md`, applied to the campaigns and read back first. Breed energy for each dog comes from `HSArtworkEngine.energyFor(HSBreeds.lookup(breed))`; the facts are short, plain and true of each photo (for example "Sits in autumn leaves."), never invented habits.

Also, at no cost: Printful's lifestyle mockups for each finished design (the products in use), and one composite test of a favorite-toy reference image, only if Krish chooses to switch on the campaign's reference image for that test.

## How it runs (two routes)

**Route A (recommended, Krish's suggestion).** Krish opens a session on his own computer in the heartside folder (Claude Desktop, or `claude remote-control`). It appears to this cloud session as a peer; the cross-session link may first need his trust confirmation in the Claude app. This session sends it this spec with the cap. That session uses his logged-in Teeinblue (the real pipeline) or his Codex, and returns the images as files: Drive `02_Imagery/Examples-2026-10-27`, or a branch `examples/2026-10-27`. Session messages carry text only, so files travel through Drive or Git. The spend happens only on his yes in that session.

**Route B.** Krish adds `OPENAI_API_KEY` as an environment secret for a new cloud session, which runs `tools/print-art/generate.py` with the same recipe prompts, capped at 20, after his yes. These are checked against one Teeinblue render for parity before use, because they bypass Teeinblue.

## Where they go (no code change needed)

- The first screen's range fan and "Try the slider" demo: the slider's three example notes are section settings today; an image per tone can be added the same way.
- Product galleries, as extra labelled photos after the current ones. Alt text must start "Example" and name the dog as an example, so the gallery and the chat treat them as examples (the chat skips unlabelled photos).
- Every image says Example where it shows. A customer's own design is always their actual artwork ("Your design", the cart line), never an example.

## Acceptance

A person looks at every image before it goes up: likeness to the photo, the tone reads as intended, no words in the painting, no invented props, and the print-safe crop on each product. Rejected images are not regenerated without a new yes.
