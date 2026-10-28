// The CoWork prompt (docs/review/COWORK-LIVE-ACCEPTANCE.md) is run on Krish's computer against the
// live store, so a slip in it is a slip on production. This keeps its safety lines in place, the
// private list out of it, its hashes equal to the prompt spec, every file it names present, and
// its own words to the copy rules.
//
//   node --test tools/preview/cowork-prompt.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {RULES} from './copy-lint.mjs';
import {CORE} from './catalog.mjs';

const root = new URL('../../', import.meta.url);
const prompt = readFileSync(new URL('docs/review/COWORK-LIVE-ACCEPTANCE.md', root), 'utf8');
const spec = readFileSync(new URL('tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md', root), 'utf8');
const headings = prompt.split('\n').filter(l => /^#{2,3} /.test(l));
const section = title => { const i = prompt.indexOf(title); assert.notEqual(i, -1, title); const next = prompt.slice(i + title.length).search(/\n#{2,3} /); return prompt.slice(i, next === -1 ? undefined : i + title.length + next); };

test('payments come first, then the platforms, the release and the mock orders, in that order', () => {
  const at = t => headings.findIndex(h => h.startsWith(t));
  const order = ['## Part 0', '## Part 1', '## Part 2', '## Part 3', '## The report'].map(at);
  assert.ok(order.every(i => i !== -1), JSON.stringify(order));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('every step that changes a platform asks Krish first', () => {
  for (const h of ['### 1.1', '### 1.2', '### 1.3', '### 1.4', '### 1.5', '### 2.1', '### 2.3', '### 2.4', '### 2.5', '### 2.7', '### 3.2', '### 3.3']) {
    const line = headings.find(x => x.startsWith(h));
    assert.ok(line && line.includes('[approval'), `${h} is marked [approval]: ${line}`);
  }
  // Part 0's switch, the test-payment window and a Sync each carry their own marker
  assert.match(section('## Part 0'), /\*\*If Shopify Payments is off \[approval\]:\*\*/);
  assert.match(section('### 3.0'), /\*\*Open the test window \[approval\]\.\*\*/);
  assert.match(section('### 1.1'), /\*\*Sync \[approval\]\.\*\*/);
  assert.match(prompt, /A yes never carries to the next step\./);
});

test('the Teeinblue rule, the portrait campaign and the handle readback are spelled out', () => {
  assert.match(prompt, /Never press Update or Sync in Teeinblue without its own \[approval\]/);
  assert.match(prompt, /"Heartside City Screenprint - DRAFT 2026-10-23"/);
  for (const handle of ['your-dogs-illustrated-mug', 'your-dogs-portrait', 'your-dogs-personality-blanket']) assert.ok(prompt.includes('`' + handle + '`'), handle);
  assert.match(prompt, /handle-check\.mjs/);
});

test('the prompt hashes are the spec\'s, before and after', () => {
  const after = Object.fromEntries(['Mug', 'Portrait', 'Blanket'].map(f => [f.toLowerCase(), spec.match(new RegExp(`### ${f}[^#]*?SHA-256 \`([0-9a-f]{64})\``))[1]]));
  const before = Object.fromEntries([...spec.matchAll(/(mug|portrait|blanket) `([0-9a-f]{64})`/g)].map(m => [m[1], m[2]]));
  assert.equal(Object.keys(before).length, 3);
  const p11 = section('### 1.1');
  for (const k of ['mug', 'portrait', 'blanket']) {
    assert.ok(p11.includes(`${k} \`${after[k]}\``), `${k} after`);
    assert.ok(p11.includes(`${k} \`${before[k]}\``), `${k} before`);
  }
});

test('nothing from the private list is in it', () => {
  const hits = [
    [/myshopify\.com/i, 'the store handle'],
    [/n8n\.cloud|webhook\/[a-z0-9-]{8,}/i, 'an n8n address'],
    [/drive\.google\.com/i, 'the Drive link'],
    [/krish@|mindmake\.co\b/i, "Krish's personal email"],
    [/\b\d{9,}\b/, 'a long id (theme, media or product)'],
    [/#10\d\d\b/, 'an order number'],
    [/admin\.shopify\.com\/store/i, 'an admin URL'],
  ].filter(([re]) => re.test(prompt)).map(([, what]) => what);
  assert.deepEqual(hits, []);
  assert.match(prompt, /`hello@krishraja\.com`/);
});

test('every file it names is in the repository', () => {
  const files = ['NOW.md', 'docs/SCOPE.md', 'docs/evidence/2026-10-28-acceptance-fixes.md', 'docs/history/COWORK-PROMPT-2026-10-28.md',
    'tools/print-art/teeinblue/PROMPT-SPEC-2026-10-28.md', 'n8n/guard-typed.js', 'n8n/guard-compose.js', 'n8n/enforce-typed.js', 'n8n/enforce-compose.js', 'n8n/prompts.json',
    'design/checkout-tiles/README.md', 'design/checkout-tiles/artists-touch.png', 'tools/preview/handle-check.mjs', 'tools/preview/live-gate.mjs', 'tools/preview/preview-acceptance.mjs', 'tools/preview/catalog.mjs',
    'docs/review/mock-order-photos/reject-blurry.jpg', 'docs/review/mock-order-photos/reject-too-small.jpg', 'docs/review/mock-order-photos/large-camera-original.jpg', 'docs/review/mock-order-photos/close-up.jpg',
    'assets/photos/golden-puppy-asleep.jpg', 'assets/photos/pug-autumn-leaves.jpg', 'assets/photos/red-poodle-head-tilt.jpg', 'assets/photos/apricot-poodle-puppy.jpg', 'assets/photos/maltipoo-on-deck.jpg'];
  for (const f of files) {
    assert.ok(existsSync(new URL(f, root)), f);
    assert.ok(prompt.includes(f.split('/').pop()), `the prompt names ${f}`);
  }
  for (const m of prompt.matchAll(/\]\((\.\.\/[^)#]+)\)/g)) assert.ok(existsSync(new URL(m[1], new URL('docs/review/', root))), m[1]);
});

// Review of PR #65: the tiles were set to go on in Part 1, while only the theme pushed in Part 2
// hides them from the product pages, and the handle check had no --warn-media before them, so
// every Teeinblue readback in Part 1 printed FAIL on pictures that are fixed later
test('the checkout tiles go on right after the live push, and the handle check only warns on pictures before them', () => {
  const at = t => headings.findIndex(h => h.startsWith(t));
  assert.ok(at('### 2.4 Push live') !== -1 && at('### 2.4 Push live') < at('### 2.5 Checkout tiles') && at('### 2.5 Checkout tiles') < at('### 2.6 The gates on production'));
  assert.deepEqual(headings.filter(h => /^### 1\./.test(h) && /tile/i.test(h)), []);
  assert.match(prompt.slice(prompt.indexOf('**The Teeinblue rule.**'), prompt.indexOf('## Part 0')), /handle-check\.mjs --warn-media/);
  assert.match(section('### 2.2'), /handle-check\.mjs --theme <copy id> --warn-media/);
  assert.match(section('### 2.6'), /without `--theme`, `--query` or `--warn-media`/);
});

// a real photo must add on all three phone browsers before the live push: Safari encodes its own
// JPEGs, and "the page says why" would have let a Safari-wide refusal through
test('the live push waits for a real photo to add on Android Edge, Android Chrome and iPhone Safari', () => {
  const p24 = section('### 2.4');
  for (const b of ['Android in Edge', 'Android in Chrome', 'iPhone in Safari']) assert.ok(p24.includes(b), b);
  assert.match(section('### 2.3'), /a refusal here is a defect even when the page says why/);
});

// order 4 follows the order the chat queues the gifts in (hs3.js GIFTS), and its bundle sums are
// the catalog's prices less 15% for two gifts and 20% for three
test('order 4 makes the gifts in the app\'s order, and its bundle checkpoints add up', () => {
  const hs3 = readFileSync(new URL('shopify/assets/hs3.js', root), 'utf8');
  const gifts = JSON.parse(hs3.match(/var GIFTS = (\[[^\]]*\]);/)[1].replace(/'/g, '"')).filter(g => g !== 'ornament');
  const name = {mug: 'the mug (red inside)', blanket: 'the blanket', print: 'the portrait'};
  const o4 = prompt.slice(prompt.indexOf('**Order 4:'), prompt.indexOf('**Order 5:'));
  assert.ok(o4.includes(gifts.map(g => name[g]).join(', then ')), gifts.join(' > '));
  const min = Object.fromEntries(CORE.map(c => [c.chat, c.min]));
  const usd = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');
  const two = min[gifts[0]] + min[gifts[1]], three = two + min[gifts[2]];
  assert.ok(o4.includes(`${usd(two)}, less ${usd(two * 0.15)}, so ${usd(two * 0.85)}`), `two gifts: ${usd(two)} less 15%`);
  assert.ok(o4.includes(`${usd(three)}, less ${usd(three * 0.2)}, so ${usd(three * 0.8)}`), `three gifts: ${usd(three)} less 20%`);
});

// the portrait's name field holds 14, and direct-visit typing is left alone, so order 2's dog
// must fit in 14 for its apostrophe check to mean anything
test('order 2\'s dog fits the 14-letter signature and carries an apostrophe', () => {
  const row = prompt.split('\n').find(l => l.startsWith('| 2 |'));
  const dog = row.split('|')[4].trim().split(',')[0];
  assert.ok(dog.length <= 14 && dog.includes("'"), dog);
});

test('the photo test and the painting cap are in it', () => {
  assert.match(prompt, /\?hsdebug=photo/);
  assert.match(prompt, /Paint up to 14 times across Parts 2 and 3/);
  assert.match(prompt, /A refused photo \(blurry, too small, HEIC\) never paints/);
});

test('its own words keep the copy rules: no em dashes, US spelling, and "!" only inside a quoted test input', () => {
  for (const rule of RULES.filter(r => ['em-dash', 'us-spelling'].includes(r.id))) assert.deepEqual(prompt.match(new RegExp(rule.re.source, 'gi')) || [], [], rule.id);
  const unquoted = prompt.replace(/`[^`]*`/g, '').replace(/"[^"\n]*"/g, '');
  assert.deepEqual(unquoted.match(/![^[(]/g) || [], [], 'an exclamation mark outside a quoted input');
});
