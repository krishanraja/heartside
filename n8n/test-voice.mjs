import fs from 'node:fs';
process.chdir(new URL(".", import.meta.url).pathname);
function run(file, guardOut, raw){ const f=new Function('$','$input', fs.readFileSync(file,'utf8')); return f(()=>({first:()=>({json:guardOut})}), {first:()=>({json:raw})})[0].json; }
function guard(file, req){ const sd={}; const f=new Function('$input','$getWorkflowStaticData', fs.readFileSync(file,'utf8')); return f({first:()=>({json:req})}, ()=>sd)[0].json; }
let fails=0; const ok=(c,m)=>{ if(!c){fails++;console.log('FAIL',m);} else console.log('pass',m); };
const g = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh12',step:'home',question:'What does Mowgli do?',typed_text:'brings the stick back every single time',dog:{name:'Mowgli',pronoun:'he',breed:'Border Collie',tone:'Herding Manager'},recipient:{name:'Sam',relation:'partner'}}});
ok(g.input.dog.tone==='Herding Manager' && g.input.dog.breed==='Border Collie','guard keeps breed and tone');
ok(!guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh13',typed_text:'x',dog:{name:'A',tone:'Evil'}}}).input.dog.tone,'guard drops unknown tone');
const L=(line)=>run('enforce-typed.js', g, {reaction:'Sticks! Serious business.',line,follow_up:null,flags:[]}).line;
ok(L("I bring the stick back to you, every time.")==="I bring the stick back to you, every time.",'dog-voice I line passes');
ok(L("Understands every word. Pretends he doesn't.")!=="Understands every word. Pretends he doesn't.",'he line rejected');
ok(L("Mowgli brings the stick back.")!=="Mowgli brings the stick back.",'dog name rejected');
ok(L("I bring you the stick, Sam.")!=="I bring you the stick, Sam.",'person name rejected');
ok(L("I bring the stick back 10 times.")!=="I bring the stick back 10 times.",'invented number rejected');
ok(L("Same stick. Every time. Our thing.")!=="Same stick. Every time. Our thing.",'stacked fragments rejected');
ok(L("I bring the stick back to you. You're welcome.")!=="I bring the stick back to you. You're welcome.",'worn line rejected');
ok(L("Stick back. Every time!")!=="Stick back. Every time!",'exclamation rejected');
const gc = {input:{dog:{name:'Kuku',tone:'Terrier Menace'},recipient:{name:'Sam',relation:'partner'},answers:[{id:'home',chip:'door',label:'',typed:null}],current_lines:{home:'I wait by the door, even on weekends.',spot:'I took your side of the bed to keep it warm.',together:'Our walks are the best part of my day.',meaning:"I'm your shadow, and I like it that way."},default_gift:'mug'}};
const lines={home:"I wait by the door, even on weekends.",spot:"I took your side of the bed to keep it warm.",together:"Our walks are the best part of my day.",meaning:"I'm your shadow, and I like it that way."};
const c=run('enforce-compose.js', gc, {text: JSON.stringify({lines,recommended_gift:'mug',reason:'Walks start with coffee. So Kuku gets a spot in Sam\'s mug.',flags:[]})});
ok(JSON.stringify(c.lines)===JSON.stringify(lines),'compose keeps dog-voice lines with sentence starts');
// 22 Oct: home, spot and together print up to 60 characters; meaning stays at 44 (the ornament)
const long = "I hear your car long before anyone else does, every night.";
ok(long.length > 44 && long.length <= 60 && L(long) === long, 'home line up to 60 passes');
const gm = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh14',step:'meaning',question:'What is Mowgli to Sam?',typed_text:'my best friend',dog:{name:'Mowgli',pronoun:'he'},recipient:{name:'Sam',relation:'partner'}}});
const LM=(line)=>run('enforce-typed.js', gm, {reaction:'Best friends.',lines:[line],follow_up:null,flags:[]}).line;
ok(LM("You're my best friend, and I'd pick you again and again.") !== "You're my best friend, and I'd pick you again and again.", 'meaning line over 44 rejected');
ok(LM("You're my best friend, and I'd pick you.") === "You're my best friend, and I'd pick you.", 'meaning line at 44 passes');
// 22 Oct: Claude writes the note; Enforce reads the Messages API body. Lines up to 60, meaning up to 44.
const cl = { home: "I hear your car long before anyone else does, every night.", spot: "I took your side of the bed to keep it warm.", together: "Our walks are the best part of my day.", meaning: "I'm your shadow, and I like it that way." };
const cc = run('enforce-compose.js', gc, { model: 'claude-sonnet-5-5', content: [{ type: 'text', text: JSON.stringify({ voice: 'x', lines: cl, alternates: { home: ['I wait by the door, even on weekends.'] }, recommended_gift: 'mug', reason: 'Walks and coffee, so Kuku gets a mug.', flags: [] }) }], stop_reason: 'end_turn' });
ok(JSON.stringify(cc.lines) === JSON.stringify(cl), 'compose reads a Claude response, 60-character home line kept');
const cc2 = run('enforce-compose.js', gc, { content: [{ type: 'text', text: JSON.stringify({ lines: Object.assign({}, cl, { meaning: "You're my best friend, and I'd pick you again and again." }), recommended_gift: 'mug', reason: 'x', flags: [] }) }] });
ok(cc2.lines.meaning === gc.input.current_lines.meaning, 'compose meaning over 44 falls back to the draft');
console.log(fails?fails+' failed':'all passed');
