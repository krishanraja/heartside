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

// No exclamation marks anywhere a buyer reads (house rule): a run of them ends the sentence with one
// period, one beside a question mark leaves the question, one before a comma just goes, the word
// after a converted one starts a sentence, and a double period or an ellipsis collapses to one
// period, with the word after it starting a sentence ("I wait at the window. Until your car pulls in.")
function clean(s) {
  return String(s == null ? '' : s)
    .replace(/[—–]/g, ', ')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/!+/g, '!')
    .replace(/\?!|!\?/g, '?')
    .replace(/!(?=\s*[,;:])/g, '')
    .replace(/!\s+([a-z])/g, (m, c) => '. ' + c.toUpperCase())
    .replace(/!/g, '.')
    .replace(/\.{2,}\s*([a-z])/g, (m, c) => '. ' + c.toUpperCase())
    .replace(/\.{2,}/g, '.')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();
}
// A chip the model offers that is no answer at all; the page adds its own Not sure (28 Oct)
const NONANSWER = /^(not sure|unsure|no idea|(i )?don'?t know|idk|dunno|skip|none|nothing|n\/?a|other|something else)[.!?]*$/i;
// Krish, 28 Oct: "Never name a food, toy, object or place the owner did not mention; coffee does not mean food."
// A closed list of concrete props. A word in one group is grounded only when the owner's own answers
// hold a word of the same group. The answers are the typed words, the chip ids and CHIP_WORDS below,
// never the draft lines or the prompt, which carry their own inventions ("I wait for toast").
// Words that are mostly verbs or idioms (stick, trail, chew, key) are left out on purpose.
const PROPS = [
  // foods and drinks
  'toast', 'bread', 'bagel', 'bacon', 'croissant', 'muffin', 'pastry', 'pancake', 'waffle', 'cereal', 'oatmeal', 'yogurt yoghurt',
  'egg', 'sausage', 'ham', 'chicken', 'turkey', 'steak', 'burger', 'hotdog', 'fries', 'pizza', 'pasta', 'sandwich', 'cheese',
  'butter', 'peanut', 'crust', 'crumb', 'popcorn', 'cookie biscuit', 'cake', 'cupcake', 'donut doughnut', 'chocolate', 'candy',
  'cream', 'carrot', 'apple', 'banana', 'berry', 'watermelon', 'coffee latte espresso cappuccino', 'tea', 'milk', 'juice', 'wine',
  'beer', 'breakfast', 'brunch', 'lunch', 'dinner supper', 'meal', 'leftover', 'scrap', 'food',
  // treats
  'treat snack', 'kibble', 'jerky', 'bone',
  // toys
  'toy', 'ball', 'tennis', 'frisbee', 'rope', 'squeaky squeaker', 'duck', 'hedgehog', 'teddy', 'plush plushie', 'bunny', 'kong',
  // household objects and clothes
  'shoe sneaker', 'sock', 'slipper', 'boot', 'coat jacket', 'hat', 'scarf', 'sweater', 'glove', 'pillow', 'cushion',
  'duvet comforter quilt', 'rug carpet', 'towel', 'remote', 'phone', 'laptop computer', 'newspaper', 'mail', 'leash', 'collar',
  'harness', 'bowl', 'crate', 'basket', 'bag', 'box', 'cup', 'window', 'door', 'chair armchair', 'couch sofa settee', 'bed',
  'desk', 'table', 'stair staircase', 'tv television', 'car truck', 'bike bicycle',
  // places
  'kitchen', 'bathroom bath tub', 'bedroom', 'hallway', 'porch', 'balcony', 'patio', 'yard backyard garden lawn', 'fence', 'gate',
  'park', 'beach', 'lake', 'river', 'pond', 'sea ocean', 'woods forest', 'field', 'hill', 'mountain', 'street', 'road',
  'sidewalk', 'office', 'cafe', 'vet', 'puddle'
];
const PROP_GROUP = Object.create(null);
PROPS.forEach((g, i) => g.split(' ').forEach(w => {
  [w, w + 's', /(s|x|z|ch|sh)$/.test(w) ? w + 'es' : w, /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w].forEach(f => { PROP_GROUP[f] = i; });
}));
// What a chip answer says, in the words a line may use for it (the page's chip ids, hs3.js)
const CHIP_WORDS = {
  door: ['door'], weekends: ['door'], weekdays: ['door'], hears: ['car', 'hear'],
  toy: ['toy', 'present'], same: ['toy'], closest: ['toy'], shoe: ['shoe'],
  feet: ['feet', 'pillow'], bed: ['bed', 'pillow'], couch: ['couch', 'sofa', 'cushion', 'pillow'],
  walk: ['walk', 'walks', 'morning'], coffee: ['coffee', 'cup', 'mug', 'morning'], movie: ['movie', 'couch', 'sofa', 'tv'],
  naps: ['nap', 'naps'], car: ['car', 'ride', 'rides', 'road']
};
function chipWords(chips) {
  return chips.filter(c => typeof c === 'string' && c).map(c => c + ' ' + (Object.prototype.hasOwnProperty.call(CHIP_WORDS, c) ? CHIP_WORDS[c].join(' ') : '')).join(' ');
}
// names holds the dog's and the person's names. A name is no prop and grounds none: the name itself
// may appear in the text, but a dog called Biscuit or Latte never grounds a cookie or an espresso (28 Oct)
function propsGrounded(text, answerHay, names) {
  const nm = Object.create(null);
  (String(names || '').toLowerCase().match(/[a-z]+/g) || []).forEach(w => { nm[w] = true; });
  const have = {};
  (String(answerHay || '').toLowerCase().match(/[a-z]+/g) || []).forEach(w => { if (w in PROP_GROUP && !nm[w]) have[PROP_GROUP[w]] = true; });
  const words = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
  return words.every((w, i) => {
    if (!(w in PROP_GROUP) || nm[w]) return true;
    // "You treat me like family", "I treat our naps like work" and "she parks on your feet" are verbs,
    // not a snack or a place (29 Oct bench: both lost good lines)
    if (/^(treat|park)(s|ed|ing)?$/.test(w) && /^(you|your|me|my|us|our|them|their|him|his|her|it|its|everyone|myself|yourself|ourselves|herself|himself|itself|themselves|on|in|at|by|beside|next|right|up|down|like)$/.test(words[i + 1] || '')) return true;
    return !!have[PROP_GROUP[w]];
  });
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
// hay grounds names and numbers; answerHay (the owner's answers only) grounds every prop (28 Oct)
function okLine(s, hay, max, answerHay, names) { return okText(s, max || 44) && !THIRD.test(s) && s.indexOf('!') === -1 && !staccato(s) && !WORN.test(s) && groundedProse(s, hay) && propsGrounded(s, answerHay, names); }
// the buyer's own words, as a gift line, cut only where a sentence or clause ends (22 Oct: a cut at
// 43 characters printed "Always ready to run, walk and fetch. Not."); clean() has already turned a
// typed double exclamation mark into one period (28 Oct: a typed note printed with both marks)
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
    // a reply with one stray comma or quote before a closing brace (29 Oct bench: a whole note lost to
    // `"meaning":"...","}`) is repaired once, never guessed at further
    const parse = (t) => { try { return JSON.parse(t); } catch (e) { return undefined; } };
    let j = parse(s);
    if (j === undefined) j = parse(s.replace(/,\s*"\s*([}\]])/g, '$1').replace(/,\s*([}\]])/g, '$1'));
    return j === undefined ? null : findJson(j, key, depth + 1);
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
// what the owner said, for props: typed words, chip ids and their chip words. Never current_lines: a
// draft can carry its own invention ("You have your coffee and I wait for toast."). The names go apart:
// a name may appear, but a dog called Biscuit grounds no cookie (28 Oct).
const answerHay = [typed, chipWords(inp.answers.map(a => a.chip))].join(' ');
const names = [inp.dog.name, inp.recipient.name].join(' ');
// the page's own plain lines (hs3.js PLAIN), for a draft that names a prop the owner never gave;
// the page needs all four lines to use the note
const PLAIN = { home: 'Best part of my day? You walking in.', spot: "I'm never far from you.", together: 'Any time with you is my favorite time.', meaning: "I'm yours, always." };
// gift lines speak to the person as you, so their name never appears in one
// and the dog is I, so its own name never appears in one either
const hasName = (t, nm) => !!nm && !!nm.replace(/[^A-Za-z]/g, '') && new RegExp('(^|[^A-Za-z])' + nm.replace(/[^A-Za-z]/g, '') + '(?=$|[^A-Za-z])', 'i').test(t);
const named = (t) => hasName(t, inp.recipient.name) || hasName(t, inp.dog.name);
// the coat, markings and age are the photo's to show, never the brief's (29 Oct)
const COAT = /\b(muzzle|grey(ing|ed)?|gray(ing|ed)?|chestnut|brindle|merle|fawn|dapple[ds]?|piebald|tricolou?r|liver)\b/i;
// Buddy's reason talks to the buyer: about the person by name and never you, or, for a gift for the
// buyer ("Me", relation self), to them as you and never by their name (28 Oct)
// A person the buyer named only by relation ("your partner", "your friend") is said that way, so that
// phrase is no you (29 Oct bench: every reason for a partner was lost)
// Krish, 29 Oct: "the UI always recommends the mug". The first gift follows the answers, the same way every
// time: two or more closeness answers (spot couch, bed or feet; naps or movie nights; a shadow) is the
// blanket, fewer is the portrait. A pick that disagrees takes the rule's gift and loses its reason.
const chipOf = (id) => { const a = inp.answers.find(x => x.id === id); return a && a.chip; };
const closeKnown = ['spot', 'together', 'meaning'].every(id => chipOf(id));
const close = (/^(couch|bed|feet)$/.test(chipOf('spot') || '') ? 1 : 0) + (/^(naps|movie)$/.test(chipOf('together') || '') ? 1 : 0) + (chipOf('meaning') === 'shadow' ? 1 : 0);
const ruleGift = closeKnown ? (close >= 2 ? 'blanket' : 'print') : '';
const relName = /^your\s/i.test(inp.recipient.name || '') ? inp.recipient.name : '';
const toBuyer = (t) => (inp.recipient.relation === 'self' ? !hasName(t, inp.recipient.name) : !YOU.test(relName ? t.split(new RegExp(relName.replace(/[^A-Za-z ]/g, ''), 'i')).join(' ') : t));
let flags = (Array.isArray(m.flags) ? m.flags : []).filter(f => FLAGS.indexOf(f) !== -1);
if (GRIEF.test(typed) && flags.indexOf('grief') === -1) flags.push('grief');
if (PROFANE.test(typed) && flags.indexOf('profanity') === -1) flags.push('profanity');
const blocked = flags.some(f => f === 'grief' || f === 'profanity');
const lines = {}, alternates = {}, sources = {};
KEYS.forEach(k => {
  // the draft the buyer saw, cleaned of exclamation marks (28 Oct), and only when every prop in it is the owner's
  const draft = clean(inp.current_lines[k]);
  // the journey sends no draft, so a line that breaks every rule still leaves a plain line, never a gap (29 Oct)
  const cur = !draft || !propsGrounded(draft, answerHay, names) ? PLAIN[k] : draft;
  const l = clean(m.lines && m.lines[k]);
  const alts = (m.alternates && Array.isArray(m.alternates[k]) ? m.alternates[k] : []).map(clean).filter(a => okLine(a, hay, MAX_LINE[k], answerHay, names) && !named(a)).slice(0, 2);
  // the first line that passes, then its alternates, then the draft the buyer saw (22 Oct)
  lines[k] = blocked ? cur : ((okLine(l, hay, MAX_LINE[k], answerHay, names) && !named(l)) ? l : (alts[0] || cur));
  if (alts.length && !blocked) alternates[k] = alts;
  const src = m.sources && Array.isArray(m.sources[k]) ? m.sources[k].map(String).filter(s => /^[a-z_]{2,20}$/.test(s)).slice(0, 4) : [];
  if (src.length) sources[k] = src;
});
const reason = clean(m.reason);
const out = {
  lines: lines,
  alternates: alternates,
  recommended_gift: ruleGift || (GIFTS.indexOf(m.recommended_gift) !== -1 ? m.recommended_gift : inp.default_gift),
  // the reason is shown, never printed: the prompt asks for 140 and up to 170 is kept (29 Oct bench: three good reasons ran 145 to 160)
  reason: (!blocked && (!ruleGift || m.recommended_gift === ruleGift) && okText(reason, 170) && groundedProse(reason, hay) && toBuyer(reason) && propsGrounded(reason, answerHay, names)) ? reason : '',
  sources: sources,
  // the painter's brief: grounded like the lines (the breed may be named), no names, no grief, or nothing at all (29 Oct)
  // and never a coat or a muzzle the photo may contradict (29 Oct bench: Buddy's "greying muzzle" reached a dachshund's brief)
  scene: (() => { const sc = clean(m.scene); return !blocked && okText(sc, 220) && !COAT.test(sc) && !named(sc) && propsGrounded(sc, answerHay, names) && groundedProse(sc, hay + ' ' + (inp.dog.breed || '')) ? sc : ''; })(),
  flags: flags,
  source: m.lines ? 'ai' : 'fallback'
};
return [{ json: out }];
