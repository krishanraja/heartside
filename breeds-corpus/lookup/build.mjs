// Builds hs-breeds.js, the breed lookup and type-ahead the chat calls, from the corpus CSVs.
// Rules: breeds-corpus/dog_corpus_completed_readme.md (section B) and AUDIT-2026-10-15.md.
//   node build.mjs          writes hs-breeds.js next to this file and the theme's copy
//   node build.mjs --check  exits 1 if either copy is out of date with the CSVs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const corpus = path.join(here, '..');
const OUT = path.join(here, 'hs-breeds.js');
// the theme loads its own copy; both are written from the same render
export const THEME_COPY = path.join(corpus, '..', 'shopify', 'assets', 'hs-breeds.js');
// the last option of every type-ahead list, on the mixed-breed row
export const NOT_SURE = 'Mixed or not sure';

// Krish's call, 15 Oct 2026 ("pit" added on his ruling of 19 Oct): these show "Pit Bull" and
// use the American Staffordshire Terrier row
export const KRISH_CALLS = [
  { query: 'pit bull', id: 'american-staffordshire-terrier', name: 'Pit Bull' },
  { query: 'pitbull', id: 'american-staffordshire-terrier', name: 'Pit Bull' },
  { query: 'pittie', id: 'american-staffordshire-terrier', name: 'Pit Bull' },
  { query: 'pit', id: 'american-staffordshire-terrier', name: 'Pit Bull' }
];

// a small CSV reader: quoted fields, doubled quotes, UTF-8 BOM
export function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((x) => x !== '')) rows.push(row); }
  const head = rows.shift();
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] == null ? '' : r[i]])));
}

export function loadCorpus() {
  return {
    rows: readCsv(path.join(corpus, 'dog_corpus_completed.csv')),
    base: readCsv(path.join(corpus, 'breed_lookup_normalized.csv')),
    additions: readCsv(path.join(corpus, 'us_lookup_additions.csv')),
    display: readCsv(path.join(corpus, 'us_display_names.csv')),
    popular: readCsv(path.join(corpus, 'us_popularity.csv'))
  };
}

const GENERIC = /\b(family|type|unknown)\b/g;

export function buildData(src) {
  const { rows, base, additions, display } = src;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ids = [];
  const idIndex = new Map();
  const idx = (id) => {
    if (!byId.has(id)) throw new Error('unknown canonical id: ' + id);
    if (!idIndex.has(id)) { idIndex.set(id, ids.length); ids.push(id); }
    return idIndex.get(id);
  };
  // the order of precedence: Krish's calls, then the US additions, then the corpus lookup
  const q = {};
  const names = {};
  for (const c of KRISH_CALLS) { q[c.query] = idx(c.id); names[c.query] = c.name; }
  for (const a of additions) if (!(a.query in q)) q[a.query] = idx(a.canonical_id);
  for (const b of base) if (!(b.query in q)) q[b.query] = idx(b.canonical_id);

  const us = new Map(display.map((d) => [d.canonical_id, d.us_display_name]));
  // fallbacks: each family row's aliases, less "family", "type" and "unknown", as whole-word phrases
  const families = [];
  for (const r of rows) {
    if (r.entity_type !== 'breed-family') continue;
    const phrases = new Set();
    for (const a of r.aliases.split('|')) {
      const p = a.toLowerCase().replace(GENERIC, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
      if (p) phrases.add(p);
    }
    families.push([idx(r.id), [...phrases]]);
  }
  const mixed = rows.find((r) => r.entity_type === 'mixed');
  idx(mixed.id);

  // A name the type-ahead offers must find its own row again when typed or saved, so each
  // offered row's display name becomes an exact query when nothing else owns that query.
  const shown = (id) => us.get(id) || byId.get(id).name;
  for (const id of [...ids]) {
    const t = byId.get(id).entity_type;
    if (t === 'mixed' || t === 'breed-family') continue;
    const key = normalizeKey(shown(id));
    if (key && !(key in q)) q[key] = idx(id);
  }

  // The curated list of breeds US owners commonly type (us_popularity.csv, not a published
  // ranking). Only these rows are offered for a near spelling or a short prefix.
  const popular = [];
  for (const p of src.popular || []) {
    const r = byId.get(p.canonical_id);
    if (!r) throw new Error('us_popularity.csv: unknown canonical id ' + p.canonical_id);
    if (r.entity_type === 'mixed' || r.entity_type === 'breed-family') throw new Error('us_popularity.csv: not a breed or cross: ' + p.canonical_id);
    if (shown(p.canonical_id) !== p.us_display_name) throw new Error('us_popularity.csv: ' + p.canonical_id + ' shows "' + shown(p.canonical_id) + '", not "' + p.us_display_name + '"');
    const i = idx(p.canonical_id);
    if (popular.includes(i)) throw new Error('us_popularity.csv: duplicate ' + p.canonical_id);
    popular.push(i);
  }
  popular.sort((a, b) => a - b);

  // Both parents of every named cross, as the corpus writes them (parent_1, parent_2)
  const parents = {};
  for (const r of rows) {
    if (r.entity_type !== 'crossbreed') continue;
    if (!r.parent_1 || !r.parent_2) throw new Error('crossbreed without both parents: ' + r.id);
    idx(r.id);
    parents[r.id] = [r.parent_1, r.parent_2];
  }

  // per id: buyer-facing name, entity type, primary dog_type (a light tone signal only).
  // Size, exercise and the secondary type are left out on purpose: the audit found them wrong.
  const entities = ids.map((id) => {
    const r = byId.get(id);
    return [id, shown(id), r.entity_type, r.dog_type];
  });
  return { entities, q, names, families, mixed: idIndex.get(mixed.id), popular, parents };
}

// the same steps as normalize() in the generated file (readme section B.1)
export function normalizeKey(text) {
  return String(text == null ? '' : text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['`\u2018\u2019\u02bc]/g, '').replace(/[\u00a0\u2000-\u206f]/g, ' ').replace(/[^\x00-\x7f]/g, '')
    .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function render(data) {
  return `/* Heartside breed lookup. GENERATED by breeds-corpus/lookup/build.mjs from the corpus CSVs.
   Do not edit by hand: edit the CSVs or build.mjs, then run node build.mjs && node test.mjs.
   HSBreeds.lookup(text) returns { id, name, kind, exact, tone } or null for empty input.
   - name is the only field a buyer may see (us_display_names.csv, then the corpus name).
   - tone is the primary dog_type, a light tone signal only; never show it.
   - Size, exercise and the secondary type are not in this file (AUDIT-2026-10-15.md).
   - An unknown name falls back to a family row or the mixed-breed row, never a near spelling.
   - A named cross also carries parents: what each corpus parent name looks up to.
   HSBreeds.suggest(text, n) returns up to n { id, name } choices for a type-ahead, the last
   always { id: 'mixed-breed', name: '${NOT_SURE}' }. A near spelling is only ever offered
   here, for the buyer to tap, and only for us_popularity.csv rows. Every offered name finds
   its own row again through lookup().
   HSBreeds.parents(id) returns a named cross's two parents as the corpus names them, or null. */
(function (root) {
  'use strict';
  var E = ${JSON.stringify(data.entities)};
  var Q = ${JSON.stringify(data.q)};
  var NAMES = ${JSON.stringify(data.names)};
  var FAMILIES = ${JSON.stringify(data.families)};
  var MIXED = ${data.mixed};
  var POPULAR = ${JSON.stringify(data.popular)};
  var PARENTS = ${JSON.stringify(data.parents)};
  var NOT_SURE = ${JSON.stringify(NOT_SURE)};
  var has = Object.prototype.hasOwnProperty;
  // readme section B.1: decompose accents, lowercase, & to "and", drop apostrophes,
  // other punctuation to spaces, collapse whitespace, trim. Letters with no ASCII base
  // (the corpus has "ø") are dropped, as the corpus build did: "Hønsehund" is "hnsehund".
  function normalize(text) {
    var s = String(text == null ? '' : text);
    if (s.normalize) s = s.normalize('NFD');
    return s.replace(/[\\u0300-\\u036f]/g, '').replace(/['\`\\u2018\\u2019\\u02bc]/g, '')
      .replace(/[\\u00a0\\u2000-\\u206f]/g, ' ').replace(/[^\\x00-\\x7f]/g, '')
      .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function entity(i, exact, query) {
    var e = E[i];
    return { id: e[0], name: (exact && NAMES[query]) || e[1], kind: e[2], exact: exact, tone: e[3] };
  }
  function find(query) {
    if (has.call(Q, query)) return entity(Q[query], true, query);
    // no exact match: a family named in whole words ("poodle mix"), if exactly one; else mixed breed
    var padded = ' ' + query + ' ', hit = [];
    for (var f = 0; f < FAMILIES.length; f++) {
      for (var p = 0; p < FAMILIES[f][1].length; p++) {
        if (padded.indexOf(' ' + FAMILIES[f][1][p] + ' ') !== -1) { hit.push(FAMILIES[f][0]); break; }
      }
    }
    return entity(hit.length === 1 ? hit[0] : MIXED, false, query);
  }
  function parents(id) {
    var p = typeof id === 'string' && has.call(PARENTS, id) ? PARENTS[id] : null;
    return p ? [p[0], p[1]] : null;
  }
  function lookup(text) {
    var query = normalize(text);
    if (!query) return null;
    var r = find(query), p = r.kind === 'crossbreed' ? parents(r.id) : null;
    // each parent through the same exact lookup, so a cross's energy can follow its parents
    if (p) r.parents = [find(normalize(p[0])), find(normalize(p[1]))];
    return r;
  }
  // restricted Damerau-Levenshtein (optimal string alignment): edits, with a swap of two
  // neighboring letters counted as one. Anything above max comes back as max + 1.
  function distance(a, b, max) {
    var n = a.length, m = b.length, older = [], prev = [], row = [], swap, low, i, j, c, v;
    if (Math.abs(n - m) > max) return max + 1;
    for (j = 0; j <= m; j++) prev[j] = j;
    for (i = 1; i <= n; i++) {
      row[0] = low = i;
      for (j = 1; j <= m; j++) {
        c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + c);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) v = Math.min(v, older[j - 2] + 1);
        row[j] = v;
        if (v < low) low = v;
      }
      // every later row is at least this row's smallest value, so stop once it passes max
      if (low > max) return max + 1;
      swap = older; older = prev; prev = row; row = swap;
    }
    return prev[m] > max ? max + 1 : prev[m];
  }
  var LABELS = null;
  // every name the type-ahead can offer: one per exact query, shown as its row's name (or
  // Krish's name for it, "Pit Bull"). Family and mixed rows are never offered by name.
  function labels() {
    if (LABELS) return LABELS;
    var pop = {}, out = [], i, k, name;
    for (i = 0; i < POPULAR.length; i++) pop[POPULAR[i]] = true;
    for (k in Q) {
      if (!has.call(Q, k)) continue;
      i = Q[k];
      if (E[i][2] === 'mixed' || E[i][2] === 'breed-family') continue;
      name = has.call(NAMES, k) ? NAMES[k] : E[i][1];
      out.push({ i: i, key: k, name: name, shown: normalize(name) === k, popular: pop[i] === true });
    }
    LABELS = out;
    return out;
  }
  // lower is better: 0 exact query, 10 display-name prefix, 20 query prefix, 30 and 35 a
  // word start in the display name or a query, 40 + edits a near spelling (half a point more
  // when only the start of the name is near). A row off the popular list needs 5 or more
  // letters to be offered by prefix and is never offered for a near spelling.
  function score(L, q, far) {
    var open = L.popular || q.length >= 5, d;
    if (L.key === q) return 0;
    if (open && L.key.indexOf(q) === 0) return L.shown ? 10 : 20;
    if (open && L.key.indexOf(' ' + q) !== -1) return L.shown ? 30 : 35;
    if (!L.popular || far < 1) return -1;
    d = distance(q, L.key, far);
    if (d <= far) return 40 + d;
    if (q.length >= 6 && L.key.length > q.length && distance(q, L.key.slice(0, q.length), 1) <= 1) return 41.5;
    return -1;
  }
  function suggest(text, n) {
    var limit = typeof n === 'number' && n >= 1 ? Math.floor(n) : 5;
    var q = normalize(text), out = [], best = {}, list = [], all, i, s, key, prev;
    if (q) {
      all = labels();
      // how many edits a near spelling may be: none under 4 letters, 1 under 6, else 2
      var far = q.length < 4 ? 0 : q.length < 6 ? 1 : 2;
      for (i = 0; i < all.length; i++) {
        s = score(all[i], q, far);
        if (s < 0) continue;
        key = all[i].name.toLowerCase();
        prev = has.call(best, key) ? best[key] : null;
        if (!prev) { prev = best[key] = { id: E[all[i].i][0], name: all[i].name, s: s, popular: all[i].popular }; list.push(prev); }
        else if (s < prev.s) { prev.s = s; prev.id = E[all[i].i][0]; }
        if (all[i].popular) prev.popular = true;
      }
      // "did you mean" only when nothing matched as typed, and only the closest spellings
      var typed = false, near = 99;
      for (i = 0; i < list.length; i++) {
        if (list[i].s < 40) typed = true; else near = Math.min(near, Math.floor(list[i].s) - 40);
      }
      list = list.filter(function (x) { return typed ? x.s < 40 : Math.floor(x.s) - 40 === near; });
      list.sort(function (a, b) {
        return (a.s - b.s) || ((b.popular ? 1 : 0) - (a.popular ? 1 : 0)) || (a.name.length - b.name.length) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      });
      for (i = 0; i < list.length && out.length < limit - 1; i++) out.push({ id: list[i].id, name: list[i].name });
    }
    out.push({ id: E[MIXED][0], name: NOT_SURE });
    return out;
  }
  var api = { lookup: lookup, normalize: normalize, suggest: suggest, parents: parents };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HSBreeds = api;
})(typeof window !== 'undefined' ? window : this);
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = render(buildData(loadCorpus()));
  for (const file of [OUT, THEME_COPY]) {
    const name = path.relative(process.cwd(), file);
    if (process.argv.includes('--check')) {
      const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (now !== out) { console.error(name + ' is out of date: run node breeds-corpus/lookup/build.mjs'); process.exitCode = 1; }
      else console.log(name + ' is up to date');
    } else {
      fs.writeFileSync(file, out);
      console.log('wrote ' + name + ' (' + out.length + ' bytes)');
    }
  }
}
