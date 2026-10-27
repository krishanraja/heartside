// Offline packet compiler. No provider SDK, network, upload or dispatch path.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {recipes, prepare} from './artwork-system.mjs';
import {nativePrompt} from './native-candidate.mjs';
import {criteria} from './review-six-style-screen.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const planPath = resolve(root, 'tools/print-art/six-style-test-v1.json');
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
assert.equal(sha(readFileSync(resolve(root, plan.source.path))), plan.source.sha256, 'Source changed; revise approval packet');
assert.deepEqual([...plan.caseOrder].sort(), Object.keys(recipes.styles).sort());
assert.equal(plan.limits.maximumIntentionalGenerationActions, 6);
assert.equal(plan.limits.automaticRetries, 0);
assert.equal(plan.route.purchaseEnabled, false);
assert.equal(plan.route.dispatchImplemented, false);
assert.equal(plan.limits.approvedCeiling, 5, 'Match the recorded conditional owner ceiling; this compiler cannot grant approval');
assert.equal(plan.approval.billingConditionSatisfied, false, 'A billing release needs a separately verified execution path');
const ctx = {window: {}};
vm.runInNewContext(readFileSync(resolve(root, 'shopify/assets/hs-artwork-profile.js'), 'utf8'), ctx);
const facts = JSON.parse(ctx.window.HSArtworkProfile.serialize(ctx.window.HSArtworkProfile.fromChat(plan.fixture.chat)));
const rawNativePrompt = nativePrompt(plan.route.format);
const cases = plan.caseOrder.map((style, i) => {
  const request = prepare({photo:{originalHash:plan.source.sha256, uploadHash:plan.source.uploadSha256, metadataRemoved:true},
    factsProfile:facts, style, tone:plan.route.tone, format:plan.route.format, city:plan.fixture.city,
    variant:'private-portrait-12x18-screen', model:plan.route.model, copy:plan.fixture.copy});
  // Expected substitution of stored form values, not a claim of provider parity.
  // Global options carry their labels (hs2.js selects by label). The fixture has no
  // breed, so Energy is none. Since 27 Oct the portrait prompt reads the tone too.
  const values = {'Artwork style':recipes.styles[style].label, 'Artwork tone':recipes.tones[plan.route.tone].label, Personality:JSON.stringify(facts), City:plan.fixture.city, Energy:'none'};
  const nativePromptExpected = rawNativePrompt.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    assert.ok(Object.hasOwn(values, key), `Unknown native field ${key}`); return values[key];
  });
  assert.ok(nativePromptExpected.includes('Does not chase tennis balls.'));
  assert.ok(!nativePromptExpected.includes(plan.fixture.copy.note));
  assert.ok(!nativePromptExpected.includes('{{'));
  const settings = {model:plan.route.model,quality:plan.route.quality,resolution:plan.route.nativeResolutionSetting,
    layerOutputSize:plan.route.nativeLayerOutputSize,canvas:plan.route.canvas};
  const fingerprint = sha(JSON.stringify({requestKey:request.key,nativePromptExpected,settings}));
  return {id:`S${i+1}`,style,label:recipes.styles[style].label,tone:plan.route.tone,
    nativeFieldValues:values,nativePromptExpected,nativePromptSha256:sha(nativePromptExpected),
    requestKey:request.key,imageKey:request.imageKey,imageTone:request.imageTone,settings,fingerprint,status:'NOT_RUN',providerReceipt:null,actualCostUsd:null,
    originalOutputDimensions:null,outputSha256:null,identityVerdict:null,factsVerdict:null,mediumVerdict:null};
});
assert.equal(new Set(cases.map(c=>c.fingerprint)).size, 6);
const lineItems = Object.values(plan.costEvidence.roundedLineItemsUsd).reduce((a,b)=>a+b,0);
assert.ok(Math.abs(lineItems / 3 * 6 - plan.costEvidence.historicalExtrapolationSixUsd) < 1e-9);
const packet = {planId:plan.id,planSha256:sha(readFileSync(planPath)),recipeVersion:recipes.version,
  recipeSha256:sha(JSON.stringify(recipes)),nativePromptSha256:sha(rawNativePrompt),factsProfile:facts,
  status:plan.status,approvedCeilingUsd:plan.limits.approvedCeiling,executionReady:false,cases};
const outputDir = process.argv[2];
if (outputDir) {
  assert.ok(!outputDir.startsWith('--'), 'Pass an output directory or no argument for validation');
  const dest = resolve(outputDir); mkdirSync(dest,{recursive:true});
  writeFileSync(resolve(dest,'six-style-packet.json'), JSON.stringify(packet,null,2)+'\n');
  for (const c of cases) writeFileSync(resolve(dest,`${c.id}-${c.style}-prompt.txt`),c.nativePromptExpected+'\n');
  // This is an immutable empty template, never the execution ledger.
  writeFileSync(resolve(dest,'results-template.csv'), 'case_id,style,status,provider_receipt,cost_usd,output_sha256,original_width,original_height,identity,facts,medium,production_source,reviewer,evidence\n'+cases.map(c=>`${c.id},${c.style},NOT_RUN,,,,,,,,,,,`).join('\n')+'\n');
  writeFileSync(resolve(dest,'human-reviews-template.json'), JSON.stringify(cases.map(c=>({caseId:c.id,fingerprint:c.fingerprint,
    outputSha256:null,providerReceipt:null,actualCostUsd:null,reviewer:{kind:null,name:null},reviewedAt:null,
    sourceComparisonEvidence:null,criteria:Object.fromEntries(criteria.map(key=>[key,{verdict:'NOT_RUN',evidence:null}]))})),null,2)+'\n');
  writeFileSync(resolve(dest,'packet-sha256.txt'),sha(JSON.stringify(packet))+'\n');
}
console.log(JSON.stringify({planId:plan.id,cases:cases.length,uniqueFingerprints:6,facts:facts.facts.length,
  planSha256:packet.planSha256,nativePromptSha256:packet.nativePromptSha256,
  historicalEstimateUsd:plan.costEvidence.historicalExtrapolationSixUsd,approvedCeilingUsd:plan.limits.approvedCeiling,
  exactQuote:null,executionReady:false,networkCalls:0}));
