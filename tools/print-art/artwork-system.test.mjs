import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {recipes, prepare, selectTone, newSession, selectRequest, begin, timeout, settle, reconcileFailure, previewState} from './artwork-system.mjs';

const ctx = {window: {}};
vm.runInNewContext(readFileSync(new URL('../../shopify/assets/hs-artwork-profile.js', import.meta.url), 'utf8'), ctx);
const facts = JSON.parse(ctx.window.HSArtworkProfile.serialize(ctx.window.HSArtworkProfile.fromChat({spot: 'typed', typed: {spot: 'Does not chase tennis balls; sleeps on the rug.'}})));
const fixture = () => ({photo: {originalHash: 'a'.repeat(64), uploadHash: 'b'.repeat(64), metadataRemoved: true},
  factsProfile: facts, style: 'screenprint', tone: 'warm', format: 'portrait',
  city: '', variant: 'test-portrait-12x18', model: 'test-only-model',
  copy: {owner: 'user', note: 'My exact words.', signature: 'Love, Test dog'}});
const receipt = (request, id='r1') => ({key: request.imageKey, requestId: id, providerReceipt: 'test-receipt', imageHash: 'c'.repeat(64), width: 3600, height: 5400});

test('all six media, three tones and five formats prepare without claiming quality', () => {
  const grammars = new Set(Object.values(recipes.styles).map(s => s.grammar));
  assert.equal(grammars.size, 6);
  let count = 0;
  for (const style of Object.keys(recipes.styles)) for (const tone of Object.keys(recipes.tones)) for (const format of Object.keys(recipes.formats)) {
    const r = prepare({...fixture(), style, tone, format});
    assert.equal(r.qualified, false); assert.equal(r.productionEnabled, false);
    assert.ok(r.prompt.includes(recipes.styles[style].grammar));
    assert.ok(r.prompt.includes(recipes.tones[recipes.formats[format].words ? 'warm' : tone].art));
    assert.equal(r.textLayer === null, ['blanket','pillow'].includes(format)); count++;
  }
  assert.equal(count, 90); // configuration coverage, not 90 generated or judged images
});
test('shared explicit facts preserve negation and exact copy stays out of image prompt', () => {
  const r = prepare(fixture());
  assert.ok(r.prompt.includes('Does not chase tennis balls'));
  assert.ok(!r.prompt.includes('My exact words.'));
  assert.equal(r.textLayer.note, 'My exact words.');
  assert.throws(() => prepare({...fixture(), factsProfile: {version: 1, facts: [{source:'breed', text:'Likes balls'}]}}));
  assert.throws(() => prepare({...fixture(), city:'New York', citySource:'shipping'}));
});
test('input key covers every source, fact, tone, style, copy, format and variant change', () => {
  const base = prepare(fixture()).key;
  const changed = [
    {style:'ink'}, {tone:'hilarious'}, {format:'blanket'}, {variant:'other'}, {model:'other-model'},
    {photo:{...fixture().photo,originalHash:'d'.repeat(64)}},
    {photo:{...fixture().photo,uploadHash:'d'.repeat(64)}},
    {city:'Boston',citySource:'buyer'}, {factsProfile:{version:1,facts:[]}},
    {copy:{...fixture().copy,note:'Revised exact words.'}}, {copy:{...fixture().copy,owner:'generated'}}
  ];
  for (const delta of changed) assert.notEqual(prepare({...fixture(),...delta}).key,base);
  assert.equal(prepare(fixture()).key,base);
});
test('missing identity, unsupported combination and unstripped source fail closed', () => {
  assert.throws(() => prepare({...fixture(), photo:null}));
  assert.throws(() => prepare({...fixture(), photo:{...fixture().photo,metadataRemoved:false}}));
  assert.throws(() => prepare({...fixture(), style:'similar-enough'}));
  assert.throws(() => prepare({...fixture(), style:'__proto__'}));
  assert.throws(() => prepare({...fixture(), format:'constructor'}));
  assert.throws(() => selectTone(fixture(),'toString'));
  assert.throws(() => prepare({...fixture(), model:''}));
});
test('tone selection preserves manual exact copy and offers rewrite without requesting generation', () => {
  const original = fixture(); const result = selectTone(original,'hilarious');
  assert.deepEqual(result.input.copy,original.copy); assert.equal(original.tone,'warm');
  assert.equal(result.rewriteOffered,true); assert.equal(result.input.tone,'hilarious');
});
test('duplicate click, reload and uncertain response cannot start automatic retry', () => {
  const request=prepare(fixture()); let state=newSession(request);
  assert.throws(() => begin(state,request,'r1',false));
  state=begin(state,request,'r1',true);
  assert.throws(() => begin(state,request,'r2',true));
  state=JSON.parse(JSON.stringify(timeout(state,'r1')));
  assert.equal(previewState(state).pending,'uncertain');
  assert.throws(() => begin(state,request,'r2',true));
  state=reconcileFailure(state,'r1','provider-billed-failure',0.13);
  assert.throws(() => begin(state,request,'r1',true));
  assert.equal(begin(state,request,'r2',true).pending.requestId,'r2');
});
test('late result is retained as evidence but cannot become current preview', () => {
  const a=prepare(fixture()), b=prepare({...fixture(),style:'ink'});
  let state=begin(newSession(a),a,'r1',true);
  state=selectRequest(state,b); state=settle(state,receipt(a));
  assert.equal(state.completed.length,1); assert.equal(previewState(state).current,false);
  assert.equal(previewState(state).purchaseEnabled,false);
});
test('last preview survives choices and becomes stale; changing back reuses without charge', () => {
  const a=prepare(fixture()), b=prepare({...fixture(),style:'ink'});
  let state=settle(begin(newSession(a),a,'r1',true),receipt(a));
  assert.equal(previewState(state).current,true);
  assert.equal(state.lastGood.identityVerified,false);
  state=selectRequest(state,b);
  assert.ok(previewState(state).preview); assert.equal(previewState(state).current,false);
  state=selectRequest(state,a);
  assert.equal(previewState(state).current,true);
  assert.throws(() => begin(state,a,'r2',true));
});
test('wrong receipt or missing original dimensions cannot settle a request', () => {
  const a=prepare(fixture()), state=begin(newSession(a),a,'r1',true);
  assert.throws(() => settle(state,{...receipt(a),key:'wrong'}));
  assert.throws(() => settle(state,{...receipt(a),width:0}));
  assert.throws(() => settle(state,{...receipt(a),providerReceipt:''}));
});

test('switching among completed inputs and returning to a late result reuses exact receipts', () => {
  const a=prepare(fixture()), b=prepare({...fixture(),style:'ink'});
  let state=settle(begin(newSession(a),a,'r1',true),receipt(a));
  state=selectRequest(state,b);
  state=settle(begin(state,b,'r2',true),receipt(b,'r2'));
  state=selectRequest(JSON.parse(JSON.stringify(state)),a);
  assert.equal(previewState(state).preview.requestId,'r1');
  assert.equal(previewState(state).current,true);
  assert.throws(() => begin(state,a,'r3',true));
  state=selectRequest(state,b);
  assert.equal(previewState(state).preview.requestId,'r2');
  assert.throws(() => begin(state,b,'r3',true));

  let late=selectRequest(begin(newSession(a),a,'late',true),b);
  late=settle(late,receipt(a,'late'));
  assert.equal(previewState(late).current,false);
  late=selectRequest(late,a);
  assert.equal(previewState(late).preview.requestId,'late');
  assert.equal(previewState(late).current,true);
  assert.equal(previewState(late).purchaseEnabled,false);
  assert.throws(() => begin(late,a,'again',true));
});
