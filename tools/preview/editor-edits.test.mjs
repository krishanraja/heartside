// .github/scripts/editor-edits.mjs in a scratch repository: the first push of a template this repo
// takes over from Helio (templates/404.json) is not stopped by Helio's own copy, while a real
// theme-editor edit, to that template or any other, still stops the push.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../../.github/scripts/editor-edits.mjs',import.meta.url));
const shopifyComment='/*\n * IMPORTANT: The contents of this file are auto-generated.\n */\n';
const ours404={sections:{main:{type:'hs-404',settings:{}}},order:['main']};
const helio404={sections:{main:{type:'main-404',settings:{}}},order:['main']};
const oursIndex={sections:{gift:{type:'hs3-chat',settings:{core_purchase:true}}},order:['gift']};
const helioIndex={sections:{hero:{type:'hero',settings:{}}},order:['hero']};

function guard(store) {
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'hs-editor-edits-'));
  const git=(...args)=>execFileSync('git',['-c','user.name=test','-c','user.email=test@example.invalid','-c','commit.gpgsign=false',...args],{cwd:repo,stdio:'pipe'});
  fs.mkdirSync(path.join(repo,'shopify','templates'),{recursive:true});
  fs.writeFileSync(path.join(repo,'shopify','templates','404.json'),JSON.stringify(ours404,null,2)+'\n');
  fs.writeFileSync(path.join(repo,'shopify','templates','index.json'),JSON.stringify(oursIndex,null,2)+'\n');
  git('init','-q');git('add','.');git('commit','-qm','templates');
  fs.mkdirSync(path.join(repo,'backup','templates'),{recursive:true});
  for(const [name,tpl] of Object.entries(store)) fs.writeFileSync(path.join(repo,'backup','templates',name),shopifyComment+JSON.stringify(tpl,null,2));
  const r=spawnSync(process.execPath,[script,'backup'],{cwd:repo,encoding:'utf8'});
  const list=path.join(repo,'editor-edits.txt');
  const edited=fs.existsSync(list)?fs.readFileSync(list,'utf8').split('\n').filter(Boolean):[];
  fs.rmSync(repo,{recursive:true,force:true});
  assert.equal(r.status,0,r.stderr);
  return {out:r.stdout,edited};
}

test('Helio\'s own 404 does not stop the first push of ours',()=>{
  const {out,edited}=guard({'404.json':helio404,'index.json':oursIndex});
  assert.match(out,/templates\/404\.json: Helio's own copy, taken over by this repo/);
  assert.deepEqual(edited,[]);
});

test('an editor edit to our 404, once it is in the theme, still stops the push',()=>{
  const {edited}=guard({'404.json':{...ours404,sections:{main:{type:'hs-404',settings:{heading:'Edited in the editor'}}}},'index.json':oursIndex});
  assert.deepEqual(edited,['404.json']);
});

test('the takeover list is only the 404: another template unlike any commit still stops the push',()=>{
  const {edited}=guard({'404.json':ours404,'index.json':helioIndex});
  assert.deepEqual(edited,['index.json']);
});
