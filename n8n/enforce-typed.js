// Shared rule helpers, pasted into both Enforce nodes (section 5.3: never trust the model).
const BANNED = /\b(elevate[sd]?|elevating|unleash(ed|es|ing)?|must-haves?|game-?changers?|fur ?bab(y|ies))\b/i;
const FIRST_PERSON = /(^|[^A-Za-z'])(I|I'm|I've|I'd|I'll|me|my|mine|myself)(?=$|[^A-Za-z'])/;
const NUMWORDS = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|noon|midnight|o'clock|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/i;
const GRIEF = /\b(died|dead|death|dying|passed away|passed on|put down|put to sleep|rainbow bridge|cancer|tumou?r|terminal|euthani[sz]|funeral|lost (him|her|them)|miss (him|her|them) so|in heaven|rip\b)/i;
const PROFANE = /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick\w*|cock\w*|piss\w*|asshole\w*|bastard\w*|whore\w*|slut\w*|nigg\w*|fag\w*|retard\w*)/i;
const FLAGS = ['grief', 'profanity', 'person_described', 'unclear'];

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
    if (/\d/.test(bare) || (NUMWORDS.test(bare) && !/^(may|am)$/i.test(bare))) { if (h.indexOf(bare.toLowerCase()) === -1) return false; continue; }
    if (/^[A-Z]/.test(bare) && !start && !OK.test(bare) && h.indexOf(bare.toLowerCase()) === -1) return false;
  }
  return true;
}
function okLine(s, hay) { return okText(s, 44) && !FIRST_PERSON.test(s) && grounded(s, hay); }
// the buyer's own trimmed words, as a gift line
function ownWords(t) {
  t = clean(t).replace(/[.!?]+$/, '');
  if (t.length > 43) t = t.slice(0, 43).replace(/[\s,]+\S*$/, '').replace(/(\s+(the|a|an|and|or|but|of|to|in|on|at|by|for|from|with|near|under|over|into|onto|is|was|my|your|our|his|her|their))+$/i, '');
  if (!t) return '';
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
const m = findJson(raw, 'reaction') || findJson(raw, 'line') || {};
const hay = [inp.typed_text, inp.previous_line, inp.dog.name, inp.recipient.name, inp.recipient.relation, inp.question].join(' ');
let flags = (Array.isArray(m.flags) ? m.flags : []).filter(f => FLAGS.indexOf(f) !== -1);
if (GRIEF.test(inp.typed_text) && flags.indexOf('grief') === -1) flags.push('grief');
if (PROFANE.test(inp.typed_text) && flags.indexOf('profanity') === -1) flags.push('profanity');
const ai = !!(m.reaction || m.line);
let out;
if (flags.some(f => f === 'grief' || f === 'profanity' || f === 'unclear')) {
  out = { reaction: "I didn't quite catch that one. Try again, or pick one of these?", line: '', follow_up: null, flags: flags };
} else {
  const reaction = clean(m.reaction);
  const line = clean(m.line);
  let fu = null;
  if (m.follow_up && typeof m.follow_up === 'object' && inp.step === 'home') {
    const q = clean(m.follow_up.question);
    const arr = (k) => (Array.isArray(m.follow_up[k]) ? m.follow_up[k] : []);
    // each chip keeps its own refined line and reply, so a chip tap needs no second call
    const f = { question: q, chips: [], lines: [], replies: [] };
    arr('chips').slice(0, 3).forEach((c, i) => {
      c = clean(c);
      if (!okText(c, 24)) return;
      const l = clean(arr('lines')[i]), r = clean(arr('replies')[i]);
      f.chips.push(c);
      f.lines.push(okLine(l, hay + ' ' + c) ? l : null);
      f.replies.push(okText(r, 50) ? r : null);
    });
    if (okText(q, 70) && f.chips.length) fu = f;
  }
  const goodLine = okLine(line, hay) ? line : (ownWords(inp.typed_text) || inp.previous_line);
  out = {
    reaction: okText(reaction, 70) ? reaction : 'Tell me more?',
    line: goodLine,
    follow_up: ai ? fu : (inp.step === 'home' ? { question: 'Tell me more?', chips: [] } : null),
    flags: flags
  };
}
out.source = ai ? 'ai' : 'fallback';
return [{ json: out }];
