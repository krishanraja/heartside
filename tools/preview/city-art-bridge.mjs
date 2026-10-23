// Local provider stand-in: proves bridge behavior, not actual AI generation or fulfillment.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://test').pathname;
  const f = pathname.includes('/assets/') ? path.join(here, 'out/assets', path.basename(pathname)) : path.join(here, 'out/product-city-art.html');
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('hs2-review')) sessionStorage.setItem('hs2-review', JSON.stringify({ dog: 'Milo', hs3_lines: { meaning: "I'd choose you every time." } }));
    window.teeinblueCampaign = { productId: 'fixture-native-print' };
    const data = {};
    window.teeinblue = { getCurrentCustomization: () => ({ ...data }) };
    window.uploads = 0; window.cartAdds = 0;
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.createElement('div'); form.className = 'tee-customization-form';
      const field = (id, label, max) => `<div class="tee-field" id="tee-field--${id}"><div class="tee-field__heading"><span>${label}</span></div><input type="text" name="${id}" id="${id}" maxlength="${max}"></div>`;
      form.innerHTML = field('layer-city', 'City', 60) + field('layer-dog', "Dog's name", 14) + field('layer-note', 'Line 4', 44) + '<div class="tee-field tee-field--photo"><span>Upload photo</span><input type="file" id="tee-photo-test"></div><button id="teeAtcButton">Add to cart</button>';
      form.insertAdjacentHTML('afterbegin', '<div class="tee-variants"><div class="tee-option-inner">' + ['Black', 'Red Oak', 'White'].map((name, i) => `<div class="tee-radio"><label class="tee-radio-label"><input type="radio" name="frame" ${i ? '' : 'checked'}><span>${name}</span></label></div>`).join('') + '</div></div>');
      form.insertAdjacentHTML('beforeend', '<svg><g id="artwork-layer--layer-747218"><image href="https://example.test/6adb83e021733-placeholder.png"/></g></svg>');
      form.addEventListener('input', e => { data[e.target.name] = e.target.value; });
      form.addEventListener('change', e => { if(e.target.type === 'file') window.uploads++; });
      form.querySelector('#teeAtcButton').addEventListener('click', () => window.cartAdds++);
      document.querySelector('[data-hs2-answers]').after(form);
      document.dispatchEvent(new Event('teeinblue-event-component-injected'));
    });
  });
  const url = `http://127.0.0.1:${server.address().port}/products/city-art-test`;
  await page.goto(url);
  await page.waitForTimeout(1000);
  assert.equal(await page.inputValue('#layer-city'), 'Somewhere quiet');
  assert.equal(await page.inputValue('#layer-dog'), 'Milo');
  assert.equal(await page.inputValue('#layer-note'), "I'd choose you every time.");
  assert.equal(await page.evaluate(() => window.__hs2api.answer('hs_lines')), "I'd choose you every time.");
  await page.click('[data-hs2-artwork-edit-city]');
  assert.equal(await page.locator('.tee-field:visible input[type=text]').count(), 1);
  await page.fill('#layer-city', '');
  await page.locator('#layer-city').blur();
  assert.equal(await page.inputValue('#layer-city'), 'Somewhere quiet', 'clearing the optional city restores a valid generic variable');
  await page.fill('#layer-city', 'San Francisco');
  await page.click('[data-hs2-tib-edit]');
  assert.equal(await page.locator('.tee-field:visible input[type=text]').count(), 0);
  // Reproduce the direct-arrival class that survived Done in the actual Shopify editor.
  await page.evaluate(() => document.documentElement.classList.add('hs2-v3-direct'));
  await page.click('[data-hs2-tib-edit]');
  await page.click('[data-hs2-tib-edit]');
  assert.equal(await page.locator('[data-hs2-gift-edit-nav]').isVisible(), false, 'Done closes the direct-arrival field navigation');
  for (const finish of ['Black', 'Red Oak', 'White']) {
    const bounds = await page.getByText(finish, {exact: true}).boundingBox();
    assert.ok(bounds && bounds.width > 20 && bounds.height > 10, `${finish} has a readable frame label`);
  }
  await page.evaluate(() => { window.__hs2api.usePhoto(new File(['synthetic fixture'], 'fixture.png', {type:'image/png'}), 123456); document.dispatchEvent(new Event('teeinblue-event-component-injected')); });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.uploads), 0, 'AI photo is not submitted before deliberate creation');
  await page.click('[data-hs2-handoff-btn]');
  await page.waitForTimeout(11500);
  assert.equal(await page.evaluate(() => window.uploads), 1, 'slow or uncertain AI request does not retry after ten seconds');
  await page.evaluate(() => document.querySelector('[data-hs2-handoff-btn]').click());
  assert.equal(await page.evaluate(() => window.uploads), 1, 'repeated click does not submit twice');
  assert.equal(await page.locator('[data-hs2-artwork-source]').isVisible(), false, 'placeholder never becomes a customer preview');
  await page.evaluate(() => {
    document.querySelector('.tee-field--photo').insertAdjacentHTML('beforeend', '<span>Choose another image</span>');
    document.querySelector('#artwork-layer--layer-747218 image').setAttribute('href', 'https://example.test/customer-sf.png');
    document.dispatchEvent(new Event('teeinblue-event-component-injected'));
  });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-hs2-artwork-source]').getAttribute('href'), 'https://example.test/customer-sf.png');
  assert.equal(await page.locator('[data-hs2-handoff]').isVisible(), false, 'saved image removes redundant request control');
  assert.match(await page.textContent('[data-hs2-artwork-status]'), /Check the saved image/);
  assert.equal(await page.locator('#teeAtcButton').isDisabled(), true, 'preview ordering is visibly disabled');
  await page.locator('#teeAtcButton').dispatchEvent('click');
  assert.equal(await page.evaluate(() => window.cartAdds), 0, 'unfinished artwork preview cannot enter cart');
  await page.reload();
  await page.waitForTimeout(1000);
  await page.evaluate(() => { window.__hs2api.usePhoto(new File(['synthetic fixture'], 'fixture.png', {type:'image/png'}), 123456); document.dispatchEvent(new Event('teeinblue-event-component-injected')); });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-hs2-handoff-btn]').isDisabled(), true, 'uncertain request survives reload');
  assert.equal(await page.evaluate(() => window.uploads), 0, 'reload never resends the photo');
  await page.click('[data-hs2-artwork-edit-city]');
  await page.fill('#layer-city', 'Boston');
  await page.click('[data-hs2-tib-edit]');
  assert.equal(await page.evaluate(() => window.uploads), 0, 'changing city never triggers a paid call');
  assert.match(await page.textContent('[data-hs2-artwork-status]'), /changed/);
  assert.equal(await page.locator('[data-hs2-artwork-source]').isVisible(), false, 'a changed city cannot reuse the prior preview link');
  await page.screenshot({ path: path.join(here, 'out/city-art-bridge.png') });
  assert.deepEqual(errors, []);
  console.log('PASS: optional city, exact single note, one-field editor, deliberate generation, no duplicate retries, stale city notice and draft cart block. Provider is a fixture.');
} finally { await browser.close(); await new Promise(r => server.close(r)); }
