import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=process.env.HS_CART_ENCODING_BASELINE?execFileSync('git',['show',process.env.HS_CART_ENCODING_BASELINE+':shopify/assets/hs2.js'],{cwd:new URL('../../',import.meta.url),encoding:'utf8'}):readFileSync(new URL('../../shopify/assets/hs2.js',import.meta.url),'utf8');
const section=name=>{const start=source.indexOf('  function '+name+'(');return source.slice(start,source.indexOf('\n  function ',start+1));};
for(const minified of [false,true]){
 const mode=minified?'minified':'source';
 const setup=(native=true)=>{
  const inputs=[{name:'properties[_hs_art_profile]',value:'{"version":1,"facts":[]}'},{name:'properties[_hs_lines]',value:''}];
  const c={restoredArtworkChosen:()=>false,nativeArtworkPurchase:()=>native,document:{querySelectorAll:()=>inputs}};const code=['hsProps','withHsProps'].map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);return c;
 };
 test(mode+': native cart gets raw owned metadata and apostrophe label without changing artwork identity or literal prose',()=>{
  const c=setup();const props={'Dog&#39;s name':'Juniper',_hs_art_profile:'{&quot;version&quot;:1,&quot;facts&quot;:[]}',_hs_lines:'Old note',_customization_id:'existing-id',_customization_image:'https://cdn.example/image?a=1&amp;b=2',_tib_design_link_1:'https://cdn.example/design.png','Your note':'I literally said &quot;hello&quot;'};
  const item=JSON.parse(c.withHsProps(JSON.stringify({id:12345,quantity:1,properties:props})));
  assert.equal(item.properties["Dog's name"],'Juniper');assert.equal('Dog&#39;s name' in item.properties,false);assert.deepEqual(JSON.parse(item.properties._hs_art_profile),{version:1,facts:[]});assert.equal(item.properties._hs_lines,'');
  for(const k of ['_customization_id','_customization_image','_tib_design_link_1','Your note'])assert.equal(item.properties[k],props[k]);
  assert.equal(item.id,12345);assert.equal(item.quantity,1);
 });
 test(mode+': legacy routes preserve existing values and native label collisions do not overwrite either value',()=>{
  const body=JSON.stringify({items:[{id:1,properties:{'Dog&#39;s name':'Encoded',"Dog's name":'Canonical',_hs_art_profile:'existing'}}]});
  const old=JSON.parse(setup(false).withHsProps(body));assert.equal(old.items[0].properties._hs_art_profile,'existing');assert.equal(old.items[0].properties['Dog&#39;s name'],'Encoded');
  const current=JSON.parse(setup().withHsProps(body));assert.equal(current.items[0].properties["Dog's name"],'Canonical');assert.equal(current.items[0].properties['Dog&#39;s name'],'Encoded');
 });
 test(mode+': malformed payload remains untouched',()=>{assert.equal(setup().withHsProps('invalid'),'invalid');});
}
// 28 Oct, orders #1005 to #1008: what the buyer told Buddy and who it ships to never reached a native
// order. The inputs are read from the native branch of the product section, as the store renders it.
const liquid=readFileSync(new URL('../../shopify/sections/hs2-product.liquid',import.meta.url),'utf8');
const nativeBranch=liquid.slice(liquid.indexOf('{%- form '),liquid.indexOf('{%- elsif block.settings.v3 -%}'));
for(const minified of [false,true]) test((minified?'minified':'source')+': a native gift add carries the chat answers and the ship-to choice',()=>{
 const inputs=[...nativeBranch.matchAll(/<input type="hidden" name="(properties\[[^\]]+\])" data-hs2-prop="([^"]+)"/g)].map(m=>({name:m[1],value:'',getAttribute:()=>m[2]}));
 const said={hs_answers:'Home: spins | Spot: the couch',hs_ship_to:'Riley',personality:'{"version":1,"facts":[]}',art_style:'Fine ink drawing',art_tone:'Warm with a wink',hs_lines:'Your shadow'};
 const c={restoredArtworkChosen:()=>false,nativeArtworkPurchase:()=>true,answer:k=>said[k]||'',document:{querySelectorAll:()=>inputs}};
 const code=['syncBlanketProperties','hsProps','withHsProps'].map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);
 c.syncBlanketProperties();
 const sent=JSON.parse(c.withHsProps(JSON.stringify({id:1,quantity:1,properties:{_customization_id:'12345678-1234-1234-1234-123456789abc'}}))).properties;
 assert.equal(sent._hs_answers,said.hs_answers);assert.equal(sent._hs_ship_to,'Riley');
 assert.equal(sent._hs_art_style,'Fine ink drawing');assert.equal(sent._customization_id,'12345678-1234-1234-1234-123456789abc');
 assert.equal('Gift' in sent,false,'the visible Gift line waits for Track B');
});
