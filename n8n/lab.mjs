// The voice lab: a manual-only n8n workflow that runs real owner answers through the current system
// prompts (prompts.json, written by build.mjs) on one or more Gemini models, so a prompt or model
// change is judged on real output before the live webhooks change (Krish, 22 Oct: "robotic,
// humourless and affectionless"). It has no webhook and is never published.
//
//   node build.mjs && node lab.mjs > lab-workflow.js   then create it in n8n and run it manually
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const P = JSON.parse(fs.readFileSync(dir + 'prompts.json', 'utf8'));
// Krish, 22 Oct: "ChatGPT has a much better way of speaking ... Should we use that?" So the lab runs
// the same prompt on Gemini, OpenAI and Anthropic models, on held-out dogs that never appear in the
// prompt's examples, so no model can score by copying one.
const MODELS = (process.env.HS_LAB_MODELS || 'gemini:models/gemini-3.1-flash-lite,gemini:models/gemini-3.5-flash,openai:chat-latest,openai:gpt-5.4-mini,anthropic:claude-haiku-5-5,anthropic:claude-sonnet-5-5').split(',').map(m => { const [provider, ...id] = m.split(':'); return { provider, model: id.join(':') }; });
const dog = (name, he, breed, tone) => ({ name, pronoun: he ? 'he' : 'she', ...(breed ? { breed, tone } : {}) });
const Q = { home: d => `What does ${d} do when %R comes home?`, spot: d => `Where's ${d}'s spot when %R's around?`, together: d => `What do ${d} and %R do together?`, meaning: d => `Last one. What is ${d} to %R?` };
const TYPED = [
  ['home', 'she brings me one shoe, never the pair', dog('Juniper', 0, 'Golden Retriever', 'Retriever'), { name: 'Maya', relation: 'mom' }],
  ['home', 'spins three circles and then flops on his back', dog('Otis', 1, 'French Bulldog', 'Companion Velcro'), { name: 'Sam', relation: 'partner' }],
  ['home', "acts like I've been gone a year, even after 5 minutes", dog('Bean', 1, 'Chihuahua', 'Companion Velcro'), { name: 'Luis', relation: 'partner' }],
  ['spot', 'on my feet under the desk while I work', dog('Nori', 0, 'Shiba Inu', 'Spitz Commentator'), { name: 'Ken', relation: 'partner' }],
  ['spot', 'she sleeps on my pillow and pushes me off it', dog('Lulu', 0, 'Cavapoo', 'Doodle Wildcard'), { name: 'Ana', relation: 'partner' }],
  ['together', 'car rides with the window down, he bites the wind', dog('Rocket', 1, 'Australian Shepherd', 'Herding Manager'), { name: 'Dev', relation: 'dad' }],
  ['together', 'Saturday pancakes, she always gets the first one', dog('Daisy', 0), { name: 'Rose', relation: 'grandma' }],
  ['together', 'we watch baking shows and he groans when they lose', dog('Waffles', 1, 'Basset Hound', 'Scent Detective'), { name: 'Jen', relation: 'partner' }],
  ['meaning', 'he got me through my first year of college', dog('Gus', 1, 'Labrador Retriever', 'Retriever'), { name: 'Ellie', relation: 'daughter' }],
  ['meaning', "she's the boss of the house and we all know it", dog('Pepper', 0, 'Jack Russell Terrier', 'Terrier Menace'), { name: 'Chris', relation: 'partner' }]
];
const COMPOSE = [{
  dog: dog('Juniper', 0, 'Golden Retriever', 'Retriever'), recipient: { name: 'Maya', relation: 'mom' },
  answers: [{ id: 'home', chip: null, label: '', typed: 'brings me one shoe, never the pair' }, { id: 'spot', chip: 'couch', label: '', typed: null }, { id: 'together', chip: null, label: '', typed: 'long walks by the lake, she swims after ducks she will never catch' }, { id: 'meaning', chip: 'best', label: '', typed: null }],
  current_lines: { home: 'One shoe. Never the pair.', spot: 'I keep your couch spot warm.', together: 'Long walks by the lake, she swims after ducks.', meaning: "You're my best friend." }, default_gift: 'mug'
}, {
  dog: dog('Rocket', 1, 'Australian Shepherd', 'Herding Manager'), recipient: { name: 'Dev', relation: 'dad' },
  answers: [{ id: 'home', chip: 'door', label: '', typed: null }, { id: 'spot', chip: null, label: '', typed: 'in the passenger seat even when the car is parked' }, { id: 'together', chip: null, label: '', typed: 'car rides with the window down, he bites the wind' }, { id: 'meaning', chip: null, label: '', typed: 'the reason I go outside every day' }],
  current_lines: { home: 'I wait by the door for you.', spot: 'In the passenger seat even when parked.', together: 'Car rides with the window down.', meaning: 'The reason you go outside every day.' }, default_gift: 'print'
}];
const body = (provider, model, sys, prompt) => provider === 'openai'
  ? { model, messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }], response_format: { type: 'json_object' }, max_completion_tokens: 1500, ...(model.includes('mini') ? { reasoning_effort: 'none' } : {}) }
  : provider === 'anthropic'
    ? { model, max_tokens: 2000, thinking: { type: model.includes('haiku') ? 'disabled' : 'between_tools' }, system: sys, messages: [{ role: 'user', content: prompt + '\n\nReply with the JSON object only.' }] }
    : null;
const cases = [];
TYPED.forEach(([step, typed_text, d, recipient], i) => cases.push({ kind: 'typed', case: i, prompt: JSON.stringify({ step, question: Q[step](d.name).replace('%R', recipient.name), typed_text, previous_line: '', dog: d, recipient }) }));
COMPOSE.forEach((c, i) => cases.push({ kind: 'compose', case: i, prompt: JSON.stringify(c) }));
const casesNode = (provider, name) => `node({ type: 'n8n-nodes-base.code', version: 2, config: { name: '${name}', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${JSON.stringify("const P = $('Prompts').first().json;\nconst body = " + body.toString() + ';\nconst provider = ' + JSON.stringify(provider) + ';\nreturn ' + JSON.stringify(MODELS.filter(m => m.provider === provider).map(m => m.model)) + '.flatMap(model => P.cases.map(c => ({ json: { provider, model, ...c, sys: P[c.kind], body: body(provider, model, P[c.kind], c.prompt) } })));')} } } })`;
const tagNode = (name, from, extract) => `node({ type: 'n8n-nodes-base.code', version: 2, config: { name: '${name}', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${JSON.stringify(`const src = $('${from}').all();\nconst text = j => { try { return ${extract}; } catch (e) { return ''; } };\nreturn $input.all().map((it, i) => ({ json: { model: src[i].json.model, kind: src[i].json.kind, case: src[i].json.case, text: text(it.json) || JSON.stringify(it.json).slice(0, 400) } }));`)} } } })`;
const http = (name, url, credType, cred, headers) => `node({ type: 'n8n-nodes-base.httpRequest', version: 4.2, config: { name: '${name}', onError: 'continueRegularOutput', parameters: { method: 'POST', url: '${url}', authentication: 'predefinedCredentialType', nodeCredentialType: '${credType}', ${headers ? `sendHeaders: true, headerParameters: { parameters: ${JSON.stringify(headers)} }, ` : ''}sendBody: true, specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.body) }}'), options: { timeout: 60000, batching: { batch: { batchSize: 1, batchInterval: 0 } } } }, credentials: { ${credType}: ${JSON.stringify(cred)} } } })`;
const code = `import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';
const start = trigger({ type: 'n8n-nodes-base.manualTrigger', version: 1, config: { name: 'Run the lab' } });
const prompts = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Prompts', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: ${JSON.stringify('return [{ json: ' + JSON.stringify({ typed: P.typed, compose: P.compose, cases }) + ' }];')} } } });
const casesG = ${casesNode('gemini', 'Cases Gemini')};
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
const tagG = ${tagNode('Out Gemini', 'Cases Gemini', 'j.content.parts.map(p => p.text).join("")')};
const casesO = ${casesNode('openai', 'Cases OpenAI')};
const openai = ${http('OpenAI', 'https://api.openai.com/v1/chat/completions', 'openAiApi', { id: 'hHjEG4Lz57JxBiOs', name: 'OpenAI account' })};
const tagO = ${tagNode('Out OpenAI', 'Cases OpenAI', 'j.choices[0].message.content')};
const casesA = ${casesNode('anthropic', 'Cases Anthropic')};
const anthropic = ${http('Anthropic', 'https://api.anthropic.com/v1/messages', 'anthropicApi', { id: 'NqmXYF7Q7sJg5Iog', name: 'Anthropic account' }, [{ name: 'anthropic-version', value: '2023-06-01' }])};
const tagA = ${tagNode('Out Anthropic', 'Cases Anthropic', 'j.content.filter(c => c.type === "text").map(c => c.text).join("")')};
export default workflow('heartside-voice-lab', 'Heartside: voice lab (manual test only, never published)')
  .add(start).to(prompts).to(casesG).to(gemini).to(tagG)
  .add(prompts).to(casesO).to(openai).to(tagO)
  .add(prompts).to(casesA).to(anthropic).to(tagA);
`;
process.stdout.write(code);
