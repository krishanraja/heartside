// One simulated buyer on the photo-first journey, on the live store (or a draft theme's preview with PREVIEW set),
// through Teeinblue's real painter, to the checkout page and never past it: nothing is typed there, nothing is paid.
// Each painting costs Teeinblue credit (about /bin/bash.13), so each persona carries its own paint cap, and the weekly run
// (.github/workflows/real-buyer.yml, approved by Krish on 6 Nov at about .30 a week) runs a fixed set under ten.
// Usage: node tools/preview/real-buyer.cjs <persona-id>   -> out/real-buyer/<id>/NN-*.png and run.json
// The photos are the repo's own dogs and copies made from them (fixtures/real-buyer/photos); never a buyer's.
const fs = require('fs'), path = require('path');
const {chromium, devices} = require('playwright');
const HERE = path.join(__dirname, 'fixtures', 'real-buyer'), P = JSON.parse(fs.readFileSync(path.join(HERE, 'personas.json'), 'utf8'))[process.argv[2]];
if (!P) { console.error('no persona ' + process.argv[2]); process.exit(2); }
const PREVIEW = process.env.PREVIEW || '';
const OUT = path.join(__dirname, 'out', 'real-buyer', P.id); fs.rmSync(OUT, {recursive: true, force: true}); fs.mkdirSync(OUT, {recursive: true});
const BASE = process.env.HS_STORE_URL || 'https://heartside.io';
const R = {id: P.id, persona: P, screens: [], events: [], paints: [], colourChoices: 0, colourRowsOnGiftPages: 0, questionsAsked: {}, shifts: [], delivery: [], cart: null, checkout: null, errors: [], outcome: 'unfinished', waits: []};
let n = 0, page, ctx, browser, T0;
const now = () => Date.now() - T0;
const ev = (kind, msg) => { R.events.push({t: now(), kind, msg}); console.log(`[${P.id} ${(now() / 1000).toFixed(0)}s] ${kind}: ${msg}`); };
const save = () => fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(R, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = u => String(u).replace(BASE, '').replace(/variant=\d+/, 'variant=…').replace(/preview_theme_id=\d+/, 'preview').replace(/&?pb=0/, '');
const DELIVERY = /(deliver|arriv|christmas|business days|order by|dec(ember)? \d|shipping)/i;

async function shot(name, note) {
  n++;
  const file = String(n).padStart(2, '0') + '-' + name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.png';
  await sleep(320); // past the step's fade
  try { await page.screenshot({path: path.join(OUT, file)}); } catch (e) { ev('error', 'screenshot ' + e.message.split('\n')[0]); return; }
  let text = '';
  try { text = (await page.evaluate(() => document.body.innerText)).replace(/\s+\n/g, '\n').slice(0, 2000); } catch (e) { /* navigating */ }
  R.screens.push({n, t: now(), file, name, url: clean(page.url()), note: note || '', text});
  const hits = (text.match(new RegExp('[^\\n]*' + DELIVERY.source + '[^\\n]*', 'gi')) || []).slice(0, 6);
  if (hits.length) R.delivery.push({screen: file, lines: hits});
  save();
}
const SHIFT_JS = `(() => { window.__hsShift = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) {
  window.__hsShift.push({t: Math.round(e.startTime), v: +e.value.toFixed(4), input: e.hadRecentInput, src: (e.sources || []).slice(0, 3).map(s => s.node ? (s.node.className && String(s.node.className).slice(0, 60)) || s.node.nodeName : '?') }); } })
  .observe({type: 'layout-shift', buffered: true}); } catch (e) {} })();`;
async function shifts(label) {
  try {
    const s = await page.evaluate(() => (window.__hsShift || []).filter(x => !x.input));
    R.shifts.push({at: label, url: clean(page.url()), total: +s.reduce((a, x) => a + x.v, 0).toFixed(4), count: s.length, worst: s.sort((a, b) => b.v - a.v).slice(0, 4)});
    save();
  } catch (e) { /* navigated */ }
}
const step = () => { try { return new URL(page.url()).searchParams.get('step') || ''; } catch (e) { return ''; } };
const ask = () => { try { const m = /ask=([a-z]+)/.exec(new URL(page.url()).hash); return m ? m[1] : ''; } catch (e) { return ''; } };
const phase = () => page.evaluate(() => { const j = document.querySelector('[data-hs-jm]'); return j && !j.hidden ? j.getAttribute('data-phase') || '' : ''; }).catch(() => '');
async function tap(sel) {
  const el = page.locator(sel).first();
  await el.waitFor({state: 'visible', timeout: 15000});
  if (P.doubleTap) await el.dblclick().catch(() => el.click()); else await el.click();
}

// ---------------------------------------------------------------- the home page: photo, style, gifts
async function photoStep() {
  await page.waitForSelector('[data-hsj-screen="photo"]', {timeout: 20000});
  await shot('home-photo');
  for (const f of P.photos) {
    const file = path.join(HERE, 'photos', f), t = Date.now();
    await page.setInputFiles('[data-hsj-file]', file);
    ev('upload', f + ' (' + Math.round(fs.statSync(file).size / 1024) + ' KB)');
    const res = await Promise.race([
      page.waitForURL(u => /step=look/.test(String(u)), {timeout: 90000}).then(() => 'accepted').catch(() => 'timeout'),
      page.waitForFunction(() => { const n = document.querySelector('[data-hsj-photo-note]'); return n && n.textContent.trim().length > 8; }, null, {timeout: 90000}).then(() => 'refused').catch(() => 'timeout')
    ]);
    ev('photo', f + ': ' + res + ' after ' + ((Date.now() - t) / 1000).toFixed(1) + ' s' + (res === 'refused' ? ' ("' + (await page.textContent('[data-hsj-photo-note]').catch(() => '')).trim() + '")' : ''));
    if (res === 'accepted') return true;
    await shot('photo-' + res + '-' + f.replace(/\.\w+$/, ''));
    if (res === 'refused' && P.override === f && await page.locator('[data-hsj-override]').isVisible().catch(() => false)) {
      await tap('[data-hsj-override]');
      if (await page.waitForURL(u => /step=look/.test(String(u)), {timeout: 30000}).then(() => true).catch(() => false)) return true;
    }
  }
  return false;
}
async function lookStep() {
  await page.waitForSelector('[data-hsj-screen="look"]');
  await shot('home-look');
  await tap(`[data-hsj-style="${P.style}"]`);
  await shot('home-look-picked');
  await tap('[data-hsj-next]');
  // the tone, before the painting
  await page.waitForSelector('[data-hsj-screen="tone"]', {timeout: 15000});
  await shot('home-tone');
  if (P.tone) await tap(`[data-hsj-feel="${P.tone}"]`);
  await shot('home-tone-picked');
  await tap('[data-hsj-next]');
  // where the dog rules the house (since 5 Nov): one tap answers it and moves on
  if (await page.waitForSelector('[data-hsj-screen="spot"]', {timeout: 15000}).then(() => true).catch(() => false)) {
    await shot('home-spot');
    const rows = page.locator('[data-hsj-pick="spot"]');
    await rows.nth(Math.min((await rows.count()) - 1, (P.answers && P.answers.spot) || 0)).click();
    if (await page.waitForSelector('[data-hsj-screen="gifts"]', {timeout: 8000}).then(() => false).catch(() => true)) await tap('[data-hsj-next]');
  }
}
async function giftsStep() {
  await page.waitForSelector('[data-hsj-screen="gifts"]');
  await shot('home-gifts');
  await shifts('home-gifts');
  for (const g of P.gifts) {
    await page.locator(`[data-hsj-gift="${g}"]`).scrollIntoViewIfNeeded();
    await tap(`[data-hsj-gift="${g}"]`);
    await sleep(300);
    if (g === 'mug' && P.mugColor) { await page.locator(`[data-hsj-gift-card="mug"] [aria-label="${P.mugColor}"]`).click(); R.colourChoices++; }
    if (g === 'print' && P.frame) { await page.locator('[data-hsj-gift-card="print"] [data-hsj-variant]', {hasText: P.frame}).click(); R.colourChoices++; }
    await sleep(300);
    await shot('home-gifts-' + g);
  }
  const offer = await page.textContent('[data-hsj-offer]').catch(() => '');
  ev('offer', offer.trim());
  await shot('home-gifts-ready');
  await tap('[data-hsj-start]');
}

// ---------------------------------------------------------------- the gift pages
const A = () => P.answers || {};
async function answerQuestions() {
  for (let guard = 0; guard < 20; guard++) {
    const s = ask();
    if (!s) return;
    R.questionsAsked[s] = (R.questionsAsked[s] || 0) + 1;
    await page.waitForSelector(`[data-hsj-screen="${s}"]`, {timeout: 15000});
    if (R.questionsAsked[s] === 1) await shot('ask-' + s);
    if (s === 'name') {
      await page.fill('[data-hsj-name]', P.dog); await sleep(300);
      if (await page.isDisabled('[data-hsj-next]').catch(() => false)) {
        const say = (await page.textContent('[data-hsj-screen="name"]').catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
        ev('edge', 'the long name is refused: ' + say); await shot('ask-name-refused');
        await page.fill('[data-hsj-name]', P.nick || P.dog.split(/\s+/)[1] || P.dog.slice(0, 10)); await sleep(300);
      }
      await tap('[data-hsj-next]');
    }
    else if (s === 'breed') {
      if (P.breedOther) {
        await tap('[data-hsj-pick="breed"][data-v="__other"]');
        await page.fill('[data-hsj-breed-search]', P.breedOther).catch(() => {});
        await sleep(900);
        const first = page.locator('[data-hsj-breed-list] button').first();
        if (await first.count()) await first.click(); else ev('confusing', 'typed breed "' + P.breedOther + '" found no suggestion');
        await sleep(300);
        if (ask() === 'breed') await tap('[data-hsj-next]');
      } else await tap(`[data-hsj-pick="breed"][data-v="${P.breed}"]`);
    } else if (s === 'pro') await tap(`[data-hsj-pick="pro"][data-v="${P.pro || 'he'}"]`);
    else if (s === 'person') {
      if (P.person === 'self') await tap('[data-hsj-pick="self"]'); else { await page.fill('[data-hsj-person]', P.person); await sleep(200); await tap('[data-hsj-next]'); }
    } else if (s === 'words') {
      if (P.tone) await tap(`[data-hsj-tone="${P.tone}"]`);
      const t = Date.now();
      await page.waitForFunction(() => { const b = document.querySelector('[data-hsj-note]'); return b && !b.classList.contains('is-busy') && b.querySelector('.hsj-letter'); }, null, {timeout: 60000}).catch(() => ev('slow', 'the note still writing after 60 s'));
      R.waits.push({what: 'note', s: +((Date.now() - t) / 1000).toFixed(1)});
      await shot('ask-words-written');
      await tap('[data-hsj-next]');
      return;
    } else {
      const rows = page.locator(`[data-hsj-pick="${s}"]`), count = await rows.count();
      const idx = Math.min(count - 1, A()[s] || 0);
      if (P.doubleTap) await rows.nth(idx).dblclick().catch(() => rows.nth(idx).click()); else await rows.nth(idx).click();
    }
    await sleep(700);
  }
}
async function giftPage(i) {
  const label = (page.url().match(/products\/([^?#]+)/) || [, 'gift'])[1].replace(/your-dogs-/, '').slice(0, 22);
  ev('nav', 'gift page ' + (i + 1) + ': ' + clean(page.url()));
  const t0 = Date.now();
  await page.waitForSelector('[data-hs-jm]:not([hidden])', {timeout: 30000}).catch(() => ev('broken', 'the journey panel never showed on ' + label));
  await shot('gift-' + label + '-open');
  let seenAsk = false, lastShot = 0, revealedAt = 0, studioSeen = 0, painted = false, reloaded = false, wentBack = false;
  while (Date.now() - t0 < 8 * 60000) {
    const ph = await phase();
    const el = (Date.now() - t0) / 1000;
    if (ph === 'studio' && !studioSeen) { studioSeen = el; R.paints.push({t: now(), page: label}); ev('paint', '#' + R.paints.length + ' (' + label + ')'); await shot('gift-' + label + '-studio'); }
    if (ph === 'stopped') { ev('edge', 'the painting stopped after the reload; taps Paint it again'); await shot('gift-' + label + '-stopped'); R.paints.push({t: now(), page: label + ' (after reload)'}); await tap('[data-hs-jm-add]'); await sleep(2000); continue; }
    if (ph === 'nophoto') { ev('broken', 'the photo did not carry over to ' + label); await shot('gift-' + label + '-nophoto'); R.outcome = 'photo lost on gift page'; return false; }
    if (P.reloadMidPaint && !reloaded && el > 20 && ph !== 'reveal') { reloaded = true; ev('edge', 'reloads mid-paint'); await page.reload(); await sleep(3000); await shot('gift-' + label + '-after-reload'); continue; }
    if (P.backMidPaint && !wentBack && el > 40 && ph !== 'reveal') { wentBack = true; ev('edge', 'presses back, then forward'); await page.goBack({waitUntil: 'commit'}).catch(() => {}); await sleep(2500); await shot('gift-' + label + '-after-back'); await page.goForward({waitUntil: 'commit'}).catch(() => {}); await sleep(3000); await shot('gift-' + label + '-after-forward'); continue; }
    if (ask()) { if (!seenAsk) { seenAsk = true; ev('ask', 'the questions start ' + el.toFixed(0) + ' s after the page opened'); } await answerQuestions(); await shifts('questions-' + label); continue; }
    if (ph === 'reveal') { revealedAt = el; break; }
    if (el - lastShot > 40 && el > 8) { lastShot = el; await shot('gift-' + label + '-' + ph + '-' + Math.round(el) + 's'); }
    await sleep(1500);
  }
  R.waits.push({what: 'painting ' + label, s: Math.round(revealedAt || (Date.now() - t0) / 1000), revealed: !!revealedAt});
  await shifts('painting-' + label);
  if (!revealedAt) { ev('broken', label + ': no reveal in 8 minutes'); await shot('gift-' + label + '-never'); R.outcome = 'painting never revealed'; return false; }
  ev('reveal', label + ' revealed ' + revealedAt.toFixed(0) + ' s after the page opened');
  R.colourRowsOnGiftPages += await page.evaluate(() => [...document.querySelectorAll('.tee-option, [data-hsj-variant], .hs-jm-dot')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !e.closest('#buy > :not(.hs-jm)'); }).length).catch(() => 0);
  await shot('gift-' + label + '-reveal');
  const gallery = await page.evaluate(() => { const g = document.querySelector('[data-hs-jm-gallery] [data-hs2-tib-gallery]'); return {moved: !!g, slides: g ? g.querySelectorAll('.tee-slide').length : 0}; }).catch(() => ({}));
  ev('gallery', JSON.stringify(gallery));
  if (await page.locator('[data-hs-jm-view="close"]').isVisible().catch(() => false)) { await tap('[data-hs-jm-view="close"]'); await shot('gift-' + label + '-closeup'); if (await page.locator('[data-hs-jm-view="product"]').isVisible().catch(() => false)) await tap('[data-hs-jm-view="product"]'); }
  if (P.repaint && !R.repainted && await page.evaluate(() => document.querySelector('[data-hs-jm-repaint]').style.visibility !== 'hidden').catch(() => false)) {
    R.repainted = true;
    await tap('[data-hs-jm-repaint]'); await shot('gift-' + label + '-repaint-sheet');
    await tap('[data-hs-jm-again]'); ev('edge', 'asks for the free repaint');
    R.paints.push({t: now(), page: label + ' (repaint)'});
    const t = Date.now();
    await page.waitForSelector('[data-hs-jm][data-phase="reveal"]', {timeout: 8 * 60000}).catch(() => ev('broken', 'the repaint never came back'));
    R.waits.push({what: 'repaint ' + label, s: Math.round((Date.now() - t) / 1000)});
    await shot('gift-' + label + '-repainted');
  }
  // Ian taps Add before ticking
  if (P.addNow) { const off = await page.isDisabled('[data-hs-jm-add]'); ev('edge', 'taps Add before the tick: ' + (off ? 'the button is off' : 'it adds')); }
  await page.check('[data-hs-jm-tick]').catch(e => ev('stuck', 'the tick: ' + e.message.split('\n')[0]));
  await sleep(500);
  const btn = (await page.textContent('[data-hs-jm-add]').catch(() => '')).trim();
  ev('button', 'the button says "' + btn + '"');
  const before = page.url();
  await tap('[data-hs-jm-add]').catch(e => ev('stuck', 'add: ' + e.message.split('\n')[0]));
  await shot('gift-' + label + '-adding');
  const t = Date.now();
  await page.waitForURL(u => String(u) !== before && !/#ask/.test(String(u)), {timeout: 90000}).catch(() => ev('stuck', 'stayed on ' + label + ' after Add'));
  R.waits.push({what: 'add ' + label, s: +((Date.now() - t) / 1000).toFixed(1)});
  return true;
}

async function cartAndCheckout() {
  if (!/\/cart/.test(page.url())) await page.waitForURL(u => /\/cart/.test(String(u)), {timeout: 60000}).catch(() => {});
  if (!/\/cart/.test(page.url())) { ev('stuck', 'never reached the cart; at ' + clean(page.url())); await shot('not-cart'); return; }
  await sleep(2500);
  await shot('cart');
  await shifts('cart');
  R.cart = await page.evaluate(() => fetch('/cart.js').then(r => r.json()).then(c => ({items: c.items.map(i => ({title: i.product_title, variant: i.variant_title, qty: i.quantity, price: i.final_line_price / 100, props: Object.keys(i.properties || {}).filter(k => /line|signed|hs_/i.test(k)).map(k => k + '=' + String(i.properties[k]).slice(0, 60))})), total: c.total_price / 100, discounts: (c.cart_level_discount_applications || []).map(d => d.title)}))).catch(e => ({error: String(e)}));
  ev('cart', JSON.stringify(R.cart).slice(0, 600));
  const co = page.locator('[name="checkout"], button:has-text("Check out"), a:has-text("Check out")').first();
  if (await co.count()) {
    const t = Date.now();
    await co.click().catch(() => {});
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await sleep(6000);
    R.checkout = {seconds: +((Date.now() - t) / 1000).toFixed(1), url: /checkouts?\//.test(page.url()) ? '/checkouts/…' : clean(page.url())};
    await shot('checkout');
    ev('checkout', 'reached checkout; nothing typed, nothing paid');
  } else ev('missing', 'no checkout button on the cart');
  R.outcome = 'reached checkout (stopped before payment)';
}

(async () => {
  browser = await chromium.launch();
  const dev = P.device === 'desktop' ? {viewport: {width: 1280, height: 800}} : {...devices[P.device]};
  delete dev.defaultBrowserType;
  ctx = await browser.newContext({...dev, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'America/Chicago'});
  // the agent proxy adds the n8n API key to every request to that host, and n8n keeps webhook headers in its
  // execution log (5 Nov): test browsers never call n8n; the note writer is tested inside n8n instead
  await ctx.route(/\.app\.n8n\.cloud\//, r => r.abort());
  await ctx.addInitScript(SHIFT_JS);
  page = await ctx.newPage();
  if (P.slow) { const cdp = await ctx.newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 300, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8}); }
  page.on('pageerror', e => R.errors.push({t: now(), msg: e.message.slice(0, 300), stack: String(e.stack || '').split('\n').slice(1, 4).map(x => x.trim().replace(/\?token=[^ )]*/g, '')).join(' | ').slice(0, 400)}));
  T0 = Date.now(); R.started = new Date().toISOString();
  try {
    await page.goto(BASE + '/' + (PREVIEW ? '?preview_theme_id=' + PREVIEW + '&pb=0' : ''), {waitUntil: 'domcontentloaded'});
    await sleep(3500);
    await shot('home');
    if (P.shippingFirst) { await page.goto(BASE + '/policies/shipping-policy', {waitUntil: 'domcontentloaded'}); await sleep(2000); await shot('shipping-policy'); await page.goBack({waitUntil: 'domcontentloaded', timeout: 60000}); await sleep(2500); }
    await page.locator('[data-hsj-go]').first().click({timeout: 15000});
    if (!(await photoStep())) { R.outcome = 'gave up: no photo accepted'; throw new Error('stop'); }
    await lookStep();
    await giftsStep();
    await page.waitForURL(u => /\/products\//.test(String(u)), {timeout: 60000, waitUntil: 'commit'});
    for (let i = 0; i < P.gifts.length; i++) {
      if (!/\/products\//.test(page.url())) break;
      if (R.paints.length >= (P.paintCap || 2) + (P.repaint ? 1 : 0) + 1) { ev('cap', 'stops before painting more'); R.outcome = 'stopped at paint cap'; throw new Error('stop'); }
      if (!(await giftPage(i))) throw new Error('stop');
    }
    await cartAndCheckout();
  } catch (e) {
    if (e.message !== 'stop') { R.errors.push({t: now(), msg: 'harness: ' + String(e && e.message || e).slice(0, 400)}); await shot('harness-error').catch(() => {}); }
  }
  R.totalSeconds = Math.round(now() / 1000);
  save();
  console.log(`[${P.id}] done: ${R.outcome}; ${R.paints.length} paints; ${R.colourChoices} colour choices; questions ${JSON.stringify(R.questionsAsked)}; ${R.totalSeconds}s`);
  await browser.close();
})();
