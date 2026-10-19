// Put the HS company note ("Heartside is a Mindmaker LLC company. Mindmaker Ltd in the UK.")
// last in the theme's footer group, under Helio's copyright row. Everything else in the group
// stays as it is. Used by .github/workflows/shopify-theme-push.yml when "footer_company_note"
// is ticked (Krish's ruling, 19 Oct 2026).
//
//   node .github/scripts/footer-note.mjs path/to/sections/footer-group.json
import fs from 'node:fs';

const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const group = JSON.parse(raw.slice(comment.length));
const sections = group.sections || {};
let order = group.order || Object.keys(sections);
const changes = [];

let note = Object.keys(sections).find((id) => sections[id].type === 'hs-company-note');
if (!note) {
  note = 'hs_company_note';
  sections[note] = { type: 'hs-company-note', settings: {} };
  changes.push('added the company note');
} else if (sections[note].disabled) {
  delete sections[note].disabled;
  changes.push('switched the company note back on');
}
if (order[order.length - 1] !== note) changes.push('moved the company note to the bottom of the footer');
order = [...order.filter((x) => x !== note), note];

group.sections = sections;
group.order = order;
fs.writeFileSync(file, (comment ? comment + '\n' : '') + JSON.stringify(group, null, 2) + '\n');
console.log(changes.length ? changes.join('\n') : 'Footer group already ends with the company note. Nothing to change.');
