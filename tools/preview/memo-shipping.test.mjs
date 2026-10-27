import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Liquid} from 'liquidjs';

const root=new URL('../../',import.meta.url);
const source=process.env.HS_MEMO_TEST_BASELINE?execFileSync('git',['show',process.env.HS_MEMO_TEST_BASELINE+':shopify/sections/hs2-memo.liquid'],{cwd:root,encoding:'utf8'}):readFileSync(new URL('shopify/sections/hs2-memo.liquid',root),'utf8');
// Stub asset and text-rendering snippets; execute the section's actual Liquid conditions.
const body=source.replace("{%- render 'hs2-head' -%}",'').replace("{% render 'hs2-t', text: msg %}",'{{ msg }}').split('{% schema %}')[0];
const engine=new Liquid();
const render=(template,deadline='')=>engine.parseAndRender(body,{template,section:{settings:{text:'Order by [DATE] for Christmas delivery. Free US shipping.',text_undated:'Free US shipping on every order.',deadline}}});

test('native product headers use checkout shipping with or without a global deadline',async()=>{
  for(const suffix of ['blanket-native','mug-native','portrait-native']) {
  for(const deadline of ['', '2026-12-10']) {
    const html=await render({name:'product',suffix},deadline);
    assert.match(html,/class="hs2-memo__msg">Shipping calculated at checkout\.<\/span>/);
    assert.doesNotMatch(html,/Free US shipping|Order by/);
    assert.match(html,/data-hs2-countdown="memo"/);
  }
  }
});
test('other product templates and homepage retain their existing shipping messages',async()=>{
  for(const template of [{name:'product',suffix:'gift'},{name:'product',suffix:'blanket-art-preview'},{name:'product',suffix:''},{name:'index',suffix:'blanket-native'}]) {
    assert.match(await render(template),/Free US shipping on every order\./);
    assert.match(await render(template,'2026-12-10'),/Order by December 10 for Christmas delivery\. Free US shipping\./);
  }
});
