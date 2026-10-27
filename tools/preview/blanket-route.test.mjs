import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=process.env.HS_BLANKET_ROUTE_BASELINE?execFileSync('git',['show',process.env.HS_BLANKET_ROUTE_BASELINE+':shopify/assets/hs3.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));};
function fixture(minified,flag=true) {
  const saved=new Map();
  const ctx={URL,cfg:{artworkCandidates:true,blanketPurchase:flag,gifts:{mug:{url:'/products/fixture-mug?view=gift&variant=9',price:31},blanket:{url:'/products/new-configured-blanket?view=gift&view=blanket-art-preview&variant=42&keep=yes#art',price:137},print:{url:'/products/fixture-print?view=gift&variant=8',price:92}}},S:{sel:{mug:true,blanket:true,print:true,ornament:true}},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait'},DS:{mug:'Mug description',blanket:'Blanket description',print:'Print description'},shareWithBridge:()=>{},mugColor:()=>({id:123,name:'Black'}),mugSwatches:()=>'',QKEY:'queue',track:()=>{},recGift:()=> 'blanket',esc:String,img:()=>'',lineFor:()=>'',window:{location:{href:'https://example.test/review'},sessionStorage:{setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}}};
  const code=['priceOf','fmt','reviewGifts','blanketPurchaseEnabled','selectedGifts','selectGift','chooseModel','chooseView','addToCart'].filter(name=>source.includes('  function '+name+'(')).map(section).join('\n');
  vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);
  let href=ctx.window.location.href;
  Object.defineProperty(ctx.window.location,'href',{get:()=>href,set:value=>{href=new URL(value,href).href;}});
  return {ctx,saved};
}
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  test(mode+': restored mixed selections reach only blanket purchase, preserving its handle, variant, query and hash',()=>{
    const {ctx,saved}=fixture(minified);saved.set('queue','old draft queue');ctx.addToCart();
    assert.equal(saved.has('queue'),false);
    const url=new URL(ctx.window.location.href,'https://example.test');
    assert.deepEqual(url.searchParams.getAll('view'),['blanket-native']);
    assert.equal(url.pathname,'/products/new-configured-blanket');assert.equal(url.searchParams.get('variant'),'42');assert.equal(url.searchParams.get('keep'),'yes');assert.equal(url.hash,'#art');
  });
  test(mode+': default off retains paused blanket and no configured product cannot enable purchase',()=>{
    const {ctx,saved}=fixture(minified,false);ctx.addToCart();assert.match(JSON.parse(saved.get('queue'))[1].url,/view=blanket-art-preview/);
    ctx.cfg.blanketPurchase=true;ctx.cfg.gifts.blanket.url=null;assert.equal(ctx.blanketPurchaseEnabled(),false);assert.equal(ctx.chooseModel().missing.includes('blanket'),true);
  });
  test(mode+': opt-in selection switches visibly between one purchase and one draft without creating a cart queue',()=>{
    const {ctx,saved}=fixture(minified);ctx.selectGift('mug');assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.sel)),{mug:true});assert.equal(ctx.chooseModel().count,1);
    let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Choose one at a time/);assert.match(html,/Drafts cannot be ordered/);assert.match(html,/>Review draft</);
    ctx.addToCart();assert.match(ctx.window.location.href,/view=mug-art-preview/);assert.equal(saved.has('queue'),false);
    ctx.selectGift('blanket');assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.sel)),{blanket:true});ctx.addToCart();assert.match(ctx.window.location.href,/view=blanket-native/);assert.equal(saved.has('queue'),false);
    ctx.selectGift('blanket');assert.equal(ctx.chooseModel().count,0);ctx.selectGift('print',true);ctx.addToCart();assert.match(ctx.window.location.href,/view=city-art-preview/);assert.equal(saved.has('queue'),false);
    const legacy=fixture(minified,false).ctx;legacy.S.sel={blanket:true};legacy.selectGift('mug');assert.equal(legacy.S.sel.blanket,true);assert.equal(legacy.S.sel.mug,true);assert.equal(legacy.chooseModel().count,2);
  });
  test(mode+': review uses actual selected blanket price without pricing drafts or promising shipping',()=>{
    const {ctx}=fixture(minified);let html=ctx.chooseView({dog:'Test dog',rec:'Test person'});
    assert.equal((html.match(/hs3-opt__price">Draft/g)||[]).length,2);assert.match(html,/hs3-opt__price">\$137/);assert.match(html,/Personalize blanket · \$137/);assert.doesNotMatch(html,/Continue with selected gifts/);assert.doesNotMatch(html,/Free US shipping/);
    ctx.S.sel={blanket:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/Personalize blanket · \$137/);assert.doesNotMatch(html,/Personalize blanket · \$89/);
    ctx.S.sel={mug:true};html=ctx.chooseView({dog:'Test dog',rec:'Test person'});assert.match(html,/>Review draft</);
  });
}
test('blanket purchase setting is default off and reads product picker price and URL',()=>{
  const liquid=readFileSync(new URL('../../shopify/sections/hs3-chat.liquid',import.meta.url),'utf8');
  const schema=JSON.parse(liquid.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  assert.equal(schema.settings.find(setting=>setting.id==='blanket_purchase').default,false);
  assert.match(liquid,/"blanketPurchase": {{ s.blanket_purchase \| json }}/);
  assert.match(liquid,/p\.price \| divided_by: 100\.0/);assert.match(liquid,/p\.url \| append: '\?view='/);
});

test('core Buddy entry points use verified revamp handles and cannot route to an unbound mug',()=>{
  for(const name of ['index.json','index.gifts.json','index.landing.json','index.artwork-preview.json']) {
    const config=JSON.parse(readFileSync(new URL('../../shopify/templates/'+name,import.meta.url),'utf8')).sections.gift.settings;
    assert.equal(config.product_blanket,'heartside-personality-blanket-draft-2026-10-23');
    assert.equal(config.product_print,'heartside-city-screenprint-draft-2026-10-23');
    assert.equal(config.product_mug,'');assert.equal(config.artwork_candidates,true);
    assert.equal(config.blanket_purchase,false);assert.equal(config.ornament_bundle,false);
  }
});
