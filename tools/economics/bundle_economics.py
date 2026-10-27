"""Offline bundle-offer, free-redo and Artist's touch evaluation. Never changes a live price.

Applies four labeled sensitivity stacks to the evidence-tagged model and reports
every gift basket at 0, 15 and 20% off against the 30% floor, the verdicts that
flip between stacks, every 2-4 gift mix under candidate discount rules, the AI
cost of one redo per gift and the Artist's touch line margin.

The policy floor is aggregate across the order mix; a per-basket check is a
conservative guardrail, not the policy itself. Results are modeled scenarios,
not realized margin, and authorize no discount, product or price.
"""
from __future__ import annotations

import argparse
import copy
import itertools
import json
from collections import Counter
from decimal import Decimal as D
from pathlib import Path

from net_margin import apply_scenario, forecast, service_line

HERE = Path(__file__).parent
# Configured list prices, NOW.md readback as of 2026-10-27. Re-read NOW.md before reuse.
LIST_PRICES = {"mug": D("45"), "unframed": D("59"), "framed": D("119"), "blanket": D("129")}
PREFIXES = (("mug", "mug_"), ("unframed", "unframed_"), ("framed", "frame_"), ("blanket", "blanket_"))
REPRESENTATIVE = {"mug": "mug_black", "unframed": "unframed_12x18", "framed": "frame_black_12x18", "blanket": "blanket_50x60"}
SHORT = {"mug": "M", "unframed": "U", "framed": "F", "blanket": "B"}
DISCOUNTS = (D("0"), D("0.15"), D("0.20"))
ADDON_PRICES = (D("19"), D("24"), D("29"))
STACKS = (
    ("A", "Repo working sensitivity, no checkout app", ("working-sensitivity.json",)),
    ("A+app", "Repo working sensitivity plus the USD69/month checkout app",
     ("working-sensitivity.json", "checkout-app-sensitivity.json")),
    ("B-app", "ECONOMICS.md set without the checkout app",
     ("working-sensitivity.json", "economics-md-sensitivity.json", "supplier-tax-sensitivity.json")),
    ("B", "ECONOMICS.md set as stated, with the checkout app",
     ("working-sensitivity.json", "economics-md-sensitivity.json", "supplier-tax-sensitivity.json",
      "checkout-app-sensitivity.json")),
    ("A+app+tax", "Bounding case: repo set with the checkout app and supplier tax borne",
     ("working-sensitivity.json", "supplier-tax-sensitivity.json", "checkout-app-sensitivity.json")),
)


def decided_tier(counts):
    """Owner decision 2026-10-27, inactive: 15% off 2 gifts, 20% off 3 or more."""
    gifts = sum(counts.values())
    return D("0") if gifts < 2 else D("0.15") if gifts == 2 else D("0.20")


def rule_two_mugs_list(counts):
    """Smallest change for stack A: two mugs alone pay list price."""
    return D("0") if counts == Counter(mug=2) else decided_tier(counts)


def rule_mug_step_down(counts):
    """Exact exceptions for the stricter stacks: two mugs pay list, one mug plus
    one unframed print gets 10%, three mugs alone get 15%."""
    if counts == Counter(mug=2):
        return D("0")
    if counts == Counter(mug=1, unframed=1):
        return D("0.10")
    if counts == Counter(mug=3):
        return D("0.15")
    return decided_tier(counts)


def rule_needs_frame_or_blanket(counts):
    """Simple form: baskets with no framed portrait or blanket get nothing at
    two gifts and 15% at three or more."""
    if counts["framed"] or counts["blanket"]:
        return decided_tier(counts)
    return D("0") if sum(counts.values()) < 3 else D("0.15")


RULES = (("as decided", decided_tier), ("two mugs pay list", rule_two_mugs_list),
         ("mug step-down", rule_mug_step_down), ("needs frame or blanket", rule_needs_frame_or_blanket))


def family(variant):
    for name, prefix in PREFIXES:
        if variant.startswith(prefix):
            return name
    return None


def basket_counts(order):
    counts = Counter()
    for line in order["items"]:
        name = family(line["variant"])
        if name is None:
            return None
        counts[name] += int(line["quantity"])
    return counts


def label(counts):
    return "".join(SHORT[name] * counts[name] for name, _ in PREFIXES)


def list_price(counts):
    return sum((LIST_PRICES[name] * n for name, n in counts.items()), D("0"))


def build_stack(calibration, files):
    model = calibration
    for name in files:
        model = apply_scenario(model, json.loads((HERE / name).read_text(encoding="utf-8")))
    return model


def with_all_mixes(model, sizes=(1, 2, 3, 4)):
    """Return a copy holding an order for every mix of the four products.

    Named rows are used where they exist; any other mix is synthesized from the
    single-item rows of the same model: summed shipping and supplier tax, one
    surcharge, one customization line per gift. Synthesized cells are assumptions.
    """
    model = copy.deepcopy(model)
    index = {}
    for order_id, order in model["orders"].items():
        counts = basket_counts(order)
        if counts is not None and all(line["variant"] == REPRESENTATIVE[family(line["variant"])] for line in order["items"]):
            index.setdefault(label(counts), order_id)
    for size in sizes:
        for combo in itertools.combinations_with_replacement([name for name, _ in PREFIXES], size):
            counts = Counter(combo)
            key = label(counts)
            if key in index:
                continue
            singles = [model["orders"][REPRESENTATIVE[name]] for name in combo]

            def cell(value):
                return {"value": str(value), "status": "assumption",
                        "source": "Synthesized mix: sum of single-item rows, one surcharge"}
            model["orders"]["mix_" + key] = {
                "items": [{"variant": REPRESENTATIVE[name], "quantity": 1} for name in combo],
                "shipping": cell(sum(D(s["shipping"]["value"]) for s in singles)),
                "holiday_surcharge": copy.deepcopy(singles[0]["holiday_surcharge"]),
                "seller_borne_tax": cell(sum(D(s["seller_borne_tax"]["value"]) for s in singles)),
                "collected_sales_tax_rate": copy.deepcopy(singles[0]["collected_sales_tax_rate"]),
            }
            index[key] = "mix_" + key
    return model, index


def evaluate(model, order_id, volume, discount):
    counts = basket_counts(model["orders"][order_id])
    return forecast(model, order_id, volume, discount, list_price(counts))


def run(calibration, volume):
    stacks = {}
    for key, title, files in STACKS:
        model, index = with_all_mixes(build_stack(calibration, files))
        rows = {}
        for mix, order_id in index.items():
            counts = basket_counts(model["orders"][order_id])
            rows[mix] = {"order": order_id, "gifts": sum(counts.values()),
                         "results": {str(d): evaluate(model, order_id, volume, d) for d in DISCOUNTS}}
        stacks[key] = {"title": title, "files": list(files), "model": model, "rows": rows}
    return stacks


def money(value):
    return f"{D(value):,.2f}"


def signed(value):
    value = D(value)
    return ("+" if value >= 0 else "-") + f"{abs(value):,.2f}"


def headroom_at(row, discount):
    return D(row["results"][str(discount)]["headroom_at_discount"])


def report(calibration, volume):
    stacks = run(calibration, volume)
    named = [(oid, o) for oid, o in calibration["orders"].items()
             if (c := basket_counts(o)) is not None and sum(c.values()) >= 2]
    first = next(iter(stacks.values()))
    out = [f"# Bundle, redo and Artist's touch economics at {volume} orders per 30 days", "",
           "Modeled scenario only: not realized margin, no live price, discount or product authorized. "
           "The 30% floor is the policy for the aggregate order mix; per-basket verdicts below are a conservative guardrail.", "",
           "## Stacks", "", "| Key | Stack | Files applied in order | Fixed cost per order before items | Overhead per 30 days |", "|---|---|---|---:|---:|"]
    for key, stack in stacks.items():
        r = stack["rows"]["M"]["results"]["0"]
        per_order = D(r["total_fixed_per_order"]) - D(r["base_total"]) - D(r["supplier_shipping"]) - D(r["seller_borne_tax"]) \
            - D(r["teeinblue_customization_fee"]) - D(r["ai_per_customization_line_total"])
        out.append(f"| {key} | {stack['title']} | {', '.join(stack['files'])} | {money(per_order)} | {money(r['fixed_period_overhead'])} |")
    out += ["", "Fixed cost per order before items = per-order AI, support, acquisition, payment fixed fee, holiday surcharge and allocated overhead "
            "(rounded up). Every gift adds supplier base, shipping, supplier tax where borne, one USD0.40 customization fee and one USD0.13 redo.", ""]

    # Main verdict table: named multi-gift baskets at the decided tier.
    out += ["## Verdict at the decided tier (named basket rows)", "",
            "| Basket | Mix | Gifts | List | Tier | Paid at tier | " + " | ".join(f"{k} min paid / headroom" for k in stacks) + " |",
            "|---|---|---:|---:|---:|---:|" + "---:|" * len(stacks)]
    for oid, order in named:
        counts = basket_counts(order)
        mix = label(counts)
        tier = decided_tier(counts)
        cells = []
        for stack in stacks.values():
            r = stack["rows"][mix]["results"][str(tier)]
            mark = "pass" if r["meets_target_at_discount"] else "FAIL"
            cells.append(f"{money(r['minimum_paid_revenue'])} / {signed(r['headroom_at_discount'])} {mark}")
        r = first["rows"][mix]["results"][str(tier)]
        out.append(f"| {oid} | {mix} | {sum(counts.values())} | {money(list_price(counts))} | {int(tier * 100)}% | {money(r['paid_revenue_at_discount'])} | " + " | ".join(cells) + " |")
    out += ["", "Min paid = the model's minimum paid revenue for a 30% modeled margin on that basket; headroom = paid at tier minus min paid.", ""]

    # Detail per stack at 0, 15 and 20% for every named row, singles included.
    for key, stack in stacks.items():
        out += [f"## {key}: {stack['title']}, every basket at 0, 15 and 20% off", "",
                "| Basket | Mix | List | Min paid at 30% | Headroom 0% | Paid 15% | Headroom 15% | Paid 20% | Headroom 20% |",
                "|---|---|---:|---:|---:|---:|---:|---:|---:|"]
        for oid, order in calibration["orders"].items():
            counts = basket_counts(order)
            if counts is None or (sum(counts.values()) == 1 and order["items"][0]["variant"] != REPRESENTATIVE[family(order["items"][0]["variant"])]):
                continue
            row = stack["rows"][label(counts)]
            res = row["results"]
            out.append(f"| {oid} | {label(counts)} | {money(list_price(counts))} | {money(res['0']['minimum_paid_revenue'])} | "
                       f"{signed(res['0']['headroom_at_discount'])} | {money(res['0.15']['paid_revenue_at_discount'])} | {signed(res['0.15']['headroom_at_discount'])} | "
                       f"{money(res['0.20']['paid_revenue_at_discount'])} | {signed(res['0.20']['headroom_at_discount'])} |")
        out.append("")

    # Flips: app on/off within each set, and set A versus set B, at every discount.
    out += ["## Verdict flips, every 1-4 gift mix at 0, 15 and 20% off", "",
            "| Change | Flips at the decided tier | 0% | 15% | 20% |", "|---|---|---|---|---|"]
    for left, right, why in (("A", "A+app", "Add the app to the repo set"),
                             ("B-app", "B", "Add the app to the ECONOMICS.md set"),
                             ("A", "B", "Repo set to ECONOMICS.md set as stated"),
                             ("A+app", "A+app+tax", "Add supplier tax to the repo set with the app")):
        cells = []
        for discount in (None,) + DISCOUNTS:
            flips = []
            for mix, row in stacks[left]["rows"].items():
                counts = Counter({n: mix.count(s) for n, s in SHORT.items() if mix.count(s)})
                if discount is None and row["gifts"] < 2:
                    continue
                d = decided_tier(counts) if discount is None else discount
                a = row["results"][str(d)]["meets_target_at_discount"]
                b = stacks[right]["rows"][mix]["results"][str(d)]["meets_target_at_discount"]
                if a != b:
                    flips.append(f"{mix} {'pass to FAIL' if a else 'FAIL to pass'}")
            cells.append(", ".join(flips) if flips else "none")
        out.append(f"| {why} ({left} to {right}) | " + " | ".join(cells) + " |")
    out.append("")

    # Rule validation over every 2-4 gift mix.
    out += ["## Discount rules checked against every 2-4 gift mix", "",
            "| Rule | " + " | ".join(f"{k} failing mixes" for k in stacks) + " |", "|---|" + "---|" * len(stacks)]
    for name, rule in RULES:
        cells = []
        for stack in stacks.values():
            fails = []
            for mix, row in stack["rows"].items():
                if row["gifts"] < 2:
                    continue
                counts = Counter({n: mix.count(s) for n, s in SHORT.items() if mix.count(s)})
                d = rule(counts)
                if d not in DISCOUNTS:
                    r = forecast(stack["model"], row["order"], volume, d, list_price(counts))
                else:
                    r = row["results"][str(d)]
                if not r["meets_target_at_discount"]:
                    fails.append(f"{mix} at {int(d * 100)}% ({signed(r['headroom_at_discount'])})")
            cells.append(", ".join(fails) if fails else "none")
        out.append(f"| {name} | " + " | ".join(cells) + " |")
    out += ["", "Two-gift baskets at 20% (in case of a later change) failing:", ""]
    for key, stack in stacks.items():
        fails = [f"{mix} ({signed(headroom_at(row, D('0.20')))})" for mix, row in stack["rows"].items()
                 if row["gifts"] == 2 and not row["results"]["0.20"]["meets_target_at_discount"]]
        out.append(f"- {key}: " + (", ".join(fails) if fails else "none"))
    out.append("")

    # Redo note.
    out += ["## One free redo per gift", "", "| Stack | Per-order AI allowance | Per-gift redo | AI at 1 / 2 / 3 gifts | Generations the per-order allowance covers |",
            "|---|---:|---:|---:|---:|"]
    for key, stack in stacks.items():
        costs = stack["model"]["costs"]
        per_order = D(costs["ai_all_attempts_per_order"]["value"])
        per_gift = D(costs["ai_per_customization_line"]["value"])
        totals = " / ".join(money(per_order + per_gift * n) for n in (1, 2, 3))
        out.append(f"| {key} | {money(per_order)} | {money(per_gift)} | {totals} | {(per_order / per_gift).quantize(D('0.1'))} |")
    out.append("")

    # Artist's touch.
    model = first["model"]
    service = model["services"]["artists_touch"]
    out += ["## Artist's touch add-on line", "",
            f"Labor {service['labor_minutes_low']['value']} to {service['labor_minutes_high']['value']} minutes at USD{service['labor_hourly_value']['value']}/hour "
            f"(stated planning value), extra AI USD{service['extra_ai_per_service']['value']}, payment and reserve on the line, no supplier cost, "
            "no added acquisition or overhead. Identical in every stack.", "",
            "| Price | Discount | Paid | Minutes | Labor | Profit | Line margin | Meets 30% | Max minutes at 30% | List needed at these minutes |",
            "|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|"]
    for price in ADDON_PRICES:
        for discount in (D("0"), D("0.20")):
            for minutes_key in ("labor_minutes_low", "labor_minutes_high"):
                if discount and minutes_key == "labor_minutes_high":
                    continue
                r = service_line(model, "artists_touch", price, minutes_key, discount)
                out.append(f"| {money(price)} | {int(discount * 100)}% | {money(r['paid_revenue'])} | {r['labor_minutes']} | {money(r['labor_cost'])} | "
                           f"{signed(r['modeled_profit'])} | {D(r['modeled_margin']) * 100:.1f}% | {'yes' if r['meets_target'] else 'no'} | "
                           f"{r['max_minutes_at_target']} | {money(r['minimum_list_price_at_target'])} |")
    out.append("")
    return "\n".join(out), stacks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="calibration.json; the four sensitivity stacks are read beside this script")
    parser.add_argument("--orders-per-period", type=int, default=25)
    parser.add_argument("--output", type=Path, help="Optional JSON of every row; no customer data is read or written")
    args = parser.parse_args()
    calibration = json.loads(args.input.read_text(encoding="utf-8-sig"))
    text, stacks = report(calibration, args.orders_per_period)
    if args.output:
        payload = {key: {"title": s["title"], "files": s["files"], "rows": s["rows"]} for key, s in stacks.items()}
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, indent=2, default=str) + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
