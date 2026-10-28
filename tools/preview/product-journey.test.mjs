// The product page as the chat's last step (27 Oct): after the chat, Buddy's bar names the gift and
// the journey card shows what carries over with Change links back to the exact chat step; a direct
// visit gets Buddy's offer instead, and never a placeholder dog name.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
function page(gift, state, saved = false, queue = []) {
  const el = () => ({hidden: false, textContent: '', innerHTML: '', addEventListener() {}, querySelector: () => null});
  const parts = {'[data-hs-journey-line]': el(), '[data-hs-journey-intro]': el(), '[data-hs-journey-card]': Object.assign(el(), {hidden: true}), '[data-hs-journey-here]': el()};
  const box = {getAttribute: () => gift, querySelector: s => parts[s]};
  return {parts, ctx: {state, document: {querySelector: s => s === '[data-hs-journey]' ? box : null},
    answer: k => ({dog: state.dog || '', person: state.person || '', signed: state.dog ? 'Love, ' + state.dog : ''})[k], shopRoot: () => '/', track() {},
    queueGet: () => queue, handleOf: u => (/\/products\/([^/?#]+)/.exec(u || '') || [])[1] || '', location: {pathname: '/products/your-dogs-' + gift}, cityArtSaved: () => saved, redoMode: {id: ''},
    artworkFacts: () => JSON.stringify({version: 1, facts: [{source: 'spot', text: "Rests on their person's side of the bed."}]}),
    window: {HSArtworkChoices: {read: () => ({style: 'ink', tone: 'hilarious'})}, HSArtworkEngine: {recipes: {styles: {ink: {label: 'Fine ink drawing'}}, tones: {hilarious: {label: 'Hilarious'}}}}}}};
}
for (const minified of [false, true]) {
  // the real possessive: a name cut to "Sir Biscuit O'" read "O''s" in the toast (28 Oct)
  const run = ctx => { const code = section('possessive') + '\n' + section('journeyCard'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx); ctx.journeyCard(); };
  test(`${minified ? 'minified' : 'source'}: after the chat, the card carries everything over with a way back to each step`, () => {
    const {parts, ctx} = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: "I'm your shadow, and I like it that way."}});
    run(ctx);
    // never "Last step.": the photo, the painting, the tick and the add are still to come (28 Oct)
    assert.equal(parts['[data-hs-journey-line]'].textContent, "Let's make Pip's mug.");
    assert.equal(parts['[data-hs-journey-intro]'].hidden, true); assert.equal(parts['[data-hs-journey-card]'].hidden, false);
    const html = parts['[data-hs-journey-card]'].innerHTML;
    assert.match(html, /Pip for Alex/); assert.match(html, /I&#39;m your shadow, and I like it that way\./); assert.match(html, /Love, Pip/);
    assert.match(html, /href="\/\?step=person&amp;return=mug"/); assert.match(html, /href="\/\?step=gift-mug&amp;return=mug"/); assert.match(html, /href="\/\?step=home&amp;return=mug"/);
    assert.match(html, /Fine ink drawing · Hilarious/); assert.doesNotMatch(html, /new artwork/);
    const blanket = page('blanket', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: 'x'}}, true); run(blanket.ctx);
    assert.match(blanket.parts['[data-hs-journey-card]'].innerHTML, /None\. The blanket is all painting\./);
    assert.match(blanket.parts['[data-hs-journey-card]'].innerHTML, /Changing these means painting new artwork\./);
    const redo = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: 'x'}}); redo.ctx.redoMode.id = 'a'.repeat(36); run(redo.ctx);
    assert.equal(redo.parts['[data-hs-journey-line]'].textContent, 'Another version, then. Your first design stays in your cart until you choose.');
    const landed = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: 'x'}}); landed.ctx.redoMode.landed = true; run(landed.ctx);
    assert.equal(landed.parts['[data-hs-journey-line]'].textContent, 'Your new version is in your cart. Choose which one to keep there.');
    // the first action on the page: go to the photo step
    assert.match(html, /data-hs-journey-photo>Add Pip&#39;s photo</);
    // several gifts from the chat: which one this is, not "last step"
    const two = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: 'x'}}, false, [{url: '/products/your-dogs-mug'}, {url: '/products/your-dogs-blanket'}]); run(two.ctx);
    assert.equal(two.parts['[data-hs-journey-line]'].textContent, "Gift 1 of 2. Let's make Pip's mug.");
    // the last gift of a list, or a list of one: still no "Last step."
    for (const queue of [[{url: '/products/your-dogs-blanket'}, {url: '/products/your-dogs-mug'}], [{url: '/products/your-dogs-mug'}]]) {
      const last = page('mug', {dog: 'Buttons', person: 'Alex', hs3_lines: {meaning: 'x'}}, false, queue); run(last.ctx);
      assert.doesNotMatch(last.parts['[data-hs-journey-line]'].textContent, /Last step/);
      assert.match(last.parts['[data-hs-journey-line]'].textContent, /Let's make Buttons' mug\.$/);
    }
  });
  test(`${minified ? 'minified' : 'source'}: possessives never double an apostrophe`, () => {
    const ctx = {}; const code = section('possessive'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
    assert.equal(ctx.possessive("Sir Biscuit O'"), "Sir Biscuit O's");
    assert.equal(ctx.possessive('Sir Biscuit O’'), "Sir Biscuit O's");
    assert.equal(ctx.possessive('Pip'), "Pip's"); assert.equal(ctx.possessive('Buttons'), "Buttons'"); assert.equal(ctx.possessive("Buttons'"), "Buttons'");
    for (const n of ["Sir Biscuit O'", "Sir Biscuit O''", 'Buttons', 'Pip', "Jo'"]) assert.doesNotMatch(ctx.possessive(n), /['’]{2}/, n);
  });
  test(`${minified ? 'minified' : 'source'}: a name from a link is at most 14 letters, what the signature holds`, () => {
    const search = '?dog=' + encodeURIComponent("Sir Biscuit O'Malley") + '&person=' + encodeURIComponent('Maximiliana Rose') + '&incident=' + encodeURIComponent('The sock under the couch that nobody found for a month');
    const ctx = {ANSWERS: ['dog', 'person', 'cupboard', 'improvement', 'incident', 'enemy'], KEY: 'hs2-review', URLSearchParams, JSON,
      window: {location: {search}, sessionStorage: {getItem: () => null}}};
    const code = section('load'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
    const s = ctx.load();
    assert.equal(s.dog, "Sir Biscuit O'"); assert.equal(s.dog.length, 14);
    assert.equal(s.person, 'Maximiliana Ro'); assert.equal(s.incident.length, 40, 'other answers keep their room');
  });
  test(`${minified ? 'minified' : 'source'}: a direct visit gets Buddy's offer and no stranger's names`, () => {
    const {parts, ctx} = page('portrait', {});
    run(ctx);
    assert.equal(parts['[data-hs-journey-intro]'].hidden, false); assert.equal(parts['[data-hs-journey-card]'].hidden, true);
    assert.doesNotMatch(parts['[data-hs-journey-line]'].textContent, /Sarah|Last step/);
  });
}
