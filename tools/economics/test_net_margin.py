import copy
import csv
import json
import unittest
from decimal import Decimal as D, ROUND_CEILING
from pathlib import Path

from bundle_economics import report, with_all_mixes
from net_margin import apply_scenario, blue_fee, floor, forecast, realized_period, service_line

HERE = Path(__file__).parent
BUNDLE_ROWS = ['mug_and_unframed', 'mug_and_frame', 'mug_and_blanket', 'unframed_and_blanket', 'frame_and_blanket',
               'unframed_and_frame', 'two_mugs', 'two_unframed', 'two_frames', 'two_blankets',
               'mug_frame_blanket', 'mug_unframed_blanket', 'three_mugs']


def stack(*names):
    model = json.loads((HERE / 'calibration.json').read_text())
    for name in names:
        model = apply_scenario(model, json.loads((HERE / name).read_text()))
    return model


class EconomicsTests(unittest.TestCase):
    def test_existing_21_scenario_floors(self):
        path = HERE.parents[1] / 'docs/history/pricing-scenarios-2026-10-24.csv'
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

    def test_bundle_rows_load_and_stay_evidence_tagged(self):
        raw = json.loads((HERE / 'calibration.json').read_text())
        working = stack('working-sensitivity.json')
        for oid in BUNDLE_ROWS:
            order = raw['orders'][oid]
            self.assertGreaterEqual(len(order['items']), 2)
            for key in ('shipping', 'holiday_surcharge', 'seller_borne_tax', 'collected_sales_tax_rate'):
                self.assertIn(order[key]['status'], {'observed_sample', 'assumption', 'unknown'})
                self.assertTrue(order[key]['source'])
            if order['shipping']['status'] == 'assumption':
                # Unquoted basket: conservative sum of single-item shipping and tax, one surcharge.
                singles = [raw['orders'][line['variant']] for line in order['items']]
                self.assertEqual(D(order['shipping']['value']), sum(D(s['shipping']['value']) for s in singles))
                self.assertEqual(D(order['seller_borne_tax']['value']), sum(D(s['seller_borne_tax']['value']) for s in singles))
                self.assertEqual(order['holiday_surcharge']['value'], '0.40')
            self.assertEqual(forecast(raw, oid, 25)['status'], 'BLOCKED_MISSING_INPUTS')
            r = forecast(working, oid, 25)
            self.assertEqual(r['status'], 'UNVERIFIED_SCENARIO')
            # One Teeinblue fee per customized line: each gift is its own line.
            self.assertEqual(r['customization_lines'], len(order['items']))
            self.assertEqual(D(r['teeinblue_customization_fee']), D('.40') * len(order['items']))

    def test_bundle_floor_arithmetic_at_30_percent(self):
        m = stack('working-sensitivity.json')
        # Overhead per 30 days: Teeinblue 49 + Metashop 9.99 + Shopify GBP25 x 1.34 x 30/30.4375
        # + hosting 20 + domains 5 + other 25, spread over 25 orders.
        overhead = (D(49) + D('9.99') + D(25) * D('1.34') * 30 / D('30.4375') + 20 + 5 + 25) / 25
        # AI allowance, support, acquisition, other, payment fixed fee, one surcharge per order.
        per_order = D('.50') + 2 + 10 + 0 + D('.30') + D('.40')
        # Base + shipping + Teeinblue line fee + one redo generation per gift; supplier tax 0 here.
        mug = D('8.11') + D('6.69') + D('.40') + D('.13')
        unframed = D('11.62') + D('4.99') + D('.40') + D('.13')
        expected = ((per_order + overhead + mug + unframed) / (1 - D('.059') - D('.30'))).quantize(D('.01'), rounding=ROUND_CEILING)
        r = forecast(m, 'mug_and_unframed', 25, '.15', 104)
        self.assertEqual(D(r['minimum_paid_revenue']), expected)
        self.assertEqual((r['minimum_paid_revenue'], r['paid_revenue_at_discount'], r['headroom_at_discount']), ('80.11', '88.40', '8.29'))
        self.assertTrue(r['meets_target_at_discount'])
        self.assertGreaterEqual(D(r['modeled_margin_at_discount']), D('.30'))
        # Two mugs alone miss the floor at the 15% tier and clear it at list price.
        mm = forecast(m, 'two_mugs', 25, '.15', 90)
        self.assertEqual(D(mm['minimum_paid_revenue']), ((per_order + overhead + 2 * mug) / D('.641')).quantize(D('.01'), rounding=ROUND_CEILING))
        self.assertEqual((mm['minimum_paid_revenue'], mm['paid_revenue_at_discount'], mm['headroom_at_discount']), ('77.29', '76.50', '-0.79'))
        self.assertFalse(mm['meets_target_at_discount'])
        self.assertLess(D(mm['modeled_margin_at_discount']), D('.30'))
        self.assertTrue(forecast(m, 'two_mugs', 25, '0', 90)['meets_target_at_discount'])

    def test_per_gift_ai_allowance(self):
        m = self.fixture()
        base = forecast(m, 'two_mugs', 30)
        m['costs']['ai_per_customization_line'] = {'value': '.13', 'status': 'assumption', 'source': 'Synthetic redo'}
        # Same-design quantity two is one line, so one allowance.
        self.assertEqual(D(forecast(m, 'two_mugs', 30)['total_fixed_per_order']) - D(base['total_fixed_per_order']), D('.13'))
        m['orders']['two_mugs']['items'] = [{'variant': 'mug', 'quantity': 1}, {'variant': 'mug', 'quantity': 1}]
        self.assertEqual(forecast(m, 'two_mugs', 30)['ai_per_customization_line_total'], '0.26')
        m['costs']['ai_per_customization_line']['value'] = None
        self.assertIn('costs.ai_per_customization_line', forecast(m, 'two_mugs', 30)['missing'])

    def test_scenario_stacking_and_additions(self):
        app = json.loads((HERE / 'checkout-app-sensitivity.json').read_text())
        a = forecast(stack('working-sensitivity.json'), 'mug_and_frame', 25)
        b = forecast(stack('working-sensitivity.json', 'checkout-app-sensitivity.json'), 'mug_and_frame', 25)
        self.assertEqual(D(b['fixed_period_overhead']) - D(a['fixed_period_overhead']), D(69))
        self.assertEqual(D(b['allocated_overhead_per_order']) - D(a['allocated_overhead_per_order']), D('2.76'))
        with self.assertRaises(ValueError):  # an addition never replaces an existing input
            apply_scenario(apply_scenario(json.loads((HERE / 'calibration.json').read_text()), app), app)
        with self.assertRaises(ValueError):
            apply_scenario(self.fixture(), {'name': 'x', 'overrides': {'period_days': '1'}})
        with self.assertRaises(ValueError):
            apply_scenario(self.fixture(), {'name': 'x', 'additions': {'overhead.new': {'amount': {'value': '1'}, 'period_days': 30}}})

    def test_supplier_tax_sensitivity_matches_calibration(self):
        raw = json.loads((HERE / 'calibration.json').read_text())
        tax = json.loads((HERE / 'supplier-tax-sensitivity.json').read_text())['overrides']
        self.assertEqual(tax, {f'orders.{k}.seller_borne_tax': o['seller_borne_tax']['value']
                               for k, o in raw['orders'].items() if o['seller_borne_tax']['value'] is not None})

    def test_synthesized_mix_matches_named_row(self):
        model = stack('working-sensitivity.json', 'supplier-tax-sensitivity.json')
        named = forecast(model, 'mug_unframed_blanket', 25)
        del model['orders']['mug_unframed_blanket']
        mixed, index = with_all_mixes(model)
        self.assertEqual(index['MUB'], 'mix_MUB')
        self.assertEqual(forecast(mixed, 'mix_MUB', 25)['minimum_paid_revenue'], named['minimum_paid_revenue'])

    def test_bundle_report_has_no_blocked_rows(self):
        text, stacks = report(json.loads((HERE / 'calibration.json').read_text()), 25)
        self.assertEqual(list(stacks), ['A', 'A+app', 'B-app', 'B', 'A+app+tax'])
        for s in stacks.values():
            self.assertEqual(len(s['rows']), 69)  # every mix of 1 to 4 gifts across four products
            for row in s['rows'].values():
                for r in row['results'].values():
                    self.assertEqual(r['status'], 'UNVERIFIED_SCENARIO')
                    self.assertFalse(r['live_price_authorized'])
        self.assertIn('not realized margin', text)

    def test_service_line_margin(self):
        m = self.fixture()
        m['target_margin'] = '.30'

        def c(v): return {'value': None if v is None else str(v), 'status': 'assumption', 'source': 'Synthetic add-on'}
        m['services'] = {'touch': {'supplier_and_shipping': c(0), 'labor_minutes_low': c(20), 'labor_minutes_high': c(45),
                                   'labor_hourly_value': c(50), 'extra_ai_per_service': c('.13'), 'collected_sales_tax_rate': c(0)}}
        r = service_line(m, 'touch', 29, 'labor_minutes_low')
        # 29 x (1 - .029 - .03) - 20/60 x 50 - .13 = 10.4923; 30% needs labor <= 18.459, or 22.15 minutes.
        self.assertEqual((r['modeled_profit'], r['max_minutes_at_target']), ('10.49', '22.1'))
        self.assertTrue(r['meets_target'])
        self.assertFalse(r['live_price_authorized'])
        self.assertFalse(service_line(m, 'touch', 29, 'labor_minutes_high')['meets_target'])
        self.assertFalse(service_line(m, 'touch', 29, 'labor_minutes_low', '.20')['meets_target'])
        m['services']['touch']['labor_hourly_value'] = c(None)
        self.assertIn('services.touch.labor_hourly_value', service_line(m, 'touch', 29, 'labor_minutes_low')['missing'])


if __name__ == '__main__':
    unittest.main()
