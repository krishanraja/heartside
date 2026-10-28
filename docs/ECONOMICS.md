# Pricing for maximum total profit with a 30% net floor

## Current owner ruling, October 26

Maximize expected total net operating profit, subject to a 30% net operating margin floor after all attributable business costs. The October 26 owner ruling supersedes the mandatory 50% floor; supplier-only margin is not net margin. Retrieve actual costs or use explicit conservative bounds without restarting the deferred labor interview. Exact price/discount activation, publication, spending and product acceptance remain separately gated.

The configured baseline is USD45 mug, USD59 unframed portrait, USD119 framed portrait and USD129 blanket; [`../NOW.md`](../NOW.md) owns the current price readback. Two offers have been live since 27 October: the automatic bundle (15% off two gifts, 20% off three or more, gifts only) and the USD29 Artist's touch add-on. Both were modeled first in the [bundle economics](evidence/2026-10-27-bundle-economics.md). In its two operating sets, two mugs at 15% sit USD0.79 to USD5.13 below the floor, and USD9.31 below in the bounding case. The pricing ruling's reserved single-item offers and fixed-price bundles stay inactive. An existing qualified US shipping discount is separate from those offers; do not generalize one quoted destination to every US address. The [pricing ruling](evidence/2026-10-26-pricing-ruling.md) owns the decision. The superseded 50% supplier-cost model and scenario CSV are in [`history/ECONOMICS-2026-10-24.md`](history/ECONOMICS-2026-10-24.md) and [`history/pricing-scenarios-2026-10-24.csv`](history/pricing-scenarios-2026-10-24.csv).

For any proposed price or offer change, model expected net revenue after discounts/refunds, then subtract product, shipping, taxes borne by the business, processing, artwork/retries, app allocation, support, remake/return and acquisition costs. Use actual supplier/account quotes and observed order mix where available, conservative ranges otherwise. Compare **total** expected net operating profit while requiring modeled aggregate net operating profit divided by net revenue to remain at least 30%. Record volume and mix sensitivity; a single product's supplier gross margin is insufficient. Reconcile actual attributable costs after fulfilled orders before certifying realized net margin.

## Function Studio recurring-cost sensitivity, October 27

The owner-approved Function Studio Advanced plan was installed at USD69/month with a five-day trial ending November 1. Ruling (Krish, 28 October): keep it through Christmas, then review it in January against measured conversion. Without it, checkout shows the catalog picture instead of the buyer's design. The updated private economics report, `FUNCTION-STUDIO-CANDIDATE-SENSITIVITY.md` and its arithmetic JSON, conservatively includes the full USD69 even during the trial, in addition to the existing USD200 monthly operating-cost scenario. Historical filenames do not mean installation is still hypothetical. The dated test record is in the [integration evidence](evidence/2026-10-27-core-launch-integration.md).

The added allocation is USD2.76/order at 25 monthly orders or USD1.38/order at 50. With the same conservative supplier, refund/remake, payment, USD5 support and USD2.50 prepurchase-AI assumptions and no paid acquisition, representative aggregate scenarios are:

| Monthly one-item order mix: mug/unframed/framed/blanket | Net revenue | Modeled operating profit | Modeled margin |
|---|---:|---:|---:|
|6/6/6/7, 25 orders|USD2196.18|USD705.01|32.10%|
|13/12/12/13, 50 orders|USD4310.04|USD1640.60|38.06%|
|10/5/5/5, 25 orders, mug-heavy|USD1945.30|USD579.12|29.77%|
|0/0/0/25, 25 blanket orders|USD3160.50|USD1102.11|34.87%|

These scenarios allocate fixed costs once across the store; they are not demand forecasts or simultaneous product-level allocations. They are one-item orders, so the live bundle discount (15% off two gifts, 20% off three) and the USD29 Artist's touch are not in them; the per-basket checks are in the [bundle economics](evidence/2026-10-27-bundle-economics.md). A single USD45 mug is below the 30% floor in every modeled case: at 25 orders a month it needs USD51.30 to USD59.79 depending on the cost set, and USD55.61 with this file's set and the checkout app. The mug price is open for Krish in [`../NOW.md`](../NOW.md). The balanced 25-order case has only USD46.15 headroom above the 30% floor; the mug-heavy case misses it by USD4.47. Do not introduce paid acquisition, percentage discounts or bundle offers without recalculating the aggregate condition. Reconcile actual mix and attributable costs at 20 fulfilled orders, monthly and after material cost changes, honoring paid orders while reviewing promotions if margin falls below the floor. No realized net-margin certification or change to the approved prices is made here.

## Painting spend for the 28 October release run

Teeinblue paints once each time a gift accepts a photo and once per redo, at about USD0.13 each, so one photo carried to three gifts paints three times. Seven of the ten paintings agreed for the first mock-order run were used on 28 October. The release run in the [CoWork prompt](review/COWORK-LIVE-ACCEPTANCE.md) asks Krish for a cap of 14, about USD1.80. That covers his own phones (4), five mock orders with three gifts and a redo in one of them (8), and two spare. A photo the store refuses never paints.
