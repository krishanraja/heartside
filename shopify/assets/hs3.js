/* Heartside v3: gifts from your dog. Loaded (deferred) by sections/hs3-chat.liquid.
   The chat with Biscuit, the reveal, choose gifts and the share card, from the approved
   prototype (design/prototype-v3/Main.dc.html) and docs/V3-GIFTS-FROM-YOUR-DOG.md.
   Biscuit's lines and every gift line for a chip answer are the prototype's, word for word.
   Chip answers never call the AI. "Something else" sends the typed words to Krish's n8n
   (two webhooks, section 5.4), which answers in the JSON of section 5.2 or not at all; any
   slow or failed call falls back to the buyer's own words, so the chat never waits long.
   State lives in sessionStorage ("hs3-gift"), so a reload or a product page loses nothing.
   The photo stays on the device (IndexedDB, the same store hs2.js hands to Teeinblue).
   Never use import() here: Shopify's minifier breaks it (docs/HANDOFF.md 5a). */
(function () {
  'use strict';
  if (window.__hs3) return;
  window.__hs3 = true;

  var KEY = 'hs3-gift';
  var HS2 = 'hs2-review';
  var QKEY = 'hs2-queue';
  var MAX_CALLS = 8;
  var TYPED_MS = 3000, COMPOSE_MS = 6000;
  var GIFTS = ['mug', 'blanket', 'print', 'ornament'];
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var root, frame, cfg = {}, S = load(), photoURL = null, timers = [];
  var ui = { prefix: '', echo: '', thinking: false, typing: false, revealN: 0, editing: false, flagged: '', inked: {} };

  /* ------------------------------------------------------------------ state */
  function fresh() {
    return { screen: 'hero', step: 1, dog: '', pro: 'she', rec: '', rel: 'partner',
      home: null, follow: null, spot: null, together: null, meaning: null,
      typed: {}, ai: {}, fu: null, edits: {}, composed: null, gift: null, tabbed: false,
      sel: {}, shipTo: 'rec', calls: 0, session: '', hasPhoto: false };
  }
  function load() {
    var s = null;
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    var f = fresh();
    if (!s || typeof s !== 'object') return f;
    Object.keys(f).forEach(function (k) { if (!(k in s)) s[k] = f[k]; });
    return s;
  }
  function save() {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
    shareWithBridge();
  }
  function set(o) { Object.keys(o).forEach(function (k) { S[k] = o[k]; }); save(); render(); }
  function sessionId() {
    if (!S.session) {
      var a = '';
      try { var b = new Uint8Array(12); window.crypto.getRandomValues(b); for (var i = 0; i < b.length; i++) a += ('0' + b[i].toString(16)).slice(-2); } catch (e) { a = String(Date.now()) + String(Math.random()).slice(2, 10); }
      S.session = 'hs' + a; save();
    }
    return S.session;
  }

  /* ---------------------------------------------------------------- helpers */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(x, d) { x = String(x || '').trim(); if (!x) return d; return x.charAt(0).toUpperCase() + x.slice(1); }
  function names() {
    return { dog: cap(S.dog, 'Your dog'), rec: cap(S.rec, 'them'), she: S.pro === 'he' ? 'he' : 'she', her: S.pro === 'he' ? 'him' : 'her' };
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }
  function track(name, data) {
    try { if (window.Shopify && window.Shopify.analytics && window.Shopify.analytics.publish) window.Shopify.analytics.publish('hs3_' + name, data || {}); } catch (e) { /* analytics off */ }
  }
  var STEP_NAMES = { 1: 'dog', 2: 'person', 3: 'home', 4: 'spot', 5: 'together', 6: 'meaning' };
  function stepEvent(action, extra) {
    var d = { step: STEP_NAMES[S.step] || String(S.step), action: action };
    if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
    track('step', d);
  }

  /* ------------------------------------------------------------- the words
     Every line for a chip answer, word for word from the prototype (lineFor, homeQ). */
  function homeQ(n) {
    return {
      door: { q: 'At the door! Every day? Even weekends? (I would.)', chips: [['weekends', 'Even weekends'], ['weekdays', 'Weekdays'], ['hears', 'Hears the car first']] },
      toy: { q: 'Ooh, a toy. The same one every time?', chips: [['same', 'Same one, always'], ['closest', 'Whatever is closest'], ['shoe', 'A shoe, honestly']] },
      spin: { q: 'Spins! How many circles are we talking?', chips: [['few', 'Two or three'], ['many', 'Too many to count'], ['dizzy', 'Until ' + n.she + ' is dizzy']] },
      cool: { q: 'Plays it cool? I could never. And then?', chips: [['follows', 'Follows ' + n.rec + ' everywhere'], ['lap', 'Climbs onto ' + n.rec + "'s lap"], ['sighs', 'Sighs until ' + n.rec + ' looks']] }
    };
  }
  var H = {
    door: { weekends: 'Waits at the door for you, weekends too.', weekdays: 'Waits at the door for you every weekday.', hears: 'Hears your car before anyone else does.' },
    toy: { same: 'Brings you the same toy every time.', closest: 'Brings you a present every time you get home.', shoe: 'Greets you at the door with one of your shoes.' },
    spin: { few: 'Does a happy little spin when you get home.', many: 'Spins in circles every time you get home.', dizzy: 'Spins until dizzy every time you get home.' },
    cool: { follows: 'Plays it cool, then follows you everywhere.', lap: 'Plays it cool, then climbs onto your lap.', sighs: 'Plays it cool, then sighs until you look.' }
  };
  var BASE = { door: 'Waits at the door for you.', toy: 'Brings you a toy when you get home.', spin: 'Spins in circles when you get home.', cool: 'Plays it cool when you get home.' };
  var SP = { feet: 'Sleeps on your feet.', bed: 'Steals your side of the bed.', couch: 'Saves your spot on the couch.', anywhere: 'Goes wherever you go.', skip: 'Never far from you.' };
  var TG = { walk: 'Lives for our morning walks.', coffee: 'Keeps you company over coffee.', movie: 'Saves you a seat for movie night.', naps: 'Naps best when you are there.', car: "Will ride anywhere, as long as it's with you.", skip: 'Likes any time with you best.' };
  var ME = { shadow: 'Your shadow, always.', best: 'Your best friend, no contest.', hard: 'Here for every hard day.', boss: 'Runs the house. Loves you most.', skip: 'Yours, always.' };
  var REACT4 = { weekends: "Weekends too. Now that's a good dog.", weekdays: 'Keeps office hours. Smart dog.', hears: 'Hears the car first. We always do.', same: 'A signature toy. Very classy.', closest: 'Any present counts. Every dog knows this.', shoe: 'A shoe is a great present. Ask any dog.', few: 'A tasteful spin. Respect.', many: 'Full spin cycle! My kind of dog.', dizzy: 'Spins till dizzy. Total commitment.', follows: 'Too cool, then can’t stay away. Classic dog.', lap: 'The slow lap move. A classic.', sighs: 'The big sigh. Works every time.' };
  var REACT5 = { feet: 'A built-in foot warmer. Good work.', bed: "Their side of the bed? Bold. I'd do the same.", couch: 'The couch is sacred. Every dog knows.', anywhere: 'A true shadow. Very good dog.', skip: "That's okay. On we go." };
  var REACT6 = { walk: 'Walks! Best part of the day. Ask any dog.', coffee: 'Coffee time. Is there toast? Asking for a friend.', movie: 'Couch and a movie. The dream.', naps: "Naps! Now we're talking.", car: 'Car rides! Ears out the window, I hope.', skip: 'No worries at all.' };
  var GN = { mug: 'The Morning Mug', blanket: 'The Couch Blanket', print: 'The Framed Print', ornament: 'The Tree Ornament' };
  var SHORT = { mug: 'Mug', blanket: 'Blanket', print: 'Print', ornament: 'Ornament' };
  var DS = { mug: '11 oz ceramic, blush inside', blanket: '50 by 60 in sherpa, so soft', print: '12 by 18 in, black, white or oak frame', ornament: 'Ceramic, for the tree' };
  var CATCH = "I didn't quite catch that one. Try again, or pick one of these?";

  function lineFor(key) {
    if (S.edits[key] != null) return S.edits[key];
    if (S.composed && S.composed.lines && S.composed.lines[key]) return S.composed.lines[key];
    if (key === 'home') {
      if (!S.home) return null;
      if (S.home === 'skip') return 'Always happy to see you.';
      if (S.home === 'typed') return (S.ai.home_follow && S.ai.home_follow.line) || (S.ai.home && S.ai.home.line) || '';
      if (!S.follow) return BASE[S.home];
      return H[S.home][S.follow] || BASE[S.home];
    }
    var v = S[key];
    if (!v) return null;
    if (v === 'typed') return (S.ai[key] && S.ai[key].line) || '';
    return ({ spot: SP, together: TG, meaning: ME })[key][v] || null;
  }
  function allLines() { var o = {}; ['home', 'spot', 'together', 'meaning'].forEach(function (k) { o[k] = lineFor(k) || ''; }); return o; }
  function recGift() {
    if (S.composed && GIFTS.indexOf(S.composed.gift) !== -1) return S.composed.gift;
    var t = S.together;
    if (t === 'movie' || t === 'naps') return 'blanket';
    if (t === 'walk' || t === 'coffee') return 'mug';
    // car rides, or anything else (a typed answer, "Not sure"): the framed print (spec 3)
    return 'print';
  }
  function giftKeys(g) {
    if (g === 'mug') return ['home', 'spot', 'meaning'];
    if (g === 'ornament') return ['meaning'];
    return ['home', 'spot', 'together', 'meaning'];
  }
  function reasonFor(g, n) {
    if (S.composed && S.composed.reason && g === S.composed.gift) return S.composed.reason;
    return {
      mug: 'Walks start with coffee. I would know. So ' + n.dog + ' gets a spot in ' + n.rec + "'s mug every morning.",
      blanket: 'For the couch they share. Warm, soft, and ' + n.dog + ' is already on it.',
      print: 'For the wall by the door, so ' + n.rec + ' sees ' + n.dog + ' the minute they get home.',
      ornament: 'For the tree. ' + n.dog + ' comes out every December, right where ' + n.rec + ' will see.'
    }[g];
  }

  /* ---------------------------------------------------------------- the AI */
  function canCall(url) { return !!(cfg.ai && url && S.calls < MAX_CALLS && window.fetch); }
  function callAI(url, body, ms) {
    if (!canCall(url)) return Promise.resolve(null);
    S.calls++; save();
    body.session = sessionId();
    var ctrl = window.AbortController ? new AbortController() : null;
    var done = false;
    return new Promise(function (resolve) {
      var t = setTimeout(function () { if (done) return; done = true; if (ctrl) ctrl.abort(); track('ai', { call: body.step || 'compose', result: 'timeout' }); resolve(null); }, ms);
      window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', mode: 'cors' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (done) return; done = true; clearTimeout(t); track('ai', { call: body.step || 'compose', result: j ? 'ok' : 'error' }); resolve(j); })
        .catch(function () { if (done) return; done = true; clearTimeout(t); track('ai', { call: body.step || 'compose', result: 'error' }); resolve(null); });
    });
  }
  /* The n8n code runner sleeps when the site is quiet, and waking it costs about 1.5 s. A
     tiny {"warm":true} call (no AI, no budget) wakes it, and opens the connection, while the
     buyer is still reading or typing, so the real call answers in about a second. */
  var warmed = {};
  function warm(url) {
    if (!cfg.ai || !url || !window.fetch) return;
    var now = Date.now();
    if (warmed[url] && now - warmed[url] < 45000) return;
    warmed[url] = now;
    try { window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"warm":true}', credentials: 'omit', mode: 'cors', keepalive: true }).catch(function () {}); } catch (e) { /* old browser */ }
  }
  function ownWords(t) {
    t = String(t || '').replace(/[\u2014\u2013]/g, ', ').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
    if (t.length > 43) t = t.slice(0, 43).replace(/[\s,]+\S*$/, '').replace(/(\s+(the|a|an|and|or|but|of|to|in|on|at|by|for|from|with|near|under|over|into|onto|is|was|my|your|our|his|her|their))+$/i, '');
    if (!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1) + '.';
  }
  function clip(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n) : t; }
  var GRIEF = /\b(died|dead|death|passed away|put down|put to sleep|rainbow bridge|cancer|funeral|in heaven)\b/i;
  var PROFANE = /\b(fuck|shit|bitch|cunt|asshole|bastard|whore|slut)\w*/i;
  // the typed-answer call (5.2); resolves to { reaction, line, follow_up, flags } or a fallback
  function typedAnswer(step, question, text, previous) {
    var n = names();
    var body = { step: step, question: question, typed_text: clip(text, 140), previous_line: previous || '', dog: { name: n.dog, pronoun: n.she }, recipient: { name: S.rec ? n.rec : '', relation: S.rel } };
    return callAI(cfg.typedUrl, body, TYPED_MS).then(function (r) {
      if (r && typeof r === 'object' && (typeof r.line === 'string' || (r.flags && r.flags.length))) {
        return {
          reaction: clip(r.reaction, 70), line: clip(r.line, 44),
          follow_up: r.follow_up && r.follow_up.question ? { question: clip(r.follow_up.question, 70), chips: (r.follow_up.chips || []).slice(0, 3).map(function (c) { return clip(c, 24); }) } : null,
          flags: Array.isArray(r.flags) ? r.flags : [], ai: true
        };
      }
      // no AI (off, slow, failed or over budget): the buyer's own words, and the scripted "Tell me more?"
      var flags = GRIEF.test(text) ? ['grief'] : PROFANE.test(text) ? ['profanity'] : [];
      return { reaction: 'Tell me more?', line: ownWords(text) || previous || '', follow_up: step === 'home' ? { question: 'Tell me more?', chips: [] } : null, flags: flags, ai: false };
    });
  }
  function anyTyped() { return Object.keys(S.typed).some(function (k) { return !!S.typed[k]; }); }
  function compose() {
    if (!anyTyped()) return;
    var n = names();
    var answers = [];
    var push = function (id, chip, label) { answers.push({ id: id, chip: chip && chip !== 'typed' && chip !== 'skip' ? chip : null, label: label || '', typed: S.typed[id] || null }); };
    push('home', S.home, ''); push('home_follow', S.follow, ''); push('spot', S.spot, ''); push('together', S.together, ''); push('meaning', S.meaning, '');
    var asked = S.composeAsked = (S.composeAsked || 0) + 1;
    callAI(cfg.composeUrl, { dog: { name: n.dog, pronoun: n.she }, recipient: { name: n.rec, relation: S.rel }, answers: answers, current_lines: allLines(), default_gift: recGift() }, COMPOSE_MS).then(function (r) {
      if (!r || !r.lines || asked !== S.composeAsked) return;
      var lines = {};
      ['home', 'spot', 'together', 'meaning'].forEach(function (k) { var l = r.lines[k]; if (typeof l === 'string' && l && l.length <= 44) lines[k] = l; });
      S.composed = { lines: lines, gift: GIFTS.indexOf(r.recommended_gift) !== -1 ? r.recommended_gift : null, reason: typeof r.reason === 'string' && r.reason.length <= 140 ? r.reason : '' };
      if (S.composed.gift && !S.tabbed && S.screen === 'reveal') S.gift = S.composed.gift;
      save();
      if (S.screen === 'reveal' && !ui.editing) render();
    });
  }

  /* ----------------------------------------------------------------- photo */
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
  function usePhoto(file) {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(file);
    S.hasPhoto = true; save();
    document.querySelectorAll('[data-hs3-photo]').forEach(function (img) { img.src = photoURL; });
  }
  function restorePhoto() {
    return idb('readonly', function (st) { return st.get(PHOTO); }).then(function (rec) {
      if (rec && rec.file && Date.now() - rec.t < 3 * 864e5) usePhoto(rec.file);
    }).catch(function () {});
  }
  // never a stranger's dog on the buyer's gift: no photo yet shows a paw placeholder
  function photoSrc() { return photoURL || ''; }

  /* the product pages fill Teeinblue from hs2's state (hs2.js, the bridge): the names, the
     gift's words in hs3_lines, which gift each product is, and the order's hidden answers */
  function shareWithBridge() {
    if (!S.dog && !S.rec) return;
    var st = {};
    try { st = JSON.parse(window.sessionStorage.getItem(HS2) || '{}') || {}; } catch (e) { st = {}; }
    var n = names();
    st.dog = S.dog ? n.dog : '';
    st.person = S.rec ? n.rec : '';
    st.hs3_lines = allLines();
    var kinds = {};
    GIFTS.forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) kinds[x.handle] = g; });
    st.hs3_kinds = kinds;
    st.hs_answers = answerSummary();
    st.hs_ship_to = S.shipTo === 'me' ? 'Me (the buyer)' : (S.rec ? n.rec : 'Them');
    try { window.sessionStorage.setItem(HS2, JSON.stringify(st)); } catch (e) { /* private mode */ }
  }
  function answerSummary() {
    var n = names(), parts = [];
    var label = function (key, v) { if (!v) return ''; if (v === 'skip') return 'Not sure'; if (v === 'typed') return 'typed: "' + (S.typed[key] || '') + '"'; return v; };
    parts.push('Dog: ' + n.dog + ' (' + n.she + ')');
    parts.push('For: ' + n.rec + ' (' + S.rel + ')');
    [['home', S.home], ['home_follow', S.follow], ['spot', S.spot], ['together', S.together], ['meaning', S.meaning]].forEach(function (p) {
      var l = label(p[0], p[1]); if (l) parts.push(p[0] + ': ' + l);
    });
    if (S.composed) parts.push('AI tidied the lines');
    return parts.join(' | ').slice(0, 480);
  }

  /* ------------------------------------------------------------------ views */
  var BISCUIT = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g class="hs3-head"><path d="M34 120 C 34 96, 44 86, 58 84 L 74 84 C 84 88, 88 100, 88 120 Z" fill="#7A4027"/><rect x="44" y="84" width="40" height="7" rx="3.5" fill="#F0C0C0"/><ellipse cx="58" cy="58" rx="30" ry="27" fill="#8A4A2B"/><ellipse cx="90" cy="66" rx="22" ry="13" fill="#95553A"/><ellipse cx="95" cy="70" rx="15" ry="8.5" fill="#CFC4BA"/><ellipse cx="110" cy="62" rx="6.5" ry="5.5" fill="#121010"/><circle cx="70" cy="50" r="4" fill="#121010"/><circle cx="71.3" cy="48.6" r="1.2" fill="#FFFDF9"/><path d="M64 42 Q 70 38 76 42" fill="none" stroke="#CFC4BA" stroke-width="2.5" stroke-linecap="round"/><path d="M96 76 Q 102 79 107 75" fill="none" stroke="#5A2E1C" stroke-width="2" stroke-linecap="round"/><g class="hs3-ear"><path d="M44 34 C 24 36, 20 72, 32 88 C 40 98, 54 90, 54 74 C 54 58, 54 42, 44 34 Z" fill="#6A3520"/></g></g></svg>';
  var PAW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><ellipse cx="6" cy="9" rx="2.4" ry="3.1"/><ellipse cx="10.5" cy="5.5" rx="2.4" ry="3.1"/><ellipse cx="15.5" cy="5.5" rx="2.4" ry="3.1"/><ellipse cx="20" cy="9" rx="2.4" ry="3.1"/><path d="M13 11c-4 0-7 4-7 7 0 2 1.6 3 3.4 3 1.6 0 2.4-.8 3.6-.8s2 .8 3.6.8c1.8 0 3.4-1 3.4-3 0-3-3-7-7-7z"/></svg>';
  var ICON = {
    mug: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/></svg>',
    blanket: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10.5h18"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="12" cy="10" r="3"/><path d="M8.5 16h7"/></svg>',
    ornament: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="7"/><path d="M10 7V5h4v2M12 5V2"/></svg>'
  };
  function pills() { return '<div class="hs3-pills" aria-hidden="true">' + GIFTS.map(function (g) { return '<span class="hs3-pill">' + ICON[g] + SHORT[g] + '</span>'; }).join('') + '</div>'; }
  function sign(n) { return '<span class="hs3-sign">Love, ' + esc(n.dog) + ' ' + PAW + '</span>'; }
  function img(alt, cls) { var src = photoSrc(); return src ? '<img data-hs3-photo src="' + esc(src) + '" alt="' + esc(alt) + '" class="hs3-photo ' + (cls || '') + '">' : '<span class="hs3-photo hs3-photo--empty ' + (cls || '') + '">' + PAW + '</span>'; }
  function privacy() { var p = root.querySelector('[data-hs3-privacy]'); return p ? '<p class="hs3-privacy">' + esc(p.textContent) + '</p>' : ''; }

  function render() {
    if (!frame) return;
    var n = names();
    frame.setAttribute('data-hs3-screen', S.screen);
    root.classList.toggle('hs3--app', S.screen !== 'hero');
    if (S.screen === 'hero') { frame.innerHTML = heroHTML; bindHero(); return; }
    if (S.screen === 'chat') frame.innerHTML = chatView(n);
    else if (S.screen === 'reveal') frame.innerHTML = revealView(n);
    else if (S.screen === 'choose') frame.innerHTML = chooseView(n);
    else if (S.screen === 'share') frame.innerHTML = shareView(n);
    bind();
  }

  // ---- the chat
  var chatQ = null; // the current question: { prefix, question, chips, skip, next, input }
  function chatModel(n) {
    var m = { prefix: ui.prefix, question: '', chips: [], skip: false, next: null, nextLabel: 'Next', input: null, other: false };
    var step = S.step;
    if (step === 1) {
      m.question = "Hi! I'm Biscuit. I sniff out gifts from dogs to the people they love. Who's your dog?";
      m.input = 'dog'; m.next = 'dog'; m.nextLabel = "That's my dog";
    } else if (step === 2) {
      m.prefix = m.prefix || n.dog + '! Great name. My tail is going.';
      m.question = 'So who does ' + n.dog + ' love most?';
      m.input = 'rec'; m.next = 'rec';
    } else if (step === 3) {
      if (S.fu) {
        m.question = S.fu.question;
        m.chips = (S.fu.chips || []).map(function (c, i) { return { id: 'fu' + i, label: c }; });
        m.skip = true; m.other = true;
        if (!m.chips.length) ui.typing = true;
      } else if (!S.home || S.home === 'skip' || S.home === 'typed') {
        m.prefix = m.prefix || n.rec + '! Lucky human.';
        m.question = 'What does ' + n.dog + ' do when ' + n.rec + ' comes home?';
        m.chips = [['door', 'Waits at the door'], ['toy', 'Brings ' + n.rec + ' a toy'], ['spin', 'Spins in circles'], ['cool', 'Plays it cool']].map(function (c) { return { id: c[0], label: c[1] }; });
        m.skip = true; m.other = true;
      } else {
        var fq = homeQ(n)[S.home];
        m.question = fq.q;
        m.chips = fq.chips.map(function (c) { return { id: c[0], label: c[1] }; });
      }
    } else if (step === 4) {
      m.question = "Where's " + n.dog + "'s spot when " + n.rec + "'s around?";
      m.chips = [['feet', 'On ' + n.rec + "'s feet"], ['bed', n.rec + "'s side of the bed"], ['couch', 'Next to ' + n.rec + ' on the couch'], ['anywhere', 'Wherever ' + n.rec + ' is']].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
    } else if (step === 5) {
      m.question = 'What do ' + n.dog + ' and ' + n.rec + ' do together, just the two of them?';
      m.chips = [['walk', 'The morning walk'], ['coffee', 'Coffee time'], ['movie', 'Couch and a movie'], ['naps', 'Naps'], ['car', 'Car rides']].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
    } else if (step === 6 && !S.meaning) {
      m.question = 'Last one. What is ' + n.dog + ' to ' + n.rec + '?';
      m.chips = [['shadow', n.rec + "'s shadow"], ['best', n.rec + "'s best friend"], ['hard', 'There on the hard days'], ['boss', 'The boss of the house']].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
    } else {
      m.prefix = m.prefix || (S.meaning === 'skip' ? "That's plenty to go on." : 'Oh. That one got me right in the ears.');
      m.question = "I've sniffed it out. I know what " + n.dog + ' would get ' + n.rec + '.';
      m.next = 'show'; m.nextLabel = 'Show me';
    }
    if (ui.flagged) m.prefix = '';
    return m;
  }
  function chatView(n) {
    var m = chatQ = chatModel(n);
    var dots = '';
    for (var i = 1; i <= 6; i++) dots += '<span class="hs3-dot' + (i <= S.step ? ' is-on' : '') + '"></span>';
    var note = ['home', 'spot', 'together', 'meaning'].map(function (k) {
      var t = ui.pending && ui.pending.key === k && ui.pending.line ? ui.pending.line : lineFor(k);
      var fresh_ = t && ui.inked[k] !== t; if (t) ui.inked[k] = t;
      return t ? '<div class="hs3-line hs3-ink' + (fresh_ ? ' hs3-ink--new' : '') + '">' + esc(t) + '</div>' : '<div class="hs3-line hs3-pencil" aria-hidden="true">_______________________</div>';
    }).join('');
    var h = '';
    h += '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="back">Back</button><span class="hs3-dots" role="img" aria-label="Question ' + Math.min(S.step, 6) + ' of 6">' + dots + '</span><span class="hs3-count">' + Math.min(S.step, 6) + ' of 6</span></div>';
    h += '<div class="hs3-note-wrap"><div class="hs3-label">' + esc(S.step >= 3 ? 'What ' + n.dog + ' wants ' + n.rec + ' to know' : 'What ' + n.dog + ' wants to say') + '</div>';
    h += '<div class="hs3-note"><div class="hs3-note__head"><div class="hs3-note__for">For ' + esc(S.step >= 3 ? n.rec : '________') + '</div>' + img('Your dog', 'hs3-photo--note') + '</div>';
    h += '<div class="hs3-note__lines">' + note + '</div>' + sign(n) + '</div>';
    h += '<div class="hs3-onany"><div class="hs3-small">At the end, put these words on any gift you like:</div>' + pills() + '</div></div>';
    h += '<div class="hs3-talk">';
    if (ui.echo && !ui.thinking) h += '<div class="hs3-echo">' + esc(ui.echo) + '</div>';
    h += '<div class="hs3-says"><span class="hs3-biscuit' + (ui.thinking ? ' is-tilt' : '') + '">' + BISCUIT + '</span>';
    if (ui.thinking) h += '<div class="hs3-bubble" aria-label="Biscuit is sniffing around"><span class="hs3-dotty"></span><span class="hs3-dotty"></span><span class="hs3-dotty"></span></div>';
    else h += '<div class="hs3-bubble hs3-pop" aria-live="polite">' + (ui.flagged ? '<span class="hs3-prefix">' + esc(ui.flagged) + ' </span>' : (m.prefix ? '<span class="hs3-prefix">' + esc(m.prefix) + ' </span>' : '')) + esc(m.question) + '</div>';
    h += '</div></div>';
    h += '<div class="hs3-dock">';
    if (!ui.thinking) {
      if (m.input === 'dog') {
        h += '<label class="hs3-small" for="hs3-dog">Your dog\'s name</label><input id="hs3-dog" class="hs3-field" type="text" maxlength="14" autocomplete="off" autocapitalize="words" value="' + esc(S.dog) + '" data-hs3-in="dog">';
        h += '<div class="hs3-row"><button type="button" class="hs3-chip' + (S.pro === 'she' ? ' is-on' : '') + '" data-hs3="pro" data-v="she" aria-pressed="' + (S.pro === 'she') + '">She</button><button type="button" class="hs3-chip' + (S.pro === 'he' ? ' is-on' : '') + '" data-hs3="pro" data-v="he" aria-pressed="' + (S.pro === 'he') + '">He</button>';
        h += '<label class="hs3-photo-pick">' + img('', 'hs3-photo--tiny') + '<span>' + (S.hasPhoto ? 'Change photo' : 'Add a photo') + '</span><input type="file" accept="image/*" data-hs3-file></label></div>';
        if (!S.hasPhoto) h += '<div class="hs3-small hs3-later">No photo handy? Add it later, on the gift.</div>';
      } else if (m.input === 'rec') {
        h += '<div class="hs3-chips">' + [['partner', 'My partner'], ['mom', 'Mom'], ['dad', 'Dad'], ['kid', 'Our kid'], ['friend', 'A friend']].map(function (c) {
          return '<button type="button" class="hs3-chip' + (S.rel === c[0] ? ' is-on' : '') + '" data-hs3="rel" data-v="' + c[0] + '" aria-pressed="' + (S.rel === c[0]) + '">' + esc(c[1]) + '</button>';
        }).join('') + '</div>';
        h += '<label class="hs3-small" for="hs3-rec">Their first name</label><input id="hs3-rec" class="hs3-field" type="text" maxlength="14" autocomplete="off" autocapitalize="words" value="' + esc(S.rec) + '" data-hs3-in="rec">';
      } else if (ui.typing) {
        h += '<label class="hs3-small" for="hs3-typed">In your own words</label><div class="hs3-row hs3-row--typed"><input id="hs3-typed" class="hs3-field" type="text" maxlength="140" autocomplete="off" enterkeyhint="send" data-hs3-in="typed"><button type="button" class="hs3-btn hs3-btn--small" data-hs3="send">Done</button></div>' + privacy();
        h += '<div class="hs3-row"><button type="button" class="hs3-quiet" data-hs3="untype">Back to the choices</button></div>';
      } else if (m.chips.length || m.other) {
        h += '<div class="hs3-chips">' + m.chips.map(function (c) { return '<button type="button" class="hs3-chip" data-hs3="chip" data-v="' + esc(c.id) + '">' + esc(c.label) + '</button>'; }).join('');
        if (m.other) h += '<button type="button" class="hs3-chip hs3-chip--other" data-hs3="other">Something else</button>';
        h += '</div>';
      }
      if (m.skip && (!ui.typing || S.fu)) h += '<div class="hs3-row"><button type="button" class="hs3-quiet" data-hs3="skip">Not sure</button></div>';
      if (m.next) h += '<button type="button" class="hs3-btn" data-hs3="next">' + esc(m.nextLabel) + '</button>';
    }
    h += '</div>';
    return h;
  }

  // ---- the reveal
  function revealView(n) {
    var g = S.gift || recGift();
    var pick = recGift();
    var keys = giftKeys(g);
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="toChat">Back</button><span class="hs3-label">Biscuit\'s pick</span><span class="hs3-spacer"></span></div>';
    h += '<h2 class="hs3-h2">' + esc(n.dog) + '\'s gift for ' + esc(n.rec) + '</h2>';
    if (!ui.editing) {
      h += '<div class="hs3-tabs" role="group" aria-label="Gifts">' + GIFTS.map(function (k) {
        return '<button type="button" class="hs3-tab' + (k === g ? ' is-on' : '') + '" data-hs3="tab" data-v="' + k + '" aria-pressed="' + (k === g) + '">' + ICON[k] + '<span>' + SHORT[k] + '</span><span class="hs3-tab__tag">' + (k === pick ? "Biscuit's pick" : '') + '</span></button>';
      }).join('') + '</div><p class="hs3-small hs3-center">Same words on any of them. Tap to see each one, then pick as many as you like.</p>';
    }
    var lines = keys.map(function (k, i) { return '<span class="hs3-line ' + (i < ui.revealN ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(lineFor(k) || '') + '</span>'; }).join('');
    h += '<div class="hs3-stage">' + mockup(g, n, lines) + '</div>';
    if (ui.editing) {
      h += '<div class="hs3-edit">' + keys.map(function (k) {
        var t = lineFor(k) || '';
        return '<label class="hs3-edit__row"><span class="hs3-sr">Edit line</span><input class="hs3-field hs3-field--mono" type="text" maxlength="44" value="' + esc(t) + '" data-hs3-edit="' + k + '"><span class="hs3-small hs3-right" data-hs3-left="' + k + '">' + (44 - t.length) + ' characters left</span></label>';
      }).join('') + '</div>';
    } else {
      h += '<div class="hs3-says hs3-says--reveal"><span class="hs3-biscuit">' + BISCUIT + '</span><div class="hs3-bubble hs3-pop"><strong>' + esc(GN[g]) + '.</strong> ' + esc(reasonFor(g, n)) + '</div></div>';
    }
    h += '<div class="hs3-dock"><p class="hs3-small hs3-center">Written from your answers. Change any word.</p><button type="button" class="hs3-btn" data-hs3="them">That\'s them. Choose gifts</button><button type="button" class="hs3-ghost" data-hs3="edit">' + (ui.editing ? 'Done' : 'Change a word') + '</button></div>';
    return h;
  }
  function mockup(g, n, lines) {
    if (g === 'mug') return '<div class="hs3-mug"><span class="hs3-mug__handle"></span><span class="hs3-mug__body"><span class="hs3-mug__rim"></span><span class="hs3-mug__face">' + img('Your dog on the mug', 'hs3-photo--mug') + '<span class="hs3-mug__words">' + lines + '<span class="hs3-sign">Love, ' + esc(n.dog) + '</span></span></span></span></div>';
    if (g === 'blanket') return '<div class="hs3-blanket"><div class="hs3-blanket__in">' + img('Your dog on the blanket', 'hs3-photo--blanket') + '<div class="hs3-blanket__words">' + lines + '<span class="hs3-sign">Love, ' + esc(n.dog) + '</span></div></div></div>';
    if (g === 'print') return '<div class="hs3-print"><div class="hs3-print__in">' + img('Your dog on the print', 'hs3-photo--print') + '<div class="hs3-print__name">' + esc(n.dog) + '</div>' + lines + '<span class="hs3-sign">Love, ' + esc(n.dog) + '</span></div></div>';
    return '<div class="hs3-orn"><span class="hs3-orn__string"></span><span class="hs3-orn__cap"></span><div class="hs3-orn__ball">' + img('Your dog on the ornament', 'hs3-photo--orn') + '<div class="hs3-orn__name">' + esc(n.dog) + '</div>' + lines + '</div></div>';
  }
  function startReveal(g) {
    clearTimers();
    ui.editing = false; ui.revealN = reduced ? 9 : 0;
    S.screen = 'reveal'; S.gift = g; save(); render();
    if (reduced) return;
    var k = giftKeys(g).length;
    for (var i = 1; i <= k; i++) (function (x) { later(function () { ui.revealN = x; inkLines(); }, 450 + x * 650); })(i);
  }
  function inkLines() {
    frame.querySelectorAll('.hs3-stage .hs3-line').forEach(function (el, i) { if (i < ui.revealN && !el.classList.contains('hs3-ink')) { el.classList.remove('hs3-pencil'); el.classList.add('hs3-ink', 'hs3-ink--new'); } });
  }

  // ---- choose gifts
  function priceOf(k, others) {
    var p = Number(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].price) || ({ mug: 29, blanket: 89, print: 89, ornament: 24 })[k];
    if (k === 'ornament' && cfg.ornamentBundle && others > 0) p = Math.max(0, p - 5);
    return p;
  }
  function fmt(p) { return '$' + (Math.round(p * 100) % 100 ? p.toFixed(2) : String(Math.round(p))); }
  function chooseModel() {
    var others = ['mug', 'blanket', 'print'].filter(function (k) { return S.sel[k]; }).length;
    var count = GIFTS.filter(function (k) { return S.sel[k]; }).length;
    var total = GIFTS.reduce(function (a, k) { return a + (S.sel[k] ? priceOf(k, others) : 0); }, 0);
    var missing = GIFTS.filter(function (k) { return S.sel[k] && !(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].url); });
    return { others: others, count: count, total: total, missing: missing };
  }
  function chooseView(n) {
    var pick = recGift(), c = chooseModel();
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="toReveal">Back</button><span class="hs3-brand">Heartside</span><span class="hs3-spacer"></span></div>';
    h += '<h2 class="hs3-h2">' + esc(n.dog) + '\'s gifts for ' + esc(n.rec) + '</h2><p class="hs3-sub">Pick one or more. Your words go on each one.</p>';
    h += '<div class="hs3-strip">' + img('Your dog', 'hs3-photo--strip') + '<div><div class="hs3-line hs3-ink">' + esc(lineFor('home') || lineFor('meaning') || '') + '</div><span class="hs3-sign">Love, ' + esc(n.dog) + '</span></div></div>';
    h += '<div class="hs3-opts">' + GIFTS.map(function (k) {
      var on = !!S.sel[k];
      var desc = k === 'ornament' ? (cfg.ornamentBundle ? 'For the tree. ' + fmt(priceOf('ornament', 1)) + ' with another gift' : 'Ceramic, for the tree') : DS[k];
      return '<button type="button" class="hs3-opt' + (on ? ' is-on' : '') + '" data-hs3="sel" data-v="' + k + '" aria-pressed="' + on + '"><span class="hs3-tick" aria-hidden="true">' + (on ? '✓' : '') + '</span><span class="hs3-opt__body"><span class="hs3-opt__name">' + esc(GN[k]) + (k === pick ? '<span class="hs3-opt__pick">BISCUIT\'S PICK</span>' : '') + '</span><span class="hs3-small">' + esc(desc) + '</span></span><span class="hs3-opt__price">' + fmt(priceOf(k, c.others)) + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="hs3-row hs3-ship"><span class="hs3-small">Ship to</span><button type="button" class="hs3-chip' + (S.shipTo === 'rec' ? ' is-on' : '') + '" data-hs3="ship" data-v="rec" aria-pressed="' + (S.shipTo === 'rec') + '">' + esc(n.rec) + '</button><button type="button" class="hs3-chip' + (S.shipTo === 'me' ? ' is-on' : '') + '" data-hs3="ship" data-v="me" aria-pressed="' + (S.shipTo === 'me') + '">Me</button></div>';
    h += '<div class="hs3-dock"><p class="hs3-small hs3-center hs3-promise">Free US shipping. Order by Dec 10 for Christmas. A real person checks every order before it prints. Misprints are remade free.</p>';
    var label = c.count === 0 ? 'Pick a gift' : (c.count === 1 ? 'Add to cart · ' + fmt(c.total) : 'Add ' + c.count + ' gifts to cart · ' + fmt(c.total));
    h += '<button type="button" class="hs3-btn" data-hs3="add"' + (c.count === 0 || c.missing.length ? ' disabled' : '') + '>' + esc(label) + '</button>';
    if (c.missing.length) h += '<p class="hs3-small hs3-center" role="status">' + esc(c.missing.map(function (k) { return GN[k]; }).join(' and ')) + (c.missing.length > 1 ? ' are' : ' is') + ' not in the shop yet.</p>';
    if (c.count > 0 && !c.missing.length) h += '<p class="hs3-small hs3-center">Next, each gift opens with your words and photo filled in. Check it, then add it to the cart.</p>';
    h += '<button type="button" class="hs3-ghost" data-hs3="toShare">Save ' + esc(n.dog) + '\'s gift to your story</button></div>';
    return h;
  }
  function addToCart() {
    var c = chooseModel();
    if (!c.count || c.missing.length) return;
    shareWithBridge();
    var q = GIFTS.filter(function (k) { return S.sel[k]; }).map(function (k) { return { url: cfg.gifts[k].url, title: GN[k] }; });
    try { if (q.length > 1) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); else window.sessionStorage.removeItem(QKEY); } catch (e) { /* private mode */ }
    track('add_to_cart', { gifts: q.length, picks: GIFTS.filter(function (k) { return S.sel[k]; }).join(',') });
    window.location.href = q[0].url;
  }

  // ---- the share card (9:16, drawn in the browser, pressed and held to save)
  function shareView(n) {
    return '<div class="hs3-share"><div class="hs3-top"><button type="button" class="hs3-quiet hs3-quiet--light" data-hs3="toChoose">Back</button></div><div class="hs3-share__card" data-hs3-card><span class="hs3-small">Drawing the card…</span></div><p class="hs3-share__how">Press and hold the card to save it.</p></div>';
  }
  function drawCard() {
    var box = frame.querySelector('[data-hs3-card]');
    if (!box) return;
    var n = names();
    var W = 1080, Hh = 1920, cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    var x = cv.getContext('2d');
    var go = function (photo) {
      x.fillStyle = '#FBF6F1'; x.fillRect(0, 0, W, Hh);
      x.textAlign = 'center'; x.fillStyle = '#8A4A2B';
      x.font = '700 38px "HS Courier Prime", "Courier New", monospace';
      x.fillText('A GIFT FROM THE DOG', W / 2, 250);
      var cy = 560, r = 250;
      x.save(); x.beginPath(); x.arc(W / 2, cy, r + 14, 0, Math.PI * 2); x.fillStyle = '#E2D4C8'; x.fill(); x.beginPath(); x.arc(W / 2, cy, r, 0, Math.PI * 2); x.clip();
      if (photo) { var s = Math.max((2 * r) / photo.width, (2 * r) / photo.height); x.drawImage(photo, W / 2 - photo.width * s / 2, cy - photo.height * s / 2, photo.width * s, photo.height * s); }
      else { x.fillStyle = '#EFE6DD'; x.fillRect(W / 2 - r, cy - r, 2 * r, 2 * r); }
      x.restore();
      x.fillStyle = '#121010';
      x.font = '650 92px "HS Fraunces", Georgia, serif';
      wrap(x, n.dog + ' got ' + n.rec + ' something.', W / 2, 990, 900, 100);
      x.font = '400 46px "HS Courier Prime", "Courier New", monospace';
      var y = 1260;
      ['home', 'spot', 'meaning'].map(lineFor).filter(Boolean).forEach(function (l) { y = wrap(x, l, W / 2, y, 920, 60) + 76; });
      x.fillStyle = '#8A4A2B'; x.font = 'italic 400 66px "HS Fraunces", Georgia, serif';
      x.fillText('Love, ' + n.dog, W / 2, Math.max(y + 40, 1600));
      x.fillStyle = '#5A4A44'; x.font = '400 40px "HS Courier Prime", "Courier New", monospace';
      x.fillText('heartside.io', W / 2, 1810);
      var out;
      try { out = cv.toDataURL('image/png'); } catch (e) { out = ''; }
      box.innerHTML = out ? '<img src="' + out + '" alt="' + esc(n.dog + ' got ' + n.rec + ' something. Love, ' + n.dog) + '" class="hs3-share__img">' : '<span class="hs3-small">The card could not be drawn on this phone.</span>';
      track('share_card', {});
    };
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('650 92px "HS Fraunces"'), document.fonts.load('italic 400 66px "HS Fraunces"'), document.fonts.load('400 46px "HS Courier Prime"')]).catch(function () {}) : Promise.resolve();
    ready.then(function () {
      var src = photoSrc();
      if (!src) { go(null); return; }
      var im = new Image();
      im.onload = function () { go(im); };
      im.onerror = function () { go(null); };
      im.src = src;
    });
  }
  function wrap(x, text, cx, y, maxW, lh) {
    var words = String(text).split(' '), line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (x.measureText(t).width > maxW && line) { x.fillText(line, cx, y); y += lh; line = w; } else line = t;
    });
    if (line) x.fillText(line, cx, y);
    return y;
  }

  /* ---------------------------------------------------------------- actions */
  function think(ms, fn) { ui.thinking = true; render(); later(function () { ui.thinking = false; fn(); }, reduced ? 0 : ms); }
  function chip(id) {
    var n = names(), m = chatQ, label = '';
    (m.chips || []).forEach(function (c) { if (c.id === id) label = c.label; });
    ui.echo = label; ui.flagged = '';
    stepEvent('answered', { kind: 'chip', value: id });
    if (S.step === 3 && S.fu) { followAnswer(label, true); return; }
    if (S.step === 3 && (!S.home || S.home === 'skip')) {
      S.home = id; S.follow = null; save();
      ui.prefix = '';
      think(1300, function () { render(); stepEvent('shown', { sub: 'follow' }); });
      return;
    }
    if (S.step === 3) { S.follow = id; ui.prefix = REACT4[id] || ''; S.step = 4; save(); render(); stepEvent('shown'); return; }
    if (S.step === 4) { S.spot = id; ui.prefix = REACT5[id] || ''; S.step = 5; save(); render(); stepEvent('shown'); return; }
    if (S.step === 5) { S.together = id; ui.prefix = REACT6[id] || ''; S.step = 6; save(); render(); stepEvent('shown'); return; }
    if (S.step === 6) { S.meaning = id; ui.prefix = ''; save(); render(); if (anyTyped()) warm(cfg.composeUrl); return; }
    void n;
  }
  function skip() {
    ui.echo = 'Not sure'; ui.flagged = ''; ui.typing = false;
    stepEvent('skipped');
    if (S.step === 3 && S.fu) { S.fu = null; ui.prefix = ''; S.step = 4; save(); render(); stepEvent('shown'); return; }
    if (S.step === 3) { S.home = 'skip'; S.follow = null; ui.prefix = "No problem. Let's sniff around somewhere else."; S.step = 4; }
    else if (S.step === 4) { S.spot = 'skip'; ui.prefix = REACT5.skip; S.step = 5; }
    else if (S.step === 5) { S.together = 'skip'; ui.prefix = REACT6.skip; S.step = 6; }
    else if (S.step === 6) { S.meaning = 'skip'; ui.prefix = ''; }
    save(); render();
    if (S.step <= 6 && !S.meaning) stepEvent('shown');
  }
  // a typed answer: Biscuit reacts, a line inks, and on the home question one follow-up
  function sendTyped(text) {
    text = String(text || '').trim();
    if (!text) return;
    ui.typing = false; ui.echo = text; ui.flagged = '';
    var key = ({ 3: 'home', 4: 'spot', 5: 'together', 6: 'meaning' })[S.step];
    if (S.step === 3 && S.fu) { followAnswer(text, false); return; }
    stepEvent('answered', { kind: 'typed' });
    // the buyer's own words ink at once; Biscuit's version replaces them when it lands
    ui.pending = GRIEF.test(text) || PROFANE.test(text) ? null : { key: key, line: ownWords(text) };
    ui.thinking = true; render();
    var q = chatQ ? chatQ.question : '';
    typedAnswer(key, q, text, '').then(function (r) {
      ui.thinking = false; ui.pending = null;
      if (r.flags.some(function (f) { return f === 'grief' || f === 'profanity' || f === 'unclear'; })) {
        ui.flagged = CATCH; ui.echo = ''; render(); stepEvent('flagged'); return;
      }
      S.typed[key] = text;
      S.ai[key] = { line: r.line, reaction: r.reaction };
      S[key] = 'typed';
      if (key === 'home') {
        S.follow = null; S.ai.home_follow = null;
        S.fu = r.follow_up && (r.follow_up.chips.length || !r.ai) ? r.follow_up : null;
        ui.prefix = r.reaction && r.reaction !== 'Tell me more?' ? r.reaction : '';
        if (!S.fu) { S.step = 4; }
        save(); render(); stepEvent('shown', S.fu ? { sub: 'follow' } : null);
        return;
      }
      ui.prefix = r.reaction && r.reaction !== 'Tell me more?' ? r.reaction : '';
      if (key === 'spot') S.step = 5; else if (key === 'together') S.step = 6;
      if (key === 'meaning') warm(cfg.composeUrl);
      save(); render();
      if (key !== 'meaning') stepEvent('shown');
    });
  }
  function followAnswer(text, isChip) {
    stepEvent('answered', { kind: isChip ? 'chip' : 'typed', sub: 'follow' });
    S.typed.home_follow = text; S.follow = 'typed';
    var prev = (S.ai.home && S.ai.home.line) || '';
    var aiFollow = !!(S.fu && S.fu.chips && S.fu.chips.length);
    S.fu = null; save();
    if (!aiFollow) { ui.prefix = ''; S.step = 4; save(); render(); stepEvent('shown'); return; }
    ui.thinking = true; render();
    typedAnswer('home_follow', chatQ ? chatQ.question : '', text, prev).then(function (r) {
      ui.thinking = false;
      if (r.ai && r.line && !r.flags.length) S.ai.home_follow = { line: r.line, reaction: r.reaction };
      ui.prefix = r.ai && r.reaction ? r.reaction : '';
      S.step = 4; save(); render(); stepEvent('shown');
    });
  }
  function next() {
    var n = names();
    if (S.step === 1) {
      if (!String(S.dog).trim()) { focusField('hs3-dog'); return; }
      stepEvent('answered'); ui.echo = n.dog; ui.prefix = ''; S.step = 2; save(); render(); stepEvent('shown'); return;
    }
    if (S.step === 2) {
      if (!String(S.rec).trim()) { focusField('hs3-rec'); return; }
      stepEvent('answered'); ui.echo = n.rec; ui.prefix = ''; S.step = 3; save(); render(); stepEvent('shown'); return;
    }
    // the end of the chat: the reveal
    S.composed = null; S.tabbed = false; save();
    track('reveal', { typed: anyTyped() ? 'yes' : 'no' });
    compose();
    startReveal(recGift());
  }
  function back() {
    ui.flagged = ''; ui.typing = false; ui.prefix = ''; ui.echo = '';
    if (S.step <= 1) { set({ screen: 'hero' }); return; }
    if (S.step === 3 && S.fu) { set({ fu: null, home: null, follow: null }); return; }
    if (S.step === 3 && S.home && S.home !== 'skip' && S.home !== 'typed' && !S.follow) { set({ home: null }); return; }
    if (S.step === 6 && S.meaning) { set({ meaning: null }); return; }
    var map = { 2: {}, 3: { home: null, follow: null }, 4: { home: null, follow: null, fu: null }, 5: { spot: null }, 6: { together: null } };
    var o = map[S.step] || {};
    o.step = S.step - 1;
    set(o);
  }
  function focusField(id) { var f = document.getElementById(id); if (f) { f.focus(); f.classList.add('is-need'); } }

  /* ------------------------------------------------------------------ binding */
  var heroHTML = '';
  function bindHero() {
    var b = frame.querySelector('[data-hs3-start]');
    if (b) b.addEventListener('click', function () {
      track('start', {});
      S.screen = 'chat'; if (S.step > 6 || S.step < 1) S.step = 1; ui.echo = ''; ui.prefix = ''; save(); render(); stepEvent('shown');
      warm(cfg.typedUrl);
      scrollTop();
    });
  }
  function scrollTop() { try { var r = root.getBoundingClientRect(); if (r.top < -2 || r.top > window.innerHeight / 3) root.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { /* old browser */ } }
  function bind() {
    frame.querySelectorAll('[data-hs3]').forEach(function (el) {
      el.addEventListener('click', function () { act(el.getAttribute('data-hs3'), el.getAttribute('data-v')); });
    });
    frame.querySelectorAll('[data-hs3-in]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-in');
      inp.addEventListener('input', function () {
        inp.classList.remove('is-need');
        if (k === 'dog' || k === 'rec') { S[k] = inp.value.slice(0, 14); save(); }
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (k === 'typed') sendTyped(inp.value); else next();
      });
    });
    var file = frame.querySelector('[data-hs3-file]');
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f || !/^image\//.test(f.type || 'image/')) return;
      usePhoto(f);
      idb('readwrite', function (st) { return st.put({ file: f, t: Date.now() }, PHOTO); }).catch(function () {});
      track('photo_attached', {});
      var lab = frame.querySelector('.hs3-photo-pick span'); if (lab) lab.textContent = 'Change photo';
      var later_ = frame.querySelector('.hs3-later'); if (later_) later_.remove();
    });
    frame.querySelectorAll('[data-hs3-edit]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-edit');
      inp.addEventListener('input', function () {
        S.edits[k] = inp.value.slice(0, 44); save();
        var left = frame.querySelector('[data-hs3-left="' + k + '"]'); if (left) left.textContent = (44 - inp.value.length) + ' characters left';
        var i = giftKeys(S.gift || recGift()).indexOf(k), l = frame.querySelectorAll('.hs3-stage .hs3-line')[i];
        if (l) l.textContent = inp.value;
      });
    });
    var typed = frame.querySelector('#hs3-typed');
    if (typed) typed.focus();
    if (S.screen === 'share') drawCard();
  }
  function act(a, v) {
    var n = names();
    switch (a) {
      case 'back': back(); break;
      case 'pro': S.pro = v === 'he' ? 'he' : 'she'; save(); render(); break;
      case 'rel': S.rel = v; save(); render(); break;
      case 'next': next(); break;
      case 'chip': chip(v); break;
      case 'skip': skip(); break;
      case 'other': warm(cfg.typedUrl); ui.typing = true; ui.flagged = ''; render(); stepEvent('something_else'); break;
      case 'untype': ui.typing = false; if (S.fu && !S.fu.chips.length) { skip(); return; } render(); break;
      case 'send': var t = frame.querySelector('#hs3-typed'); sendTyped(t ? t.value : ''); break;
      case 'tab': S.tabbed = true; track('gift_tab', { gift: v }); startReveal(v); break;
      case 'edit': ui.editing = !ui.editing; ui.revealN = 9; render(); if (ui.editing) track('edit', {}); break;
      case 'them': var g = S.gift || recGift(); S.sel = S.sel || {}; S.sel[g] = true; ui.editing = false; S.screen = 'choose'; save(); render(); scrollTop(); track('choose', { gift: g }); break;
      case 'toChat': clearTimers(); S.screen = 'chat'; save(); render(); break;
      case 'sel': S.sel[v] = !S.sel[v]; save(); render(); track('gift_pick', { gift: v, on: S.sel[v] ? 'yes' : 'no' }); break;
      case 'ship': S.shipTo = v === 'me' ? 'me' : 'rec'; save(); render(); break;
      case 'add': addToCart(); break;
      case 'toReveal': ui.revealN = 9; S.screen = 'reveal'; save(); render(); break;
      case 'toShare': S.screen = 'share'; save(); render(); scrollTop(); break;
      case 'toChoose': S.screen = 'choose'; save(); render(); break;
    }
    void n;
  }

  function init() {
    root = document.querySelector('[data-hs3]');
    if (!root) return;
    frame = root.querySelector('.hs3__frame');
    try { cfg = JSON.parse(root.querySelector('[data-hs3-config]').textContent); } catch (e) { cfg = {}; }
    heroHTML = frame.innerHTML;
    if (S.screen === 'reveal') ui.revealN = 9;
    if (S.screen === 'chat' && S.step === 3 && S.fu && !S.fu.chips.length) ui.typing = true;
    if (S.screen === 'chat') warm(cfg.typedUrl);
    render();
    restorePhoto().then(function () { if (S.screen !== 'hero') render(); });
    var q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { /* old browser */ }
    if (q && q.get('hs3') === 'reset') { S = fresh(); save(); render(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // for tools/preview tests
  window.__hs3api = { state: function () { return S; }, lineFor: lineFor, recGift: recGift, typedAnswer: typedAnswer, names: names };
})();
