// The prefill bridge's loop guard (27 Oct review): one value goes to one Teeinblue field at most
// three times per page, a new value starts its own count, and Teeinblue's events that answer our
// own writes (within 600 ms) never reset the retry count.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs2.js', import.meta.url), 'utf8');
const section = name => { const i = source.indexOf('  function ' + name + '('); assert.notEqual(i, -1, name); return source.slice(i, source.indexOf('\n  function ', i + 1)); };
for (const minified of [false, true]) test(`${minified ? 'minified' : 'source'}: a field is resent at most three times per value, and our own events never reset the retries`, () => {
  let now = 1000;
  class Field { constructor() { this.value = ''; this.events = []; } dispatchEvent(e) { this.events.push(e.type); } }
  const ctx = {bridge: {sent: {}, selfAt: 0, tries: 4}, Date: {now: () => now}, Event: class { constructor(t) { this.type = t; } },
    HTMLInputElement: Field, HTMLTextAreaElement: Field, HTMLSelectElement: Field, Object, document: {querySelector: () => ({})}, clearTimeout() {}, setTimeout() {}, runBridge() {}};
  const code = ['mayResend', 'selfTriggered', 'setValue', 'bridgeSoon'].map(section).join('\n');
  vm.runInNewContext(minified ? transformSync(code, {minify: true}).code : code, ctx);
  const field = Object.assign(new Field(), {name: 'properties[Name]', tagName: 'INPUT'});
  for (let i = 0; i < 3; i++) { assert.equal(ctx.mayResend(field.name, 'Pip'), true); ctx.setValue(field, 'Pip'); }
  assert.equal(ctx.mayResend(field.name, 'Pip'), false, 'the fourth send of the same value is held');
  assert.equal(ctx.mayResend(field.name, 'Pippa'), true, 'a new value has its own count');
  assert.equal(ctx.selfTriggered(), true);
  ctx.bridgeSoon(); assert.equal(ctx.bridge.tries, 4, 'an event right after our write keeps the retry count');
  now += 700; assert.equal(ctx.selfTriggered(), false);
  ctx.bridgeSoon(); assert.equal(ctx.bridge.tries, 0, "the shopper's own change starts the retries again");
});
