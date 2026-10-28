import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
function run(file, guardOut, raw){ const f=new Function('$','$input', fs.readFileSync(file,'utf8')); return f(()=>({first:()=>({json:guardOut})}), {first:()=>({json:raw})})[0].json; }
function guard(file, req){ const sd={}; const f=new Function('$input','$getWorkflowStaticData', fs.readFileSync(file,'utf8')); return f({first:()=>({json:req})}, ()=>sd)[0].json; }
let fails=0; const ok=(c,m)=>{ if(!c){fails++;console.log('FAIL',m);} else console.log('pass',m); };
const g = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh12',step:'home',question:'What does Mowgli do?',typed_text:'brings the stick back every single time',dog:{name:'Mowgli',pronoun:'he',breed:'Border Collie',tone:'Herding Manager'},recipient:{name:'Sam',relation:'partner'}}});
ok(g.input.dog.tone==='Herding Manager' && g.input.dog.breed==='Border Collie','guard keeps breed and tone');
ok(!guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh13',typed_text:'x',dog:{name:'A',tone:'Evil'}}}).input.dog.tone,'guard drops unknown tone');
const composeReq = {headers:{origin:'https://heartside.io'},body:{session:'abcdefgh14',dog:{name:'Pip',pronoun:'he',tone:'Terrier Menace'},recipient:{name:'Sam',relation:'partner'},answers:[],current_lines:{home:'I wait for you.',spot:'I sit close.',together:'I walk with you.',meaning:'I love you.'},default_gift:'mug',note_tone:'hilarious'}};
ok(guard('guard-compose.js',composeReq).input.note_tone==='hilarious','compose guard keeps the selected note tone apart from breed personality');
composeReq.body.note_tone='untrusted';
ok(guard('guard-compose.js',composeReq).input.note_tone==='warm','compose guard defaults an unknown note tone to warm');
const L=(line)=>run('enforce-typed.js', g, {reaction:'Sticks! Serious business.',line,follow_up:null,flags:[]}).line;
ok(L("I bring the stick back to you, every time.")==="I bring the stick back to you, every time.",'dog-voice I line passes');
ok(L("Understands every word. Pretends he doesn't.")!=="Understands every word. Pretends he doesn't.",'he line rejected');
ok(L("Mowgli brings the stick back.")!=="Mowgli brings the stick back.",'dog name rejected');
ok(L("I bring you the stick, Sam.")!=="I bring you the stick, Sam.",'person name rejected');
ok(L("I bring the stick back 10 times.")!=="I bring the stick back 10 times.",'invented number rejected');
ok(L("Same stick. Every time. Our thing.")!=="Same stick. Every time. Our thing.",'stacked fragments rejected');
ok(L("I bring the stick back to you. You're welcome.")!=="I bring the stick back to you. You're welcome.",'worn line rejected');
ok(L("Stick back. Every time!")!=="Stick back. Every time!",'exclamation rejected');
// the answers the page sends with these drafts (all five steps), so the chip words ground each line
const gc = {input:{dog:{name:'Kuku',tone:'Terrier Menace'},recipient:{name:'Sam',relation:'partner'},answers:[{id:'home',chip:'door',label:'',typed:null},{id:'home_follow',chip:'hears',label:'',typed:null},{id:'spot',chip:'bed',label:'',typed:null},{id:'together',chip:'walk',label:'',typed:null},{id:'meaning',chip:'shadow',label:'',typed:null}],current_lines:{home:'I wait by the door, even on weekends.',spot:'I took your side of the bed to keep it warm.',together:'Our walks are the best part of my day.',meaning:"I'm your shadow, and I like it that way."},default_gift:'mug'}};
const lines={home:"I wait by the door, even on weekends.",spot:"I took your side of the bed to keep it warm.",together:"Our walks are the best part of my day.",meaning:"I'm your shadow, and I like it that way."};
const c=run('enforce-compose.js', gc, {text: JSON.stringify({lines,recommended_gift:'mug',reason:'Walks start with coffee. So Kuku gets a spot in Sam\'s mug.',flags:[]})});
ok(JSON.stringify(c.lines)===JSON.stringify(lines),'compose keeps dog-voice lines with sentence starts');
// 22 Oct: home, spot and together print up to 60 characters; meaning stays at 44 (the ornament)
// built from this owner's own words: since 28 Oct a car they never mentioned is rejected
const long = "I bring the stick back to you every single time we go out.";
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
ok(L("Our walk is the one plan I never let us miss.") === "Our walk is the one plan I never let us miss.", 'one as a pronoun passes');
// 28 Oct (Krish): Buddy never names a food, toy, object or place the owner did not mention
const P = JSON.parse(fs.readFileSync('prompts.json', 'utf8'));
for (const k of ['typed', 'compose']) {
  ok(P[k].indexOf('(the one shoe') === -1 && P[k].indexOf('use only what the owner actually said') !== -1, k + ' prompt drops the example list of specifics');
  ok(P[k].indexOf('Never name a food, toy, object or place the owner did not mention; coffee does not mean food.') !== -1, k + ' prompt bans props the owner never mentioned');
  ok(P[k].indexOf('No exclamation marks.') !== -1 && !/at most one exclamation mark/i.test(P[k]), k + ' prompt allows no exclamation marks');
}
ok(P.typed.indexOf('Never offer Not sure or Something else as a chip; the page adds them.') !== -1, 'typed prompt leaves the non-answer chips to the page');
const answers = (o) => ['home', 'home_follow', 'spot', 'together', 'meaning'].map(id => ({ id, chip: (o[id] && o[id].chip) || null, label: '', typed: (o[id] && o[id].typed) || null }));
const coffee = {input:{dog:{name:'Ruby',tone:'Retriever'},recipient:{name:'Sam',relation:'partner'},answers:answers({home:{chip:'door'},home_follow:{chip:'weekdays'},spot:{chip:'couch'},together:{chip:'coffee'},meaning:{chip:'best'}}),current_lines:{home:"I'm at the door every weekday, waiting.",spot:'I keep your spot on the couch warm for you.',together:'You have your coffee and I wait for toast.',meaning:"You're my best friend, and I'm yours."},default_gift:'mug',note_tone:'warm'}};
const toastLines = {home:"I'm at the door every weekday, waiting.",spot:'I keep your spot on the couch warm for you.',together:'You have your coffee and I wait for toast.',meaning:'I wait for toast and for you, always.'};
const ct = run('enforce-compose.js', coffee, {text: JSON.stringify({lines: toastLines, recommended_gift:'mug', reason:'Ruby waits for toast while Sam has coffee, so the mug fits.', flags:[]})});
ok(ct.lines.meaning !== 'I wait for toast and for you, always.', 'compose rejects a meaning line with toast the owner never mentioned');
ok(ct.lines.meaning === coffee.input.current_lines.meaning, 'compose falls back to the draft meaning line when the draft passes');
ok(!Object.values(ct.lines).some(l => /toast/i.test(l)), 'compose prints no toast, not even from the draft line');
ok(Object.values(ct.lines).every(Boolean), 'compose still returns all four lines, so the page can use the note');
ok(ct.reason === '', 'compose drops a reason that invents toast');
ok(ct.lines.home === toastLines.home && ct.lines.spot === toastLines.spot, 'door and couch from the chips stay in the lines');
const cm = run('enforce-compose.js', coffee, {text: JSON.stringify({lines: Object.assign({}, toastLines, {together:'Coffee with you is my favorite part of the morning.', meaning:"You're my best friend, and I'm yours."}), recommended_gift:'mug', reason:"Ruby's mornings start with Sam and a coffee, so a mug fits.", flags:[]})});
ok(cm.lines.together === 'Coffee with you is my favorite part of the morning.' && cm.reason === "Ruby's mornings start with Sam and a coffee, so a mug fits.", 'the coffee chip grounds coffee, mug and morning');
const gt = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh21',step:'together',question:'What do Ruby and Sam do together?',typed_text:'coffee in bed on sundays',dog:{name:'Ruby',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
const croissant = run('enforce-typed.js', gt, {reaction:'Coffee in bed, and hopefully a croissant for Ruby.', lines:['Sunday coffee in bed is my favorite thing.'], follow_up:null, flags:[]});
ok(croissant.reaction === '', 'typed drops a reaction that invents a croissant');
ok(croissant.line === 'Sunday coffee in bed is my favorite thing.', 'typed keeps a line built from the coffee and bed the owner gave');
const gh = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh22',step:'home',question:'What does Ruby do when Sam comes home?',typed_text:'brings me her green squeaky hedgehog',dog:{name:'Ruby',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
const hedgehog = run('enforce-typed.js', gh, {reaction:'A green squeaky hedgehog is a very classy present.', lines:['I bring you my green hedgehog every time.'], follow_up:null, flags:[]});
ok(hedgehog.line === 'I bring you my green hedgehog every time.', 'positive control: a toy the owner named stays in the line');
ok(hedgehog.reaction === 'A green squeaky hedgehog is a very classy present.', 'positive control: a toy the owner named stays in the reaction');
// follow-up chips and replies follow the same rule; the non-answer chips are the page's own
const gf = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh23',step:'home',question:'What does Ruby do when Sam comes home?',typed_text:'brings me a toy and waits at the window',dog:{name:'Ruby',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
const fu = run('enforce-typed.js', gf, {reaction:'A toy and a window watch!', lines:['I bring you a toy and watch the window for you!'], follow_up:{question:'Ooh! Is it the same toy every time?', chips:['Always the same one!','A squeaky duck','Not sure'], lines:['I bring you the same toy, every single time.','I bring you my squeaky duck, every time.','I bring you something, I think.'], replies:['Love that!','A duck, how classic.','Fair enough.']}, flags:[]});
ok(fu.line === 'I bring you a toy and watch the window for you.', 'an exclamation mark in a line becomes a period, and the line is kept');
ok(![fu.reaction, fu.line, fu.follow_up && fu.follow_up.question].concat(fu.follow_up ? fu.follow_up.chips.concat(fu.follow_up.replies.filter(Boolean)) : []).some(t => /!/.test(t)), 'no exclamation mark in the reaction, line, question, chips or replies');
ok(!!fu.follow_up && JSON.stringify(fu.follow_up.chips) === JSON.stringify(['Always the same one.']), 'a chip with a duck the owner never mentioned is dropped, and so is Not sure');
ok(!!fu.follow_up && JSON.stringify(fu.follow_up.lines) === JSON.stringify(['I bring you the same toy, every single time.']) && JSON.stringify(fu.follow_up.replies) === JSON.stringify(['Love that.']), 'each dropped chip takes its line and reply with it');
const nu = run('enforce-typed.js', g, {reaction:'Every single time, now that is loyal.', lines:['I bring the stick back to you, every time.'], follow_up:{question:'Is it always the same stick?', chips:['Always the left','Depends on the day','Not sure'], lines:['I bring the same stick back, always.','I bring a stick back, depending on the day.','I bring the stick back to you.'], replies:['A creature of habit.','Keeps it fresh.','Fair enough.']}, flags:[]});
ok(!nu.follow_up.chips.includes('Not sure') && nu.follow_up.chips.length === 2 && nu.follow_up.lines.length === 2 && nu.follow_up.replies.length === 2, 'a Not sure chip from the model is dropped with its line and reply');
const nn = run('enforce-typed.js', g, {reaction:'Every single time, now that is loyal.', lines:['I bring the stick back to you, every time.'], follow_up:{question:'Is it always the same stick?', chips:['IDK', "Don't know.", 'Not sure he cares'], lines:[null,null,null], replies:[null,null,null]}, flags:[]});
ok(JSON.stringify(nn.follow_up.chips) === JSON.stringify(['Not sure he cares']), 'only exact non-answers are dropped; a real answer that starts with Not sure stays');
const ns = run('enforce-typed.js', g, {reaction:'Every single time, now that is loyal.', lines:['I bring the stick back to you, every time.'], follow_up:{question:'Is it always the same stick?', chips:['Something else','n/a','None.'], lines:[null,null,null], replies:[null,null,null]}, flags:[]});
ok(ns.follow_up === null, 'a follow-up made only of non-answers is dropped');
const rs = run('enforce-typed.js', gh, {reaction:'A green hedgehog, what a classic.', lines:['I bring you my green hedgehog every time.'], follow_up:{question:'Is it the same hedgehog every time?', chips:['Always the same one'], lines:['I bring you the same green hedgehog, always.'], replies:['The same hedgehog, and a treat after.']}, flags:[]});
ok(rs.follow_up.chips[0] === 'Always the same one' && rs.follow_up.lines[0] === 'I bring you the same green hedgehog, always.' && rs.follow_up.replies[0] === null, 'a reply that invents a treat is dropped; its chip and line stay');
// 28 Oct: a typed double exclamation mark never prints, whichever path the line takes
const gb = guard('guard-typed.js',{headers:{origin:'https://heartside.io'},body:{session:'abcdefgh24',step:'meaning',question:'What is Ruby to Sam?',typed_text:'my best friend!! forever',dog:{name:'Ruby',pronoun:'she'},recipient:{name:'Sam',relation:'partner'}}});
const bf = run('enforce-typed.js', gb, {error:'timeout'});
ok(!/!|\.\./.test(bf.line) && bf.line === 'My best friend. Forever.', 'the own-words fallback turns a typed double exclamation mark into one period');
const bang = JSON.parse(JSON.stringify(coffee)); bang.input.current_lines.meaning = 'My best friend!! forever.';
const cb = run('enforce-compose.js', bang, {text: JSON.stringify({lines: Object.assign({}, toastLines, {meaning:"You're my best friend, and I'd pick you again and again."}), recommended_gift:'mug', reason:'', flags:[]})});
ok(cb.lines.meaning === 'My best friend. Forever.', 'compose cleans the draft line it falls back to');
const ce = run('enforce-compose.js', bang, {error:'timeout'});
ok(ce.source === 'fallback' && !Object.values(ce.lines).some(l => /!|\.\.|toast/i.test(l)) && Object.values(ce.lines).every(Boolean), 'compose with no model answer returns four clean lines and no toast');
const grief = JSON.parse(JSON.stringify(bang)); grief.input.answers[4].typed = 'he passed away last year';
const cg = run('enforce-compose.js', grief, {text: JSON.stringify({lines: toastLines, recommended_gift:'mug', reason:'x', flags:[]})});
ok(cg.flags.includes('grief') && cg.lines.meaning === 'My best friend. Forever.' && !/toast/i.test(cg.lines.together), 'a grief note keeps the clean drafts and still prints no toast');
// the page's own chip drafts pass for their chip, so the guard does not make the copy duller
const drafts = [
  ['home', 'door', 'home_follow', 'weekends', 'I wait by the door for you, weekends too.'],
  ['home', 'door', 'home_follow', 'hears', 'I hear your car long before anyone else.'],
  ['home', 'toy', 'home_follow', 'same', "I bring you the same toy, because it's ours."],
  ['home', 'toy', 'home_follow', 'shoe', 'I bring you a shoe so you know I missed you.'],
  ['spot', 'feet', null, null, 'Your feet make the best pillow I know.'],
  ['spot', 'bed', null, null, 'I took your side of the bed to keep it warm.'],
  ['spot', 'couch', null, null, 'I keep your spot on the couch warm for you.'],
  ['together', 'car', null, null, "Any car ride is a good one if you're in it."],
  ['together', 'movie', null, null, 'Movie night is better with me beside you.'],
  ['meaning', 'boss', null, null, 'I run this house, but I love you most.']
];
for (const [key, chip, key2, chip2, line] of drafts) {
  const o = {}; o[key] = { chip }; if (key2) o[key2] = { chip: chip2 };
  const d = {input:{dog:{name:'Ruby'},recipient:{name:'Sam',relation:'partner'},answers:answers(o),current_lines:{home:'I wait for you.',spot:"I'm never far from you.",together:'Any time with you is my favorite time.',meaning:"I'm yours, always."},default_gift:'mug'}};
  const lines2 = Object.assign({}, d.input.current_lines); lines2[key] = line;
  ok(run('enforce-compose.js', d, {text: JSON.stringify({lines: lines2, recommended_gift:'mug', reason:'', flags:[]})}).lines[key] === line, 'the ' + (chip2 || chip) + ' chip grounds its own draft: ' + line);
}
console.log(fails?fails+' failed':'all passed');
process.exitCode = fails ? 1 : 0;
