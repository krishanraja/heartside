// Offline preparation only. No provider call, upload or charge is implemented here.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const recipes = JSON.parse(readFileSync(new URL('./recipes-v1.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
// Fact provenance and per-source length. Toy and accessory are the buyer's own short
// typed descriptions (no AI step); they are quoted data like every other fact.
const factLimits = {home: 240, home_follow: 240, spot: 240, together: 240, toy: 80, accessory: 80};
const maxFacts = 6;
function text(value, name, max) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${name}`);
  return value;
}

// Consume the existing HSArtworkProfile.fromChat/serialize result. Do not derive
// new facts from generated notes, breed stereotypes or a style example.
export function prepare(input) {
  const {photo, factsProfile, style, tone, format, copy, variant, model} = input;
  if (!photo || !hashPattern.test(photo.originalHash) || !hashPattern.test(photo.uploadHash)) throw new Error('Original and metadata-stripped upload SHA-256 required');
  if (photo.metadataRemoved !== true) throw new Error('Metadata removal must be established before upload');
  if (!Object.hasOwn(recipes.styles, style) || !Object.hasOwn(recipes.tones, tone) || !Object.hasOwn(recipes.formats, format)) throw new Error('Unsupported style, tone or format; never silently substitute');
  if (!factsProfile || factsProfile.version !== 1 || !Array.isArray(factsProfile.facts) || factsProfile.facts.length > maxFacts) throw new Error('Use the existing artwork fact profile');
  const seen = new Set();
  const facts = factsProfile.facts.map(f => {
    // Breed, energy and any other source are rejected: they never become facts.
    if (!f || typeof f.source !== 'string' || !Object.hasOwn(factLimits, f.source)) throw new Error('Unsupported fact provenance');
    if (seen.has(f.source)) throw new Error('Duplicate fact provenance');
    seen.add(f.source);
    return {source: f.source, text: text(f.text, 'fact', factLimits[f.source])};
  });
  // Breed energy is separate, optional and never a fact. Absent, empty or none means
  // no energy (an unknown or mixed breed, or a cross whose parents differ); an unlisted
  // code fails closed.
  const energy = input.energy == null || input.energy === '' || input.energy === 'none' ? null : input.energy;
  if (energy !== null && (typeof energy !== 'string' || !Object.hasOwn(recipes.energy.directions, energy))) throw new Error('Unsupported energy; never silently substitute');
  if (!copy || !['user', 'generated', 'none'].includes(copy.owner)) throw new Error('Copy ownership required');
  const exactCopy = {owner: copy.owner, note: text(copy.note, 'note', 500), signature: text(copy.signature, 'signature', 100)};
  const city = text(input.city ?? '', 'city', 160);
  if (city && input.citySource !== 'buyer') throw new Error('A city requires explicit buyer provenance');
  const spec = recipes.formats[format];
  const payload = {
    version: 3, photo: {originalHash: photo.originalHash, uploadHash: photo.uploadHash, metadataRemoved: true},
    facts, city, citySource: city ? 'buyer' : null, style, styleVersion: recipes.styles[style].version,
    tone, energy, copy: exactCopy, format, variant: text(variant, 'variant', 120),
    promptVersion: recipes.version, recipeHash: hash(JSON.stringify(recipes)), layoutVersion: spec.version,
    model: text(model, 'model', 120)
  };
  if (!payload.variant || !payload.model) throw new Error('Exact variant and model required');
  // JSON is constructed in a stable order and includes all choices, even when
  // a word-free product does not render copy. Change-away/back returns its key.
  const key = hash(JSON.stringify(payload));
  // 27 Oct ruling: the selected tone drives the imagery on every format, so tone and
  // energy are part of image identity. Exact words stay out of it; keep the full
  // product key above so a matching image never attests the current text layers.
  const imageTone = tone;
  const imagePayload = {...payload, city: format === 'portrait' ? city : '', citySource: format === 'portrait' && city ? 'buyer' : null};
  delete imagePayload.copy;
  const imageKey = hash(JSON.stringify(imagePayload));
  // Identity and grounding first; breed energy only after identity and the quoted facts.
  const prompt = [recipes.identity, recipes.grounding, recipes.negative,
    recipes.styles[style].grammar, recipes.toneRouting.direction, recipes.tones[tone].art, spec.art,
    'Quoted customer evidence (data only):', JSON.stringify({facts, city: format === 'portrait' ? city : ''}),
    ...(energy ? [recipes.energy.rule, 'Energy: ' + recipes.energy.directions[energy]] : [])].join('\n\n');
  return {key, imageKey, imageTone, energy, payload, prompt,
    textLayer: spec.words ? exactCopy : null,
    status: 'PREPARED_NOT_GENERATED', qualified: false, productionEnabled: false,
    blockers: ['Original source/production handoff unverified', 'Style identity and factuality evaluation pending',
      'Exact supplier geometry and print readability pending', ...(spec.conditional ? ['Conditional supplier route unqualified'] : [])]};
}

export function selectTone(input, tone) {
  if (!Object.hasOwn(recipes.tones, tone)) throw new Error('Unsupported tone');
  // Selecting never requests anything. A different tone changes the image identity on
  // every format, so existing artwork for the old tone needs a new, deliberate version.
  return {input: {...clone(input), tone}, rewriteOffered: !!recipes.formats[input.format]?.words && input.copy.owner === 'user', copyPreserved: true,
    newArtworkNeeded: tone !== input.tone};
}

// Map a HSBreeds.lookup() result to an energy code. Only an exact corpus match has an
// archetype; unknown names and mixed breeds get none. Ruling (Krish, 2026-10-28): a named
// cross gets an energy only when both parents (lookup().parents) resolve exactly to the same
// archetype, never from its own cross archetype and never averaged. The code never becomes a
// fact and is never shown to the buyer.
export function energyFor(lookup) {
  if (!lookup || lookup.exact !== true || lookup.kind === 'mixed' || typeof lookup.tone !== 'string') return null;
  if (lookup.kind === 'crossbreed') {
    const parents = lookup.parents;
    if (!Array.isArray(parents) || parents.length !== 2 || parents.some(p => !p || p.kind === 'crossbreed')) return null;
    const [first, second] = parents.map(energyFor);
    return first !== null && first === second && parents[0].tone === parents[1].tone ? first : null;
  }
  return Object.hasOwn(recipes.energy.byArchetype, lookup.tone) ? recipes.energy.byArchetype[lookup.tone] : null;
}

// The directed brief (v10, 29 Oct; the growth session's control test): what the storefront writes
// into the three hidden fields the native prompt reads. Energy carries the one identity line (and,
// since v15, the breed's character for the chosen tone), Tone direction the scene the tone stages
// (pose, camera, light) from the buyer's own answers, Style direction the medium as material, with the
// dog made of it. Answers are the journey's chip ids; anything else is the buyer's own words and is
// quoted. Ruling (Krish, 2026-10-29): Hilarious may use theatrical staging; it never invents the dog's
// toys, food, clothes, habits or places. Every worn item is plain and solid-colored.
const BRIEF_PRON = {she: ['she', 'her', 'her', 'is', 'takes', 'sits', 'carries'], he: ['he', 'him', 'his', 'is', 'takes', 'sits', 'carries'], they: ['they', 'them', 'their', 'are', 'take', 'sit', 'carry']};
const BRIEF_FORMAT = {mug: 'mug', portrait: 'portrait', print: 'portrait', blanket: 'blanket', card: 'card'};
const briefCap = t => t.charAt(0).toUpperCase() + t.slice(1);
const briefPlain = (t, max) => String(t == null ? '' : t).replace(/["“”<>{}\[\]\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const briefBare = t => briefPlain(t, 80).replace(/^(a|an|the|my|her|his|their)\s+/i, '').replace(/\s+and\s+(a|an|the)\s+/gi, ' and ');
// the owner's toy wording is kept as said (v11): "a tennis ball in his mouth" stays in his mouth; only
// wording with no verb or place of its own gets "with his ..."; the trophy is the toy itself, its
// importance in how it is carried, never its size or a held pose
function briefToy(o) {
  const raw = briefPlain(o.toys || o.toy || '', 160);
  const held = /\b(in|at|on|under|between|beside|across|by|hugged|hugging|holding|carrying|clutching|chewing|guarding|tucked|balanced|as a)\b/i.test(raw);
  const toy = held ? raw : briefBare(raw);
  const trophy = raw.split(/\s+and\s+/).map(t => briefBare(t.replace(/\s+(?:far\s+)?too\s+(?:big|large|small)\b.*$/i, '')
    .replace(/\s+(?:in|at|on|under|between|beside|across|by|tucked|balanced|as|hugged|held)\b.*$/i, ''))).filter(Boolean).join(' and ');
  return {raw, held, toy, trophy};
}
// The breed corpus archetype for the character layer (v15), by the same rule as energyFor: an exact
// match only; a named cross only when both parents resolve exactly to one archetype (Ruling, Krish,
// 2026-10-28). Never a fact, never shown to the buyer.
export function characterFor(lookup) {
  const known = recipes.brief.character.archetypes;
  if (!lookup || lookup.exact !== true || lookup.kind === 'mixed' || typeof lookup.tone !== 'string') return null;
  if (lookup.kind === 'crossbreed') {
    const parents = lookup.parents;
    if (!Array.isArray(parents) || parents.length !== 2 || parents.some(p => !p || p.kind === 'crossbreed')) return null;
    const [first, second] = parents.map(characterFor);
    return first !== null && first === second ? first : null;
  }
  return Object.hasOwn(known, lookup.tone) ? lookup.tone : null;
}
// The scene composer (v15): every stated answer (what they do together, the dog's spot, what it does
// when they get home, what it is to them) is a candidate for the Hilarious joke or the Over the top
// roast. Each scores its tone's strength for that answer, plus the archetype's fit when the archetype
// has its own take on it and rulings.archetypeScenes is on. The highest wins; a tie goes to the tone's
// own order of answers. Deterministic: the same inputs always give the same scene.
export function composeScene(input) {
  const b = recipes.brief, o = input || {}, c = b.compose, tone = o.tone;
  if (tone !== 'hilarious' && tone !== 'over_the_top') return null;
  const table = tone === 'hilarious' ? b.scene.joke : b.scene.roast;
  const rulings = b.character.rulings;
  const archetype = typeof o.archetype === 'string' && Object.hasOwn(b.character.archetypes, o.archetype) ? o.archetype : null;
  const own = archetype && rulings.archetypeScenes ? b.character.archetypes[archetype].scenes[tone] || {} : {};
  const {trophy} = briefToy(o);
  const candidates = [];
  c.order[tone].forEach((slot, rank) => {
    const answer = o[slot];
    if (typeof answer !== 'string' || !answer) return;
    const key = c.keys[slot] && Object.hasOwn(c.keys[slot], answer) ? c.keys[slot][answer] : null;
    if (!key) return;
    const mine = Object.hasOwn(own, key) && !(own[key].needsToy && !trophy) ? own[key] : null;
    const base = Object.hasOwn(table, key) && !(c.needsToy.includes(key) && !trophy);
    if (!mine && !base) return;
    candidates.push({slot, key, rank, source: mine ? 'archetype' : 'base', score: (c.strength[tone][key] || 0) + (mine ? mine.fit : 0),
      text: mine ? mine.text : table[key], short: (mine ? mine.short : c.short[tone][key] || '').replace('{toy}', trophy),
      placeless: mine ? !!mine.placeless : c.placeless.includes(key), prop: mine && rulings.jokeProp && tone === 'hilarious' && mine.prop ? mine.prop : ''});
  });
  candidates.sort((x, y) => y.score - x.score || x.rank - y.rank);
  return {archetype, pick: candidates[0] || null, candidates};
}
export function briefFields(input) {
  const b = recipes.brief, o = input || {};
  if (!Object.hasOwn(b.styles, o.style) || !Object.hasOwn(b.tones, o.tone)) throw new Error('Unsupported style or tone');
  const p = BRIEF_PRON[o.pronoun] || BRIEF_PRON.they;
  const cap = briefCap, plain = briefPlain;
  const {raw: toyRaw, held: toyHeld, toy, trophy} = briefToy(o);
  const fill = t => t.replace(/\{(\w+)\}/g, (m, k) => ({sub: p[0], obj: p[1], pos: p[2], is: p[3], takes: p[4], sits: p[5], carries: p[6], sub_cap: cap(p[0]), pos_cap: cap(p[2]), toy: toy}[k] ?? m));
  const toyItem = !toy ? '' : toyHeld ? toyRaw : 'with {pos} {toy}';
  const wear = briefBare(o.accessory || '');
  const wearItem = wear ? 'wearing a plain, solid-colored ' + wear + ' with no pattern' : '';
  // a chip id reads from the table; the buyer's own words are quoted, never followed
  const pick = (table, v) => !v ? '' : Object.hasOwn(table, v) ? table[v] : 'in the owner\'s words: "' + plain(v, 120) + '"';
  const sc = b.scene, tone = b.tones[o.tone], parts = [], format = BRIEF_FORMAT[o.format], fmt = b.formats[format];
  const archetype = typeof o.archetype === 'string' && Object.hasOwn(b.character.archetypes, o.archetype) ? o.archetype : null;
  // what the dog is to them (v15): a chip shapes the Sentimental and Warm expression
  const feeling = o.meaning && sc.meaning[o.tone] && Object.hasOwn(sc.meaning[o.tone], o.meaning) ? sc.meaning[o.tone][o.meaning] : '';
  const given = o.together || o.spot || o.home;
  // one place per scene (v12): a spot and an activity in different places (at her feet, out on the
  // walk) never share a scene; Sentimental and Over the top keep the spot, Warm and Hilarious the activity
  const clash = !!(o.spot && o.together && Object.hasOwn(sc.fits, o.together) && Object.hasOwn(sc.spot, o.spot) && !sc.fits[o.together].includes(o.spot));
  const composed = composeScene({...o, archetype});
  const chosen = composed && composed.pick;
  let staging, place = '', toyInJoke = false, prop = '', figure = '';
  if (o.tone === 'sentimental') {
    // resting: the dog's spot, with a calm together moment; never an active one (a walk, a car ride)
    if (o.together && /^(naps|movie|coffee)$/.test(o.together) && !clash) parts.push(pick(sc.together, o.together));
    if (o.spot) parts.push(pick(sc.spot, o.spot));
    staging = parts.length ? parts.join(', ') : 'settled in a simple, calm spot at home';
  } else if (o.tone === 'warm') {
    const key = o.together || o.home;
    if (key) parts.push(pick(sc.moment, key));
    // one moment: a spot only when there is no moment, so a walk never lands on the couch
    if (o.spot && !parts.length) parts.push(pick(sc.spot, o.spot));
    staging = parts.length ? parts.join(', ') : 'a happy everyday moment at home';
  } else if (o.tone === 'hilarious') {
    // v15: the composer picks the joke from every stated answer; the toy joke only when no answer gave one
    const key = chosen ? chosen.key : given ? 'none' : toy ? 'toy' : 'none';
    const text = chosen ? chosen.text : sc.joke[key];
    // v13: a named toy on the walk is carried like a trophy, and with no toy the stride stays without it
    if (key === 'walk' && chosen && chosen.source === 'base' && trophy) { staging = text + sc.jokeToy.walk.replace('{toy}', trophy); toyInJoke = true; }
    else if (key !== 'toy' && /\{toy\}/.test(text)) { staging = text.replace('{toy}', trophy); toyInJoke = true; }
    else staging = text.replace('{pos} {toy}', toyHeld ? toyRaw : '{pos} {toy}');
    if (chosen && chosen.prop) { prop = chosen.prop; staging += ', ' + prop; }
    // a premise with no place of its own is staged where they spend the time, or else the dog's spot (v12: one place)
    if (chosen && chosen.placeless) { const where = pick(sc.together, o.together) || pick(sc.spotSolo, o.spot); if (where) staging += ', ' + where; }
    // typed answers are quoted; a home chip with no joke of its own (brings, with no toy named) adds nothing
    const typed = !chosen && key === 'none' && given ? [pick(sc.spotSolo, o.spot), pick(sc.together, o.together), Object.hasOwn(b.compose.keys.home, o.home || '') ? '' : pick(sc.home, o.home)].filter(Boolean).join(', ') : '';
    if (typed) staging += ', ' + typed;
    // the blanket's figures carry no setting (v15), so an archetype take that names a place falls back to the tone's own
    const own = chosen && !/\b(couch|bed|rug|walk|car|coffee|movie|door|doorway|table|room|floor|lens|camera)\b/i.test(chosen.short) ? chosen.short : '';
    const shorts = b.compose.short.hilarious;
    figure = own || (shorts[chosen ? chosen.key : key] || shorts[key] || shorts.none).replace('{toy}', trophy);
  } else {
    // Over the top crowns the dog's own spot first, and always keeps the stated place in the scene
    // a toy the owner already placed (in his mouth) keeps its place, so it never rests on the cushion
    const key = chosen ? chosen.key : toy && !toyHeld ? 'toy' : 'none';
    const text = chosen ? chosen.text : sc.roast[key];
    staging = key !== 'toy' && /\{toy\}/.test(text) ? text.replace('{toy}', trophy) : text;
    toyInJoke = key !== 'toy' && /\{toy\}/.test(text);
    // the royal portrait is shot low, so the person stays out of it (v13)
    place = [pick(sc.spotSolo, o.spot), clash ? '' : pick(sc.together, o.together)].filter(Boolean).join(', ');
  }
  const comic = o.tone === 'hilarious' || o.tone === 'over_the_top';
  const inStaging = toyInJoke || /\{toy\}/.test(staging) || (toyHeld && staging.includes(toyRaw) || staging.includes(cap(toyRaw)));
  const items = [toy && !(comic && inStaging) ? toyItem : '', wearItem].filter(Boolean);
  const character = archetype ? ' ' + b.character.line.replace('{line}', b.character.archetypes[archetype].tones[o.tone]) : '';
  const breed = plain(o.breed, 60).replace(/\b(mixed|mix|not sure|unknown)\b.*$/i, '').trim();
  const fields = toneText => ({
    Energy: fill(b.identity).replace('{breed}', breed || 'dog') + character,
    'Tone direction': toneText,
    'Style direction': b.styles[o.style]
  });
  if (format === 'blanket') {
    // v15 (Krish, 29 Oct: the "dog centipede"): the blanket is a scattered pattern of small, whole,
    // separate figures on a plain ground, so it carries no setting, place or camera, only the tone's
    // moment, the toy and the worn item
    const bl = b.blanket;
    const moment = fill(bl.moments[o.tone].replace('{figure}', figure)) + (feeling ? ', ' + fill(feeling) : '');
    const play = trophy && !o.noToy ? fill(bl.toy.replace('{toy}', trophy)) : '';
    return fields([
      cap(fill(bl.vary.replace('{moment}', moment).replace('{play}', play))) + '.',
      fill(bl.same) + (wearItem ? ', every figure ' + wearItem + ', the same color in every figure' : '') + '.',
      'Light: ' + tone.light,
      o.noToy ? 'No toys anywhere.' : ''
    ].filter(Boolean).join(' '));
  }
  const scene = fill(staging + (items.length ? ', ' + items.join(', ') : ''));
  const also = items.map(i => /^(with|wearing) /.test(i) ? 'the dog ' + i : i).join('; ');
  return fields([
    cap(fill(tone.pose).replace(/\{joke\}/, fill(staging)).replace(/\{joke_ott\}/, cap(fill(staging)))) + (feeling ? ', ' + fill(feeling) : '') + '.',
    comic ? (place ? 'Scene: ' + fill(place) + '.' : '') + (items.length ? (place ? ' ' : '') + 'Also in the scene: ' + fill(also) + '.' : '') : 'Scene: ' + scene + '.',
    'Camera: ' + fill(tone.camera) + '.',
    'Light: ' + tone.light,
    cap(fill(prop ? tone.itemsProp : tone.items)) + '.',
    tone.toy && toyInJoke ? fill(tone.toy) + '.' : '',
    // v13: the note area lives here, not in the saved frame, so a gift without words is painted edge
    // to edge; words stay on by default on the formats that carry them until the buyer turns them off
    fmt && fmt.note ? (o.words === false ? b.fill : fmt.note) : fmt && fmt.fill ? b.fill : '',
    o.noToy ? 'No toys anywhere.' : ''
  ].filter(Boolean).join(' ').replace(/\{joke(_ott)?\}/g, ''));
}
export function briefPrompt(format) {
  const f = recipes.brief.formats[BRIEF_FORMAT[format]];
  if (!f) throw new Error('Unknown format');
  // v13: the person rule sits beside the avoid line; every gift is the same world seen as its own moment
  // v15: the blanket's own label and matching-set line, since it has no scene
  return ['Create a new picture of the dog in this photo, ' + f.shape + '. Medium: {{Style direction}}',
    '{{Energy}} Change everything else: never reuse the photo\'s pose, angle, light or background.',
    (f.label || 'Scene and mood') + ': {{Tone direction}}',
    f.framing + ' ' + (f.world || recipes.brief.world).replace('{variation}', f.variation), recipes.brief.quoted,
    recipes.brief.person + ' ' + recipes.brief.avoid].join('\n\n');
}
// The composed scene in the buyer's words, for the phone's one-sentence brief (hs-brief.js): only when
// the breed's own take, or an answer about home or what the dog is to them, won the scene; otherwise
// the phone keeps its own line for what they do together.
export function sceneShort(input) {
  const c = composeScene(input), w = c && c.pick;
  return w && (w.source === 'archetype' || w.slot === 'home' || w.slot === 'meaning') ? w.short : '';
}

export function newSession(request) {
  return {currentKey: request.imageKey, currentProductKey: request.key, pending: null, lastGood: null, completed: [], reconciliation: []};
}
export function selectRequest(state, request) {
  const next = clone(state);
  // A completed image can be reused when every image-driving input matches.
  // This also makes a late result usable if the buyer explicitly returns to it.
  const cached = next.completed.findLast(result => result.key === request.imageKey);
  return {...next, currentKey: request.imageKey, currentProductKey: request.key, lastGood: cached ?? next.lastGood};
}
export function begin(state, request, requestId, explicitAction) {
  if (!explicitAction || !requestId) throw new Error('One deliberate update action and request ID required');
  if (state.pending) throw new Error('Pending or uncertain request must be reconciled; no automatic retry');
  if (request.imageKey !== state.currentKey) throw new Error('Choices changed before request');
  if (state.completed.some(x => x.requestId === requestId) || state.reconciliation.some(x => x.requestId === requestId)) throw new Error('Request ID already used');
  if (state.completed.some(result => result.key === request.imageKey)) throw new Error('Reuse the matching returned preview without another call');
  return {...clone(state), pending: {key: request.imageKey, requestId, status: 'requested'}};
}
export function timeout(state, requestId) {
  if (state.pending?.requestId !== requestId) throw new Error('Unknown request');
  return {...clone(state), pending: {...state.pending, status: 'uncertain'}};
}
export function settle(state, receipt) {
  if (state.pending?.requestId !== receipt.requestId || state.pending.key !== receipt.key) throw new Error('Receipt does not belong to pending input');
  if (!receipt.providerReceipt || !hashPattern.test(receipt.imageHash) || !Number.isInteger(receipt.width) || receipt.width <= 0 || !Number.isInteger(receipt.height) || receipt.height <= 0) throw new Error('Receipt, artifact hash and original dimensions required');
  const result = {...clone(receipt), productionVerified: false, identityVerified: false};
  return {...clone(state), pending: null, completed: [...state.completed, result],
    lastGood: receipt.key === state.currentKey ? result : state.lastGood};
}
export function reconcileFailure(state, requestId, providerReceipt, billedAmount) {
  if (state.pending?.requestId !== requestId || !providerReceipt || !Number.isFinite(billedAmount) || billedAmount < 0) throw new Error('Documented provider outcome and cost required');
  return {...clone(state), pending: null, reconciliation: [...state.reconciliation, {requestId, providerReceipt, billedAmount}]};
}
export function previewState(state) {
  return {preview: state.lastGood, current: !!state.lastGood && state.lastGood.key === state.currentKey,
    pending: state.pending?.status ?? null, purchaseEnabled: false};
}
