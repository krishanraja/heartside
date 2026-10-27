// .github/scripts/footer-heartside.mjs on a footer group shaped like the live one: Helio's footer
// and utilities rows, the signup footer-signup.mjs already switched off, the HS company note and
// an app section, written in Shopify's own style (leading comment, "\/" and \u003c escapes).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../../.github/scripts/footer-heartside.mjs',import.meta.url));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hs-footer-'));
const comment=`/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */`;
const group={
  type:'footer',name:'t:general.footer',
  sections:{
    footer:{type:'footer',blocks:{text_Yz:{type:'text',settings:{text:'<p>Made by hand & checked</p>',link:'shopify://pages/contact'}}},block_order:['text_Yz'],settings:{color_scheme:'scheme-1'}},
    section_Ldcdxw:{type:'email-signup',disabled:true,settings:{heading:'Keep an eye on us'}},
    footer_utilities_jLGE8U:{type:'footer-utilities',settings:{copyright:true}},
    hs_company_note:{type:'hs-company-note',settings:{background:'#0f0f0f'}},
    apps_Qw3:{type:'apps',settings:{}}
  },
  order:['footer','section_Ldcdxw','footer_utilities_jLGE8U','hs_company_note','apps_Qw3']
};
const shopifyStyle=json=>json.replace(/\//g,'\\/').replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const original=comment+'\n'+shopifyStyle(JSON.stringify(group,null,2))+'\n';
const plain=JSON.stringify(group,null,2)+'\n';

let n=0;
const file=(text=original)=>{const f=path.join(dir,`footer-group-${n++}.json`);fs.writeFileSync(f,text);return f;};
const run=(f,...args)=>spawnSync(process.execPath,[script,f,...args],{encoding:'utf8'});
const bytes=f=>fs.readFileSync(f,'utf8');
const parse=f=>JSON.parse(bytes(f).replace(/^\s*\/\*[\s\S]*?\*\//,''));

test('adds the HS footer last and switches off Helio\'s footer and the company note, deleting nothing',()=>{
  const f=file();
  const r=run(f);assert.equal(r.status,0,r.stdout+r.stderr);
  const g=parse(f);
  assert.equal(g.sections.hs_footer.type,'hs-footer');
  assert.equal(g.order.at(-1),'hs_footer');
  assert.deepEqual(g.order.slice(0,-1),group.order);
  for(const id of Object.keys(group.sections)) assert.ok(g.sections[id],`${id} is still in the group`);
  for(const id of ['footer','footer_utilities_jLGE8U','hs_company_note','section_Ldcdxw']) assert.equal(g.sections[id].disabled,true,id);
  assert.equal(g.sections.apps_Qw3.disabled,undefined);
  assert.equal(g.sections.hs_footer.settings.switched_off,'footer,footer_utilities_jLGE8U,hs_company_note');
  assert.deepEqual(g.sections.footer.blocks,group.sections.footer.blocks);
  // Shopify's comment and escapes survive
  assert.ok(bytes(f).startsWith(comment+'\n{'));
  assert.match(bytes(f),/"shopify:\\\/\\\/pages\\\/contact"/);
  assert.match(bytes(f),/\\u003cp\\u003eMade by hand \\u0026 checked/);
});

test('running it twice gives identical bytes',()=>{
  const f=file();run(f);const once=bytes(f);
  const r=run(f);assert.equal(r.status,0);assert.match(r.stdout,/Nothing to change/);
  assert.equal(bytes(f),once);
});

test('--restore gives back the original bytes, the signup it never touched staying off',()=>{
  for(const start of [original,plain]) {
    const f=file(start);run(f);run(f);
    const r=run(f,'--restore');assert.equal(r.status,0,r.stdout+r.stderr);
    assert.equal(bytes(f),start);
  }
  const f=file();const r=run(f,'--restore');
  assert.equal(r.status,0);assert.match(r.stdout,/Nothing to restore/);assert.equal(bytes(f),original);
});

test('a Helio section switched back on in the editor goes off again, and restore still round-trips',()=>{
  const f=file();run(f);
  const g=parse(f);delete g.sections.footer.disabled;
  fs.writeFileSync(f,comment+'\n'+shopifyStyle(JSON.stringify(g,null,2))+'\n');
  run(f);
  const again=parse(f);
  assert.equal(again.sections.footer.disabled,true);
  assert.equal(again.sections.hs_footer.settings.switched_off,'footer,footer_utilities_jLGE8U,hs_company_note');
  run(f,'--restore');assert.equal(bytes(f),original);
});

test('refuses anything that is not a footer section group and leaves it untouched',()=>{
  const shapes=['[]','not json',JSON.stringify({sections:{},order:[]}),JSON.stringify({...group,type:'header'}),JSON.stringify({...group,sections:[]}),JSON.stringify({...group,order:undefined}),JSON.stringify({...group,sections:{x:{settings:{}}}})];
  for(const text of shapes) for(const args of [[],['--restore']]) {
    const f=file(text);const r=run(f,...args);
    assert.notEqual(r.status,0,text);assert.match(r.stdout,/Nothing was changed/);
    assert.equal(bytes(f),text);
  }
});

test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
