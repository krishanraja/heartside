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
  const c={nativeArtworkPurchase:()=>native,document:{querySelectorAll:()=>inputs}};const code=['hsProps','withHsProps'].map(section).join('\n');vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,c);return c;
 };
 test(mode+': native cart gets raw owned metadata and apostrophe label without changing artwork identity or literal prose',()=>{
  const c=setup();const props={'Dog&#39;s name':'Mowgli',_hs_art_profile:'{&quot;version&quot;:1,&quot;facts&quot;:[]}',_hs_lines:'Old note',_customization_id:'existing-id',_customization_image:'https://cdn.example/image?a=1&amp;b=2',_tib_design_link_1:'https://cdn.example/design.png','Your note':'I literally said &quot;hello&quot;'};
  const item=JSON.parse(c.withHsProps(JSON.stringify({id:58320627859838,quantity:1,properties:props})));
  assert.equal(item.properties["Dog's name"],'Mowgli');assert.equal('Dog&#39;s name' in item.properties,false);assert.deepEqual(JSON.parse(item.properties._hs_art_profile),{version:1,facts:[]});assert.equal(item.properties._hs_lines,'');
  for(const k of ['_customization_id','_customization_image','_tib_design_link_1','Your note'])assert.equal(item.properties[k],props[k]);
  assert.equal(item.id,58320627859838);assert.equal(item.quantity,1);
 });
 test(mode+': legacy routes preserve existing values and native label collisions do not overwrite either value',()=>{
  const body=JSON.stringify({items:[{id:1,properties:{'Dog&#39;s name':'Encoded',"Dog's name":'Canonical',_hs_art_profile:'existing'}}]});
  const old=JSON.parse(setup(false).withHsProps(body));assert.equal(old.items[0].properties._hs_art_profile,'existing');assert.equal(old.items[0].properties['Dog&#39;s name'],'Encoded');
  const current=JSON.parse(setup().withHsProps(body));assert.equal(current.items[0].properties["Dog's name"],'Canonical');assert.equal(current.items[0].properties['Dog&#39;s name'],'Encoded');
 });
 test(mode+': malformed payload remains untouched',()=>{assert.equal(setup().withHsProps('invalid'),'invalid');});
}
