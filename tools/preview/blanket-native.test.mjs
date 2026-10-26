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

for(const minified of [false,true]) {
  const label=minified?'minified':'source';
  test(label+': native blanket carries factual profile and shared visual tone without legacy words',()=>{
    const ctx={cityArtPreview:()=>false,nativeBlanketPurchase:()=>true,blanketArtPreview:()=>true,nativeArtworkEvidence:()=>'{"version":1,"facts":[{"source":"spot","text":"Does not chase balls"}]}',window:{HSArtworkChoices:{read:()=>({style:'ink',tone:'hilarious'})},HSArtworkEngine:{recipes:{styles:{ink:{label:'Fine ink drawing'}},tones:{hilarious:{label:'Hilarious'}},toneRouting:{textProductImageTone:'warm'}}}},V3_ANSWER:/^line/,state:{},DEFAULTS:{},NAMES:[]};
    run(['answer'],ctx,minified);
    assert.match(ctx.answer('personality'),/Does not chase balls/);
    assert.equal(ctx.answer('art_style'),'Fine ink drawing');assert.equal(ctx.answer('art_tone'),'Hilarious');
  });
  test(label+': restored photo never enters automatic handoff or timed AI retry on purchase route',()=>{
    let uploads=0,timers=0;
    const ctx={cityArtPreview:()=>false,nativeBlanketPurchase:()=>true,photoInput:()=>{uploads++;return{};},document:{querySelector:()=>null},DataTransfer:class {constructor(){throw Error('must not dispatch');}},setInterval:()=>timers++,clearInterval:()=>{},track:()=>{}};
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
  test(label+': capture handler permits one explicit upload and blocks a repeated file event before native dispatch',()=>{
    let listener,allowed=true,used=0,marked=0,blocked=0,tracked=0;
    const ctx={document:{addEventListener:(name,fn,capture)=>{assert.equal(name,'change');assert.equal(capture,true);listener=fn;}},doHandoff:{},nativeBlanketPurchase:()=>true,beginBlanketUpload:()=>{const first=allowed;allowed=false;return first;},blanketPurchaseStatus:()=>{},markHanded:()=>{},usePhoto:()=>used++,cityArtPreview:()=>false,markArtRequested:()=>marked++,state:{},save:()=>{},savePhoto:()=>{},track:()=>tracked++};
    run(['keepTibPhoto'],ctx,minified);ctx.keepTibPhoto();
    const input={type:'file',matches:()=>true,files:[{type:'image/png'}],value:'chosen'};
    const change=()=>listener({target:input,preventDefault:()=>blocked++,stopImmediatePropagation:()=>blocked++});
    change();assert.equal(used,1);assert.equal(marked,1);assert.equal(tracked,1);assert.equal(blocked,0);
    change();assert.equal(used,1);assert.equal(marked,1);assert.equal(tracked,1);assert.equal(blocked,2);assert.equal(input.value,'');
  });
  test(label+': explicit cached-photo click reuses Buddy file once without timers or automatic retry',()=>{
    let listener,pending=false,dispatches=0,marked=0;
    const file={type:'image/png',name:'synthetic-fixture.png'};
    const target={type:'file',matches:()=>true,dispatchEvent:event=>{dispatches++;event.target=target;listener(event);}};
    const usePhoto=()=>{};usePhoto.file=file;
    const ctx={document:{addEventListener:(name,fn)=>listener=fn},doHandoff:{},nativeBlanketPurchase:()=>true,blanketUploadPending:()=>pending,nativeBlanketInputsReady:()=>true,beginBlanketUpload:()=>{if(pending)return false;pending=true;return true;},photoInput:()=>target,blanketPurchaseStatus:()=>{},usePhoto,markHanded:()=>{},cityArtPreview:()=>false,markArtRequested:()=>marked++,state:{},save:()=>{},savePhoto:()=>{},track:()=>{},DataTransfer:class{constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}},Event:class{constructor(type,options){this.type=type;this.bubbles=options.bubbles;}preventDefault(){}stopImmediatePropagation(){}}};
    run(['keepTibPhoto','sendBlanketPhoto'],ctx,minified);ctx.keepTibPhoto();
    assert.equal(dispatches,0);ctx.sendBlanketPhoto();assert.equal(dispatches,1);assert.equal(marked,1);assert.equal(target.files[0],file);assert.equal(pending,true);
    ctx.sendBlanketPhoto();assert.equal(dispatches,1);assert.equal(marked,1);
  });
  test(label+': native cart blocks unresolved, stale and unsaved images but permits the saved matching result',()=>{
    const events={};let pending=false,ready=false,image=false,accepted=false,blocked=0;
    const ctx={document:{addEventListener:(name,fn)=>events[name]=fn},cityArtPreview:()=>false,nativeBlanketPurchase:()=>true,giftView:()=>false,blanketUploadPending:()=>pending,nativeBlanketInputsReady:()=>ready,cityArtSaved:()=>image,blanketReviewAccepted:()=>accepted,blanketPurchaseStatus:()=>{}};
    run(['guardGiftPhoto'],ctx,minified);ctx.guardGiftPhoto();
    const click=()=>events.click({target:{closest:()=>({})},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});
    click();assert.equal(blocked,1);ready=true;click();assert.equal(blocked,2);image=true;pending=true;click();assert.equal(blocked,3);pending=false;click();assert.equal(blocked,4);accepted=true;click();assert.equal(blocked,4);
    events.submit({target:{closest:()=>({})},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});assert.equal(blocked,5);
  });
  test(label+': explicit recovery invalidates previous acceptance without dispatching a replacement',()=>{
    const saved=new Map([['hs2-blanket-upload:7','pending']]);
    const ctx={productId:()=>7,doHandoff:{artKey:'previous'},blanketAcceptedKey:'previous',window:{sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
    run(['resetBlanketUpload'],ctx,minified);assert.equal(ctx.resetBlanketUpload(),true);
    assert.equal(saved.has('hs2-blanket-upload:7'),false);assert.equal(saved.get('hs2-art-request:7:latest'),'retry-required');assert.equal(ctx.doHandoff.artKey,'');assert.equal(ctx.blanketAcceptedKey,'');
    ctx.window.sessionStorage.setItem=()=>{throw Error('Quota');};assert.equal(ctx.resetBlanketUpload(),false);
  });
  test(label+': buyer acceptance follows exact source and choices and visible native errors block it',()=>{
    let key='first',src='saved.png',errors=[];
    const ctx={artRequestKey:()=>key,cityArtSource:()=>src,blanketAcceptedKey:'first:saved.png',document:{querySelectorAll:()=>errors}};
    run(['blanketReviewKey','blanketNativeError','blanketReviewAccepted'],ctx,minified);
    assert.equal(ctx.blanketReviewAccepted(),true);key='other';assert.equal(ctx.blanketReviewAccepted(),false);key='first';src='raw.png';assert.equal(ctx.blanketReviewAccepted(),false);src='saved.png';
    errors=[{getClientRects:()=>[{}],classList:{contains:()=>false},textContent:'Image generation failed'}];assert.equal(ctx.blanketReviewAccepted(),false);
    errors[0].getClientRects=()=>[];assert.equal(ctx.blanketReviewAccepted(),true);
  });
  test(label+': changed shared choices invalidate accepted artwork on native blanket',()=>{
    let current=false,src='https://example.test/generated.png';
    const ctx={cityArtPreview:()=>false,nativeBlanketPurchase:()=>true,artRequested:()=>current,artRequestKey:()=> 'current',cityArtSource:()=>src,window:{sessionStorage:{getItem:()=> 'https://example.test/old.png'}},document:{querySelector:s=>s==='.vm--container'?null:{getAttribute:()=>src}}};
    run(['cityArtSaved'],ctx,minified);assert.equal(ctx.cityArtSaved(),false);current=true;assert.equal(ctx.cityArtSaved(),true);current=false;assert.equal(ctx.cityArtSaved(),false);
  });
}

test('dedicated purchase template keeps preview protections and worded gifts separate',()=>{
  const t=JSON.parse(read('shopify/templates/product.blanket-native.json')).sections.main;
  assert.equal(t.settings.blanket_purchase,true);assert.equal(t.settings.blanket_art_preview,undefined);assert.equal(t.settings.city_art_preview,undefined);
  assert.equal(t.blocks.buy.settings.v3,false);assert.equal(t.blocks.answers.settings.title,'YOUR ARTWORK');assert.ok(t.block_order.includes('description'));
  const preview=JSON.parse(read('shopify/templates/product.blanket-art-preview.json')).sections.main;assert.equal(preview.settings.blanket_art_preview,true);assert.equal(preview.settings.blanket_purchase,undefined);
  const liquid=read('shopify/sections/hs2-product.liquid');const props=liquid.slice(liquid.indexOf('{%- if s.blanket_purchase -%}'),liquid.indexOf('{%- elsif block.settings.v3 -%}'));
  assert.ok(props.includes('_hs_art_profile'));assert.ok(props.includes('_hs_art_style'));assert.ok(props.includes('_hs_art_tone'));assert.equal(props.includes('_hs_lines'),false);
});
