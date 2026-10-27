import copy
import csv
import json
import unittest
from decimal import Decimal as D
from pathlib import Path

from net_margin import blue_fee, floor, forecast, realized_period

HERE = Path(__file__).parent


class EconomicsTests(unittest.TestCase):
    def test_existing_21_scenario_floors(self):
        path = HERE.parents[1] / 'docs/continuation/2026-10-24/pricing-scenarios.csv'
        with path.open(encoding='utf-8') as source:
            rows = list(csv.DictReader(source))
        self.assertEqual(len(rows), 21)
        for r in rows:
            fixed = sum(D(r[k]) for k in ['base_usd', 'shipping_usd', 'fixed_order_allowance_usd', 'cac_usd', 'allocated_overhead_usd', 'seller_fixed_tax_usd'])
            self.assertEqual(floor(fixed, r['variable_cost_rate'], r['target_net_margin'], r['business_profit_tax_rate']), D(r['minimum_retail_rounded_up_usd']))

    def test_unknown_costs_block_prices(self):
        m = json.loads((HERE / 'calibration.json').read_text())
        for name in m['orders']:
            r = forecast(m, name, 25)
            self.assertEqual(r['status'], 'BLOCKED_MISSING_INPUTS')
            self.assertNotIn('minimum_paid_revenue', r)
            self.assertIn('costs.business_profit_tax_rate', r['missing'])

    def test_tier_boundaries(self):
        for n, fee in [(1, '0'), (100, '0'), (101, '.40'), (1000, '.40'), (1001, '.20'), (10000, '.20'), (10001, '.10')]:
            self.assertEqual(blue_fee(n, 2), D(fee) * 2)
        with self.assertRaises(ValueError):
            blue_fee('1.5', 2)

    def fixture(self):
        def c(v): return {'value': str(v), 'status': 'verified', 'source': 'Synthetic fixture, not account evidence'}
        return {'currency': 'USD', 'period_days': 30, 'target_margin': '.5', 'accounting_boundary_confirmed': True, 'accounting_boundary': 'fixture',
                'costs': {k: c(v) for k, v in {'ai_all_attempts_per_order': 1, 'review_support_labor_per_order': 2,
                    'acquisition_per_order': 10, 'other_variable_per_order': 0, 'payment_fixed': '.3',
                    'payment_rate': '.029', 'refund_remake_reserve_rate': '.03',
                    'business_profit_tax_rate': 0, 'account_order_ordinal': 101}.items()},
                'overhead': {'subscription': {'amount': c(60), 'heartside_share': c(1), 'period_days': 30}},
                'variants': {'mug': {'base': c(10)}},
                'orders': {'two_mugs': {'items': [{'variant': 'mug', 'quantity': 2}], 'shipping': c(8), 'holiday_surcharge': c('.4'), 'seller_borne_tax': c(0), 'collected_sales_tax_rate': c(0)}}}

    def test_bundle_fixed_once_and_quantity_not_customizations(self):
        r = forecast(self.fixture(), 'two_mugs', 30)
        # 20 base + 8 shipping + .4 surcharge + .4 customization + 13.3 costs + 2 overhead.
        self.assertEqual(r['total_fixed_per_order'], '44.10')
        self.assertEqual(r['minimum_paid_revenue'], '100.00')
        self.assertEqual(r['modeled_period_profit_at_floor'], '1500.00')
        self.assertFalse(r['realized_margin_certified'])

    def test_distinct_customizations_charge_separately(self):
        m = self.fixture()
        m['orders']['two_mugs']['items'] = [{'variant': 'mug', 'quantity': 1}, {'variant': 'mug', 'quantity': 1}]
        self.assertEqual(forecast(m, 'two_mugs', 30)['teeinblue_customization_fee'], '0.80')

    def test_discount_preserves_paid_floor(self):
        r = forecast(self.fixture(), 'two_mugs', 30, '.20')
        self.assertEqual(r['minimum_list_price'], '125.00')
        self.assertGreaterEqual(D(r['modeled_margin_at_floor']), D('.5'))

    def test_period_allocation_counts_fixed_cost_once(self):
        m = self.fixture()
        self.assertEqual(forecast(m, 'two_mugs', 10)['allocated_overhead_per_order'], '6.00')
        m['period_days'] = 60
        self.assertEqual(forecast(m, 'two_mugs', 10)['allocated_overhead_per_order'], '12.00')

    def test_collected_tax_affects_processing_not_revenue(self):
        m = self.fixture()
        m['orders']['two_mugs']['collected_sales_tax_rate']['value'] = '.10'
        r = forecast(m, 'two_mugs', 30)
        self.assertEqual(D(r['variable_rate']), D('.0619'))
        self.assertGreater(D(r['minimum_paid_revenue']), D('100'))

    def test_supplier_tax_belongs_to_exact_basket_and_destination(self):
        m = self.fixture()
        m['orders']['other_destination'] = copy.deepcopy(m['orders']['two_mugs'])
        m['orders']['other_destination']['seller_borne_tax']['value'] = '3.50'
        self.assertEqual(forecast(m, 'two_mugs', 30)['total_fixed_per_order'], '44.10')
        self.assertEqual(forecast(m, 'other_destination', 30)['total_fixed_per_order'], '47.60')

    def test_missing_fx_blocks_and_conversion_is_once(self):
        m = self.fixture()
        m['overhead']['subscription']['currency'] = 'GBP'
        m['fx'] = {'GBP_USD': {'value': None, 'status': 'unknown', 'source': 'Settlement not yet read'}}
        self.assertIn('fx.GBP_USD', forecast(m, 'two_mugs', 30)['missing'])
        m['fx']['GBP_USD'] = {'value': '1.25', 'status': 'assumption', 'source': 'Synthetic scenario'}
        r = forecast(m, 'two_mugs', 30)
        self.assertEqual(r['allocated_overhead_per_order'], '2.50')
        self.assertEqual(r['status'], 'UNVERIFIED_SCENARIO')

    def test_after_tax_floor(self):
        p = floor(40, '.059', '.5', '.20')
        self.assertGreaterEqual((p * D('.941') - 40) * D('.8') / p, D('.5'))
        with self.assertRaises(ValueError):
            floor(40, '.059', '.5', '.50')

    def test_zero_revenue_and_refund_not_double_counted(self):
        r = realized_period(24, 24, {'payment': 1, 'subscription': 49}, 0)
        self.assertIsNone(r['margin'])
        self.assertEqual(D(r['profit']), D('-50'))
        self.assertEqual(D(realized_period(100, 10, {'costs': 40}, 0)['margin']), D(50) / 90)
        with self.assertRaises(ValueError):
            realized_period(100, 10, {'refund_reserve': 3}, 0)

    def test_invalid_values_fail(self):
        for amount in ['NaN', 'Infinity', '-1', True]:
            with self.assertRaises(ValueError):
                floor(amount, '.059')
        with self.assertRaises(ValueError):
            forecast(self.fixture(), 'two_mugs', 0)
        with self.assertRaises(ValueError):
            forecast(self.fixture(), 'two_mugs', 30, '1')


if __name__ == '__main__':
    unittest.main()
