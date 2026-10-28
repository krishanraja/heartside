# The slider moves the painting: example art on the first screen, 28 October 2026

Krish, 28 October: "go ahead, wire them in behind the switch, just set them to on". Ruling (Krish, 2026-10-28): the example paintings go live with the switch on.

## What went live

[krishanraja/heartside#62](https://github.com/krishanraja/heartside/pull/62) was merged as `f30565e` and pushed to the live theme through the guarded workflow. The same change had first passed Part A on the unpublished "Heartside redesign preview" copy.

- **"Try the slider".** It now swaps the pug portrait painted at each tone (Sentimental, Warm with a wink, Hilarious) along with the example note.
- **"Same slider, every gift".** A new strip shows:
  - the golden retriever mug at Sentimental and Hilarious;
  - a Sentimental portrait;
  - a Sentimental blanket;
  - the pug mug at Hilarious.
- **Labels.** Every picture is labelled as an example, and the note says they are stock photos of dogs.
- **What is on the page.** Only the eight images kept in [`design/examples-2026-10-28/review.md`](../../design/examples-2026-10-28/review.md), as listed in `site.json` and built by `tools/print-art/example-assets.py`.
  - The two that read Warm instead of Hilarious stay off.
  - `examples-site.test.mjs` fails if any image is on the page without its job and its kept review, or sits at the wrong tone.
- **The switch.** All of this sits behind the gift section's `examples_on` setting, which is on in `templates/index.json`.

The examples were made with the single-direction prompts. CoWork applied that [prompt spec](../../tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md) to the three campaigns later on 28 October and read back its hashes. Part 1.1 of the [current CoWork prompt](../review/COWORK-LIVE-ACCEPTANCE.md) now applies the stated-toy spec that follows it.

## Readback on production

- `preview-acceptance.mjs` on heartside.io: all clear at 390 × 844 and 1280 × 900.
- `live-gate.mjs`: all clear at desktop, phone and Instagram sizes.
- Slider and strip, at both sizes:
  - each slider position shows the image painted at that tone (0, 1, 2), and every image loads;
  - no sideways scroll and no script errors.
- Screenshots checked by eye.
  - At phone size, the three pug portraits read as three different moods:
    - a settled, closed-mouth look for Sentimental;
    - a bright open smile for Warm;
    - a leap through flying leaves for Hilarious.
  - At 1280 wide, the strip's three tiles sat lower than the mug pair, with their tops and captions out of line. The follow-up makes the desktop strip one row of five pictures of exactly one height. Phone is unchanged.

Every browser check refused requests to n8n and anything that is not a GET, so no paid AI ran and nothing was uploaded or ordered.

## Not proved

- **Real orders.** That a real order paints with the chosen tone and style. The prompt spec is now applied, and the mock orders in Part 3 of the CoWork prompt are the check.
- **Conversion.** Whether the examples change conversion. The number to watch is Shopify net sales, trailing four weeks.
