# Pricing for maximum total profit with a30% net floor

## Current owner ruling, October26

Maximize expected total net operating profit, subject to a 30% net operating margin floor after all attributable business costs. The October26 owner ruling supersedes the mandatory50% floor; supplier-only margin is not net margin. Retrieve actual costs or use explicit conservative bounds without restarting the deferred labor interview. Exact price/discount activation, publication, spending and product acceptance remain separately gated.

Recommended starting prices and inactive offers are in [the pricing ruling](../../evidence/2026-10-26-pricing-ruling.md). The all-cost model calibration now uses0.30; missing inputs continue to block certification. The old supplier-cost report remains explicitly historical. All October24 calculations below preserve decision-time assumptions and are superseded as current policy.

## Historical working instruction, October24 (superseded)

Krish subsequently directed: "Dont worry about that for now, just cost price + margin" in response to the labor-rate question. Use a provisional delivered-supplier-cost view now and defer labor calibration. Carry the existing 50% target into this view: price = (product + shipping + surcharge + supplier tax) / 0.50. This is supplier-cost margin, not all-cost net margin; no unknown operating cost becomes zero. Do not keep requesting labor inputs at this stage. Exact live prices remain approval-gated. The all-cost definition below is retained for later reconciliation, not used to block independent product work.

Current quote-based prices are reproducible with `python tools/economics/cost_price.py tools/economics/calibration.json`. All 11 quoted variants and both baskets have a provisional floor; the unqualified ornament does not. See the calibration evidence for quote conditions and remaining route uncertainty.

Krish's approved requirement, October 24: “ensure the pricing is calibrated for at least 50% net margin for me.” This replaces all provisional price recommendations as the governing pricing constraint. Scope is approved; exact retail prices require calibration. No live price change has been authorized for an unspecified amount.

## Definition and hard gate

Net operating margin = (net product revenue minus all attributable business costs) / net product revenue. Exclude pass-through sales tax from revenue. Include supplier product and shipping, seller-borne tax/duty, transaction fees, personalization, all successful and failed generations, discounts, refunds, remakes, review/support labor, marketing/acquisition and allocated subscriptions/hosting/operating overhead. Do not count refunds twice in both revenue and costs. Do not call gross or contribution margin net margin.

The baseline planning model below uses a 3% revenue reserve for refunds/remakes before actual outcomes exist. Replace the reserve with observed accounting entries for realized reporting. Include founder/operator labor at a stated rate even if temporarily unpaid; do not manufacture profitability from free labor.

Working accounting boundary is net operating profit before owner personal income tax. Business income taxes and any meaning of “net to me” after business/owner taxes are not settled by this pack. Read existing accounting treatment first. If certification depends on an owner-only choice, ask once at that gate. Do not claim 50% after-tax profit with an assumed zero tax rate.

## Formula

Let P = revenue per item/order excluding pass-through tax, B = base, S = supplier shipping, T = seller-borne fixed taxes/duties, A = AI cost including retries, L = review/support labor, I = per-item app cost, H = holiday surcharge, F = fixed payment fee, C = acquisition cost per order, O = operating overhead allocated per order, and v = percentage processing/refund reserve.

Expected pre-income-tax net = P × (1 − v) − (B + S + T + A + L + I + H + F + C + O).

For a 50% target, **minimum P = fixed costs / (0.50 − v)**. With v = 5.9%, the denominator is **0.441**. If the required margin is after an effective business profit-tax rate t, the denominator becomes **1 − v − 0.50/(1 − t)**. A nonpositive denominator means the target cannot be met under that model.

Use order-level calculations for bundles. Fixed payment fee, acquisition and some holiday charges occur once per order; base/per-item fees occur per item; cross-category shipping may occur separately. Discounts must leave the final paid order above the margin threshold. Never carry an arbitrary low-price ornament add-on into a bundle.

## Verified inputs versus assumptions

October 24 connected catalog costs and public US shipping inputs:

| Format | Base | Shipping used | Confidence |
|---|---:|---:|---|
| Mug dark blue/green 11 oz | 8.11 | 6.69 | Base read from connected catalog; public shipping rate, exact destination quote pending |
| Mug black/red/pink 11 oz | 9.75 | 6.69 | Same limitation |
| Sherpa 50 x 60 | 35.76 | 13.99 | Same limitation |
| Frame black/white 12 x 18 | 34.50 | 10.89 | Same limitation |
| Frame red oak 12 x 18 | 32.77 | 10.89 | Same limitation |
| Unframed 12 x 18 | 13.25 | 4.99 | USD small-poster category also observed in browser |
| Pillow 16 x 16 | 14.95 | 10.89 | Connected base; public starting shipping, exact quote pending |

Current ornament replacement has no exact quote. Its public advertised product-plus-shipping minimum is $9.69, which must not be treated as a configured order price. Books have no qualified quote. Do not assign these a validated price from a starting-price advertisement.

Illustrative model assumptions, not account-certified costs: payment 2.9% + $0.30; personalization $0.40/item from October 23 dashboard; holiday $0.40/US Printful order during the published period; AI $0.50/order; review/support $2/order; refund/remake reserve 3% of revenue. Fixed non-supplier allowance totals $3.60 before C, O and T. Actual subscription overhead must be included in O rather than counted in I twice.

`pricing-scenarios.csv` calculates three explicitly hypothetical cases for each quoted core/pilot format:

- Organic floor: C=$0, O=$5. Free acquisition is an assumption for this scenario, not an acquisition forecast.
- Working sensitivity: C=$10, O=$5.
- Stress sensitivity: C=$20, O=$10.

All assume T=$0 and no business-income tax solely to expose the math. These are **minimum scenario prices**, not approved or validated selling prices. Choose a round selling price above the applicable exact floor only after verifying the inputs. More cost means a higher floor; a higher sticker price alone does not prove customers will buy.

For example, the higher-cost mug needs about $79.46 under C=$10/O=$5; the blanket about $154.99; black/white frame about $145.11; unframed about $83.54. These results are materially different from a contribution-only model. They expose the need to verify acquisition/overhead, reduce delivered costs or prove premium willingness to pay. Never quietly revert to a 40% target to make a price look attractive.

## Calibration procedure

1. Obtain exact variant and representative US destination quotes without submitting an order. Cover contiguous US first and test Alaska/Hawaii or explicitly restrict unsupported regions with approved customer-facing policy.
2. Read actual account fees and monthly fixed business costs. Do not inspect unrelated personal financial data. Establish a cautious order-volume allocation; if volume is unknown, show low/base/high scenarios.
3. Measure generation attempts, billed failures and review time on the qualified artwork cases. Replace illustrative AI/labor allowances. Include support burden.
4. Build order and monthly P&L views. The monthly view must include fixed costs at actual volume, not hypothetical scale. At zero revenue margin is undefined; do not claim the target achieved prelaunch.
5. Price to at least 50% under the agreed operating case, show sensitivity and margin at maximum proposed discount. Hold release where a material input remains unknown.
6. Test willingness to pay and contribution/net dollars per qualified visitor. A margin-efficient price with no buyers is not success. Do not commission paid acquisition to fill the CAC assumption without exact spend approval.
7. Reconcile actual results after samples and the first 20 fulfilled orders, then monthly. Any order/variant forecast below the floor triggers correction before new promotion; live price changes still require their exact reviewed approval.

The agent can gather inputs, calculate and prepare draft prices autonomously. It must ask Krish only where records cannot resolve a material accounting assumption, commercial trade-off or exact live price approval.
