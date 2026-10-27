// What a buyer reads under "What I'll paint" (27 Oct review): the chip facts carry instructions for
// the image model after a semicolon, which the buyer must never see; the image model still gets
// them in full; words the buyer typed are shown exactly as typed, semicolons and all.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window: {}};
vm.runInNewContext(readFileSync(new URL('../../shopify/assets/hs-artwork-profile.js', import.meta.url), 'utf8'), ctx);
const P = ctx.window.HSArtworkProfile;

test('chip facts lose the model instructions on screen and keep them for the painting', () => {
  const chat = {home: 'spin', follow: 'dizzy', spot: 'bed', together: 'coffee'};
  assert.deepEqual([...P.forBuyer(chat)], ['Spins when their person comes home.', 'Spins until dizzy.', "Rests on their person's side of the bed.", 'Keeps their person company during coffee.']);
  const sent = JSON.parse(P.serialize(P.fromChat(chat))).facts.map(f => f.text);
  assert.ok(sent.includes('Spins until dizzy; do not depict distress.'), 'the image model still gets the instruction');
  assert.deepEqual([...P.forBuyer({home: 'toy', follow: 'same'})], ['Brings an object when their person comes home.', 'Brings the same toy each time.']);
  for (const shown of P.forBuyer({home: 'toy', follow: 'closest', together: 'coffee', spot: 'feet'})) assert.doesNotMatch(shown, /unspecified|depict|was stated|;/);
});

test('typed words are shown as typed', () => {
  const chat = {home: 'typed', typed: {home: 'Steals socks; only the left one'}, toy: 'Green hedgehog; squeaks'};
  assert.deepEqual([...P.forBuyer(chat)], ['Steals socks; only the left one', 'Green hedgehog; squeaks']);
});
