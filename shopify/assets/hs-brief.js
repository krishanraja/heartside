/* The painting brief: one sentence for the painter, built from the buyer's taps (Krish, 29 Oct: "one-sentence
   briefs that handle all the possible combinations"). It is made on the phone, so it is instant, and it holds
   only what the buyer picked: the breed, the tone, what they do together, where the dog settles, what the dog
   is to them, up to two toys and what the dog wears. Never a name, a person, a coat or a colour: the photo
   shows the real dog. tools/bench/briefs.test.mjs walks every combination. */
(function (root) {
  var TOYS = {
    'a tennis ball': { hold: 'a tennis ball in {pos} mouth', paws: 'a tennis ball at {pos} paws', sleep: 'a tennis ball tucked under {pos} chin' },
    'a big stick': { hold: 'a big stick in {pos} mouth', paws: 'a big stick beside {obj}', sleep: 'a big stick across {pos} paws', joke: 'a stick far too big for {obj} in {pos} mouth' },
    'a squeaky toy': { hold: 'a squeaky toy in {pos} mouth', paws: 'a squeaky toy at {pos} paws', sleep: 'a squeaky toy tucked under {pos} chin' },
    'a rope toy': { hold: 'a rope toy in {pos} mouth', paws: 'a rope toy at {pos} paws', sleep: 'a rope toy tucked under {pos} chin' },
    'a stuffed toy': { hold: 'a stuffed toy in {pos} mouth', paws: 'a stuffed toy at {pos} paws', sleep: 'a stuffed toy hugged close' },
    'a bone': { hold: 'a bone in {pos} mouth', paws: 'a bone between {pos} paws', sleep: 'a bone tucked under {pos} chin' },
    'a frisbee': { hold: 'a frisbee in {pos} mouth', paws: 'a frisbee at {pos} paws', sleep: 'a frisbee as a pillow' },
    'treats': { hold: 'a treat balanced on {pos} nose', paws: 'a treat at {pos} paws', sleep: 'a treat guarded under one paw' }
  };
  var WEARS = { 'a collar': 'collar', 'a bandana': 'bandana', 'a bow': 'bow', 'a sweater': 'sweater', 'a harness': 'harness' };
  var LEAD = { sentimental: 'Tender portrait:', warm: 'Cheerful portrait:', hilarious: 'Comic portrait:', over_the_top: 'Over-the-top portrait:' };
  // where the moment happens: a walk or a car ride sets the scene; otherwise the dog's own spot does
  var SPOT = { couch: 'on the couch', bed: 'on the bed', feet: "at someone's feet", anywhere: '' };
  var DOING = { walk: 'out on a walk', car: 'riding in the car', coffee: 'by a morning coffee', movie: 'for movie night', naps: 'mid-nap' };
  var MOOD = {
    sentimental: { shadow: 'gazing up with quiet devotion', best: 'eyes full of love', hard: 'steady and gentle, keeping watch', boss: 'calm and dignified in soft light' },
    warm: { shadow: 'one ear up, never far away', best: 'grinning like a best friend does', hard: 'a soft, reassuring look', boss: 'clearly the boss, and happy about it' }
  };
  // a dog mid-nap can't gaze or keep watch
  var ASLEEP = { sentimental: 'peaceful and safe', warm: 'a sleepy little smile' };
  // hilarious is a visible comic premise, built from what they do together
  var JOKE = { walk: 'leading the way like a general on parade', car: 'ears flying, utterly majestic', coffee: 'supervising the coffee like a boss', movie: 'reviewing the film with deep suspicion', naps: 'snoring with total commitment' };
  // over the top: the dog as royalty, smug and theatrical, the scene its palace (Krish, 29 Oct: a fourth setting)
  var ROYAL = { walk: 'marching ahead like royalty on a victory parade', car: 'riding like a celebrity being chauffeured', coffee: 'inspecting the coffee like a palace taster', movie: 'sprawled like a critic at a private screening', naps: 'sprawled like royalty in a palace suite' };
  var PRON = { he: { pos: 'his', obj: 'him' }, she: { pos: 'her', obj: 'her' }, they: { pos: 'their', obj: 'them' } };

  function article(w) { return /^[aeiou]/i.test(w) ? 'an ' : 'a '; }
  function fill(t, p) { return t.replace(/\{pos\}/g, p.pos).replace(/\{obj\}/g, p.obj); }

  // how each toy is held, in the words the buyer reads (in his mouth, at her paws, hugged close); the
  // painter's brief keeps the same words (recipes v11, 30 Oct)
  function heldToys(o) {
    var p = PRON[o.pronoun] || PRON.they, comic = o.tone === 'hilarious' || o.tone === 'over_the_top', asleep = o.together === 'naps';
    var toys = (o.toys || []).filter(function (t) { return TOYS[t]; }).slice(0, 2);
    // the joke toy leads a comic portrait (Krish's example: a hilarious Border Collie with a tennis ball and a big stick)
    if (comic) toys.sort(function (a, b) { return (TOYS[b].joke ? 1 : 0) - (TOYS[a].joke ? 1 : 0); });
    return toys.map(function (t, i) {
      var v = TOYS[t];
      if (asleep) return fill(i === 0 ? v.sleep : v.paws, p);
      if (i === 0 && comic && v.joke) return fill(v.joke, p);
      // the first toy is held, the second waits at the paws
      return fill(i === 0 ? v.hold : v.paws, p);
    });
  }
  function toyWords(o) { return heldToys(o).join(' and '); }

  function brief(o) {
    var tone = LEAD[o.tone] ? o.tone : 'warm';
    var p = PRON[o.pronoun] || PRON.they;
    var breed = String(o.breed || '').trim();
    var dog = !breed || /^mixed/i.test(breed) ? 'mixed-breed dog' : breed;
    var parts = [LEAD[tone] + ' ' + article(dog) + dog];
    var wear = WEARS[o.wears];
    if (wear) parts[0] += ' in ' + p.pos + ' ' + wear;
    // a comic premise already says what they are doing at home, so it isn't said twice
    var comic = tone === 'hilarious' || tone === 'over_the_top';
    var doing = comic && JOKE[o.together] && !/^(walk|car)$/.test(o.together) ? '' : (DOING[o.together] || '');
    var where = o.together === 'walk' || o.together === 'car' ? '' : (SPOT[o.spot] || '');
    var scene = where && doing ? where + (/^for /.test(doing) ? ' ' : ', ') + doing : (where || doing);
    if (scene) { if (wear) parts.push(scene); else parts[0] += ' ' + scene; }
    var held = heldToys(o);
    var asleep = o.together === 'naps';
    if (held.length) { if (parts.length === 1 && !wear) parts[0] += ' with ' + held.join(' and '); else parts.push('with ' + held.join(' and ')); }
    var mood = tone === 'over_the_top' ? (ROYAL[o.together] || 'royally unimpressed') : tone === 'hilarious' ? (JOKE[o.together] || 'looking extremely important') : asleep ? ASLEEP[tone] : ((MOOD[tone] || MOOD.warm)[o.meaning] || 'eyes bright');
    parts.push(mood);
    return parts.join(', ') + '.';
  }

  var api = { brief: brief, toyWords: toyWords, TOYS: Object.keys(TOYS), WEARS: Object.keys(WEARS) };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.HSBrief = api;
})(typeof window !== 'undefined' ? window : this);
