import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const baseline=process.env.HS_BLANKET_TEST_BASELINE;
const root=new URL('../../',import.meta.url);
const read=path=>baseline?execFileSync('git',['show',`${baseline}:${path}`],{cwd:root,encoding:'utf8'}):readFileSync(new URL(path,root),'utf8');
const source=read('shopify/assets/hs2.js');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1,`missing ${name}`);return source.slice(start,source.indexOf('\n  function ',start+1));};
function run(names,ctx,minified){const code=names.map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);return ctx;}

function uploadHarness(minified) {
  let listener,pending=false,marked=0,preparations=0,key='original',release;
  const raw={type:'image/jpeg',name:'original-with-location.jpg'},clean={type:'image/png',name:'dog-artwork-source.png'},vendor=[];
  const usePhoto=()=>{};usePhoto.file=raw;
  const input={type:'file',matches:()=>true,isConnected:true,files:[raw],value:'chosen',dispatchEvent:event=>{event.target=input;listener(event);if(!event.blocked)vendor.push(input.files[0]);}};
  const ctx={window:{HSArtworkPhoto:{prepare:()=>{preparations++;return new Promise((resolve,reject)=>{release=fail=>fail?reject(Error('decode')):resolve({file:clean,photo:{metadataRemoved:true,originalHash:'original',uploadHash:'clean'},width:10,height:20});});}}},document:{addEventListener:(name,fn)=>listener=fn},doHandoff:{},nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,blanketUploadPending:()=>pending,nativeBlanketInputsReady:()=>true,beginBlanketUpload:()=>{if(pending)return false;pending=true;return true;},artRequestKey:()=>key,photoInput:()=>input,blanketPurchaseStatus:()=>{},usePhoto,markHanded:()=>{},cityArtPreview:()=>false,markArtRequested:()=>marked++,state:{},save:()=>{},savePhoto:()=>{},track:()=>{},DataTransfer:class{constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}},Event:class{constructor(type){this.type=type;}preventDefault(){this.blocked=true;}stopImmediatePropagation(){this.blocked=true;}}};
  ctx.resetBlanketUpload=()=>{pending=false;ctx.keepTibPhoto.preparing=null;return true;};
  run(['keepTibPhoto','sendBlanketPhoto'],ctx,minified);ctx.keepTibPhoto();
  return {ctx,input,clean,vendor,pending:()=>pending,marked:()=>marked,preparations:()=>preparations,release:fail=>release(fail),changeKey:()=>{key='changed';}};
}

for(const minified of [false,true]) {
  const label=minified?'minified':'source';
  test(label+': native blanket carries factual profile and shared visual tone without legacy words',()=>{
    const ctx={cityArtPreview:()=>false,nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,blanketArtPreview:()=>true,nativeArtworkEvidence:()=>'{"version":1,"facts":[{"source":"spot","text":"Does not chase balls"}]}',window:{HSArtworkChoices:{read:()=>({style:'ink',tone:'hilarious'})},HSArtworkEngine:{recipes:{styles:{ink:{label:'Fine ink drawing'}},tones:{hilarious:{label:'Hilarious'}},toneRouting:{textProductImageTone:'warm'}}}},V3_ANSWER:/^line/,state:{},DEFAULTS:{},NAMES:[]};
    run(['answer'],ctx,minified);
    assert.match(ctx.answer('personality'),/Does not chase balls/);
    assert.equal(ctx.answer('art_style'),'Fine ink drawing');assert.equal(ctx.answer('art_tone'),'Hilarious');
  });
  test(label+': restored photo never enters automatic handoff or timed AI retry on purchase route',()=>{
    let uploads=0,timers=0;
    const ctx={cityArtPreview:()=>false,nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,photoInput:()=>{uploads++;return{};},document:{querySelector:()=>null},DataTransfer:class {constructor(){throw Error('must not dispatch');}},setInterval:()=>timers++,clearInterval:()=>{},track:()=>{}};
    run(['doHandoff'],ctx,minified);ctx.doHandoff(null);ctx.doHandoff(null,1);
    assert.equal(uploads,0);assert.equal(timers,0);
  });
  test(label+': native metadata must match selected values before photo or cart',()=>{
    let actual='warm';
    const field=(key)=>({rule:{k:key},el:{querySelector:selector=>selector==='select'?key==='personality'?null:{options:[{textContent:actual}],selectedIndex:0}:key==='personality'?{value:'facts'}:null,querySelectorAll:()=>[]}});
    const ctx={tibFields:()=>['personality','art_style','art_tone'].map(field),answer:k=>k==='personality'?'facts':'ink',choiceMatches:(text)=>text==='ink'};
    run(['nativeBlanketInputsReady'],ctx,minified);assert.equal(ctx.nativeBlanketInputsReady(),false);actual='ink';assert.equal(ctx.nativeBlanketInputsReady(),true);
    ctx.tibFields=()=>[];assert.equal(ctx.nativeBlanketInputsReady(),false);
  });
  test(label+': pending upload survives reload and holds second request until a new saved result',()=>{
    const saved=new Map();let src='before',photo='before',modal=false,deny=false;
    const ctx={productId:()=>7,cityArtSource:()=>src,nativeBlanketInputsReady:()=>true,window:{sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>{if(deny)throw Error('Quota');saved.set(k,v);},removeItem:k=>saved.delete(k)}},document:{querySelector:selector=>selector==='.vm--container'?(modal?{}:null):{getAttribute:()=>photo}}};
    run(['blanketUploadPending','beginBlanketUpload'],ctx,minified);
    assert.equal(ctx.beginBlanketUpload(),true);assert.equal(ctx.beginBlanketUpload(),false);
    run(['blanketUploadPending','beginBlanketUpload'],ctx,minified);assert.equal(ctx.blanketUploadPending(),true);
    src='new';assert.equal(ctx.blanketUploadPending(),true);photo='new';modal=true;assert.equal(ctx.blanketUploadPending(),true);
    modal=false;assert.equal(ctx.blanketUploadPending(),false);assert.equal(saved.size,0);
    deny=true;assert.equal(ctx.beginBlanketUpload(),false);assert.equal(saved.size,0);
  });
  test(label+': direct or Buddy upload removes metadata before exactly one vendor event',async()=>{
    for(const fromBuddy of [false,true]) {
      const h=uploadHarness(minified);
      if(fromBuddy) h.ctx.sendBlanketPhoto(); else h.input.dispatchEvent(new h.ctx.Event('change'));
      assert.equal(h.vendor.length,0); assert.equal(h.pending(),true);
      h.input.dispatchEvent(new h.ctx.Event('change'));
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(h.preparations(),1);
      h.release(); await new Promise(resolve=>setImmediate(resolve));
      assert.equal(h.vendor.length,1);assert.equal(h.vendor[0],h.clean);assert.equal(h.marked(),1);
      assert.equal(h.ctx.state.hs3_photo_provenance.photo.metadataRemoved,true);
      h.ctx.sendBlanketPhoto();assert.equal(h.vendor.length,1);
    }
  });
  test(label+': failed preparation, changed choices and explicit reset cannot upload original or late result',async()=>{
    for(const outcome of ['failure','changed','reset','detached']) {
      const h=uploadHarness(minified);h.input.dispatchEvent(new h.ctx.Event('change'));
      await new Promise(resolve=>setImmediate(resolve));
      if(outcome==='changed') h.changeKey();
      if(outcome==='reset') h.ctx.resetBlanketUpload();
      if(outcome==='detached') h.input.isConnected=false;
      h.release(outcome==='failure');await new Promise(resolve=>setImmediate(resolve));
      assert.equal(h.vendor.length,0,outcome);assert.equal(h.marked(),0,outcome);assert.equal(h.pending(),false,outcome);
    }
  });
  test(label+': native cart blocks unresolved, stale and unsaved images but permits the saved matching result',()=>{
    const events={};let pending=false,ready=false,image=false,accepted=false,blocked=0;
    const ctx={document:{addEventListener:(name,fn)=>events[name]=fn,querySelector:()=>null},cityArtPreview:()=>false,nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,giftView:()=>false,blanketUploadPending:()=>pending,nativeBlanketInputsReady:()=>ready,cityArtSaved:()=>image,blanketReviewAccepted:()=>accepted,syncBlanketProperties:()=>{},blanketPurchaseStatus:()=>{}};
    run(['nudgeReview','guardGiftPhoto'],ctx,minified);ctx.guardGiftPhoto();
    const click=()=>events.click({target:{closest:selector=>selector.includes('recustomize')?null:{}},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});
    click();assert.equal(blocked,1);ready=true;click();assert.equal(blocked,2);image=true;pending=true;click();assert.equal(blocked,3);pending=false;click();assert.equal(blocked,4);accepted=true;click();assert.equal(blocked,4);
    events.submit({target:{closest:()=>({})},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});assert.equal(blocked,5);
  });
  test(label+': explicit recovery invalidates previous acceptance without dispatching a replacement',()=>{
    const saved=new Map([['hs2-blanket-upload:7','pending']]);
    const ctx={keepTibPhoto:{},productId:()=>7,doHandoff:{artKey:'previous'},blanketAcceptedKey:'previous',window:{sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
    run(['resetBlanketUpload'],ctx,minified);assert.equal(ctx.resetBlanketUpload(),true);
    assert.equal(saved.has('hs2-blanket-upload:7'),false);assert.equal(saved.get('hs2-art-request:7:latest'),'retry-required');assert.equal(ctx.doHandoff.artKey,'');assert.equal(ctx.blanketAcceptedKey,'');
    ctx.window.sessionStorage.setItem=()=>{throw Error('Quota');};assert.equal(ctx.resetBlanketUpload(),false);
  });
  test(label+': buyer acceptance follows exact source and choices and visible native errors block it',()=>{
    let key='first',src='saved.png',errors=[];
    const ctx={artRequestKey:()=>key,cityArtSource:()=>src,blanketAcceptedKey:'first:saved.png',document:{querySelector:()=>null,querySelectorAll:()=>errors}};
    run(['blanketReviewKey','blanketNativeError','blanketReviewAccepted'],ctx,minified);
    assert.equal(ctx.blanketReviewAccepted(),true);key='other';assert.equal(ctx.blanketReviewAccepted(),false);key='first';src='raw.png';assert.equal(ctx.blanketReviewAccepted(),false);src='saved.png';
    errors=[{getClientRects:()=>[{}],classList:{contains:()=>false},textContent:'Image generation failed'}];assert.equal(ctx.blanketReviewAccepted(),false);
    errors[0].getClientRects=()=>[];assert.equal(ctx.blanketReviewAccepted(),true);
  });
  test(label+': changed shared choices invalidate accepted artwork on native blanket',()=>{
    let current=false,src='https://example.test/generated.png';
    const ctx={restoredArtworkChosen:()=>false,cityArtPreview:()=>false,nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,artRequested:()=>current,artRequestKey:()=> 'current',cityArtSource:()=>src,window:{sessionStorage:{getItem:()=> 'https://example.test/old.png'}},document:{querySelector:s=>s==='.vm--container'?null:{getAttribute:()=>src}}};
    run(['cityArtSaved'],ctx,minified);assert.equal(ctx.cityArtSaved(),false);current=true;assert.equal(ctx.cityArtSaved(),true);current=false;assert.equal(ctx.cityArtSaved(),false);
  });
  test(label+': recropping the same saved image invalidates buyer acceptance without dispatch',()=>{
    const events={},checkbox={checked:true};let blocked=0;
    const ctx={blanketAcceptedKey:'same:same.png',blanketReviewKey:()=> 'same:same.png',blanketNativeError:()=>false,document:{addEventListener:(name,fn)=>events[name]=fn,querySelector:selector=>selector==='.vm--container'||selector==='#buy[data-hs2-artwork-kind]'?null:checkbox},nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,cityArtPreview:()=>false,giftView:()=>false,blanketUploadPending:()=>false,nativeBlanketInputsReady:()=>true,cityArtSaved:()=>true,blanketPurchaseStatus:()=>{},syncBlanketProperties:()=>{},invalidateBlanketReview:()=>{ctx.blanketAcceptedKey='';checkbox.checked=false;}};
    if(source.includes('  function invalidateBlanketReview(')) run(['invalidateBlanketReview'],ctx,minified);
    run(['nudgeReview','guardGiftPhoto','blanketReviewAccepted'],ctx,minified);ctx.guardGiftPhoto();assert.equal(ctx.blanketReviewAccepted(),true);
    events.click({target:{closest:selector=>selector.includes('recustomize')?{}:null}});
    assert.equal(ctx.blanketReviewAccepted(),false);assert.equal(checkbox.checked,false);
    events.click({target:{closest:selector=>selector.includes('recustomize')?null:{}},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});assert.equal(blocked,1);
  });
  test(label+': observing an open placement modal permanently clears acceptance after it closes',()=>{
    let modal=true;const checkbox={checked:true};
    const ctx={blanketAcceptedKey:'same:same.png',blanketReviewKey:()=> 'same:same.png',blanketNativeError:()=>false,document:{querySelector:selector=>selector==='.vm--container'?(modal?{}:null):checkbox},invalidateBlanketReview:()=>{ctx.blanketAcceptedKey='';checkbox.checked=false;}};
    if(source.includes('  function invalidateBlanketReview(')) run(['invalidateBlanketReview'],ctx,minified);
    run(['blanketReviewAccepted'],ctx,minified);assert.equal(ctx.blanketReviewAccepted(),false);modal=false;assert.equal(ctx.blanketReviewAccepted(),false);assert.equal(checkbox.checked,false);
  });
  test(label+': shared-choice event and permitted cart both refresh hidden order metadata',()=>{
    const props=['personality','art_style','art_tone'].map(key=>({name:`properties[_hs_${key}]`,value:'initial',getAttribute:()=>key}));
    const events={};let style='Fine ink drawing',tone='Hilarious',bridges=0;
    const ctx={document:{querySelectorAll:()=>props,addEventListener:(name,fn)=>events[name]=fn},window:{addEventListener:(name,fn)=>events[name]=fn},nativeArtworkPurchase:()=>true,nativePurchaseReady:()=>true,answer:key=>key==='personality'?'current facts':key==='art_style'?style:tone,runBridge:()=>bridges++,cityArtPreview:()=>false,giftView:()=>false,blanketUploadPending:()=>false,nativeBlanketInputsReady:()=>true,cityArtSaved:()=>true,blanketReviewAccepted:()=>true,blanketPurchaseStatus:()=>{}};
    if(source.includes('  function syncBlanketProperties(')) run(['syncBlanketProperties','artworkChoicesChanged'],ctx,minified);
    const registration=source.match(/window\.addEventListener\('hs-artwork-choices', [^\n]+/)[0];vm.runInNewContext(minified?transformSync(registration,{minify:true}).code:registration,ctx);
    events['hs-artwork-choices']();assert.equal(bridges,1);assert.deepEqual(props.map(input=>input.value),['current facts','Fine ink drawing','Hilarious']);
    run(['nudgeReview','guardGiftPhoto'],ctx,minified);ctx.guardGiftPhoto();style='Painterly';tone='Warm';
    events.click({target:{closest:selector=>selector.includes('recustomize')?null:{}},preventDefault:()=>assert.fail('current reviewed cart should pass'),stopImmediatePropagation:()=>{}});
    assert.deepEqual(props.map(input=>input.value),['current facts','Painterly','Warm']);
  });
}

test('dedicated purchase template keeps preview protections and worded gifts separate',()=>{
  const t=JSON.parse(read('shopify/templates/product.blanket-native.json')).sections.main;
  assert.equal(t.settings.blanket_purchase,true);assert.equal(t.settings.blanket_art_preview,undefined);assert.equal(t.settings.city_art_preview,undefined);
  assert.equal(t.blocks.buy.settings.v3,false);assert.equal(t.blocks.answers.settings.title,'YOUR ARTWORK');assert.ok(t.block_order.includes('description'));
  // the draft preview template has moved (27 Oct): it only points to the current gifts
  assert.deepEqual(Object.values(JSON.parse(read('shopify/templates/product.blanket-art-preview.json')).sections).map(x=>x.type),['hs-moved']);
  const liquid=read('shopify/sections/hs2-product.liquid');const props=liquid.slice(liquid.indexOf('{%- if native_artwork -%}'),liquid.indexOf('{%- elsif block.settings.v3 -%}'));
  assert.ok(props.includes('_hs_art_profile'));assert.ok(props.includes('_hs_art_style'));assert.ok(props.includes('_hs_art_tone'));assert.match(props, /unless s\.blanket_purchase.*_hs_lines.*endunless/);
});
