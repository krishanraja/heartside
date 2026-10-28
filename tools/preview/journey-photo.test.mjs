// The journey card's photo button (hs2.js journeyCard, openPhotoPicker). On Krish's Android phone
// (28 Oct) "Add Mochi's photo" only scrolled a long way down and needed a second tap. One tap now
// opens the phone's picker: Teeinblue's file input gets click() inside the tap, with no scroll.
// Before Teeinblue draws its field the button goes there without a long animation and says the
// step is loading; with the photo the buyer gave Buddy on show, it reads "Paint <dog> from your
// photo" and goes to that choice card. Same harness shape as product-journey.test.mjs.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
const has = name => source.includes('  function ' + name + '(');

function page({input = null, pending = false, choice = false} = {}) {
  const el = () => ({hidden: false, textContent: '', innerHTML: '', addEventListener() {}, querySelector: () => null});
  const listeners = {}, scrolls = [], notes = [], focused = [], tracked = [];
  const go = {addEventListener: (name, fn) => { listeners[name] = fn; }};
  const card = Object.assign(el(), {hidden: true, querySelector: s => s === '[data-hs-journey-photo]' ? go : null});
  const parts = {'[data-hs-journey-line]': el(), '[data-hs-journey-intro]': el(), '[data-hs-journey-card]': card, '[data-hs-journey-here]': el()};
  const box = {getAttribute: () => 'mug', querySelector: s => parts[s]};
  const field = {scrollIntoView: o => scrolls.push(['field', o]), querySelector: () => ({focus: o => focused.push(['field', o])})};
  const choiceCard = {hidden: !choice, scrollIntoView: o => scrolls.push(['choice', o]), querySelector: s => s === '[data-hs2-blanket-create]' ? {focus: o => focused.push(['use', o])} : null};
  const state = {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: "I'm your shadow."}};
  const ctx = {state, possessive: n => /s$/i.test(n) ? n + "'" : n + "'s",
    document: {querySelector: s => s === '[data-hs-journey]' ? box : s === '[data-hs2-blanket-photo]' ? choiceCard : /tee-field--photo|tee-form-wrapper|photo-step/.test(s) ? field : null},
    answer: k => ({dog: 'Pip', person: 'Alex', signed: 'Love, Pip'})[k], shopRoot: () => '/', track: name => tracked.push(name),
    queueGet: () => [], handleOf: u => (/\/products\/([^/?#]+)/.exec(u || '') || [])[1] || '', location: {pathname: '/products/your-dogs-mug'}, cityArtSaved: () => false, redoMode: {id: ''},
    artworkFacts: () => JSON.stringify({version: 1, facts: []}), window: {},
    photoInput: () => input, blanketUploadPending: () => pending, photoNote: text => notes.push(text), photoHeld: () => "I'm still working on the photo you sent.", photoLog: () => {}};
  const names = ['journeyCard'].concat(has('openPhotoPicker') ? ['openPhotoPicker'] : []);
  return {ctx, card, listeners, scrolls, notes, focused, tracked, names};
}
const fileInput = (over = {}) => Object.assign({id: 'tee-photo-1', disabled: false, clicks: 0, click() { this.clicks++; }, getAttribute: () => 'image/*'}, over);

for (const minified of [false, true]) {
  const mode = minified ? 'minified' : 'source';
  const load = p => { const code = p.names.map(section).join('\n'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, p.ctx); p.ctx.journeyCard(); return p; };
  test(`${mode}: one tap on "Add Pip's photo" opens the picker in the same tap, with no scroll`, () => {
    const input = fileInput(), p = load(page({input}));
    assert.match(p.card.innerHTML, /data-hs-journey-photo>Add Pip&#39;s photo</);
    p.listeners.click();
    assert.equal(input.clicks, 1, "Teeinblue's input is clicked inside the tap");
    assert.deepEqual(p.scrolls, [], 'no scroll: the picker covers the screen');
    assert.ok(p.tracked.includes('journey_photo'));
  });
  test(`${mode}: before Teeinblue draws its photo field, the tap goes there without a long animation and says so`, () => {
    for (const input of [null, fileInput({disabled: true})]) {
      const p = load(page({input}));
      p.listeners.click();
      assert.equal(p.scrolls.length, 1); assert.equal(p.scrolls[0][1].behavior, 'auto', 'no smooth scroll down the whole page');
      assert.deepEqual(p.notes, ['The photo step is still loading. Tap again in a moment.']);
      if (input) assert.equal(input.clicks, 0);
    }
  });
  test(`${mode}: with a photo already on its way, the tap says so instead of opening a picker that would be held`, () => {
    const input = fileInput(), p = load(page({input, pending: true}));
    p.listeners.click();
    assert.equal(input.clicks, 0); assert.deepEqual(p.scrolls, []);
    assert.deepEqual(p.notes, ["I'm still working on the photo you sent."]);
  });
  test(`${mode}: with the photo Pip's person gave Buddy on show, the button says it paints from it and goes to that choice`, () => {
    const input = fileInput(), p = load(page({input, choice: true}));
    assert.match(p.card.innerHTML, /data-hs-journey-photo>Paint Pip from your photo</);
    assert.doesNotMatch(p.card.innerHTML, /Add Pip&#39;s photo/);
    p.listeners.click();
    assert.equal(input.clicks, 0, 'the choice card decides: this photo, or a different one');
    assert.deepEqual(p.scrolls.map(s => s[0]), ['choice']);
    assert.deepEqual(JSON.parse(JSON.stringify(p.focused)), [['use', {preventScroll: true}]]);
  });
}
