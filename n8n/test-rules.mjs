// The Guard and Enforce rules on fixed cases. Every case asserts, so a broken rule fails CI.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
function run(file, guardOut, raw){
  const code = fs.readFileSync(file,'utf8');
  const f = new Function('$','$input', code);
  return f(()=>({first:()=>({json:guardOut})}), {first:()=>({json:raw})})[0].json;
}
function guard(file, req){ const sd={}; const f=new Function('$input','$getWorkflowStaticData', fs.readFileSync(file,'utf8')); return f({first:()=>({json:req})}, ()=>sd)[0].json; }
let passed = 0, failed = 0;
const check = (name, fn) => {
  try { fn(); passed++; console.log('pass', name); }
  catch (e) { failed++; console.log('FAIL', name + '\n  ' + String(e.message).split('\n').join('\n  ')); }
};

const g = guard('guard-typed.js',{headers:{origin:'https://heartside.io','x-forwarded-for':'1.2.3.4'},body:{session:'abcdefgh12',step:'home',question:'What does Kuku do?',typed_text:'she sits in the window from 5pm',dog:{name:'Kuku',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
check('guard accepts a good typed request and passes the answer on as data', () => {
  assert.equal(g.reject, '');
  assert.deepEqual(JSON.parse(g.prompt), {step:'home',question:'What does Kuku do?',typed_text:'she sits in the window from 5pm',previous_line:'',dog:{name:'Kuku',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}});
});
check('guard keeps they when no pronoun was tapped, and never guesses she', () => {
  const base = {session:'abcdefgh12',step:'home',question:'What does Kuku do?',typed_text:'sits in the window',recipient:{name:'Sam',relation:'partner'}};
  for (const [sent, kept] of [['they','they'],[undefined,'they'],['it','they'],['he','he'],['she','she']]) {
    const r = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{...base, dog:{name:'Kuku', pronoun: sent}}});
    assert.equal(JSON.parse(r.prompt).dog.pronoun, kept, String(sent));
  }
});
check('guard refuses another origin', () => {
  assert.equal(guard('guard-typed.js',{headers:{origin:'https://evil.com'},body:{session:'abcdefgh12',typed_text:'x'}}).reject, 'origin');
});
const cases = [
 {content:{parts:[{text:'{"reaction":"The window watch! Serious work.","line":"Watches the window for you from 5pm.","follow_up":{"question":"Every day?","chips":["Every day","Weekdays","Even weekends"]},"flags":[]}'}]}},
 {reaction:'Nice — very nice','line':'Waits for you at 6pm in Paris.',follow_up:null,flags:[]},
 {line:'I wait for you.', reaction:'ok'},
 {error:'timeout'},
];
const [c0, c1, c2, c3] = cases.map(c => run('enforce-typed.js', g, c));
check('a model answer nested in the provider response is read, and its exclamation mark becomes a period', () => {
  assert.equal(c0.source, 'ai');
  assert.equal(c0.reaction, 'The window watch. Serious work.');
  assert.equal(c0.line, 'Watches the window for you from 5pm.');
  assert.equal(c0.follow_up.question, 'Every day?');
  assert.deepEqual(c0.follow_up.chips, ['Every day', 'Weekdays', 'Even weekends']);
  for (const t of [c0.reaction, c0.line, c0.follow_up.question].concat(c0.follow_up.chips)) assert.doesNotMatch(t, /!/);
});
check('an em dash becomes a comma, and a line with an invented time and place falls back to the owner\'s words', () => {
  assert.equal(c1.reaction, 'Nice, very nice');
  assert.doesNotMatch(c1.line, /6pm|Paris/);
  assert.equal(c1.line, c3.line);
});
check('a plain line and reaction pass unchanged', () => {
  assert.equal(c2.line, 'I wait for you.');
  assert.equal(c2.reaction, 'ok');
  assert.equal(c2.source, 'ai');
});
check('no model answer gives the scripted fallback', () => {
  assert.deepEqual(c3, {reaction:'Tell me more?', line:'She sits in the window from 5pm.', follow_up:{question:'Tell me more?', chips:[]}, flags:[], source:'fallback'});
});
check('grief in the typed answer gives the fixed reply and no line', () => {
  const g2 = {...g, input:{...g.input, typed_text:'he passed away last year'}};
  assert.deepEqual(run('enforce-typed.js', g2, cases[0]), {reaction:"I didn't quite catch that one. Try again, or pick one of these?", line:'', follow_up:null, flags:['grief'], source:'ai'});
});
check('a reaction that reads like a job review is replaced', () => {
  assert.equal(run('enforce-typed.js', g, {reaction:'Kuku is a focused teammate for Sam.', line:'I watch the window for you from 5pm.', follow_up:null, flags:[]}).reaction, 'Tell me more?');
});
check('every part of a follow-up loses its exclamation marks', () => {
  const out = run('enforce-typed.js', g, {reaction:'Window duty!!', line:'I watch the window for you from 5pm.', follow_up:{question:'Every day!?', chips:['Every day!','Weekdays'], lines:['I watch the window for you every day!', null], replies:['Love that!!', 'Fair.']}, flags:[]});
  for (const t of [out.reaction, out.line, out.follow_up.question].concat(out.follow_up.chips, out.follow_up.lines.filter(Boolean), out.follow_up.replies.filter(Boolean))) assert.doesNotMatch(t, /!/);
  assert.equal(out.reaction, 'Window duty.');
  assert.equal(out.follow_up.question, 'Every day?');
  assert.deepEqual(out.follow_up.chips, ['Every day.', 'Weekdays']);
  assert.deepEqual(out.follow_up.replies, ['Love that.', 'Fair.']);
});
const gc = {input:{dog:{name:'Kuku'},recipient:{name:'Sam',relation:'partner'},answers:[{id:'home',typed:'sits in the window from 5pm',label:''}],current_lines:{home:'Watches the window from 5pm.',spot:'Steals your side of the bed.',together:'Lives for our morning walks.',meaning:'Your shadow, always.'},default_gift:'mug'}};
const c = run('enforce-compose.js', gc, {text: JSON.stringify({lines:{home:'Watches the window for you from 5pm.',spot:'Steals your side of the bed in Ohio.',together:'Lives for our morning walks.',meaning:'Your shadow, always.'},recommended_gift:'mug',reason:'Walks start with coffee. So Kuku gets a spot in Sam\'s mug every morning.',sources:{home:['home']},flags:[]})});
check('compose keeps lines grounded in the answers', () => {
  assert.equal(c.lines.home, 'Watches the window for you from 5pm.');
  assert.equal(c.lines.together, 'Lives for our morning walks.');
  assert.equal(c.lines.meaning, 'Your shadow, always.');
  assert.deepEqual(c.sources, {home:['home']});
  assert.equal(c.recommended_gift, 'mug');
  assert.equal(c.source, 'ai');
});
check('compose drops an invented place, and a draft with a bed the owner never mentioned, for a plain line', () => {
  assert.doesNotMatch(c.lines.spot, /Ohio|bed/);
  assert.equal(c.lines.spot, "I'm never far from you.");
});
check('compose drops a reason built on coffee the owner never mentioned', () => {
  assert.equal(c.reason, '');
});

// 28 Oct review of PR #65. The shared rules on their own, as both Enforce nodes paste them.
const S = new Function(fs.readFileSync('shared.js', 'utf8') + '\nreturn { clean, ownWords, propsGrounded };')();
const typedReq = (step, typed_text, dog, recipient) => guard('guard-typed.js', {headers:{origin:'https://heartside.io'}, body:{session:'abcdefgh31', step, question:'q', typed_text, dog:{name:dog, pronoun:'she'}, recipient}});
const sam = {name:'Sam', relation:'partner'}, alexSelf = {name:'Alex', relation:'self'};
check('an ellipsis is one period, and the word after it starts a sentence', () => {
  assert.equal(S.clean('I wait at the window... until your car pulls in.'), 'I wait at the window. Until your car pulls in.');
  assert.equal(S.clean('Window duty...the best kind of duty.'), 'Window duty. The best kind of duty.');
  assert.equal(S.clean('I wait...'), 'I wait.');
  assert.equal(S.clean('We walk at 7 a.m. every day.'), 'We walk at 7 a.m. every day.', 'one period is left alone');
  assert.equal(S.ownWords('my best friend... forever', 44), 'My best friend. Forever.');
  const gw = typedReq('home', 'waits at the window until my car pulls in', 'Kuku', sam);
  const out = run('enforce-typed.js', gw, {reaction:'Window duty... the best kind of duty.', lines:['I wait at the window... until your car pulls in.'], follow_up:null, flags:[]});
  assert.equal(out.line, 'I wait at the window. Until your car pulls in.');
  assert.equal(out.reaction, 'Window duty. The best kind of duty.');
  assert.equal(run('enforce-typed.js', typedReq('meaning', 'my best friend... forever', 'Kuku', sam), {error:'timeout'}).line, 'My best friend. Forever.');
});
check('a follow-up question that names something the owner never said is dropped, with its chips', () => {
  const gd = typedReq('home', 'she waits by the door!! every single day', 'Honey', sam);
  const fu = (question, chips) => run('enforce-typed.js', gd, {reaction:'At the door every day, what a welcome.', lines:['I wait by the door for you every single day.'], follow_up:{question, chips, lines:chips.map(() => null), replies:chips.map(() => null)}, flags:[]}).follow_up;
  assert.equal(fu("Does Honey hear Sam's car before the door opens?", ['Hears the car first', 'Only at the door', 'Every single time']), null, 'a car');
  assert.equal(fu('Does Honey grab a toy or a shoe for Sam?', ['Brings a toy', 'Just waits', 'Every single time']), null, 'a toy and a shoe');
  const kept = fu('Is Honey at the door even on weekends?', ['Even weekends', 'Hears the car first', 'Every single time']);
  assert.equal(kept.question, 'Is Honey at the door even on weekends?', 'the door is the owner\'s own');
  assert.deepEqual(kept.chips, ['Even weekends', 'Every single time']);
});
check('a gift for the buyer: Buddy says you, and never the buyer\'s name', () => {
  const gs = typedReq('home', 'she follows me from room to room', 'Ruby', alexSelf);
  const fuYou = {question:'Does Ruby follow you into every room?', chips:['Follows you everywhere', 'Only when you get up'], lines:[null, null], replies:['Your shadow, then.', 'A sensible shadow.']};
  const you = run('enforce-typed.js', gs, {reaction:'Ruby follows you from room to room, which is love.', lines:['I follow you from room to room, every time.'], follow_up:fuYou, flags:[]});
  assert.equal(you.reaction, 'Ruby follows you from room to room, which is love.');
  assert.deepEqual(you.follow_up.chips, ['Follows you everywhere', 'Only when you get up']);
  assert.deepEqual(you.follow_up.replies, ['Your shadow, then.', 'A sensible shadow.']);
  const byName = run('enforce-typed.js', gs, {reaction:'Ruby follows Alex from room to room.', lines:['I follow you from room to room, every time.'], follow_up:{question:'Does Ruby follow Alex into every room?', chips:['Follows Alex everywhere'], lines:[null], replies:[null]}, flags:[]});
  assert.equal(byName.reaction, '', 'no prefix rather than the buyer named in the third person');
  assert.equal(byName.follow_up, null);
  // a gift for someone else is unchanged: their name, never you
  const gp = typedReq('home', 'she follows me from room to room', 'Ruby', sam);
  assert.equal(run('enforce-typed.js', gp, {reaction:'Lovely.', lines:['I follow you from room to room, every time.'], follow_up:fuYou, flags:[]}).follow_up, null);
  const named = run('enforce-typed.js', gp, {reaction:'Lovely.', lines:['I follow you from room to room, every time.'], follow_up:{question:'Does Ruby follow Sam into every room?', chips:['Follows Sam everywhere'], lines:[null], replies:[null]}, flags:[]});
  assert.deepEqual(named.follow_up.chips, ['Follows Sam everywhere']);
  // the compose reason
  const coffeeFor = (recipient) => ({input:{dog:{name:'Ruby'}, recipient, answers:[{id:'together', chip:'coffee', label:'', typed:null}], current_lines:{home:'I wait for you.', spot:"I'm never far from you.", together:'Coffee with you is the best part of my morning.', meaning:"I'm yours, always."}, default_gift:'mug'}});
  const reason = (recipient, text) => run('enforce-compose.js', coffeeFor(recipient), {text: JSON.stringify({lines: coffeeFor(recipient).input.current_lines, recommended_gift:'mug', reason:text, flags:[]})}).reason;
  assert.equal(reason(alexSelf, 'Your mornings start with Ruby and a coffee, so a mug puts Ruby right there.'), 'Your mornings start with Ruby and a coffee, so a mug puts Ruby right there.');
  assert.equal(reason(alexSelf, "Alex's mornings start with Ruby and a coffee, so a mug puts Ruby right there."), '');
  assert.equal(reason(sam, 'Your mornings start with Ruby and a coffee, so a mug puts Ruby right there.'), '');
  assert.equal(reason(sam, "Sam's mornings start with Ruby and a coffee, so a mug puts Ruby right there."), "Sam's mornings start with Ruby and a coffee, so a mug puts Ruby right there.");
});
check('a dog\'s name grounds no prop: a dog called Biscuit, Latte or Waffles gets no cookie, espresso or waffle', () => {
  const said = 'we hang out on sundays';
  const typed = (dog, reaction, line, text = said) => run('enforce-typed.js', typedReq('together', text, dog, sam), {reaction, lines:[line], follow_up:null, flags:[]});
  let out = typed('Biscuit', 'Biscuit would trade every cookie for Sam.', "I'd trade every cookie in the house for you.");
  assert.equal(out.reaction, ''); assert.equal(out.line, 'We hang out on sundays.');
  assert.equal(typed('Latte', 'Lovely.', 'Espresso with you is my favorite part of the day.').line, 'We hang out on sundays.');
  assert.equal(typed('Waffles', 'Lovely.', "I'd give up every waffle for you on a sunday.").line, 'We hang out on sundays.');
  // the name itself may appear, and the owner's own words still ground a prop
  assert.equal(typed('Biscuit', 'Biscuit and Sam on a Sunday, perfect.', 'Sundays with you are my favorite days.').reaction, 'Biscuit and Sam on a Sunday, perfect.');
  out = typed('Biscuit', 'Lovely.', 'I wait at the door with a cookie for you.', 'Biscuit waits at the door');
  assert.equal(out.line, 'Biscuit waits at the door.', 'the name in the typed words grounds no cookie');
  assert.equal(typed('Biscuit', 'Lovely.', 'I wait at the door for you.', 'Biscuit waits at the door').line, 'I wait at the door for you.');
  assert.equal(S.propsGrounded('I bring you a cookie.', 'she loves cookies', 'Cookie Sam'), true, 'cookies the owner typed ground a cookie, whatever the name');
  // compose
  const biscuit = {input:{dog:{name:'Biscuit'}, recipient:sam, answers:[{id:'together', chip:'walk', label:'', typed:null}], current_lines:{home:'I wait for you.', spot:"I'm never far from you.", together:'Our walks are the best part of my day.', meaning:"I'm yours, always."}, default_gift:'mug'}};
  const cl = run('enforce-compose.js', biscuit, {text: JSON.stringify({lines: Object.assign({}, biscuit.input.current_lines, {together:"I'd trade every cookie in the house for you."}), recommended_gift:'mug', reason:'Biscuit would trade a cookie for a walk with Sam, so a mug fits.', flags:[]})});
  assert.equal(cl.lines.together, 'Our walks are the best part of my day.');
  assert.equal(cl.reason, '');
});
check('a named toy does not license a follow-up about bringing it', () => {
  const input = {...g.input, typed_text:'She rests beside her green hedgehog.', previous_line:''};
  const raw = {reaction:'Lovely.', line:'I rest beside my hedgehog.', follow_up:{question:'When does she bring Sam the hedgehog?',chips:['Every day','Weekends'],lines:['I bring my hedgehog every day.','I bring it on weekends.'],replies:['A daily delivery.','A weekend delivery.']},flags:[]};
  assert.equal(run('enforce-typed.js',{input},raw).follow_up,null);
  const offered = {...raw,follow_up:{...raw.follow_up,question:'When does she rest beside the hedgehog?',chips:['Brings it to Sam','After walks']}};
  assert.deepEqual(run('enforce-typed.js',{input},offered).follow_up.chips,['After walks']);
  const stated={...input,typed_text:'She brings Sam her green hedgehog.'};
  assert.equal(run('enforce-typed.js',{input:stated},raw).follow_up.question,raw.follow_up.question);
});

// 29 Oct: Gemini is called through its REST API with a deadline (the Gemini node has none). The reply
// is flattened to { text } by a Set node before Enforce, and every model call reads the one system
// prompt held on the disabled Voice node. Evaluated with n8n's own expression parser.
{
  const { createRequire } = await import('node:module');
  const { Tournament } = createRequire(new URL('../tools/preview/package.json', import.meta.url))('@n8n/tournament');
  const tournament = new Tournament(e => { throw e; });
  const exprs = (f) => [...fs.readFileSync(f, 'utf8').matchAll(/expr\(("(?:[^"\\]|\\.)*")\)/g)].map(m => JSON.parse(m[1]));
  const evalExpr = (e, scope) => tournament.execute(e, scope);
  const rest = (o) => ({candidates:[{content:{parts:[{text: JSON.stringify(o)}], role:'model'}, finishReason:'STOP', index:0}], usageMetadata:{}});
  const voice = (sys) => () => ({ params: { options: { systemMessage: sys } }, first: () => ({ json: { prompt: '{"step":"home"}' } }) });
  check('a Gemini REST reply reaches Enforce as text, and a timeout or empty reply falls back to the buyer', () => {
    const flatten = exprs('typed.js').find(e => e.includes('candidates'));
    const text = evalExpr(flatten, { $json: rest({reaction:'Kuku on window duty is a fine sight.', lines:['I watch the window for you from 5pm.'], follow_up:null, flags:[]}) });
    const typed = run('enforce-typed.js', g, {text});
    assert.equal(typed.source, 'ai'); assert.equal(typed.line, 'I watch the window for you from 5pm.');
    assert.equal(evalExpr(flatten, { $json: { error: { message: 'timeout of 3000ms exceeded' } } }), '');
    assert.equal(run('enforce-typed.js', g, {text: ''}).source, 'fallback');
    assert.equal(run('enforce-typed.js', g, {error:{message:'timeout of 3000ms exceeded', code:'ECONNABORTED'}}).source, 'fallback');
  });
  check('every model call reads the one system prompt on Voice, with a deadline, and no Gemini node runs', () => {
    const P = JSON.parse(fs.readFileSync('prompts.json', 'utf8'));
    for (const [f, sys, timeouts] of [['typed.js', P.typed, [3000, 1500]], ['compose.js', P.compose, [6500, 3500]]]) {
      const src = fs.readFileSync(f, 'utf8');
      assert.deepEqual([...src.matchAll(/timeout: (\d+)/g)].map(m => Number(m[1])), timeouts, f);
      assert.equal((src.match(/n8n-nodes-langchain\.googleGemini/g) || []).length, 1, f + ': only Voice');
      assert.match(src, /name: 'Voice',\n    disabled: true,/, f);
      const bodies = exprs(f).filter(e => e.includes('JSON.stringify({'));
      assert.equal(bodies.length, 2, f);
      for (const body of bodies) {
        const out = JSON.parse(evalExpr(body, { JSON, $: voice(sys), $json: { prompt: '{"step":"home"}' } }));
        const system = out.systemInstruction ? out.systemInstruction.parts[0].text : out.system[0].text;
        assert.equal(system, sys, f);
        assert.equal((body.match(/\}\}/g) || []).length, 1, 'only the final n8n delimiter');
      }
    }
  });
}

// 29 Oct: the hourly limits. Static data is saved at the end of a run, so ten parallel runs from one
// session all passed a limit of five. Now each allowed call appends its keys to a data table and counts
// them (Admit, Count, "Within limits?"). Simulated here with an append-only table and n8n's own
// expression parser: however the ten runs interleave, at most five are admitted, and the IP is a hash.
{
  const { createRequire } = await import('node:module');
  const { Tournament } = createRequire(new URL('../tools/preview/package.json', import.meta.url))('@n8n/tournament');
  const tournament = new Tournament(e => { throw e; });
  const within = [...fs.readFileSync('compose.js', 'utf8').matchAll(/expr\(("(?:[^"\\]|\\.)*")\)/g)].map(m => JSON.parse(m[1])).find(e => e.includes("$('Count')"));
  const req = {headers:{origin:'https://heartside.io','cf-connecting-ip':'198.51.100.7'},body:{session:'abcdefgh12',dog:{name:'Kuku'},recipient:{name:'Sam'}}};
  check('guard keys hide the IP and carry the limits; nothing is counted in static data', () => {
    const src = fs.readFileSync('guard-compose.js', 'utf8');
    assert.doesNotMatch(src, /getWorkflowStaticData/);
    const g1 = guard('guard-compose.js', req);
    assert.match(g1.skey, /^compose\|\d+\|abcdefgh12$/); assert.match(g1.ikey, /^compose\|\d+\|[0-9a-z]+$/);
    assert.ok(!g1.ikey.includes('198.51.100.7')); assert.deepEqual(g1.limits, {session: 5, ip: 20});
    assert.equal(guard('guard-typed.js', {...req, body:{...req.body, typed_text:'x'}}).limits.session, 8);
  });
  check('ten parallel note calls from one session: at most five admitted, in any interleaving', () => {
    const g1 = guard('guard-compose.js', req);
    for (const order of ['all-insert-first', 'interleaved']) {
      const table = []; let admitted = 0;
      const decide = () => tournament.execute(within, { $: (n) => n === 'Count' ? { all: () => table.filter(r => r.skey === g1.skey || r.ikey === g1.ikey).map(json => ({json})) } : { first: () => ({ json: g1 }) } });
      if (order === 'all-insert-first') { for (let i = 0; i < 10; i++) table.push({skey: g1.skey, ikey: g1.ikey}); for (let i = 0; i < 10; i++) if (decide()) admitted++; }
      else for (let i = 0; i < 10; i++) { table.push({skey: g1.skey, ikey: g1.ikey}); if (decide()) admitted++; }
      assert.ok(admitted <= 5, order + ': ' + admitted);
      if (order === 'interleaved') assert.equal(admitted, 5, 'serial calls still get their five');
    }
  });
}

// 29 Oct: the writer also returns a painting idea (scene) for this dog, which reaches Teeinblue. It is
// grounded like the lines: an object the owner never gave drops it, and the owner's own toy keeps it.
check('the painting idea is kept only when every prop in it is the owner\'s', () => {
  const inp = {dog:{name:'Juno',pronoun:'she',breed:'Labrador Retriever'},recipient:{name:'Mom',relation:'mom'},answers:[{id:'home',chip:'toy',label:'brings you something',typed:null},{id:'spot',chip:'feet',label:'on your feet',typed:null},{id:'together',chip:'walk',label:'walks',typed:null},{id:'meaning',chip:'best',label:'a best friend',typed:null},{id:'toy',chip:null,label:'favorite toy or treat',typed:'a tennis ball'}],current_lines:{home:'',spot:'',together:'',meaning:''},default_gift:'print',note_tone:'hilarious'};
  const lines = {home:'I bring you a present every time you walk in.',spot:'Your feet are my post, and I never leave it.',together:'Our walks are the best news of every day.',meaning:"You're my best friend, and I'm excellent."};
  const ok = run('enforce-compose.js', {input: inp}, {lines, scene: 'A Labrador sitting bolt upright on a doormat, a tennis ball balanced on her nose, eyes sideways, deeply serious.'});
  assert.match(ok.scene, /tennis ball/);
  assert.equal(run('enforce-compose.js', {input: inp}, {lines, scene: 'A Labrador with a slice of toast on her nose.'}).scene, '', 'toast was never given');
  assert.equal(run('enforce-compose.js', {input: inp}, {lines, scene: 'Juno and Mom on the couch.'}).scene, '', 'no names in the brief');
  assert.equal(run('enforce-compose.js', {input: inp}, {lines}).scene, '');
  assert.equal(run('enforce-compose.js', {input: inp}, {lines, scene: 'A chestnut Labrador with a greying muzzle and a tennis ball.'}).scene, '', 'no coat the photo may contradict');
});
// 29 Oct after-bench (executions 47856-47867): the writer was right and the rules lost it. A stray
// comma and quote cost a whole note, "your partner" read as you, "treat our naps" and "parks on her
// feet" read as a snack and a place, and a line over its limit with no draft left a gap.
check('the after-bench losses are kept: repaired JSON, your partner, verbs, never a gap', () => {
  const frank = {dog:{name:'Frank',breed:'Dachshund'},recipient:{name:'',relation:'self'},answers:[{id:'together',chip:'coffee',label:'morning coffee',typed:null},{id:'meaning',chip:'boss',label:'the boss of the house',typed:null}],current_lines:{home:'',spot:'',together:'',meaning:''},default_gift:'print'};
  const broken = '{"lines":{"home":"I spin until I\'ve checked every angle of you.","spot":"Anywhere you are is where I\'m needed most.","together":"I supervise your morning coffee because someone must.","meaning":"You\'re my boss, and I run you.","},"recommended_gift":"print"}';
  const f = run('enforce-compose.js', {input: frank}, {text: broken});
  assert.equal(f.source, 'ai'); assert.equal(f.lines.meaning, "You're my boss, and I run you.");
  const bao = {dog:{name:'Bao',breed:'French Bulldog'},recipient:{name:'your partner',relation:'partner'},answers:[{id:'spot',chip:'couch',label:'the couch',typed:null},{id:'together',chip:'naps',label:'naps',typed:null}],current_lines:{home:'',spot:'',together:'',meaning:''},default_gift:'print'};
  const b = run('enforce-compose.js', {input: bao}, {lines:{home:'I play it cool for one second, then I give up.',spot:'The couch is where I keep your side warm for you, every single night.',together:'I treat our naps like an appointment I never miss.',meaning:"I'm your shadow, and proud of it."},recommended_gift:'blanket',reason:"Bao's whole life with your partner is the couch and the naps, so a blanket keeps Bao close."});
  assert.match(b.reason, /your partner/);
  assert.match(b.lines.together, /^I treat our naps/);
  assert.ok(b.lines.spot, 'a line over its limit leaves a plain line, never a gap');
  assert.equal(run('enforce-compose.js', {input: bao}, {lines:{}, reason:'Bao parks on the couch with your partner, so a blanket keeps him close.'}).reason.slice(0, 8), 'Bao park');
  assert.equal(run('enforce-compose.js', {input: bao}, {lines:{}, reason:'Bao waits for your partner, so you should buy a blanket.'}).reason, '', 'a you that is not the partner still goes');
});
// 29 Oct: the first gift follows the answers, the same way every time, and a pick against the rule
// loses its reason rather than explain the wrong gift
check('the first gift follows the closeness answers, never the mug', () => {
  const ans = (spot, together, meaning) => ({dog:{name:'Juno',breed:'Labrador Retriever'},recipient:{name:'Mom',relation:'mom'},answers:[{id:'spot',chip:spot,label:'',typed:null},{id:'together',chip:together,label:'',typed:null},{id:'meaning',chip:meaning,label:'',typed:null}],current_lines:{home:'',spot:'',together:'',meaning:''},default_gift:'print'});
  const why = 'Juno and Mom share every walk, so a framed portrait of Juno belongs on the wall.';
  assert.equal(run('enforce-compose.js', {input: ans('couch', 'naps', 'best')}, {lines:{}, recommended_gift:'print', reason: why}).recommended_gift, 'blanket');
  assert.equal(run('enforce-compose.js', {input: ans('couch', 'naps', 'best')}, {lines:{}, recommended_gift:'print', reason: why}).reason, '', 'no reason for the wrong gift');
  assert.equal(run('enforce-compose.js', {input: ans('feet', 'walk', 'best')}, {lines:{}, recommended_gift:'mug', reason: why}).recommended_gift, 'print');
  const ok = run('enforce-compose.js', {input: ans('feet', 'walk', 'best')}, {lines:{}, recommended_gift:'print', reason: why});
  assert.equal(ok.recommended_gift, 'print'); assert.equal(ok.reason, why);
  assert.equal(run('enforce-compose.js', {input: ans('anywhere', 'coffee', 'shadow')}, {lines:{}, recommended_gift:'print'}).recommended_gift, 'print');
  assert.equal(run('enforce-compose.js', {input: ans('bed', 'movie', 'boss')}, {lines:{}, recommended_gift:'print'}).recommended_gift, 'blanket');
});
console.log(failed ? failed + ' failed, ' + passed + ' passed' : 'all ' + passed + ' passed');
process.exitCode = failed ? 1 : 0;
