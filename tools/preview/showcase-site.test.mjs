// The breed example artwork on the store (Krish, 30 Oct: bring the approved examples in; remove the
// pug gallery). Every picture comes from an approved ledger entry, is labeled Example, carries its
// manifest's words and size, and the retired pug pictures are gone from the theme.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const site = JSON.parse(read('design/examples-2026-10-30-showcase/site.json'));
const showcase = read('shopify/sections/hs-showcase.liquid');
const journey = read('shopify/sections/hs-journey.liquid');
const chat = read('shopify/sections/hs3-chat.liquid');
const byId = Object.fromEntries(site.images.map(i => [i.id, i]));

test('every picture records the approved file it came from', () => {
  assert.equal(site.images.length, 24); // 30 Oct audit: the moods row is four paintings of Maple; 3 Nov: the six sets moved to design/examples-2026-11-03-real-mug-sets (real mug)
  for (const img of site.images) {
    assert.match(img.source_sha256, /^[a-f0-9]{64}$/, img.id);
    assert.match(img.output_sha256, /^[a-f0-9]{64}$/, img.id);
    assert.match(img.approval, /^(job .+ approved Krish, 2026-10-30|bundle \w+ approved Krish, 2026-10-30)$/, img.id);
    assert.ok(existsSync(new URL('shopify/assets/hs-ex-' + img.id + '.webp', root)), img.id);
    assert.ok(img.bytes <= 90000, img.id + ' is light enough for a phone');
  }
});

test('the showcase shows each picture with its manifest alt and size, labeled Example', () => {
  // 3 Nov: the six sets are the first screen's hero, in the journey section; the rest stay in the showcase
  const tags = [...(showcase + journey).matchAll(/render 'hs-showcase-fig', id: '([a-z-]+)', w: (\d+), h: (\d+), alt: '([^']*)'/g)];
  assert.ok(tags.length >= 21, 'every picture is placed');
  for (const [, id, w, h, alt] of tags) {
    const img = byId[id];
    assert.ok(img, id + ' is in the manifest');
    assert.deepEqual([Number(w), Number(h)], img.size, id + ' size');
    assert.ok(alt.startsWith('Example') || alt.startsWith('Reference photo'), id + ' alt says what it is');
  }
  const fig = read('shopify/snippets/hs-showcase-fig.liquid');
  assert.match(fig, /<span class="hss-tag">Example<\/span>/);
});

test('the six journey style cards and the first-screen picture use the approved set', () => {
  for (const id of ['painterly', 'cinematic', 'comic', 'screenprint', 'ink', 'collage']) {
    assert.ok(journey.includes(`"${id}": {{ 'hs-ex-style-${id}.webp'`), id + ' style card');
  }
  assert.match(journey, /hs-ex-hero-mug\.webp/);
});

test('the pug gallery is gone from the theme', () => {
  assert.deepEqual(readdirSync(new URL('shopify/assets/', root)).filter(f => f.startsWith('hs-example-')), []);
  for (const [name, text] of [['showcase', showcase], ['journey', journey], ['chat', chat]]) {
    assert.ok(!/hs-example-|\bpug\b/i.test(text), name + ' mentions no pug');
  }
});

test('the homepage places the showcase after the journey, then the reviews (10 Nov), and the steps hide them', () => {
  const index = JSON.parse(read('shopify/templates/index.json'));
  assert.deepEqual(index.order, ['gift', 'showcase', 'reviews']);
  assert.match(read('shopify/assets/hs-reviews.css'), /html\.hsj-routed \.hsr[^{]*\{ display: none; \}/);
  assert.equal(index.sections.showcase.type, 'hs-showcase');
  assert.match(read('shopify/assets/hs-showcase.css'), /html\.hsj-routed \.hss[^{]*\{ display: none; \}/);
});

test('the showcase shows one set at a time and one drifting row, not a wall of tiles (31 Oct)', () => {
  // Krish, 31 Oct: "it looks so intense to just have all the pictures visible at once"
  // Krish, 3 Nov: the sets carousel replaces the first screen's example, so the reel lives in the hook
  assert.match(journey, /data-hss-reel>/);
  assert.doesNotMatch(showcase, /data-hss-reel>/, 'the reel shows once');
  // Krish, 3 Nov: on desktop the photo-to-gift slider sits in the carousel's section
  assert.match(journey, /data-hss-flow>/);
  assert.doesNotMatch(showcase, /data-hss-flow>/, 'the slider shows once');
  assert.match(showcase, /data-hss-strip-track>/);
  assert.doesNotMatch(showcase, /hss-row--(six|three|four)|data-hss-tabs/, 'the three grids and the gift tabs are gone');
  const strip = showcase.slice(showcase.indexOf('data-hss-strip-track'), showcase.indexOf('</ul>', showcase.indexOf('data-hss-strip-track')));
  assert.equal((strip.match(/render 'hs-showcase-fig'/g) || []).length, 19, 'six styles, nine gift photos and four moods');
  assert.equal((showcase.match(/data-hss-pause/g) || []).length, 1, 'the strip has a pause button');
  assert.equal((journey.match(/data-hss-pause/g) || []).length, 1, 'the reel has a pause button');
  const js = read('shopify/assets/hs-showcase.js');
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /visibilitychange/);
});

test('the carousel shows the six real-mug sets at 540 and 1080 wide (Krish, 3 Nov)', () => {
  const hero = JSON.parse(read('design/examples-2026-11-03-real-mug-sets/site.json'));
  assert.deepEqual(hero.sets.map((s) => s.dog), ['golden', 'lab', 'frenchie', 'doodle', 'dachshund', 'shepherd']);
  for (const s of hero.sets) {
    assert.match(journey, new RegExp(`render 'hs-showcase-fig', hero: '${s.dog}'`), s.dog + ' in the hook');
    assert.match(s.approval, /^Krish, 2026-11-03/);
  }
  assert.doesNotMatch(journey + chat, /hs-ex-set-/, 'the AI-mug sets are gone');
  assert.match(read('shopify/snippets/hs-showcase-fig.liquid'), /srcset="\{\{ hs_540 \}\} 540w, \{\{ hs_1080 \}\} 1080w"/);
  // the files themselves (sizes, hashes, byte caps) are checked by `python3 tools/print-art/hero-sets.py --check`,
  // which runs in the python job of .github/workflows/offline-tests.yml
  for (const s of hero.sets) for (const w of [540, 1080]) assert.ok(existsSync(new URL(`shopify/assets/hs-hero-${s.dog}-${w}.webp`, root)), `${s.dog} ${w}`);
});

// 5 Nov judges (every buyer): the steps say Warm and Roast, and the home page's examples said "Warm with a wink" and
// "Over the top" (Krish, 4 Nov: Over the top is Roast). One name for each tone wherever a buyer reads it.
test('the home page names the tones as the steps do', () => {
  const captions = [...showcase.matchAll(/id: 'tone-[a-z-]+'[^%]*caption: '([^']*)'/g)].map(m => m[1]);
  assert.ok(captions.length >= 2, 'tone examples found');
  for (const c of captions) assert.ok(['Sentimental', 'Warm', 'Hilarious', 'Roast'].includes(c), c);
  assert.doesNotMatch(showcase, /Over the top|Warm with a wink/);
});
