// The product gallery's image-click glitch (27 Oct): a thumbnail click used to blank the main
// photo for about 600 ms, drop its srcset and change the box between the preview's shape and a
// square crop. Real Chromium, the real swapMain from hs2.js and the real hs2.css stage, with the
// new photo served slowly: the visible photo must never be empty, the stage must not change
// height by more than 1 px, and the srcset must survive. Nothing leaves localhost.
//
//   node --test tools/preview/gallery.browser.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {chromium} from 'playwright';

const hs2 = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../shopify/assets/hs2.css', import.meta.url), 'utf8');
const start = hs2.indexOf('  function swapMain(');
const swapMain = hs2.slice(start, hs2.indexOf('\n  function ', start + 1));

// a solid-color PNG of the given size, no dependencies
function png(w, h, [r, g, b]) {
  const crcTable = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const x of buf) c = crcTable[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => [r, g, b][i % 3])]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0))]);
}
const images = {'/a-600.png': png(600, 600, [200, 120, 90]), '/a-1200.png': png(1200, 1200, [200, 120, 90]),
  '/b-600.png': png(600, 800, [90, 120, 200]), '/b-1200.png': png(1200, 1600, [90, 120, 200])};
const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>
<div class="hs2"><div class="hs2-product" id="buy"><div class="hs2-product__media" data-hs2-media data-tib="off">
<div class="hs2-product__stage" data-hs2-stage style="--hs2-ratio: 1"><div class="hs2-product__tib" data-hs2-tib-gallery></div>
<div class="hs2-product__main"><img data-hs2-main src="/a-1200.png" srcset="/a-600.png 600w, /a-1200.png 1200w" sizes="100vw" alt="A" width="1200" height="1200"></div></div>
<div class="hs2-product__thumbs"><button type="button" data-hs2-thumb="/b-1200.png" data-srcset="/b-600.png 600w, /b-1200.png 1200w" data-alt="B">B</button></div>
</div></div></div>
<script>(function(){ ${swapMain}
  window.__swap = swapMain;
  document.querySelector('[data-hs2-thumb]').addEventListener('click', function (e) { var b = e.currentTarget; swapMain(b.getAttribute('data-hs2-thumb'), b.getAttribute('data-srcset'), b.getAttribute('data-alt')); });
})();</script></body></html>`;

for (const reduced of [false, true]) test(`thumbnail click never blanks, resizes or downgrades the photo${reduced ? ' (reduced motion)' : ''}`, async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, reducedMotion: reduced ? 'reduce' : 'no-preference'});
    const tab = await context.newPage(), offsite = [];
    await tab.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'localhost') { offsite.push(url.href); return route.abort(); }
      if (url.pathname === '/') return route.fulfill({contentType: 'text/html', body: page});
      if (images[url.pathname]) {
        if (url.pathname.startsWith('/b-')) await new Promise(r => setTimeout(r, 500)); // the new photo arrives slowly
        return route.fulfill({contentType: 'image/png', body: images[url.pathname]});
      }
      return route.fulfill({status: 404, body: ''});
    });
    await tab.goto('http://localhost/');
    await tab.waitForFunction(() => document.querySelector('[data-hs2-main]').naturalWidth > 0);
    const before = await tab.evaluate(() => document.querySelector('[data-hs2-stage]').getBoundingClientRect().height);
    // sample every frame from the click until the new photo is in place
    const samples = await tab.evaluate(() => new Promise(resolve => {
      const main = document.querySelector('[data-hs2-main]'), stage = document.querySelector('[data-hs2-stage]'), out = [];
      const t0 = performance.now();
      const tick = () => {
        out.push({w: main.naturalWidth, complete: main.complete, h: stage.getBoundingClientRect().height, src: main.getAttribute('src'), srcset: main.getAttribute('srcset')});
        if ((main.getAttribute('src') === '/b-1200.png' && main.complete && main.naturalWidth > 0 && out.length > 3) || performance.now() - t0 > 4000) resolve(out); else requestAnimationFrame(tick);
      };
      document.querySelector('[data-hs2-thumb]').click(); tick();
    }));
    assert.ok(samples.length > 5, 'sampled the swap');
    assert.equal(samples.filter(s => s.w === 0).length, 0, 'the visible photo is never empty');
    const heights = samples.map(s => s.h);
    assert.ok(Math.max(...heights) - Math.min(...heights) <= 1 && Math.abs(heights[0] - before) <= 1, `stage height held: ${Math.min(...heights)} to ${Math.max(...heights)}`);
    const last = samples.at(-1);
    assert.equal(last.src, '/b-1200.png'); assert.equal(last.srcset, '/b-600.png 600w, /b-1200.png 1200w', 'srcset kept');
    // a newer click wins over one still loading
    await tab.evaluate(() => { window.__swap('/b-1200.png', '/b-600.png 600w, /b-1200.png 1200w', 'B'); window.__swap('/a-1200.png', '/a-600.png 600w, /a-1200.png 1200w', 'A'); });
    await tab.waitForTimeout(900);
    assert.equal(await tab.getAttribute('[data-hs2-main]', 'src'), '/a-1200.png');
    assert.deepEqual(offsite, []);
  } finally { await browser.close(); }
});
