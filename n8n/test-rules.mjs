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
console.log(failed ? failed + ' failed, ' + passed + ' passed' : 'all ' + passed + ' passed');
process.exitCode = failed ? 1 : 0;
