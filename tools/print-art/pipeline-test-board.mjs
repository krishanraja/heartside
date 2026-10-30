// The tone pipeline test board (v15, 29 Oct). Krish: "with what we know about each breed in the corpus
// plus all the data inputs by then, we should be able to draw on some stereotypes and exaggerations and
// parodies". Six corpus archetypes, one breed and one style each, every one in all four tones, all on
// the portrait so the tones compare like for like. Each case is what a buyer would tap in the journey,
// run through the store's own path: HSBreeds.lookup for the breed, characterFor for its archetype,
// HSBrief.toyWords for the toys, then nativePrompt(format) filled by nativeFieldValues(), exactly as the
// storefront fills it. The board prompt is the proposal, with both ruling switches on
// (recipes.brief.character.rulings); the control prompt beside it is v15 as it ships, switches off, for
// an A/B look. No network and no generation: it writes the board for Krish's yes on its count.
//
//   node tools/print-art/pipeline-test-board.mjs [--check]
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {recipes, characterFor, composeScene} from './artwork-system.mjs';
import {nativePrompt, nativeFieldValues} from './native-candidate.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = root + 'design/pipeline-test-board/';
const require = createRequire(import.meta.url);
const {brief, toyWords} = require(root + 'shopify/assets/hs-brief.js');
const breedsWindow = {};
vm.runInNewContext(readFileSync(root + 'shopify/assets/hs-breeds.js', 'utf8'), {window: breedsWindow, self: breedsWindow});
const HSBreeds = breedsWindow.HSBreeds;

// What an example buyer taps for each archetype. The taps are chosen so each archetype's own take
// reaches the comic tones; the photo is a real photo the growth session sources under a free licence.
export const DOGS = [
  {id: 'retriever', archetype: 'Retriever', breed: 'Golden Retriever', pronoun: 'she', style: 'painterly', home: 'toy', spot: 'couch', together: 'coffee', meaning: 'best', toys: ['a tennis ball'], wears: 'a bandana'},
  {id: 'terrier', archetype: 'Terrier Menace', breed: 'Jack Russell Terrier', pronoun: 'he', style: 'comic', home: 'spin', spot: 'couch', together: 'walk', meaning: 'boss', toys: ['a squeaky toy'], wears: 'a collar'},
  {id: 'sighthound', archetype: 'Sighthound Sofa Missile', breed: 'Greyhound', pronoun: 'she', style: 'screenprint', home: 'cool', spot: 'couch', together: 'naps', meaning: 'shadow', toys: ['a stuffed toy'], wears: 'a sweater'},
  {id: 'scent', archetype: 'Scent Detective', breed: 'Beagle', pronoun: 'he', style: 'ink', home: 'door', spot: 'feet', together: 'walk', meaning: 'best', toys: ['a rope toy'], wears: 'a harness'},
  {id: 'herding', archetype: 'Herding Manager', breed: 'Border Collie', pronoun: 'she', style: 'collage', home: 'door', spot: 'anywhere', together: 'walk', meaning: 'shadow', toys: ['a frisbee'], wears: 'a bandana'},
  {id: 'spitz', archetype: 'Spitz Commentator', breed: 'Siberian Husky', pronoun: 'he', style: 'cinematic', home: 'cool', spot: 'bed', together: 'movie', meaning: 'boss', toys: ['a big stick'], wears: 'a harness'}
];
export const TONES = ['sentimental', 'warm', 'hilarious', 'over_the_top'];
const FORMAT = 'portrait', SIZE = '1024x1536';

// The switches are Krish's to set; the board shows his choice painted. Restored after every case.
function withRulings(on, fn) {
  const rulings = recipes.brief.character.rulings, saved = {...rulings};
  for (const k of Object.keys(rulings)) rulings[k] = on;
  try { return fn(); } finally { Object.assign(rulings, saved); }
}
function fill(fields) {
  return nativePrompt(FORMAT).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(fields, key)) throw new Error('Unknown field ' + key);
    return fields[key];
  });
}
export function boardCases() {
  return DOGS.flatMap(dog => TONES.map(tone => {
    const archetype = characterFor(HSBreeds.lookup(dog.breed));
    if (archetype !== dog.archetype) throw new Error(dog.breed + ' resolves to ' + archetype + ', not ' + dog.archetype);
    const input = {style: dog.style, tone, format: FORMAT, breed: dog.breed, pronoun: dog.pronoun, archetype, home: dog.home, spot: dog.spot,
      together: dog.together, meaning: dog.meaning, toys: toyWords({...dog, tone}), accessory: dog.wears};
    const run = on => withRulings(on, () => {
      const fields = nativeFieldValues(input), scene = composeScene(input);
      const short = scene && scene.pick && (scene.pick.source === 'archetype' || /^(home|meaning)$/.test(scene.pick.slot)) ? scene.pick.short : '';
      return {fields, prompt: fill(fields), scene: scene && scene.pick ? {slot: scene.pick.slot, answer: dog[scene.pick.slot], source: scene.pick.source, score: scene.pick.score} : null,
        brief: brief({...dog, tone, scene: short ? short.replace(/\{toy\}/g, scene.pick.key === 'brings' ? '' : '') : ''})};
    });
    const proposed = run(true), control = run(false);
    const id = [dog.id, tone].join('-');
    return {id, archetype, breed: dog.breed, style: recipes.styles[dog.style].label, tone: recipes.tones[tone].label, format: FORMAT, size: SIZE,
      taps: {home: dog.home, spot: dog.spot, together: dog.together, meaning: dog.meaning, toys: dog.toys, wears: dog.wears, pronoun: dog.pronoun},
      scene: proposed.scene, brief: proposed.brief, fields: proposed.fields, control_differs: control.prompt !== proposed.prompt,
      prompt_file: 'design/pipeline-test-board/prompts/' + id + '.txt', control_file: 'design/pipeline-test-board/control/' + id + '.txt',
      output: 'design/pipeline-test-board/out/' + id + '.png', prompt: proposed.prompt, control: control.prompt};
  }));
}

export function boardFiles() {
const cases = boardCases();
const files = {'board.json': JSON.stringify({about: 'The tone pipeline test board, 29 October 2026. Generated by tools/print-art/pipeline-test-board.mjs; do not edit by hand. Nothing is painted until Krish says yes to the count. Every image is an Example and a person reviews it before use.',
  recipe_version: recipes.version, count: cases.length, rulings_on_board: Object.keys(recipes.brief.character.rulings),
  cases: cases.map(({prompt, control, ...rest}) => rest)}, null, 2) + '\n'};
for (const c of cases) { files['prompts/' + c.id + '.txt'] = c.prompt + '\n'; files['control/' + c.id + '.txt'] = c.control + '\n'; }
return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = boardFiles(), cases = boardCases();
  if (process.argv.includes('--check')) {
    const stale = Object.entries(files).filter(([name, body]) => !existsSync(out + name) || readFileSync(out + name, 'utf8') !== body).map(([name]) => name);
    if (stale.length) { console.error('stale: ' + stale.join(', ') + '\nrun node tools/print-art/pipeline-test-board.mjs'); process.exit(1); }
    console.log('ok   ' + cases.length + ' test board cases are fresh');
  } else {
    mkdirSync(out + 'prompts', {recursive: true}); mkdirSync(out + 'control', {recursive: true});
    for (const [name, body] of Object.entries(files)) writeFileSync(out + name, body);
    console.log('wrote ' + cases.length + ' test board cases to design/pipeline-test-board/');
  }
}
