// Switch off Helio's email signup ("Keep an eye on us") in the theme's footer group. Krish,
// 21 Oct 2026: "get rid of the Keep an eye on us section at the bottom, no need for it". It is
// disabled, not deleted, so the theme editor can switch it back on. Everything else in the group
// stays as it is. Used by .github/workflows/shopify-theme-push.yml when "footer_remove_signup"
// is ticked.
//
//   node .github/scripts/footer-signup.mjs path/to/sections/footer-group.json
import fs from 'node:fs';

const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const group = JSON.parse(raw.slice(comment.length));
const sections = group.sections || {};

// the live one is section_Ldcdxw; match on its words or an email-signup block too, in case the
// theme editor ever recreates it under a new id
const isSignup = (id, sec) => id === 'section_Ldcdxw' || /keep an eye on us/i.test(JSON.stringify(sec)) || /email[-_]?signup|newsletter/i.test(JSON.stringify(sec.blocks || {}));
const changes = [];
for (const [id, sec] of Object.entries(sections)) {
  if (!isSignup(id, sec) || sec.type === 'hs-company-note' || /utilities/i.test(sec.type || '')) continue;
  if (sec.disabled) continue;
  sec.disabled = true;
  changes.push(`switched off ${id} (${sec.type})`);
}
fs.writeFileSync(file, (comment ? comment + '\n' : '') + JSON.stringify(group, null, 2) + '\n');
console.log(changes.length ? changes.join('\n') : 'No email signup is switched on in the footer. Nothing to change.');
