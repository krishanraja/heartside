# Evidence-aware net economics

Current owner policy (October26): maximize total net profit subject to a30% net operating floor. `calibration.json.target_margin` is0.30; see `docs/evidence/2026-10-26-pricing-ruling.md`. Actual costs remain unresolved; no net certification or live offer is implied.

Historical direction (October24; superseded): defer labor calibration and produce cost price plus margin for now. `python tools/economics/cost_price.py tools/economics/calibration.json --output <path.md>` creates the provisional 50% delivered-supplier-cost-margin view from the 13 observed quotes. It verifies each total and rounds the price upward to cents. This view excludes operating costs and does not certify net margin or authorize live prices. The all-cost model below remains intact, with missing inputs still unknown.

Offline planning engine for E1 of the October 24 continuation. It never calls a service, changes a price or approves a release. `calibration.json` contains account observations and explicit missing inputs. `working-sensitivity.json` is a deliberately hypothetical override, not an approved commercial case.

From the repository root:

```powershell
python -m unittest discover -s tools/economics -v
python tools/economics/net_margin.py tools/economics/calibration.json --orders-per-period 1 10 25 100 250
python tools/economics/net_margin.py tools/economics/calibration.json --scenario tools/economics/working-sensitivity.json --orders-per-period 1 10 25 100 250 --discount 0.10
```

Use `--output <local-path>` to save JSON. Do not commit customer records, invoices or private account identifiers. The source log is `docs/evidence/2026-10-24-economics-calibration.md`.

Every cost cell requires a value, evidence status and source. A missing cost blocks price output. An assumed or provisional input keeps the result `UNVERIFIED_SCENARIO`. Even verified forecast inputs cannot certify realized margin or authorize a live price. Revalidate variable fees, subscriptions and quotes before release.

The order calculation includes product quantities, an explicit basket shipping quote, seller-borne taxes, payment on revenue plus collected tax, customization-line fees, all-attempt AI cost, labor, acquisition, other variable costs, refund/remake reserve and allocated operating overhead. A shared customization with quantity two is one line; two separate customizations are two lines. Fixed payment, acquisition and overhead are counted once per order. Currency conversion is explicit; missing GBP-to-USD conversion blocks the result.

The minimum paid revenue is `fixed / (1 - variable - target / (1 - business_profit_tax))`, rounded up to cents. A nonpositive denominator fails. List price is then divided by `1 - discount`, so the maximum modeled discount still leaves the paid floor. This is arithmetic, not evidence that the customer will pay that price.

Volume values are sensitivities, not a forecast of demand. A period projection assumes identical baskets and the specified marginal Teeinblue tier for the whole period; it does not simulate the mix of baskets or a billing-cycle tier transition. Replace it with actual mix and cycle data before budgeting a real month. The period is 30 days; calendar-month charges are normalized explicitly. Shopify's current promotional GBP charge and the hypothetical post-promotion stress case are distinct.

`realized_period` accepts ledger totals separately: refunds reduce revenue once, actual remakes are costs, and a reserve cannot also be entered. Period overhead remains an expense at zero sales; margin is undefined when net revenue is nonpositive. It requires an explicit business profit-tax treatment. A calculated ledger result is not an accounting audit.

Current boundaries: 13 configured Brooklyn supplier quotes are recorded, but wider destinations and integration route parity remain unverified. End-to-end AI/review/support cost, organic acquisition cost, shared overhead/FX and business tax treatment remain incomplete. Labor calibration is deferred by the owner. No SKU has a certified net-margin selling price.
