
const ALLOWED = ["https://heartside.io","https://www.heartside.io","https://bnf1em-ge.myshopify.com"];
const LIMIT_SESSION = 8;
const LIMIT_IP = 60;
const req = $input.first().json;
const h = req.headers || {};
const origin = String(h.origin || '').toLowerCase().replace(/\/$/, '');
const b = (req.body && typeof req.body === 'object') ? req.body : {};
const ip = String(h['cf-connecting-ip'] || h['x-real-ip'] || String(h['x-forwarded-for'] || '').split(',')[0] || 'unknown').trim();
const session = String(b.session || '');
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
let reject = '';
if (ALLOWED.indexOf(origin) === -1) reject = 'origin';
else if (!/^[A-Za-z0-9_-]{8,64}$/.test(session)) reject = 'session';
const sd = $getWorkflowStaticData('global');
const now = Date.now();
if (!sd.win || now - sd.win > 3600e3) { sd.win = now; sd.ip = {}; sd.s = {}; }
if (!reject) {
  sd.s[session] = (sd.s[session] || 0) + 1;
  sd.ip[ip] = (sd.ip[ip] || 0) + 1;
  if (sd.s[session] > LIMIT_SESSION || sd.ip[ip] > LIMIT_IP) reject = 'limit';
}
const dog = { name: str(b.dog && b.dog.name, 14), pronoun: (b.dog && b.dog.pronoun) === 'he' ? 'he' : 'she' };
const recipient = { name: str(b.recipient && b.recipient.name, 14), relation: str(b.recipient && b.recipient.relation, 20) };

const STEPS = ['home', 'home_follow', 'spot', 'together', 'meaning'];
const input = {
  step: STEPS.indexOf(b.step) === -1 ? 'home' : b.step,
  question: str(b.question, 200),
  typed_text: str(b.typed_text, 140),
  previous_line: str(b.previous_line, 60),
  dog: dog, recipient: recipient
};
if (!reject && !input.typed_text) reject = 'empty';

return [{ json: { reject: reject, input: input, prompt: JSON.stringify(input) } }];
