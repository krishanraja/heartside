"""Historical October24 supplier-cost scenario; not the current net-margin policy."""
import argparse
import json
from decimal import Decimal, ROUND_CEILING
from pathlib import Path


def report(data):
    target = Decimal(data["current_pricing_basis"]["target_supplier_cost_margin"])
    if not Decimal(0) < target < Decimal(1):
        raise ValueError("Margin must be between zero and one")
    rows = []
    for observation, quote in data["quote_observations"].items():
        if quote["currency"] != "USD":
            raise ValueError("Explicit currency conversion required")
        total = sum(Decimal(quote[k]) for k in
                    ("base", "shipping", "holiday_surcharge", "seller_borne_tax"))
        if total <= 0 or total != Decimal(quote["total"]):
            raise ValueError(f"Quote does not reconcile: {observation}")
        price = (total / (1 - target)).quantize(Decimal("0.01"), rounding=ROUND_CEILING)
        rows.append((quote.get("variant", quote.get("order_id")), total, price))
    text = ["# Heartside historical supplier-cost scenario (October24)", "",
            "Owner direction, October 24, 2026: defer labor calibration for now and use cost price plus margin. "
            "This historical view applies the former50% target to delivered supplier cost. Price = cost / (1 - 0.50), "
            "so a50% margin doubles cost; it is not a50% markup. October26 policy supersedes this: maximize total net profit subject to a30% net floor. These historical supplier-only results are not current price recommendations.", "",
            "Cost includes product, supplier shipping, the quoted seasonal surcharge and supplier tax. "
            "All quotes are unpaid Basic-order observations for Brooklyn, NY. "
            "The conditional ornament has no qualified quote and no calculated price.", "",
            "| Configuration | Delivered supplier cost | Price at 50% supplier-cost margin |",
            "|---|---:|---:|"]
    text += [f"| {name} | ${cost:.2f} | ${price:.2f} |" for name, cost, price in rows]
    text += ["", "These are exact arithmetic floors before discounts, not approved live prices. "
             "Payment fees, AI, apps, refunds/remakes, labor, acquisition, overhead, FX and business profit tax "
             "are outside this simplified view. Their unknown inputs remain unknown in the separate all-cost model. "
             "No 50% net-margin certification is claimed. Wider US delivery and parity with the Teeinblue fulfillment "
             "route remain unverified.", ""]
    return "\n".join(text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("calibration", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = report(json.loads(args.calibration.read_text(encoding="utf-8")))
    if args.output:
        args.output.write_text(result, encoding="utf-8")
    else:
        print(result)
