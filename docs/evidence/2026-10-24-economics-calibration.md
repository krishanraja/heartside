# E0 verified; E1 calibrated inputs with explicit gaps

Read on 2026-10-24 using the connected Shopify and Teeinblue tools, Gmail support thread, local repositories and Codex in-app browser. No live catalog price, publication, fulfillment setting, paid generation, paid order or payment changed. A clearly marked unpaid supplier quote draft and display-only currency preference are described below. Exact private target identifiers remain in the private operations companion, not this document.

## Checkpoint and sources

Heartside was clean on `fix/photo-identity-and-funnel-truth` at `97239bd`; origin is `krishanraja/heartside`. Draft PR 51 remains open at `69b98d6`, two local documentation commits behind. Remote main was `e784654`. Growth was clean on `codex/buddy-host-20261023` at `523ec17`, origin `krishanraja/growth-heartside`. This change is local; the remote PR does not yet contain it.

Shopify's connected shop identity is Heartside, heartside.io, USD, US, Basic. Native readback distinguishes the main Heartside launch theme from its unpublished copy. The portrait and blanket acceptance products remain Draft with no online-store URL or publication records. The portrait campaign has its existing acceptance-product binding; the blanket campaign has none. These are target checks, not a storefront integration pass.

Four critical in-app tabs are retained: draft theme editor, Teeinblue fulfillment settings, the unpaid Printful quote and supplier catalog. The read-only embedded Printful app tab was reused for catalog checks after its connection was verified. The initial empty browser inventory was transient; the owner's clarification allowed supplier tabs. Redundant read-only tabs were closed. No alternate browser was used and the editor was not navigated away from.

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

The owner clarified that connection work starts through Shopify's installed Printful app. That route was inspected: the app already opens its connected dashboard, with Heartside assigned to the saved account billing method. The standalone Printful tab is authenticated but lists no stores. Its visible account page shows a personal login different from the business email in Printful's October 4 account-change confirmation. This establishes a login mismatch, not which account currently owns each integration. The existing account tab was brought forward and screenshot-verified. The owner then switched to the business login; a fresh Stores read explicitly shows Shopify / Heartside / Live. Account access is resolved without disconnecting or reinstalling anything. Billing > Resale certificate explicitly says no certificates submitted. No exemption is assumed.

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

## Authenticated supplier follow-up

Site browsing currency was changed from GBP to USD; store billing was already USD and was not changed. These are the non-membership catalog prices and US shipping tables, read October 24. They are not final destination/tax quotes. Estimated times are not customer promises or holiday cutoffs.

| Configuration | Base USD | First / next shipping USD | Catalog estimate |
|---|---:|---:|---|
| 11oz mug black/red/pink | 9.75 | 6.69 / 3.50 | 5-7 business days |
| 11oz mug dark blue/dark green | 8.11 | 6.69 / 3.50 | 5-7 business days |
| Tan sherpa 50x60 | 37.25 | 13.99 / 4.00 | 6-8 business days |
| Matte unframed 12x18 | 13.25 | 4.99 / 0.40 | 5-7 business days |
| Matte frame black/white 12x18 | 34.50 | 10.89 / 4.50 | 5-7 business days |
| Matte frame red oak 12x18 | 32.77 | 10.89 / 4.50 | 5-7 business days |
| Basic pillow 16x16 with insert | 14.95 | 10.89 / 4.50 | 6-8 business days |

The sherpa supplier catalog is $1.49 higher than the imported Teeinblue base ($35.76). The initial calibration retained the higher $37.25 provisionally; the later exact-destination observation below is now recorded separately and preserves the discrepancy. Catalog extras explain that fulfillment region and billing currency can change the base. No membership/trial discount was assumed or activated.

Stock matrices show all five selected 11oz mugs, the tan 50x60 blanket, 12x18 unframed poster and 16x16 basic pillow in stock in US/Mexico. All three 12x18 frame colors show in stock in the United States. These are availability observations, not guaranteed routing or physical-quality acceptance.

Supplier file guidelines: unframed paper portrait requires PNG/JPEG, sRGB, at least 300 DPI and full bleed. The 50x60 sherpa uses a 53x63-inch file, at least 150 DPI, full bleed and safe areas; supplier warns of shifts up to two inches and recommends avoiding tiny details. This does not verify the native AI source resolution. The pillow has a washable case, hand-wash-only insert, and ships unassembled. Its displayed file-template table omits 16x16 despite the available size picker; exact seam-safe geometry remains unverified. Do not infer it from another size.

Primary catalog pages: [mug](https://www.printful.com/dashboard/custom/home-living/all/ceramic-mug), [sherpa](https://www.printful.com/dashboard/custom/blankets/personalized/sublimated-sherpa-blanket), [unframed](https://www.printful.com/dashboard/custom/home-living/all/enhanced-matte-paper-poster-in), [framed](https://www.printful.com/dashboard/custom/wall-art/framed-posters/enhanced-matte-paper-framed-poster-in), [pillow](https://www.printful.com/dashboard/custom/pillows/decorative/basic-pillow).

A standard unpaid Basic-order quote configuration uses disposable text, `COST QUOTE ONLY - DO NOT PRINT`. Continuing to shipping saved a draft. The recipient name was resolved from the existing Shopify order matching the owner-confirmed handoff address; no name was inferred. Full contact data stays private. The address-book save checkbox stayed unchecked.

The black 11oz mug, quantity one, now has an exact unpaid Brooklyn quote: fulfillment $8.11, Flat Rate shipping $6.69, seasonal surcharge $0.40, supplier tax $1.35, total $16.55. Both review and a subsequent edit/save/recalculation show this total. No discount code was applied. The catalog and editor show $9.75, but saving the Basic-order draft restores $8.11. Printful states prices depend on fulfillment region and payment currency; this does not establish which route will serve the Teeinblue integration. The model records the quote as an observed sample, preserves the $9.75 catalog conflict and does not certify nationwide cost or integration parity. Delivery Oct 29-31 is a current estimate, not a customer promise. Supplier tax is separate from Shopify sales tax.

No sample discount, customer photo, paid order, payment, terms acceptance or fulfillment was used. The unpaid draft is preserved for the remaining variant and basket quotes.

The same draft was reused for one unframed 12x18 matte portrait: fulfillment $11.62, Flat Rate shipping $4.99, surcharge $0.40, tax $1.51, total $18.52. Product readback confirms 12x18 and quantity one. Catalog/editor $13.25 versus saved quote $11.62 is retained as a separate discrepancy. No all-US or Teeinblue-route extrapolation.

The black-frame 12x18 portrait is also quoted independently at $32.77 fulfillment + $10.89 Flat Rate shipping + $0.40 surcharge + $3.92 tax = $47.98. Quantity one and Black / 12x18 were read back. Catalog/editor $34.50 versus saved quote $32.77 remains an unresolved route/currency pricing distinction.

White-frame 12x18 was separately selected, saved and read back at the same $32.77 + $10.89 + $0.40 + $3.92 = $47.98 total. It was not inferred from black. Catalog/editor remains $34.50.

Red-oak 12x18 was separately selected, saved and read back at $32.77 + $10.89 + $0.40 + $3.92 = $47.98. This color agrees with its $32.77 catalog/editor base. All three frame colors have independent destination observations; provider integration parity remains untested.

Tan 50x60 sherpa, quantity one, is quoted at $35.76 fulfillment + $13.99 Flat Rate shipping + $0.40 surcharge + $4.45 supplier tax = $54.60. This agrees with the imported base but differs from $37.25 in the catalog/editor. Delivery Oct 30-Nov 2 is an estimate only. Disposable quote text does not change the approved word-free production design.

Basic pillow 16x16, quantity one, white zipper/stitch, with both Front print and Back print read back, is quoted at $14.59 fulfillment + $10.89 Flat Rate shipping + $0.40 surcharge + $2.30 tax = $28.18. Catalog/editor is $14.95. Estimate Oct 30-Nov 2 only. No fabric, seam geometry or production-quality acceptance follows from the disposable text draft.

Seven independent unpaid single-variant Brooklyn observations are now recorded. Four remaining mug colors, proposed mixed baskets and wider destination coverage remain open. All totals reconcile exactly; no final order was submitted. Krish confirmed the accounting boundary on October 24: net operating profit after all attributable business costs, before owner personal income tax, adding business-level profit tax when its treatment is confirmed. Tax treatment remains explicitly unverified; no zero rate or exemption is presumed.

## Owner boundary and remaining mug quotes

Krish confirmed the operating-profit boundary before owner personal income tax; business-level profit-tax treatment remains unverified and null. Red, pink, dark-blue and dark-green 11oz mugs were each selected, saved, calculated for the existing Brooklyn destination and read back at quantity one. Each is $8.11 fulfillment + $6.69 shipping + $0.40 surcharge + $1.35 supplier tax = $16.55. Red/pink catalog/editor $9.75 discrepancies remain; dark-blue/dark-green catalog/editor agrees at $8.11. All 11 selected Printful single-variant cases now have destination-specific observations. Mixed baskets and wider destinations remain open.

Both proposed baskets were independently quoted in the same unpaid Basic-order draft. Black mug plus black 12x18 frame: $40.88 fulfillment + $17.58 shipping + one $0.40 surcharge + $5.23 supplier tax = $64.09. Black mug plus tan 50x60 sherpa: $43.87 fulfillment + $20.68 shipping + one $0.40 surcharge + $5.76 tax = $70.71. Each product and quantity one were read back. Basket shipping equals the sum of these item shipping rates; the single surcharge and exact supplier tax were observed rather than inferred. The model records these exact basket fields, without spreading them across individual lines or assuming savings on the Shopify/app/operating costs.

The 11 selected Printful single variants and two defined baskets now have Brooklyn-specific observations. The conditional replacement ornament remains unqualified; wider destination coverage, supplier integration parity, customer collected-sales-tax treatment and all named operating costs remain incomplete. Thirteen quote totals reconcile. No forecast price is certified.

The existing Teeinblue support thread was read again after the owner boundary reply: it still contains only the original October 23 sent question. No reply, new send or duplicate schedule was found/created in this check. The existing Monday follow-up remains the route for the unresolved source-resolution and retry-billing questions.

Independent E2 inspection after the quote checkpoint: `shopify/assets/hs3.js` tone change handler (around line 1170) still calls `compose(name, previous)` automatically after slider release. The new offline artwork state contract is not integrated into that UI. This is a verified code-path finding, not a runtime billing observation or completed repair. No storefront source was changed in this quote/boundary checkpoint. The next local repair must make the update explicit and test pending, reload, duplicate and late-response behavior before any draft deployment.


## Subsequent owner instruction: cost price plus margin for now

In response to the labor-rate question, Krish directed that labor calibration be deferred and the current view be cost price plus margin. The existing 50% target is applied to delivered supplier cost: product + shipping + surcharge + supplier tax, divided by 0.50. This is a provisional supplier-cost margin, not all-cost net margin. Unknown costs remain null in the full model. No labor question is pending and labor is not a blocker to independent product work. The earlier accounting-boundary confirmation remains recorded; business profit-tax treatment is still unverified.

The reproducible cost_price.py report checks all 13 quote totals and calculates: mug $33.10; unframed $37.04; framed $95.96; blanket $109.20; pillow $56.36; mug + black frame $128.18; mug + blanket $141.42. These are exact price floors before discounts and before excluded operating costs. No live price is approved or changed. Conditional ornament remains unpriced. This provisional view does not extrapolate Brooklyn costs to every US destination.

The later local note-control repair is documented separately in 2026-10-24-explicit-tone-update.md; it supersedes the prior source finding above without claiming artwork/provider completion.
