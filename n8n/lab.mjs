// The voice lab: a manual-only n8n workflow that runs real owner answers through the current system
// prompts (prompts.json, written by build.mjs) on one or more Gemini models, so a prompt or model
// change is judged on real output before the live webhooks change (Krish, 22 Oct: "robotic,
// humourless and affectionless"). It has no webhook and is never published.
//
//   node build.mjs && node lab.mjs > lab-workflow.js   then create it in n8n and run it manually
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const P = JSON.parse(fs.readFileSync(dir + 'prompts.json', 'utf8'));
const MODELS = (process.env.HS_LAB_MODELS || P.model).split(',');
const dog = (name, he, breed, tone) => ({ name, pronoun: he ? 'he' : 'she', ...(breed ? { breed, tone } : {}) });
const TYPED = [
  ['meaning', 'Last one. What is Mowgli to KJ?', 'Always ready to run, walk and fetch. Not interested in any other dogs.', dog('Mowgli', 1, 'Border Collie', 'Herding Manager'), { name: 'KJ', relation: 'dad' }],
  ['home', 'What does Mowgli do when KJ comes home?', 'he brings the stick back every single time', dog('Mowgli', 1, 'Border Collie', 'Herding Manager'), { name: 'KJ', relation: 'dad' }],
  ['home', 'What does Kuku do when Sam comes home?', 'she sits in the window from 5pm', dog('Kuku', 0), { name: 'Sam', relation: 'partner' }],
  ['spot', "Where's Pip's spot when Ana's around?", 'squeezes between us on the sofa and steals the blanket', dog('Pip', 1, 'Pug', 'Companion Velcro'), { name: 'Ana', relation: 'partner' }],
  ['together', 'What do Biscotti and Linda do together?', 'beach every Sunday, he steals other peoples tennis balls', dog('Biscotti', 1, 'Labrador Retriever', 'Retriever'), { name: 'Linda', relation: 'mom' }],
  ['meaning', 'What is Moose to Jo?', 'understands every word, pretends he doesnt', dog('Moose', 1), { name: 'Jo', relation: 'partner' }],
  ['home', 'What does Bea do when Tom comes home?', 'howls until he sits down', dog('Bea', 0, 'Beagle', 'Scent Detective'), { name: 'Tom', relation: 'partner' }],
  ['together', 'What do Olive and Priya do together?', 'morning coffee, she waits for the crust of my toast', dog('Olive', 0, 'Whippet', 'Sighthound Sofa Missile'), { name: 'Priya', relation: 'partner' }]
];
const COMPOSE = [{
  dog: dog('Mowgli', 1, 'Border Collie', 'Herding Manager'), recipient: { name: 'KJ', relation: 'dad' },
  answers: [{ id: 'home', chip: 'door', label: '', typed: null }, { id: 'home_follow', chip: 'weekends', label: '', typed: null }, { id: 'spot', chip: 'couch', label: '', typed: null }, { id: 'together', chip: 'walk', label: '', typed: null }, { id: 'meaning', chip: null, label: '', typed: 'Always ready to run, walk and fetch. Not interested in any other dogs.' }],
  current_lines: { home: 'I wait by the door. Weekends too. Obviously.', spot: 'I guard your couch spot. Nobody gets it.', together: 'Our walks are the best part of my day.', meaning: 'Always ready to run, walk and fetch.' }, default_gift: 'mug'
}, {
  dog: dog('Olive', 0, 'Whippet', 'Sighthound Sofa Missile'), recipient: { name: 'Priya', relation: 'partner' },
  answers: [{ id: 'home', chip: null, label: '', typed: 'zooms around the kitchen island three times' }, { id: 'spot', chip: 'bed', label: '', typed: null }, { id: 'together', chip: null, label: '', typed: 'morning coffee, she waits for the crust of my toast' }, { id: 'meaning', chip: 'best', label: '', typed: null }],
  current_lines: { home: 'Zooms around the kitchen island three times.', spot: 'I took your side of the bed. Not sorry.', together: 'Morning coffee, she waits for the crust.', meaning: "You're my best friend. Not even close." }, default_gift: 'mug'
}];
const items = [];
for (const model of MODELS) {
  TYPED.forEach(([step, question, typed_text, d, recipient], i) => items.push({ model, kind: 'typed', case: i, prompt: JSON.stringify({ step, question, typed_text, previous_line: '', dog: d, recipient }) }));
  COMPOSE.forEach((c, i) => items.push({ model, kind: 'compose', case: i, prompt: JSON.stringify(c) }));
}
const code = `import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';
const start = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Run the lab' } });
const cases = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Cases', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${JSON.stringify('const SYS = ' + JSON.stringify({ typed: P.typed, compose: P.compose }) + ';\nreturn ' + JSON.stringify(items) + '.map(j => ({ json: { ...j, sys: SYS[j.kind] } }));')} } } });
const gemini = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini', version: 1.2,
  config: {
    name: 'Gemini', onError: 'continueRegularOutput',
    parameters: {
      resource: 'text', operation: 'message',
      modelId: { __rl: true, mode: 'id', value: expr('{{ $json.model }}') },
      messages: { values: [{ content: expr('{{ $json.prompt }}'), role: 'user' }] },
      simplify: true, jsonOutput: true,
      options: { systemMessage: expr('{{ $json.sys }}'), maxOutputTokens: 900, temperature: 0.9, thinkingBudget: 0 }
    },
    credentials: { googlePalmApi: { id: 'LtlmaVHoTQdTTngQ', name: 'Google Gemini(PaLM) - Heartside' } }
  }
});
const collect = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Collect', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${JSON.stringify("const src = $('Cases').all();\nreturn $input.all().map((it, i) => ({ json: { model: src[i].json.model, kind: src[i].json.kind, case: src[i].json.case, out: JSON.stringify(it.json).slice(0, 1500) } }));")} } } });
export default workflow('heartside-voice-lab', 'Heartside: voice lab (manual test only, never published)').add(start).to(cases).to(gemini).to(collect);
`;
process.stdout.write(code);
