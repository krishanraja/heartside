// The cart path, read from outside as an anonymous visitor (Krish, 6 Nov: "How do we make this pipeline completely
// antifragile so that even if there are issues, we can fix them immediately with a clear understanding of what went
// wrong?"). It asks the store's own checkout-picture service, through Shopify's app proxy, the two questions every
// add depends on, and never paints, uploads, adds to a cart or creates a picture:
//   1. a made-up design: the service must answer 202 "pending, preview not ready" (Teeinblue has no copy of it),
//      which proves the proxy, the signature, the rate gate, the store token, the lookup and the Teeinblue check;
//   2. a design it already finished (HS_CANARY_DESIGN_ID, a GitHub secret; skipped without it): it must answer 200
//      "ready" with a picture on Shopify's CDN, which proves the readback.
// Shopify's app proxy turns every 5xx from the service into its own 500 page, so a 500 means the service failed.
// docs/RUNBOOK-cart.md says what each failure means and where to look.
//
// Exit 0 all clear; 1 something is broken (FAIL lines, read by .github/workflows/storefront-guard.yml); 2 inconclusive
// (Cloudflare, a rate limit or the network kept the runner from asking); 3 the check itself failed.
// The output names steps and codes only: never a design, a variant id or anything a buyer typed.
//
//   node tools/preview/cart-path-check.mjs
import crypto from 'node:crypto';

const STORE = process.env.HS_STORE_URL || 'https://heartside.io';
const PROXY = '/apps/heartside-artwork';
const GIFT = '/products/your-dogs-illustrated-mug.js';
const TIMEOUT = 25000;

const say = (mark, text) => console.log((mark === 'ok' ? 'ok  ' : mark === 'fail' ? 'FAIL' : mark === 'unknown' ? '??  ' : 'warn') + ' cart path: ' + text);

async function get(url, init) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {...init, signal: ctrl.signal, headers: {'User-Agent': 'heartside-storefront-guard', ...(init && init.headers)}});
    const text = await r.text();
    return {status: r.status, text, cf: r.headers.get('cf-mitigated') || ''};
  } finally { clearTimeout(t); }
}
const blocked = r => /challenge/i.test(r.cf) || r.status === 429 || /<title>[^<]*(?:just a moment|verify you are human|attention required)/i.test(r.text);
const json = t => { try { return JSON.parse(t); } catch { return null; } };

async function ask(design, variant) {
  const url = STORE + PROXY + '?customizationId=' + design + '&variantId=' + variant;
  const t0 = Date.now();
  const r = await get(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({customizationId: design, variantId: variant})});
  return {...r, ms: Date.now() - t0, data: json(r.text)};
}

export async function main() {
  let inconclusive = false, broken = false;
  const gift = await get(STORE + GIFT);
  if (blocked(gift)) { say('unknown', 'the store could not be read from here (' + gift.status + ')'); return 2; }
  const product = json(gift.text), variant = product && product.variants && product.variants.find(v => v.available !== false);
  if (!variant) { say('fail', 'the mug has no sellable variant to ask about'); return 1; }

  // 1. a made-up design: "not ready yet", never Shopify's error page
  const made = await ask(crypto.randomUUID(), String(variant.id));
  if (blocked(made)) { say('unknown', 'the checkout-picture service could not be asked (' + made.status + ')'); inconclusive = true; }
  else if (made.status === 202 && made.data && made.data.state === 'pending' && made.data.code === 'preview_unavailable') say('ok', 'a new design is told "not ready yet" (202, ' + made.ms + ' ms)');
  else {
    broken = true;
    const what = made.status === 500 ? "Shopify's error page (the service failed)" : made.status + (made.data && made.data.code ? ' ' + made.data.code : '');
    say('fail', 'a new design got ' + what + ', not 202 "not ready yet"; see docs/RUNBOOK-cart.md');
  }
  if (made.ms > 15000) { say('warn', 'the service took ' + made.ms + ' ms for a new design'); }

  // 2. a design it already finished: "ready", with its picture
  const done = process.env.HS_CANARY_DESIGN_ID || '';
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(done)) say('warn', 'no finished design to ask about (the HS_CANARY_DESIGN_ID secret is not set)');
  else {
    const ready = await ask(done, String(variant.id));
    if (blocked(ready)) { say('unknown', 'the finished design could not be asked (' + ready.status + ')'); inconclusive = true; }
    else if (ready.status === 200 && ready.data && ready.data.state === 'ready' && /^https:\/\/cdn\.shopify\.com\//.test(ready.data.imageUrl || '')) say('ok', 'a finished design reads back "ready" with its picture (' + ready.ms + ' ms)');
    else {
      broken = true;
      const what = ready.status === 500 ? "Shopify's error page (the service failed)" : ready.status + (ready.data && ready.data.code ? ' ' + ready.data.code : '');
      say('fail', 'a finished design got ' + what + ', not 200 "ready"; see docs/RUNBOOK-cart.md');
    }
  }
  return broken ? 1 : inconclusive ? 2 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(code => { process.exitCode = code; }, e => { console.log('the cart path check itself failed: ' + (e && e.name)); process.exitCode = 3; });
}
