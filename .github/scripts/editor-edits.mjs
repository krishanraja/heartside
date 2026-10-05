// Compares each repo template with the copy the theme holds now, before a push overwrites it.
// A store copy that matches a committed version is our own earlier deploy. Anything else was
// edited in the theme editor, and the file name goes into editor-edits.txt so the push stops.
//
// Usage: node .github/scripts/editor-edits.mjs [backupDir]   (default: backup)
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const backup = process.argv[2] || 'backup';
const parse = (t) => { try { return JSON.parse(t.replace(/^\s*\/\*[\s\S]*?\*\//, '')); } catch (e) { return null; } };

// The editor writes every setting out when it saves, defaults included. Those are not edits,
// so drop any value that equals the section's schema default. The store's own copy of the
// section decides the default (that is what the editor wrote), and the repo's is the fallback.
const schemas = {};
const schemaOf = (type) => {
  if (type in schemas) return schemas[type];
  schemas[type] = null;
  for (const p of [`${backup}/sections/${type}.liquid`, `shopify/sections/${type}.liquid`]) {
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema/);
    if (m) { try { schemas[type] = JSON.parse(m[1]); break; } catch (e) {} }
  }
  return schemas[type];
};
const defaultsOf = (list) => Object.fromEntries((list || []).filter((s) => s.id).map((s) => [s.id, s.default]));
const strip = (settings, defs) => {
  if (!settings || !defs) return settings;
  const out = {};
  for (const [k, v] of Object.entries(settings)) {
    const d = defs[k];
    if (v === d || (d === undefined && (v === '' || v === null))) continue;
    out[k] = v;
  }
  return out;
};
const withoutDefaults = (tpl) => {
  if (!tpl || !tpl.sections) return tpl;
  const t = structuredClone(tpl);
  for (const s of Object.values(t.sections)) {
    const schema = schemaOf(s.type);
    if (!schema) continue;
    s.settings = strip(s.settings, defaultsOf(schema.settings));
    for (const b of Object.values(s.blocks || {})) {
      if (String(b.type).startsWith('shopify://')) continue; // app blocks keep every setting
      const bs = (schema.blocks || []).find((x) => x.type === b.type);
      if (bs) b.settings = strip(b.settings, defaultsOf(bs.settings));
    }
  }
  return t;
};

// Shopify also adds empty "settings": {} and reorders keys when it saves, so compare the substance
const norm = (v) => Array.isArray(v) ? v.map(norm) : v && typeof v === 'object'
  ? Object.keys(v).sort().reduce((o, k) => { const n = norm(v[k]); if (!(n && typeof n === 'object' && !Array.isArray(n) && !Object.keys(n).length)) o[k] = n; return o; }, {})
  : v;
const key = (v) => JSON.stringify(norm(withoutDefaults(v)));

let edited = 0;
for (const f of fs.readdirSync('shopify/templates')) {
  const path = 'shopify/templates/' + f;
  const store = fs.existsSync(`${backup}/templates/${f}`) ? parse(fs.readFileSync(`${backup}/templates/${f}`, 'utf8')) : null;
  if (!store) { console.log(`templates/${f}: new to this theme`); continue; }
  // every version of this template that was ever committed, newest first
  const shas = execSync(`git log --format=%H -n 60 -- ${path}`).toString().trim().split('\n').filter(Boolean);
  const known = new Set(shas.map((sha) => { try { return key(parse(execSync(`git show ${sha}:${path}`).toString())); } catch (e) { return ''; } }));
  const now = key(parse(fs.readFileSync(path, 'utf8')));
  if (key(store) === now) console.log(`templates/${f}: unchanged`);
  else if (known.has(key(store))) console.log(`templates/${f}: updated from an earlier deploy, no theme-editor edits`);
  else { edited++; console.log(`::warning::templates/${f} was edited in the theme editor and the repo does not have those edits yet.`); fs.appendFileSync('editor-edits.txt', f + '\n'); }
}
if (!edited) console.log('No theme-editor edits to lose.');
