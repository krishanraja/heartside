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
  var NAME_MAX = 14, MAX_CALLS = 14, COMPOSE_MS = 11000;
  var COMPOSE_VERSION = 'journey-v2';
  var TONES = ['sentimental', 'warm', 'hilarious', 'over_the_top'];
  var TONE_LABEL = { sentimental: 'Sentimental', warm: 'Warm', hilarious: 'Hilarious', over_the_top: 'Over the top' };
  /* one line-icon family (24 px grid, 1.75 stroke, round ends), drawn in currentColor (Krish, 29 Oct:
     "premium iconography", the same variety wherever it helps) */
  function icon(paths, cls) { return '<svg class="hsj-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>'; }
  var ICON = {
    sentimental: icon('<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'),
    warm: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
    hilarious: icon('<circle cx="12" cy="12" r="9"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0Z"/><path d="M8 9.5c.6-.8 1.6-.8 2.2 0M13.8 9.5c.6-.8 1.6-.8 2.2 0"/>'),
    over_the_top: icon('<path d="M3.5 8.5 7.5 12 12 5.5 16.5 12l4-3.5-1.8 9.5H5.3Z"/><path d="M5.5 20.5h13"/>'),
    back: icon('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    next: icon('<path d="M5 12h13M13 6.5 18.5 12 13 17.5"/>'),
    camera: icon('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.8" r="3.4"/>'),
    check: icon('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    redo: icon('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>'),
    image: icon('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m3.5 16 5-5 4 4 3-3 5 5"/>'),
    face: icon('<circle cx="12" cy="12" r="8.5"/><path d="M9 10.5h.01M15 10.5h.01M9 15c1.6 1.3 4.4 1.3 6 0"/>'),
    light: icon('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/>'),
    one: icon('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>'),
    brush: icon('<path d="M14.5 4.5 19.5 9.5 11 18l-5-5Z"/><path d="M6 13c-2 0-3 1.6-3 3.5 0 1.4-.6 2.6-1.5 3 2.6.6 6.5-.3 6.5-3.5"/>')
  };
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
      she: S.pro === 'he' ? 'he' : S.pro === 'she' ? 'she' : 'they', his: S.pro === 'he' ? 'his' : S.pro === 'she' ? 'her' : 'their' };
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
    // a buyer who started from the blanket's or the portrait's page gets that gift; one from the mug's
    // page follows the rule below, and the mug is one tap away on the gifts screen
    if (S.wanted === 'blanket' || S.wanted === 'print') return S.wanted;
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
    // the painter's directed brief (recipes v10) stages the scene from these chip ids, never re-asked
    // v15: the breed's corpus archetype (characterFor, same cross rule as energy) and what the dog is to them
    var archetype = '';
    try { var ar = breedRow(); if (ar && window.HSArtworkEngine && window.HSArtworkEngine.characterFor) archetype = window.HSArtworkEngine.characterFor(ar) || ''; } catch (e) { /* unknown breed: none */ }
    st.hs_brief_input = { breed: S.breed || '', pronoun: n.she === 'she' || n.she === 'he' ? n.she : 'they', archetype: archetype, home: S.home || '', spot: S.spot || '', together: S.together || '', meaning: S.meaning || '',
      // the toys in the words the buyer read in the brief (in his mouth, at her paws), kept by the painter
      toys: (window.HSBrief && window.HSBrief.toyWords({ tone: S.tone, pronoun: n.she, together: S.together, toys: S.toys })) || toyText() || '', accessory: S.accessory || '', noToy: !!S.toysDone && !toyText() };
    
    st.hs_ship_to = n.self ? 'Me (the buyer)' : n.person;
    st.hs_journey = { t: Date.now(), gift: gift, tone: S.tone, style: S.style, photoT: S.hasPhoto ? S.photoT : 0, voice: (note() || {}).voice || '', brief: brief(), gifts: journeyGifts(), notes: writtenNotes() };
    try { window.sessionStorage.setItem(HS2, JSON.stringify(st)); } catch (e) { /* private mode */ }
    try { if (window.HSArtworkChoices) window.HSArtworkChoices.select({ style: S.style, tone: S.tone }); } catch (e) { /* the bridge holds them too */ }
  }
  // the gifts page shows the painting on every gift and queues the extras (hs-journey-choose.js)
  // every tone the writer already wrote, so the gift page's one free repaint can change the words too
  function writtenNotes() {
    var out = {};
    TONES.forEach(function (t) { var c = S.notes && S.notes[t]; if (c && c.lines) out[t] = { home: c.lines.home, spot: c.lines.spot, together: c.lines.together, meaning: c.lines.meaning }; });
    return out;
  }
  function journeyGifts() {
    var out = {};
    ['mug', 'blanket', 'print'].forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) out[g] = { url: giftURL(g), handle: x.handle, price: x.price }; });
    return out;
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
     One template for every step (Krish approved the mock, 29 Oct: "much better"): the app bar
     (Back, "Step 3 of 13") and the progress line, the headline and one line of support at the
     same place on every screen, one component per job (rows, chips, a text field, cards), and the
     one button in the dock at the bottom. Nothing moves between screens but the content. */
  var BACK = '<button type="button" class="hsj-icon-btn" data-hsj-back aria-label="Back">' + ICON.back + '</button>';
  function screen(step, title, sub, body, dockHtml) {
    var i = STEPS.indexOf(step), pct = Math.round((i + 1) / STEPS.length * 100);
    return '<header class="hsj-bar">' + BACK + '<p class="hsj-bar__step">Step ' + (i + 1) + ' of ' + STEPS.length + '</p></header>' +
      '<div class="hsj-progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>' +
      '<main class="hsj-content"><div class="hsj-heading"><h2 class="hsj-headline" id="hsj-q">' + title + '</h2>' + (sub ? '<p class="hsj-support">' + sub + '</p>' : '') + '</div>' +
      '<div class="hsj-body">' + body + '</div></main><footer class="hsj-dock">' + dockHtml + '</footer>';
  }
  function primary(label, next, on) { return '<button type="button" class="hsj-btn" data-hsj-next="' + next + '"' + (on ? '' : ' disabled') + '><span>' + label + '</span>' + ICON.next + '</button>'; }
  // one choice of a few: a full-width row with a radio; a tap answers and moves on
  function row(group, value, label, on) {
    return '<button type="button" class="hsj-row' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-hsj-pick="' + esc(group) + '" data-v="' + esc(value) + '"><span>' + esc(label) + '</span><span class="hsj-radio" aria-hidden="true"></span></button>';
  }
  // one of many, or up to two: a chip, with a check when chosen
  function chip(group, value, label, on) {
    return '<button type="button" class="hsj-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-hsj-pick="' + esc(group) + '" data-v="' + esc(value) + '">' + (on ? ICON.check : '') + '<span>' + esc(label) + '</span></button>';
  }
  var pill = chip;
  function field(attr, label, value, placeholder, id) {
    return '<label class="hsj-field" for="' + id + '"><span class="hsj-field__label">' + label + '</span><input id="' + id + '" class="hsj-input" ' + attr + ' type="text" inputmode="text" enterkeyhint="next" autocomplete="off" autocapitalize="words" maxlength="40" value="' + esc(value) + '" placeholder="' + placeholder + '"></label>';
  }
  function nextOf(step) { return STEPS[STEPS.indexOf(step) + 1] || ''; }
  function viewName() {
    return screen('name', 'What is your dog called?', 'It signs the gift: "Love, ' + esc(nameCase(S.dog) || 'Mowgli') + '".',
      field('data-hsj-name', "Dog's name", S.dog, 'Mowgli', 'hsj-name') + '<p class="hsj-hint" data-hsj-name-hint aria-live="polite"></p>', primary('Next', 'breed', answered('name')));
  }
  function viewBreed() {
    var n = names(), other = S.breed && BREEDS.indexOf(S.breed) === -1 && S.breed !== 'Mixed';
    return screen('breed', 'What breed is ' + esc(n.dog) + '?', 'We paint the breed you pick.', '<div class="hsj-chips" role="group" aria-labelledby="hsj-q">' +
      BREEDS.map(function (b) { return chip('breed', b, b, S.breed === b); }).join('') + chip('breed', 'Mixed', 'Mixed or not sure', S.breed === 'Mixed') + chip('breed', '__other', other ? S.breed : 'Another breed', other || S.breedOther) + '</div>' +
      (S.breedOther ? '<input class="hsj-input hsj-search" data-hsj-breed-search type="search" autocomplete="off" placeholder="Start typing the breed" aria-label="Search breeds"><div class="hsj-chips" data-hsj-breed-list></div>' : ''),
      primary('Next', 'pro', answered('breed')));
  }
  function viewPro() {
    var n = names();
    return screen('pro', esc(n.dog) + ' is a…', 'So the note says he or she.', '<div class="hsj-rows" role="group" aria-labelledby="hsj-q">' + row('pro', 'he', 'Boy', S.pro === 'he') + row('pro', 'she', 'Girl', S.pro === 'she') + '</div>',
      primary('Next', 'person', answered('pro')));
  }
  function viewPerson() {
    var n = names();
    return screen('person', 'Who is the gift for?', 'Their first name, as ' + esc(n.dog) + ' would say it.',
      field('data-hsj-person', 'Their name', S.rel === 'self' ? '' : S.person, 'Sam', 'hsj-person') + '<div class="hsj-chips">' + chip('self', 'self', "It's for me", S.rel === 'self') + '</div>',
      primary('Next', 'home', answered('person') && S.rel !== 'self'));
  }
  function viewAsk(step) {
    var g = groups(names()).filter(function (x) { return x.id === step; })[0];
    var multi = step === 'toy', on = function (v) { return multi ? (S.toys || []).indexOf(v) !== -1 : S[step] === v && S[step] !== null; };
    var sub = g.sub || (step === 'wears' ? 'We paint it in, plain and simple.' : 'Pick the one that sounds most like ' + esc(names().dog) + '.');
    if (multi) return screen(step, esc(g.q), sub, '<div class="hsj-chips" role="group" aria-labelledby="hsj-q">' + g.opts.map(function (o) { return chip(step, o[0], o[1], on(o[0])); }).join('') + chip('toy', '', 'None', S.toysDone && !(S.toys || []).length) + '</div>',
      primary((S.toys || []).length ? 'Next' : 'Skip', 'wears', true));
    return screen(step, esc(g.q), sub, '<div class="hsj-rows" role="group" aria-labelledby="hsj-q">' + g.opts.map(function (o) { return row(step, o[0], o[1], on(o[0])); }).join('') + '</div>',
      primary('Next', nextOf(step), answered(step)));
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
    // Krish, 29 Oct: the title and the button in his words; four tone cards under the note
    return screen('words', "Now let's capture " + esc(n.possessive) + ' vibe.', 'Pick how ' + n.she + (n.she === 'they' ? ' sound' : ' sounds') + '. We paint from this.',
      '<div class="hsj-note" data-hsj-note aria-live="polite"></div><div class="hsj-tones" role="group" aria-label="How it sounds">' + TONES.map(function (t) {
        return '<button type="button" class="hsj-tone hsj-tone--' + t + (S.tone === t ? ' is-on' : '') + '" aria-pressed="' + (S.tone === t) + '" data-hsj-tone="' + t + '"><span class="hsj-tone__ico">' + ICON[t] + '</span><span>' + TONE_LABEL[t] + '</span></button>';
      }).join('') + '</div>', primary('Now ' + n.his + ' look', 'look', true));
  }
  // the one-sentence brief the painter's moment follows (hs-brief.js), shown as what we'll paint
  function brief() {
    if (!window.HSBrief) return '';
    // v15: the scene the painter's composer picks, in the buyer's words, when it is not the activity's own line
    var scene = '', E = window.HSArtworkEngine;
    try {
      var r = breedRow(), toyw = window.HSBrief.toyWords({ tone: S.tone, pronoun: names().she, together: S.together, toys: S.toys });
      if (E && E.sceneShort) scene = E.sceneShort({ tone: S.tone, archetype: (r && E.characterFor && E.characterFor(r)) || '', home: S.home || '', spot: S.spot || '', together: S.together || '', meaning: S.meaning || '', toys: toyw });
    } catch (e) { scene = ''; }
    return window.HSBrief.brief({ tone: S.tone, breed: S.breed, pronoun: names().she, together: S.together, spot: S.spot, meaning: S.meaning, toys: S.toys, wears: S.accessory || '', scene: scene });
  }
  function viewLook() {
    var n = names();
    return screen('look', 'What style of design do you want?', 'Every style is painted from your photo.', '<div class="hsj-styles">' + styles().map(function (s) {
      var src = cfg.examples && cfg.examples[s.id], on = S.style === s.id;
      return '<button type="button" class="hsj-style' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-hsj-style="' + esc(s.id) + '">' + '<span class="hsj-style__check">' + ICON.check + '</span>' +
        '<span class="hsj-style__art">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" width="360" height="450"><span class="hsj-tag">Example</span>' : ICON.image) + '</span>' +
        '<span class="hsj-style__name">' + esc(s.label) + '</span></button>';
    }).join('') + '</div><p class="hsj-brief" data-hsj-brief>' + esc(brief().replace(/^[\w-]+ portrait: /, 'We paint ')) + '</p>', primary('Upload your best pic of ' + esc(n.dog), 'photo', true));
  }
  // the note keeps one size whatever is in it, so a tone never moves the page
  function paintNote() {
    var box = app && app.querySelector('[data-hsj-note]');
    if (!box) return;
    var n = names(), l = lines(), busy = !!(S.request && S.request.tone === S.tone);
    box.classList.toggle('is-busy', busy);
    box.innerHTML = '<div class="hsj-letter">' + ['home', 'spot', 'together', 'meaning'].map(function (k) { return '<p>' + esc(l[k]) + '</p>'; }).join('') +
      '<p class="hsj-sign">Love, ' + esc(n.dog) + '</p></div>' +
      '<div class="hsj-note__foot"><span class="hsj-note__ask" data-hsj-note-ask>' + (busy ? 'Writing it ' + TONE_LABEL[S.tone].toLowerCase() + '…' : rewriteNote.said || 'Not quite ' + esc(n.dog) + '?') + '</span>' +
      '<button type="button" class="hsj-text-btn" data-hsj-rewrite' + (busy ? ' disabled' : '') + '>' + ICON.redo + '<span>Write it again</span></button></div>';
  }
  // "Write it again" as often as they like (Krish, 29 Oct): the same tone, a fresh draft; past the
  // hour's limit it says so kindly and keeps the drafts they have
  function rewriteNote() {
    if (!canCall()) { rewriteNote.said = "That's every draft we can write this hour. Pick the one that sounds most like " + names().dog + '.'; paintNote(); return; }
    rewriteNote.said = '';
    if (S.notes) delete S.notes[S.tone];
    save(); compose(S.tone);
  }
  function viewPhoto() {
    var n = names(), gift = bestGift();
    return screen('photo', 'Give us ' + n.his + ' best pic to paint from', 'We paint ' + esc(n.dog) + ' on the ' + GIFT_NAME[gift] + ' first, then show it on every gift.',
      '<label class="hsj-drop" data-hsj-drop>' + '<input type="file" accept="image/*" class="hsj-file" data-hsj-file>' +
      '<span class="hsj-drop__img" data-hsj-preview>' + (photoURL ? '<img src="' + esc(photoURL) + '" alt="Your photo">' : '<span class="hsj-drop__ico">' + ICON.camera + '</span>') + '</span>' +
      '<span class="hsj-drop__text">' + (photoURL ? 'Choose a different photo' : 'Take or choose a photo') + '</span><span class="hsj-drop__sub">It stays on your phone until you choose a gift.</span></label>' +
      '<p class="hsj-photo-note" data-hsj-photo-note role="status"></p>' +
      '<button type="button" class="hsj-text-btn" data-hsj-override hidden>It\'s ' + esc(n.dog) + '. Use this photo.</button>' +
      '<ul class="hsj-tips"><li>' + ICON.face + esc(n.possessive) + ' face clearly in view</li><li>' + ICON.light + 'Good daylight</li><li>' + ICON.one + 'Just ' + esc(n.dog) + ', no other dogs</li></ul>',
      '<button type="button" class="hsj-btn" data-hsj-choose-photo><span>Choose a photo</span>' + ICON.camera + '</button>');
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
    if (t.hasAttribute('data-hsj-rewrite')) { if (!t.disabled) rewriteNote(); return; }
    if (t.hasAttribute('data-hsj-choose-photo')) { var f = app.querySelector('[data-hsj-file]'); if (f) f.click(); return; }
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
    // a tap answers the question: the choice shows for a beat, then the next screen
    app.querySelectorAll('[data-hsj-pick="' + group + '"]').forEach(function (b) { var on = b.getAttribute('data-v') === v; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    setTimeout(function () { if (stepFromURL() === step) go(nextOf(step)); }, 180);
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

  /* Helio lays its header over the home page's first section (a transparent header), and the
     journey's first screen used to start under the logo and menu (live-gate, 30 Oct: the headline
     at 32px under a header that ends at 92px). Pad the section by the overlap, as hs2.js does for
     the old hero. In a step (hsj-focus) the store header is hidden, so the padding comes off. */
  function clearHeader() {
    if (!root) return;
    var box = root.closest('.shopify-section') || root;
    var header = document.querySelector('.header-section, header.shopify-section');
    var focus = document.documentElement.classList.contains('hsj-focus');
    var want = 0;
    if (header && !focus && window.scrollY <= 10) {
      // a box's own padding never moves its top edge, so this measures cleanly every time
      var top = box.getBoundingClientRect().top;
      var bottom = header.getBoundingClientRect().bottom;
      var rows = header.querySelectorAll('header-component, .header__row, .header__underlay');
      Array.prototype.forEach.call(rows, function (el) { var r = el.getBoundingClientRect(); if (r.width && r.height) bottom = Math.max(bottom, r.bottom); });
      bottom = Math.min(bottom, top + 200);
      if (bottom > top) want = Math.ceil(bottom - top + 8);
    } else if (!focus) {
      return; // scrolled: keep what was measured at the top
    }
    if (Math.abs(want - (parseFloat(box.style.paddingTop) || 0)) > 1) box.style.paddingTop = want ? want + 'px' : '';
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
    if (q.get('gift')) {
      var w = q.get('gift') === 'portrait' ? 'print' : q.get('gift');
      if (/^(mug|blanket|print)$/.test(w)) { S.wanted = w; save(); }
      track('from_gift', { gift: q.get('gift') });
    }
    var s = stepFromURL();
    if (s && !allowed(s)) go(s, true); else render(s);
    document.documentElement.classList.remove('hsj-routed');
    clearHeader();
    window.addEventListener('resize', clearHeader);
    window.addEventListener('load', clearHeader);
    // entering or leaving a step toggles hsj-focus on <html>, which shows or hides the header
    if (window.MutationObserver) new MutationObserver(clearHeader).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
