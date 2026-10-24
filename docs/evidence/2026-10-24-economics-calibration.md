# E0 verified; E1 calibrated inputs with explicit gaps

Read on 2026-10-24 using the connected Shopify and Teeinblue tools, Gmail support thread, local repositories and Codex in-app browser. No catalog price, publication, supplier setting, paid generation, order or payment changed. Exact private target identifiers remain in the private operations companion, not this document.

## Checkpoint and sources

Heartside was clean on `fix/photo-identity-and-funnel-truth` at `97239bd`; origin is `krishanraja/heartside`. Draft PR 51 remains open at `69b98d6`, two local documentation commits behind. Remote main was `e784654`. Growth was clean on `codex/buddy-host-20261023` at `523ec17`, origin `krishanraja/growth-heartside`. This change is local; the remote PR does not yet contain it.

Shopify's connected shop identity is Heartside, heartside.io, USD, US, Basic. Native readback distinguishes the main Heartside launch theme from its unpublished copy. The portrait and blanket acceptance products remain Draft with no online-store URL or publication records. The portrait campaign has its existing acceptance-product binding; the blanket campaign has none. These are target checks, not a storefront integration pass.

Four critical in-app tabs are retained: draft theme editor, Teeinblue fulfillment settings, standalone Printful account and Shopify's authenticated embedded Printful app. The initial empty browser inventory was transient; the owner's clarification allowed supplier tabs. Redundant read-only tabs were closed. No alternate browser was used and the editor was not navigated away from.

The existing Monday October 26, 09:00 London support heartbeat is active. The original October 23 resolution/production-source email still had no reply at this read. No duplicate message or automation was created. Original source dimensions, failed/retried generation billing and the supported private blanket connection remain unresolved.

## Account facts

| Input | Observed evidence | Implication |
|---|---|---|
| Current sales | Shopify analytics September 27–October 24: one order, net sales $0, returns -$24; order capture and full refund both successful | Replace the old $24 current metric. Net margin is undefined at zero net revenue, not 50%. |
| Processing | Shopify Plan shows online 2.9% + $0.30. Captured $24 transaction reports a $1 fee, flat $0.30, rate .029 | Verified for that route. Empty refund-fee array does not prove the original fee was returned. Other payment routes need their own case. |
| Shopify | Basic £1/month until January 5, 2027; normal displayed charge £25/month | Revenue/model USD versus billing GBP requires evidenced FX/fees. Do not use the promotion forever. |
| Teeinblue | Active $49 subscription; October 18–November 17, next bill November 17. One connected store; usage count one, $0 usage, next tier 101. Usage reset November 3 | Subscription and usage cycles differ. Current next order ordinal is two; refresh before pricing/release. |
| MetaShop | Shopify Plan shows active $9.99 per 30 days, next renewal November 10 | Attributable app overhead cannot be omitted just because another app performs personalization. |
| Supplier payment history | Embedded Printful Payments, last six months: no transactions found | No actual supplier invoice to use as tax or delivery-cost proof. |
| Supplier confirmation | Embedded Printful Settings: manually confirm imported orders selected; automatic confirmation unselected | Existing manual gate is present in this integration. This does not prove the separate Teeinblue fulfillment handoff. |

Billing readback had a reconciliation gap: Shopify upcoming headline £44.73 versus expanded app subtotal £44.98 (MetaShop £7.67 + Teeinblue £37.31). Plan estimates were different again (£7.45/£36.56). A displayed possible discount was not verified as applied. Preserve those observations; use invoice settlement/FX evidence before certification instead of selecting a convenient exchange rate.

Shopify Payments-account query lacked the required read scope. No access was widened. Order transaction fees and the signed-in Plan page supplied the narrowly needed processing evidence.

Official Teeinblue [pricing](https://teeinblue.com/pages/pricing) and [pricing FAQs](https://support.teeinblue.com/en/article/pricing-faqs-oyyie2/) describe Blue's first 100 orders without transaction fees, then $0.40/customization line through 1,000, $0.20 through 10,000 and $0.10 thereafter. Quantity of the same customization does not multiply the customization-line fee. Usage counts across connected stores. A design-regeneration app-fee statement does not establish the upstream AI provider's retry billing.

## Supplier bases and unresolved quotes

Fresh connected catalog readback repeated the base amounts in `02-ECONOMICS.md`: five mug colors $8.11/$9.75, blanket $35.76, black/white frame $34.50, red-oak frame $32.77, unframed $13.25 and pillow $14.95. Imported availability was true. The embedded Printful mug catalog also showed the selected mug family starting at $8.11. These remain catalog observations, not exact destination quotes or route/stock guarantees.

Shipping, seller-borne supplier tax/exemptions, Alaska/Hawaii treatment and exact mixed-basket shipping remain unverified. The authenticated embedded mug detail shows shipping starting at $4.99, while the earlier public US category rate was $6.69; neither is an exact configured destination quote.

The owner clarified that connection work starts through Shopify's installed Printful app. That route was inspected: the app already opens its connected dashboard, with Heartside assigned to the saved account billing method. The standalone Printful tab is authenticated but lists no stores. Its visible account page shows a personal login different from the business email in Printful's October 4 account-change confirmation. This establishes a login mismatch, not which account currently owns each integration. The existing account tab was brought forward and screenshot-verified for switching to the business login. No account was disconnected, reinstalled, created or modified.

Teeinblue's fulfillment settings independently show Printful connected, Store set to Heartside, and Auto confirm order unchecked. The catalog selling region is Worldwide; that is not proof of a US fulfillment route. Printify is not connected. These settings verify current gates and configuration, not successful production handoff or the replacement ornament route.

Printful's October 15 account email verifies a flat $0.40 surcharge per US-bound Printful order, all shipping methods, from October 15, 2026 through January 17, 2027. The calibration records that policy for single-product cases. Mixed baskets retain an assumption because one supplier order rather than split routing is unverified. Supplier tax and collected sales tax are separate inputs for each exact basket/destination.

The official [2026 holiday readiness hub](https://www.printful.com/guides/holiday-readiness-hub), read October 24, explicitly says cutoff dates will be shared soon and links to current fulfillment times. Thus no route-specific Christmas 2026 cutoff was established; no dated customer promise is authorized. A temporary fifth read-only tab was closed after this lookup. The replacement ornament's official Printify listing describes separate front/back UV print, round 2.80-inch ceramic, gold string and white/gold packaging, but uses an auto-selected provider and starting prices. Exact provider, both-side cost, delivery quote and Teeinblue mapping remain blocked. It is not qualified.

## Executable model and verification

`tools/economics/` adds an offline Decimal-based engine, evidence-cell calibration, explicit sensitivity overrides and regression tests. It covers every selected catalog variant, the blocked ornament and two proposed mixed baskets. Unknowns block price output; no default zero tax, labor, acquisition or FX. Full operating costs and period overhead appear once, discounts preserve the paid floor, and realized refunds are separated from forecast reserves.

Thirteen unit tests pass, including the 21 original scenario floors, tier boundaries, quantity versus customization, bundle fixed-cost allocation, discount floor, processing on collected tax, business-tax denominator, invalid values, zero revenue/refunds and missing/conversion-once FX. These verify model mechanics only. Volume sensitivities are not realistic demand forecasts or a verified monthly product mix.

A focused mail search for Heartside invoice/tax/accounting records from September onward found no matching records. A provider-specific hosting search found the October 14 invoice: $17.47 for September, comprising a CPX21 server, backup, IPv4 and snapshot, with $0 supplier tax on that invoice. This does not establish Heartside's allocation, the current-period amount or exemption from Printful tax. Unrelated service invoices were not assigned to Heartside.

Actual-input CLI run: 70 of 70 order/volume cases blocked on missing costs. Explicit post-promotion, 10%-discount sensitivity: 65 unverified scenarios and five blocked ornament cases. No output is certified or authorized for live use.

Remaining material accounting decisions: business profit-tax boundary versus owner personal tax; shared overhead allocation and actual paid FX/fees; a defensible order-volume/mix assumption; review/support labor rate and time; acquisition including organic production labor; end-to-end image/copy cost including abandoned sessions and retries. Existing records have not supplied these. The 3% refund/remake reserve remains an assumption, not an observed loss rate.

**Status:** E0 target verification passed. E1 cost engine and accessible account inputs advanced; no SKU margin, supplier route, holiday promise or live price certified. The ordered checklist remains `01-EXECUTION-QUEUE.md`.
