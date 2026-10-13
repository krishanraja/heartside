
const ALLOWED = ["https://heartside.io","https://www.heartside.io","https://bnf1em-ge.myshopify.com"];
const LIMIT_SESSION = 3;
const LIMIT_IP = 20;
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

const KEYS = ['home', 'spot', 'together', 'meaning'];
const answers = (Array.isArray(b.answers) ? b.answers : []).slice(0, 8).map(a => ({
  id: str(a && a.id, 20), chip: str(a && a.chip, 30) || null, label: str(a && a.label, 60), typed: str(a && a.typed, 140) || null
}));
const current_lines = {};
KEYS.forEach(k => { current_lines[k] = str(b.current_lines && b.current_lines[k], 60); });
const GIFTS = ['mug', 'blanket', 'print', 'ornament'];
const input = { dog: dog, recipient: recipient, answers: answers, current_lines: current_lines,
  default_gift: GIFTS.indexOf(b.default_gift) === -1 ? 'mug' : b.default_gift };

return [{ json: { reject: reject, input: input, prompt: JSON.stringify(input) } }];
