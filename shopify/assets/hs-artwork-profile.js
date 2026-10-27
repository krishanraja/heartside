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
    add('home', s.home, HOME);
    if (s.home === 'typed') add('home_follow', 'typed', null);
    else add('home_follow', s.follow, FOLLOW[s.home]);
    add('spot', s.spot, SPOT);
    add('together', s.together, TOGETHER);
    // Meaning, breed stereotypes, names, recipient details and generated lines
    // cannot create props or habits. Empty facts mean portraits without props.
    return { version: 1, facts: facts };
  }
  function serialize(profile) {
    if (!profile || profile.version !== 1 || !Array.isArray(profile.facts)) return JSON.stringify({ version: 1, facts: [] });
    var allowed = ['home', 'home_follow', 'spot', 'together'];
    var facts = profile.facts.filter(function (f) { return f && allowed.indexOf(f.source) !== -1 && typeof f.text === 'string' && f.text.length <= 240; }).slice(0, 4).map(function (f) { return { source: f.source, text: f.text }; });
    var value = JSON.stringify({ version: 1, facts: facts });
    return value.length <= 1600 ? value : JSON.stringify({ version: 1, facts: [] });
  }
  window.HSArtworkProfile = { fromChat: fromChat, serialize: serialize };
}());
