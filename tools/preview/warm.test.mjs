// The code runner warm-up (29 Oct, tools/perf): n8n's runner stops after ~15-40 s idle and a cold one
// adds ~1.4 s, so the page warms while the buyer is busy, at most every 12 s and 15 times per workflow,
// and keeps warm for a minute after a note is shown, only on the reveal and only while visible.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('  var warmed = {}'), source.indexOf("  // the buyer's own words, cut only where"));
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: warm pings are throttled, capped and kept only while useful`, () => {
  let now = 1e6; const sent = [], timers = [];
  const ctx = {cfg: {ai: true}, S: {screen: 'reveal'}, document: {visibilityState: 'visible'}, Date: {now: () => now},
    setTimeout: (f) => { timers.push(f); return timers.length; }, clearTimeout: () => { timers.length = 0; },
    window: {fetch: (url, o) => { sent.push([url, o.body]); return {catch() {}}; }}};
  vm.runInNewContext((minified ? transformSync(block, {minify: true}).code : block) + ';this.warm=warm;this.keepWarm=keepWarm;', ctx);
  ctx.warm('t'); ctx.warm('t'); now += 11999; ctx.warm('t');
  assert.equal(sent.length, 1, 'one ping per 12 s'); assert.equal(sent[0][1], '{"warm":true}');
  now += 1; ctx.warm('t'); assert.equal(sent.length, 2);
  for (let i = 0; i < 40; i++) { now += 12000; ctx.warm('t'); }
  assert.equal(sent.filter(s => s[0] === 't').length, 15, 'capped at 15 per workflow on a page');
  ctx.warm('c'); assert.equal(sent.at(-1)[0], 'c', 'each workflow has its own budget');
  // after a note: four more pings, 12 s apart, then nothing
  const before = sent.length; ctx.keepWarm('c', 4);
  for (let i = 0; i < 6 && timers.length; i++) { now += 12000; timers.shift()(); }
  assert.equal(sent.length - before, 4);
  // leaving the reveal, or a hidden tab, stops it
  ctx.keepWarm('c2', 4); ctx.S.screen = 'chat'; now += 12000; timers.shift()();
  assert.equal(sent.filter(s => s[0] === 'c2').length, 0); assert.equal(timers.length, 0);
});
