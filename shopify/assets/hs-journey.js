/* The Heartside journey (sections/hs-journey.liquid). Rebuilt on 29 Oct after the phone batch
   (Krish: "Literally nothing works functionally and the user flow is a 0 out of 10"), not patched.
   His rules: every screen does one thing, nothing is asked twice, taps instead of typing, and the
   order is the dog, then a text-only profile to confirm (the words and the look), then the photo,
   which paints on the best-fit gift, then the gifts on the real products (the product pages).

   Screens here: the hook (no step), ?step=about, ?step=profile, ?step=photo. Each is a real
   address, so Back, Forward and reload land where the buyer expects; a step the answers don't
   reach yet falls back to the furthest one they do.

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
  var COMPOSE_VERSION = 'journey-v1';
  var TONES = ['sentimental', 'warm', 'hilarious'];
  var TONE_LABEL = { sentimental: 'Sentimental', warm: 'Warm', hilarious: 'Hilarious' };
  var STEPS = ['about', 'profile', 'photo'];
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
      { id: 'toy', q: 'A favorite toy or treat to paint in', optional: true, opts: [['a tennis ball', 'Tennis ball'], ['a squeaky toy', 'Squeaky toy'], ['a rope toy', 'Rope toy'], ['a stuffed toy', 'Stuffed toy'], ['a bone', 'A bone'], ['', 'None']] },
      { id: 'accessory', q: 'Anything ' + n.dog + ' wears', optional: true, opts: [['a collar', 'A collar'], ['a bandana', 'A bandana'], ['a bow', 'A bow'], ['a sweater', 'A sweater'], ['', 'Nothing']] }
    ];
  }
  var RELS = [['partner', 'My partner'], ['mom', 'Mom'], ['dad', 'Dad'], ['friend', 'A friend'], ['self', 'Me']];
  var REL_NAME = { partner: 'your partner', mom: 'Mom', dad: 'Dad', friend: 'your friend', self: 'you' };
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
    return { dog: '', breed: '', breedId: '', pro: '', rel: '', home: null, spot: null, together: null, meaning: null,
      toy: null, accessory: null, tone: 'warm', style: 'screenprint', notes: {}, request: null, calls: 0, session: '',
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
    var dog = nameCase(S.dog) || 'Your dog';
    return { dog: dog, possessive: S.dog ? possessive(dog) : 'Their', them: REL_NAME[S.rel] || 'you', self: S.rel === 'self',
      she: S.pro === 'he' ? 'he' : S.pro === 'she' ? 'she' : 'they' };
  }
  function track(name, data) { try { if (window.Shopify && window.Shopify.analytics && window.Shopify.analytics.publish) window.Shopify.analytics.publish('hsj_' + name, data || {}); } catch (e) { /* analytics off */ } }

  function aboutDone() {
    var n = nameCase(S.dog);
    return !!(n && n.length <= NAME_MAX && S.breed && S.rel && S.home && S.spot && S.together && S.meaning);
  }
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
    var answers = ['home', 'spot', 'together', 'meaning'].map(function (id) { return { id: id, chip: S[id] || null, label: '', typed: null }; });
    return { dog: dog, recipient: { name: n.self ? '' : n.them, relation: S.rel === 'self' ? 'self' : S.rel }, answers: answers,
      current_lines: scripted(), default_gift: bestGift(), note_tone: tone, session: sessionId() };
  }
  function answersKey() { return JSON.stringify([COMPOSE_VERSION, S.dog, S.breed, S.pro, S.rel, S.home, S.spot, S.together, S.meaning]); }
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
      if (ok && S.notesKey === key) S.notes[req.tone] = { lines: j.lines, voice: typeof j.voice === 'string' ? j.voice : '', gift: j.recommended_gift || '', source: j.source || '' };
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
    st.person = n.self ? 'Me' : n.them.replace(/^your /, '');
    st.hs3_lines = { home: l.home, spot: l.spot, together: l.together, meaning: l.meaning };
    st.hs3_mug_lines = st.hs3_lines;
    st.hs3_copy_owner = 'generated';
    st.hs3_photo_t = S.hasPhoto ? S.photoT : 0;
    var kinds = {};
    ['mug', 'blanket', 'print'].forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) kinds[x.handle] = g; });
    st.hs3_kinds = kinds;
    st.hs_answers = ['Dog: ' + n.dog + ' (' + n.she + ')', 'For: ' + (REL_NAME[S.rel] || ''), 'home: ' + S.home, 'spot: ' + S.spot, 'together: ' + S.together, 'meaning: ' + S.meaning, 'tone: ' + S.tone].join(' | ').slice(0, 480);
    if (window.HSArtworkProfile) st.hs3_art_profile = window.HSArtworkProfile.fromChat(S);
    st.hs3_energy = '';
    try { var r = breedRow(); if (r && window.HSArtworkEngine) st.hs3_energy = window.HSArtworkEngine.energyFor(r) || ''; } catch (e) { /* unknown breed: no energy */ }
    st.hs3_art_choices = { style: S.style, tone: S.tone };
    st.hs_ship_to = n.self ? 'Me (the buyer)' : (REL_NAME[S.rel] || 'Them');
    st.hs_journey = { t: Date.now(), gift: gift, tone: S.tone, style: S.style, photoT: S.hasPhoto ? S.photoT : 0, voice: (note() || {}).voice || '' };
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

  /* ------------------------------------------------------------------ views */
  function pill(group, value, label, on) {
    return '<button type="button" class="hsj-pill' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-hsj-pick="' + esc(group) + '" data-v="' + esc(value) + '">' + esc(label) + '</button>';
  }
  function head(title, sub) {
    return '<header class="hsj-head"><button type="button" class="hsj-back" data-hsj-back aria-label="Back">←</button><div><h2 class="hsj-h2">' + title + '</h2>' + (sub ? '<p class="hsj-small">' + sub + '</p>' : '') + '</div></header>';
  }
  function viewAbout() {
    var n = names(), gs = groups(n), html = head('About your dog', 'A few taps. Nothing to type but the name.');
    html += '<div class="hsj-field"><label class="hsj-q" for="hsj-name">Your dog\'s name</label><input id="hsj-name" class="hsj-input" data-hsj-name type="text" inputmode="text" autocomplete="off" autocapitalize="words" maxlength="40" value="' + esc(S.dog) + '" placeholder="Mowgli">' +
      '<p class="hsj-small hsj-hint" data-hsj-name-hint aria-live="polite"></p></div>';
    // each group shows once the one before it is answered, so the screen grows one tap at a time
    var open = !!nameCase(S.dog);
    var block = function (q, inner, id) { return '<fieldset class="hsj-group" data-hsj-group="' + id + '"><legend class="hsj-q">' + q + '</legend><div class="hsj-pills">' + inner + '</div></fieldset>'; };
    if (open) {
      var other = S.breed && BREEDS.indexOf(S.breed) === -1 && S.breed !== 'Mixed';
      html += block('Breed', BREEDS.map(function (b) { return pill('breed', b, b, S.breed === b); }).join('') + pill('breed', 'Mixed', 'Mixed or not sure', S.breed === 'Mixed') + pill('breed', '__other', other ? S.breed : 'Another breed', other || S.breedOther), 'breed') +
        (S.breedOther ? '<div class="hsj-field"><input class="hsj-input" data-hsj-breed-search type="search" autocomplete="off" placeholder="Start typing the breed" aria-label="Search breeds"><div class="hsj-pills" data-hsj-breed-list></div></div>' : '');
      open = !!S.breed;
    }
    if (open) { html += block(n.dog + ' is a…', pill('pro', 'he', 'Boy', S.pro === 'he') + pill('pro', 'she', 'Girl', S.pro === 'she'), 'pro'); open = !!S.pro; }
    if (open) { html += block('Who is the gift for?', RELS.map(function (r) { return pill('rel', r[0], r[1], S.rel === r[0]); }).join(''), 'rel'); open = !!S.rel; }
    gs.forEach(function (g) {
      if (!open) return;
      html += block(esc(g.q), g.opts.map(function (o) { return pill(g.id, o[0], o[1], S[g.id] === o[0] && S[g.id] !== null); }).join(''), g.id);
      open = g.optional ? true : !!S[g.id];
    });
    html += '<div class="hsj-dock"><button type="button" class="hsj-btn" data-hsj-next="profile"' + (aboutDone() ? '' : ' disabled') + '>Show me ' + esc(n.dog) + '</button></div>';
    return html;
  }
  function styles() {
    var R = window.HSArtworkEngine && window.HSArtworkEngine.recipes && window.HSArtworkEngine.recipes.styles;
    var ids = R ? Object.keys(R) : ['screenprint', 'collage', 'painterly', 'comic', 'ink', 'cinematic'];
    // the two styles with approved example paintings lead (design/examples-2026-10-28)
    ids.sort(function (a, b) { return (cfg.examples && cfg.examples[b] ? 1 : 0) - (cfg.examples && cfg.examples[a] ? 1 : 0); });
    return ids.map(function (id) { return { id: id, label: R && R[id] ? R[id].label : id }; });
  }
  function viewProfile() {
    var n = names(), html = head('This is ' + esc(n.dog) + '.', 'Check the words and the look. Nothing is painted yet.');
    html += '<section class="hsj-card hsj-profile" aria-labelledby="hsj-words-h">' +
      '<p class="hsj-label" id="hsj-words-h">In ' + esc(n.possessive) + ' words</p>' +
      '<div class="hsj-tone" role="group" aria-label="Tone of the words">' + TONES.map(function (t) {
        return '<button type="button" class="hsj-seg' + (S.tone === t ? ' is-on' : '') + '" aria-pressed="' + (S.tone === t) + '" data-hsj-tone="' + t + '">' + TONE_LABEL[t] + '</button>';
      }).join('') + '</div>' +
      '<div class="hsj-note" data-hsj-note aria-live="polite"></div>' +
      '</section>';
    html += '<section class="hsj-card" aria-labelledby="hsj-style-h"><p class="hsj-label" id="hsj-style-h">How ' + esc(n.dog) + ' is painted</p><div class="hsj-styles">' + styles().map(function (s) {
      var src = cfg.examples && cfg.examples[s.id];
      return '<button type="button" class="hsj-style' + (S.style === s.id ? ' is-on' : '') + '" aria-pressed="' + (S.style === s.id) + '" data-hsj-style="' + esc(s.id) + '">' +
        (src ? '<span class="hsj-style__art"><img src="' + esc(src) + '" alt="" loading="lazy" width="300" height="450"><span class="hsj-tag">Example</span></span>' : '<span class="hsj-style__art hsj-style__art--plain hsj-style--' + esc(s.id) + '" aria-hidden="true"></span>') +
        '<span class="hsj-style__name">' + esc(s.label) + '</span></button>';
    }).join('') + '</div></section>';
    html += '<div class="hsj-dock"><button type="button" class="hsj-btn" data-hsj-next="photo">Paint ' + esc(n.dog) + '</button></div>';
    return html;
  }
  // the note box keeps one size whatever is in it, so the tone never moves the page (29 Oct)
  function paintNote() {
    var box = app && app.querySelector('[data-hsj-note]');
    if (!box) return;
    var n = names(), c = note(), l = lines(), busy = !!(S.request && S.request.tone === S.tone);
    box.classList.toggle('is-busy', busy);
    box.innerHTML =
      (c && c.voice ? '<p class="hsj-voice">' + esc(c.voice) + '</p>' : '') +
      '<ul class="hsj-lines">' + ['home', 'spot', 'together'].map(function (k) { return '<li>' + esc(l[k]) + '</li>'; }).join('') + '</ul>' +
      '<div class="hsj-gift-line"><span class="hsj-label">On the gift</span><p class="hsj-print">' + esc(l.meaning) + '</p><p class="hsj-sign">Love, ' + esc(n.dog) + '</p></div>' +
      (busy ? '<p class="hsj-writing" role="status">Writing it ' + TONE_LABEL[S.tone].toLowerCase() + '…</p>' : '');
    // the box only ever grows to the tallest words it has held, so switching back never jumps
    var h = box.getBoundingClientRect().height;
    if (h > (paintNote.max || 0)) { paintNote.max = h; box.style.minHeight = Math.ceil(h) + 'px'; }
  }
  function viewPhoto() {
    var n = names(), gift = bestGift();
    var html = head('Now a photo of ' + esc(n.dog) + '.', 'One clear photo: ' + esc(n.possessive) + ' face, good light, just ' + esc(n.dog) + '.');
    html += '<label class="hsj-drop" data-hsj-drop>' +
      '<input type="file" accept="image/*" class="hsj-file" data-hsj-file>' +
      '<span class="hsj-drop__img" data-hsj-preview>' + (photoURL ? '<img src="' + esc(photoURL) + '" alt="Your photo">' : '<span class="hsj-drop__plus" aria-hidden="true">+</span>') + '</span>' +
      '<span class="hsj-drop__text">' + (photoURL ? 'Choose a different photo' : 'Choose or take a photo') + '</span></label>' +
      '<p class="hsj-small hsj-photo-note" data-hsj-photo-note role="status"></p>' +
      '<button type="button" class="hsj-link" data-hsj-override hidden>It\'s ' + esc(n.dog) + '. Use this photo.</button>' +
      '<p class="hsj-small">We paint ' + esc(n.dog) + ' on the ' + GIFT_NAME[gift] + ' first, then show you every gift. The photo stays on your phone until then.</p>';
    return html;
  }

  /* ------------------------------------------------------------- the address */
  function stepFromURL() {
    var q = new URLSearchParams(window.location.search), s = q.get('step') || '';
    return STEPS.indexOf(s) === -1 ? '' : s;
  }
  function allowed(step) {
    if (step === 'profile' || step === 'photo') return aboutDone();
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
    if (!step) {
      var resume = root.querySelectorAll('[data-hsj-resume]');
      resume.forEach(function (el) { el.hidden = !S.dog; });
      return;
    }
    app.innerHTML = '<div class="hsj__screen" data-hsj-screen="' + step + '">' + (step === 'about' ? viewAbout() : step === 'profile' ? viewProfile() : viewPhoto()) + '</div>';
    if (step === 'profile') { paintNote.max = 0; paintNote(); compose(S.tone); }
    if (step === 'about') { var i = app.querySelector('[data-hsj-name]'); nameHint(i); }
    var top = root.getBoundingClientRect().top + window.pageYOffset - 8;
    if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'auto' });
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
    if (t.hasAttribute('data-hsj-go')) { e.preventDefault(); track('start', {}); warm(); go(t.getAttribute('data-hsj-go')); return; }
    if (t.hasAttribute('data-hsj-resume-go')) { go(aboutDone() ? 'profile' : 'about'); return; }
    if (t.hasAttribute('data-hsj-restart')) { S = fresh(); save(); try { window.sessionStorage.removeItem(HS2); } catch (x) { /* fine */ } go('about'); return; }
    if (t.hasAttribute('data-hsj-back')) { if (window.history.length > 1) window.history.back(); else go(STEPS[STEPS.indexOf(stepFromURL()) - 1] || ''); return; }
    if (t.hasAttribute('data-hsj-pick')) { pick(t.getAttribute('data-hsj-pick'), t.getAttribute('data-v')); return; }
    if (t.hasAttribute('data-hsj-tone')) { setTone(t.getAttribute('data-hsj-tone')); return; }
    if (t.hasAttribute('data-hsj-style')) {
      S.style = t.getAttribute('data-hsj-style'); save();
      app.querySelectorAll('[data-hsj-style]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      track('style', { style: S.style }); return;
    }
    if (t.hasAttribute('data-hsj-next')) { if (!t.disabled) { warm(); go(t.getAttribute('data-hsj-next')); } return; }
    if (t.hasAttribute('data-hsj-override')) { t.hidden = true; if (pendingFile) usePhoto(pendingFile, true); return; }
  }
  function pick(group, v) {
    if (group === 'breed') {
      if (v === '__other') { S.breedOther = true; S.breed = ''; save(); render('about'); var f = app.querySelector('[data-hsj-breed-search]'); if (f) f.focus(); return; }
      S.breedOther = false; S.breed = v;
    } else if (group === 'toy' || group === 'accessory') S[group] = v;
    else S[group] = v;
    save(); warm();
    var before = app.querySelectorAll('[data-hsj-group]').length;
    render('about');
    // bring the next question into view, without a jump for reduced motion
    var all = app.querySelectorAll('[data-hsj-group]');
    if (all.length > before) { var next = all[all.length - 1]; if (next.scrollIntoView) next.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
    else { var btn = app.querySelector('[data-hsj-next]'); if (aboutDone() && btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
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
    var t = e.target;
    if (t.hasAttribute('data-hsj-name')) {
      var had = !!nameCase(S.dog);
      S.dog = t.value.slice(0, 40); save(); nameHint(t);
      // the first letter opens the breed question; later letters just update the button
      if (!had && nameCase(S.dog)) { render('about'); var i = app.querySelector('[data-hsj-name]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
      var btn = app.querySelector('[data-hsj-next]'); if (btn) { btn.disabled = !aboutDone(); btn.textContent = 'Show me ' + names().dog; }
      return;
    }
    if (t.hasAttribute('data-hsj-breed-search')) {
      var list = app.querySelector('[data-hsj-breed-list]'), B = window.HSBreeds, q = t.value.trim();
      if (!list) return;
      list.innerHTML = q.length < 2 || !B ? '' : B.suggest(q, 6).map(function (r) { return pill('breed', r.id === 'mixed-breed' ? 'Mixed' : r.name, r.name, false); }).join('');
    }
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
