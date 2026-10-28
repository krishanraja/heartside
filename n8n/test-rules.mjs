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
console.log(failed ? failed + ' failed, ' + passed + ' passed' : 'all ' + passed + ' passed');
process.exitCode = failed ? 1 : 0;
