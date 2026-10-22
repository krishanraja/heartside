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

// 1. the width table agrees with the shaped font (measured at 70 px; the mug prints at 58 px
// since 22 Oct, Krish's option A for 60-character lines, so widths scale by 58/70)
const measured = {
  'Steals your side of the bed.': 857.5, 'Naps best when you are there.': 967.6,
  'Guards your slippers on the bottom stair.': 1324.6, 'Your best friend, no contest.': 905.2,
  'Waits at the door for you, weekends too.': 1290.2, "Will ride anywhere, as long as it's with you.": 1376.8,
  'Lives for our morning walks.': 927.2
};
for (const [t, w70] of Object.entries(measured)) { const w = w70 * 58 / 70; ok(Math.abs(api.noteWidth(t) - w) < 1.5, `width ${api.noteWidth(t).toFixed(1)} px vs ${w.toFixed(1)} px: "${t}"`); }

// 2. even breaks: one row where it fits, two balanced rows for a 60-character line
const breaks = {
  'Steals your side of the bed.': 'Steals your side of the bed.',
  'Sleeps on your feet.': 'Sleeps on your feet.',
  "I'm at the door before your key is even out of your pocket.": "I'm at the door before your\nkey is even out of your pocket.",
  "We walk till I've had my three throws, and not before, okay.": "We walk till I've had my three\nthrows, and not before, okay."
};
for (const [t, want] of Object.entries(breaks)) ok(api.evenBreak(t) === want, `break: ${JSON.stringify(api.evenBreak(t))}`);

// 3. the mug's lines up to 60 characters: every row fits 860 px, at most two rows, no lone word
const mugLines = [
  'I wait by the door for you, weekends too.', "I'm at the door every weekday, waiting.", 'I hear your car long before anyone else.',
  "I bring you the same toy, because it's ours.", 'I bring you whatever I can find, with love.', 'I bring you a shoe so you know I missed you.',
  "When you come home, I can't help a spin.", 'You come home and I spin until I lose count.', "I spin until I'm dizzy because you're home.",
  'I act cool, then follow you everywhere.', "I play it cool until I'm in your lap.", 'I act cool, then sigh until you look at me.',
  'Your feet make the best pillow I know.', 'I took your side of the bed to keep it warm.', 'I keep your spot on the couch warm for you.',
  'Wherever you go, I go, even the bathroom.', "I'm your shadow, and I like it that way.", "You're my best friend, and I'm yours.",
  "I'm at the door before your key is even out of your pocket.", 'I took the couch beside you because I have good taste, dear.',
  "We walk till I've had my three throws, and not before, okay.", "I've sniffed a lot of dogs, and I'd still pick you, always.",
  "I've met other dogs, and you're still my whole job, KJ's dog."
];
for (const t of mugLines) {
  const rows = api.evenBreak(t).split('\n');
  const widths = rows.map((r) => api.noteWidth(r));
  const fits = rows.length <= 2 && widths.every((w) => w <= 860);
  const noOrphan = rows.length === 1 || rows.every((r) => r.includes(' ') || r.length > 8);
  ok(fits && noOrphan && api.evenBreak(t).replace(/\n/g, ' ') === t, `${rows.join(' / ')}  (${widths.map((w) => Math.round(w)).join(' + ')} px)`);
}
// the widest possible 60-character line
const wide = 'WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW WWWWW.';
const wr = api.evenBreak(wide).split('\n');
// no real sentence is this wide; Teeinblue shrinks it to fit, so this only reports
console.log(`note stress line: ${wr.length} rows, widest ${Math.round(Math.max(...wr.map((r) => api.noteWidth(r))))} px (Teeinblue shrinks to fit)`);
ok(wr.length <= 3, 'stress line breaks into at most three rows');

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
