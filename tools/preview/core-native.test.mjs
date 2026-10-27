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
    test(`${mode}: ${kind} purchase requires enabled flag and exact rendered note/signature`,()=>{
      let enabled='false',shown={line4:'My exact note',signed:'Love, Test dog'},inputs={...shown};
      const c={document:{querySelector:()=>({getAttribute:()=>enabled})},answer:k=>k==='line4'?'My exact note':'Love, Test dog',mugArtworkValue:k=>shown[k],tibFields:()=>['line4','signed'].map(k=>({rule:{k},el:{querySelector:()=>({name:k,value:inputs[k]})}}))};
      run(['nativePurchaseReady'],c,minified);assert.equal(c.nativePurchaseReady(),false);
      enabled='true';assert.equal(c.nativePurchaseReady(),true);
      shown.line4='Old default note';assert.equal(c.nativePurchaseReady(),false);shown.line4=inputs.line4;
      inputs.signed='Stranger';assert.equal(c.nativePurchaseReady(),false);inputs.signed='Love, Test dog';
      shown.signed=null;assert.equal(c.nativePurchaseReady(),false);
    });
    test(`${mode}: ${kind} uses the single exact Buddy note and variant selection reuses artwork`,()=>{
      let variant='first',style='ink',facts='{"version":1,"facts":[]}';
      const c={state:{hs3_lines:{meaning:'One exact note',home:'Other words'},dog:'Test dog'},V3_ORDER:{mug:['home','spot','meaning'],print:['home','spot','together','meaning']},nativeArtworkPurchase:()=>true,blanketArtPreview:()=>false,cityArtPreview:()=>false,v3Kind:()=>kind,productId:()=>1,usePhoto:{t:1},artworkFacts:()=>facts,document:{querySelector:s=>s==='#buy[data-hs2-artwork-kind]'?{}:s==='[data-hs2-variant-id]'?{value:variant}:null},window:{HSArtworkChoices:{read:()=>({style,tone:'warm'})},HSArtworkEngine:{recipeHash:'recipe'}}};
      run(['v3Answer','artRequestKey'],c,minified);
      assert.equal(c.v3Answer('line4'),'One exact note');assert.equal(c.v3Answer('hs_lines'),'One exact note');
      const first=c.artRequestKey();variant='another-frame-or-color';assert.equal(c.artRequestKey(),first);
      style='comic';assert.notEqual(c.artRequestKey(),first);style='ink';facts='{"version":1,"facts":[{"source":"spot","text":"Rests by the door"}]}';assert.notEqual(c.artRequestKey(),first);
    });
  }
  test(mode+': new native mug bypasses only the legacy four-line proof gate',()=>{
    let click;const c={document:{addEventListener:(_,fn)=>click=fn},mugProduct:()=>true,nativeArtworkPurchase:()=>true,tibFields:()=>{throw Error('legacy four-line gate must not run');}};
    run(['guardMugProof'],c,minified);c.guardMugProof();click({target:{closest:()=>({})}});
  });
}
test('new native templates are disabled by default and use their real photo layers',()=>{
  for(const [name,kind] of [['mug-native','mug'],['portrait-native','print']]){
    const t=JSON.parse(readFileSync(new URL('../../shopify/templates/product.'+name+'.json',import.meta.url),'utf8')).sections.main;
    assert.equal(t.settings.native_artwork_kind,kind);assert.equal(t.settings.native_purchase_enabled,false);assert.equal(t.settings.blanket_purchase,undefined);
    assert.equal(t.blocks.buy.settings.v3,false);assert.match(t.blocks.price.settings.note,/calculated at checkout/);
    if(kind==='print')assert.equal(t.blocks.teeinblue_product_personalizer_product_app_block_UBn6nK.settings.show_available_product,true);
  }
  const liquid=readFileSync(new URL('../../shopify/snippets/hs-native-artwork.liquid',import.meta.url),'utf8');
  assert.match(liquid,/native_artwork_kind == 'mug'.*layer-696867.*native_artwork_kind == 'print'.*layer-747218/);
});
