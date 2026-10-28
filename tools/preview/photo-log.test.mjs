// ?hsdebug=photo (hs2.js photoLog): an on-screen log of every photo stage, for Krish's real Android
// phone (28 Oct: the photo did not add there, and no desktop run could see why). Real functions in
// Chromium on a stand-in page: off by default; on, it draws a fixed overlay with Copy, Clear and Hide;
// it notes the page's arrival (navigation type, discarded, device) and Teeinblue's reaction (its crop
// dialog, its photo message); it survives a reload in the same tab, keeps the last 120 entries, and
// ?hsdebug=off clears it. It never sends anything and never keeps pixels.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const NAMES = ['photoLog', 'photoLogRead', 'photoLogOn', 'photoLogFile', 'photoLogLock', 'photoLogStart', 'photoLogDraw'];
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const minified of [false, true]) {
  test(`${minified ? 'minified' : 'source'}: the photo log is off by default, and on ?hsdebug=photo it survives a reload, keeps 120 entries and stays on the device`, async () => {
    const code = NAMES.map(section).join('\n') + '\nfunction productId(){return 7;}\nphotoLogOn();';
    const script = minified ? transformSync(code, {minify: true}).code : code;
    const context = await browser.newContext({viewport: {width: 360, height: 640}});
    const page = await context.newPage(), outside = [], errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => {
      const url = new URL(r.request().url());
      if (url.origin === 'https://hs.test') return r.fulfill({contentType: 'text/html', body: `<!doctype html><meta name="viewport" content="width=device-width"><main id="buy"><div class="tee-field--photo"></div></main><script>${script}</script>`});
      outside.push(url.href); return r.abort();
    });
    try {
      await page.goto('https://hs.test/products/your-dogs-mug');
      assert.equal(await page.locator('[data-hs-photo-log]').count(), 0, 'off by default');
      assert.equal(await page.evaluate(() => sessionStorage.length), 0, 'nothing stored');

      await page.goto('https://hs.test/products/your-dogs-mug?hsdebug=photo');
      const overlay = page.locator('[data-hs-photo-log]');
      for (const name of ['Copy', 'Clear', 'Hide']) assert.equal(await overlay.getByRole('button', {name}).isVisible(), true, name);
      const first = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs-photo-log')));
      assert.equal(first[0].s, 'page'); assert.equal(first[0].nav, 'navigate'); assert.equal(first[0].discarded, false);
      assert.match(first[0].ua, /Chrome/); assert.equal(first[0].viewport, '360x640@1'); assert.equal(first[0].path, '/products/your-dogs-mug');
      // Teeinblue's reaction, as it happens
      await page.evaluate(() => { const d = document.createElement('div'); d.className = 'vm--container'; document.body.appendChild(d);
        const m = document.createElement('p'); m.className = 'tee-photo-message'; m.textContent = 'Image is too small'; document.querySelector('.tee-field--photo').appendChild(m); });
      await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('hs-photo-log')).some(e => e.s === 'teeinblue' && e.dialog === true && e.message === 'Image is too small'));
      assert.match(await overlay.locator('pre').textContent(), /teeinblue dialog=true uploading=false message=Image is too small/);

      // a reload, as when Android brings the tab back: the flag and the earlier entries survive
      await page.reload();
      const after = await page.evaluate(() => JSON.parse(sessionStorage.getItem('hs-photo-log')));
      const reloaded = after.filter(e => e.s === 'page').pop();
      assert.equal(reloaded.nav, 'reload'); assert.ok(reloaded.earlier >= 2, String(reloaded.earlier));
      assert.ok(after.some(e => e.s === 'pagehide'), 'the page leaving is logged too');
      assert.equal(await overlay.isVisible(), true);

      // the last 120 entries only
      const kept = await page.evaluate(() => { for (let i = 0; i < 200; i++) photoLog('stage', {i}); return JSON.parse(sessionStorage.getItem('hs-photo-log')); });
      assert.equal(kept.length, 120); assert.equal(kept[119].i, 199);

      await overlay.getByRole('button', {name: 'Copy'}).click();
      await page.waitForFunction(() => document.querySelector('[data-hs-photo-log-copy]').textContent === 'Copied');
      await overlay.getByRole('button', {name: 'Hide'}).click();
      assert.equal(await overlay.locator('pre').isVisible(), false); assert.equal(await overlay.getByRole('button', {name: 'Show'}).isVisible(), true);
      await overlay.getByRole('button', {name: 'Clear'}).click();
      assert.equal(await page.evaluate(() => sessionStorage.getItem('hs-photo-log')), null);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('hs-debug')), 'photo', 'Clear empties the log; the log stays on');

      await page.goto('https://hs.test/products/your-dogs-mug?hsdebug=off');
      assert.equal(await page.locator('[data-hs-photo-log]').count(), 0);
      assert.deepEqual(await page.evaluate(() => [sessionStorage.getItem('hs-debug'), sessionStorage.getItem('hs-photo-log')]), [null, null]);
      assert.deepEqual(outside, [], 'nothing leaves the device'); assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}
test('the photo log has no way to send anything', () => {
  const code = NAMES.map(section).join('\n');
  assert.doesNotMatch(code, /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|FormData|\.src\s*=|toDataURL|getImageData/);
});
