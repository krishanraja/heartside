// Builds the note writer's request bodies for the bench dogs, either as the old chat sent them
// ("before": chip ids and scripted draft lines) or as the rebuilt journey sends them ("after").
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = {window: {}};
vm.runInNewContext(fs.readFileSync(new URL('../../shopify/assets/hs-breeds.js', import.meta.url), 'utf8'), ctx);
const B = ctx.window.HSBreeds;
export const DOGS = JSON.parse(fs.readFileSync(new URL('./dogs.json', import.meta.url), 'utf8'));
const LINES = {
  home: {door: 'I wait by the door until you come home.', toy: "I bring you a present whenever you're back.", spin: "When you walk in, I spin like it's a party.", cool: 'I play it cool for about four seconds.'},
  spot: {feet: 'Your feet make the best pillow I know.', bed: 'I took your side of the bed to keep it warm.', couch: 'I keep your spot on the couch warm for you.', anywhere: 'Wherever you go, I go.'},
  together: {walk: 'Our walks are the best part of my day.', coffee: 'Coffee with you is the best part of my morning.', movie: 'Movie night is better with me beside you.', naps: 'My best naps are the ones next to you.', car: "Any car ride is a good one if you're in it."},
  meaning: {shadow: "I'm your shadow, and I like it that way.", best: "You're my best friend, and I'm yours.", hard: "On the hard days, I'll stay close to you.", boss: 'I run this house, but I love you most.'}
};
export const LABELS = {
  home: {door: 'waits at the door', toy: 'brings you something', spin: 'spins in circles', cool: 'plays it cool, for a second'},
  spot: {feet: 'on your feet', bed: 'your side of the bed', couch: 'the couch', anywhere: 'wherever you are'},
  together: {walk: 'walks', coffee: 'morning coffee', movie: 'movie nights', naps: 'naps', car: 'car rides'},
  meaning: {shadow: 'a shadow', best: 'a best friend', hard: 'there on hard days', boss: 'the boss of the house'}
};
const REL = {partner: 'your partner', mom: 'Mom', dad: 'Dad', friend: 'your friend', self: 'you'};
const KEYS = ['home', 'spot', 'together', 'meaning'];
function dogOf(d) { const r = B.lookup(d.breed); const o = {name: d.dog, pronoun: d.pro}; if (r && r.exact) { o.breed = r.name; o.tone = r.tone; } return o; }
export function before(d, tone) {
  const t = d.together, gift = t === 'movie' || t === 'naps' ? 'blanket' : t === 'walk' || t === 'coffee' ? 'mug' : 'print';
  return {session: 'benchb' + d.id + tone, dog: dogOf(d), recipient: {name: d.rel === 'self' ? '' : REL[d.rel], relation: d.rel},
    answers: ['home', 'home_follow', 'spot', 'together', 'meaning'].map((id) => ({id, chip: d[id] || null, label: '', typed: null})),
    current_lines: Object.fromEntries(KEYS.map((k) => [k, LINES[k][d[k]]])), default_gift: gift, note_tone: tone};
}
// the rebuilt journey: each tap as its words, the toy and what the dog wears as the owner's own
// words, and no draft lines to copy (the writer anchored on them)
export function after(d, tone) {
  const answers = KEYS.map((id) => ({id, chip: d[id], label: LABELS[id][d[id]], typed: null}));
  if (d.toy) answers.push({id: 'toy', chip: null, label: 'favorite toy or treat', typed: d.toy});
  if (d.accessory) answers.push({id: 'wears', chip: null, label: 'what the dog wears', typed: d.accessory});
  return {session: 'bencha' + d.id + tone, dog: dogOf(d), recipient: {name: d.rel === 'self' ? '' : REL[d.rel], relation: d.rel},
    answers, current_lines: {home: '', spot: '', together: '', meaning: ''}, default_gift: 'print', note_tone: tone};
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const which = process.argv[2] === 'after' ? after : before;
  for (const d of DOGS) for (const tone of ['sentimental', 'warm', 'hilarious']) console.log(JSON.stringify({id: d.id, tone, body: which(d, tone)}));
}
