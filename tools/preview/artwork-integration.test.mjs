import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {transformSync} from 'esbuild';
import {prepare, recipes} from '../print-art/artwork-system.mjs';
import {mugTemplate, nativePrompt} from '../print-art/native-candidate.mjs';
const input = () => ({photo:{originalHash:'a'.repeat(64),uploadHash:'b'.repeat(64),metadataRemoved:true},factsProfile:{version:1,facts:[{source:'spot',text:'Does not chase balls; rests by the door.'}]},city:'',style:'screenprint',tone:'warm',format:'mug',variant:'synthetic-11oz-black',model:'test-only',copy:{owner:'user',note:'My exact edit.',signature:'Love, Test dog'}});
test('native note label retains the exact-copy bridge and legacy mapping',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
  const start=source.indexOf('  var TIB_RULES = [');
  const ctx={};vm.runInNewContext(source.slice(start,source.indexOf('\n  ];',start)+5),ctx);
  const key=label=>ctx.TIB_RULES.find(rule=>rule.re.test(label))?.k;
  for(const label of ['Line 4','Line 4*','Your note','Your note *']) assert.equal(key(label),'line4');
  assert.equal(key('Line 1'),'line1');assert.equal(key('Your notebook'),undefined);
});
test('draft gift navigation excludes conditional ornament and keeps selected gifts on paused templates',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
  const section=name=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('\n  function ',source.indexOf('  function '+name+'(')+1));
  const saved=new Map(), ctx={URL,cfg:{artworkCandidates:true,gifts:{mug:{url:'/products/test-mug?view=gift&variant=999&keep=yes#art'},blanket:{url:'/products/test-blanket?view=gift'},print:{url:'/products/test-print?view=gift'}}},S:{sel:{mug:true,blanket:true,print:true,ornament:true}},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait'},priceOf:()=>0,shareWithBridge:()=>{},mugColor:()=>({id:123}),QKEY:'queue',track:()=>{},window:{location:{href:'https://example.test/review'},sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
  vm.runInNewContext(['reviewGifts','blanketPurchaseEnabled','giftPurchasable','selectedGifts','chooseModel','addToCart'].map(section).join('\n'),ctx);
  assert.equal(ctx.chooseModel().count,3);ctx.addToCart();
  const queue=JSON.parse(saved.get('queue'));assert.equal(queue.length,3);
  for(const [i,view] of ['mug-art-preview','blanket-art-preview','city-art-preview'].entries()) assert.deepEqual(new URL(queue[i].url,'https://example.test').searchParams.getAll('view'),[view]);
  assert.equal(new URL(ctx.window.location.href,'https://example.test').searchParams.get('variant'),'123');
  assert.equal(new URL(ctx.window.location.href,'https://example.test').searchParams.get('keep'),'yes');
  assert.equal(new URL(ctx.window.location.href,'https://example.test').hash,'#art');
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
  test(mode+': browser and Node bind all 90 configurations, with and without energy and toy/accessory facts, to identical keys and prompts',async()=>{
    const w=browser(minify), {energyFor}=await import('../print-art/artwork-system.mjs');
    const tagged={version:1,facts:[{source:'spot',text:'Does not chase balls; rests by the door.'},{source:'toy',text:'Green squeaky hedgehog'},{source:'accessory',text:'Red plaid bandana'}]};
    for(const style of Object.keys(recipes.styles)) for(const tone of Object.keys(recipes.tones)) for(const format of Object.keys(recipes.formats)) for(const energy of [null,'bold-cheeky']) {
      const i={...input(),style,tone,format,energy,factsProfile:energy?tagged:input().factsProfile}, actual=await w.HSArtworkEngine.prepare(i);
      assert.deepEqual(JSON.parse(JSON.stringify(actual)),prepare(i));
    }
    for(const archetype of Object.keys(recipes.energy.byArchetype)) for(const exact of [true,false]) assert.equal(w.HSArtworkEngine.energyFor({exact,kind:'breed',tone:archetype}),energyFor({exact,kind:'breed',tone:archetype}));
    await assert.rejects(w.HSArtworkEngine.prepare({...input(),factsProfile:{version:1,facts:[{source:'breed',text:'Beagle'}]}}),/provenance/);
    await assert.rejects(w.HSArtworkEngine.prepare({...input(),factsProfile:{version:1,facts:[{source:'energy',text:'bold-cheeky'}]}}),/provenance/);
    await assert.rejects(w.HSArtworkEngine.prepare({...input(),energy:'Terrier Menace'}),/energy/);
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
  for(const f of ['mug','blanket','portrait','pillow','ornament']) {const p=nativePrompt(f); assert.ok(p.includes('{{Artwork style}}'));assert.ok(p.includes('{{Artwork tone}}'));assert.ok(p.includes('{{Energy}}'));assert.ok(p.includes('{{Personality}}')); assert.ok(p.includes('Do not mirror'));}
});

// 27 Oct ruling: tone (and breed energy) drive the imagery on every format. Exact words
// alone still reuse a matching image, which never attests the current text layers.
for(const minify of [false,true]) test((minify?'minified':'source')+': tone and energy change imagery on every format; exact-word edits reuse it',async()=>{
  const w=browser(minify);
  for(const format of Object.keys(recipes.formats)) {
    const a=await w.HSArtworkEngine.prepare({...input(),format,tone:'sentimental'});
    const b=await w.HSArtworkEngine.prepare({...input(),format,tone:'hilarious'});
    const c=await w.HSArtworkEngine.prepare({...input(),format,tone:'sentimental',copy:{...input().copy,note:'Changed exact note.'}});
    const d=await w.HSArtworkEngine.prepare({...input(),format,tone:'sentimental',energy:'joyful-bouncy'});
    assert.notEqual(a.imageKey,b.imageKey);assert.notEqual(a.prompt,b.prompt);assert.equal(b.imageTone,'hilarious');
    assert.notEqual(a.imageKey,d.imageKey);assert.notEqual(a.prompt,d.prompt);
    assert.equal(a.imageKey,c.imageKey);assert.equal(a.prompt,c.prompt);assert.notEqual(a.key,c.key);
    let state=w.HSArtworkEngine.newSession(a);
    state=w.HSArtworkEngine.begin(state,a,'test',true);
    state=w.HSArtworkEngine.selectRequest(state,b);
    state=w.HSArtworkEngine.settle(state,{key:a.imageKey,requestId:'test',providerReceipt:'synthetic',imageHash:'c'.repeat(64),width:100,height:100});
    assert.equal(w.HSArtworkEngine.previewState(state).current,false,format+': a new tone needs a new version');
    assert.equal(w.HSArtworkEngine.previewState(state).purchaseEnabled,false);
    state=w.HSArtworkEngine.selectRequest(state,c);
    assert.equal(w.HSArtworkEngine.previewState(state).current,true,format+': exact words alone reuse the image');
    assert.throws(()=>w.HSArtworkEngine.begin(state,c,'again',true),/Reuse/);
    state=w.HSArtworkEngine.selectRequest(state,d);
    assert.equal(w.HSArtworkEngine.previewState(state).current,false,format+': energy is part of image identity');
    assert.equal(w.HSArtworkEngine.selectTone({...input(),format,tone:'sentimental'},'hilarious').newArtworkNeeded,true);
  }
});

function staleness(state={}) {
  const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
  const section=name=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('\n  function ',source.indexOf('  function '+name+'(')+1));
  const flags={wordFree:false}, choice={style:'screenprint',tone:'sentimental'};
  const ctx={productId:()=>1,usePhoto:{t:1},artworkFacts:()=>'{"version":1,"facts":[]}',artworkEnergy:()=>ctx.state.hs3_energy||null,state,blanketArtPreview:()=>flags.wordFree,v3Kind:()=> 'portrait',document:{querySelector:()=>null},window:{HSArtworkChoices:{read:()=>choice},HSArtworkEngine:{recipeHash:'test',recipes}}};
  vm.runInNewContext(section('artRequestKey'),ctx);
  return {ctx,flags,choice};
}
test('native staleness key ignores exact words on portrait and follows style and blanket tone',()=>{
  const {ctx,flags,choice}=staleness();
  const a=ctx.artRequestKey();ctx.state.hs3_lines={meaning:'Exact new words'};
  assert.equal(ctx.artRequestKey(),a);
  flags.wordFree=true;const b=ctx.artRequestKey();choice.tone='hilarious';assert.notEqual(ctx.artRequestKey(),b);
  flags.wordFree=false;choice.style='ink';assert.notEqual(ctx.artRequestKey(),a);
});
test('native staleness key follows tone and breed energy on mug and portrait too',()=>{
  const {ctx,choice}=staleness({hs3_energy:null});
  const a=ctx.artRequestKey();choice.tone='hilarious';
  assert.notEqual(ctx.artRequestKey(),a,'portrait image staleness follows the selected tone');
  const b=ctx.artRequestKey();ctx.state.hs3_energy='bold-cheeky';
  assert.notEqual(ctx.artRequestKey(),b,'portrait image staleness follows breed energy');
});
test('unbound mug review never writes into the globally embedded legacy campaign',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
  const start=source.indexOf('  function runBridge()'),end=source.indexOf('\n  function ',start+1);
  const ctx={document:{querySelector:selector=>selector==='#buy[data-hs2-mug-art-preview]'?{}:null},tibFields:()=>{throw new Error('legacy campaign accessed');}};
  vm.runInNewContext(source.slice(start,end),ctx);assert.doesNotThrow(()=>ctx.runBridge());
});

for (const minify of [false,true]) {
  const mode=minify?'minified':'source';
  for (const field of ['note','signature','owner','tone']) test(mode+': preparation rejects a '+field+' edit while request hashing is pending',async()=>{
    const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
    const start=source.indexOf('  async function prepareCurrentArtwork(');
    const code=source.slice(start,source.indexOf('\n  function ',start+1));
    const state={hs3_lines:{meaning:'Original exact note'},hs3_copy_owner:'generated'};
    let signature='Love, Buddy', tone='warm', release, captured;
    const ctx={state,usePhoto:{file:{}},cityArtPreview:()=>true,nativeArtworkPurchase:()=>false,artRequestKey:()=> 'unchanged-image',artworkFacts:()=>'{"version":1,"facts":[]}',artworkEnergy:()=>null,answer:()=>signature,window:{HSArtworkPhoto:{prepare:async()=>({photo:{},file:{},width:10,height:10})},HSArtworkChoices:{read:()=>({style:'screenprint',tone}),prepare:request=>{captured=request;return new Promise(resolve=>{release=()=>resolve(request);});}}}};
    vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,ctx);
    const pending=ctx.prepareCurrentArtwork('portrait','synthetic-variant','test-only');
    await new Promise(resolve=>setImmediate(resolve));assert.ok(captured);
    if(field==='note') state.hs3_lines.meaning='New exact note';
    if(field==='signature') signature='Always, Buddy';
    if(field==='owner') state.hs3_copy_owner='user';
    if(field==='tone') tone='hilarious';
    release();await assert.rejects(pending,/choices changed during preparation/);
    const unchanged=ctx.prepareCurrentArtwork('portrait','synthetic-variant','test-only');
    await new Promise(resolve=>setImmediate(resolve));release();
    const result=await unchanged;
    assert.equal(result.request.copy.note,state.hs3_lines.meaning);
    assert.equal(result.request.copy.signature,signature);
    assert.equal(result.request.copy.owner,state.hs3_copy_owner);
  });

  for (const options of [{},{wordFree:true},{toneElsewhere:true}]) test(mode+': failed shared-choice writes restore displayed controls and allow a later retry '+JSON.stringify(options),()=>{
    const saved=new Map(),events=[];let denyWrites=false;
    function element(tag){return {tag,children:[],listeners:{},attributes:{},appendChild(child){this.children.push(child);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,v){this.listeners[k]=v;}};}
    const ctx={document:{createElement:element},sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>{if(denyWrites)throw Error('Quota exceeded');saved.set(k,v);}},CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}},window:{HSArtworkEngine:{recipes},dispatchEvent:event=>events.push(event)}};
    const source=readFileSync(new URL('../../shopify/assets/hs-artwork-choices.js',import.meta.url),'utf8');
    vm.runInNewContext(minify?transformSync(source,{minify:true}).code:source,ctx);
    ctx.window.HSArtworkChoices.select({style:'ink',tone:'sentimental'});
    const host=element('div');ctx.window.HSArtworkChoices.mount(host,options);
    const style=host.children[0].children[0],tone=options.toneElsewhere?null:host.children[1].children[0],status=host.children.at(-1);
    denyWrites=true;style.value='comic';if(tone)tone.value='hilarious';style.listeners.change();
    assert.equal(style.value,'ink');if(tone)assert.equal(tone.value,'sentimental');
    if(tone){tone.value='hilarious';tone.listeners.change();assert.equal(tone.value,'sentimental');}
    assert.equal(events.length,1);assert.equal(status.attributes.role,'status');
    assert.match(status.textContent,/could not be saved/i);
    assert.match(status.textContent,/previous choices/i);
    denyWrites=false;style.value='comic';if(tone)tone.value='hilarious';style.listeners.change();
    assert.equal(ctx.window.HSArtworkChoices.read().style,'comic');
    assert.equal(ctx.window.HSArtworkChoices.read().tone,tone?'hilarious':'sentimental');assert.equal(events.length,2);
  });

  test(mode+': failed Buddy tone save restores range, visible label and accessible value without dispatch',()=>{
    const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
    const start=source.indexOf('  function selectTone('),code=source.slice(start,source.indexOf('\n  function ',start+1));
    const range={value:'2',attributes:{'aria-valuetext':'Hilarious'},setAttribute(k,v){this.attributes[k]=v;}},label={textContent:'Hilarious'},status={textContent:''};
    const nodes={'[data-hs3-tone]':range,'[data-hs3-tone-name]':label,'#hs3-tone-status':status};
    const ctx={S:{noteTone:'warm'},ui:{},cfg:{artworkCandidates:true},frame:{querySelector:k=>nodes[k]},window:{HSArtworkChoices:{select:()=>{throw Error('Quota exceeded');}}},save:()=>{throw Error('state must not change');},track:()=>{throw Error('selection must not succeed');}};
    vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,ctx);ctx.selectTone('hilarious');
    assert.equal(ctx.S.noteTone,'warm');assert.equal(String(range.value),'1');
    assert.equal(label.textContent,'Warm with a wink');assert.equal(range.attributes['aria-valuetext'],'Warm with a wink');
    assert.match(status.textContent,/could not be saved/);assert.match(status.textContent,/previous tone/);
  });
}
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
  const ctx={state,bridge:{owned:{}},cityArtPreview:()=>true,nativeArtworkPurchase:()=>false,norm:x=>String(x||'').toLowerCase(),answer:k=>k==='art_style'?'Fine ink drawing':'Hilarious',val:()=>'',lines:()=>({}),V3_ORDER:{print:['home','spot','together','meaning']},v3Kind:()=> 'print',sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},save:()=>{},render:()=>{}};
  const code=section('choiceMatches')+'\n'+section('watchField');vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,ctx);
  assert.equal(ctx.choiceMatches('Fine ink drawing','art_style'),true);assert.equal(ctx.choiceMatches('Comic book','art_style'),false);
  function input(k,value){const events={};const el={value,name:k,id:k,tagName:'INPUT',addEventListener:(n,fn)=>events[n]=fn};ctx.watchField(el,k);events.input();}
  input('line4','My exact new note.');input('signed','Always, Test dog');
  assert.equal(state.hs3_copy_owner,'user');assert.equal(state.hs3_signature_override,'Always, Test dog');
  const edits=JSON.parse(saved.get('hs3-gift')).edits;assert.equal(edits.meaning,'My exact new note.');assert.equal(edits.spot,'Earlier edit');
});

for (const minify of [false,true]) test((minify?'minified':'source')+': optional city stays absent and clears stale native defaults',()=>{
  const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
  const section=name=>source.slice(source.indexOf('  function '+name+'('),source.indexOf('\n  function ',source.indexOf('  function '+name+'(')+1));
  const ctx={state:{city:''},cityArtPreview:()=>true,nativeArtworkPurchase:()=>false,blanketArtPreview:()=>false,document:{querySelector:()=>null},window:{},artworkFacts:()=>JSON.stringify({version:1,facts:[{source:'spot',text:'Does not chase balls.'}]}),bridge:{owned:{}},save:()=>{},render:()=>{},mugArtworkMismatch:()=>false,setValue:(el,v)=>{el.value=v;}};
  const code=['answer','nativeArtworkEvidence','watchField','fillField'].map(section).join('\n');vm.runInNewContext(minify?transformSync(code,{minify:true}).code:code,ctx);
  assert.equal(ctx.answer('city'),'');assert.equal(JSON.parse(ctx.nativeArtworkEvidence()).place,null);
  const events={},inp={value:'Somewhere quiet',name:'city',tagName:'INPUT',addEventListener:(n,fn)=>events[n]=fn};
  const el={querySelector:s=>s.startsWith('input')?inp:null,setAttribute:()=>{}};
  ctx.fillField({rule:{k:'city'},el});assert.equal(inp.value,'');
  inp.value='  ';events.input();events.blur();assert.equal(inp.value,'');assert.equal(ctx.state.city,'');
  inp.value='São Paulo';events.input();assert.deepEqual(JSON.parse(ctx.nativeArtworkEvidence()).place,{source:'buyer',text:'São Paulo'});
  inp.value='';events.input();assert.equal(JSON.parse(ctx.nativeArtworkEvidence()).place,null);
  assert.equal(JSON.parse(ctx.nativeArtworkEvidence()).facts[0].text,'Does not chase balls.');
  ctx.state.city='Paris';ctx.blanketArtPreview=()=>true;assert.equal('place' in JSON.parse(ctx.nativeArtworkEvidence()),false);
});
test('portrait native prompt has no required City substitution',()=>{
  const prompt=nativePrompt('portrait');assert.ok(!prompt.includes('{{City}}'));assert.ok(prompt.includes('place is null or absent'));assert.ok(prompt.includes('{{Personality}}'));
});
