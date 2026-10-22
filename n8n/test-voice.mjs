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
console.log(fails?fails+' failed':'all passed');
