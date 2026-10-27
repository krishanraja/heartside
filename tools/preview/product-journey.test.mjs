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
  return {parts, ctx: {state, document: {querySelector: s => s === '[data-hs-journey]' ? box : null}, possessive: n => /s$/i.test(n) ? n + "'" : n + "'s",
    answer: k => ({dog: state.dog || '', person: state.person || '', signed: state.dog ? 'Love, ' + state.dog : ''})[k], shopRoot: () => '/', track() {},
    queueGet: () => queue, handleOf: u => (/\/products\/([^/?#]+)/.exec(u || '') || [])[1] || '', location: {pathname: '/products/your-dogs-' + gift}, cityArtSaved: () => saved, redoMode: {id: ''},
    artworkFacts: () => JSON.stringify({version: 1, facts: [{source: 'spot', text: "Rests on their person's side of the bed."}]}),
    window: {HSArtworkChoices: {read: () => ({style: 'ink', tone: 'hilarious'})}, HSArtworkEngine: {recipes: {styles: {ink: {label: 'Fine ink drawing'}}, tones: {hilarious: {label: 'Hilarious'}}}}}}};
}
for (const minified of [false, true]) {
  const run = ctx => { const code = section('journeyCard'); vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx); ctx.journeyCard(); };
  test(`${minified ? 'minified' : 'source'}: after the chat, the card carries everything over with a way back to each step`, () => {
    const {parts, ctx} = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: "I'm your shadow, and I like it that way."}});
    run(ctx);
    assert.equal(parts['[data-hs-journey-line]'].textContent, "Last step. Let's make Pip's mug.");
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
    // the first action on the page: go to the photo step
    assert.match(html, /data-hs-journey-photo>Add Pip&#39;s photo</);
    // several gifts from the chat: which one this is, not "last step"
    const two = page('mug', {dog: 'Pip', person: 'Alex', hs3_lines: {meaning: 'x'}}, false, [{url: '/products/your-dogs-mug'}, {url: '/products/your-dogs-blanket'}]); run(two.ctx);
    assert.equal(two.parts['[data-hs-journey-line]'].textContent, "Gift 1 of 2. Let's make Pip's mug.");
  });
  test(`${minified ? 'minified' : 'source'}: a direct visit gets Buddy's offer and no stranger's names`, () => {
    const {parts, ctx} = page('portrait', {});
    run(ctx);
    assert.equal(parts['[data-hs-journey-intro]'].hidden, false); assert.equal(parts['[data-hs-journey-card]'].hidden, true);
    assert.doesNotMatch(parts['[data-hs-journey-line]'].textContent, /Sarah|Last step/);
  });
}
