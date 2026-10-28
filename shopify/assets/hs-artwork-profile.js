/* Artwork facts come from customer answers, never the AI-written gift note. */
(function () {
  'use strict';
  var HOME = { door: 'Waits at the door when their person comes home.', toy: 'Brings an object when their person comes home.', spin: 'Spins when their person comes home.', cool: 'Initially plays it cool when their person comes home.' };
  var FOLLOW = {
    door: { weekends: 'Waits at the door on weekends too.', weekdays: 'Waits at the door on weekdays.', hears: 'Hears the car before their person arrives.' },
    toy: { same: 'Brings the same toy each time; the toy type is unspecified.', closest: 'Brings whatever object is closest; its type is unspecified.', shoe: 'Brings a shoe when their person comes home.' },
    spin: { few: 'Spins two or three times.', many: 'Spins many times.', dizzy: 'Spins until dizzy; do not depict distress.' },
    cool: { follows: 'Then follows their person around.', lap: 'Then climbs onto their person\'s lap.', sighs: 'Then sighs for attention.' }
  };
  var SPOT = { feet: 'Rests at their person\'s feet.', bed: 'Rests on their person\'s side of the bed.', couch: 'Rests in their person\'s couch spot.', anywhere: 'Follows their person from room to room.' };
  var TOGETHER = { walk: 'Enjoys walks together.', coffee: 'Keeps their person company during coffee; no food preference was stated.', movie: 'Keeps their person company during movies.', naps: 'Naps alongside their person.', car: 'Enjoys car rides together.' };
  // Allowed provenance and per-source length. Breed and energy are never facts.
  var LIMITS = { home: 240, home_follow: 240, spot: 240, together: 240, toy: 80, accessory: 80 };
  var MAX_FACTS = 6, MAX_SERIALIZED = 1600;
  // A typed answer that only says the buyer doesn't know is not a habit to paint (28 Oct).
  var NONANSWER = /^(not sure|unsure|no idea|(i )?don['’]?t know|idk|dunno|skip|none|nothing|n\/?a|other|something else)[.!?]*$/i;

  /* Typed words, tidied for what the buyer reads and what the painter gets (Krish, 28 Oct,
     reversing 27 Oct's "shown exactly as typed"). Closed rules only, never a fuzzy fix: spaces
     collapse, a closed list of typos is corrected, shouted words come down, a run of exclamation or question marks
     becomes one mark, a leading "she" or "he" goes when a verb follows ("she waits" reads "Waits"), the
     first letter is capitalized and the line ends with a period. The chat keeps the raw words
     for Buddy. max keeps the result inside a source's limit (the period is dropped first). A
     phrase (a toy, a collar) is a name for a thing, not a sentence: the same fixes, with no
     capital or period added, so "A squeaky green hedgehog" reaches the painter as typed. */
  var TYPOS = { teh: 'the', wiht: 'with', adn: 'and', hte: 'the', taht: 'that', becuase: 'because', thier: 'their', freind: 'friend', untill: 'until', alot: 'a lot', recieve: 'receive', definately: 'definitely', wierd: 'weird' };
  var ADVERB = { always: 1, never: 1, usually: 1, often: 1, sometimes: 1, still: 1, just: 1, really: 1, totally: 1, literally: 1, basically: 1, also: 1, even: 1, only: 1, almost: 1, constantly: 1, immediately: 1, instantly: 1, actually: 1, then: 1, quietly: 1, happily: 1 };
  var NOT_VERB = { is: 1, was: 1, this: 1, his: 1, hers: 1, its: 1, us: 1, yes: 1, less: 1, plus: 1, unless: 1, perhaps: 1, always: 1, sometimes: 1 };
  function dropLead(t) {
    var m = /^(she|he|they)\s+(?:(is|was|are|were)\s+)?(\S.*)$/i.exec(t);
    if (!m) return t;
    var who = m[1].toLowerCase(), helper = (m[2] || '').toLowerCase(), rest = m[3];
    var plural = helper === 'are' || helper === 'were';
    // "they" only with are or were before a verb; "she is" and "he was" never with are or were
    if (who === 'they' ? !plural : plural) return t;
    var words = rest.split(' '), i = 0;
    while (i < words.length - 1 && ADVERB[words[i].toLowerCase()]) i++;
    var w = String(words[i] || '').toLowerCase().replace(/[^a-z]/g, '');
    var verb = helper ? w.length > 4 && /(ing|ed)$/.test(w) : /[^s]s$/.test(w) && !NOT_VERB[w];
    return verb ? rest : t;
  }
  function tidy(text, max, phrase) {
    var t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!t) return '';
    t = t.replace(/[A-Za-z]+/g, function (w) {
      var fix = TYPOS[w.toLowerCase()];
      if (!fix) return w;
      return /^[A-Z]/.test(w) ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
    });
    var letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && letters === letters.toUpperCase()) t = t.toLowerCase().replace(/(^|[^A-Za-z])i(?=$|[^A-Za-z])/g, '$1I');
    else t = t.replace(/[A-Za-z]+/g, function (w) { return w.length >= 4 && w === w.toUpperCase() ? w.toLowerCase() : w; });
    t = t.replace(/!+/g, '.').replace(/\?{2,}/g, '?').replace(/\.+\?/g, '?').replace(/\?\.+/g, '?').replace(/\.{2,}/g, '.').replace(/\s+([.?,;:])/g, '$1');
    if (phrase) return t.replace(/[\s,;:]+$/, '');
    t = dropLead(t).replace(/[\s,;:]+$/, '');
    if (!t) return '';
    t = t.charAt(0).toUpperCase() + t.slice(1);
    t = t.replace(/([.?]\s+)([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
    if (!/[.?]$/.test(t) && !(max && t.length >= max)) t += '.';
    return t;
  }

  function fromChat(s) {
    s = s || {};
    var facts = [], typed = s.typed || {};
    function add(source, choice, map) {
      var raw = choice === 'typed' ? typed[source] : map && map[choice];
      if (typeof raw !== 'string' || !raw.trim()) return;
      // Do not silently truncate a negation or a qualifying detail.
      if (raw.length > 240) return;
      var text = choice === 'typed' ? tidy(raw, LIMITS[source]) : raw.trim();
      if (!text || (choice === 'typed' && NONANSWER.test(text))) return;
      facts.push({ source: source, text: text });
    }
    // A favorite toy and a collar or accessory the buyer tagged, in their own short
    // words. No AI step: the text is quoted data, omitted rather than cut when too long.
    function described(source, value) {
      if (typeof value !== 'string') return;
      var raw = value.replace(/\s+/g, ' ').trim();
      if (!raw || raw.length > LIMITS[source]) return;
      var text = tidy(raw, LIMITS[source], true);
      if (text && !NONANSWER.test(text)) facts.push({ source: source, text: text });
    }
    add('home', s.home, HOME);
    // a typed home answer's follow-up counts only when the buyer answered it (28 Oct)
    if (s.home === 'typed') { if (s.follow === 'typed') add('home_follow', 'typed', null); }
    else add('home_follow', s.follow, FOLLOW[s.home]);
    add('spot', s.spot, SPOT);
    add('together', s.together, TOGETHER);
    described('toy', s.toy);
    described('accessory', s.accessory);
    // Meaning, breed stereotypes, breed energy, names, recipient details and generated
    // lines cannot create props or habits. Empty facts mean portraits without props.
    return { version: 1, facts: facts };
  }
  function serialize(profile) {
    if (!profile || profile.version !== 1 || !Array.isArray(profile.facts)) return JSON.stringify({ version: 1, facts: [] });
    var seen = {};
    var facts = profile.facts.filter(function (f) {
      if (!f || !Object.prototype.hasOwnProperty.call(LIMITS, f.source) || seen[f.source] || typeof f.text !== 'string' || f.text.length > LIMITS[f.source]) return false;
      seen[f.source] = true;
      return true;
    }).slice(0, MAX_FACTS).map(function (f) { return { source: f.source, text: f.text }; });
    var value = JSON.stringify({ version: 1, facts: facts });
    return value.length <= MAX_SERIALIZED ? value : JSON.stringify({ version: 1, facts: [] });
  }
  // What a buyer reads under "What I'll paint". The chip facts carry instructions for the image
  // model after a semicolon ("do not depict distress", "the toy type is unspecified"); a buyer
  // sees only the habit. Words the buyer typed are shown tidied (28 Oct).
  var CHIP_TEXT = {}, HOME_KEY = {}, FOLLOW_KEY = {};
  [HOME, SPOT, TOGETHER].concat(Object.keys(FOLLOW).map(function (k) { return FOLLOW[k]; })).forEach(function (map) {
    Object.keys(map).forEach(function (k) { CHIP_TEXT[map[k]] = true; });
  });
  Object.keys(HOME).forEach(function (k) { HOME_KEY[HOME[k]] = k; });
  Object.keys(FOLLOW).forEach(function (k) { Object.keys(FOLLOW[k]).forEach(function (f) { FOLLOW_KEY[FOLLOW[k][f]] = k + '.' + f; }); });
  function plain(text) {
    return CHIP_TEXT[text] ? text.split(';')[0].replace(/[\s.]+$/, '') + '.' : tidy(text);
  }
  /* A home chip and its follow-up read as one line, and the recipient is named instead of "their
     person" (28 Oct: the list said the door twice). Display only: the painter keeps both facts. */
  var MERGED = {
    door: { weekends: 'Waits at the door for {who}, weekends too.', weekdays: 'Waits at the door for {who} on weekdays.', hears: 'Waits at the door for {who} and hears the car first.' },
    toy: { same: 'Greets {who} with the same toy every time.', closest: 'Greets {who} with whatever is closest.', shoe: 'Greets {who} with a shoe.' },
    spin: { few: 'Spins two or three times when {who} {comes} home.', many: 'Spins too many times to count when {who} {comes} home.', dizzy: 'Spins until dizzy when {who} {comes} home.' },
    cool: { follows: 'Plays it cool at first, then follows {who} around.', lap: 'Plays it cool at first, then climbs onto {whose} lap.', sighs: 'Plays it cool at first, then sighs for attention.' }
  };
  function possessive(n) { n = String(n).replace(/['’]+$/, ''); return /s$/i.test(n) ? n + "'" : n + "'s"; }
  function person(names) {
    names = names || {};
    if (names.self) return { who: 'you', whose: 'your', comes: 'come', arrives: 'arrive' };
    var rec = String(names.rec || '').trim();
    return rec ? { who: rec, whose: possessive(rec), comes: 'comes', arrives: 'arrives' } : { who: 'their person', whose: "their person's", comes: 'comes', arrives: 'arrives' };
  }
  function named(text, p) {
    return text.replace(/their person's/g, p.whose).replace(/their person comes/g, p.who + ' ' + p.comes).replace(/their person arrives/g, p.who + ' ' + p.arrives).replace(/their person/g, p.who);
  }
  function display(facts, names) {
    var list = facts && Array.isArray(facts.facts) ? facts.facts : Array.isArray(facts) ? facts : [];
    var p = person(names), out = [], home = null, follow = null;
    list.forEach(function (f) {
      if (f && f.source === 'home' && HOME_KEY[f.text]) home = HOME_KEY[f.text];
      if (f && f.source === 'home_follow' && FOLLOW_KEY[f.text]) follow = FOLLOW_KEY[f.text];
    });
    var pair = home && follow && follow.split('.')[0] === home ? follow.split('.') : null;
    list.forEach(function (f) {
      if (!f || typeof f.text !== 'string') return;
      if (pair && f.source === 'home_follow') return;
      if (pair && f.source === 'home') { out.push(MERGED[pair[0]][pair[1]].replace(/\{whose\}/g, p.whose).replace(/\{who\}/g, p.who).replace(/\{comes\}/g, p.comes)); return; }
      var shown = plain(f.text);
      if (shown) out.push(CHIP_TEXT[f.text] ? named(shown, p) : shown);
    });
    return out;
  }
  function forBuyer(s, names) {
    return display(fromChat(s).facts, names);
  }
  window.HSArtworkProfile = { fromChat: fromChat, serialize: serialize, forBuyer: forBuyer, plain: plain, display: display, tidy: function (text) { return tidy(text); },
    limits: { facts: MAX_FACTS, serialized: MAX_SERIALIZED, toy: LIMITS.toy, accessory: LIMITS.accessory } };
}());
