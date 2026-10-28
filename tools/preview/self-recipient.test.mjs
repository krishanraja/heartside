import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source = readFileSync(new URL('../../shopify/assets/hs3.js', import.meta.url), 'utf8');
const instrumented = source.replace('// for tools/preview tests', `window.__recipientTest = {
  choose: function(value) { act('rel', value); },
  html: function() { return chatView(names()); },
  chooseHTML: function() { return chooseView(names()); },
  composeBody: composeBody,
  sendTyped: sendTyped,
  configure: function(value) { cfg = value; }
}; // for tools/preview tests`);
// reply(body) is what the typed-answer webhook returns for one request; null is "no answer"
function fixture(code, store = {}, reply = () => null, extra = {}) {
  const calls = [];
  const window = {
    matchMedia: () => ({matches:false}), crypto:{getRandomValues:a=>a},
    sessionStorage:{getItem:key=>store[key] ?? null,setItem:(key,value)=>{store[key]=value;}},
    fetch:async(url,options)=>{const body=JSON.parse(options.body);calls.push(body);return {ok:true,json:async()=>reply(body)};},
    ...extra
  };
  const document={readyState:'complete',querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){}};
  vm.runInNewContext(code,{window,document,URLSearchParams,setTimeout:()=>1,clearTimeout(){},console});
  const api=window.__recipientTest,state=window.__hs3api.state();
  api.configure({ai:true,typedUrl:'/fixture-typed',artworkCandidates:true,corePurchase:true,gifts:{mug:{url:'/products/m',price:45},blanket:{url:'/products/b',price:129},print:{url:'/products/p',price:59}}});
  Object.assign(state,{screen:'chat',step:2,dog:'Test dog',rec:'Alex'});
  return {api,state,store,calls,typed:window.__hs3api.typedAnswer,hs3:window.__hs3api};
}
const bridge = f => JSON.parse(f.store['hs2-review'] || '{}');
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

  // Ruling (Krish, 28 Oct): recase chat names in all caps or all lowercase; direct-visit typing is left alone
  test(mode+': chat names print recased only when typed all caps or all lowercase',()=>{
    const f=fixture(code);
    const cases=[['PICKLE','Pickle'],['pickle','Pickle'],['jo-anne','Jo-Anne'],['JO-ANNE','Jo-Anne'],["sir biscuit o'malley","Sir Biscuit O'Malley"],['mcdonald','McDonald'],["d'artagnan","D'Artagnan"],['de la cruz','De La Cruz'],['ZOË','Zoë'],
      ['JJ','JJ'],['BB-8','BB-8'],['McFluffy','McFluffy'],['DeeDee','DeeDee'],['  ruby   rose ','Ruby Rose'],["Pip'",'Pip'],['-Pip-','Pip'],['ma\'am','Ma\'am']];
    for(const [typed,shown] of cases){ f.state.dog=typed; assert.equal(f.hs3.names().dog,shown,typed); }
    f.state.rec='jo-anne'; assert.equal(f.hs3.names().rec,'Jo-Anne');
    f.state.dog='PICKLE'; f.state.rec='SAM';
    f.state.step=1; f.hs3.route.act('next');
    assert.equal(f.state.step,2); assert.equal(f.state.dog,'Pickle','Next writes back what will print, so Back shows it');
    f.hs3.route.act('next');
    assert.equal(f.state.rec,'Sam'); assert.equal(bridge(f).dog,'Pickle'); assert.equal(bridge(f).person,'Sam');
  });
  test(mode+': a dog name longer than the signature holds waits at Next with one-tap short forms',()=>{
    const f=fixture(code);
    Object.assign(f.state,{step:1,dog:"Sir Biscuit O'Malley"});
    assert.match(f.api.html(),/id="hs3-dog"[^>]*maxlength="40"/,'typing is never cut at 14');
    f.hs3.route.act('next');
    assert.equal(f.state.step,1,'Next waits');
    const html=f.api.html();
    assert.match(html,/"Sir Biscuit O&#39;Malley" is 20 letters\. 14 fit in "Love, …" on the gift\./);
    assert.match(html,/data-hs3="short" data-v="Sir Biscuit">Sir Biscuit</); assert.match(html,/data-hs3="short" data-v="Biscuit">Biscuit</);
    f.hs3.route.act('rel','partner'); // a save, as every keystroke makes on the page
    assert.equal(bridge(f).dog,'','an over-limit name never reaches the product page');
    f.hs3.route.act('short','Sir Biscuit');
    assert.equal(f.state.dog,'Sir Biscuit');
    assert.match(f.api.html(),/3 letters left\. Up to 14 fit in the signature\./);
    f.hs3.route.act('next');
    assert.equal(f.state.step,2); assert.equal(bridge(f).dog,'Sir Biscuit');
    Object.assign(f.state,{step:1,dog:'Bartholomew'}); assert.match(f.api.html(),/3 letters left\./);
    Object.assign(f.state,{step:1,dog:'Pip'}); assert.doesNotMatch(f.api.html(),/letters? left/);
    Object.assign(f.state,{step:2,rec:'Maximilianaa'}); assert.match(f.api.html(),/id="hs3-rec"[^>]*maxlength="14"/); assert.match(f.api.html(),/2 letters left\.</);
  });
  test(mode+': every dog-name possessive takes the house style and never doubles an apostrophe',()=>{
    const f=fixture(code);
    Object.assign(f.state,{step:4,dog:'Buttons',rec:'Chris'});
    const html=f.api.html();
    assert.match(html,/Where&#39;s Buttons&#39; spot when Chris is around\?/);
    assert.match(html,/On Chris&#39; feet/);assert.match(html,/Chris&#39; side of the bed/);
    assert.doesNotMatch(html,/Buttons&#39;s|Chris&#39;s/);
    Object.assign(f.state,{dog:"Sir Biscuit O'"}); assert.doesNotMatch(f.api.html(),/&#39;&#39;/);
  });
  test(mode+': when the gift is for the buyer, Buddy says you and the choose screen does not ask where to ship',()=>{
    const f=fixture(code); f.api.choose('self');
    Object.assign(f.state,{step:3,dog:'Mochi',rec:'Sam'});
    let html=f.api.html();
    assert.match(html,/Lucky you\./);assert.match(html,/What does Mochi do when you come home\?/);assert.match(html,/Brings you a toy/);
    assert.doesNotMatch(html,/Lucky Sam|Sam comes home/);
    Object.assign(f.state,{step:4}); html=f.api.html();
    assert.match(html,/when you&#39;re around\?/);assert.match(html,/On your feet/);assert.match(html,/Your side of the bed/);assert.match(html,/Wherever you are/);
    Object.assign(f.state,{step:5}); assert.match(f.api.html(),/What do you and Mochi do together, just the two of you\?/);
    Object.assign(f.state,{step:6}); html=f.api.html(); assert.match(html,/What is Mochi to you\?/);assert.match(html,/Your shadow/);
    Object.assign(f.state,{screen:'choose',sel:{mug:true}}); html=f.api.chooseHTML();
    assert.match(html,/<span class="hs3-nm">Mochi&#39;s<\/span> gift for <span class="hs3-nm">you<\/span>/);assert.doesNotMatch(html,/Ship to/);
    assert.equal(bridge(f).hs_ship_to,'Me (the buyer)');
    f.api.choose('partner'); html=f.api.chooseHTML();
    assert.match(html,/<span class="hs3-nm">Mochi&#39;s<\/span> gift for <span class="hs3-nm">Sam<\/span>/);assert.match(html,/Ship to/);
  });
  test(mode+': no pronoun is chosen for the buyer; the copy says they until one is tapped',()=>{
    const f=fixture(code); f.state.step=1;
    assert.equal(f.state.pro,'','a new chat starts with no pronoun');
    const html=f.api.html();
    assert.match(html,/data-v="she" aria-pressed="false"/);assert.match(html,/data-v="he" aria-pressed="false"/);
    assert.equal(f.hs3.names().she,'they');
    Object.assign(f.state,{step:3,more:true,home:'spin'}); assert.match(f.api.html(),/Until they are dizzy/);
    f.hs3.route.act('pro','she'); assert.equal(f.state.pro,'she'); Object.assign(f.state,{step:3,more:true,home:'spin'}); assert.match(f.api.html(),/Until she is dizzy/);
  });

  // 28 Oct: a run of exclamation marks inside typed words never prints
  test(mode+': a typed line never prints doubled marks',async()=>{
    const f=fixture(code);
    const r=await f.typed('meaning','q','my best friend!! forever','');
    assert.doesNotMatch(r.line,/!|\.\./); assert.equal(r.line,'Your best friend. Forever.');
    assert.doesNotMatch(f.hs3.chipStyle('he is my rock!! always','meaning'),/!/);
  });
  // Buddy invents (item 12): a reaction or line naming something the buyer never said is dropped
  test(mode+': Buddy never names a food, toy, object or place the buyer did not',async()=>{
    const ai=body=>({reaction:'Coffee in bed, and hopefully a croissant for Pip.',line:'I bring you a croissant in bed.',flags:[]});
    const f=fixture(code,{},ai);
    let r=await f.typed('together','q','coffee in bed on sundays','');
    assert.equal(r.reaction,'','no prefix rather than an invention');
    assert.doesNotMatch(r.line,/croissant/i); assert.equal(r.line,'Coffee in bed on sundays.');
    const kept=fixture(code,{},()=>({reaction:'A green hedgehog, what a gift.',line:'I bring you my green hedgehog every time.',flags:[]}));
    r=await kept.typed('home','q','brings me her green squeaky hedgehog','');
    assert.equal(r.reaction,'A green hedgehog, what a gift.'); assert.equal(r.line,'I bring you my green hedgehog every time.');
    const cup=fixture(code,{},()=>({reaction:'A cup of coffee together, lovely.',line:'Every cup is better with you.',flags:[]}));
    r=await cup.typed('together','q','morning coffee','');
    assert.equal(r.reaction,'A cup of coffee together, lovely.','coffee comes in a cup');
    // a chip answer is drawn first, as on the page, so the tap has its question
    const g=fixture(code); Object.assign(g.state,{step:5,dog:'Ruby',rec:'Sam'});
    g.api.html(); g.hs3.route.act('chip','coffee');
    assert.doesNotMatch(g.api.html(),/toast/i); assert.doesNotMatch(g.hs3.lineFor('together'),/toast/i);
    Object.assign(g.state,{step:4}); g.api.html(); g.hs3.route.act('chip','anywhere'); assert.doesNotMatch(g.hs3.lineFor('spot'),/bathroom/);
    Object.assign(g.state,{step:5}); g.api.html(); g.hs3.route.act('chip','car'); assert.doesNotMatch(g.api.html(),/window/);
  });
  test(mode+': an AI follow-up never offers its own "Not sure"; each chip keeps its own line and reply',async()=>{
    const fu={question:'Is it always the same ear?',chips:['Always the left','Not sure','Depends on the day'],lines:['I lift my left ear for you.','I am not sure.','I pick an ear for you each day.'],replies:['The left ear, a classic.','No worries.','A dog of many moods.']};
    const f=fixture(code,{},()=>({reaction:'One ear up, I love it.',line:'I wait for you with one ear up.',follow_up:fu,flags:[]}));
    const r=await f.typed('home','q','waits with one ear up','');
    assert.deepEqual([...r.follow_up.chips],['Always the left','Depends on the day']);
    assert.deepEqual([...r.follow_up.lines],['I lift my left ear for you.','I pick an ear for you each day.']);
    assert.deepEqual([...r.follow_up.replies],['The left ear, a classic.','A dog of many moods.']);
    for(const c of ['not sure','Unsure.','No idea','I don’t know','idk','dunno','Skip','none','Nothing','n/a','Other','Something else']) {
      const g=fixture(code,{},()=>({line:'I wait.',follow_up:{question:'And?',chips:[c,'Every day']},flags:[]}));
      assert.deepEqual([...(await g.typed('home','q','waits','')).follow_up.chips],['Every day'],c);
    }
  });
  test(mode+': a new home answer clears its old follow-up, and "Not sure" adds no bubble',async()=>{
    const f=fixture(code,{},()=>({reaction:'',line:'I wait by the window for you.',flags:[]}));
    Object.assign(f.state,{step:3,more:false,home:'typed',follow:'typed',typed:{home:'old answer',home_follow:'Not sure'}});
    await f.api.sendTyped('waits by the window');
    await new Promise(r=>setImmediate(r));
    assert.equal(f.state.typed.home,'waits by the window','the raw words stay for Buddy');
    assert.equal(f.state.typed.home_follow,undefined);
    const g=fixture(code); Object.assign(g.state,{step:4});
    g.hs3.route.act('skip'); Object.assign(g.state,{step:5});
    assert.doesNotMatch(g.api.html(),/hs3-echo">Not sure</);
  });
  test(mode+': a breed picked from the list is that row for the voice and the energy; unmatched words get neither',()=>{
    const rows={'golden-retriever':{id:'golden-retriever',name:'Golden Retriever',kind:'breed',exact:true,tone:'Retriever'}};
    const HSBreeds={byId:id=>rows[id]||null,lookup:t=>String(t).toLowerCase()==='golden retriever'?rows['golden-retriever']:{id:'mixed-breed',name:'Mixed Breed',kind:'mixed',exact:false,tone:'Parent Envelope'},suggest:()=>[]};
    const HSArtworkEngine={energyFor:r=>r&&r.exact===true&&r.kind!=='mixed'?'eager-open':null};
    const f=fixture(code,{},()=>null,{HSBreeds,HSArtworkEngine});
    Object.assign(f.state,{breed:'Goldie',breedId:'golden-retriever'}); f.hs3.route.act('rel','partner');
    assert.equal(bridge(f).hs3_energy,'eager-open'); assert.equal(f.api.composeBody('warm').dog.breed,'Golden Retriever');
    Object.assign(f.state,{breed:'Golden Retreiver',breedId:''}); f.hs3.route.act('rel','partner');
    assert.equal(bridge(f).hs3_energy,''); assert.equal(f.api.composeBody('warm').dog.breed,undefined);
    Object.assign(f.state,{breed:'Mixed or not sure',breedId:'mixed-breed'}); f.hs3.route.act('rel','partner');
    assert.equal(bridge(f).hs3_energy,''); assert.equal(f.api.composeBody('warm').dog.breed,undefined);
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
