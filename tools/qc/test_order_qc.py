"""Tests order_qc.py against a stand-in for Shopify, with Teeinblue's real print files.

  python3 tools/qc/test_order_qc.py
"""
import datetime, os, sys, tempfile, urllib.parse

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

# signing in: the client credentials grant (Dev Dashboard app, 19 Oct)
import contextlib, io, json, urllib.error  # noqa: E402

CID, SECRET, TOKEN = 'cid-123', 'shpss_SECRET', 'shpat_TOKEN'


class Reply(io.BytesIO):
    status = 200
    def __enter__(self): return self
    def __exit__(self, *a): self.close()


def opener_ok(sent):
    def op(req, timeout=None):
        sent.append(req)
        return Reply(json.dumps({'access_token': TOKEN, 'scope': 'read_orders,write_orders', 'expires_in': 86399}).encode())
    return op


def opener_fail(code, body):
    def op(req, timeout=None):
        raise urllib.error.HTTPError(req.full_url, code, 'err', {}, io.BytesIO(body.encode()))
    return op


env = {'SHOPIFY_STORE': 'bnf1em-ge.myshopify.com', 'SHOPIFY_CLIENT_ID': CID, 'SHOPIFY_CLIENT_SECRET': SECRET, 'GITHUB_ACTIONS': 'true'}
sent = []
os.environ['GITHUB_ACTIONS'] = 'true'
with tempfile.TemporaryDirectory() as out:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = order_qc.main([out, '--dry-run'], env=env, opener=opener_ok(sent), shop=Fake([order('1007', item('the-morning-mug'))]))
    body = urllib.parse.parse_qs(sent[0].data.decode())
    ok(code == 0 and sent[0].full_url == 'https://bnf1em-ge.myshopify.com/admin/oauth/access_token' and sent[0].get_method() == 'POST'
       and body == {'grant_type': ['client_credentials'], 'client_id': [CID], 'client_secret': [SECRET]}, 'trades the client id and secret for a token with one POST')
    printed = buf.getvalue().splitlines()
    ok(printed[0] == '::add-mask::' + TOKEN and sum(TOKEN in l for l in printed) == 1, 'masks the token first, and prints it nowhere else')
    files = [open(os.path.join(r, f), 'rb').read() for r, _, fs in os.walk(out) for f in fs]
    ok(files and not any(TOKEN.encode() in b or SECRET.encode() in b for b in files), 'no file it writes holds the token or the secret')
    ok('1 checked' in open(os.path.join(out, 'log.txt')).read(), 'writes its own log for the summary')
    seen = []
    real = order_qc.urllib.request.urlopen
    order_qc.urllib.request.urlopen = lambda req, timeout=None: (seen.append(req), Reply(b'{"data": {}}'))[1]
    try:
        order_qc.Shopify('bnf1em-ge.myshopify.com', TOKEN).gql('{ shop { id } }', {})
    finally:
        order_qc.urllib.request.urlopen = real
    ok(seen[0].get_header('X-shopify-access-token') == TOKEN and '/admin/api/2026-07/graphql.json' in seen[0].full_url, 'the Admin API calls carry the token as X-Shopify-Access-Token, on API 2026-07')

with tempfile.TemporaryDirectory() as out:
    buf = io.StringIO()
    reply = json.dumps({'error': 'invalid_client', 'error_description': f'Client {CID} with secret {SECRET} is not valid'})
    with contextlib.redirect_stdout(buf):
        code = order_qc.main([out], env=env, opener=opener_fail(401, reply), shop=Fake([]))
    err = open(os.path.join(out, 'auth-error.txt')).read()
    ok(code == 2 and 'HTTP 401' in err and 'invalid_client' in err, f'a refused exchange fails the run with the status and Shopify\'s words ({err.strip()})')
    ok(SECRET not in err + buf.getvalue() and CID not in err + buf.getvalue(), 'the error never repeats the secret or the client id, even when Shopify does')
    ok(buf.getvalue().startswith('::error::'), 'shows as an error on the run')

with tempfile.TemporaryDirectory() as out, contextlib.redirect_stdout(io.StringIO()):
    code = order_qc.main([out], env={'SHOPIFY_STORE': 'x'}, opener=opener_ok([]), shop=Fake([]))
    ok(code == 1, 'missing secrets stop the run before any call')

print('all passed' if not failures else f'{failures} failed')
sys.exit(1 if failures else 0)
