// Every combination a buyer can tap makes one clean painting brief (shopify/assets/hs-brief.js, 29 Oct).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { brief, TOYS, WEARS } = require('../../shopify/assets/hs-brief.js');
const BREEDS = ['Labrador Retriever', 'Golden Retriever', 'French Bulldog', 'Dachshund', 'Poodle', 'Goldendoodle', 'German Shepherd', 'Beagle', 'Pug', 'Border Collie', 'Mixed', 'Australian Shepherd'];
const TOGETHER = ['walk', 'coffee', 'movie', 'naps', 'car'], SPOT = ['feet', 'bed', 'couch', 'anywhere'], MEANING = ['shadow', 'best', 'hard', 'boss'];
const TOYSETS = [[]].concat(TOYS.map((t) => [t]));
TOYS.forEach((a, i) => TOYS.slice(i + 1).forEach((b) => TOYSETS.push([a, b])));
const COAT = /\b(muzzle|grey|gray|chestnut|brindle|merle|fawn|black|white|brown|golden(?! retriever)|tan|spotted)\b/i;
let n = 0, longest = '';
for (const breed of BREEDS) for (const pronoun of ['he', 'she', 'they']) for (const tone of ['sentimental', 'warm', 'hilarious', 'over_the_top'])
  for (const together of TOGETHER) for (const spot of SPOT) for (const meaning of MEANING) for (const toys of TOYSETS) for (const wears of WEARS.concat(['']))
  {
    const s = brief({ breed, pronoun, tone, together, spot, meaning, toys, wears });
    n++;
    if (s.length > longest.length) longest = s;
    assert.ok(s.length <= 220, s);
    assert.match(s, /^(Tender|Cheerful|Comic|Over-the-top) portrait: an? [A-Za-z -]+/, s);
    assert.ok(!/ {2}|,,| ,|\.\.|,\./.test(s) && s.endsWith('.'), s);
    assert.ok(!COAT.test(s.replace(/Golden Retriever|Goldendoodle/, '')), s);
    for (const t of toys) assert.ok(s.includes(t.split(' ').pop().replace('treats', 'treat')), t + ' missing: ' + s);
    const words = s.toLowerCase().match(/[a-z']+/g);
    for (let i = 0; i + 3 <= words.length; i++) assert.equal(s.toLowerCase().split(words.slice(i, i + 3).join(' ')).length - 1 <= 1 || /^(at|in|their|his|her)$/.test(words[i]), true, 'repeated phrase: ' + s);
    if (wears) assert.ok(s.includes(wears.replace(/^a /, '')), s);
    assert.ok(!/\bhis\b|\bher\b|\btheir\b/.test(s) || s.includes({ he: 'his', she: 'her', they: 'their' }[pronoun]), s);
  }
console.log('all ' + n + ' combinations make one clean sentence; longest ' + longest.length + ' characters:\n' + longest);
