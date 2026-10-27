import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
const profile=readFileSync(new URL('../../shopify/assets/hs-artwork-profile.js',import.meta.url),'utf8');
function section(name){const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1);return source.slice(start,source.indexOf('\n  function ',start+1));}
function fixture(minified){
  const ctx={window:{},cfg:{artworkCandidates:true},S:{step:7,home:'skip',spot:'skip',together:'skip',meaning:'skip',gift:'blanket',noteTone:'warm'},ui:{prefix:'',editing:false,revealN:4},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait',ornament:'Ornament'},SHORT:{mug:'Mug',blanket:'Blanket',print:'Portrait',ornament:'Ornament'},ICON:{},esc:String,img:alt=>'<img alt="'+alt+'">',signUnder:()=>'<span>legacy signature</span>',lineFor:()=> 'legacy note',toneStatus:()=> 'note status',composeKey:()=> 'key',reasonFor:()=> 'legacy gift reason',mugFaces:()=>'<div>mug</div>',mugSwatches:()=>'',BUDDY:'Buddy'};
  vm.runInNewContext(profile,ctx);
  const code=['reviewGifts','recGift','giftKeys','hasArtworkFacts','chatModel','revealView','mockup','pills'].map(section).join('\n');
  vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);return ctx;
}
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  test(mode+': skipped facts remain empty and review does not claim knowledge',()=>{
    const c=fixture(minified),names={dog:'Test dog',rec:'Test person'};
    assert.equal(c.window.HSArtworkProfile.fromChat(c.S).facts.length,0);
    const empty=c.chatModel(names);assert.match(empty.question,/Without any habits/);assert.doesNotMatch(empty.prefix+empty.question,/plenty|sniffed it out|I know/);
    c.S.spot='feet';assert.equal(c.hasArtworkFacts(),true);assert.doesNotMatch(c.chatModel(names).question,/Without any habits/);
  });
  test(mode+': candidate blanket has reference photo and artwork tone without printed words or note actions',()=>{
    const c=fixture(minified);const html=c.revealView({dog:'Test dog',rec:'Test person'});
    assert.match(html,/Photo reference only/);assert.match(html,/word-free/);assert.match(html,/aria-label="Artwork tone"/);
    assert.doesNotMatch(html,/legacy note|legacy signature|hs3-blanket__name|data-hs3="edit"|data-hs3="updateTone"/);
    c.cfg.artworkCandidates=false;const legacy=c.revealView({dog:'Test dog',rec:'Test person'});
    assert.match(legacy,/legacy note/);assert.match(legacy,/legacy signature/);assert.match(legacy,/data-hs3="edit"/);
  });
  test(mode+': conditional ornament is absent from candidate recommendations, restored reveal and pills',()=>{
    const c=fixture(minified);c.S.gift='ornament';c.S.composed={gift:'ornament'};
    assert.equal(c.recGift(),'print');
    assert.doesNotMatch(c.revealView({dog:'Test dog',rec:'Test person'}),/data-v="ornament"|hs3-orn/);
    assert.doesNotMatch(c.pills(),/Ornament/);
    c.cfg.artworkCandidates=false;assert.equal(c.recGift(),'ornament');assert.match(c.pills(),/Ornament/);
  });
}
