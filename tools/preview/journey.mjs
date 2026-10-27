// The shopper's journey through the rendered preview, measured the same way at a phone and a
// desktop size. A skeleton for later checks: each check is one function below that runs in the
// page and returns plain JSON, so a new check is one more function and one line in CHECKS.
// It records; it does not judge. The report is the evidence, and gates can be built on it.
//
//   cd tools/preview && node render.mjs && node journey.mjs out/journey
//   node journey.mjs out/journey --pages home,mug --views phone
//   node journey.mjs <folder> --root <rendered pages>     # default: tools/preview/out
//
// Writes <folder>/report.json and one screenshot per page and size into the folder named on the
// command line. Every request to the n8n host is aborted before it leaves the browser, so Buddy's
// paid AI is never called; any other request that would leave this machine is aborted as well, so
// the run is the same offline as online. Both are listed in the report. Importing this file runs
// nothing: run() and the checks are exported for other scripts to build on.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// the rendered pages (render.mjs) and the sizes they are opened at
export const PAGES = {
  home: 'index.html',
  mug: 'product-mug-native.html',
  portrait: 'product-portrait-native.html',
  blanket: 'product-blanket-native.html',
};
export const VIEWS = {
  phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
};
// what counts as a primary button; the first visible one in document order is measured
export const PRIMARY = ['[data-hs3-start]', '.hs3-btn', '#teeAtcButton', '[data-hs2-add]', '#buy .hs2-btn', '.hs-btn', '.cart__checkout-button', 'main a.button'];

// ------------------------------------------------------------------ checks
// Each runs inside the page (page.evaluate) and returns JSON.

// the page is wider than the window: someone can scroll it sideways
export function checkOverflow() {
  const scrollWidth = document.documentElement.scrollWidth;
  return { scrollWidth, innerWidth, overflow: scrollWidth > innerWidth };
}

// html or body set to overflow: hidden, which stops the page scrolling at all
export function checkScrollLock() {
  const read = (el) => { const cs = getComputedStyle(el); return { overflow: cs.overflow, overflowX: cs.overflowX, overflowY: cs.overflowY }; };
  const html = read(document.documentElement), body = read(document.body);
  const hidden = (o) => o.overflow === 'hidden' || o.overflowY === 'hidden';
  return { html, body, htmlHidden: hidden(html), bodyHidden: hidden(body) };
}

// where the first primary button sits against the first screen
export function checkPrimaryButton(selectors) {
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    return !el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  };
  const found = [...document.querySelectorAll(selectors.join(','))].filter(shown);
  if (!found.length) return { found: false };
  const el = found[0];
  const r = el.getBoundingClientRect();
  return {
    found: true,
    selector: selectors.find((s) => el.matches(s)),
    text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    rect: { top: Math.round(r.top), left: Math.round(r.left), bottom: Math.round(r.bottom), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) },
    viewport: { width: innerWidth, height: innerHeight },
    inFirstScreen: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
    belowFoldBy: Math.max(0, Math.round(r.bottom - innerHeight)),
  };
}

// name: (page) => JSON, run in this order after the page settles
export const CHECKS = {
  overflow: (page) => page.evaluate(checkOverflow),
  scroll_lock: (page) => page.evaluate(checkScrollLock),
  primary_button: (page) => page.evaluate(checkPrimaryButton, PRIMARY),
};

// ---------------------------------------------------------------- network
// n8n first: Buddy's AI runs there and every call costs money.
export const isN8n = (url) => /n8n/i.test(url);
async function guardNetwork(page, base, log) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (isN8n(url)) { log.n8n.push(url); return route.abort(); }
    if (!url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:')) { log.external.push(url); return route.abort(); }
    return route.continue();
  });
}

// console errors and uncaught exceptions; a failed load of a request we aborted is ours, not the page's
function watchConsole(page, log) {
  page.on('console', (m) => { if (m.type() === 'error') log.console.push({ text: m.text(), url: m.location().url || '' }); });
  page.on('pageerror', (e) => log.console.push({ text: String(e), url: '', uncaught: true }));
}
const pageErrors = (log) => log.console.filter((c) => !(c.url && (log.n8n.includes(c.url) || log.external.includes(c.url))) && !/net::ERR_FAILED/.test(c.text));

// ------------------------------------------------------------------ server
// the rendered pages as a shop: / is the homepage, /products/<handle> that product's page
function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const products = { 'your-dogs-illustrated-mug': PAGES.mug, 'your-dogs-portrait': PAGES.portrait, 'your-dogs-personality-blanket': PAGES.blanket };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let f = path.join(root, decodeURIComponent(u.pathname));
    if (u.pathname === '/') f = path.join(root, PAGES.home);
    else if (u.pathname.startsWith('/products/')) f = path.join(root, products[u.pathname.split('/')[2]] || '');
    else if (u.pathname.includes('/assets/')) f = path.join(root, 'assets', u.pathname.split('/assets/')[1]);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

// --------------------------------------------------------------------- run
async function visit(browser, base, folder, name, view) {
  const V = VIEWS[view];
  const ctx = await browser.newContext({ viewport: { width: V.width, height: V.height }, isMobile: V.isMobile, hasTouch: V.hasTouch, deviceScaleFactor: V.deviceScaleFactor });
  const page = await ctx.newPage();
  const log = { console: [], n8n: [], external: [] };
  await guardNetwork(page, base, log);
  watchConsole(page, log);
  const result = { page: name, view, url: PAGES[name] };
  try {
    await page.goto(`${base}/${PAGES[name]}`, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(900); // hs3.js lays out its screen and hs2.js tidies after load
    for (const [key, check] of Object.entries(CHECKS)) result[key] = await check(page);
    result.screenshot = `${name}-${view}.png`;
    await page.screenshot({ path: path.join(folder, result.screenshot) });
  } catch (e) {
    result.error = e.message.split('\n')[0];
  }
  result.console_errors = pageErrors(log);
  result.blocked = { n8n: log.n8n, external: log.external };
  await ctx.close();
  return result;
}

// Opens every page at every size, runs CHECKS, and writes report.json and the screenshots.
export async function run({ folder, root = path.join(here, 'out'), pages = Object.keys(PAGES), views = Object.keys(VIEWS) }) {
  fs.mkdirSync(folder, { recursive: true });
  const exe = ['/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  const server = await serve(root);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--disable-background-networking'] });
  const results = [];
  try {
    for (const name of pages) {
      if (!fs.existsSync(path.join(root, PAGES[name]))) { results.push({ page: name, error: `${PAGES[name]} not rendered (run render.mjs)` }); continue; }
      for (const view of views) results.push(await visit(browser, base, folder, name, view));
    }
  } finally {
    await browser.close();
    server.close();
  }
  const report = { generated_at: new Date().toISOString(), root: path.relative(here, root) || '.', views: VIEWS, primary_selectors: PRIMARY, results };
  fs.writeFileSync(path.join(folder, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

// ---------------------------------------------------------------------- CLI
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const arg = (name) => { const i = args.indexOf('--' + name); return i > -1 ? args[i + 1] : undefined; };
  const folder = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!folder) {
    console.log('usage: node journey.mjs <report folder> [--pages home,mug,portrait,blanket] [--views phone,desktop] [--root <rendered pages>]');
    process.exit(2);
  }
  const pick = (list, all) => (list ? list.split(',') : Object.keys(all)).filter((k) => all[k]);
  const out = path.resolve(folder);
  const { results } = await run({ folder: out, root: arg('root') ? path.resolve(arg('root')) : undefined, pages: pick(arg('pages'), PAGES), views: pick(arg('views'), VIEWS) });
  for (const r of results) {
    if (r.error) { console.log(`ERR  ${r.page}${r.view ? ' ' + r.view : ''}: ${r.error}`); continue; }
    const b = r.primary_button;
    console.log(`${r.page.padEnd(9)} ${r.view.padEnd(8)} console errors ${r.console_errors.length}, sideways ${r.overflow.overflow ? 'yes' : 'no'}, html/body hidden ${r.scroll_lock.htmlHidden ? 'yes' : 'no'}/${r.scroll_lock.bodyHidden ? 'yes' : 'no'}, button ${b.found ? `"${b.text}" at ${b.rect.top}-${b.rect.bottom}px${b.inFirstScreen ? '' : ` (below the first screen by ${b.belowFoldBy}px)`}` : 'none'}, n8n blocked ${r.blocked.n8n.length}`);
  }
  console.log(`report: ${path.join(path.relative(process.cwd(), out) || '.', 'report.json')}`);
  process.exit(results.some((r) => r.error) ? 1 : 0);
}
