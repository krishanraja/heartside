# Bundle offer, free redo and Artist's touch economics, October 27, 2026

This is a modeled scenario, not realized margin. It evaluates three owner decisions from October 27 in the offline model in `tools/economics/`. Nothing live changed: no Shopify discount, product, price, theme, Teeinblue or Printful setting, no AI generation and no order. No external service was called. The live Shopify bundle discount, the in-cart redo and the Artist's touch product each need Krish's explicit approval immediately before anything is created or activated.

**North Star part this moves:** Shopify net sales, trailing four weeks (U4 at the last measured checkpoint: $0 against $250 for the week of October 26). A multi-gift offer raises order value for buyers shopping for more than one person. This note checks which versions keep those added sales above the 30% floor, so the extra net sales are profitable. It measures no sales.

## Decisions evaluated

1. Bundle offer: 15% off when 2 gifts are bought, 20% off when 3 or more are bought.
2. One free artwork redo per gift once it is in the cart, at most one extra generation per gift.
3. Paid "Artist's touch" add-on: Krish reworks the design by hand, adding 5 days, at $19, $24 or $29.

## Policy and how to read the results

- Owner ruling, October 26: maximize total net operating profit subject to a 30% modeled all-cost net operating margin floor. The 50% rule is superseded ([pricing ruling](2026-10-26-pricing-ruling.md), [economics](../ECONOMICS.md)).
- The floor applies to the aggregate order mix. A per-basket pass or fail below is a conservative guardrail, not the policy itself. A basket below 30% can sit inside a mix that clears 30%, but only if other orders carry the gap.
- **Min paid** is the model's minimum paid revenue for a 30% modeled margin on that basket: fixed costs divided by (1 minus variable rate minus 0.30), rounded up to cents. **Headroom** is the paid price at the tier (list times one minus the discount, rounded down) minus min paid. Positive passes.
- 25 orders per 30 days is a sensitivity, not a demand forecast. Overhead is spread over it.

## Inputs and evidence status

Shared by every stack:

| Input | Value | Status | Source |
|---|---|---|---|
| List prices | mug $45 (5 inside colors), unframed 12x18 $59, framed 12x18 $119, 50x60 sherpa blanket $129 | configured, read back October 27 | `NOW.md` |
| Supplier base per gift | mug 8.11, unframed 11.62, framed 32.77, blanket 35.76 | observed sample | Printful Basic-order unpaid quotes, Brooklyn NY, October 24 (`calibration.json`) |
| Supplier shipping, one gift | mug 6.69, unframed 4.99, framed 10.89, blanket 13.99 | observed sample | same quotes; shipping is free to US buyers, so the business bears it |
| Supplier shipping, mug + frame and mug + blanket | 17.58 and 20.68 | observed sample | basket quotes; each equals the sum of its single-item shipping |
| Supplier shipping, every other basket | sum of single-item shipping | assumption | no combined quote; same-product additional-item rates may be lower, so the sum is conservative |
| Holiday surcharge | $0.40 per Printful order, once per basket | rate verified; one-order routing is an assumption | Printful account email, October 15 2026 to January 17 2027 |
| Teeinblue customization fee | $0.40 per customized line; each gift is its own line | assumption (order ordinal 101) | Blue plan schedule in `net_margin.py`; the conservative tier is held for the whole scenario |
| Supplier tax | 1.35 mug, 1.51 unframed, 3.92 framed, 4.45 blanket; 5.23 and 5.76 for the two quoted baskets; other baskets summed | observed sample, or assumption when summed | zero in set A; borne in set B and the bounding case |
| Payment | 2.9% of paid revenue plus $0.30 per order | verified | Shopify plan page, October 24 |
| Refund and remake reserve | 3% of paid revenue | assumption | `calibration.json` |
| Free redo | $0.13 per gift, one generation | assumption | observed provider usage about $0.123 to $0.127 per artwork generation |
| Customer sales tax, business profit tax | 0 | assumption | both unknown in `calibration.json` |

The two operating sets, run side by side and never merged:

| Input | Set A: repo working sensitivity | Set B: `docs/ECONOMICS.md` lines 13 to 15 |
|---|---:|---:|
| AI per order, before the per-gift redo | $0.50 | $2.50 (pre-purchase) |
| Review and support per order | $2.00 | $5.00 |
| Acquisition per order | $10.00 | $0 (no paid acquisition) |
| Overhead per 30 days before the checkout app | $142.01 | $200.01 |
| Printful supplier tax | 0 | borne (delivered-quote basis) |
| Checkout app, $69 per 30 days | run without (A) and with (A+app) | run with, as stated (B), and without (B-app) |

All set values are sensitivity assumptions, not measured costs. Set B is this model's implementation of the inputs `docs/ECONOMICS.md` states. Its $200 is read as total fixed operating cost before the app, and itemized overhead is topped up to that amount. The private report behind `docs/ECONOMICS.md` is not in this repository, and the formula the pricing ruling summarizes differs from this model, so its aggregate figures are not reproduced here. The bounding case (A+app+tax) is set A with the app and supplier tax borne: the harshest combination of the two sets' assumptions, labeled as such and not a third set. `calibration.json` values were not edited. New sensitivities are in `supplier-tax-sensitivity.json`, `economics-md-sensitivity.json` and `checkout-app-sensitivity.json`.

| Key | Stack | Files applied in order | Fixed cost per order before items | Overhead per 30 days |
|---|---|---|---:|---:|
| A | Repo working sensitivity, no checkout app | working-sensitivity.json | 18.89 | 142.01 |
| A+app | Repo working sensitivity plus the USD69/month checkout app | working-sensitivity.json, checkout-app-sensitivity.json | 21.65 | 211.01 |
| B-app | ECONOMICS.md set without the checkout app | working-sensitivity.json, economics-md-sensitivity.json, supplier-tax-sensitivity.json | 16.21 | 200.01 |
| B | ECONOMICS.md set as stated, with the checkout app | working-sensitivity.json, economics-md-sensitivity.json, supplier-tax-sensitivity.json, checkout-app-sensitivity.json | 18.97 | 269.01 |
| A+app+tax | Bounding case: repo set with the checkout app and supplier tax borne | working-sensitivity.json, supplier-tax-sensitivity.json, checkout-app-sensitivity.json | 21.65 | 211.01 |

## Result at the decided tier

Two-gift baskets at 15%, three-gift baskets at 20%. Each stack cell gives min paid / headroom and the verdict.

| Basket | Mix | Gifts | List | Tier | Paid at tier | A min paid / headroom | A+app min paid / headroom | B-app min paid / headroom | B min paid / headroom | A+app+tax min paid / headroom |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| mug_and_frame | MF | 2 | 164.00 | 15% | 139.40 | 122.31 / +17.09 pass | 126.62 / +12.78 pass | 126.29 / +13.11 pass | 130.60 / +8.80 pass | 134.78 / +4.62 pass |
| mug_and_blanket | MB | 2 | 174.00 | 15% | 147.90 | 131.82 / +16.08 pass | 136.12 / +11.78 pass | 136.62 / +11.28 pass | 140.93 / +6.97 pass | 145.11 / +2.79 pass |
| mug_and_unframed | MU | 2 | 104.00 | 15% | 88.40 | 80.11 / +8.29 pass | 84.42 / +3.98 pass | 80.40 / +8.00 pass | 84.70 / +3.70 pass | 88.88 / -0.48 FAIL |
| unframed_and_blanket | UB | 2 | 188.00 | 15% | 159.80 | 134.64 / +25.16 pass | 138.94 / +20.86 pass | 139.76 / +20.04 pass | 144.06 / +15.74 pass | 148.24 / +11.56 pass |
| frame_and_blanket | FB | 2 | 248.00 | 15% | 210.80 | 176.84 / +33.96 pass | 181.14 / +29.66 pass | 185.72 / +25.08 pass | 190.02 / +20.78 pass | 194.20 / +16.60 pass |
| unframed_and_frame | UF | 2 | 178.00 | 15% | 151.30 | 125.14 / +26.16 pass | 129.44 / +21.86 pass | 129.43 / +21.87 pass | 133.73 / +17.57 pass | 137.92 / +13.38 pass |
| two_mugs | MM | 2 | 90.00 | 15% | 76.50 | 77.29 / -0.79 FAIL | 81.60 / -5.10 FAIL | 77.32 / -0.82 FAIL | 81.63 / -5.13 FAIL | 85.81 / -9.31 FAIL |
| two_unframed | UU | 2 | 118.00 | 15% | 100.30 | 82.94 / +17.36 pass | 87.24 / +13.06 pass | 83.47 / +16.83 pass | 87.77 / +12.53 pass | 91.96 / +8.34 pass |
| two_frames | FF | 2 | 238.00 | 15% | 202.30 | 167.34 / +34.96 pass | 171.64 / +30.66 pass | 175.39 / +26.91 pass | 179.69 / +22.61 pass | 183.87 / +18.43 pass |
| two_blankets | BB | 2 | 258.00 | 15% | 219.30 | 186.34 / +32.96 pass | 190.65 / +28.65 pass | 196.04 / +23.26 pass | 200.35 / +18.95 pass | 204.53 / +14.77 pass |
| mug_frame_blanket | MFB | 3 | 293.00 | 20% | 234.40 | 200.75 / +33.65 pass | 205.06 / +29.34 pass | 211.74 / +22.66 pass | 216.04 / +18.36 pass | 220.22 / +14.18 pass |
| mug_unframed_blanket | MUB | 3 | 233.00 | 20% | 186.40 | 158.55 / +27.85 pass | 162.86 / +23.54 pass | 165.78 / +20.62 pass | 170.08 / +16.32 pass | 174.26 / +12.14 pass |
| three_mugs | MMM | 3 | 135.00 | 20% | 108.00 | 101.21 / +6.79 pass | 105.51 / +2.49 pass | 103.34 / +4.66 pass | 107.65 / +0.35 pass | 111.83 / -3.83 FAIL |

## Failing baskets

- **Two mugs (MM) at 15% fails in every stack:** -0.79 in A, -5.10 in A+app, -0.82 in B-app, -5.13 in B and -9.31 in the bounding case.
- Across all 65 mixes of 2 to 4 gifts, MM is the only failure at the decided tiers in A, A+app, B-app and B.
- **The bounding case adds two failures:** mug + unframed at 15% (-0.48) and three mugs at 20% (-3.83).
- **Thin passes:** three mugs at 20% clears by only $0.35 in B and $2.49 in A+app. Mug + unframed at 15% clears by $3.70 in B and $3.98 in A+app.
- **Two-gift baskets at 20%** (in case of a later change) fail more widely. MM fails in every stack. MU also fails once the app is included in either set. MB fails in B and the bounding case, and MF fails in the bounding case. Two-gift baskets should stay at 15%.

## Proposed discount conditions

| Rule | A failing mixes | A+app failing mixes | B-app failing mixes | B failing mixes | A+app+tax failing mixes |
|---|---|---|---|---|---|
| as decided | MM at 15% (-0.79) | MM at 15% (-5.10) | MM at 15% (-0.82) | MM at 15% (-5.13) | MU at 15% (-0.48), MM at 15% (-9.31), MMM at 20% (-3.83) |
| two mugs pay list | none | none | none | none | MU at 15% (-0.48), MMM at 20% (-3.83) |
| mug step-down | none | none | none | none | none |
| needs frame or blanket | none | none | none | none | none |

Two-gift baskets at 20% (in case of a later change) failing:

- A: MM (-5.29)
- A+app: MU (-1.22), MM (-9.60)
- B-app: MM (-5.32)
- B: MB (-1.73), MU (-1.50), MM (-9.63)
- A+app+tax: MF (-3.58), MB (-5.91), MU (-5.68), MM (-13.81)

Mix letters: M mug, U unframed, F framed, B blanket.

1. **Only gifts count:** the tier counts and discounts personalized gift products only. The Artist's touch line neither counts toward the tier nor is discounted. One bundle discount per order, with no stacking with the reserved single-item offers or any other code.
2. **Smallest compliant rule, sets A and B with or without the app:** two mugs on their own pay list price. At list, two mugs clear the floor in every stack: +12.71 in A, +8.37 in B and +4.19 in the bounding case. Every other mix keeps the decided tier.
3. **Robust variant, all five stacks including the bounding case (mug step-down):**
   - two mugs alone pay list;
   - one mug plus one unframed print gets 10% instead of 15%;
   - three mugs alone get 15% instead of 20%.

   A simpler form also holds everywhere: a basket with no framed portrait or blanket gets nothing at two gifts and 15% at three or more. It gives up discounts on mixes that pass, such as two unframed prints.
4. **Keep two-gift baskets at 15%.**

**Recommendation: the mug step-down (condition 3).** It holds in every stack and changes only three low-value mixes. It also removes the dependence on an open disagreement: set A carries $10 per order of acquisition and set B carries none. Condition 2 is the minimum if Krish takes set B as the operating case and accepts the $0.35 three-mug margin. This choice is Krish's.

This note does not verify whether Shopify's native quantity discounts can express these exceptions. The exact mechanism must be confirmed and tested in a controlled checkout before activation, with approval. That test should include whether the bundle discount combines with the existing automatic free US shipping discount.

## Verdict flips: with and without the app, and between the sets

| Change | Flips at the decided tier | 0% | 15% | 20% |
|---|---|---|---|---|
| Add the app to the repo set (A to A+app) | none | U pass to FAIL | B pass to FAIL, F pass to FAIL | MU pass to FAIL |
| Add the app to the ECONOMICS.md set (B-app to B) | none | none | F pass to FAIL | MB pass to FAIL, MU pass to FAIL |
| Repo set to ECONOMICS.md set as stated (A to B) | none | none | B pass to FAIL, F pass to FAIL | MB pass to FAIL, MU pass to FAIL |
| Add supplier tax to the repo set with the app (A+app to A+app+tax) | MU pass to FAIL, MMM pass to FAIL | none | MU pass to FAIL | MF pass to FAIL, MB pass to FAIL, MMM pass to FAIL |

- **The checkout app adds $2.76 per order at 25 orders.** It raises every min paid by $4.30 or $4.31.
- **No basket flips at its decided tier**, whether the app is added to either set or the comparison moves from set A to set B. MM fails in all four, and every other mix passes in all four.
- **Flips at other discounts:**
  - In set A, the app turns the single unframed print at list from +2.80 to -1.50, and MU at 20% from +3.09 to -1.22.
  - In set B, the app turns MB and MU at 20% to failures.
  - Single gifts at 15% or 20% are reference rows only; the bundle does not discount a single gift.
- **Supplier tax**, added to set A with the app, is what flips MU at 15% and three mugs at 20%.

## Every basket at 0, 15 and 20% off

Single-gift rows are shown for reference. Headroom is paid revenue minus min paid at 30%.

### Set A: repo working sensitivity, no checkout app

| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mug_black | M | 45.00 | 53.38 | -8.38 | 38.25 | -15.13 | 36.00 | -17.38 |
| blanket_50x60 | B | 129.00 | 107.90 | +21.10 | 109.65 | +1.75 | 103.20 | -4.70 |
| frame_black_12x18 | F | 119.00 | 98.40 | +20.60 | 101.15 | +2.75 | 95.20 | -3.20 |
| unframed_12x18 | U | 59.00 | 56.20 | +2.80 | 50.15 | -6.05 | 47.20 | -9.00 |
| mug_and_frame | MF | 164.00 | 122.31 | +41.69 | 139.40 | +17.09 | 131.20 | +8.89 |
| mug_and_blanket | MB | 174.00 | 131.82 | +42.18 | 147.90 | +16.08 | 139.20 | +7.38 |
| mug_and_unframed | MU | 104.00 | 80.11 | +23.89 | 88.40 | +8.29 | 83.20 | +3.09 |
| unframed_and_blanket | UB | 188.00 | 134.64 | +53.36 | 159.80 | +25.16 | 150.40 | +15.76 |
| frame_and_blanket | FB | 248.00 | 176.84 | +71.16 | 210.80 | +33.96 | 198.40 | +21.56 |
| unframed_and_frame | UF | 178.00 | 125.14 | +52.86 | 151.30 | +26.16 | 142.40 | +17.26 |
| two_mugs | MM | 90.00 | 77.29 | +12.71 | 76.50 | -0.79 | 72.00 | -5.29 |
| two_unframed | UU | 118.00 | 82.94 | +35.06 | 100.30 | +17.36 | 94.40 | +11.46 |
| two_frames | FF | 238.00 | 167.34 | +70.66 | 202.30 | +34.96 | 190.40 | +23.06 |
| two_blankets | BB | 258.00 | 186.34 | +71.66 | 219.30 | +32.96 | 206.40 | +20.06 |
| mug_frame_blanket | MFB | 293.00 | 200.75 | +92.25 | 249.05 | +48.30 | 234.40 | +33.65 |
| mug_unframed_blanket | MUB | 233.00 | 158.55 | +74.45 | 198.05 | +39.50 | 186.40 | +27.85 |
| three_mugs | MMM | 135.00 | 101.21 | +33.79 | 114.75 | +13.54 | 108.00 | +6.79 |

### A+app: set A plus the $69 per 30 days checkout app

| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mug_black | M | 45.00 | 57.68 | -12.68 | 38.25 | -19.43 | 36.00 | -21.68 |
| blanket_50x60 | B | 129.00 | 112.21 | +16.79 | 109.65 | -2.56 | 103.20 | -9.01 |
| frame_black_12x18 | F | 119.00 | 102.70 | +16.30 | 101.15 | -1.55 | 95.20 | -7.50 |
| unframed_12x18 | U | 59.00 | 60.50 | -1.50 | 50.15 | -10.35 | 47.20 | -13.30 |
| mug_and_frame | MF | 164.00 | 126.62 | +37.38 | 139.40 | +12.78 | 131.20 | +4.58 |
| mug_and_blanket | MB | 174.00 | 136.12 | +37.88 | 147.90 | +11.78 | 139.20 | +3.08 |
| mug_and_unframed | MU | 104.00 | 84.42 | +19.58 | 88.40 | +3.98 | 83.20 | -1.22 |
| unframed_and_blanket | UB | 188.00 | 138.94 | +49.06 | 159.80 | +20.86 | 150.40 | +11.46 |
| frame_and_blanket | FB | 248.00 | 181.14 | +66.86 | 210.80 | +29.66 | 198.40 | +17.26 |
| unframed_and_frame | UF | 178.00 | 129.44 | +48.56 | 151.30 | +21.86 | 142.40 | +12.96 |
| two_mugs | MM | 90.00 | 81.60 | +8.40 | 76.50 | -5.10 | 72.00 | -9.60 |
| two_unframed | UU | 118.00 | 87.24 | +30.76 | 100.30 | +13.06 | 94.40 | +7.16 |
| two_frames | FF | 238.00 | 171.64 | +66.36 | 202.30 | +30.66 | 190.40 | +18.76 |
| two_blankets | BB | 258.00 | 190.65 | +67.35 | 219.30 | +28.65 | 206.40 | +15.75 |
| mug_frame_blanket | MFB | 293.00 | 205.06 | +87.94 | 249.05 | +43.99 | 234.40 | +29.34 |
| mug_unframed_blanket | MUB | 233.00 | 162.86 | +70.14 | 198.05 | +35.19 | 186.40 | +23.54 |
| three_mugs | MMM | 135.00 | 105.51 | +29.49 | 114.75 | +9.24 | 108.00 | +2.49 |

### B-app: ECONOMICS.md set without the checkout app

| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mug_black | M | 45.00 | 51.30 | -6.30 | 38.25 | -13.05 | 36.00 | -15.30 |
| blanket_50x60 | B | 129.00 | 110.66 | +18.34 | 109.65 | -1.01 | 103.20 | -7.46 |
| frame_black_12x18 | F | 119.00 | 100.33 | +18.67 | 101.15 | +0.82 | 95.20 | -5.13 |
| unframed_12x18 | U | 59.00 | 54.37 | +4.63 | 50.15 | -4.22 | 47.20 | -7.17 |
| mug_and_frame | MF | 164.00 | 126.29 | +37.71 | 139.40 | +13.11 | 131.20 | +4.91 |
| mug_and_blanket | MB | 174.00 | 136.62 | +37.38 | 147.90 | +11.28 | 139.20 | +2.58 |
| mug_and_unframed | MU | 104.00 | 80.40 | +23.60 | 88.40 | +8.00 | 83.20 | +2.80 |
| unframed_and_blanket | UB | 188.00 | 139.76 | +48.24 | 159.80 | +20.04 | 150.40 | +10.64 |
| frame_and_blanket | FB | 248.00 | 185.72 | +62.28 | 210.80 | +25.08 | 198.40 | +12.68 |
| unframed_and_frame | UF | 178.00 | 129.43 | +48.57 | 151.30 | +21.87 | 142.40 | +12.97 |
| two_mugs | MM | 90.00 | 77.32 | +12.68 | 76.50 | -0.82 | 72.00 | -5.32 |
| two_unframed | UU | 118.00 | 83.47 | +34.53 | 100.30 | +16.83 | 94.40 | +10.93 |
| two_frames | FF | 238.00 | 175.39 | +62.61 | 202.30 | +26.91 | 190.40 | +15.01 |
| two_blankets | BB | 258.00 | 196.04 | +61.96 | 219.30 | +23.26 | 206.40 | +10.36 |
| mug_frame_blanket | MFB | 293.00 | 211.74 | +81.26 | 249.05 | +37.31 | 234.40 | +22.66 |
| mug_unframed_blanket | MUB | 233.00 | 165.78 | +67.22 | 198.05 | +32.27 | 186.40 | +20.62 |
| three_mugs | MMM | 135.00 | 103.34 | +31.66 | 114.75 | +11.41 | 108.00 | +4.66 |

### Set B: ECONOMICS.md set as stated, with the checkout app

| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mug_black | M | 45.00 | 55.61 | -10.61 | 38.25 | -17.36 | 36.00 | -19.61 |
| blanket_50x60 | B | 129.00 | 114.97 | +14.03 | 109.65 | -5.32 | 103.20 | -11.77 |
| frame_black_12x18 | F | 119.00 | 104.64 | +14.36 | 101.15 | -3.49 | 95.20 | -9.44 |
| unframed_12x18 | U | 59.00 | 58.68 | +0.32 | 50.15 | -8.53 | 47.20 | -11.48 |
| mug_and_frame | MF | 164.00 | 130.60 | +33.40 | 139.40 | +8.80 | 131.20 | +0.60 |
| mug_and_blanket | MB | 174.00 | 140.93 | +33.07 | 147.90 | +6.97 | 139.20 | -1.73 |
| mug_and_unframed | MU | 104.00 | 84.70 | +19.30 | 88.40 | +3.70 | 83.20 | -1.50 |
| unframed_and_blanket | UB | 188.00 | 144.06 | +43.94 | 159.80 | +15.74 | 150.40 | +6.34 |
| frame_and_blanket | FB | 248.00 | 190.02 | +57.98 | 210.80 | +20.78 | 198.40 | +8.38 |
| unframed_and_frame | UF | 178.00 | 133.73 | +44.27 | 151.30 | +17.57 | 142.40 | +8.67 |
| two_mugs | MM | 90.00 | 81.63 | +8.37 | 76.50 | -5.13 | 72.00 | -9.63 |
| two_unframed | UU | 118.00 | 87.77 | +30.23 | 100.30 | +12.53 | 94.40 | +6.63 |
| two_frames | FF | 238.00 | 179.69 | +58.31 | 202.30 | +22.61 | 190.40 | +10.71 |
| two_blankets | BB | 258.00 | 200.35 | +57.65 | 219.30 | +18.95 | 206.40 | +6.05 |
| mug_frame_blanket | MFB | 293.00 | 216.04 | +76.96 | 249.05 | +33.01 | 234.40 | +18.36 |
| mug_unframed_blanket | MUB | 233.00 | 170.08 | +62.92 | 198.05 | +27.97 | 186.40 | +16.32 |
| three_mugs | MMM | 135.00 | 107.65 | +27.35 | 114.75 | +7.10 | 108.00 | +0.35 |

### Bounding case: set A with the checkout app and supplier tax borne

| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mug_black | M | 45.00 | 59.79 | -14.79 | 38.25 | -21.54 | 36.00 | -23.79 |
| blanket_50x60 | B | 129.00 | 119.15 | +9.85 | 109.65 | -9.50 | 103.20 | -15.95 |
| frame_black_12x18 | F | 119.00 | 108.82 | +10.18 | 101.15 | -7.67 | 95.20 | -13.62 |
| unframed_12x18 | U | 59.00 | 62.86 | -3.86 | 50.15 | -12.71 | 47.20 | -15.66 |
| mug_and_frame | MF | 164.00 | 134.78 | +29.22 | 139.40 | +4.62 | 131.20 | -3.58 |
| mug_and_blanket | MB | 174.00 | 145.11 | +28.89 | 147.90 | +2.79 | 139.20 | -5.91 |
| mug_and_unframed | MU | 104.00 | 88.88 | +15.12 | 88.40 | -0.48 | 83.20 | -5.68 |
| unframed_and_blanket | UB | 188.00 | 148.24 | +39.76 | 159.80 | +11.56 | 150.40 | +2.16 |
| frame_and_blanket | FB | 248.00 | 194.20 | +53.80 | 210.80 | +16.60 | 198.40 | +4.20 |
| unframed_and_frame | UF | 178.00 | 137.92 | +40.08 | 151.30 | +13.38 | 142.40 | +4.48 |
| two_mugs | MM | 90.00 | 85.81 | +4.19 | 76.50 | -9.31 | 72.00 | -13.81 |
| two_unframed | UU | 118.00 | 91.96 | +26.04 | 100.30 | +8.34 | 94.40 | +2.44 |
| two_frames | FF | 238.00 | 183.87 | +54.13 | 202.30 | +18.43 | 190.40 | +6.53 |
| two_blankets | BB | 258.00 | 204.53 | +53.47 | 219.30 | +14.77 | 206.40 | +1.87 |
| mug_frame_blanket | MFB | 293.00 | 220.22 | +72.78 | 249.05 | +28.83 | 234.40 | +14.18 |
| mug_unframed_blanket | MUB | 233.00 | 174.26 | +58.74 | 198.05 | +23.79 | 186.40 | +12.14 |
| three_mugs | MMM | 135.00 | 111.83 | +23.17 | 114.75 | +2.92 | 108.00 | -3.83 |

## The free redo and the AI allowance

| Stack | Per-order AI allowance | Per-gift redo | AI at 1 / 2 / 3 gifts | Generations the per-order allowance covers |
|---|---:|---:|---:|---:|
| A | 0.50 | 0.13 | 0.63 / 0.76 / 0.89 | 3.8 |
| A+app | 0.50 | 0.13 | 0.63 / 0.76 / 0.89 | 3.8 |
| B-app | 2.50 | 0.13 | 2.63 / 2.76 / 2.89 | 19.2 |
| B | 2.50 | 0.13 | 2.63 / 2.76 / 2.89 | 19.2 |
| A+app+tax | 0.50 | 0.13 | 0.63 / 0.76 / 0.89 | 3.8 |

- **One redo is one extra generation per gift:** about $0.127 observed, modeled at $0.13.
- **If every gift uses its redo**, an order needs at least two generations per gift (the accepted artwork plus the redo): 2, 4 and 6 generations for 1, 2 and 3 gifts.
- **Set A's $0.50 per order covers about 3.8 generations in total.** That still covers a one-gift order with its redo, leaving 1.8 generations for previews and abandoned attempts. It does not cover a two- or three-gift basket: 4 and 6 generations exceed it before any pre-cart retry. **So $0.50 per order is no longer conservative once bundles exist and every gift uses its redo.**
- **The model now adds $0.13 per gift in every stack.** Set A's allowance becomes $0.63, $0.76 and $0.89 for 1, 2 and 3 gifts. That still leaves under one generation (0.8) of slack on a three-gift order.
- **Set B's $2.50 covers about 19 generations plus the redo**, and the bundle verdicts at the decided tiers are identical in both sets. The bundle conclusion therefore does not depend on which AI allowance is right.
- **Scaling set A's whole allowance per gift** ($0.63 per gift) would raise two- and three-gift minimums by about $0.78 and $1.56. MU at 15% would keep about $7.51 and three mugs at 20% about $5.23 in set A, so no verdict changes.
- **Single-gift floors rise by $0.20** against the previous working sensitivity (single mug $53.17 to $53.38), because the redo applies to every gift.
- **The one-redo limit has to be enforced by the system, not by copy.** Teeinblue's five-upload-per-buyer-per-option hourly limit is not a financial cap (`tools/print-art/README.md`). Redo take-up is unmeasured; measure generations per order from provider usage after launch.

## Artist's touch

Modeled as a separate service line. There is no supplier cost or shipping. Payment (2.9%) and the 3% reserve apply to the line. The payment fixed fee, acquisition and overhead are already carried by the gift order it attaches to.

Labor is an explicit assumption: 20 to 45 minutes of Krish's rework at a stated $50 per hour planning value. That is not a measured rate or his opportunity cost; labor calibration was deferred by the owner. One extra generation ($0.13) is included, and customer sales tax on the service is set to 0 (taxability unconfirmed). The result is identical in every stack.

| Price | Discount | Paid | Minutes | Labor | Profit | Line margin | Meets 30% | Max minutes at 30% | List needed at these minutes |
|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|
| 19.00 | 0% | 19.00 | 20 | 16.67 | +1.08 | 5.7% | no | 14.4 | 26.21 |
| 19.00 | 0% | 19.00 | 45 | 37.50 | -19.76 | -104.0% | no | 14.4 | 58.71 |
| 19.00 | 20% | 15.20 | 20 | 16.67 | -2.50 | -16.4% | no | 11.5 | 32.77 |
| 24.00 | 0% | 24.00 | 20 | 16.67 | +5.78 | 24.1% | no | 18.3 | 26.21 |
| 24.00 | 0% | 24.00 | 45 | 37.50 | -15.05 | -62.7% | no | 18.3 | 58.71 |
| 24.00 | 20% | 19.20 | 20 | 16.67 | +1.27 | 6.6% | no | 14.6 | 32.77 |
| 29.00 | 0% | 29.00 | 20 | 16.67 | +10.49 | 36.2% | yes | 22.1 | 26.21 |
| 29.00 | 0% | 29.00 | 45 | 37.50 | -10.35 | -35.7% | no | 22.1 | 58.71 |
| 29.00 | 20% | 23.20 | 20 | 16.67 | +5.03 | 21.7% | no | 17.6 | 32.77 |

- At 20 minutes, $29 earns about $10.49 per sale (36.2%), $24 earns $5.78 (24.1%) and $19 earns $1.08 (5.7%). Only $29 clears 30%.
- At 45 minutes every price loses money ($29 loses about $10.35). Clearing 30% at 45 minutes would need about $58.71.
- **Time ceilings for the 30% line:** about 22 minutes at $29, 18 at $24 and 14 at $19.
- **Equivalent hourly ceilings:** at 20 minutes, $29 clears 30% for any hourly value up to about $55, $24 up to about $46 and $19 up to about $36.
- **If the bundle's 20% reached the add-on**, $29 at 20 minutes would fall to 21.7%.

**Recommendation: $29.** It is the only candidate that clears 30% at the low end of the time range, and it earns about 1.8 times the $24 option per sale. The lower prices need a by-hand rework under 18 or 14 minutes. Krish's time is the scarce input, so the price should ration it.

Conditions for the proposal:
- exclude the add-on from the bundle count and discount;
- scope it as a touch of about 20 minutes, not a redraw;
- cap weekly volume to the hours Krish can give;
- show the extra 5 days and the holiday cutoff where the add-on is offered;
- log actual minutes on the first 10, and reprice or rescope if the median runs above about 22 minutes.

Willingness to pay at $29 is untested.

## The floor is aggregate

The policy floor is aggregate across the order mix (`docs/ECONOMICS.md`). The single $45 mug is below 30% at list in every stack, from -6.30 in B-app to -14.79 in the bounding case. The single unframed print is thin in B (+0.32) and below the floor in set A with the app (-1.50).

A mug added to a framed portrait or a blanket clears the floor at 15% in every stack: mug + frame by +4.62 to +17.09, and mug + blanket by +2.79 to +16.08. The offer therefore moves mug buyers toward orders that carry their own costs, which helps the aggregate. Mug-only orders remain the aggregate risk. Reconcile the actual mix and attributable costs at 20 fulfilled orders, as `docs/ECONOMICS.md` requires.

## Not established here

- **Unmeasured outcomes:** realized margin; the demand, conversion or order-value effect of the discount; willingness to pay for the add-on.
- **Unquoted or unproven cost inputs:**
  - combined-basket shipping for 11 of the 13 basket rows;
  - Teeinblue route parity;
  - wider US destinations.
- **Unsettled treatment:**
  - supplier and customer sales tax;
  - business profit tax;
  - the acquisition basis (sets A and B disagree);
  - checkout app retention after the November 1 trial.
- **Unmeasured operating inputs:** Krish's rework time and hourly value; redo take-up.

## Reproduce

From the repository root:

```bash
python3 tools/economics/bundle_economics.py tools/economics/calibration.json --orders-per-period 25
python3 tools/economics/test_net_margin.py
```

Model files: `tools/economics/calibration.json` (11 new basket rows, a per-gift AI cell and the Artist's touch inputs, all added without changing existing values); `tools/economics/working-sensitivity.json`, `economics-md-sensitivity.json`, `supplier-tax-sensitivity.json` and `checkout-app-sensitivity.json`; `net_margin.py` (`apply_scenario`, `service_line`, per-gift allowance, paid-price headroom); and `bundle_economics.py`.
