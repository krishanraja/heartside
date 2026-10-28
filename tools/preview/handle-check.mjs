// The handle check: are the three gifts still at their clean addresses, and does the store still
// point at them? Read without a browser, so it needs no npm install and runs anywhere Node 20 does:
// before and after every guarded theme push, and every hour (storefront-guard.yml).
//
//   node tools/preview/handle-check.mjs                     # heartside.io, the live theme
//   node tools/preview/handle-check.mjs --theme <id>        # the home page and menu of that theme too
//   node tools/preview/handle-check.mjs --warn-media        # pictures warn instead of failing
//   node tools/preview/handle-check.mjs --base http://127.0.0.1:8080   # a local stand-in (tests)
//
// For each gift in catalog.mjs:
//   - /products/<handle>.js answers 200 itself (no redirect) with the same handle, title, lowest
//     and highest price, variant count, and every variant available;
//   - the product page answers 200 itself and carries its native template's mark on #buy;
//   - no variant's own picture is the blank supplier base (checkout draws the nested line with it).
// Then the home page's chat config names the three clean handles with real addresses, the phone
// menu links to the three, the Artist's touch answers with its price and a real picture (not the
// heart stand-in), and each old address in REDIRECTS answers 301 to its clean one.
//
// Exit 0 all clear; 1 something is broken; 2 inconclusive (a Cloudflare challenge, rate limit,
// server error or network failure kept a check from reading the store; never a pass); 3 the check
// itself failed. It prints paths and counts only: never the store's host, never a theme id. GET
// only, no cookies kept between runs, nothing written anywhere.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { CORE, ADDON, REDIRECTS, BLANK_MEDIA_IDS, BLANK_ALT, BLANK_FILES, STANDIN_FILES, markerSelector, landed } from './catalog.mjs';

const TIMEOUT = 20000;
// honest about what it is; a challenge for it counts as inconclusive, not as a failure
const UA = 'HeartsideHandleCheck/1 (+https://github.com/krishanraja/heartside/blob/main/tools/preview/handle-check.mjs)';

// ------------------------------------------------------------ pure parts
const header = (headers, k) => (headers ? (typeof headers.get === 'function' ? headers.get(k) : headers[k]) : null) || '';
// Cloudflare's challenge, or an answer that says nothing about the store
export function blocked({ status, headers, text } = {}) {
  if (/challenge/i.test(header(headers, 'cf-mitigated'))) return 'a Cloudflare challenge';
  if (/<title>[^<]*(?:just a moment|verify you are human|attention required)/i.test(text || '')) return 'a Cloudflare challenge';
  if (status === 429) return 'a rate limit (HTTP 429)';
  if (status >= 500) return `a server error (HTTP ${status})`;
  return '';
}
const fileOf = (src) => { try { return decodeURIComponent(new URL(String(src), 'https://x.invalid').pathname.split('/').pop()).toLowerCase(); } catch { return ''; } };
const named = (src, stems) => { const f = fileOf(src); return !!f && stems.some((s) => f.includes(String(s).toLowerCase())); };
// a variant picture is the blank base by the theme's own rules, or by a file name CoWork recorded
export function isBlank(variant) {
  const img = variant && variant.featured_image, med = variant && variant.featured_media;
  if (med && BLANK_MEDIA_IDS.includes(String(med.id))) return true;
  for (const x of [img, med]) if (x && BLANK_ALT.test(String(x.alt || ''))) return true;
  return [img && img.src, med && med.preview_image && med.preview_image.src].some((s) => s && named(s, BLANK_FILES));
}
// what products/<handle>.js should say, against what it said: a list of what differs
export function productProblems(item, json) {
  const out = [];
  if (!json || typeof json !== 'object') return ['not product JSON'];
  if (json.handle !== item.handle) out.push(`its handle is ${JSON.stringify(json.handle)}`);
  if (json.title !== item.title) out.push(`its title is ${JSON.stringify(json.title)}`);
  if (json.price_min !== item.min || json.price_max !== item.max) out.push(`its prices are ${json.price_min}..${json.price_max} cents, expected ${item.min}..${item.max}`);
  const vs = Array.isArray(json.variants) ? json.variants : [];
  if (vs.length !== item.variants) out.push(`${vs.length} variants, expected ${item.variants}`);
  const off = vs.filter((v) => !v.available).length;
  if (json.available === false || off) out.push(`${off || 'all'} of ${vs.length} variants unavailable`);
  return out;
}
// the attributes of the #buy element in server-rendered HTML
export function buyAttributes(html) {
  const tag = (String(html).match(/<[a-z][^>]*\sid=["']?buy["'\s>][^>]*>/i) || [])[0];
  if (!tag) return null;
  const attrs = {};
  for (const m of tag.matchAll(/\s([a-z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi)) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return attrs;
}
export const hasMarker = (html, item) => {
  const a = buyAttributes(html);
  return !!a && Object.entries(item.marker).every(([k, v]) => k in a && (v === '' || a[k] === v));
};
// the chat's gift list as the home page's server render gives it
export function chatConfig(html) {
  const m = String(html).match(/<script\b[^>]*\bdata-hs3-config\b[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}
export function chatProblems(config) {
  if (!config || !config.gifts) return ['home: no chat config on the first screen'];
  const out = [];
  for (const item of CORE) {
    const g = config.gifts[item.chat] || {};
    if (!g.handle || !g.url) out.push(`home: the chat has no ${item.key} (its product setting points at nothing)`);
    else if (g.handle !== item.handle) out.push(`home: the chat's ${item.key} is /products/${g.handle}, expected ${item.path}`);
    else if (landed(item.path, g.url)) out.push(`home: the chat links the ${item.key} to ${new URL(g.url, 'http://x.invalid').pathname}`);
  }
  return out;
}
// the phone menu's links (hs-footer.liquid renders it into a <template>)
export function menuLinks(html) {
  const m = String(html).match(/<template\b[^>]*\bdata-hs-menu\b[^>]*>([\s\S]*?)<\/template>/i);
  if (!m) return null;
  return [...m[1].matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)].map((x) => { try { return new URL(x[1], 'http://x.invalid').pathname; } catch { return x[1]; } });
}
export function menuProblems(links) {
  if (!links) return ['home: the phone menu is missing'];
  return CORE.filter((item) => !links.includes(item.path)).map((item) => `home: the phone menu has no link to ${item.path}`);
}

// One verdict for a set of results. Each result is { path, state: 'ok' | 'fail' | 'unknown',
// kind: 'address' | 'media', detail }. With warnMedia a broken picture is reported as a warning.
export function judge(results, { warnMedia = false } = {}) {
  const all = results.map((r) => (warnMedia && r.state === 'fail' && r.kind === 'media' ? { ...r, state: 'warn' } : r));
  const broken = all.filter((r) => r.state === 'fail'), unknown = all.filter((r) => r.state === 'unknown'), warned = all.filter((r) => r.state === 'warn');
  return { code: broken.length ? 1 : unknown.length ? 2 : 0, broken, unknown, warned, results: all };
}

// --------------------------------------------------------------- reading
// One GET with redirect: 'manual'. A hop that keeps the host and path (a query or cookie step, as
// a theme preview can take) is followed, up to three; any other redirect is the answer.
async function get(base, p, { theme = '', json = false } = {}) {
  let url = new URL(p, base);
  if (theme) url.searchParams.set('preview_theme_id', theme);
  const cookies = [];
  for (let hop = 0; ; hop++) {
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT), headers: { 'user-agent': UA, accept: json ? 'application/json' : 'text/html', ...(cookies.length ? { cookie: cookies.join('; ') } : {}) } });
    } catch (e) {
      return { error: (e && e.cause && e.cause.code) || (e && e.name === 'TimeoutError' ? 'a timeout' : 'a network error') };
    }
    const text = await res.text().catch(() => '');
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, url);
      if (next.host === url.host && next.pathname === url.pathname && hop < 3) {
        for (const c of (res.headers.getSetCookie ? res.headers.getSetCookie() : [])) cookies.push(c.split(';')[0]);
        url = next; continue;
      }
      return { status: res.status, headers: res.headers, text, location: next.host === url.host ? next.pathname : `another host (${next.pathname})` };
    }
    return { status: res.status, headers: res.headers, text };
  }
}
const ok = (p, detail, kind = 'address') => ({ path: p, state: 'ok', kind, detail });
const fail = (p, detail, kind = 'address') => ({ path: p, state: 'fail', kind, detail });
const unknown = (p, detail) => ({ path: p, state: 'unknown', kind: 'address', detail });
// a response that cannot be judged, or a definite wrong answer, or null when it is a plain 200
function answer(p, r, expect = 200) {
  if (r.error) return unknown(p, `could not be read (${r.error})`);
  const why = blocked(r);
  if (why) return unknown(p, `not checked: ${why}`);
  if (r.location) return fail(p, `moved: ${p} now lands on ${r.location} (HTTP ${r.status})`);
  if (r.status !== expect) return fail(p, `answered HTTP ${r.status}, expected ${expect}`);
  return null;
}

export async function check({ base = 'https://heartside.io', theme = '' } = {}) {
  const results = [];
  const jobs = [];
  for (const item of CORE) {
    jobs.push((async () => {
      const p = item.path + '.js';
      const r = await get(base, p, { json: true });
      const bad = answer(p, r);
      if (bad) return results.push(bad);
      let json;
      try { json = JSON.parse(r.text); } catch { return results.push(fail(p, 'answered 200 without product JSON')); }
      const problems = productProblems(item, json);
      results.push(problems.length ? fail(p, problems.join('; ')) : ok(p, `${item.variants} variants available at the expected prices`));
      const vs = Array.isArray(json.variants) ? json.variants : [];
      const blank = vs.filter(isBlank).length;
      results.push(blank ? fail(p, `${blank} of ${vs.length} variants show the blank base picture, which checkout draws on the gift's nested line`, 'media') : ok(p, 'no variant shows the blank base picture', 'media'));
    })());
    jobs.push((async () => {
      const r = await get(base, item.path, { theme });
      const bad = answer(item.path, r);
      if (bad) return results.push(bad);
      results.push(hasMarker(r.text, item) ? ok(item.path, 'on its native template') : fail(item.path, `not on its native template (no ${markerSelector(item)})`));
    })());
  }
  jobs.push((async () => {
    const r = await get(base, '/', { theme });
    const bad = answer('/', r);
    if (bad) return results.push(bad);
    const chat = chatProblems(chatConfig(r.text)), menu = menuProblems(menuLinks(r.text));
    results.push(chat.length ? fail('/', chat.join('; ')) : ok('/', 'the chat offers the three gifts at their clean addresses'));
    results.push(menu.length ? fail('/', menu.join('; ')) : ok('/', 'the phone menu links the three gifts'));
  })());
  jobs.push((async () => {
    const p = ADDON.path + '.js';
    const r = await get(base, p, { json: true });
    const bad = answer(p, r);
    if (bad) return results.push(bad);
    let json;
    try { json = JSON.parse(r.text); } catch { return results.push(fail(p, 'answered 200 without product JSON')); }
    const wrong = [];
    if (json.handle !== ADDON.handle) wrong.push(`its handle is ${JSON.stringify(json.handle)}`);
    if (json.price_min !== ADDON.min) wrong.push(`its price is ${json.price_min} cents, expected ${ADDON.min}`);
    results.push(wrong.length ? fail(p, wrong.join('; ')) : ok(p, 'answers with its price'));
    const pictures = [json.featured_image, ...(Array.isArray(json.images) ? json.images : [])].filter(Boolean).map((x) => (typeof x === 'string' ? x : x.src));
    if (!pictures.length) results.push(fail(p, 'has no picture, so the cart and checkout show a blank square', 'media'));
    else if (named(pictures[0], STANDIN_FILES)) results.push(fail(p, 'still shows the heart stand-in picture', 'media'));
    else results.push(ok(p, 'has its own picture', 'media'));
  })());
  for (const [from, to] of Object.entries(REDIRECTS)) {
    jobs.push((async () => {
      const r = await get(base, from);
      if (r.error) return results.push(unknown(from, `could not be read (${r.error})`));
      const why = blocked(r);
      if (why) return results.push(unknown(from, `not checked: ${why}`));
      if (r.status === 301 && r.location === to) return results.push(ok(from, `301 to ${to}`));
      results.push(fail(from, r.location ? `answers ${r.status} to ${r.location}, expected 301 to ${to}` : `answers HTTP ${r.status}, expected 301 to ${to}`));
    })());
  }
  await Promise.all(jobs);
  // a stable order for the report: the order the checks were listed in
  const order = [...CORE.flatMap((i) => [i.path + '.js', i.path]), '/', ADDON.path + '.js', ...Object.keys(REDIRECTS)];
  return results.sort((a, b) => order.indexOf(a.path) - order.indexOf(b.path));
}

// ------------------------------------------------------------------- CLI
export function report(verdict, out = console.log) {
  const mark = { ok: 'ok  ', fail: 'FAIL', unknown: '??  ', warn: 'warn' };
  for (const r of verdict.results) out(`${mark[r.state]} ${r.path}: ${r.detail}`);
  const n = verdict.results.length;
  if (verdict.code === 1) out(`\n${verdict.broken.length} of ${n} checks broken${verdict.unknown.length ? `, ${verdict.unknown.length} not checked` : ''}`);
  else if (verdict.code === 2) out(`\ninconclusive: ${verdict.unknown.length} of ${n} checks could not read the store, nothing broken in the rest`);
  else out(`\nall clear (${n} checks${verdict.warned.length ? `, ${verdict.warned.length} picture warnings` : ''})`);
}

async function main(argv) {
  const arg = (name) => { const i = argv.indexOf('--' + name); return i > -1 ? argv[i + 1] : undefined; };
  const theme = arg('theme') || '';
  if (theme && !/^\d+$/.test(theme)) { console.log('--theme takes digits only'); return 3; }
  const base = arg('base') || 'https://heartside.io';
  const verdict = judge(await check({ base, theme }), { warnMedia: argv.includes('--warn-media') });
  report(verdict);
  return verdict.code;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.log(`the check itself failed: ${e && e.name}`); process.exitCode = 3; });
}
