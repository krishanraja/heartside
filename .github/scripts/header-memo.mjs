// Put the HS memo bar at the top of the theme's header group and retire the v1
// offer bar ("30% off and free US shipping until November 1."). Any other
// announcement bar is hidden, not deleted, so it can be switched back on in the
// theme editor. Used by .github/workflows/shopify-theme-push.yml when
// "header_memo_bar" is ticked.
//
//   node .github/scripts/header-memo.mjs path/to/sections/header-group.json
import fs from 'node:fs';

const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
// Shopify starts files it writes with a /* comment */, which JSON.parse rejects
const comment = (raw.match(/^\s*\/\*[\s\S]*?\*\//) || [''])[0];
const group = JSON.parse(raw.slice(comment.length));
const sections = group.sections || {};
let order = group.order || Object.keys(sections);
const changes = [];

for (const [id, s] of Object.entries(sections)) {
  if (s.type === 'hs-announcement') {
    delete sections[id];
    order = order.filter((x) => x !== id);
    changes.push(`removed the v1 offer bar (${id})`);
  } else if (/announcement/i.test(s.type) && !s.disabled) {
    s.disabled = true;
    changes.push(`hid "${s.type}" (${id}); switch it back on in the theme editor if wanted`);
  }
}

let memo = Object.keys(sections).find((id) => sections[id].type === 'hs2-memo');
if (!memo) {
  memo = 'hs2_memo';
  sections[memo] = { type: 'hs2-memo', settings: {} };
  changes.push('added the HS memo bar');
} else if (sections[memo].disabled) {
  delete sections[memo].disabled;
  changes.push('switched the HS memo bar back on');
}
if (order[0] !== memo) changes.push('moved the HS memo bar to the top');
order = [memo, ...order.filter((x) => x !== memo)];

group.sections = sections;
group.order = order;
fs.writeFileSync(file, (comment ? comment + '\n' : '') + JSON.stringify(group, null, 2) + '\n');
console.log(changes.length ? changes.join('\n') : 'Header group already has the memo bar on top. Nothing to change.');
