// Shared rule helpers, pasted into both Enforce nodes (section 5.3: never trust the model).
const BANNED = /\b(elevate[sd]?|elevating|unleash(ed|es|ing)?|must-haves?|game-?changers?|fur ?bab(y|ies))\b/i;
const FIRST_PERSON = /(^|[^A-Za-z'])(I|I'm|I've|I'd|I'll|me|my|mine|myself)(?=$|[^A-Za-z'])/;
const NUMWORDS = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|noon|midnight|o'clock|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/i;
const GRIEF = /\b(died|dead|death|dying|passed away|passed on|put down|put to sleep|rainbow bridge|cancer|tumou?r|terminal|euthani[sz]|funeral|lost (him|her|them)|miss (him|her|them) so|in heaven|rip\b)/i;
const PROFANE = /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick\w*|cock\w*|piss\w*|asshole\w*|bastard\w*|whore\w*|slut\w*|nigg\w*|fag\w*|retard\w*)/i;
const FLAGS = ['grief', 'profanity', 'person_described', 'unclear'];
// Buddy talks to the buyer; only gift lines may say you (to the person)
// Gift lines are the dog talking (Krish, 20 Oct): I is the dog, so he, she or the dog's name is the wrong voice
const THIRD = /(^|[^A-Za-z'])(he|she|him|his|her|hers|he's|she's)(?=$|[^A-Za-z'])/i;
// Buddy's reaction slipping into an HR review (22 Oct: "Mowgli is a focused teammate for KJ.")
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
// Buddy's reason may say I and start sentences; its names and numbers still come from the input
function groundedProse(text, hay) {
  const h = String(hay || '').toLowerCase();
  const OK = /^(I|I'm|I'd|I've|Buddy|Heartside|The|Morning|Mug|Couch|Blanket|Framed|Print|Tree|Ornament|December|Christmas|Love)$/;
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
const m = findJson(raw, 'reaction') || findJson(raw, 'line') || {};
const hay = [inp.typed_text, inp.previous_line, inp.dog.name, inp.recipient.name, inp.recipient.relation, inp.question].join(' ');
// gift lines speak to the person as you, so their name never appears in one
// and the dog is I, so its own name never appears in one either
const hasName = (t, nm) => !!nm && !!nm.replace(/[^A-Za-z]/g, '') && new RegExp('(^|[^A-Za-z])' + nm.replace(/[^A-Za-z]/g, '') + '(?=$|[^A-Za-z])', 'i').test(t);
const named = (t) => hasName(t, inp.recipient.name) || hasName(t, inp.dog.name);
let flags = (Array.isArray(m.flags) ? m.flags : []).filter(f => FLAGS.indexOf(f) !== -1);
if (GRIEF.test(inp.typed_text) && flags.indexOf('grief') === -1) flags.push('grief');
if (PROFANE.test(inp.typed_text) && flags.indexOf('profanity') === -1) flags.push('profanity');
const ai = !!(m.reaction || m.line);
let out;
if (flags.some(f => f === 'grief' || f === 'profanity' || f === 'unclear')) {
  out = { reaction: "I didn't quite catch that one. Try again, or pick one of these?", line: '', follow_up: null, flags: flags };
} else {
  // Buddy's reaction: a delighted friend, never a job description
  const reaction0 = clean(m.reaction);
  const reaction = STIFF.test(reaction0) ? '' : reaction0;
  // three candidate lines, best first: the first that passes every rule wins (22 Oct)
  const cands = (Array.isArray(m.lines) ? m.lines : []).concat(m.line ? [m.line] : []).map(clean).filter(Boolean);
  const MAX = MAX_LINE[inp.step] || 44;
  const line = cands.find(l => okLine(l, hay, MAX) && !named(l)) || '';
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
      f.lines.push(okLine(l, hay + ' ' + c, MAX_LINE.home_follow) && !named(l) ? l : null);
      f.replies.push(okText(r, 50) ? r : null);
    });
    // the buyer is not the person: a question or chip that says you, I or my is about the wrong one
    const wrong = (t) => YOU.test(t) || FIRST_PERSON.test(t);
    f.replies = f.replies.map((r) => (r && !wrong(r) ? r : null));
    if (okText(q, 70) && f.chips.length && !wrong(q) && !f.chips.some(wrong)) fu = f;
  }
  const goodLine = line || ownWords(inp.typed_text, MAX) || inp.previous_line;
  out = {
    reaction: okText(reaction, 70) ? reaction : 'Tell me more?',
    line: goodLine,
    follow_up: ai ? fu : (inp.step === 'home' ? { question: 'Tell me more?', chips: [] } : null),
    flags: flags
  };
}
out.source = ai ? 'ai' : 'fallback';
return [{ json: out }];
