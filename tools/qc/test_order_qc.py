"""Tests order_qc.py against a stand-in for Shopify, with Teeinblue's real print files.

  python3 tools/qc/test_order_qc.py
"""
import datetime, os, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import order_qc  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
GOOD = os.path.join(ROOT, 'design', 'teeinblue', 'mug-v3', 'shopify-images', 'print-file-biscuit.png')
L1, L2, L3 = 'Waits at the door for you, weekends too.', 'Steals your side of the bed.', "Will ride anywhere, as long as it's with you."
failures = 0


def ok(cond, msg):
    global failures
    print(('ok   ' if cond else 'FAIL ') + msg)
    failures += 0 if cond else 1


def item(handle, link=GOOD, l1=L1, signed='Love, Biscuit'):
    attrs = [{'key': 'Line 1', 'value': l1}, {'key': 'Line 2', 'value': L2}, {'key': 'Line 3', 'value': L3}, {'key': 'Signed', 'value': signed}]
    if link:
        attrs.append({'key': '_tib_design_link_1', 'value': link})
    return {'id': 'li', 'title': handle, 'product': {'handle': handle}, 'customAttributes': attrs}


class Fake:
    def __init__(self, orders):
        self.orders, self.calls = orders, []

    def gql(self, query, v):
        self.calls.append((query, v))
        if 'orders(' in query:
            return {'orders': {'nodes': self.orders}}
        return {'x': {'userErrors': []}}


def order(name, *items, note=''):
    return {'id': 'gid://shopify/Order/' + name, 'name': '#' + name, 'note': note, 'tags': [], 'lineItems': {'nodes': list(items)}}


orders = [
    order('1002', item('the-morning-mug'), item('the-tree-ornament'), note='Gift for Sam'),
    order('1003', item('the-morning-mug', l1='Lives for our morning walks.')),  # print says something else
    order('1004', item('the-morning-mug', link='')),                             # print file not there yet
    order('1005', item('the-couch-blanket')),
]
now = datetime.datetime(2026, 10, 20, 6, 56, tzinfo=datetime.timezone.utc)
with tempfile.TemporaryDirectory() as out:
    shop = Fake(orders)
    s = order_qc.run(shop, out, dry=False, now=now)
    q = shop.calls[0][1]['q']
    ok('-tag:qc-pass' in q and '-tag:qc-hold' in q and 'unfulfilled' in q and 'created_at:>=2026-10-06' in q, f'asks only for recent, unfulfilled, untagged orders ({q})')
    v = {e['order']: e['verdict'] for e in s['checked']}
    ok(v.get('#1002') == 'pass', 'a correct mug passes')
    ok(v.get('#1003') == 'hold' and [h['order'] for h in s['holds']] == ['#1003'], 'wrong words on the print hold the order, and only that one goes to holds.json')
    ok(s['waiting'] == ['#1004'], 'a mug with no print file yet is left for the next run, untagged')
    ok(s['no_mug'] == 1, 'an order with no mug is left alone')
    tags = [c[1] for c in shop.calls if 'tagsAdd' in c[0]]
    ok(sorted(t['tags'][0] for t in tags) == ['qc-hold', 'qc-pass'], 'tags qc-pass and qc-hold, nothing else')
    notes = {c[1]['input']['id']: c[1]['input']['note'] for c in shop.calls if 'orderUpdate' in c[0]}
    n2 = notes['gid://shopify/Order/1002']
    ok(n2.startswith('Gift for Sam\nQC 2026-10-20 06:56 UTC: pass') and n2.count('\n') == 1, 'keeps the buyer\'s note and adds one line')
    ok('line 1 words' in notes['gid://shopify/Order/1003'] and 'do not confirm' in notes['gid://shopify/Order/1003'], 'a hold note says why and not to confirm')
    ok(os.path.exists(os.path.join(out, '1003-mug1', 'card.png')), 'writes a card for each mug')
    ok(all(('tagsAdd' in c[0] or 'orderUpdate' in c[0] or 'orders(' in c[0]) for c in shop.calls), 'calls nothing but the order query, tagsAdd and orderUpdate')
    dry = Fake([order('1006', item('the-morning-mug'))])
    s = order_qc.run(dry, out, dry=True, now=now)
    ok(len(dry.calls) == 1 and s['checked'][0]['verdict'] == 'pass', 'a dry run checks but writes nothing')

print('all passed' if not failures else f'{failures} failed')
sys.exit(1 if failures else 0)
