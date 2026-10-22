// Shared rule helpers, pasted into both Enforce nodes (section 5.3: never trust the model).
const BANNED = /\b(elevate[sd]?|elevating|unleash(ed|es|ing)?|must-haves?|game-?changers?|fur ?bab(y|ies))\b/i;
const FIRST_PERSON = /(^|[^A-Za-z'])(I|I'm|I've|I'd|I'll|me|my|mine|myself)(?=$|[^A-Za-z'])/;
const NUMWORDS = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|noon|midnight|o'clock|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/i;
const GRIEF = /\b(died|dead|death|dying|passed away|passed on|put down|put to sleep|rainbow bridge|cancer|tumou?r|terminal|euthani[sz]|funeral|lost (him|her|them)|miss (him|her|them) so|in heaven|rip\b)/i;
const PROFANE = /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick\w*|cock\w*|piss\w*|asshole\w*|bastard\w*|whore\w*|slut\w*|nigg\w*|fag\w*|retard\w*)/i;
const FLAGS = ['grief', 'profanity', 'person_described', 'unclear'];
// Biscuit talks to the buyer; only gift lines may say you (to the person)
// Gift lines are the dog talking (Krish, 20 Oct): I is the dog, so he, she or the dog's name is the wrong voice
const THIRD = /(^|[^A-Za-z'])(he|she|him|his|her|hers|he's|she's)(?=$|[^A-Za-z'])/i;
// Biscuit's reaction slipping into an HR review (22 Oct: "Mowgli is a focused teammate for KJ.")
const STIFF = /\b(teammate|focused|efficient|manager|managers|professional|productivity|ready for action|in action)\b/i;
const YOU = /(^|[^A-Za-z'])(you|your|yours|you're|you've|you'll|you'd)(?=$|[^A-Za-z'])/i;

function clean(s) {
  return String(s == null ? '' : s)
    .replace(/[—–]/g, ', ')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();
}
function okText(s, max) { return !!s && s.length <= max && !BANNED.test(s); }
// every number, time, place and name in an output line must appear in the buyer's input
function grounded(line, hay) {
  const h = String(hay || '').toLowerCase();
  const words = line.match(/[A-Za-z0-9][A-Za-z0-9':.-]*/g) || [];
  return words.every(function (w, i) {
    const bare = w.replace(/[.:']+$/, '').replace(/'s$/i, '');
    if (!bare) return true;
    if (/\d/.test(bare) || (NUMWORDS.test(bare) && !/^(may|am)$/i.test(bare))) return h.indexOf(bare.toLowerCase()) !== -1;
    if (i > 0 && /^[A-Z]/.test(bare) && bare !== 'Love') return h.indexOf(bare.toLowerCase()) !== -1;
    return true;
  });
}
// Biscuit's reason may say I and start sentences; its names and numbers still come from the input
function groundedProse(text, hay) {
  const h = String(hay || '').toLowerCase();
  const OK = /^(I|I'm|I'd|I've|Biscuit|Heartside|The|Morning|Mug|Couch|Blanket|Framed|Print|Tree|Ornament|December|Christmas|Love)$/;
  const re = /[A-Za-z0-9][A-Za-z0-9':-]*/g;
  let mm;
  while ((mm = re.exec(text))) {
    const bare = mm[0].replace(/[:']+$/, '').replace(/'s$/i, '');
    const before = text.slice(0, mm.index).trim();
    const start = !before || /[.!?]$/.test(before);
    // "one" is a pronoun far more often than a count ("the one plan", "no one"), so only two and up are checked (22 Oct)
    if (/\d/.test(bare) || (NUMWORDS.test(bare) && !/^(may|am|one)$/i.test(bare))) { if (h.indexOf(bare.toLowerCase()) === -1) return false; continue; }
    if (/^[A-Z]/.test(bare) && !start && !OK.test(bare) && h.indexOf(bare.toLowerCase()) === -1) return false;
  }
  return true;
}
// a gift line: the dog's own words to the person, a sentence may start anywhere, no shouting
// Krish, 22 Oct: "two-word sentences stacked against two- or three-word sentences are just a clear tell".
// A line is one natural sentence: reject stacked fragments and the worn lines every model reaches for.
const WORN = /\b(you're welcome|it isn't close|not even close|not sorry|obviously|that's the (deal|rule|list|plan)|the whole list|in this economy)\b/i;
function staccato(s) {
  const parts = s.split(/[.?;:]+/).map(x => x.trim()).filter(Boolean);
  return parts.length > 2 || (parts.length === 2 && parts.some(x => x.split(/\s+/).length <= 3));
}
// Krish, 22 Oct: lines print up to 60 characters; the meaning line stays at 44 because the ornament prints it alone.
const MAX_LINE = { home: 60, home_follow: 60, spot: 60, together: 60, meaning: 44 };
function okLine(s, hay, max) { return okText(s, max || 44) && !THIRD.test(s) && s.indexOf('!') === -1 && !staccato(s) && !WORN.test(s) && groundedProse(s, hay); }
// the buyer's own words, as a gift line, cut only where a sentence or clause ends (22 Oct: a cut at
// 43 characters printed "Always ready to run, walk and fetch. Not.")
function ownWords(t, max) {
  const cap = (max || 44) - 1;
  t = clean(t).replace(/[.!?]+$/, '');
  if (!t) return '';
  if (t.length > cap) {
    // whole sentences first; only a first sentence that is too long is cut at a clause
    const fit = (parts, join) => { let out = ''; for (const p of parts) { const next = out ? out + join + p : p; if (next.length > cap) break; out = next; } return out; };
    const sentences = t.split(/(?<=[.!?;])\s+/).map(x => x.replace(/[.!?;]+$/, ''));
    t = fit(sentences, '. ') || fit(sentences[0].split(/,\s+/), ', ');
    if (t.length < 12) return '';
  }
  return t.charAt(0).toUpperCase() + t.slice(1) + '.';
}
// the model's JSON, wherever the node put it
function findJson(o, key, depth) {
  depth = depth || 0;
  if (o == null || depth > 6) return null;
  if (typeof o === 'string') {
    const s = o.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    if (s.charAt(0) !== '{') return null;
    try { return findJson(JSON.parse(s), key, depth + 1); } catch (e) { return null; }
  }
  if (typeof o !== 'object') return null;
  if (!Array.isArray(o) && key in o) return o;
  const vals = Array.isArray(o) ? o : Object.keys(o).map(function (k) { return o[k]; });
  for (let i = 0; i < vals.length; i++) { const r = findJson(vals[i], key, depth + 1); if (r) return r; }
  return null;
}

const g = $('Guard').first().json;
const inp = g.input;
const raw = $input.first().json;
const m = findJson(raw, 'lines') || {};
const KEYS = ['home', 'spot', 'together', 'meaning'];
const GIFTS = ['mug', 'blanket', 'print', 'ornament'];
const typed = inp.answers.map(a => a.typed || '').join(' ');
const hay = [typed, inp.answers.map(a => a.label).join(' '), KEYS.map(k => inp.current_lines[k]).join(' '), inp.dog.name, inp.recipient.name, inp.recipient.relation].join(' ');
// gift lines speak to the person as you, so their name never appears in one
// and the dog is I, so its own name never appears in one either
const hasName = (t, nm) => !!nm && !!nm.replace(/[^A-Za-z]/g, '') && new RegExp('(^|[^A-Za-z])' + nm.replace(/[^A-Za-z]/g, '') + '(?=$|[^A-Za-z])', 'i').test(t);
const named = (t) => hasName(t, inp.recipient.name) || hasName(t, inp.dog.name);
let flags = (Array.isArray(m.flags) ? m.flags : []).filter(f => FLAGS.indexOf(f) !== -1);
if (GRIEF.test(typed) && flags.indexOf('grief') === -1) flags.push('grief');
if (PROFANE.test(typed) && flags.indexOf('profanity') === -1) flags.push('profanity');
const blocked = flags.some(f => f === 'grief' || f === 'profanity');
const lines = {}, alternates = {}, sources = {};
KEYS.forEach(k => {
  const cur = inp.current_lines[k];
  const l = clean(m.lines && m.lines[k]);
  const alts = (m.alternates && Array.isArray(m.alternates[k]) ? m.alternates[k] : []).map(clean).filter(a => okLine(a, hay, MAX_LINE[k]) && !named(a)).slice(0, 2);
  // the first line that passes, then its alternates, then the draft the buyer saw (22 Oct)
  lines[k] = blocked ? cur : ((okLine(l, hay, MAX_LINE[k]) && !named(l)) ? l : (alts[0] || cur));
  if (alts.length && !blocked) alternates[k] = alts;
  const src = m.sources && Array.isArray(m.sources[k]) ? m.sources[k].map(String).filter(s => /^[a-z_]{2,20}$/.test(s)).slice(0, 4) : [];
  if (src.length) sources[k] = src;
});
const reason = clean(m.reason);
const out = {
  lines: lines,
  alternates: alternates,
  recommended_gift: GIFTS.indexOf(m.recommended_gift) !== -1 ? m.recommended_gift : inp.default_gift,
  reason: (!blocked && okText(reason, 140) && groundedProse(reason, hay) && !YOU.test(reason)) ? reason : '',
  sources: sources,
  flags: flags,
  source: m.lines ? 'ai' : 'fallback'
};
return [{ json: out }];
