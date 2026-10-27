import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
const instrumented = source.replace('// for tools/preview tests', `window.__recipientTest = {
  choose: function(value) { act('rel', value); },
  html: function() { return chatView(names()); },
  composeBody: composeBody,
  configure: function(value) { cfg = value; }
}; // for tools/preview tests`);
function fixture(code, store = {}) {
  const calls = [];
  const window = {
    matchMedia: () => ({matches:false}), crypto:{getRandomValues:a=>a},
    sessionStorage:{getItem:key=>store[key] ?? null,setItem:(key,value)=>{store[key]=value;}},
    fetch:async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>null};}
  };
  const document={readyState:'complete',querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
  vm.runInNewContext(code,{window,document,URLSearchParams,setTimeout:()=>1,clearTimeout(){},console});
  const api=window.__recipientTest,state=window.__hs3api.state();
  api.configure({ai:true,typedUrl:'/fixture-typed',artworkCandidates:true});
  Object.assign(state,{screen:'chat',step:2,dog:'Test dog',rec:'Alex'});
  return {api,state,store,calls,typed:window.__hs3api.typedAnswer};
}
for (const [mode,code] of [['source',instrumented],['minified',transformSync(instrumented,{minify:true}).code]]) {
  test(mode+': self-recipient choice is visible, accurately labelled and persists across reload',()=>{
    const f=fixture(code);
    assert.match(f.api.html(),/data-v="self"[^>]*>Me<\/button>/);
    f.api.choose('self');
    assert.match(f.api.html(),/data-v="self" aria-pressed="true"/);
    assert.match(f.api.html(),/for="hs3-rec">Your first name<\/label>/);
    assert.equal(JSON.parse(f.store['hs3-gift']).rel,'self');
    const restored=fixture(code,f.store);
    assert.equal(restored.state.rel,'self');
    assert.equal(restored.state.rec,'Alex');
    restored.api.choose('partner');
    assert.match(restored.api.html(),/for="hs3-rec">Their first name<\/label>/);
    assert.equal(restored.state.rec,'Alex');
  });
  test(mode+': typed and compose inputs preserve self identity without changing the partner contract',async()=>{
    const f=fixture(code);
    for(const relation of ['self','partner']) {
      f.api.choose(relation);
      await f.typed('meaning','What does the dog mean to Alex?','my best friend','');
      assert.deepEqual(f.calls.at(-1).recipient,{name:'Alex',relation});
      assert.deepEqual(JSON.parse(JSON.stringify(f.api.composeBody('warm').recipient)),{name:'Alex',relation});
    }
  });
}
test('existing backend guards retain self and the typed prompt preserves the named-recipient voice rule',()=>{
  for(const kind of ['typed','compose']) {
    const guard=readFileSync(new URL('../../n8n/guard-'+kind+'.js',import.meta.url),'utf8');
    const body={session:'testself123',step:'meaning',typed_text:'my best friend',dog:{name:'Test dog'},recipient:{name:'Alex',relation:'self'}};
    const out=new Function('$input','$getWorkflowStaticData',guard)({first:()=>({json:{headers:{origin:'https://heartside.io'},body}})},()=>({}))[0].json;
    assert.equal(out.reject,'');
    assert.equal(out.input.recipient.relation,'self');
  }
  const builder=readFileSync(new URL('../../n8n/build.mjs',import.meta.url),'utf8');
  const prompt=builder.slice(builder.indexOf('const TYPED_SYS'),builder.indexOf('const COMPOSE_SYS'));
  assert.match(prompt,/When recipient\.relation is self, the buyer and recipient are the same person/);
  assert.match(prompt,/otherwise the recipient is someone else/);
  assert.match(prompt,/Only the gift lines speak to the person as you/);
  assert.match(prompt,/call the person by their name/);
});
