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
and the app it signs in as can only read and write orders.

It signs in with the Dev Dashboard app's client credentials (Krish, 19 Oct): each run trades
SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET for an access token (good for about 24 hours) and
keeps it in memory only. On GitHub Actions the token is masked the moment it arrives. It is
never printed, and never written to the log, the summary, an issue or a file.

  SHOPIFY_STORE=bnf1em-ge.myshopify.com SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... \
    python3 tools/qc/order_qc.py out_dir [--dry-run]
"""
import argparse, datetime, json, os, re, sys, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mug_qc  # noqa: E402

# the line item's own title, which read_orders covers. Asking for its product needs read_products,
# which the app does not have (first dry run, 19 Oct: ACCESS_DENIED on lineItems.product).
MUG = 'The Morning Mug'
API = os.environ.get('SHOPIFY_API_VERSION', '2026-07')
DAYS = 14  # how far back to look for untagged orders

ORDERS = """
query($q: String!) {
  orders(first: 50, query: $q, sortKey: CREATED_AT, reverse: true) {
    nodes { id name note tags
      lineItems(first: 20) { nodes { id title variantTitle customAttributes { key value } } } }
  }
}"""
TAG = 'mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }'
NOTE = 'mutation($input: OrderInput!) { orderUpdate(input: $input) { userErrors { field message } } }'


class AuthError(Exception):
    """the token exchange failed: Shopify's HTTP status and its error text, never a secret"""
    def __init__(self, status, text):
        super().__init__(f'HTTP {status}: {text}' if status else text)


def shopify_error(raw):
    """Shopify's own words from an error reply: error and error_description, or the start of the body"""
    try:
        j = json.loads(raw)
        parts = [str(j.get(k)) for k in ('error', 'error_description', 'errors') if j.get(k)]
        if parts:
            return ': '.join(parts)
    except (ValueError, AttributeError):
        pass
    return ' '.join(raw.split())[:300] or 'no error text'


def access_token(store, client_id, client_secret, opener=urllib.request.urlopen):
    """the client credentials grant: one POST, one access token for this run"""
    scrub = lambda t: t.replace(client_secret, '[secret]').replace(client_id, '[client id]')
    req = urllib.request.Request(f'https://{store}/admin/oauth/access_token',
                                 data=urllib.parse.urlencode({'grant_type': 'client_credentials', 'client_id': client_id, 'client_secret': client_secret}).encode(),
                                 headers={'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json'})
    try:
        with opener(req, timeout=30) as r:
            raw = r.read().decode('utf-8', 'replace')
            status = getattr(r, 'status', 200)
    except urllib.error.HTTPError as e:
        raise AuthError(e.code, scrub(shopify_error(e.read().decode('utf-8', 'replace')))) from None
    except urllib.error.URLError as e:
        raise AuthError(0, scrub(f'could not reach Shopify ({e.reason})')) from None
    try:
        token = json.loads(raw).get('access_token')
    except ValueError:
        token = None
    if not token:
        raise AuthError(status, scrub('the reply has no access_token: ' + shopify_error(raw)))
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        sys.stdout.write(f'::add-mask::{token}\n')  # the runner hides it from here on; this line is never shown
        sys.stdout.flush()
    return token


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


# The 11 oz White Ceramic Mug with Color Inside (Printful catalog product 403), read from Printful's
# catalog on 19 Oct: the color inside and on the handle, and its Printful variant. Teeinblue puts the
# variant it will fulfill on the line item as _tib_fulfilled_sku. Longest names first, so "Dark Blue"
# is never read as "Blue".
MUG_COLORS = {'Golden Yellow': '17358', 'Dark Blue': '17362', 'Dark Green': '17359', 'Black': '11051', 'Blue': '11050',
              'Green': '17361', 'Orange': '12579', 'Pink': '12578', 'Red': '11049', 'Yellow': '11048'}


def mug_color(item):
    """the color the buyer chose, from the Shopify variant ("White Ceramic Mug with Color Inside / Black / 11 oz")"""
    parts = [p.strip().lower() for p in str(item.get('variantTitle') or '').split('/')]
    for name in MUG_COLORS:
        if name.lower() in parts:
            return name
    return None


def color_check(item):
    """(ok, detail): the Printful variant Teeinblue will make is the color the buyer chose"""
    color, sku = mug_color(item), prop(item, '_tib_fulfilled_sku').strip()
    if not color:
        return False, f'color: no known mug color in the variant "{item.get("variantTitle") or ""}"'
    if not sku:
        return False, f'color: {color} chosen, but the line item has no Printful variant (_tib_fulfilled_sku)'
    if sku != MUG_COLORS[color]:
        return False, f'color: {color} chosen (Printful {MUG_COLORS[color]}), but Teeinblue will make Printful {sku}'
    return True, f'color: {color}, Printful {sku}'


def is_mug(item):
    return ' '.join(str(item.get('title') or '').split()).lower() == MUG.lower()


def check_order(order, out):
    """returns ('pass' | 'hold' | None, [per-mug results]); None when nothing could be checked yet"""
    mugs = [i for i in order['lineItems']['nodes'] if is_mug(i)]
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
        cok, cdetail = color_check(item)
        res['checks'].append({'check': 'color', 'ok': cok, 'detail': cdetail})
        if not cok:
            res['verdict'] = 'hold'
        mug_qc.card(im, res, d)
        json.dump(res, open(os.path.join(d, 'report.json'), 'w'), indent=1)
        failed = [c['check'] + ': ' + c['detail'] for c in res['checks'] if not c['ok']]
        results.append({'item': item['title'], 'color': mug_color(item), 'sku': prop(item, '_tib_fulfilled_sku').strip(), 'verdict': res['verdict'], 'failed': failed, 'card': os.path.relpath(os.path.join(d, 'card.png'), out)})
    if not results or waiting:
        return None, results
    return ('hold' if any(r['verdict'] == 'hold' for r in results) else 'pass'), results


def note_line(verdict, results, when):
    if verdict == 'pass':
        colors = ', '.join(f"{r['color']} (Printful {r['sku']})" for r in results)
        return f'QC {when}: pass, {len(results)} mug print file{"s" if len(results) > 1 else ""} checked. Color: {colors}.'
    why = '; '.join(f for r in results for f in r['failed'] if r['verdict'] == 'hold')
    return f'QC {when}: hold, do not confirm in Teeinblue until fixed. {why}'


def run(shop, out, dry, now=None):
    now = now or datetime.datetime.now(datetime.timezone.utc)
    since = (now - datetime.timedelta(days=DAYS)).strftime('%Y-%m-%d')
    q = f'created_at:>={since} fulfillment_status:unfulfilled -tag:qc-pass -tag:qc-hold'
    orders = shop.gql(ORDERS, {'q': q})['orders']['nodes']
    summary = {'checked': [], 'holds': [], 'waiting': [], 'no_mug': 0, 'dry_run': dry}
    for o in orders:
        has_mug = any(is_mug(i) for i in o['lineItems']['nodes'])
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


def report(s, dry):
    lines = [f"{'DRY RUN: nothing tagged. ' if dry else ''}{len(s['checked'])} checked, {len(s['holds'])} held, "
             f"{len(s['waiting'])} waiting for a print file, {s['no_mug']} without a mug."]
    lines += [f"  {e['order']}: {e['verdict']}. {e['note']}" for e in s['checked']]
    return lines


def main(argv=None, env=None, opener=urllib.request.urlopen, shop=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--dry-run', action='store_true', help='check and report, but tag nothing and write no notes')
    a = ap.parse_args(argv)
    env = os.environ if env is None else env
    os.makedirs(a.out, exist_ok=True)
    log = lambda lines: open(os.path.join(a.out, 'log.txt'), 'w').write('\n'.join(lines) + '\n')
    store, cid, secret = env.get('SHOPIFY_STORE'), env.get('SHOPIFY_CLIENT_ID'), env.get('SHOPIFY_CLIENT_SECRET')
    if not (store and cid and secret):
        msg = 'SHOPIFY_STORE, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set (tools/qc/ORDER-QC-SETUP.md).'
        log([msg]); print(msg); return 1
    try:
        token = access_token(store, cid, secret, opener)
    except AuthError as e:
        msg = f'Shopify token exchange failed, so no order was checked. {e}'
        open(os.path.join(a.out, 'auth-error.txt'), 'w').write(msg + '\n')
        log([msg]); print(f'::error::{msg}'); return 2
    try:
        s = run(shop or Shopify(store, token), a.out, a.dry_run)
    except Exception as e:  # Shopify refused a query, or a print file could not be read: say so in the summary
        msg = f'Order QC stopped after signing in: {type(e).__name__}: {e}'.replace(token, '[token]')
        log([msg]); print(f'::error::{msg}'); return 3
    lines = report(s, a.dry_run)
    log(lines); print('\n'.join(lines))
    return 0


if __name__ == '__main__':
    sys.exit(main())
