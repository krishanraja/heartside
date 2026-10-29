/* The Heartside journey (sections/hs-journey.liquid). Rebuilt on 29 Oct after the phone batch
   (Krish: "Literally nothing works functionally and the user flow is a 0 out of 10"), not patched.
   His rules: every screen does one thing, nothing is asked twice, taps instead of typing, and the
   order is the dog, then a text-only profile to confirm (the words and the look), then the photo,
   which paints on the best-fit gift, then the gifts on the real products (the product pages).

   Krish, 29 Oct, after the bench: mobile first, show and tell, radical simplicity, no scrolling,
   nothing typed but the dog's name and the recipient's name. So one question per screen, each a
   real address (?step=breed and so on): a tap answers it and moves on, Back, Forward and reload
   land where the buyer expects, and a step the answers don't reach yet falls back to the
   furthest one they do. Then the words with the four-tone slider, the look, the photo.

   The words: one compose call per tone, at most, cached. Moving the tone rewrites the note in a
   box that never changes size. Once the buyer paints, the words are locked: the product pages
   fill Teeinblue from the same state (the hs2-review bridge) and ask nothing again.
   The photo never leaves the device until a gift paints it (IndexedDB hs2/files/headshot, the
   store hs2.js hands to Teeinblue). Never use import() here: Shopify's minifier breaks it. */
(function () {
  'use strict';
  if (window.__hsj) return;
  window.__hsj = true;

  var KEY = 'hs-journey', HS2 = 'hs2-review';
  var NAME_MAX = 14, MAX_CALLS = 8, COMPOSE_MS = 11000;
  var COMPOSE_VERSION = 'journey-v2';
  var TONES = ['sentimental', 'warm', 'hilarious', 'over_the_top'];
  var TONE_LABEL = { sentimental: 'Sentimental', warm: 'Warm', hilarious: 'Hilarious', over_the_top: 'Over the top' };
  // the questions, one screen each, then the words, the look and the photo
  var ASK = ['name', 'breed', 'pro', 'person', 'home', 'spot', 'together', 'meaning', 'toy', 'wears'];
  var STEPS = ASK.concat(['words', 'look', 'photo']);
  var MAX_TOYS = 2;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------------------------------------------------------- the questions
     The chip ids are the ones the art profile (hs-artwork-profile.js fromChat) and the note
     writer (n8n compose) already understand. Every group is a tap. */
  var BREEDS = ['Labrador Retriever', 'Golden Retriever', 'French Bulldog', 'Dachshund', 'Poodle', 'Goldendoodle', 'German Shepherd', 'Beagle', 'Pug', 'Border Collie'];
  function groups(n) {
    return [
      { id: 'home', q: 'When you get home, ' + n.dog + '…', opts: [['door', 'waits at the door'], ['toy', 'brings you something'], ['spin', 'spins in circles'], ['cool', 'plays it cool, for a second']] },
      { id: 'spot', q: n.possessive + ' spot when you are home', opts: [['feet', 'On your feet'], ['bed', 'Your side of the bed'], ['couch', 'The couch'], ['anywhere', 'Wherever you are']] },
      { id: 'together', q: 'Best thing you do together', opts: [['walk', 'Walks'], ['coffee', 'Morning coffee'], ['movie', 'Movie nights'], ['naps', 'Naps'], ['car', 'Car rides']] },
      { id: 'meaning', q: 'What ' + n.dog + ' is to ' + n.them, opts: [['shadow', 'A shadow'], ['best', 'A best friend'], ['hard', 'There on hard days'], ['boss', 'The boss of the house']] },
      { id: 'toy', q: n.possessive + ' favorite things', sub: 'Pick up to two. We paint them in.', opts: [['a tennis ball', 'Tennis ball'], ['a big stick', 'Big stick'], ['a squeaky toy', 'Squeaky toy'], ['a rope toy', 'Rope toy'], ['a stuffed toy', 'Stuffed toy'], ['a frisbee', 'Frisbee'], ['a bone', 'Bone'], ['treats', 'Treats']] },
      { id: 'wears', q: 'Anything ' + n.dog + ' wears?', opts: [['a collar', 'A collar'], ['a bandana', 'A bandana'], ['a bow', 'A bow'], ['a sweater', 'A sweater'], ['a harness', 'A harness'], ['', 'Nothing']] }
    ];
  }
  // the labels the note writer reads, the tap in words (n8n compose, 29 Oct bench)
  function label(id, v) { var g = groups(names()).filter(function (x) { return x.id === id; })[0], o = g && g.opts.filter(function (x) { return x[0] === v; })[0]; return o ? o[1].toLowerCase() : ''; }
  // the scripted lines, the dog talking (Krish, 20 Oct), used until the writer answers or if it can't
  var LINES = {
    home: { door: 'I wait by the door until you come home.', toy: "I bring you a present whenever you're back.", spin: "When you walk in, I spin like it's a party.", cool: 'I play it cool for about four seconds.' },
    spot: { feet: 'Your feet make the best pillow I know.', bed: 'I took your side of the bed to keep it warm.', couch: 'I keep your spot on the couch warm for you.', anywhere: 'Wherever you go, I go.' },
    together: { walk: 'Our walks are the best part of my day.', coffee: 'Coffee with you is the best part of my morning.', movie: 'Movie night is better with me beside you.', naps: 'My best naps are the ones next to you.', car: "Any car ride is a good one if you're in it." },
    meaning: { shadow: "I'm your shadow, and I like it that way.", best: "You're my best friend, and I'm yours.", hard: "On the hard days, I'll stay close to you.", boss: 'I run this house, but I love you most.' }
  };
  var GIFT_NAME = { mug: 'mug', blanket: 'blanket', print: 'portrait' };

  /* ------------------------------------------------------------------- state */
  var root, app, cfg = {}, S = load(), photoURL = null, debounce = null;
  function fresh() {
    return { dog: '', breed: '', breedId: '', pro: '', rel: '', person: '', home: null, spot: null, together: null, meaning: null,
      toys: [], toysDone: false, accessory: null, tone: 'warm', style: 'screenprint', notes: {}, request: null, calls: 0, session: '',
      hasPhoto: false, photoT: 0, typed: {}, follow: null };
  }
  function load() {
    var s = null;
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    var f = fresh();
    if (!s || typeof s !== 'object') return f;
    Object.keys(f).forEach(function (k) { if (!(k in s)) s[k] = f[k]; });
    // a reload cannot tell whether a sent request was answered: the words on screen stay
    if (s.request) s.request = null;
    return s;
  }
  function save() { try { window.sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }
  function sessionId() {
    if (!S.session) {
      var a = '';
      try { var b = new Uint8Array(12); window.crypto.getRandomValues(b); for (var i = 0; i < b.length; i++) a += ('0' + b[i].toString(16)).slice(-2); } catch (e) { a = String(Date.now()) + String(Math.random()).slice(2, 10); }
      S.session = 'hs' + a; save();
    }
    return S.session;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // a name as it will print: spaces collapse, all-lowercase or all-caps names are recased
  function nameCase(x) {
    x = String(x == null ? '' : x).replace(/\s+/g, ' ').trim().replace(/^['’\- ]+|['’\- ]+$/g, '');
    if (!x) return '';
    var lower = x === x.toLowerCase(), upper = x === x.toUpperCase() && x.replace(/[^A-Za-z]/g, '').length > 2;
    if (!lower && !upper) return x.charAt(0).toUpperCase() + x.slice(1);
    return x.toLowerCase().replace(/(^|[ \-'’])([a-zß-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function possessive(d) { d = String(d || '').replace(/['’]+$/, ''); return /s$/i.test(d) ? d + "'" : d + "'s"; }
  function names() {
    var dog = nameCase(S.dog) || 'Your dog', self = S.rel === 'self', person = nameCase(S.person);
    return { dog: dog, possessive: S.dog ? possessive(dog) : 'Their', them: self ? 'you' : person || 'them', person: self ? '' : person, self: self,
      she: S.pro === 'he' ? 'he' : S.pro === 'she' ? 'she' : 'they' };
  }
  // the toys as the painter and the writer read them: "a tennis ball and a big stick"
  function toyText() { return (S.toys || []).slice(0, MAX_TOYS).join(' and '); }
  function track(name, data) { try { if (window.Shopify && window.Shopify.analytics && window.Shopify.analytics.publish) window.Shopify.analytics.publish('hsj_' + name, data || {}); } catch (e) { /* analytics off */ } }

  function answered(step) {
    if (step === 'name') { var n = nameCase(S.dog); return !!(n && n.length <= NAME_MAX); }
    if (step === 'person') { var p = nameCase(S.person); return S.rel === 'self' || !!(p && p.length <= NAME_MAX); }
    if (step === 'toy') return !!S.toysDone;
    if (step === 'wears') return S.accessory !== null;
    if (ASK.indexOf(step) !== -1) return !!S[step];
    return true;
  }
  function aboutDone() { return ASK.every(answered); }
  function note(tone) { return S.notes && S.notes[tone || S.tone] || null; }
  function scripted() { var o = {}; ['home', 'spot', 'together', 'meaning'].forEach(function (k) { o[k] = (LINES[k] || {})[S[k]] || ''; }); return o; }
  function lines() { var c = note(); return c && c.lines ? c.lines : scripted(); }
  // the gift the painting starts on. The writer's pick, but never the mug: it sits under the 30%
  // margin floor (docs/ECONOMICS.md), so a mug pick paints the portrait first and the mug is one
  // tap away on the next screen
  function bestGift() {
    var c = note(), g = c && c.gift;
    if (g === 'blanket' || g === 'print') return g;
    // the writer's own rule (n8n Enforce, Krish 29 Oct): the boss of the house is the portrait, a dog that
    // sleeps near the person is the blanket, any other dog the portrait
    if (S.meaning === 'boss') return 'print';
    return /^(couch|bed|feet)$/.test(S.spot || '') || S.together === 'naps' ? 'blanket' : 'print';
  }

  /* ------------------------------------------------------------- the writer */
  function canCall() { return !!(cfg.ai && cfg.composeUrl && S.calls < MAX_CALLS && window.fetch); }
  function breedRow() {
    var B = window.HSBreeds;
    if (!B || !S.breed) return null;
    try { var r = B.lookup(S.breed); return r && r.exact ? r : null; } catch (e) { return null; }
  }
  function composeBody(tone) {
    var n = names(), r = breedRow(), dog = { name: n.dog, pronoun: n.she };
    if (r && r.kind !== 'mixed') { dog.breed = r.name; if (r.tone) dog.tone = r.tone; }
    // each tap as its words, the toys and what the dog wears as the owner's own, and no draft to copy (29 Oct bench)
    var answers = ['home', 'spot', 'together', 'meaning'].map(function (id) { return { id: id, chip: S[id] || null, label: label(id, S[id]), typed: null }; });
    if (toyText()) answers.push({ id: 'toy', chip: null, label: 'favorite toy or treat', typed: toyText() });
    if (S.accessory) answers.push({ id: 'wears', chip: null, label: 'what the dog wears', typed: S.accessory });
    return { dog: dog, recipient: { name: n.person, relation: n.self ? 'self' : 'named' }, answers: answers,
      current_lines: { home: '', spot: '', together: '', meaning: '' }, default_gift: bestGift(), note_tone: tone, session: sessionId() };
  }
  function answersKey() { return JSON.stringify([COMPOSE_VERSION, S.dog, S.breed, S.pro, S.rel, S.person, S.home, S.spot, S.together, S.meaning, S.toys, S.accessory]); }
  function compose(tone) {
    var key = answersKey();
    if (S.notesKey !== key) { S.notes = {}; S.notesKey = key; }
    if (note(tone) || (S.request && S.request.tone === tone)) return;
    if (!canCall()) return;
    var id = sessionId() + '-' + (S.calls + 1), req = S.request = { id: id, tone: tone };
    S.calls++; save(); paintNote();
    var ctrl = window.AbortController ? new AbortController() : null, done = false;
    var finish = function (j) {
      if (done) return; done = true;
      if (S.request && S.request.id === id) S.request = null;
      var ok = j && j.lines && ['home', 'spot', 'together', 'meaning'].every(function (k) { return typeof j.lines[k] === 'string' && j.lines[k].trim(); });
      if (ok && S.notesKey === key) S.notes[req.tone] = { lines: j.lines, voice: typeof j.voice === 'string' ? j.voice : '', gift: j.recommended_gift || '', reason: typeof j.reason === 'string' ? j.reason : '', source: j.source || '' };
      track('note', { tone: req.tone, result: ok ? 'ok' : 'none' });
      save(); paintNote();
    };
    setTimeout(function () { finish(null); }, COMPOSE_MS);
    Promise.resolve().then(function () {
      return window.fetch(cfg.composeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(composeBody(tone)), signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', mode: 'cors' });
    }).then(function (r) { return r.ok ? r.json() : null; }).then(finish, function () { finish(null); });
  }
  // wakes the writer's code runner while the buyer answers, so the first note comes back quickly
  var warmedAt = 0, warmCount = 0;
  function warm() {
    if (!cfg.ai || !cfg.composeUrl || !window.fetch || Date.now() - warmedAt < 12000 || warmCount >= 8) return;
    warmedAt = Date.now(); warmCount++;
    try { window.fetch(cfg.composeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"warm":true}', credentials: 'omit', mode: 'cors', keepalive: true }).catch(function () {}); } catch (e) { /* old browser */ }
  }

  /* ------------------------------------------------------------------ photo */
  var DB = 'hs2', STORE = 'files', PHOTO = 'headshot';
  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
      var open;
      try { open = window.indexedDB.open(DB, 1); } catch (e) { reject(e); return; }
      open.onupgradeneeded = function () { open.result.createObjectStore(STORE); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        var db = open.result, tx, req;
        try { tx = db.transaction(STORE, mode); req = fn(tx.objectStore(STORE)); } catch (e) { db.close(); reject(e); return; }
        tx.oncomplete = function () { db.close(); resolve(req && req.result); };
        tx.onerror = tx.onabort = function () { db.close(); reject(tx.error); };
      };
    });
  }
  function savePhoto(file) {
    var t = Math.max(Date.now(), (S.photoT || 0) + 1), timer;
    var timeout = new Promise(function (_, reject) { timer = setTimeout(function () { reject(new Error('timeout')); }, 8000); });
    return Promise.race([idb('readwrite', function (st) { return st.put({ file: file, t: t }, PHOTO); }), timeout])
      .then(function () { clearTimeout(timer); S.hasPhoto = true; S.photoT = t; save(); return true; },
        function () { clearTimeout(timer); S.hasPhoto = false; save(); return false; });
  }

  /* ---------------------------------------------------- hand over to the gift
     The product pages fill Teeinblue from hs2-review (hs2.js): the names, the words, the art
     profile, the style and tone, the photo's time, and the journey marker that tells the page to
     paint at once and ask nothing again. */
  function bridge(gift) {
    var st = {}, n = names(), l = lines();
    try { st = JSON.parse(window.sessionStorage.getItem(HS2) || '{}') || {}; } catch (e) { st = {}; }
    st.dog = n.dog.length <= NAME_MAX ? n.dog : '';
    st.person = n.self ? 'Me' : n.person;
    st.hs3_lines = { home: l.home, spot: l.spot, together: l.together, meaning: l.meaning };
    st.hs3_mug_lines = st.hs3_lines;
    st.hs3_copy_owner = 'generated';
    st.hs3_photo_t = S.hasPhoto ? S.photoT : 0;
    var kinds = {};
    ['mug', 'blanket', 'print'].forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) kinds[x.handle] = g; });
    st.hs3_kinds = kinds;
    st.hs_answers = ['Dog: ' + n.dog + ' (' + n.she + ')', 'For: ' + (n.self ? 'me' : n.person), 'home: ' + S.home, 'spot: ' + S.spot, 'together: ' + S.together, 'meaning: ' + S.meaning, 'toys: ' + (toyText() || 'none'), 'wears: ' + (S.accessory || 'nothing'), 'tone: ' + S.tone].join(' | ').slice(0, 480);
    if (window.HSArtworkProfile) st.hs3_art_profile = window.HSArtworkProfile.fromChat({ home: S.home, spot: S.spot, together: S.together, toy: toyText(), accessory: S.accessory || '' });
    st.hs3_energy = '';
    try { var r = breedRow(); if (r && window.HSArtworkEngine) st.hs3_energy = window.HSArtworkEngine.energyFor(r) || ''; } catch (e) { /* unknown breed: no energy */ }
    st.hs3_art_choices = { style: S.style, tone: S.tone };
    st.hs_ship_to = n.self ? 'Me (the buyer)' : n.person;
    st.hs_journey = { t: Date.now(), gift: gift, tone: S.tone, style: S.style, photoT: S.hasPhoto ? S.photoT : 0, voice: (note() || {}).voice || '', brief: brief() };
    try { window.sessionStorage.setItem(HS2, JSON.stringify(st)); } catch (e) { /* private mode */ }
    try { if (window.HSArtworkChoices) window.HSArtworkChoices.select({ style: S.style, tone: S.tone }); } catch (e) { /* the bridge holds them too */ }
  }
  function giftURL(gift) {
    var x = cfg.gifts && cfg.gifts[gift];
    if (!x || !x.url) return null;
    var u = new URL(x.url, window.location.href);
    u.searchParams.set('journey', '1');
    if (x.minVariant && Number(x.priceMax) > Number(x.price)) u.searchParams.set('variant', String(x.minVariant));
    return u.pathname + u.search;
  }

  /* ------------------------------------------------------------------ views
     Every screen is one job and fits a phone without scrolling: the back arrow and a progress
     line, the question, the taps, and the one button in thumb reach (Krish, 29 Oct). */
  function pill(group, value, label, on) {
    return '<button type="button" class="hsj-pill' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-hsj-pick="' + esc(group) + '" data-v="' + esc(value) + '">' + esc(label) + '</button>';
  }
  function head(step, title, sub) {
    var i = STEPS.indexOf(step), pct = Math.round((i + 1) / STEPS.length * 100);
    return '<div class="hsj-progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>' +
      '<header class="hsj-head"><button type="button" class="hsj-back" data-hsj-back aria-label="Back">←</button><div><h2 class="hsj-h2" id="hsj-q">' + title + '</h2>' + (sub ? '<p class="hsj-small">' + sub + '</p>' : '') + '</div></header>';
  }
  function dock(label, next, on) { return '<div class="hsj-dock"><button type="button" class="hsj-btn" data-hsj-next="' + next + '"' + (on ? '' : ' disabled') + '>' + label + '</button></div>'; }
  function nextOf(step) { return STEPS[STEPS.indexOf(step) + 1] || ''; }
  function viewName() {
    return head('name', 'What is your dog called?', 'It signs the gift: "Love, ' + esc(nameCase(S.dog) || 'Mowgli') + '".') +
      '<div class="hsj-body"><input id="hsj-name" class="hsj-input" data-hsj-name type="text" inputmode="text" enterkeyhint="next" autocomplete="off" autocapitalize="words" maxlength="40" value="' + esc(S.dog) + '" placeholder="Mowgli" aria-labelledby="hsj-q">' +
      '<p class="hsj-small hsj-hint" data-hsj-name-hint aria-live="polite"></p></div>' + dock('Next', 'breed', answered('name'));
  }
  function viewBreed() {
    var n = names(), other = S.breed && BREEDS.indexOf(S.breed) === -1 && S.breed !== 'Mixed';
    return head('breed', 'What breed is ' + esc(n.dog) + '?') + '<div class="hsj-body"><div class="hsj-pills" role="group" aria-labelledby="hsj-q">' +
      BREEDS.map(function (b) { return pill('breed', b, b, S.breed === b); }).join('') + pill('breed', 'Mixed', 'Mixed or not sure', S.breed === 'Mixed') + pill('breed', '__other', other ? S.breed : 'Another breed', other || S.breedOther) + '</div>' +
      (S.breedOther ? '<input class="hsj-input hsj-search" data-hsj-breed-search type="search" autocomplete="off" placeholder="Start typing the breed" aria-label="Search breeds"><div class="hsj-pills" data-hsj-breed-list></div>' : '') + '</div>';
  }
  function viewPro() {
    var n = names();
    return head('pro', esc(n.dog) + ' is a…') + '<div class="hsj-body"><div class="hsj-pills hsj-pills--big" role="group" aria-labelledby="hsj-q">' + pill('pro', 'he', 'Boy', S.pro === 'he') + pill('pro', 'she', 'Girl', S.pro === 'she') + '</div></div>';
  }
  function viewPerson() {
    var n = names();
    return head('person', 'Who is the gift for?', 'Their first name, as ' + esc(n.dog) + ' would say it.') +
      '<div class="hsj-body"><input id="hsj-person" class="hsj-input" data-hsj-person type="text" inputmode="text" enterkeyhint="next" autocomplete="off" autocapitalize="words" maxlength="40" value="' + esc(S.rel === 'self' ? '' : S.person) + '" placeholder="Sam" aria-labelledby="hsj-q">' +
      '<div class="hsj-pills">' + pill('self', 'self', "It's for me", S.rel === 'self') + '</div></div>' + dock('Next', 'home', answered('person') && S.rel !== 'self');
  }
  function viewAsk(step) {
    var g = groups(names()).filter(function (x) { return x.id === step; })[0];
    var multi = step === 'toy', on = function (v) { return multi ? (S.toys || []).indexOf(v) !== -1 : S[step] === v && S[step] !== null; };
    return head(step, esc(g.q), g.sub || '') + '<div class="hsj-body"><div class="hsj-pills" role="group" aria-labelledby="hsj-q">' +
      g.opts.map(function (o) { return pill(step, o[0], o[1], on(o[0])); }).join('') + (multi ? pill('toy', '', 'None', S.toysDone && !(S.toys || []).length) : '') + '</div></div>' +
      (multi ? dock((S.toys || []).length ? 'Next' : 'Skip', 'wears', true) : '');
  }
  function styles() {
    var R = window.HSArtworkEngine && window.HSArtworkEngine.recipes && window.HSArtworkEngine.recipes.styles;
    var ids = R ? Object.keys(R) : ['screenprint', 'collage', 'painterly', 'comic', 'ink', 'cinematic'];
    // the styles with approved example paintings lead (design/examples-*)
    ids.sort(function (a, b) { return (cfg.examples && cfg.examples[b] ? 1 : 0) - (cfg.examples && cfg.examples[a] ? 1 : 0); });
    return ids.map(function (id) { return { id: id, label: R && R[id] ? R[id].label : id }; });
  }
  function viewWords() {
    var n = names();
    return head('words', 'In ' + esc(n.possessive) + ' words', 'Slide to change how ' + esc(n.dog) + ' sounds.') +
      '<div class="hsj-body"><div class="hsj-tone" role="group" aria-label="How it sounds">' + TONES.map(function (t) {
        return '<button type="button" class="hsj-seg' + (S.tone === t ? ' is-on' : '') + '" aria-pressed="' + (S.tone === t) + '" data-hsj-tone="' + t + '">' + TONE_LABEL[t] + '</button>';
      }).join('') + '</div><div class="hsj-note" data-hsj-note aria-live="polite"></div></div>' + dock('Now the look', 'look', true);
  }
  // the one-sentence brief the painter's moment follows (hs-brief.js), shown as what we'll paint
  function brief() {
    if (!window.HSBrief) return '';
    return window.HSBrief.brief({ tone: S.tone, breed: S.breed, pronoun: names().she, together: S.together, spot: S.spot, meaning: S.meaning, toys: S.toys, wears: S.accessory || '' });
  }
  function viewLook() {
    var n = names();
    return head('look', 'How should we paint ' + esc(n.dog) + '?') + '<div class="hsj-body"><div class="hsj-styles">' + styles().map(function (s) {
      var src = cfg.examples && cfg.examples[s.id];
      return '<button type="button" class="hsj-style' + (S.style === s.id ? ' is-on' : '') + '" aria-pressed="' + (S.style === s.id) + '" data-hsj-style="' + esc(s.id) + '">' +
        (src ? '<span class="hsj-style__art"><img src="' + esc(src) + '" alt="" loading="lazy" width="300" height="450"><span class="hsj-tag">Example</span></span>' : '<span class="hsj-style__art hsj-style__art--plain hsj-style--' + esc(s.id) + '" aria-hidden="true"></span>') +
        '<span class="hsj-style__name">' + esc(s.label) + '</span></button>';
    }).join('') + '</div><p class="hsj-brief" data-hsj-brief>' + esc(brief().replace(/^[\w-]+ portrait: /, 'We paint ')) + '</p></div>' + dock('Paint ' + esc(n.dog), 'photo', true);
  }
  // the note box keeps one size whatever is in it, so the tone never moves the page (29 Oct)
  function paintNote() {
    var box = app && app.querySelector('[data-hsj-note]');
    if (!box) return;
    var n = names(), c = note(), l = lines(), busy = !!(S.request && S.request.tone === S.tone);
    box.classList.toggle('is-busy', busy);
    box.innerHTML =
      '<div class="hsj-gift-line"><p class="hsj-print">' + esc(l.meaning) + '</p><p class="hsj-sign">Love, ' + esc(n.dog) + '</p></div>' +
      '<ul class="hsj-lines">' + ['home', 'spot', 'together'].map(function (k) { return '<li>' + esc(l[k]) + '</li>'; }).join('') + '</ul>' +
      (busy ? '<p class="hsj-writing" role="status">Writing it ' + TONE_LABEL[S.tone].toLowerCase() + '…</p>' : '');
    // the box fills the screen above the button at one size (hs-journey.css), so a tone never moves the page
  }
  function viewPhoto() {
    var n = names(), gift = bestGift();
    return head('photo', 'A photo of ' + esc(n.dog), 'One clear photo: ' + esc(n.possessive) + ' face, good light, just ' + esc(n.dog) + '.') +
      '<div class="hsj-body"><label class="hsj-drop" data-hsj-drop>' +
      '<input type="file" accept="image/*" class="hsj-file" data-hsj-file>' +
      '<span class="hsj-drop__img" data-hsj-preview>' + (photoURL ? '<img src="' + esc(photoURL) + '" alt="Your photo">' : '<span class="hsj-drop__plus" aria-hidden="true">+</span>') + '</span>' +
      '<span class="hsj-drop__text">' + (photoURL ? 'Choose a different photo' : 'Choose or take a photo') + '</span></label>' +
      '<p class="hsj-small hsj-photo-note" data-hsj-photo-note role="status"></p>' +
      '<button type="button" class="hsj-link" data-hsj-override hidden>It\'s ' + esc(n.dog) + '. Use this photo.</button>' +
      '<p class="hsj-small">We paint ' + esc(n.dog) + ' on the ' + GIFT_NAME[gift] + ' first, then show it on every gift. The photo stays on your phone until then.</p></div>';
  }
  function view(step) {
    if (step === 'name') return viewName();
    if (step === 'breed') return viewBreed();
    if (step === 'pro') return viewPro();
    if (step === 'person') return viewPerson();
    if (step === 'words') return viewWords();
    if (step === 'look') return viewLook();
    if (step === 'photo') return viewPhoto();
    return viewAsk(step);
  }

  /* ------------------------------------------------------------- the address */
  function stepFromURL() {
    var q = new URLSearchParams(window.location.search), s = q.get('step') || '';
    // the first journey's single question screen, still in someone's history
    if (s === 'about') s = 'name';
    if (s === 'profile') s = 'words';
    return STEPS.indexOf(s) === -1 ? '' : s;
  }
  function allowed(step) {
    var i = STEPS.indexOf(step);
    for (var k = 0; k < i; k++) if (!answered(STEPS[k])) return false;
    return true;
  }
  function go(step, replace) {
    while (step && !allowed(step)) step = STEPS[STEPS.indexOf(step) - 1] || '';
    var u = new URL(window.location.href);
    if (step) u.searchParams.set('step', step); else u.searchParams.delete('step');
    try { window.history[replace ? 'replaceState' : 'pushState']({ hsj: step }, '', u.pathname + u.search + u.hash); } catch (e) { /* file:// */ }
    render(step);
  }
  function render(step) {
    var hook = root.querySelector('[data-hsj-screen="hook"]');
    hook.hidden = !!step;
    app.hidden = !step;
    app.setAttribute('data-hsj-step', step || '');
    document.documentElement.classList.toggle('hsj-focus', !!step);
    if (!step) {
      var resume = root.querySelectorAll('[data-hsj-resume]');
      resume.forEach(function (el) { el.hidden = !S.dog; });
      return;
    }
    app.innerHTML = '<div class="hsj__screen hsj__screen--step" data-hsj-screen="' + step + '">' + view(step) + '</div>';
    if (step === 'words') { paintNote(); compose(S.tone); }
    var input = app.querySelector('[data-hsj-name], [data-hsj-person]');
    if (input) { nameHint(input); if (!('ontouchstart' in window)) input.focus(); }
    window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.pageYOffset));
  }
  function nameHint(input) {
    var hint = app.querySelector('[data-hsj-name-hint]');
    if (!hint || !input) return;
    var n = nameCase(input.value);
    hint.textContent = n.length > NAME_MAX ? 'That prints as "Love, ' + n + '", which is too long. Up to ' + NAME_MAX + ' letters: a nickname works.' : '';
  }

  /* ----------------------------------------------------------------- events */
  function onClick(e) {
    var t = e.target.closest('button, a');
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-hsj-go')) { e.preventDefault(); track('start', {}); warm(); go(firstOpen()); return; }
    if (t.hasAttribute('data-hsj-resume-go')) { go(firstOpen()); return; }
    if (t.hasAttribute('data-hsj-restart')) { S = fresh(); save(); try { window.sessionStorage.removeItem(HS2); } catch (x) { /* fine */ } go('name'); return; }
    if (t.hasAttribute('data-hsj-back')) { if (window.history.length > 1) window.history.back(); else go(STEPS[STEPS.indexOf(stepFromURL()) - 1] || ''); return; }
    if (t.hasAttribute('data-hsj-pick')) { pick(t.getAttribute('data-hsj-pick'), t.getAttribute('data-v')); return; }
    if (t.hasAttribute('data-hsj-tone')) { setTone(t.getAttribute('data-hsj-tone')); return; }
    if (t.hasAttribute('data-hsj-style')) {
      S.style = t.getAttribute('data-hsj-style'); save();
      app.querySelectorAll('[data-hsj-style]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      track('style', { style: S.style }); return;
    }
    if (t.hasAttribute('data-hsj-next')) {
      if (t.disabled) return;
      if (stepFromURL() === 'toy') { S.toysDone = true; save(); }
      warm(); go(t.getAttribute('data-hsj-next')); return;
    }
    if (t.hasAttribute('data-hsj-override')) { t.hidden = true; if (pendingFile) usePhoto(pendingFile, true); return; }
  }
  // the first screen still waiting for an answer, or the words once every question is in
  function firstOpen() { for (var i = 0; i < ASK.length; i++) if (!answered(ASK[i])) return ASK[i]; return 'words'; }
  function pick(group, v) {
    var step = stepFromURL();
    if (group === 'breed') {
      if (v === '__other') { S.breedOther = true; S.breed = ''; save(); render('breed'); var f = app.querySelector('[data-hsj-breed-search]'); if (f) f.focus(); return; }
      S.breedOther = false; S.breed = v;
    } else if (group === 'self') { S.rel = 'self'; S.person = ''; }
    else if (group === 'toy') {
      var list = (S.toys || []).slice(), at = list.indexOf(v);
      if (!v) { S.toys = []; S.toysDone = true; save(); go('wears'); return; }
      if (at !== -1) list.splice(at, 1); else if (list.length < MAX_TOYS) list.push(v); else { list.shift(); list.push(v); }
      S.toys = list; S.toysDone = false; save(); render('toy'); return;
    } else if (group === 'wears') S.accessory = v;
    else S[group] = v;
    save(); warm();
    // a tap answers the question and moves on
    go(nextOf(step));
  }
  function setTone(t) {
    if (TONES.indexOf(t) === -1 || t === S.tone) return;
    S.tone = t; save(); track('tone', { tone: t });
    app.querySelectorAll('[data-hsj-tone]').forEach(function (b) { var on = b.getAttribute('data-hsj-tone') === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    paintNote();
    clearTimeout(debounce);
    debounce = setTimeout(function () { compose(S.tone); }, 350);
  }
  function onInput(e) {
    var t = e.target, btn = app.querySelector('[data-hsj-next]');
    if (t.hasAttribute('data-hsj-name')) {
      S.dog = t.value.slice(0, 40); save(); nameHint(t);
      if (btn) btn.disabled = !answered('name');
      return;
    }
    if (t.hasAttribute('data-hsj-person')) {
      S.person = t.value.slice(0, 40); if (S.person.trim()) S.rel = 'named'; save(); nameHint(t);
      var me = app.querySelector('[data-hsj-pick="self"]'); if (me && S.rel !== 'self') { me.classList.remove('is-on'); me.setAttribute('aria-pressed', 'false'); }
      if (btn) btn.disabled = !(answered('person') && S.rel !== 'self');
      return;
    }
    if (t.hasAttribute('data-hsj-breed-search')) {
      var list = app.querySelector('[data-hsj-breed-list]'), B = window.HSBreeds, q = t.value.trim();
      if (!list) return;
      list.innerHTML = q.length < 2 || !B ? '' : B.suggest(q, 6).map(function (r) { return pill('breed', r.id === 'mixed-breed' ? 'Mixed' : r.name, r.name, false); }).join('');
    }
  }
  // Enter on the keyboard does what the button does
  function onKey(e) {
    if (e.key !== 'Enter' || !e.target.matches('[data-hsj-name], [data-hsj-person]')) return;
    var btn = app.querySelector('[data-hsj-next]');
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }
  var pendingFile = null;
  function onChange(e) {
    var t = e.target;
    if (!t.hasAttribute('data-hsj-file') || !t.files || !t.files[0]) return;
    var f = t.files[0]; t.value = '';
    pendingFile = f;
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(f);
    var prev = app.querySelector('[data-hsj-preview]'); if (prev) prev.innerHTML = '<img src="' + esc(photoURL) + '" alt="Your photo">';
    var say = app.querySelector('[data-hsj-photo-note]'), over = app.querySelector('[data-hsj-override]');
    if (over) over.hidden = true;
    if (!window.HSPhotoQuality) { usePhoto(f, false); return; }
    if (say) say.textContent = 'Checking the photo on your phone…';
    window.HSPhotoQuality.check(f, { timeout: 6000 }).then(function (r) {
      var why = r.reasons.map(function (x) { return x.message; }).join(' ');
      if (r.verdict === 'reject') {
        track('photo_rejected', { reasons: r.reasons.map(function (x) { return x.code; }).join(',') });
        if (say) say.textContent = why;
        if (over) over.hidden = !r.overridable;
        return;
      }
      usePhoto(f, false, r.verdict === 'warn' ? why : '');
    }, function () { usePhoto(f, false); });
  }
  function usePhoto(f, overridden, warning) {
    var say = app.querySelector('[data-hsj-photo-note]'), n = names(), gift = bestGift();
    if (say) say.textContent = (warning ? warning + ' ' : '') + 'Saving the photo…';
    if (overridden) track('photo_override', {});
    savePhoto(f).then(function (ok) {
      if (!ok) { if (say) say.textContent = "This browser couldn't keep the photo. Allow this site to store data, then choose it again."; return; }
      bridge(gift);
      var url = giftURL(gift);
      if (!url) { if (say) say.textContent = "That gift isn't available right now."; return; }
      track('paint', { gift: gift, tone: S.tone, style: S.style });
      if (say) say.textContent = 'Off to paint ' + n.dog + '…';
      window.location.href = url;
    });
  }

  /* ------------------------------------------------------------------- start */
  function init() {
    root = document.querySelector('[data-hsj]');
    if (!root) return;
    app = root.querySelector('[data-hsj-app]');
    try { cfg = JSON.parse(root.querySelector('[data-hsj-config]').textContent); } catch (e) { cfg = {}; }
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('keydown', onKey);
    window.addEventListener('popstate', function () { var s = stepFromURL(); render(allowed(s) ? s : ''); });
    // a gift page reached without the journey sends the buyer here with ?gift=; the dog comes first
    var q = new URLSearchParams(window.location.search);
    if (q.get('gift')) track('from_gift', { gift: q.get('gift') });
    var s = stepFromURL();
    if (s && !allowed(s)) go(s, true); else render(s);
    document.documentElement.classList.remove('hsj-routed');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
