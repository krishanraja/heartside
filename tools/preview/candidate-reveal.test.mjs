import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../../shopify/assets/hs3.js',import.meta.url),'utf8');
const profile=readFileSync(new URL('../../shopify/assets/hs-artwork-profile.js',import.meta.url),'utf8');
function section(name){const start=source.indexOf('  function '+name+'(');assert.notEqual(start,-1,name);return source.slice(start,source.indexOf('\n  function ',start+1));}
function fixture(minified){
  const ctx={window:{},cfg:{artworkCandidates:true},S:{step:7,home:'skip',spot:'skip',together:'skip',meaning:'skip',gift:'blanket',noteTone:'warm',edits:{}},ui:{prefix:'',editing:false,revealN:4},GIFTS:['mug','blanket','print','ornament'],GN:{mug:'Mug',blanket:'Blanket',print:'Portrait',ornament:'Ornament'},SHORT:{mug:'Mug',blanket:'Blanket',print:'Portrait',ornament:'Ornament'},ICON:{},esc:String,img:alt=>'<img alt="'+alt+'">',signUnder:()=>'<span>legacy signature</span>',lineFor:()=> 'legacy note',toneStatus:()=> 'note status',composeKey:()=> 'key',reasonFor:()=> 'legacy gift reason',mugFaces:()=>'<div>mug</div>',mugSwatches:()=>'<div class="hs3-swatches">swatches</div>',mugColor:()=>null,photoSrc:()=>'',PAW:'',sign:()=>'<span>signature</span>',BUDDY:'Buddy'};
  vm.runInNewContext(profile,ctx);
  const code=['reviewGifts','recGift','giftKeys','hasArtworkFacts','chatModel','revealView','toneView','productStage','giftPhoto','paintFacts','mockup','pills','priceOf','priceLabel','fmt','possessiveName','upFirst','syncTone','writing'].filter(name=>source.includes('  function '+name+'(')).map(section).join('\n');
  vm.runInNewContext(minified?transformSync(code,{minify:true}).code:code,ctx);return ctx;
}
const who={dog:'Test dog',rec:'Test person',them:'Test person',she:'they',is:'are'};
for(const minified of [false,true]) {
  const mode=minified?'minified':'source';
  test(mode+': skipped facts remain empty and review does not claim knowledge',()=>{
    const c=fixture(minified);
    assert.equal(c.window.HSArtworkProfile.fromChat(c.S).facts.length,0);
    const empty=c.chatModel(who);assert.match(empty.question,/Without any habits/);assert.doesNotMatch(empty.prefix+empty.question,/plenty|sniffed it out|I know/);
    c.S.spot='feet';assert.equal(c.hasArtworkFacts(),true);assert.doesNotMatch(c.chatModel(who).question,/Without any habits/);
  });
  test(mode+': candidate blanket has reference photo and artwork tone without printed words or note actions',()=>{
    const c=fixture(minified);const html=c.revealView(who);
    assert.match(html,/Photo reference only/);assert.match(html,/word-free/);assert.match(html,/aria-label="Artwork tone"/);
    assert.doesNotMatch(html,/legacy note|legacy signature|hs3-blanket__name|data-hs3="edit"|data-hs3="updateTone"/);
    c.cfg.artworkCandidates=false;const legacy=c.revealView(who);
    assert.match(legacy,/legacy note/);assert.match(legacy,/legacy signature/);assert.match(legacy,/data-hs3="edit"/);
  });
  test(mode+': conditional ornament is absent from candidate recommendations, restored reveal and pills',()=>{
    const c=fixture(minified);c.S.gift='ornament';c.S.composed={gift:'ornament'};
    assert.equal(c.recGift(),'print');
    assert.doesNotMatch(c.revealView(who),/data-v="ornament"|hs3-orn/);
    assert.doesNotMatch(c.pills(),/Ornament/);
    c.cfg.artworkCandidates=false;assert.equal(c.recGift(),'ornament');assert.match(c.pills(),/Ornament/);
  });
  // 28 Oct (F05, Krish): no mug color before the gift decision. Color is asked on the choose screen.
  test(mode+': the reveal asks no mug color before the gift is chosen',()=>{
    const c=fixture(minified);c.S.gift='mug';
    const html=c.revealView(who);
    assert.match(html,/hs3-product--mug/);
    assert.doesNotMatch(html,/hs3-swatches|swatches/);
  });
  test(mode+': the blanket says once on the reveal that it has no words',()=>{
    const c=fixture(minified);const html=c.revealView(who);
    const said=html.match(/word-free|no words|no note|No words are printed/gi)||[];
    assert.equal(said.length,1,said.join(' | '));
  });
  test(mode+': while Buddy writes the first note the note says so, then shows the final line and says when it changed',()=>{
    const c=fixture(minified);c.S.gift='mug';c.S.composeRequest={auto:true,status:'pending'};
    let html=c.revealView(who);
    assert.match(html,/Buddy is writing your note…/);assert.doesNotMatch(html,/legacy note/,'no draft line the AI is about to replace');
    c.S.edits={meaning:'My own words.'};c.lineFor=()=> 'My own words.';html=c.revealView(who);
    assert.match(html,/My own words\./,'a line the buyer changed always shows');
    c.S.edits={};c.lineFor=()=> 'legacy note';c.S.composeRequest=null;c.S.notePolished=true;html=c.revealView(who);
    assert.match(html,/legacy note/);assert.match(html,/Buddy polished this\./);
    c.S.edits={meaning:'legacy note'};assert.doesNotMatch(c.revealView(who),/polished/,'never under words the buyer changed');
    c.S.edits={};c.S.notePolished=false;assert.doesNotMatch(c.revealView(who),/polished/);
  });
  test(mode+': the heading takes the house possessive and speaks to the buyer when the gift is theirs',()=>{
    const c=fixture(minified);c.S.gift='mug';
    assert.match(c.revealView({...who,dog:'Buttons',rec:'Riley',them:'Riley'}),/<h2 class="hs3-h2"><span class="hs3-nm">Buttons'<\/span> gift for <span class="hs3-nm">Riley<\/span><\/h2>/);
    assert.match(c.revealView({...who,dog:'Mochi',rec:'Sam',them:'you',self:true}),/<h2 class="hs3-h2"><span class="hs3-nm">Mochi's<\/span> gift for <span class="hs3-nm">you<\/span><\/h2>/);
    assert.match(c.revealView({...who,dog:"Sir Biscuit O'"}),/Sir Biscuit O's gift/,'a stray apostrophe never doubles');
  });
  test(mode+': the reveal slider shows the shared tone the product pages read',()=>{
    const c=fixture(minified);c.S.gift='mug';c.S.noteTone='warm';c.window.HSArtworkChoices={read:()=>({tone:'sentimental',style:'screenprint'})};
    const html=c.revealView(who);
    assert.match(html,/value="0" aria-label="Note tone" aria-valuetext="Sentimental"/);assert.equal(c.S.noteTone,'sentimental');
  });
}
