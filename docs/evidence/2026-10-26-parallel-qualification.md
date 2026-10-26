# Parallel qualification and personalization repair

26 October 2026. Three owner-approved independent lanes reported to the master. Product/supplier and economics workers used read-only evidence; engineering used an isolated checkout at baseline `535ac26`. Only the master integrates code and updates the existing execution queue. No additional artwork generation, payment, order, public release or support message was performed.

## Engineering

Three reproduced defects were repaired in `hs2.js`, `hs-artwork-choices.js` and `hs3.js`:

1. Asynchronous artwork preparation used the image-reuse identity to detect changes. Exact note, signature, copy ownership and text-product tone could change without changing that identity, leaving preparation to return superseded inputs. Preparation now compares complete choices and exact copy at both asynchronous boundaries. Image reuse semantics remain unchanged.
2. A failed storage write left shared style/tone selects displaying the attempted values while effective saved inputs retained earlier values. Failed writes now restore both selects and announce the failure; retry can succeed normally.
3. Buddy's separate tone slider had the same failure. Its position, visible name and accessible value now restore to the retained tone; the error appears without replacing the focused control.

Worker commits `49492cd` and `5ef1551` were reviewed and integrated as `d33a973` and `c0e7868`. The master independently reran the original regressions and adjacent tests: **71 pass, zero failures**, including 16 source/minified additions. All six shipped JavaScript assets minify and Theme Check reports **zero offenses**. No dependency changes.

Preparation remains a draft API with no production dispatch caller. A future adapter must recheck complete identity immediately before dispatch and acceptance; passing these tests does not authorize generation or prove provider retry billing. The controlled storage-failure and asynchronous-race checks are source/minified tests; rendered storage-failure recovery remains a separate gate.

Target for bounded integration is the existing unpublished review theme. Authority is the continuing approved draft implementation, with generation and order controls paused. ROLLBACK READY: prior deployed code `4c0909c` through the guarded theme workflow, live/overwrite flags false; retain the separate recently-viewed snippet guard. The workflow backs up templates and checks editor changes. Readback must compare changed assets and retain unpublished status, then exercise selection/reload and paused controls. No live release is authorized.

Guarded deployment **40324138883** succeeded at **4c88fc3** with target, backup and editor-preservation checks passed. Independent Admin API readback confirms UNPUBLISHED and exact Git-blob MD5 parity: `hs2.js` ac859d6a934bd38e435f7e857c63369c; `hs3.js` f908b301bd0fff44b45d6290b6e0f005; `hs-artwork-choices.js` 6fed74427fdca77e1e591699bfebdd81. Windows working-copy CRLF hashes differ from the committed LF blobs; comparison used the actual committed bytes. The recently-viewed guard checksum remains 0a86fd5e3ff25b36eb639d67585c9ca1.

Actual unpublished portrait page: Fine ink drawing / Hilarious choices persist across reload, existing exact note/signature remain unchanged, reference artwork remains explicitly labeled and Preview only is disabled. Restored Vintage screenprint / Warm with a wink; editor Save remains disabled. Screenshot retained privately as `master/personalization-unpublished-verified.png`. This passes the bounded successful-selection/reload path, not the full failure-injection or whole-product journey.

## Economics and delivery

All **13 dated Brooklyn USD delivered-cost observations** and provisional 50% supplier-cost-margin floors reconcile independently. The existing economics suite passes 13 tests. E1-10 passes only for these exact conditions, not a national price or net margin. The existing all-cost model still blocks all 70 scenarios on missing inputs; owner-deferred labor and accounting reconciliation stay deferred.

| Configuration | Recorded delivered cost | Provisional supplier-cost floor |
|---|---:|---:|
| Each selected 11oz mug color | $16.55 | $33.10 |
| Unframed 12x18 | $18.52 | $37.04 |
| Each selected 12x18 frame color | $47.98 | $95.96 |
| Tan sherpa 50x60 | $54.60 | $109.20 |
| Conditional 16x16 pillow | $28.18 | $56.36 |
| Mug + black frame | $64.09 | $128.18 |
| Mug + sherpa | $70.71 | $141.42 |

The two observed mixed baskets save only $0.44 against separate orders, with no shipping saving: one fewer $0.40 surcharge plus $0.04 supplier tax. Each additional delivered-cost dollar requires two additional revenue dollars to preserve this limited margin. This is not approval for bundle discounts or live prices.

Printful's current [tax calculation guidance](https://help.printful.com/hc/en-us/articles/50264716030993-How-is-sales-tax-calculated) uses retail price for Alaska, California and Massachusetts, and retail plus retail shipping for Connecticut. Therefore a fixed Brooklyn supplier-tax amount cannot certify nationwide costs. Account exemption, currency/FX, exact destination coverage and production-route quote parity remain unverified. No business tax conclusion is inferred.

The current [holiday surcharge guidance](https://help.printful.com/hc/en-us/articles/41396792413457-What-is-the-holiday-shipping-surcharge-and-does-it-affect-my-orders) confirms $0.40 once per US order, including multiple shipments, from 15 October 2026 to 17 January 2027. This is already in the recorded costs. Supplier charges do not prove storefront collection. [Shipping rules](https://help.printful.com/hc/en-us/articles/50265179887889-How-do-I-calculate-shipping-costs-for-different-types-of-orders) do not justify a single-package promise. Exact Alaska/Hawaii availability and Shopify coverage remain open.

Master browser readback: Teeinblue's Printful connection selects **Heartside**, default selling region **Worldwide**, with **Auto confirm order unchecked**. This matches the previously inspected Printful store label and adds a verified Teeinblue manual-confirmation control. The page exposes no account/store identifier or billing currency in its visible selected controls. Label parity is not full account or price-basis parity; the catalog/manual-quote differences remain unexplained. No settings were saved or tested.

## Product and supplier qualification

**Ornament:** the official [Printify Ceramic Decoration Ornament (1pc)](https://printify.com/app/products/1632/generic-brand/ceramic-decoration-ornament-1pc), SwiftPOD, has a round 2.80-inch option and explicitly distinct Front side / Back side print areas with a US provider. Ceramic, golden string and gift-packaging options are supplier facts. Exact round variant, template pixel dimensions, safe circle/hole exclusion, packaging selection, account availability, quote and fulfillment hold remain unverified. E3-O01/O02 advance to partial, not launch qualification.

[Teeinblue's Printify guide](https://support.teeinblue.com/en/article/how-to-setup-products-fulfill-order-for-printify-sellers-tbczpv/) supports native API import and fulfillment while preserving print-area names. Its CSV route automatically fills only the first/front design; additional sides require manual URL handling. Native API is the candidate route. Master also verified **Printify: Not Connected** in the actual Teeinblue provider list. No connection, import or provider switch occurred. A new provider/account route remains a consequential setup choice after exact product qualification. The alternative Harrier two-side product repeats one design and is unsuitable for an independent back note.

**Pillow:** master selected the exact 16x16 size in the official catalog. File guidelines still show only 18x18, 20x12 and 22x22 with corresponding 19x19, 21x13 and 23x23 files. The same ZIP is offered; no authoritative 16x16 cut/seam/safe geometry appears. The imported 17x17 label and 5100-pixel areas do not resolve it. E3-L01 remains blocked; another identical page check adds no evidence. Obtain exact supplier confirmation/template. Screenshot retained in private scratch.

**Sherpa:** read-only native data reconfirms Tan 50x60 and portrait 53x63 / landscape 63x53 print areas. The [official catalog](https://www.printful.com/custom/blankets/personalized/sublimated-sherpa-blanket) supports the smooth printed face and polyester/sherpa construction. Source detail, final placement and physical feel remain separate gates.

## Support and remaining handoff

Krish chose to send the prepared exact-output recovery question himself. No permission to send is pending and no agent sent it. The question concerns restoring existing generated outputs into a standard product-page test order without uploading again or generating replacements. Only the older portrait remains visibly retained in the Shopify preview. The brief payment-maintenance window is accepted in principle; exact product visibility, saved-output reuse and test/restoration actions remain unapproved/unverified. Normal payments remain active.

Reports and original worker artifacts remain in the private `heartside-parallel-2026-10-26` scratch directory, split by lane. Public evidence omits customer data, private service identifiers and credentials. This work reduces launch risk; no revenue movement or launch readiness is claimed.


## Direct UI recovery inspection after owner challenge

The owner challenged whether an ordinary interface path had been missed. A bounded native/Shopify UI inspection found a useful path: in the unpublished theme editor, choose Products > Default product, then preview the existing draft portrait. Shopify adds its standard `view=__DEFAULT__` preview override; no product template assignment or theme save is required. This exposes Teeinblue photo controls hidden by the paused review template.

Observed results:
- Campaign editor photo is empty. The documented non-generating Generate test design action stops with required photo/name/note validation. No test design or image generation was produced.
- Campaign Logs contains Publication History and Edit Activities, with configuration events rather than a generated-output gallery. Assets exposes clipart/vector/global-option/font categories; no recent customer-output recovery selector was present in the inspected menu. This is bounded UI evidence, not a claim about every provider capability.
- The standard product form retains the older October 23 photo and explicitly warns: “Your details changed after this photo was processed. Please upload it again.” The rendered image has natural dimensions 680x1024.
- Recustomize image opens zoom/rotate/position controls with Cancel and Save. Saving unchanged placement succeeds and closes the dialog, but leaves the stale-photo warning unchanged. No new upload, processing screen, cart submission or order occurred. Provider billing was not queried; support previously confirmed placement saves do not trigger AI generation.
- No gallery, URL restore or generated-output version selector was available in the inspected photo field/placement editor. This route does not recover current Painterly/Ink outputs or establish their original dimensions.

The standard-template discovery corrects the earlier incomplete UI investigation. The precise remaining dependency is restoration of the newer saved outputs into a supported current customization, not whether placement editing exists. The owner-sent support question remains relevant in that narrower form. Original paused portrait review restored; no editor save, product assignment, payment or publication change. Private screenshot: `master/ordinary-photo-stale-after-placement.png`.
