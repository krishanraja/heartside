# Social ads and the link card, 10 November 2026

Krish, 10 Nov: "We need to improve this social card drastically ASAP." His Facebook ad was still showing the October card: the retired worded print, ornaments and pillows. Built in code by `tools/print-art/social_ads.py` from the approved room sets (`shopify/assets/hs-hero-*-1080.webp`). The pictures are only scaled and cropped. Per Krish's 2 Nov ruling, they carry no Example badge in a post.

| File | Size | Use |
| --- | --- | --- |
| `a-feed-4x5.jpg` | 1080x1350 | Facebook and Instagram feed ads. The lead creative |
| `a-square-1x1.jpg` | 1080x1080 | Feed and posts where 4:5 is not offered |
| `a-story-9x16.jpg` | 1080x1920 | Stories and Reels |
| `a-link-1200x630.jpg` | 1200x630 | The link preview heartside.io gives (Shopify's social sharing image, `share-1200x630.jpg` in Files) |
| `b-feed-4x5.jpg`, `b-square-1x1.jpg` | 1080x1350, 1080x1080 | Second concept, "Any dog": six dogs on their gifts. Use it as an A/B test or a carousel card |

Concept A is "A note from Maple". The golden's room, with the dog painted on the mug, the blanket and the portrait, sits under the headline "Your dog loves you too." The dog's note is on a slip of paper ("Sam, I saved your spot. It is also my spot. Love, Maple"), which delivers what the ad text promises ("in your dog's own words"). The strip at the bottom says "Order by Dec 4 for Christmas" and "Free US shipping on every gift", with heartside.io in the logo heart's pink.

The note's words are the site's own example line (`sections/hs-journey.liquid`, Maple's mug for Sam). After December 4, change `DEADLINE` in the script and rebuild.

## To put them live on Facebook

1. In Ads Manager, open each ad, choose **Edit media**, and upload `a-feed-4x5.jpg` (with `a-story-9x16.jpg` for Stories). An ad made from an old post keeps that post's image until its media is replaced.
2. For links shared organically, open the Sharing Debugger (developers.facebook.com/tools/debug), paste https://heartside.io and press **Scrape Again**, so Facebook drops its cached preview.

Rebuild: `python3 tools/print-art/social_ads.py --out design/social-ads-2026-11-10`. Check: `--check design/social-ads-2026-11-10`.
