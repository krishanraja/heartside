import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
function run(names,ctx,minified){const code=names.map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);return ctx;}
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  for(const kind of ['mug','print']) {
    if (kind === 'mug') test(`${mode}: ${kind} editable-signature adapter requires enabled flag and exact rendered note/signature`,()=>{
      let enabled='false',shown={line4:'My exact note',signed:'Love, Test dog'},inputs={...shown};
      const c={document:{querySelector:()=>({getAttribute:k=>k==='data-hs2-artwork-kind'?'mug':enabled})},answer:k=>k==='line4'?'My exact note':'Love, Test dog',mugArtworkValue:k=>shown[k],tibFields:()=>['line4','signed'].map(k=>({rule:{k},el:{querySelector:()=>({name:k,value:inputs[k]})}}))};
      run(['nativePurchaseReady'],c,minified);assert.equal(c.nativePurchaseReady(),false);
      enabled='true';assert.equal(c.nativePurchaseReady(),true);
      shown.line4='Old default note';assert.equal(c.nativePurchaseReady(),false);shown.line4=inputs.line4;
      inputs.signed='Stranger';assert.equal(c.nativePurchaseReady(),false);inputs.signed='Love, Test dog';
      shown.signed=null;assert.equal(c.nativePurchaseReady(),false);
    });
    test(`${mode}: ${kind} uses the single exact Buddy note and variant selection reuses artwork`,()=>{
      let variant='first',style='ink',facts='{"version":1,"facts":[]}';
      const c={state:{hs3_lines:{meaning:'One exact note',home:'Other words'},dog:'Test dog'},V3_ORDER:{mug:['home','spot','meaning'],print:['home','spot','together','meaning']},nativeArtworkPurchase:()=>true,blanketArtPreview:()=>false,cityArtPreview:()=>false,v3Kind:()=>kind,productId:()=>1,usePhoto:{t:1},artworkFacts:()=>facts,artworkEnergy:()=>null,document:{querySelector:s=>s==='#buy[data-hs2-artwork-kind]'?{}:s==='[data-hs2-variant-id]'?{value:variant}:null},window:{HSArtworkChoices:{read:()=>({style,tone:'warm'})},HSArtworkEngine:{recipeHash:'recipe'}}};
      run(['v3Answer','artRequestKey'],c,minified);
      assert.equal(c.v3Answer('line4'),'One exact note');
      // artwork only (31 Oct): the order carries the whole note the buyer approved, line by line, for the slip and the card
      assert.equal(c.v3Answer('hs_lines'),'Other words\nOne exact note');
      const first=c.artRequestKey();variant='another-frame-or-color';assert.equal(c.artRequestKey(),first);
      style='comic';assert.notEqual(c.artRequestKey(),first);style='ink';facts='{"version":1,"facts":[{"source":"spot","text":"Rests by the door"}]}';assert.notEqual(c.artRequestKey(),first);
    });
  }
  test(mode+': optional blank note and signature require visibly rendered empty text',()=>{
    let layerPresent=true, textPresent=true, rendered='';
    const text={querySelectorAll:()=>[],get textContent(){return rendered;}};
    const c={nativeArtworkPurchase:()=>true,mugProduct:()=>false,answer:()=>'',document:{querySelector:()=>({getAttribute:()=> 'true'}),getElementById:()=>layerPresent?{querySelector:()=>textPresent?text:null}:null},tibFields:()=>['line4','signed'].map(k=>({rule:{k},el:{querySelector:()=>({name:k,value:''})}}))};
    run(['mugArtworkValue','nativePurchaseReady'],c,minified);
    assert.equal(c.nativePurchaseReady(),true);
    rendered='Old note';assert.equal(c.nativePurchaseReady(),false);rendered='';
    textPresent=false;assert.equal(c.nativePurchaseReady(),false);textPresent=true;
    layerPresent=false;assert.equal(c.nativePurchaseReady(),false);
  });
  test(mode+': artwork only: a design with no note or signature fields needs no words, once Teeinblue has drawn its form',()=>{
    let drawn=true;
    const c={nativeArtworkPurchase:()=>true,mugProduct:()=>false,answer:()=>'Love, Pip',document:{querySelector:s=>s==='.tee-field'?(drawn?{}:null):({getAttribute:()=> 'true'})},getElementById:()=>null,tibFields:()=>[]};
    for (const kind of ['mug','print']) {
      c.document.querySelector=s=>s==='.tee-field'?(drawn?{}:null):s==='#buy[data-hs2-artwork-kind]'?{getAttribute:k=>k==='data-hs2-artwork-kind'?kind:'true'}:null;
      run(['mugArtworkValue','nativePurchaseReady'],c,minified);
      drawn=true;assert.equal(c.nativePurchaseReady(),true,kind+': no words to check');
      drawn=false;assert.equal(c.nativePurchaseReady(),false,kind+': nothing drawn yet');
    }
  });
  test(mode+': disabled native purchase gives shopper availability copy without starting a request',()=>{
    let click, message='', blocked=0;
    const c={document:{addEventListener:(event,fn)=>{if(event==='click')click=fn;},querySelector:()=>({getAttribute:()=> 'false'})},nativeArtworkPurchase:()=>true,cityArtPreview:()=>false,giftView:()=>false,nativePurchaseReady:()=>false,blanketUploadPending:()=>false,nativeBlanketInputsReady:()=>true,cityArtSaved:()=>true,blanketReviewAccepted:()=>true,blanketPurchaseStatus:s=>message=s};
    run(['nudgeReview','guardGiftPhoto'],c,minified);c.guardGiftPhoto();
    click({target:{closest:s=>s.includes('recustomize')?null:{}},preventDefault:()=>blocked++,stopImmediatePropagation:()=>{}});
    assert.equal(blocked,1);assert.equal(message,'This gift is not available to order yet.');
  });
  test(mode+': new native mug bypasses only the legacy four-line proof gate',()=>{
    let click;const c={document:{addEventListener:(_,fn)=>click=fn},mugProduct:()=>true,nativeArtworkPurchase:()=>true,tibFields:()=>{throw Error('legacy four-line gate must not run');}};
    run(['guardMugProof'],c,minified);c.guardMugProof();click({target:{closest:()=>({})}});
  });
}
test('release native templates enable ordering and actual-design checkout images',()=>{
  for(const [name,kind] of [['mug-native','mug'],['portrait-native','print']]){
    const t=JSON.parse(readFileSync(new URL('../../shopify/templates/product.'+name+'.json',import.meta.url),'utf8')).sections.main;
    assert.equal(t.settings.native_artwork_kind,kind);assert.equal(t.settings.native_purchase_enabled,true);assert.equal(t.settings.blanket_purchase,undefined);
    assert.equal(t.settings.checkout_image_enabled,true);
    assert.equal(t.settings.checkout_image_endpoint,'/apps/heartside-artwork');
    assert.match(t.settings.checkout_image_cdn_prefix,/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/[^\s]+\/files\/$/);
    assert.equal(t.blocks.buy.settings.v3,false);assert.equal(t.blocks.price.settings.note,'Free US shipping on every order.');
    if(kind==='print')assert.equal(t.blocks.teeinblue_product_personalizer_product_app_block_UBn6nK.settings.show_available_product,true);
  }
  const liquid=readFileSync(new URL('../../shopify/snippets/hs-native-artwork.liquid',import.meta.url),'utf8');
  assert.match(liquid,/native_artwork_kind == 'mug'.*layer-696867.*native_artwork_kind == 'print'.*layer-747218/);
});

test('shopper recovery copy does not imply an API charge or expose enablement settings',()=>{
  const liquid=readFileSync(new URL('../../shopify/snippets/hs-native-artwork.liquid',import.meta.url),'utf8');
  assert.doesNotMatch(liquid,/charge again|API|billing/);
  assert.match(liquid,/will not start a new artwork until you choose a photo again/);
  assert.doesNotMatch(source,/Ordering must also be enabled/);
  assert.match(source,/This gift is not available to order yet/);
});
