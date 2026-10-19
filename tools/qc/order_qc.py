"""Order QC on GitHub Actions: check every new mug order's print file, then tag the order.

Replaces the Claude scheduled task "Heartside order QC", so the check no longer depends on a
Claude connector (Krish, 19 Oct). Run by .github/workflows/order-qc.yml.

For each recent unfulfilled order with no qc tag yet:
  1. each Morning Mug line item's print file (_tib_design_link_1) goes through mug_qc.check
     with the item's own Line 1 to Line 3 and Signed;
  2. the order is tagged qc-pass, or qc-hold if any mug on it holds, and one note line is added;
  3. every hold goes into holds.json, which the workflow turns into a GitHub issue for Krish.

Orders with no mug are left untagged, as the scheduled task did. A mug whose print file isn't
there yet is skipped and tried again on the next run. It never touches Teeinblue or Printful,
and the token it uses can only read and write orders.

  SHOPIFY_STORE=bnf1em-ge.myshopify.com SHOPIFY_ORDERS_TOKEN=... python3 tools/qc/order_qc.py out_dir [--dry-run]
"""
import argparse, datetime, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mug_qc  # noqa: E402

MUG = 'the-morning-mug'
API = os.environ.get('SHOPIFY_API_VERSION', '2026-07')
DAYS = 14  # how far back to look for untagged orders

ORDERS = """
query($q: String!) {
  orders(first: 50, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes { id name note tags
      lineItems(first: 20) { nodes { id title product { handle } customAttributes { key value } } } }
  }
}"""
TAG = 'mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }'
NOTE = 'mutation($input: OrderInput!) { orderUpdate(input: $input) { userErrors { field message } } }'


class Shopify:
    def __init__(self, store, token):
        self.url = f'https://{store}/admin/api/{API}/graphql.json'
        self.token = token

    def gql(self, query, variables):
        req = urllib.request.Request(self.url, data=json.dumps({'query': query, 'variables': variables}).encode(),
                                     headers={'Content-Type': 'application/json', 'X-Shopify-Access-Token': self.token})
        with urllib.request.urlopen(req, timeout=60) as r:
            body = json.load(r)
        if body.get('errors'):
            raise RuntimeError(json.dumps(body['errors']))
        return body['data']


def prop(item, *names):
    """a line item property by its label, ignoring case and spacing ("Line 1", "line1")"""
    want = {re.sub(r'\s+', '', n).lower() for n in names}
    for a in item.get('customAttributes') or []:
        if re.sub(r'\s+', '', a['key']).lower() in want:
            return a['value'] or ''
    return ''


def check_order(order, out):
    """returns ('pass' | 'hold' | None, [per-mug results]); None when nothing could be checked yet"""
    mugs = [i for i in order['lineItems']['nodes'] if (i.get('product') or {}).get('handle') == MUG]
    results, waiting = [], False
    for n, item in enumerate(mugs, 1):
        link = prop(item, '_tib_design_link_1')
        if not link:
            waiting = True
            continue
        lines = [prop(item, f'Line {k}') for k in (1, 2, 3)]
        signed = prop(item, 'Signed')
        res, im = mug_qc.check(link, lines, signed)
        d = os.path.join(out, order['name'].lstrip('#') + f'-mug{n}')
        os.makedirs(d, exist_ok=True)
        mug_qc.card(im, res, d)
        json.dump(res, open(os.path.join(d, 'report.json'), 'w'), indent=1)
        failed = [c['check'] + ': ' + c['detail'] for c in res['checks'] if not c['ok']]
        results.append({'item': item['title'], 'verdict': res['verdict'], 'failed': failed, 'card': os.path.relpath(os.path.join(d, 'card.png'), out)})
    if not results or waiting:
        return None, results
    return ('hold' if any(r['verdict'] == 'hold' for r in results) else 'pass'), results


def note_line(verdict, results, when):
    if verdict == 'pass':
        return f'QC {when}: pass, {len(results)} mug print file{"s" if len(results) > 1 else ""} checked.'
    why = '; '.join(f for r in results for f in r['failed'] if r['verdict'] == 'hold')
    return f'QC {when}: hold, do not confirm in Teeinblue until fixed. {why}'


def run(shop, out, dry, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    since = (now - datetime.timedelta(days=DAYS)).strftime('%Y-%m-%d')
    q = f'created_at:>={since} fulfillment_status:unfulfilled -tag:qc-pass -tag:qc-hold'
    orders = shop.gql(ORDERS, {'q': q})['orders']['nodes']
    summary = {'checked': [], 'holds': [], 'waiting': [], 'no_mug': 0, 'dry_run': dry}
    for o in orders:
        has_mug = any((i.get('product') or {}).get('handle') == MUG for i in o['lineItems']['nodes'])
        if not has_mug:
            summary['no_mug'] += 1
            continue
        verdict, results = check_order(o, out)
        if verdict is None:
            summary['waiting'].append(o['name'])
            continue
        line = note_line(verdict, results, now.strftime('%Y-%m-%d %H:%M UTC'))
        entry = {'order': o['name'], 'id': o['id'], 'verdict': verdict, 'note': line, 'results': results}
        summary['checked'].append(entry)
        if verdict == 'hold':
            summary['holds'].append(entry)
        if not dry:
            for m, v in ((TAG, {'id': o['id'], 'tags': ['qc-' + verdict]}),
                         (NOTE, {'input': {'id': o['id'], 'note': ((o.get('note') or '').rstrip() + '\n' + line).strip()}})):
                errs = next(iter(shop.gql(m, v).values()))['userErrors']
                if errs:
                    raise RuntimeError(f'{o["name"]}: {errs}')
    json.dump(summary, open(os.path.join(out, 'summary.json'), 'w'), indent=1)
    json.dump(summary['holds'], open(os.path.join(out, 'holds.json'), 'w'), indent=1)
    return summary


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--dry-run', action='store_true', help='check and report, but tag nothing and write no notes')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    store, token = os.environ.get('SHOPIFY_STORE'), os.environ.get('SHOPIFY_ORDERS_TOKEN')
    if not store or not token:
        sys.exit('SHOPIFY_STORE and SHOPIFY_ORDERS_TOKEN must be set (tools/qc/ORDER-QC-SETUP.md).')
    s = run(Shopify(store, token), a.out, a.dry_run)
    print(f"{'DRY RUN: nothing tagged. ' if a.dry_run else ''}{len(s['checked'])} checked, {len(s['holds'])} held, "
          f"{len(s['waiting'])} waiting for a print file, {s['no_mug']} without a mug.")
    for e in s['checked']:
        print(f"  {e['order']}: {e['verdict']}. {e['note']}")
