import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const chat=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8'), product=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
function section(source,name){const i=source.indexOf('  function '+name+'(');assert.notEqual(i,-1);return source.slice(i,source.indexOf('\n  function ',i+1));}
for(const minified of [false,true]){
 const run=(code,c)=>{vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);return c;};
 test(`${minified?'minified':'source'}: photo only becomes transferable after committed storage, failure is visible and stale failure cannot discard newer choice`,async()=>{
  const jobs=[],timers=[],status={textContent:'',hidden:true},c={S:{hasPhoto:false,photoT:0},ui:{},PHOTO:'headshot',Date:{now:()=>1000},setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},save(){},fit(){},usePhoto(f,t,transferable){c.S.photoT=t;c.S.hasPhoto=transferable!==false;},frame:{querySelector:()=>status},idb:()=>new Promise((resolve,reject)=>jobs.push({resolve,reject}))};
  run(['photoStorageStatus','attachPhoto'].map(n=>section(chat,n)).join('\n'),c);
  const a=c.attachPhoto({name:'first'});assert.equal(c.S.hasPhoto,false);assert.match(status.textContent,/Saving/);
  jobs[0].reject(new Error('quota'));await a;assert.equal(c.S.hasPhoto,false);assert.equal(c.S.photoT,0);assert.match(status.textContent,/could not save/);
  const b=c.attachPhoto({name:'second'}),d=c.attachPhoto({name:'third'});const latest=c.S.photoT;
  jobs[1].reject(new Error('late failure'));await b;assert.equal(c.S.photoT,latest);assert.ok(c.ui.photoSaving);
  jobs[2].resolve();await d;assert.equal(c.S.hasPhoto,true);assert.equal(c.ui.photoSaving,0);assert.equal(status.hidden,true);assert.equal(c.S.photoStorageWarning,'');
  const e=c.attachPhoto({name:'blocked database'});timers[3]();await e;assert.equal(c.ui.photoSaving,0);assert.equal(c.S.hasPhoto,false);assert.match(status.textContent,/could not save/);
  jobs[3].resolve();await Promise.resolve();assert.equal(c.S.hasPhoto,false);
  assert.match(section(chat,'next'),/if \(ui\.photoSaving\)/);
 });
 for(const [kind,source] of [['chat',chat],['product',product]])test(`${minified?'minified':'source'}: ${kind} expiry deletes in the read transaction even without active session, preserves fresh unmatched photo`,async()=>{
  const now=10*864e5,store={rec:{file:{},t:now-3*864e5}},deleted=[],modes=[];
  const c={S:{hasPhoto:false,photoT:0},state:{},PHOTO:'headshot',PHOTO_DAYS:3,Date:{now:()=>now},save(){},usePhoto(){throw new Error('expired photo restored');},idb:async(mode,fn)=>{
   modes.push(mode);const req={result:store.rec};fn({get:()=>req,delete:key=>{deleted.push(key);store.rec=null;}});req.onsuccess();return req.result;
  }};
  run(section(source,'restorePhoto'),c);await c.restorePhoto();assert.deepEqual(deleted,['headshot']);assert.deepEqual(modes,['readwrite']);
  store.rec={file:{},t:now-1000};await c.restorePhoto();assert.equal(deleted.length,1);assert.ok(store.rec);
 });
}
