
const ALLOWED = ["https://heartside.io","https://www.heartside.io","https://bnf1em-ge.myshopify.com"];
const LIMIT_SESSION = 5;
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
// The hourly limits are counted in the "Heartside AI admission" data table, not static data: n8n saves
// static data at the end of a run, so parallel runs overwrote each other and a burst of ten got past a
// limit of five (29 Oct). Each allowed call appends a row, then counts its keys; that can over-count
// under a race, never over-admit. The IP is kept only as a hash, for two hours.
const hour = Math.floor(Date.now() / 3600e3);
let hash = 2166136261;
for (const ch of 'heartside|' + ip) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619) >>> 0; }
const skey = "compose" + '|' + hour + '|' + session;
const ikey = "compose" + '|' + hour + '|' + hash.toString(36);
const TONES = ["Companion Velcro","Doodle Wildcard","Guardian","Herding Manager","Retriever","Scent Detective","Sighthound Sofa Missile","Spitz Commentator","Terrier Menace","Working Goofball"];
// no pronoun tapped arrives as they, and anything unknown reads they too, never a guessed she (28 Oct)
const pro = String((b.dog && b.dog.pronoun) || '');
const dog = { name: str(b.dog && b.dog.name, 14), pronoun: pro === 'he' || pro === 'she' ? pro : 'they' };
const breed = str(b.dog && b.dog.breed, 40), tone = String((b.dog && b.dog.tone) || '');
if (breed) dog.breed = breed;
if (TONES.indexOf(tone) !== -1) dog.tone = tone;
const recipient = { name: str(b.recipient && b.recipient.name, 14), relation: str(b.recipient && b.recipient.relation, 20) };

const KEYS = ['home', 'spot', 'together', 'meaning'];
const answers = (Array.isArray(b.answers) ? b.answers : []).slice(0, 8).map(a => ({
  id: str(a && a.id, 20), chip: str(a && a.chip, 30) || null, label: str(a && a.label, 60), typed: str(a && a.typed, 140) || null
}));
const current_lines = {};
KEYS.forEach(k => { current_lines[k] = str(b.current_lines && b.current_lines[k], 60); });
const GIFTS = ['mug', 'blanket', 'print', 'ornament'];
const NOTE_TONES = ['sentimental', 'warm', 'hilarious'];
const input = { dog: dog, recipient: recipient, answers: answers, current_lines: current_lines,
  default_gift: GIFTS.indexOf(b.default_gift) === -1 ? 'mug' : b.default_gift,
  note_tone: NOTE_TONES.indexOf(b.note_tone) === -1 ? 'warm' : b.note_tone };

return [{ json: { reject: reject, input: input, prompt: JSON.stringify(input), skey: skey, ikey: ikey, limits: { session: LIMIT_SESSION, ip: LIMIT_IP } } }];
