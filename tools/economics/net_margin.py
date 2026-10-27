"""Offline, evidence-aware net operating margin model. Never changes a live price.

Forecast reserve is an expense; realized refunds reduce revenue instead.
Inputs and outputs exclude pass-through sales tax from revenue. Payment fees
can still apply to that tax. All money is Decimal and minimum prices round UP.
"""
from __future__ import annotations

import argparse
import copy
import json
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR
from pathlib import Path

D = Decimal
ZERO = D("0")
CENT = D("0.01")
STATUSES = {"verified", "observed_sample", "public_starting", "assumption", "unknown", "historical"}


def number(value, path, *, rate=False, positive=False):
    if isinstance(value, bool):
        raise ValueError(f"{path}: boolean is not a number")
    try:
        result = D(str(value))
    except Exception as exc:
        raise ValueError(f"{path}: invalid number") from exc
    if not result.is_finite() or result < 0 or (positive and result == 0) or (rate and result >= 1):
        raise ValueError(f"{path}: outside allowed range")
    return result


def integer(value, path, minimum=0):
    result = number(value, path)
    if result != result.to_integral_value() or result < minimum:
        raise ValueError(f"{path}: expected integer >= {minimum}")
    return int(result)


def money(value):
    return str(value.quantize(CENT, rounding=ROUND_CEILING))


class Inputs:
    def __init__(self):
        self.missing = []
        self.uncertain = []

    def read(self, cell, path, **kwargs):
        if not isinstance(cell, dict) or cell.get("status") not in STATUSES or not cell.get("source"):
            raise ValueError(f"{path}: requires value, evidence status and source")
        if cell.get("value") is None:
            self.missing.append(path)
            return None
        if cell["status"] != "verified":
            self.uncertain.append({"input": path, "status": cell["status"], "source": cell["source"]})
        return number(cell["value"], path, **kwargs)


def blue_fee(order_ordinal, customization_lines):
    """Blue-plan marginal fee. Same-design quantity is not another customization.

    Ordinal is across ALL connected stores in the billing cycle. It is NOT a
    forecast of Heartside volume. Caller must establish that account input.
    """
    n = integer(order_ordinal, "order_ordinal", 1)
    lines = integer(customization_lines, "customization_lines", 0)
    rate = ZERO if n <= 100 else D("0.40") if n <= 1000 else D("0.20") if n <= 10000 else D("0.10")
    return rate * lines


def floor(fixed, variable_rate, target=D("0.50"), business_profit_tax=ZERO):
    fixed = number(fixed, "fixed")
    variable_rate = number(variable_rate, "variable_rate", rate=True)
    target = number(target, "target", rate=True, positive=True)
    tax = number(business_profit_tax, "business_profit_tax", rate=True)
    denominator = 1 - variable_rate - target / (1 - tax)
    if denominator <= 0:
        raise ValueError("Target impossible: nonpositive price denominator")
    return (fixed / denominator).quantize(CENT, rounding=ROUND_CEILING)


def apply_scenario(model, scenario):
    """Return a copy with explicit sensitivity inputs. Never fills a gap silently.

    `overrides` replace existing evidence cells only. `additions` add new rows
    (for example an overhead line) whose cells carry their own status and source;
    an addition may not replace anything that already exists.
    """
    model = copy.deepcopy(model)
    for path, value in scenario.get("overrides", {}).items():
        parent = model
        bits = path.split(".")
        for part in bits[:-1]:
            parent = parent[part]
        old = parent[bits[-1]]
        if not isinstance(old, dict) or "value" not in old:
            raise ValueError(f"Not an evidence cell: {path}")
        parent[bits[-1]] = {"value": value, "status": "assumption", "source": "Sensitivity only: " + scenario["name"]}
    for path, row in scenario.get("additions", {}).items():
        parent = model
        bits = path.split(".")
        for part in bits[:-1]:
            parent = parent[part]
        if bits[-1] in parent:
            raise ValueError(f"Addition would replace an existing input: {path}")
        cells = [row] if "value" in row else [v for v in row.values() if isinstance(v, dict)]
        for cell in cells:
            if cell.get("status") not in STATUSES or not cell.get("source") or "value" not in cell:
                raise ValueError(f"{path}: added cells require value, evidence status and source")
        parent[bits[-1]] = copy.deepcopy(row)
    return model


def forecast(model, order_id, volume, discount="0", list_price=None):
    """Order floor with a monthly allocation. Null costs block all price output.

    With `list_price`, also reports the paid revenue after `discount`, its
    headroom over the floor and the modeled margin at that paid revenue.
    """
    volume = integer(volume, "period_orders", 1)
    discount = number(discount, "discount", rate=True)
    offered = None if list_price is None else number(list_price, "list_price", positive=True)
    order = model["orders"][order_id]
    inp = Inputs()
    if model['currency'] != 'USD':
        raise ValueError('This calibration reports USD; convert source costs explicitly')
    period_days = number(model["period_days"], "period_days", positive=True)
    target = number(model["target_margin"], "target_margin", rate=True, positive=True)
    costs = {}
    for key in ("ai_all_attempts_per_order", "review_support_labor_per_order", "acquisition_per_order",
                "other_variable_per_order", "payment_fixed"):
        costs[key] = inp.read(model["costs"][key], "costs." + key)
    # Optional generation allowance charged once per customized line (gift), such
    # as the free in-cart artwork redo. Absent means the offer has no per-gift
    # allowance; a present cell with a null value blocks output like any cost.
    per_line_cell = model["costs"].get("ai_per_customization_line")
    ai_per_line = ZERO if per_line_cell is None else inp.read(per_line_cell, "costs.ai_per_customization_line")
    processing = inp.read(model["costs"]["payment_rate"], "costs.payment_rate", rate=True)
    reserve = inp.read(model["costs"]["refund_remake_reserve_rate"], "costs.refund_remake_reserve_rate", rate=True)
    sales_tax = inp.read(order["collected_sales_tax_rate"], "orders." + order_id + ".collected_sales_tax_rate", rate=True)
    seller_tax = inp.read(order["seller_borne_tax"], "orders." + order_id + ".seller_borne_tax")
    business_tax = inp.read(model["costs"]["business_profit_tax_rate"], "costs.business_profit_tax_rate", rate=True)
    ordinal = inp.read(model["costs"]["account_order_ordinal"], "costs.account_order_ordinal", positive=True)
    fixed_period = ZERO
    for name, row in model["overhead"].items():
        amount = inp.read(row["amount"], "overhead." + name + ".amount")
        share = inp.read(row["heartside_share"], "overhead." + name + ".heartside_share")
        currency = row.get('currency', 'USD')
        fx = D('1') if currency == 'USD' else inp.read(model['fx'][currency + '_USD'], 'fx.' + currency + '_USD', positive=True)
        if share is not None and share > 1:
            raise ValueError(f"overhead.{name}: allocation share exceeds 1")
        days = number(row["period_days"], f"overhead.{name}.period_days", positive=True)
        if amount is not None and share is not None and fx is not None:
            fixed_period += amount * fx * share * period_days / days
    base = ZERO
    lines = 0
    for line in order["items"]:
        quantity = integer(line["quantity"], "quantity", 1)
        variants = model["variants"][line["variant"]]
        value = inp.read(variants["base"], "variants." + line["variant"] + ".base")
        if value is not None:
            base += value * quantity
        lines += 1
    # Explicit order quotes prevent accidental merging of cross-category shipping.
    shipping = inp.read(order["shipping"], "orders." + order_id + ".shipping")
    surcharge = inp.read(order["holiday_surcharge"], "orders." + order_id + ".holiday_surcharge")
    if not model["accounting_boundary_confirmed"]:
        inp.uncertain.append({"input": "accounting_boundary", "status": "unknown", "source": model["accounting_boundary"]})
    result = {"order": order_id, "period_orders": volume, "period_days": str(period_days),
              "status": "BLOCKED_MISSING_INPUTS" if inp.missing else "UNVERIFIED_SCENARIO" if inp.uncertain else "FORECAST_INPUTS_VERIFIED",
              "missing": inp.missing, "uncertain": inp.uncertain,
              "volume_basis": "Sensitivity, not demand evidence. Period projection assumes identical baskets and the stated marginal app tier throughout.",
              "realized_margin_certified": False, "live_price_authorized": False}
    if inp.missing:
        return result
    fee = blue_fee(ordinal, lines)
    ai_lines = ai_per_line * lines
    overhead_per_order = fixed_period / volume
    fixed = sum(costs.values(), ZERO) + ai_lines + base + shipping + surcharge + seller_tax + fee + overhead_per_order
    variable = processing * (1 + sales_tax) + reserve
    try:
        paid = floor(fixed, variable, target, business_tax)
    except ValueError as exc:
        return {**result, "status": "IMPOSSIBLE_TARGET", "error": str(exc)}
    list_price = (paid / (1 - discount)).quantize(CENT, rounding=ROUND_CEILING)
    pretax = paid * (1 - variable) - fixed
    after_tax = pretax - max(pretax, ZERO) * business_tax
    result.update({"minimum_paid_revenue": money(paid), "minimum_list_price": money(list_price),
                   "maximum_tested_discount_rate": str(discount), "fixed_period_overhead": money(fixed_period),
                   "allocated_overhead_per_order": money(overhead_per_order), "base_total": money(base),
                   "supplier_shipping": money(shipping), "holiday_surcharge": money(surcharge),
                   "seller_borne_tax": money(seller_tax),
                   "teeinblue_customization_fee": money(fee), "customization_lines": lines,
                   "ai_per_customization_line_total": money(ai_lines),
                   "total_fixed_per_order": money(fixed), "variable_rate": str(variable),
                   "modeled_margin_at_floor": str(after_tax / paid) if paid else None,
                   "modeled_period_profit_at_floor": money(after_tax * volume)})
    if offered is not None:
        # Paid revenue rounds DOWN to cents; the floor rounds UP. Both lean conservative.
        paid_at = (offered * (1 - discount)).quantize(CENT, rounding=ROUND_FLOOR)
        pretax_at = paid_at * (1 - variable) - fixed
        after_at = pretax_at - max(pretax_at, ZERO) * business_tax
        result.update({"list_price": str(offered.quantize(CENT)), "paid_revenue_at_discount": str(paid_at),
                       "headroom_at_discount": str(paid_at - paid), "meets_target_at_discount": paid_at >= paid,
                       "modeled_margin_at_discount": str((after_at / paid_at).quantize(D("0.0001"), rounding=ROUND_FLOOR))})
    return result


def service_line(model, service_id, price, minutes_key, discount="0"):
    """Marginal economics of a paid service add-on attached to a gift order.

    No supplier item, shipping, surcharge or Teeinblue line unless the inputs say
    so. Fixed payment, acquisition and overhead are already carried by the gift
    order it attaches to, so they are not charged again here. Labor is minutes at
    a stated hourly value. Returns the line margin, never a live price.
    """
    price = number(price, "price", positive=True)
    discount = number(discount, "discount", rate=True)
    service = model["services"][service_id]
    target = number(model["target_margin"], "target_margin", rate=True, positive=True)
    inp = Inputs()
    prefix = "services." + service_id + "."
    processing = inp.read(model["costs"]["payment_rate"], "costs.payment_rate", rate=True)
    reserve = inp.read(model["costs"]["refund_remake_reserve_rate"], "costs.refund_remake_reserve_rate", rate=True)
    business_tax = inp.read(model["costs"]["business_profit_tax_rate"], "costs.business_profit_tax_rate", rate=True)
    sales_tax = inp.read(service["collected_sales_tax_rate"], prefix + "collected_sales_tax_rate", rate=True)
    supplier = inp.read(service["supplier_and_shipping"], prefix + "supplier_and_shipping")
    minutes = inp.read(service[minutes_key], prefix + minutes_key)
    hourly = inp.read(service["labor_hourly_value"], prefix + "labor_hourly_value")
    ai = inp.read(service["extra_ai_per_service"], prefix + "extra_ai_per_service")
    result = {"service": service_id, "list_price": str(price.quantize(CENT)), "discount": str(discount),
              "labor_minutes_input": minutes_key,
              "status": "BLOCKED_MISSING_INPUTS" if inp.missing else "UNVERIFIED_SCENARIO" if inp.uncertain else "FORECAST_INPUTS_VERIFIED",
              "missing": inp.missing, "uncertain": inp.uncertain,
              "realized_margin_certified": False, "live_price_authorized": False}
    if inp.missing:
        return result
    paid = (price * (1 - discount)).quantize(CENT, rounding=ROUND_FLOOR)
    variable = processing * (1 + sales_tax) + reserve
    labor = minutes * hourly / 60
    pretax = paid * (1 - variable) - supplier - labor - ai
    after_tax = pretax - max(pretax, ZERO) * business_tax
    # Largest labor cost that still leaves the target margin after business tax.
    labor_room = paid * (1 - variable) - supplier - ai - target * paid / (1 - business_tax)
    result.update({"paid_revenue": str(paid), "payment_and_reserve": money(paid * variable),
                   "labor_minutes": str(minutes), "labor_cost": money(labor), "extra_ai": money(ai),
                   "modeled_profit": str(after_tax.quantize(CENT, rounding=ROUND_FLOOR)),
                   "modeled_margin": str((after_tax / paid).quantize(D("0.0001"), rounding=ROUND_FLOOR)),
                   "meets_target": after_tax >= target * paid,
                   "max_minutes_at_target": str((labor_room * 60 / hourly).quantize(D("0.1"), rounding=ROUND_FLOOR)) if hourly else None,
                   "minimum_list_price_at_target": money(floor(supplier + labor + ai, variable, target, business_tax) / (1 - discount))})
    return result


def realized_period(revenue_before_returns, refunds, costs, business_profit_tax):
    """Actual ledger only: costs include actual remakes, never a refund reserve.

    Revenue is after discounts, before refunds, and excludes pass-through tax.
    All period overhead belongs in costs ONCE, including when no orders sell.
    """
    revenue = number(revenue_before_returns, "revenue_before_returns") - number(refunds, "refunds")
    if any("reserve" in k.lower() or "refund" in k.lower() for k in costs):
        raise ValueError("Realized costs must not contain refund/reserve entries; refunds reduce revenue once")
    expense = sum((number(v, k) for k, v in costs.items()), ZERO)
    tax = number(business_profit_tax, "business_profit_tax", rate=True)
    profit = revenue - expense
    after_tax = profit - max(profit, ZERO) * tax
    return {"net_revenue": str(revenue), "all_costs": str(expense), "profit": str(after_tax),
            "margin": str(after_tax / revenue) if revenue > 0 else None,
            "status": "MARGIN_UNDEFINED_NONPOSITIVE_REVENUE" if revenue <= 0 else "LEDGER_CALCULATION_NOT_AUDIT"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--orders-per-period", type=int, nargs="+", default=[1, 10, 25, 100, 250])
    parser.add_argument("--discount", default="0")
    parser.add_argument("--scenario", type=Path, action="append", default=[],
                        help="Explicit sensitivity file, never silently fills gaps; repeat to stack, applied in order")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    model = json.loads(args.input.read_text(encoding="utf-8-sig"))
    for path in args.scenario:
        model = apply_scenario(model, json.loads(path.read_text(encoding="utf-8-sig")))
    rows = [forecast(model, name, volume, args.discount) for volume in args.orders_per_period for name in model["orders"]]
    result = {"model_version": 1, "currency": model["currency"], "rows": rows}
    payload = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
        print(f"Wrote {len(rows)} rows. {sum(r['status'] == 'BLOCKED_MISSING_INPUTS' for r in rows)} blocked. No live action.")
    else:
        print(payload)


if __name__ == "__main__":
    main()
