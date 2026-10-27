// Put Heartside's own footer (sections/hs-footer.liquid) in the theme's footer group and switch
// off Helio's footer sections and the HS company note (Krish's ruling, 27 Oct 2026: the footer is
// replaced by our own quiet one). Nothing is deleted, so the theme editor can switch any of them
// back on. The ids it switched off go into the new footer's "switched_off" setting, so --restore
// switches exactly those back on and removes the footer it added: the group comes back as it was.
// App sections are left alone. Running it twice changes nothing. Used by
// .github/workflows/shopify-theme-push.yml when "footer_heartside" is ticked.
//
//   node .github/scripts/footer-heartside.mjs path/to/sections/footer-group.json
//   node .github/scripts/footer-heartside.mjs path/to/sections/footer-group.json --restore
import fs from 'node:fs';

const file = process.argv[2];
const restore = process.argv.includes('--restore');
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const body = raw.slice(comment.length);
const stop = (why) => { console.log(`::error::${file}: ${why} Nothing was changed.`); process.exit(1); };
let group;
try { group = JSON.parse(body); } catch (e) { stop('is not JSON.'); }
const sections = group && group.sections;
if (!group || typeof group !== 'object' || Array.isArray(group) || group.type !== 'footer'
  || !sections || typeof sections !== 'object' || Array.isArray(sections) || !Array.isArray(group.order)
  || Object.values(sections).some((s) => !s || typeof s !== 'object' || typeof s.type !== 'string')) {
  stop('is not a footer section group ("type": "footer", "sections" and "order").');
}

const ID = 'hs_footer';
const ours = (s) => s.type === 'hs-footer';
// Helio's own sections; ours start with hs, and app sections are not Helio's footer
const helio = (s) => !/^hs[\d-]/.test(s.type) && !/^shopify:\/\//.test(s.type) && s.type !== 'apps';
const changes = [];

if (restore) {
  const id = Object.keys(sections).find((k) => ours(sections[k]) && (sections[k].settings || {}).switched_off !== undefined);
  if (!id) { console.log('No footer added by this script in the group. Nothing to restore.'); process.exit(0); }
  for (const off of String(sections[id].settings.switched_off).split(',').filter(Boolean)) {
    if (sections[off] && sections[off].disabled) { delete sections[off].disabled; changes.push(`switched ${off} (${sections[off].type}) back on`); }
  }
  if (id === ID) {
    delete sections[id];
    group.order = group.order.filter((k) => k !== id);
    changes.push(`removed the HS footer (${id})`);
  } else {
    delete sections[id].settings.switched_off;
  }
} else {
  let id = Object.keys(sections).find((k) => ours(sections[k]));
  if (!id) {
    id = ID;
    sections[id] = { type: 'hs-footer', settings: { switched_off: '' } };
    group.order.push(id);
    changes.push('added the HS footer');
  } else if (sections[id].disabled) {
    delete sections[id].disabled;
    changes.push('switched the HS footer back on');
  }
  const settings = sections[id].settings || (sections[id].settings = {});
  const record = String(settings.switched_off || '').split(',').filter(Boolean);
  for (const [k, s] of Object.entries(sections)) {
    if (k === id || s.disabled || !(helio(s) || s.type === 'hs-company-note')) continue;
    s.disabled = true;
    if (!record.includes(k)) record.push(k);
    changes.push(`switched off ${k} (${s.type})`);
  }
  settings.switched_off = record.join(',');
}

// Shopify writes "/" as "\/" and < > & as \u003c \u003e \u0026; keep its style when the file
// has it, so a restore gives back the very bytes the theme had
let json = JSON.stringify(group, null, 2);
if (/\\\/|\\u003[ce]|\\u0026/.test(body)) json = json.replace(/\//g, '\\/').replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
fs.writeFileSync(file, (comment ? comment + '\n' : '') + json + '\n');
console.log(changes.length ? changes.join('\n') : restore ? 'Nothing to switch back on.' : 'The footer group already shows the HS footer only. Nothing to change.');
