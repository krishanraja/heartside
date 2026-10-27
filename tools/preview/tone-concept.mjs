// Render the approved tone control from the local storefront build.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('tools/preview/out');
const target = path.resolve('design/tone-v1/reveal-tone-mobile.png');
fs.mkdirSync(path.dirname(target), { recursive: true });
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://local');
  let f = path.join(root, decodeURIComponent(u.pathname));
  if (u.pathname.includes('/assets/')) f = path.join(root, 'assets', path.basename(u.pathname));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.woff2') ? 'font/woff2' : 'image/png' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.route(/krishraja10101\.app\.n8n\.cloud/, route => {
    const b = JSON.parse(route.request().postData() || '{}');
    if (b.warm) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"warm":true}' });
    if (route.request().url().includes('compose')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lines: b.current_lines, recommended_gift: 'mug', reason: 'The window watch is a serious job. So this note belongs on your mug.' }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index-gifts.html`);
  const tap = s => page.locator(s).first().click();
  await tap('[data-hs3-start]');
  await page.fill('#hs3-dog', 'Pip'); await tap('[data-hs3="next"]');
  await page.fill('#hs3-rec', 'Sam'); await tap('[data-hs3="next"]');
  await tap('[data-hs3="chip"]');
  await tap('[data-hs3="chip"]');
  await tap('[data-hs3="chip"]');
  await tap('[data-hs3="chip"]');
  await tap('[data-hs3="chip"]');
  await tap('[data-hs3="next"]');
  await page.waitForSelector('[data-hs3-screen="reveal"]');
  await page.waitForTimeout(3300);
  await page.locator('[data-hs3-tone]').waitFor();
  await page.screenshot({ path: target });
  console.log(await page.evaluate(() => Object.fromEntries(['.hs3-tone','.hs3-stage','.hs3-says','.hs3-dock'].map(s => { const r=document.querySelector(s)?.getBoundingClientRect(); return [s,r?{top:Math.round(r.top),bottom:Math.round(r.bottom)}:null]; }))));
  console.log(target);
} finally { await browser.close(); server.close(); }
