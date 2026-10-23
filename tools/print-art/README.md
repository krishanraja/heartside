# Framed-print production trial

This is the deterministic part of the approved city-screenprint print route. It
is a **trial**, not an automatic order fulfiller or a live product promise.
The upstream image model still needs an approved, metered order-time route,
and the final file still needs a person's print-proof review.

Inputs: the buyer's original dog photo; their four approved gift lines and dog
name; an optional place explicitly supplied by the buyer; and a generated
2:3 scene based on the original photo and `prompt.txt`. The generator must not
write words into the image. `build.py` creates the exact note and decorative
paw on a separate layer so model spelling cannot reach the print. A generic
paw silhouette is illustration, not a claimed impression of that dog's paw.

The current route is: paid Shopify order remains unfulfilled; operator obtains
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
python tools/print-art/build.py <order-manifest.json> <print.png>
python tools/print-art/test_build.py
```

`prompt_for_order.py` creates the exact image-editing prompt before generation.
It uses an optional buyer-supplied city or neighborhood name as scene context;
it never reads or derives a place from the delivery address. Reject punctuation
that would turn the place into model instructions. The print proof records the
rendered prompt hash. A person still compares the actual generated picture
with the original photo and reviews geographical plausibility; a prompt hash
does not prove the provider followed it.

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

Before launch, test at least five varied dog photos and places with the same
prompt and output route. Reject changed markings, distorted anatomy, wrong
landmarks, unreadable note, missing words, trim conflicts, more than 60 MiB,
and any discrepancy between the Shopify order, Teeinblue replacement and
Printful draft. Time and cost each stage on those same cases. Use the current
framed print until the full route, buyer-facing preview honesty and a physical
sample pass.

The exact original-photo URL and line-item structure in a paid Shopify order
have not been proven because no new v3 order has been placed. Do not automate
order intake by guessing those properties. The first real sample, scheduled
last in the revamp, must read back the source photo, four exact lines, name,
and replacement design under the same order reference before this adapter is
implemented.

Teeinblue also offers an in-artwork GPT Image effect that transforms a buyer's
photo on upload, with place variables and a reference image. This is a viable
future live-preview experiment, but generation before a paid order creates a
credit-exposure and latency problem. It would need a connected image-provider
key, a per-buyer upload limit, measured conversion benefit, and tests that its
roughly 1024 x 1536 output can be made print-safe. Do not switch it on merely
because the integration exists.

Primary supplier instructions, checked 23 October 2026:

- [Edit an order and upload a custom design](https://support.teeinblue.com/en/article/order-details-1ldm1um/)
- [Manually confirm and send an order to Printful](https://support.teeinblue.com/en/article/send-orders-to-fulfillment-providers-zqp1s0/)
- [Teeinblue order API scope](https://support.teeinblue.com/en/article/public-api-to-retrieve-teeinblue-data-1e3y72c/)
- [Photo-based AI effect and buyer variable behavior](https://support.teeinblue.com/en/article/how-to-use-gen-ai-effect-feature-to-create-custom-image-effects-l8mqej/)
- [Image effect output sizes and costs](https://support.teeinblue.com/en/article/gen-ai-effect-faqs-1t47d9o/)
- [Printful print-file and color-profile guidance](https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results)
- [Printful wall-art safe-area guidance](https://help.printful.com/hc/en-us/articles/50264024409233-What-is-the-safe-print-area)
- [Caveat font](https://github.com/google/fonts/blob/main/ofl/caveat/METADATA.pb), OFL license in `fonts/`.
