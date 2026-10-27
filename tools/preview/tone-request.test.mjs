// Actual storefront copy-request behavior with a fake transport, no browser or provider calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { transformSync } from 'esbuild';

const source = fs.readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
const instrumented = source.replace('// for tools/preview tests', `window.__toneTest = {
  select: selectTone, update: function () { return compose(S.noteTone, true); },
  initial: function () { return compose(); }, status: toneStatus,
  typed: function () { return callAI('/fixture-typed', {step: 'spot'}, 5000); },
  configure: function (v) { cfg = v; }
}; // for tools/preview tests`);
const flush = () => new Promise(resolve => setImmediate(resolve));
const reply = (label = 'wait') => ({source: 'ai', recommended_gift: 'mug', reason: '', lines: {
  home: `I ${label} by the door for you.`, spot: 'I rest by your feet.',
  together: 'Our walks are the best part of my day.', meaning: 'You are my favorite person.'
}});

function fixture(code, {store = {}, storageFails = false} = {}) {
  const calls = [], timers = new Map();
  let timerId = 0, aborts = 0;
  class AbortController { signal = {}; abort() { aborts++; } }
  const window = {
    AbortController,
    matchMedia: () => ({matches: false}), crypto: {getRandomValues: a => a},
    sessionStorage: {
      getItem: key => store[key] ?? null,
      setItem: (key, value) => { if (storageFails) throw Error('storage unavailable'); store[key] = value; }
    },
    fetch: (url, options) => new Promise((resolve, reject) => {
      calls.push({url, body: JSON.parse(options.body), reject,
        respond: value => resolve({ok: true, json: async () => value})});
    })
  };
  const document = {readyState: 'complete', querySelector: () => null, querySelectorAll: () => [], addEventListener() {}};
  vm.runInNewContext(code, {window, document, URLSearchParams, console, AbortController,
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id)});
  const api = window.__toneTest, state = window.__hs3api.state();
  api.configure({ai: true, composeUrl: '/fixture-compose'});
  if (!state.dog) Object.assign(state, {dog: 'Pip', rec: 'Alex', home: 'door', follow: 'weekends',
    spot: 'feet', together: 'walk', meaning: 'best', screen: 'reveal'});
  return {api, state, calls, store, line: window.__hs3api.lineFor, aborts: () => aborts,
    timeout: () => { for (const [id, fn] of timers) { timers.delete(id); fn(); } }};
}

for (const [build, code] of [['source', instrumented], ['minified', transformSync(instrumented, {minify: true}).code]]) {
  test(`${build}: selecting or changing away/back sends nothing`, async () => {
    const f = fixture(code);
    f.api.select('sentimental'); f.api.select('hilarious'); f.api.select('warm');
    await flush(); assert.equal(f.calls.length, 0); assert.equal(f.state.calls, 0);
  });
  test(`${build}: explicit update deduplicates and persists before dispatch`, async () => {
    const f = fixture(code); f.api.select('hilarious');
    const p = f.api.update(); f.api.update();
    assert.equal(JSON.parse(f.store['hs3-gift']).composeRequest.status, 'pending');
    await flush(); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].body.note_tone, 'hilarious');
    f.calls[0].respond(reply()); await p;
    assert.equal(f.state.appliedTone, 'hilarious'); assert.equal(f.state.composeRequest, null);
    f.api.update(); await flush(); assert.equal(f.calls.length, 1);
  });
  test(`${build}: uncertain timeout survives reload and sends no retry`, async () => {
    const f = fixture(code); const p = f.api.update(); await flush(); f.timeout(); await p;
    assert.equal(f.state.composeRequest.status, 'uncertain'); f.api.update();
    const reloaded = fixture(code, {store: f.store}); reloaded.api.update(); await flush();
    assert.equal(f.calls.length, 1); assert.equal(reloaded.calls.length, 0);
    assert.match(reloaded.api.status(), /not been confirmed/);
  });
  test(`${build}: reload while pending pauses further dispatch`, async () => {
    const f = fixture(code); f.api.update(); await flush();
    const reloaded = fixture(code, {store: f.store}); reloaded.api.select('hilarious'); reloaded.api.update();
    await flush(); assert.equal(reloaded.state.composeRequest.status, 'uncertain'); assert.equal(reloaded.calls.length, 0);
  });
  test(`${build}: a late matching response settles without another request`, async () => {
    const f = fixture(code); f.api.select('sentimental'); const p = f.api.update(); await flush();
    f.timeout(); await p; f.calls[0].respond(reply()); await flush();
    assert.equal(f.state.appliedTone, 'sentimental'); assert.equal(f.state.composeRequest, null); assert.equal(f.calls.length, 1);
  });
  test(`${build}: late stale response is cached, not applied; exact return reuses it`, async () => {
    const f = fixture(code); f.api.select('sentimental'); const p = f.api.update(); await flush();
    f.api.select('hilarious'); f.timeout(); await p; f.calls[0].respond(reply()); await flush();
    assert.equal(f.state.composed, null); assert.equal(f.state.noteTone, 'hilarious');
    f.api.select('sentimental'); assert.equal(f.state.composed, null);
    await f.api.update(); assert.equal(f.state.appliedTone, 'sentimental'); assert.equal(f.calls.length, 1);
  });
  test(`${build}: manual edits before and during rewriting keep ownership`, async () => {
    const f = fixture(code); f.state.edits.home = 'My exact words.';
    const p = f.api.update(); await flush(); f.state.edits.spot = 'My newer edit.';
    f.calls[0].respond(reply()); await p;
    assert.equal(f.line('home'), 'My exact words.'); assert.equal(f.line('spot'), 'My newer edit.');
  });
  test(`${build}: changed answers cannot reuse an old tone-only cache`, async () => {
    const f = fixture(code); const p = f.api.update(); await flush(); f.calls[0].respond(reply()); await p;
    f.state.typed.spot = 'Does not sit by my feet'; f.state.spot = 'typed';
    const q = f.api.update(); await flush(); assert.equal(f.calls.length, 2);
    assert.equal(f.calls[1].body.answers.find(x => x.id === 'spot').typed, 'Does not sit by my feet');
    f.calls[1].respond(reply('sit')); await q;
  });
  test(`${build}: changed recipient while pending cannot receive the stale note`, async () => {
    const f = fixture(code); const p = f.api.update(); await flush(); f.state.rec = 'Taylor';
    f.calls[0].respond(reply()); await p; assert.equal(f.state.composed, null);
  });
  test(`${build}: transport rejection stays uncertain; invalid copy preserves prior note`, async () => {
    const f = fixture(code); const p = f.api.update(); await flush(); f.calls[0].reject(Error('lost response')); await p;
    assert.equal(f.state.composeRequest.status, 'uncertain'); f.api.update(); await flush(); assert.equal(f.calls.length, 1);
    const g = fixture(code); const q = g.api.update(); await flush(); g.calls[0].respond({lines: {home: 'I wait.'}, source: 'ai'}); await q;
    assert.equal(g.state.composed, null); assert.match(g.api.status(), /Could not rewrite/);
  });
  test(`${build}: unavailable storage or exhausted budget prevents dispatch`, async () => {
    const f = fixture(code, {storageFails: true}); f.api.update(); await flush(); assert.equal(f.calls.length, 0);
    const g = fixture(code); g.state.calls = 8; g.api.update(); await flush(); assert.equal(g.calls.length, 0);
  });
  test(`${build}: first note reuses identical completed context after reload`, async () => {
    const f = fixture(code); const p = f.api.initial(); await flush(); f.calls[0].respond(reply()); await p;
    const reloaded = fixture(code, {store: f.store}); reloaded.api.initial(); await flush();
    assert.equal(reloaded.calls.length, 0); assert.equal(reloaded.state.composed.lines.home, 'I wait by the door for you.');
  });
  test(`${build}: adjacent typed-answer timeout still aborts and ignores late output`, async () => {
    const f = fixture(code); const p = f.api.typed(); await flush(); f.timeout();
    assert.equal(await p, null); assert.equal(f.aborts(), 1);
    f.calls[0].respond({line: 'Late typed answer'}); await flush();
    assert.equal(f.state.composed, null); assert.equal(f.state.composeRequest, null); assert.equal(f.calls.length, 1);
  });
}
