// Tests for hs-breeds.js. Run: node test.mjs (after node build.mjs)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { loadCorpus, buildData, render, KRISH_CALLS } from './build.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const { lookup, normalize } = require('./hs-breeds.js');
const src = loadCorpus();
const us = new Map(src.display.map((d) => [d.canonical_id, d.us_display_name]));
const corpusName = new Map(src.rows.map((r) => [r.id, r.name]));
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

ok('hs-breeds.js matches the CSVs (rebuilt in memory)', () => {
  assert.equal(fs.readFileSync(path.join(here, 'hs-breeds.js'), 'utf8'), render(buildData(src)));
});

ok('normalize follows readme B.1 for every corpus query', () => {
  for (const b of src.base) {
    assert.equal(normalize(b.display_query), b.query, b.display_query);
  }
  assert.equal(normalize('  Chihuahueño!! '), 'chihuahueno');
  assert.equal(normalize("Black & Tan"), 'black and tan');
  assert.equal(normalize('Pit-Bull'), 'pit bull');
  assert.equal(normalize('Pittie’s'), 'pitties');
});

ok('every query in us_lookup_additions.csv returns its id and US name', () => {
  assert.equal(src.additions.length, 44);
  for (const a of src.additions) {
    const r = lookup(a.display_query);
    assert.equal(r.id, a.canonical_id, a.query);
    assert.equal(r.exact, true, a.query);
    assert.equal(r.name, us.get(a.canonical_id) || corpusName.get(a.canonical_id), a.query);
  }
  // spot checks of the buyer-facing name
  assert.equal(lookup('Boxer').name, 'Boxer');
  assert.equal(lookup('chihuahua').name, 'Chihuahua');
  assert.equal(lookup('GSP').name, 'German Shorthaired Pointer');
  assert.equal(lookup('Blue Heeler').name, 'Australian Cattle Dog');
  assert.equal(lookup('amstaff').name, 'American Staffordshire Terrier');
});

ok('the US additions are checked before the corpus lookup', () => {
  for (const a of src.additions) {
    const base = src.base.find((b) => b.query === a.query);
    if (base) assert.equal(lookup(a.query).id, a.canonical_id);
  }
  // registry-language names never reach the buyer for the 25 common breeds
  assert.equal(lookup('french bulldog').name, 'French Bulldog');
  assert.equal(lookup('german shepherd').name, 'German Shepherd');
});

ok('Pit Bull: four spellings show "Pit Bull" on the AmStaff row', () => {
  for (const q of ['pit bull', 'Pitbull', 'PITTIE', 'Pit-Bull', 'pit', 'Pit']) {
    const r = lookup(q);
    assert.equal(r.id, 'american-staffordshire-terrier', q);
    assert.equal(r.name, 'Pit Bull', q);
    assert.equal(r.exact, true, q);
  }
  assert.equal(KRISH_CALLS.length, 4);
});

ok('"mutt" is the mixed-breed row', () => {
  const r = lookup('mutt');
  assert.equal(r.id, 'mixed-breed');
  assert.equal(r.kind, 'mixed');
  assert.equal(r.exact, true);
});

ok('a misspelling falls back, never to a near spelling', () => {
  const r = lookup('Labradoor');
  assert.equal(r.id, 'mixed-breed');
  assert.equal(r.exact, false);
  assert.notEqual(lookup('chiwawa').id, 'chihuahue-o');
  assert.equal(lookup('chiwawa').id, 'mixed-breed');
});

ok('an unknown name with one family word falls back to that family', () => {
  assert.equal(lookup('poodle mix').id, 'family-poodle');
  assert.equal(lookup('some kind of sighthound').id, 'family-sighthound');
  assert.equal(lookup('poodle mix').exact, false);
  assert.equal(lookup('poodle schnauzer mix').id, 'mixed-breed'); // two families: no guess
  assert.equal(lookup('boxer mix').id, 'mixed-breed');
});

ok('buyers never get size, exercise or the secondary type', () => {
  const r = lookup('beagle');
  assert.deepEqual(Object.keys(r).sort(), ['exact', 'id', 'kind', 'name', 'tone']);
  const file = fs.readFileSync(path.join(here, 'hs-breeds.js'), 'utf8');
  for (const word of ['medium-large', 'toy-small', 'size_band', 'exercise_band', 'secondary_dog_type']) {
    assert.equal(file.includes(word), false, word);
  }
  // each entity carries id, name, kind and the primary dog_type, nothing more
  const rows = new Map(src.rows.map((x) => [x.id, x]));
  for (const e of buildData(src).entities) {
    assert.equal(e.length, 4);
    assert.equal(e[3], rows.get(e[0]).dog_type);
  }
});

ok('empty input returns null', () => {
  assert.equal(lookup(''), null);
  assert.equal(lookup('  ?! '), null);
  assert.equal(lookup(null), null);
});

console.log(n + ' tests passed');
