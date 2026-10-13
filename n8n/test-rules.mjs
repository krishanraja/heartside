import fs from 'node:fs';
function run(file, guardOut, raw){
  const code = fs.readFileSync(file,'utf8');
  const f = new Function('$','$input', code);
  return f(()=>({first:()=>({json:guardOut})}), {first:()=>({json:raw})})[0].json;
}
function guard(file, req){ const sd={}; const f=new Function('$input','$getWorkflowStaticData', fs.readFileSync(file,'utf8')); return f({first:()=>({json:req})}, ()=>sd)[0].json; }
const g = guard('guard-typed.js',{headers:{origin:'https://heartside.io','x-forwarded-for':'1.2.3.4'},body:{session:'abcdefgh12',step:'home',question:'What does Kuku do?',typed_text:'she sits in the window from 5pm',dog:{name:'Kuku',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
console.log(g.reject, g.prompt);
console.log(guard('guard-typed.js',{headers:{origin:'https://evil.com'},body:{session:'abcdefgh12',typed_text:'x'}}).reject);
const cases = [
 {content:{parts:[{text:'{"reaction":"The window watch! Serious work.","line":"Watches the window for you from 5pm.","follow_up":{"question":"Every day?","chips":["Every day","Weekdays","Even weekends"]},"flags":[]}'}]}},
 {reaction:'Nice — very nice','line':'Waits for you at 6pm in Paris.',follow_up:null,flags:[]},
 {line:'I wait for you.', reaction:'ok'},
 {error:'timeout'},
];
for (const c of cases) console.log(JSON.stringify(run('enforce-typed.js', g, c)));
const g2 = {...g, input:{...g.input, typed_text:'he passed away last year'}};
console.log(JSON.stringify(run('enforce-typed.js', g2, cases[0])));
const gc = {input:{dog:{name:'Kuku'},recipient:{name:'Sam',relation:'partner'},answers:[{id:'home',typed:'sits in the window from 5pm',label:''}],current_lines:{home:'Watches the window from 5pm.',spot:'Steals your side of the bed.',together:'Lives for our morning walks.',meaning:'Your shadow, always.'},default_gift:'mug'}};
console.log(JSON.stringify(run('enforce-compose.js', gc, {text: JSON.stringify({lines:{home:'Watches the window for you from 5pm.',spot:'Steals your side of the bed in Ohio.',together:'Lives for our morning walks.',meaning:'Your shadow, always.'},recommended_gift:'mug',reason:'Walks start with coffee. So Kuku gets a spot in Sam\'s mug every morning.',sources:{home:['home']},flags:[]})})));
