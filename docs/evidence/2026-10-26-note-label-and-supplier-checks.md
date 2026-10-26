# Note label and supplier checks, 26 October 2026

## Bounded repair contract

Target: existing unpublished review theme and isolated draft portrait artwork; starting code 486dbde. Runtime: Windows PowerShell, authenticated existing GitHub/native connections. Source of truth: shopify/assets/hs2.js and the native field label. Authority: continue the approved draft repairs; no generation, public release, purchase or price changes.

Change: recognize both legacy Line 4 and buyer-facing Your note as the same exact-copy field. Deploy this compatible bridge before patching only the native form_label. Keep layer identity, note text, maximum length and geometry unchanged.

Pass signals: 19 integration checks, minification, native independent readback, actual draft field navigation and edited text surviving reload. Status: all of these pass. Guarded unpublished deployment 40303820155 succeeded at 4c0909c; native version 3078594 differs only in form_label. Campaign Update propagated the label. Actual draft form shows Your note, and the synthetic edited sentence survived reload exactly. The original review note was restored. Draft theme/product and disabled generation/purchase controls were independently observed. Screenshot: private workspace outputs/note-label-deployed.png.

An additional 36 existing copy-request/artwork-state regressions and the grounded profile check pass. They cover no-dispatch selection, duplicate requests, uncertain response/reload, late results, manual ownership and invalidation locally; they are not live provider or production-order proof.

ROLLBACK READY: restore native form_label to Line 4 using the same patch tool; redeploy prior known-good commit 1387432 through the guarded workflow to the existing unpublished theme, retaining live and overwrite flags false. Existing authentication and prior successful workflow are verified. Read back native field and actual draft controls after recovery.

## Supplier checks

Read official product pages and native selected variants on 26 October. Imported available flags are not stock proof. Exact configured quotes remain separate from public starting prices.

- Sherpa: selected 50x60 product requires a 53x63-inch print file. The imported 15900x18900 area has this ratio and dimensions at 300 DPI. Supplier requires at least 150 DPI, sRGB, full bleed and safe-area placement; warns that graphics may shift up to two inches and small details/text may blur. Source: https://www.printful.com/custom/blankets/personalized/sublimated-sherpa-blanket . This does not prove effective source resolution or final motif placement.
- Basic pillow: 16x16 is offered with polyester cover and insert shipped unassembled. Current public guideline ZIP contains only older 18x18, 20x12 and 22x22 templates. The 17x17 imported print area is therefore not yet authoritatively verified for the selected 16x16. Opened a disposable unsaved design to inspect the selected size, then discarded it without creating a template, product or order. Source: https://www.printful.com/custom/pillows/decorative/basic-pillow .
- Native selected mug choices are all 11oz, in black, pink, red, dark blue and dark green. Selected unframed print and all three frame colors are 12x18; sherpa is tan 50x60; pillow is 16x16. Exact native/account mappings stay in private operations. Supplier geometry and US stock still need per-route verification.
- Mug official file guidelines confirm 9x3.5 inches at at least 300 DPI, matching the isolated 2700x1050 artwork and selected print area. The 15oz area is 9x3.8 inches and is not selected. US/Mexico stock-table cells are in-stock green for all five selected 11oz colors. This is a dated catalog indication, not a fulfillment guarantee. Source: https://www.printful.com/custom/mugs/personalized/ceramic-mug . Screenshot retained privately at .scratch/heartside-supplier-2026-10-26/mug-us-stock.png.
- Independent Shopify readback after campaign Update confirms the portrait remains DRAFT with three 12x18 frame variants, unchanged placeholder prices and corrected one-note description. The blanket remains DRAFT with one Tan / 50 x 60 variant, no images and an explicit private/not-for-sale description. This is record integrity, not supported native binding or production acceptance.
- Official poster and framed-poster pages confirm 12x18 availability and the recorded matte-paper/frame materials. Exact safe-area templates and current route stock were not retrieved: the authenticated supplier page stalled twice, including after reconnect. Do not substitute historical or third-party guideline dimensions.

No AI generation or paid action was used for these checks.

## Continued private unframed preparation

Confirmed the only existing campaign using the unframed base was the older product. Created one isolated private-acceptance campaign, attached the existing unframed base and the same portrait artwork at top/left zero, 3600x5400 on its 12x18 print area. Independent readback confirms no store instances. No new artwork generation, mockup generation or Shopify publication occurred.

The attach-product operation automatically includes all 33 base variants. The connector has no campaign-only variant removal/select operation; do not change shared base availability to work around this. Campaign UI must restrict it to the selected 12x18 before any binding. Browser controls failed on three consecutive calls (including after reconnect and a return to Teeinblue), so that selection remains incomplete. Exact target IDs and this condition are retained in private operations. This is prepared native placement, not a completed or saleable product.

Theme Check reports zero offenses. The 2026 holiday hub was refreshed and still says cutoff dates will be shared soon: https://www.printful.com/guides/holiday-readiness-hub . No dated delivery claim is supported. The existing support follow-up was reread; no further reply is present and none was sent. Support screenshots illustrate artwork canvas size and the Orders tab, not the current generated original or its dimensions.
