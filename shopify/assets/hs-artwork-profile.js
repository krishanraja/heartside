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
  function fromChat(s) {
    s = s || {};
    var facts = [], typed = s.typed || {};
    function add(source, choice, map) {
      var text = choice === 'typed' ? typed[source] : map && map[choice];
      if (typeof text !== 'string' || !text.trim()) return;
      // Do not silently truncate a negation or a qualifying detail.
      if (text.length > 240) return;
      facts.push({ source: source, text: text.trim() });
    }
    // A favorite toy and a collar or accessory the buyer tagged, in their own short
    // words. No AI step: the text is quoted data, omitted rather than cut when too long.
    function described(source, value) {
      if (typeof value !== 'string') return;
      var text = value.replace(/\s+/g, ' ').trim();
      if (text && text.length <= LIMITS[source]) facts.push({ source: source, text: text });
    }
    add('home', s.home, HOME);
    if (s.home === 'typed') add('home_follow', 'typed', null);
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
  window.HSArtworkProfile = { fromChat: fromChat, serialize: serialize,
    limits: { facts: MAX_FACTS, serialized: MAX_SERIALIZED, toy: LIMITS.toy, accessory: LIMITS.accessory } };
}());
