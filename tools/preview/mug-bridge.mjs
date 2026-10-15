// The mug's even line breaks reach Teeinblue (hs2.js bridge). A stand-in personalizer with
// Teeinblue's markup and the mug's labels (Line 1 to 3, Signed), once with multi-line fields and
// once with one-line inputs, which would drop a "\n" and join two words.
// Run after render.mjs:   cd tools/preview && node mug-bridge.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failures++; };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let f = path.join(out, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(out, 'assets', path.basename(u.pathname));
  else if (u.pathname.startsWith('/products/')) f = path.join(out, 'product-gift.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

// what hs3.js leaves in the bridge's state after the chat (shareWithBridge)
const state = {
  dog: 'Biscuit', person: 'Linda',
  hs3_lines: { home: 'Naps best when you are there.', spot: 'Steals your side of the bed.', together: 'Lives for our morning walks.', meaning: 'Your best friend, no contest.' },
  hs3_mug_lines: { home: 'Naps best when\nyou are there.', spot: 'Steals your side of the bed.', meaning: 'Your best friend,\nno contest.' },
  hs3_kinds: { 'the-morning-mug': 'mug', 'the-couch-blanket': 'blanket' }
};

async function run(kind, handle) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(([st, kind]) => {
    window.sessionStorage.setItem('hs2-review', JSON.stringify(st));
    const data = {};
    window.teeinblueCampaign = { productId: '9001' };
    window.teeinblue = { getCurrentCustomization: () => ({ ...data }), refillCustomizationData: () => {} };
    const control = (id) => kind === 'textarea' ? `<textarea class="tee__input" name="${id}" id="${id}"></textarea>` : `<input class="tee__input tee__input--text" type="text" name="${id}" id="${id}">`;
    const field = (id, label) => `<div class="tee-field" id="tee-field--${id}"><div class="tee-field__heading"><span>${label}</span></div>${control(id)}</div>`;
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
      const box = document.createElement('div');
      box.className = 'tee-customization-form';
      box.innerHTML = field('layer-1', 'Line 1') + field('layer-2', 'Line 2') + field('layer-3', 'Line 3') + field('layer-4', 'Signed');
      box.addEventListener('input', (e) => { data[e.target.name] = e.target.value; });
      box.addEventListener('change', (e) => { data[e.target.name] = e.target.value; });
      (document.querySelector('[data-hs2-answers]') || document.body).after(box);
      document.dispatchEvent(new Event('teeinblue-event-component-injected'));
    }, 500));
  }, [state, kind]);
  await page.goto(`${base}/products/${handle}`);
  await page.waitForTimeout(2500);
  const vals = await page.evaluate(() => ['layer-1', 'layer-2', 'layer-3', 'layer-4'].map((id) => document.getElementById(id).value));
  const rec = await page.evaluate(() => window.teeinblue.getCurrentCustomization());
  const lines = await page.evaluate(() => (document.querySelector('[data-hs2-prop="hs_lines"]') || {}).value || '');
  await ctx.close();
  return { vals, rec, lines, errors };
}

{
  const r = await run('textarea', 'the-morning-mug');
  ok(r.vals[0] === 'Naps best when\nyou are there.', `mug, multi-line field: Line 1 gets the even break (${JSON.stringify(r.vals[0])})`);
  ok(r.vals[1] === 'Steals your side of the bed.', 'mug: Line 2 fits one row, unbroken');
  ok(r.vals[2] === 'Your best friend,\nno contest.', 'mug: Line 3 (meaning) gets the even break');
  ok(r.vals[3] === 'Love, Biscuit', 'mug: Signed');
  ok(r.rec['layer-1'] === 'Naps best when\nyou are there.', "mug: Teeinblue's own record holds the break");
  if (r.lines) ok(!r.lines.includes('\n'), `order note keeps the words on one line (${JSON.stringify(r.lines)})`);
  ok(!r.errors.length, 'no script errors ' + r.errors.join(' '));
}
{
  const r = await run('input', 'the-morning-mug');
  ok(r.vals[0] === 'Naps best when you are there.', `mug, one-line input: the line goes in unbroken, words never joined (${JSON.stringify(r.vals[0])})`);
  ok(r.vals[2] === 'Your best friend, no contest.', 'mug, one-line input: Line 3 unbroken');
  ok(!r.errors.length, 'no script errors ' + r.errors.join(' '));
}
{
  const r = await run('textarea', 'the-couch-blanket');
  ok(r.vals[0] === 'Naps best when you are there.', `blanket: no breaks, Courier lines as before (${JSON.stringify(r.vals[0])})`);
  ok(r.vals[2] === 'Lives for our morning walks.', 'blanket: Line 3 is the together line');
}
await browser.close();
server.close();
console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
