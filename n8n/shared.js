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
    if (/\d/.test(bare) || (NUMWORDS.test(bare) && !/^(may|am)$/i.test(bare))) { if (h.indexOf(bare.toLowerCase()) === -1) return false; continue; }
    if (/^[A-Z]/.test(bare) && !start && !OK.test(bare) && h.indexOf(bare.toLowerCase()) === -1) return false;
  }
  return true;
}
// a gift line: the dog's own words to the person, a sentence may start anywhere, no shouting
function okLine(s, hay) { return okText(s, 44) && !THIRD.test(s) && s.indexOf('!') === -1 && groundedProse(s, hay); }
// the buyer's own words, as a gift line, cut only where a sentence or clause ends (22 Oct: a cut at
// 43 characters printed "Always ready to run, walk and fetch. Not.")
function ownWords(t) {
  t = clean(t).replace(/[.!?]+$/, '');
  if (!t) return '';
  if (t.length > 43) {
    // whole sentences first; only a first sentence that is too long is cut at a clause
    const fit = (parts, join) => { let out = ''; for (const p of parts) { const next = out ? out + join + p : p; if (next.length > 43) break; out = next; } return out; };
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
