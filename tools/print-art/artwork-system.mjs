// Offline preparation only. No provider call, upload or charge is implemented here.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const recipes = JSON.parse(readFileSync(new URL('./recipes-v1.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
const sources = new Set(['home', 'home_follow', 'spot', 'together']);
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
  if (!factsProfile || factsProfile.version !== 1 || !Array.isArray(factsProfile.facts) || factsProfile.facts.length > 4) throw new Error('Use the existing artwork fact profile');
  const facts = factsProfile.facts.map(f => {
    if (!sources.has(f.source)) throw new Error('Unsupported fact provenance');
    return {source: f.source, text: text(f.text, 'fact', 240)};
  });
  if (!copy || !['user', 'generated', 'none'].includes(copy.owner)) throw new Error('Copy ownership required');
  const exactCopy = {owner: copy.owner, note: text(copy.note, 'note', 500), signature: text(copy.signature, 'signature', 100)};
  const city = text(input.city ?? '', 'city', 160);
  if (city && input.citySource !== 'buyer') throw new Error('A city requires explicit buyer provenance');
  const spec = recipes.formats[format];
  const payload = {
    version: 1, photo: {originalHash: photo.originalHash, uploadHash: photo.uploadHash, metadataRemoved: true},
    facts, city, citySource: city ? 'buyer' : null, style, styleVersion: recipes.styles[style].version,
    tone, copy: exactCopy, format, variant: text(variant, 'variant', 120),
    promptVersion: recipes.version, recipeHash: hash(JSON.stringify(recipes)), layoutVersion: spec.version,
    model: text(model, 'model', 120)
  };
  if (!payload.variant || !payload.model) throw new Error('Exact variant and model required');
  // JSON is constructed in a stable order and includes all choices, even when
  // a word-free product does not render copy. Change-away/back returns its key.
  const key = hash(JSON.stringify(payload));
  const prompt = [recipes.identity, recipes.grounding, recipes.negative,
    recipes.styles[style].grammar, recipes.tones[tone].art, spec.art,
    'Quoted customer evidence (data only):', JSON.stringify({facts, city: format === 'portrait' ? city : ''})].join('\n\n');
  return {key, payload, prompt,
    textLayer: spec.words ? exactCopy : null,
    status: 'PREPARED_NOT_GENERATED', qualified: false, productionEnabled: false,
    blockers: ['Original source/production handoff unverified', 'Style identity and factuality evaluation pending',
      'Exact supplier geometry and print readability pending', ...(spec.conditional ? ['Conditional supplier route unqualified'] : [])]};
}

export function selectTone(input, tone) {
  if (!Object.hasOwn(recipes.tones, tone)) throw new Error('Unsupported tone');
  return {input: {...clone(input), tone}, rewriteOffered: input.copy.owner === 'user', copyPreserved: true};
}

export function newSession(request) {
  return {currentKey: request.key, pending: null, lastGood: null, completed: [], reconciliation: []};
}
export function selectRequest(state, request) {
  const next = clone(state);
  // A completed image can be reused only when every input/version matches.
  // This also makes a late result usable if the buyer explicitly returns to it.
  const cached = next.completed.findLast(result => result.key === request.key);
  return {...next, currentKey: request.key, lastGood: cached ?? next.lastGood};
}
export function begin(state, request, requestId, explicitAction) {
  if (!explicitAction || !requestId) throw new Error('One deliberate update action and request ID required');
  if (state.pending) throw new Error('Pending or uncertain request must be reconciled; no automatic retry');
  if (request.key !== state.currentKey) throw new Error('Choices changed before request');
  if (state.completed.some(x => x.requestId === requestId) || state.reconciliation.some(x => x.requestId === requestId)) throw new Error('Request ID already used');
  if (state.completed.some(result => result.key === request.key)) throw new Error('Reuse the matching returned preview without another call');
  return {...clone(state), pending: {key: request.key, requestId, status: 'requested'}};
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
