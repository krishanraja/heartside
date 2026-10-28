# Framed-print production trial

This is the deterministic part of the approved city-screenprint print route. It
is a **trial**, not an automatic order fulfiller or a live product promise.
The upstream image model still needs an approved, metered order-time route,
and the final file still needs a person's print-proof review.
The exploratory edits used built-in ChatGPT Images. Runway and Higgsfield are
reserved for acquisition artwork and video unless a later production test
shows a concrete advantage for order fulfillment.

Inputs: the buyer's original dog photo; their four approved gift lines and dog
name; an optional place explicitly supplied by the buyer; and a generated
2:3 scene based on the original photo and `prompt.txt`. The generator must not
write words into the image. `build.py` creates the exact note and decorative
paw on a separate layer so model spelling cannot reach the print. A generic
paw silhouette is illustration, not a claimed impression of that dog's paw.

This trial's route, not the live one, is: paid Shopify order remains unfulfilled; operator obtains
the photo and note from that order; image generation and 300 DPI preparation;
human likeness check; `build.py` creates 3600 x 5400 PNG; human checks the
entire file at final size; operator uses Teeinblue's **Upload custom design**
on that order; checks its replacement print file; and only then uses Teeinblue's
**Confirm & Send to fulfill**. Teeinblue's public API is documented for order
reads, not custom-design writes, so the upload remains an operator step until
we have a documented write route. No step confirms fulfillment automatically.

For the current *fictional* proof in the scratch folder:

```text
python tools/print-art/prompt_for_order.py <order-manifest.json> <private-prompt.txt>
python tools/print-art/generate.py <order-manifest.json>
python tools/print-art/generate.py <order-manifest.json> --execute
python tools/print-art/build.py <order-manifest.json> <print.png>
python tools/print-art/test_build.py
python tools/print-art/test_generate.py
```

`prompt_for_order.py` creates the exact image-editing prompt before generation.
It uses an optional buyer-supplied city or neighborhood name as scene context;
it never reads or derives a place from the delivery address. Reject punctuation
that would turn the place into model instructions. The print proof records the
rendered prompt hash. A person still compares the actual generated picture
with the original photo and reviews geographical plausibility; a prompt hash
does not prove the provider followed it.

`generate.py` is dry-run by default. With `--execute` and a key supplied by the
approved runtime, it makes one GPT Image 2.5 Sunburst edit from a metadata-free
copy of the buyer's dog photo and the approved place only. It sends no order
number, delivery address or gift lines. It writes the raw model image, a
3600 x 5400 prepared background, and a receipt containing hashes, elapsed
time and any usage returned by the provider. It never makes a second call
against the same output path. If the provider times out or the result cannot
be validated, a `.pending.json` marker blocks automatic retry because the
first call may already have been billed. An operator must reconcile it.
The generated image still requires human likeness and print review before
`build.py` or fulfillment. Keep every input and output in private order storage.

The manifest keys are `mode` (`test` or `production`), `style`
(`city-screenprint-v1`), `source_photo`, `background`, `dog_name`,
`place_source` (`buyer` or `none`), `place`, and `lines` with `home`, `spot`,
`together`, `meaning`. Production mode also needs `order_ref` and
`likeness_reviewed_by`. The proof JSON records input, exact-note, prompt and
output hashes, dimensions, file size, review status and the fact that
fulfillment has not been confirmed. Keep customer
manifests, photos, backgrounds, outputs and receipts in approved private
order storage, never in this repository or a pull request.

The compositor rejects low-resolution input, wrong ratio, too-long lines,
inferred places, and production output without a named likeness reviewer. A
4× upscale of a 1024 x 1536 concept produced a 4096 x 6144 test background;
the final trial PNG was 3600 x 5400, tagged 300 DPI with an embedded sRGB
profile, and 32.5 MB. That proves
the file dimensions and note placement, **not** true photographic detail,
identity preservation across many dogs, or physical print quality.

For paid-order production, the preferred image trial is a direct ChatGPT Images
edit after payment. The request is 2336 x 3504, a 2:3 source with 8,185,344
pixels. It fits the API's 8,294,400-pixel limit and needs a 1.541× resize to
the print canvas. Resolutions above 2560 x 1440 are experimental, so this
request still needs a real API acceptance and quality test. The built-in trial images here came back at 1024 x 1536;
they cannot establish the larger API route's quality, time or billed cost.
Test a real metered request and inspect its usage before selecting a model or
quoting unit economics.

Before launch, test at least five varied dog photos and places with the same
prompt and output route. Reject changed markings, distorted anatomy, wrong
landmarks, unreadable note, missing words, trim conflicts, more than 60 MiB,
and any discrepancy between the Shopify order, Teeinblue replacement and
Printful draft. Time and cost each stage on those same cases. Keep live orders on the native Teeinblue route until this trial's full route, buyer-facing preview honesty and a physical sample pass.

The exact original-photo URL and line-item structure this adapter would read in a paid Shopify order have not been proven. The test orders placed on 27 and 28 October used Shopify's test gateway and did not run this adapter. Do not automate
order intake by guessing those properties. The first real sample, scheduled
last in the revamp, must read back the source photo, four exact lines, name,
and replacement design under the same order reference before this adapter is
implemented.

An isolated native Teeinblue trial now exists, recorded in
`teeinblue/draft-artwork.json` and
`docs/evidence/2026-10-23-compose-native-artwork.md`. Krish connected and
validated OpenAI. The saved provider setting is GPT Image 2.5 Sunburst / High;
the draft photo effect requests 3840 resolution with the layer's 2:3 ratio.
Actual output dimensions and billed usage are not yet verified. The native
layout follows the approved single small meaning-line target and links the
signature to the dog's name. The older four-line local compositor above
remains a test route, not the current native design target.

The native proof renderer verified changed wording and a long signature, but
does not execute upload effects. Real photo uploads have run since: the first native Screenprint on 24 October in a private campaign, then Krish's own test and four of CoWork's five mock orders on 28 October through the live campaigns. The fifth, on Android, failed because the photo never added. The
account's five-upload-per-buyer-per-option hourly limit is not a financial
hard cap, and account auto fallback can change the actual model. Generation before payment has been live since the 27 October release, at about $0.13 a painting (`docs/ECONOMICS.md`). Generations per order are still to be measured from provider usage, and painting latency and abuse controls are still unmeasured. The draft campaign now carries the live portrait product.

Primary supplier instructions, checked 23 October 2026:

- [Edit an order and upload a custom design](https://support.teeinblue.com/en/article/order-details-1ldm1um/)
- [Manually confirm and send an order to Printful](https://support.teeinblue.com/en/article/send-orders-to-fulfillment-providers-zqp1s0/)
- [Teeinblue order API scope](https://support.teeinblue.com/en/article/public-api-to-retrieve-teeinblue-data-1e3y72c/)
- [Photo-based AI effect and buyer variable behavior](https://support.teeinblue.com/en/article/how-to-use-gen-ai-effect-feature-to-create-custom-image-effects-l8mqej/)
- [Image effect output sizes and costs](https://support.teeinblue.com/en/article/gen-ai-effect-faqs-1t47d9o/)
- [Printful print-file and color-profile guidance](https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results)
- [Printful wall-art safe-area guidance](https://help.printful.com/hc/en-us/articles/50264024409233-What-is-the-safe-print-area)
- [Caveat font](https://github.com/google/fonts/blob/main/ofl/caveat/METADATA.pb), OFL license in `fonts/`.
- [OpenAI image model dimensions and cost guidance](https://developers.openai.com/api/docs/guides/image-generation)
