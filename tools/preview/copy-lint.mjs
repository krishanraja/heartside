// Copy lint: the words a shopper can be shown, checked against the house rules before they ship.
//
//   node tools/preview/copy-lint.mjs                          # exit 1 on any offense
//   node tools/preview/copy-lint.mjs --baseline [file]        # exit 1 only on offenses not in the baseline
//   node tools/preview/copy-lint.mjs --write-baseline [file]  # record today's offenses as the baseline
//
// The baseline file defaults to tools/preview/copy-lint-baseline.json. Like theme-check.mjs
// --baseline, known offenses are printed (never hidden), one baseline entry covers one offense,
// and an entry nobody needs any more is reported so it can leave the list. The redesign empties it.
//
// What it reads, the strings we deliver:
//   - Liquid in shopify/ (sections, snippets, templates, layout, blocks): the page text outside
//     {% comment %}, {% doc %}, {% # %} and <!-- -->; quoted strings inside Liquid tags; string
//     literals inside <script> and {% javascript %}. Not <style> or {% stylesheet %}. In
//     {% schema %} only setting defaults count: info, label and content are for the theme editor.
//   - shopify/assets/hs*.js, and the Helio scripts we own and override (OWNED_ASSETS: the cart's
//     component-cart-items.js, whose refusal copy a buyer reads): string and template literals.
//     Comments and code are not copy.
//   - shopify/templates/*.json: setting values, since words saved into a template are delivered as is.
//
// What it flags:
//   exclamation             a "!" that ends a word: followed by a space, the end, a tag or closing
//                           punctuation. Never !=, !==, !important, <!-- or a ! operator.
//   em-dash                 U+2014, or &mdash; and its numeric entities
//   calculated-at-checkout  shipping is free on every US order, so this phrase is never true
//   retired-name            The Morning Mug, The Couch Blanket, The Framed Print, The Tree Ornament,
//                           Annual Review, Body Double, Uniform (as written, so "uniform" is fine)
//   retired-price           $29, $89, $24, $39 in copy, and those numbers as a price setting's default
//   biscuit-host            Biscuit, the old host. Buddy hosts now.
//   your-dog-has-notes      the retired tagline
//   us-spelling             plain US spelling: colour, favourite, personalise, organise, grey,
//                           centre, labelled, cancelled, catalogue, behaviour, realise, recognise,
//                           honour, jewellery and their forms. Comments and theme-editor info are
//                           not copy, so they are left alone like every other rule.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const DEFAULT_BASELINE = path.join(here, 'copy-lint-baseline.json');

// ------------------------------------------------------------------- rules
// Each rule runs over one decoded string: a literal's contents, or a run of page text.
const RETIRED_NAMES = ['The Morning Mug', 'The Couch Blanket', 'The Framed Print', 'The Tree Ornament', 'Annual Review', 'Body Double', 'Uniform'];
export const RETIRED_PRICES = [29, 89, 24, 39];
export const RULES = [
  // the lookahead keeps operators and CSS out: != and !== are followed by "=", !important by a letter
  { id: 'exclamation', re: /!(?=$|[\s<>"'`)\]}.,;:?!])/g },
  { id: 'em-dash', re: /—|&mdash;|&#0*8212;|&#x0*2014;/gi },
  { id: 'calculated-at-checkout', re: /calculated at checkout/gi },
  { id: 'retired-name', re: new RegExp(`\\b(?:${RETIRED_NAMES.join('|')})\\b`, 'g') },
  { id: 'retired-price', re: new RegExp(`\\$\\s?(?:${RETIRED_PRICES.join('|')})(?:\\.00)?(?!\\d)(?!\\.\\d)`, 'g') },
  { id: 'biscuit-host', re: /\bBiscuit\b/g },
  { id: 'your-dog-has-notes', re: /your dog has notes/gi },
  { id: 'us-spelling', re: /\b(?:colour(?:s|ed|ful|ing|ways?)?|favourites?|personalis(?:e|ed|es|ing|ations?)|organis(?:e|ed|es|ers?|ing|ations?)|grey(?:s|ed|ish)?|centre(?:s|d)?|labell(?:ed|ing)|cancell(?:ed|ing)|catalogues?|behaviour(?:s|al)?|realis(?:e|ed|es|ing|ation)|recognis(?:e|ed|es|ing|able|ably)|honour(?:s|ed|ing|able)?|jewellery)\b/gi },
];
// Helio scripts we override and own: their copy is delivered like ours
export const OWNED_ASSETS = ['component-cart-items.js'];

// ------------------------------------------------------------ text helpers
const lineStarts = (src) => {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return starts;
};
const lineAt = (starts, offset) => {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) lo = mid; else hi = mid - 1; }
  return lo + 1;
};
// blank a region but keep its newlines, so offsets and line numbers still point at the source
const blank = (s) => s.replace(/[^\n]/g, ' ');
const maskAll = (src, re) => src.replace(re, (m) => blank(m));
const squash = (s) => s.replace(/\s+/g, ' ').trim();
// a short, line-independent excerpt: the string itself when short, else a window around the match
const excerptOf = (text, index, length) => {
  const flat = squash(text);
  if (flat.length <= 80) return flat;
  const at = squash(text.slice(0, index)).length;
  const start = Math.max(0, at - 30);
  const end = Math.min(flat.length, Math.max(at + length + 10, start + 70));
  return (start > 0 ? '...' : '') + flat.slice(start, end).trim() + (end < flat.length ? '...' : '');
};

// Runs every rule over one string. offsetOf(i) maps an index in the string back to the source.
function check(text, offsetOf, sink, rules = RULES) {
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) sink({ rule: rule.id, offset: offsetOf(m.index), excerpt: excerptOf(text, m.index, m[0].length) });
  }
}

// --------------------------------------------------------- JS string literals
const JS_ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
function decodeJs(raw) {
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r?\n|.)/g, (_, e) => {
    if (e[0] === 'u') return String.fromCodePoint(parseInt(e[1] === '{' ? e.slice(2, -1) : e.slice(1), 16));
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e === '\n' || e === '\r\n') return '';
    return JS_ESCAPES[e] ?? e;
  });
}
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'instanceof', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'of']);

// The string and template literals in a piece of JavaScript, comments and regex literals skipped.
// A small tokenizer rather than a parser: it only has to know where strings start and end.
// Returns [{ raw, text, start }] where start is the offset of the literal's first character.
export function jsLiterals(src) {
  const out = [];
  const templates = []; // one brace counter per ${ } we are inside
  let i = 0;
  let prev = ''; // the last significant token: '' (start), 'word:x', 'value' or a punctuator
  const regexAllowed = () => {
    if (prev === '' || prev === 'value') return prev === '';
    if (prev.startsWith('word:')) return REGEX_AFTER_WORD.has(prev.slice(5));
    return !/^[)\]}]$/.test(prev);
  };
  const readTemplateChunk = () => { // i is just past ` or }
    const start = i;
    while (i < src.length) {
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '`') { out.push({ raw: src.slice(start, i), start }); i++; prev = 'value'; return; }
      if (src[i] === '$' && src[i + 1] === '{') { out.push({ raw: src.slice(start, i), start }); i += 2; templates.push(0); prev = '{'; return; }
      i++;
    }
    out.push({ raw: src.slice(start), start });
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"' || c === "'") {
      const start = ++i;
      while (i < src.length && src[i] !== c && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1;
      out.push({ raw: src.slice(start, i), start });
      i++; prev = 'value'; continue;
    }
    if (c === '`') { i++; readTemplateChunk(); continue; }
    if (c === '}' && templates.length) {
      if (templates[templates.length - 1] === 0) { templates.pop(); i++; readTemplateChunk(); continue; }
      templates[templates.length - 1]--;
    }
    if (c === '{' && templates.length) templates[templates.length - 1]++;
    if (c === '/' && regexAllowed()) {
      i++;
      let inClass = false;
      while (i < src.length && src[i] !== '\n') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') inClass = true; else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
        i++;
      }
      i++;
      while (/[a-z]/i.test(src[i] || '')) i++;
      prev = 'value'; continue;
    }
    if (/[A-Za-z_$À-￿]/.test(c)) {
      const start = i;
      while (i < src.length && /[\w$À-￿]/.test(src[i])) i++;
      const word = src.slice(start, i);
      prev = REGEX_AFTER_WORD.has(word) ? 'word:' + word : 'value'; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) { while (i < src.length && /[\w.]/.test(src[i])) i++; prev = 'value'; continue; }
    prev = c; i++;
  }
  return out.map((l) => ({ ...l, text: decodeJs(l.raw) }));
}

// ------------------------------------------------------------------ linters
// Each returns [{ file, line, rule, excerpt }].
const finish = (src, file, found) => {
  const starts = lineStarts(src);
  return found.map((f) => ({ file, line: lineAt(starts, f.offset), rule: f.rule, excerpt: f.excerpt })).sort((a, b) => a.line - b.line);
};
// a GraphQL document in a string is code: its "ID!" marks a required field, not a shout
const GRAPHQL = /^\s*(?:query|mutation|subscription|fragment)\b[^{]*{/;
const scanLiterals = (literals, base, sink) => {
  for (const l of literals) if (!GRAPHQL.test(l.text)) check(l.text, (k) => base + l.start + Math.min(k, l.raw.length), sink);
};

export function lintJs(src, file = 'inline.js') {
  const found = [];
  scanLiterals(jsLiterals(src), 0, (f) => found.push(f));
  return finish(src, file, found);
}

// Section schema: only setting defaults are delivered. A number default counts as a retired price
// when the setting is a price ("price_mug", "Mug price").
function lintSchema(json, base, sink) {
  let schema;
  try { schema = JSON.parse(json); } catch { return; }
  const settings = [...(schema.settings || []), ...(schema.blocks || []).flatMap((b) => b.settings || [])];
  let cursor = 0;
  for (const st of settings) {
    if (!st || typeof st !== 'object' || !('default' in st)) continue;
    const idAt = st.id ? json.slice(cursor).search(new RegExp(`"id"\\s*:\\s*"${st.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`)) : -1;
    if (idAt >= 0) cursor += idAt;
    const defAt = json.indexOf('"default"', cursor);
    const at = base + (defAt >= 0 ? defAt : cursor);
    if (typeof st.default === 'string') check(st.default, () => at, sink);
    else if (typeof st.default === 'number' && RETIRED_PRICES.includes(st.default) && /price/i.test(`${st.id} ${st.label || ''}`)) {
      sink({ rule: 'retired-price', offset: at, excerpt: `${st.id} default ${st.default}` });
    }
  }
}

export function lintLiquid(src, file = 'inline.liquid') {
  const found = [];
  const sink = (f) => found.push(f);
  let text = src;
  // 1. never delivered: comments, docs, HTML comments, styles
  for (const re of [
    /{%-?\s*comment\s*-?%}[\s\S]*?{%-?\s*endcomment\s*-?%}/g,
    /{%-?\s*doc\s*-?%}[\s\S]*?{%-?\s*enddoc\s*-?%}/g,
    /{%-?\s*#[\s\S]*?-?%}/g,
    /<!--[\s\S]*?-->/g,
    /{%-?\s*(?:style|stylesheet)\s*-?%}[\s\S]*?{%-?\s*end(?:style|stylesheet)\s*-?%}/g,
    /<style\b[^>]*>[\s\S]*?<\/style>/gi,
  ]) text = maskAll(text, re);
  // 2. the schema: defaults only
  text = text.replace(/({%-?\s*schema\s*-?%})([\s\S]*?){%-?\s*endschema\s*-?%}/g, (m, open, body, at) => {
    lintSchema(body, at + open.length, sink);
    return blank(m);
  });
  // 3. scripts: their string literals
  text = text.replace(/(<script\b[^>]*>|{%-?\s*javascript\s*-?%})([\s\S]*?)(<\/script>|{%-?\s*endjavascript\s*-?%})/gi, (m, open, body, close, at) => {
    scanLiterals(jsLiterals(body), at + open.length, sink);
    return blank(m);
  });
  // 4. Liquid tags and output: quoted strings only, never the expression (where != lives)
  text = text.replace(/{{[\s\S]*?}}|{%[\s\S]*?%}/g, (m, at) => {
    const code = /^{%-?\s*liquid\b/.test(m) ? m.replace(/^[ \t]*#.*$/gm, (c) => blank(c)) : m;
    for (const q of code.matchAll(/'([^']*)'|"([^"]*)"/g)) {
      const body = q[1] ?? q[2];
      check(body, (k) => at + q.index + 1 + k, sink);
    }
    return blank(m);
  });
  // 5. what is left is the page: text and attribute values, one line at a time
  const starts = lineStarts(text);
  for (let n = 0; n < starts.length; n++) {
    const line = text.slice(starts[n], n + 1 < starts.length ? starts[n + 1] - 1 : text.length);
    if (line.trim()) check(line, (k) => starts[n] + k, sink);
  }
  return finish(src, file, found);
}

// Template JSON: every string value (keys are names, not copy). Shopify allows a leading /* */ note.
export function lintTemplateJson(src, file = 'inline.json') {
  const found = [];
  const text = maskAll(src, /\/\*[\s\S]*?\*\//g);
  for (const m of text.matchAll(/"((?:[^"\\]|\\.)*)"(\s*:)?/g)) {
    if (m[2]) continue;
    let value;
    try { value = JSON.parse(`"${m[1]}"`); } catch { continue; }
    check(value, () => m.index + 1, (f) => found.push(f));
  }
  return finish(src, file, found);
}

// ----------------------------------------------------------------- the tree
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)])) : []);

export function deliveredFiles(root = repo) {
  const theme = path.join(root, 'shopify');
  const liquid = ['sections', 'snippets', 'templates', 'layout', 'blocks'].flatMap((d) => walk(path.join(theme, d))).filter((f) => f.endsWith('.liquid'));
  const js = walk(path.join(theme, 'assets')).filter((f) => /^hs.*\.js$/.test(path.basename(f)) || OWNED_ASSETS.includes(path.basename(f)));
  const json = walk(path.join(theme, 'templates')).filter((f) => f.endsWith('.json'));
  return [...liquid, ...js, ...json].sort();
}

export function lintTree(root = repo) {
  const offenses = [];
  for (const f of deliveredFiles(root)) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    const src = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.liquid')) offenses.push(...lintLiquid(src, rel));
    else if (f.endsWith('.js')) offenses.push(...lintJs(src, rel));
    else offenses.push(...lintTemplateJson(src, rel));
  }
  return offenses.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
}

// ----------------------------------------------------------------- baseline
// A baseline entry names the rule, the file and the excerpt, not the line, so moving code around
// does not turn a known offense into a new one.
export const keyOf = (o) => `${o.rule} ${o.file} ${o.excerpt}`;
export function compareBaseline(offenses, known) {
  const left = new Map();
  for (const k of known) left.set(k, (left.get(k) || 0) + 1);
  const tagged = offenses.map((o) => {
    const k = keyOf(o);
    const isKnown = (left.get(k) || 0) > 0;
    if (isKnown) left.set(k, left.get(k) - 1);
    return { ...o, known: isKnown };
  });
  const resolved = [...left].flatMap(([k, n]) => Array(Math.max(0, n)).fill(k));
  return { tagged, introduced: tagged.filter((o) => !o.known).length, resolved };
}

// ---------------------------------------------------------------------- CLI
function main(argv) {
  const opt = (name) => {
    const i = argv.indexOf(name);
    if (i < 0) return null;
    const next = argv[i + 1];
    return next && !next.startsWith('--') ? path.resolve(next) : DEFAULT_BASELINE;
  };
  const rootAt = argv.indexOf('--root');
  const root = rootAt > -1 ? path.resolve(argv[rootAt + 1]) : repo;
  const offenses = lintTree(root);
  const counts = Object.fromEntries(RULES.map((r) => [r.id, 0]));
  for (const o of offenses) counts[o.rule]++;
  const summary = RULES.map((r) => `${r.id} ${counts[r.id]}`).join(', ');

  const writeTo = opt('--write-baseline');
  if (writeTo) {
    const note = `Copy offenses already in the theme when copy lint started (${new Date().toISOString().slice(0, 10)}). CI runs copy-lint.mjs --baseline, which fails only on offenses not listed here. Remove an entry when its copy is fixed; never add one for new copy.`;
    fs.writeFileSync(writeTo, JSON.stringify({ note, known: offenses.map(keyOf) }, null, 2) + '\n');
    console.log(`wrote ${offenses.length} offenses to ${path.relative(process.cwd(), writeTo) || writeTo} (${summary})`);
    return 0;
  }

  const baselineFile = opt('--baseline');
  if (baselineFile) {
    const known = JSON.parse(fs.readFileSync(baselineFile, 'utf8')).known || [];
    const { tagged, introduced, resolved } = compareBaseline(offenses, known);
    for (const o of tagged) console.log(`${o.file}:${o.line}: ${o.rule}: ${o.excerpt}${o.known ? ' (known)' : ' (introduced)'}`);
    for (const k of resolved) console.log(`resolved, can leave the baseline: ${k}`);
    console.log(`${introduced ? 'FAIL' : 'ok  '} ${introduced} introduced, ${offenses.length - introduced} known copy offenses (${summary})`);
    return introduced ? 1 : 0;
  }

  for (const o of offenses) console.log(`${o.file}:${o.line}: ${o.rule}: ${o.excerpt}`);
  console.log(`${offenses.length ? 'FAIL' : 'ok  '} ${offenses.length} copy offenses (${summary})`);
  return offenses.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
