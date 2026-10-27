import {test} from 'node:test';
import assert from 'node:assert/strict';
import {criteria,reviewScreen} from './review-six-style-screen.mjs';
const packet={planId:'test-only',cases:['screenprint','cinematic','painterly','comic','collage','ink'].map((style,i)=>({id:`S${i+1}`,style,fingerprint:`test-${i}`}))};
const complete=()=>packet.cases.map((c,i)=>({caseId:c.id,fingerprint:c.fingerprint,outputSha256:String(i+1).repeat(64),providerReceipt:`synthetic-${i}`,actualCostUsd:0.1,reviewer:{kind:'human',name:'Synthetic fixture'},reviewedAt:'2026-10-24T12:00:00Z',sourceComparisonEvidence:'Synthetic test only',criteria:Object.fromEntries(criteria.map(k=>[k,{verdict:'PASS',evidence:'Synthetic test finding'}]))}));
test('no generated images means six not-run cases and no readiness',()=>{
  const r=reviewScreen(packet); assert.equal(r.cases.filter(c=>c.status==='NOT_RUN').length,6); assert.equal(r.screenComplete,false); assert.equal(r.purchaseEnabled,false);
});
test('complete screen records still cannot qualify a style, source or sample',()=>{
  const r=reviewScreen(packet,complete()); assert.equal(r.screenComplete,true);
  for(const k of ['stylesQualified','productionSourceVerified','samplesReady','purchaseEnabled']) assert.equal(r[k],false);
});
test('wrong dog, mirrored markings and invented negated prop block independently',()=>{
  for(const criterion of ['individualIdentity','markingsNotMirrored','negationRespected']) {
    const rows=complete(); rows[0].criteria[criterion]={verdict:'FAIL',evidence:'Synthetic mismatch'};
    const r=reviewScreen(packet,rows); assert.equal(r.screenComplete,false); assert.equal(r.cases[0].status,'FAIL');
  }
});
test('stale inputs, duplicated output and duplicated cases cannot pass',()=>{
  let rows=complete(); rows[0].fingerprint='stale'; assert.equal(reviewScreen(packet,rows).screenComplete,false);
  rows=complete(); rows[1].outputSha256=rows[0].outputSha256; assert.equal(reviewScreen(packet,rows).cases.filter(c=>c.status==='HOLD').length,2);
  rows=complete(); rows.push(rows[0]); assert.equal(reviewScreen(packet,rows).cases[0].status,'HOLD');
  rows=complete(); rows.push({...rows[0],caseId:'other'}); assert.equal(reviewScreen(packet,rows).screenComplete,false);
});
test('automated verdicts, missing evidence and unknown costs remain holds',()=>{
  for(const modify of [r=>r.reviewer.kind='model',r=>r.criteria.anatomy.evidence='',r=>r.actualCostUsd=null,r=>r.providerReceipt='',r=>r.sourceComparisonEvidence='']) {
    const rows=complete();modify(rows[0]);assert.equal(reviewScreen(packet,rows).cases[0].status,'HOLD');
  }
});
