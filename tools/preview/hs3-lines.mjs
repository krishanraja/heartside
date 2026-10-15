// The mug note's even line breaks and the typed-line rule, run on the real hs3.js in Node
// (no browser):   cd tools/preview && node hs3-lines.mjs
// Widths below were measured with Pillow + raqm on tools/fonts/HS-Fraunces-Text.ttf at 70 px.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, '..', '..', 'shopify', 'assets', 'hs3.js'), 'utf8');
const store = {};
const window = {
  sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  matchMedia: () => ({ matches: false }), crypto: { getRandomValues: (a) => a }
};
const document = { readyState: 'complete', querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
vm.runInNewContext(code, { window, document, setTimeout, clearTimeout, URLSearchParams, console });
const api = window.__hs3api;
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failures++; };

// 1. the width table agrees with the shaped font
const measured = {
  'Steals your side of the bed.': 857.5, 'Naps best when you are there.': 967.6,
  'Guards your slippers on the bottom stair.': 1324.6, 'Your best friend, no contest.': 905.2,
  'Waits at the door for you, weekends too.': 1290.2, "Will ride anywhere, as long as it's with you.": 1376.8,
  'Lives for our morning walks.': 927.2
};
for (const [t, w] of Object.entries(measured)) ok(Math.abs(api.noteWidth(t) - w) < 1.5, `width ${api.noteWidth(t).toFixed(1)} px vs ${w} px: "${t}"`);

// 2. even breaks: Cowork's examples, and one row where it fits
const breaks = {
  'Naps best when you are there.': 'Naps best when\nyou are there.',
  'Guards your slippers on the bottom stair.': 'Guards your slippers\non the bottom stair.',
  'Your best friend, no contest.': 'Your best friend,\nno contest.',
  'Steals your side of the bed.': 'Steals your side of the bed.',
  'Sleeps on your feet.': 'Sleeps on your feet.'
};
for (const [t, want] of Object.entries(breaks)) ok(api.evenBreak(t) === want, `break: ${JSON.stringify(api.evenBreak(t))}`);

// 3. every chip line on the mug, and the 45-character limit: each row fits 860 px, no lone word
const chipLines = [
  'Waits at the door for you, weekends too.', 'Waits at the door for you every weekday.', 'Hears your car before anyone else does.',
  'Brings you the same toy every time.', 'Brings you a present every time you get home.', 'Greets you at the door with one of your shoes.',
  'Does a happy little spin when you get home.', 'Spins in circles every time you get home.', 'Spins until dizzy every time you get home.',
  'Plays it cool, then follows you everywhere.', 'Plays it cool, then climbs onto your lap.', 'Plays it cool, then sighs until you look.',
  'Waits at the door for you.', 'Brings you a toy when you get home.', 'Spins in circles when you get home.', 'Plays it cool when you get home.',
  'Always happy to see you.', 'Sleeps on your feet.', 'Steals your side of the bed.', 'Saves your spot on the couch.', 'Goes wherever you go.',
  'Never far from you.', 'Your shadow, always.', 'Your best friend, no contest.', 'Here for every hard day.', 'Runs the house. Loves you most.', 'Yours, always.',
  "Will ride anywhere, as long as it's with you.", 'Wwwwwwwwwwwwwwwwwwwwww wwwwwwwwwwwwwwwwwwwwww'
];
for (const t of chipLines) {
  const rows = api.evenBreak(t).split('\n');
  const widths = rows.map((r) => api.noteWidth(r));
  const fits = rows.length <= 2 && (widths.every((w) => w <= 860) || t.startsWith('Wwww'));
  const noOrphan = rows.length === 1 || rows.every((r) => r.includes(' ') || r.length > 8);
  ok(fits && noOrphan && api.evenBreak(t).replace('\n', ' ') === t, `${rows.join(' / ')}  (${widths.map((w) => Math.round(w)).join(' + ')} px)`);
}

// 4. typed lines read like the chip lines (five typed answers), never "I"
api.state().dog = 'Biscotti';
const typed = [
  ['He howls until you sit on the sofa.', 'spot', 'Howls until you sit on the sofa.'],
  ['She sits in the window from 5pm.', 'home', 'Sits in the window from 5pm.'],
  ['Biscotti steals your socks every morning.', 'together', 'Steals your socks every morning.'],
  ["They're always at the door for you.", 'home', 'Always at the door for you.'],
  ['She is your shadow.', 'meaning', 'Your shadow.'],
  ['he follows you room to room.', 'spot', 'Follows you room to room.'],
  ['Waits until he hears your car.', 'home', 'Waits until he hears your car.'],
  ["Biscotti's bed is your pillow.", 'spot', "Biscotti's bed is your pillow."],
  ['I take him on walks every morning.', 'together', 'You take him on walks every morning.'],
  ['He loves my slippers.', 'spot', 'Loves your slippers.'],
  ["When I'm home he follows me.", 'home', "When you're home he follows you."],
  ['i', 'home', 'You'],
  ['Lives for our morning walks.', 'together', 'Lives for our morning walks.']
];
for (const [line, key, want] of typed) ok(api.chipStyle(line, key) === want, `typed "${line}" -> "${api.chipStyle(line, key)}"`);

console.log(failures ? `${failures} FAILED` : 'all passed');
process.exit(failures ? 1 : 0);
