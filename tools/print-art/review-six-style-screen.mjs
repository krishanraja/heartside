// Offline evidence-completeness gate, not an image judge or production release.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const criteria = ['individualIdentity', 'markingsNotMirrored', 'anatomy',
  'explicitFactsOnly', 'negationRespected', 'noUnauthorizedCity',
  'noGeneratedWords', 'distinctMedium'];

export function reviewScreen(packet, reviews = []) {
  if (!Array.isArray(packet?.cases) || packet.cases.length !== 6 ||
      new Set(packet.cases.map(c => c.id)).size !== 6 ||
      new Set(packet.cases.map(c => c.style)).size !== 6 ||
      new Set(packet.cases.map(c => c.fingerprint)).size !== 6) {
    throw new Error('Expected the compiled six-case packet');
  }
  if (!Array.isArray(reviews)) throw new Error('Reviews must be an array');
  const ids = new Set(packet.cases.map(c => c.id));
  const unknown = reviews.filter(r => !ids.has(r.caseId)).map(r => r.caseId);
  const outputCounts = new Map();
  for (const r of reviews) if (r.outputSha256) outputCounts.set(r.outputSha256, (outputCounts.get(r.outputSha256) || 0) + 1);
  const cases = packet.cases.map(c => {
    const matches = reviews.filter(r => r.caseId === c.id);
    const missing = [];
    if (matches.length !== 1) return {id:c.id, style:c.style, status:matches.length ? 'HOLD' : 'NOT_RUN', missing:[matches.length ? 'duplicate reviews' : 'actual output and human review']};
    const r = matches[0];
    if (r.fingerprint !== c.fingerprint) missing.push('matching input fingerprint');
    if (!/^[a-f0-9]{64}$/.test(r.outputSha256 || '')) missing.push('output SHA-256');
    else if (outputCounts.get(r.outputSha256) !== 1) missing.push('distinct output for each medium');
    if (typeof r.providerReceipt !== 'string' || !r.providerReceipt.trim()) missing.push('provider receipt');
    if (!Number.isFinite(r.actualCostUsd) || r.actualCostUsd < 0) missing.push('reconciled actual cost');
    if (r.reviewer?.kind !== 'human' || !r.reviewer?.name?.trim() || !r.reviewedAt || !Number.isFinite(Date.parse(r.reviewedAt))) missing.push('dated human review');
    if (!r.sourceComparisonEvidence?.trim()) missing.push('side-by-side source comparison evidence');
    const failed = [];
    for (const criterion of criteria) {
      const finding = r.criteria?.[criterion];
      if (finding?.verdict === 'FAIL') failed.push(criterion);
      else if (finding?.verdict !== 'PASS' || !finding.evidence?.trim()) missing.push(criterion);
    }
    return {id:c.id,style:c.style,status:failed.length ? 'FAIL' : missing.length ? 'HOLD' : 'SCREEN_REVIEW_RECORDED',failed,missing};
  });
  const screenComplete = unknown.length === 0 && cases.every(c => c.status === 'SCREEN_REVIEW_RECORDED');
  return {planId:packet.planId,screenComplete,unknownCaseIds:unknown,cases,
    meaning:'Completeness of recorded human screen evidence only; this script does not inspect likeness or verify provider receipts.',
    stylesQualified:false,productionSourceVerified:false,samplesReady:false,purchaseEnabled:false,
    next:screenComplete ? 'Evaluate varied dogs, tone and product adaptations under a separate approved budget.' : 'Complete or repair the specific screen evidence gaps; no automatic generation or retries.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node review-six-style-screen.mjs packet.json [human-reviews.json]');
  const packet=JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const reviews=process.argv[3] ? JSON.parse(readFileSync(process.argv[3], 'utf8')) : [];
  console.log(JSON.stringify(reviewScreen(packet,reviews),null,2));
}
