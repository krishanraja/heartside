import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
function fixture(minified,flag=true) {
  const saved=new Map();
  const ctx={URL,cfg:{artworkCandidates:true,blanketPurchase:flag,gifts:{mug:{url:'/products/fixture-mug?view=gift&variant=9',price:31},blanket:{url:'/products/new-configured-blanket?view=gift&view=blanket-art-preview&variant=42&keep=yes#art',price:137},print:{url:'/products/fixture-print?view=gift&variant=8',price:92}}},S:{sel:{mug:true,blanket:true,print:true,ornament:true}},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait'},DS:{mug:'Mug description',blanket:'Blanket description',print:'Print description'},shareWithBridge:()=>{},mugColor:()=>({id:123,name:'Black'}),mugSwatches:()=>'',QKEY:'queue',track:()=>{},recGift:()=> 'blanket',esc:String,img:()=>'',lineFor:()=>'',window:{location:{href:'https://example.test/review'},sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
  const code=['priceOf','fmt','reviewGifts','blanketPurchaseEnabled','chooseModel','chooseView','addToCart'].map(section).join('\n');
  vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);
  return {ctx,saved};
}
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  test(mode+': blanket opt-in preserves configured handle, variant, query and hash while other gifts remain drafts',()=>{
    const {ctx,saved}=fixture(minified);ctx.addToCart();const queue=JSON.parse(saved.get('queue'));
    assert.equal(queue.length,3);
    const urls=queue.map(item=>new URL(item.url,'https://example.test'));
    assert.deepEqual(urls.map(url=>url.searchParams.getAll('view')),[['mug-art-preview'],['blanket-native'],['city-art-preview']]);
    assert.equal(urls[1].pathname,'/products/new-configured-blanket');assert.equal(urls[1].searchParams.get('variant'),'42');assert.equal(urls[1].searchParams.get('keep'),'yes');assert.equal(urls[1].hash,'#art');
    assert.equal(urls[0].searchParams.get('variant'),'123');assert.equal(urls[2].searchParams.get('variant'),'8');
  });
  test(mode+': default off retains paused blanket and no configured product cannot enable purchase',()=>{
    const {ctx,saved}=fixture(minified,false);ctx.addToCart();assert.match(JSON.parse(saved.get('queue'))[1].url,/view=blanket-art-preview/);
    ctx.cfg.blanketPurchase=true;ctx.cfg.gifts.blanket.url=null;assert.equal(ctx.blanketPurchaseEnabled(),false);assert.equal(ctx.chooseModel().missing.includes('blanket'),true);
  });
  test(mode+': review uses actual selected blanket price without pricing drafts or promising shipping',()=>{
    const {ctx}=fixture(minified);let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});
    assert.equal((html.match(/hs3-opt__price">Draft/g)||[]).length,2);assert.match(html,/hs3-opt__price">\$137/);assert.match(html,/Continue with selected gifts/);assert.doesNotMatch(html,/Free US shipping/);
    ctx.S.sel={blanket:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Personalize blanket · \$137/);assert.doesNotMatch(html,/Personalize blanket · \$89/);
    ctx.S.sel={mug:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Review selected drafts/);
  });
}
test('blanket purchase setting is default off and reads product picker price and URL',()=>{
  const liquid=readFileSync(new URL('../../shopify/sections/hs3-chat.liquid',import.meta.url),'utf8');
  const schema=JSON.parse(liquid.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  assert.equal(schema.settings.find(setting=>setting.id==='blanket_purchase').default,false);
  assert.match(liquid,/"blanketPurchase": {{ s.blanket_purchase \| json }}/);
  assert.match(liquid,/p\.price \| divided_by: 100\.0/);assert.match(liquid,/p\.url \| append: '\?view='/);
});
