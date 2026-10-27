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
  // no energy (unknown, mixed or two-parent breed); an unlisted code fails closed.
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
// archetype; unknown names, mixed breeds and two-parent crosses get none. The code
// never becomes a fact and is never shown to the buyer.
export function energyFor(lookup) {
  if (!lookup || lookup.exact !== true || lookup.kind === 'mixed' || typeof lookup.tone !== 'string') return null;
  return Object.hasOwn(recipes.energy.byArchetype, lookup.tone) ? recipes.energy.byArchetype[lookup.tone] : null;
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
