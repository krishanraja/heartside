import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {transformSync} from 'esbuild';
import {prepare, recipes} from '../print-art/artwork-system.mjs';
import {mugTemplate, nativePrompt} from '../print-art/native-candidate.mjs';
const input = () => ({photo:{originalHash:'a'.repeat(64),uploadHash:'b'.repeat(64),metadataRemoved:true},factsProfile:{version:1,facts:[{source:'spot',text:'Does not chase balls; rests by the door.'}]},city:'',style:'screenprint',tone:'warm',format:'mug',variant:'synthetic-11oz-black',model:'test-only',copy:{owner:'user',note:'My exact edit.',signature:'Love, Test dog'}});
test('draft gift navigation excludes conditional ornament and keeps selected gifts on paused templates',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
  const section=name=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('\n  function ',source.indexOf('  function '+name+'(')+1));
  const saved=new Map(), ctx={cfg:{artworkCandidates:true,gifts:{mug:{url:'/products/test-mug'},blanket:{url:'/products/test-blanket'},print:{url:'/products/test-print'}}},S:{sel:{mug:true,blanket:true,print:true,ornament:true}},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait'},priceOf:()=>0,shareWithBridge:()=>{},mugColor:()=>({id:123}),QKEY:'queue',track:()=>{},window:{location:{href:''},sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
  vm.runInNewContext(['reviewGifts','chooseModel','addToCart'].map(section).join('\n'),ctx);
  assert.equal(ctx.chooseModel().count,3);ctx.addToCart();
  const queue=JSON.parse(saved.get('queue'));assert.equal(queue.length,3);
  for(const [i,view] of ['mug-art-preview','blanket-art-preview','city-art-preview'].entries()) assert.equal(new URL(queue[i].url,'https://example.test').searchParams.get('view'),view);
  assert.equal(new URL(ctx.window.location.href,'https://example.test').searchParams.get('variant'),'123');
  assert.equal(JSON.parse(readFileSync(new URL('../../shopify/templates/index.artwork-preview.json',import.meta.url),'utf8')).sections.gift.settings.ai_on,false);
});
function browser(minify, storage=new Map()) {
  const context = {TextEncoder, Uint8Array, structuredClone, sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}, CustomEvent:class {constructor(name,o){this.type=name;this.detail=o.detail;}}, window:{crypto:webcrypto,dispatchEvent:()=>{}}};
  for(const name of ['hs-artwork-engine.js','hs-artwork-choices.js']) {
    const code=readFileSync(new URL('../../shopify/assets/'+name,import.meta.url),'utf8');
    vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,context);
  }
  return context.window;
}
for (const minify of [false,true]) {
  const mode=minify?'minified':'source';
  test(mode+': browser and Node bind all 90 configurations to identical complete keys and prompts',async()=>{
    const w=browser(minify);
    for(const style of Object.keys(recipes.styles)) for(const tone of Object.keys(recipes.tones)) for(const format of Object.keys(recipes.formats)) {
      const i={...input(),style,tone,format}, actual=await w.HSArtworkEngine.prepare(i);
      assert.deepEqual(JSON.parse(JSON.stringify(actual)),prepare(i));
    }
  });
  test(mode+': choices cross reload and all formats without rewriting owned copy or dispatching',async()=>{
    const storage=new Map([['hs3-gift',JSON.stringify({noteTone:'sentimental',edits:{meaning:'My exact edit.'}})]]);
    let w=browser(minify,storage); assert.equal(w.HSArtworkChoices.read().tone,'sentimental');
    w.HSArtworkChoices.select({style:'comic',tone:'hilarious'}); w=browser(minify,storage);
    for(const format of Object.keys(recipes.formats)) {
      const r=await w.HSArtworkChoices.prepare({...input(),format});
      assert.equal(r.payload.style,'comic');assert.equal(r.payload.tone,'hilarious');assert.equal(r.payload.copy.note,'My exact edit.');assert.equal(r.productionEnabled,false);
    }
    assert.equal(JSON.parse(storage.get('hs3-gift')).edits.meaning,'My exact edit.');
    assert.throws(()=>w.HSArtworkChoices.select({style:'__proto__'}));
  });
  test(mode+': changed photo, exact copy, variant and facts invalidate current preview; returning reuses key',async()=>{
    const w=browser(minify), first=await w.HSArtworkChoices.prepare(input());
    for(const delta of [{photo:{...input().photo,originalHash:'c'.repeat(64)}},{copy:{...input().copy,note:'Second exact edit.'}},{variant:'synthetic-pink'},{factsProfile:{version:1,facts:[]}}]) assert.notEqual((await w.HSArtworkChoices.prepare({...input(),...delta})).key,first.key);
    assert.equal((await w.HSArtworkChoices.prepare(input())).key,first.key);
    await assert.rejects(w.HSArtworkChoices.prepare({...input(),photo:{metadataRemoved:false}}));
  });
}
test('mug candidate expands art across wrap, removes cut-out mask and keeps one separate exact note',()=>{
  const source={id:'template-100001',layers:[{id:'layer-100001',type:'photo',width:900,masked_enable:true},{id:'layer-100002',name:'Line 1',type:'paragraph'},{id:'layer-100003',name:'Line 2',type:'paragraph'},{id:'layer-100004',name:'Signed',type:'paragraph'}]};
  const r=mugTemplate(source,{style:1,tone:2});
  const photo=r.layers.find(l=>l.type==='photo'); assert.equal(photo.width,2700);assert.equal(photo.height,1050);assert.equal(photo.masked_enable,false);
  assert.equal(r.layers.filter(l=>/^Line/.test(l.name)).length,1);assert.equal(source.layers[0].width,900);
  for(const f of ['mug','blanket','portrait','pillow']) {const p=nativePrompt(f); assert.ok(p.includes('{{Artwork style}}'));assert.ok(p.includes('{{Artwork tone}}'));assert.ok(p.includes('{{Personality}}')); assert.ok(p.includes('Do not mirror'));}
});
test('normalized PNG guard rejects metadata and trailing bytes',()=>{
  const ctx={window:{},Uint8Array,DataView};
  vm.runInNewContext(readFileSync(new URL('../../shopify/assets/hs-artwork-photo.js',import.meta.url),'utf8'),ctx);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO6sAAAAASUVORK5CYII=','base64');
  const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
  ctx.window.HSArtworkPhoto.checkPNG(ab(png));
  const metadata=Buffer.alloc(12);metadata.write('eXIf',4);
  assert.throws(()=>ctx.window.HSArtworkPhoto.checkPNG(ab(Buffer.concat([png.subarray(0,33),metadata,png.subarray(33)]))),/metadata/);
  assert.throws(()=>ctx.window.HSArtworkPhoto.checkPNG(ab(Buffer.concat([png,Buffer.from([0])]))),/boundary/);
});
for(const minify of [false,true]) test((minify?'minified':'source')+': native shared choices use current label and manual edits return to Buddy',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
  const section=name=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('\n  function ',source.indexOf('  function '+name+'(')+1));
  const saved=new Map([['hs3-gift',JSON.stringify({edits:{spot:'Earlier edit'}})]]), state={hs3_lines:{meaning:'Old'}};
  const ctx={state,bridge:{owned:{}},cityArtPreview:()=>true,norm:x=>String(x||'').toLowerCase(),answer:k=>k==='art_style'?'Fine ink drawing':'Hilarious',val:()=>'',lines:()=>({}),V3_ORDER:{print:['home','spot','together','meaning']},v3Kind:()=> 'print',sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},save:()=>{},render:()=>{}};
  const code=section('choiceMatches')+'\n'+section('watchField');vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,ctx);
  assert.equal(ctx.choiceMatches('Fine ink drawing','art_style'),true);assert.equal(ctx.choiceMatches('Comic book','art_style'),false);
  function input(k,value){const events={};const el={value,name:k,id:k,tagName:'INPUT',addEventListener:(n,fn)=>events[n]=fn};ctx.watchField(el,k);events.input();}
  input('line4','My exact new note.');input('signed','Always, Test dog');
  assert.equal(state.hs3_copy_owner,'user');assert.equal(state.hs3_signature_override,'Always, Test dog');
  const edits=JSON.parse(saved.get('hs3-gift')).edits;assert.equal(edits.meaning,'My exact new note.');assert.equal(edits.spot,'Earlier edit');
});
