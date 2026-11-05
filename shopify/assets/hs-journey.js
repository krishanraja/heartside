/* The Heartside journey. Photo first (Krish, 4 Nov, after a real purchase: "one step at a time,
   non-duplicative, in the right order, and then the user purchases"; "'What style of design do you
   want?' is what the whole of this app experience should look like"; the painting screen "for a few
   seconds, which then can fade into the next steps of all the user inputs").

   Two places, one look and one script:
   - the home page (sections/hs-journey.liquid, mode "home"): the photo, the style, then the gifts,
     each with its colour or frame chosen there, once. "Start painting" opens the first gift's page.
   - the gift page (snippets/hs-journey-choose.liquid, mode "gift"): the painter starts at once from
     the photo and the style (recipes v19: the exact dog, no invented scene), the studio shows for a
     few seconds, then these same screens ask about the dog and the note while it paints.
   Every screen is one thing, a tap answers it, nothing is asked twice, and Back, Forward and reload
   land where the buyer expects (?step= on the home page, #ask= on the gift page, which Teeinblue's
   ?variant= rewrites leave alone).

   The words: one compose call per tone, at most, cached, in a box that never changes size. On the
   gift page every answer goes to hs2.js (journeyAnswers), which puts the note and the names on the
   order before it is added; nothing that painted the picture changes after the photo is sent.
   The photo never leaves the device until the gift page paints it (IndexedDB hs2/files/headshot, the
   store hs2.js hands to Teeinblue). Never use import() here: Shopify's minifier breaks it. */
(function () {
  'use strict';
  if (window.__hsj) return;
  window.__hsj = true;

  var KEY = 'hs-journey', HS2 = 'hs2-review';
  var NAME_MAX = 14, MAX_CALLS = 14, COMPOSE_MS = 11000;
  var COMPOSE_VERSION = 'journey-v2';
  var TONES = ['sentimental', 'warm', 'hilarious', 'over_the_top'];
  var TONE_LABEL = { sentimental: 'Sentimental', warm: 'Warm', hilarious: 'Hilarious', over_the_top: 'Roast' };
  // Krish, 4 Nov: "Over the top should be renamed roast". The id stays over_the_top, which the writer, the
  // painter and every saved cart already use; only the buyer's word changes.
  /* one line-icon family (24 px grid, 1.75 stroke, round ends), drawn in currentColor (Krish, 29 Oct:
     "premium iconography", the same variety wherever it helps) */
  function icon(paths, cls) { return '<svg class="hsj-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>'; }
  var ICON = {
    sentimental: icon('<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'),
    warm: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
    hilarious: icon('<circle cx="12" cy="12" r="9"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0Z"/><path d="M8 9.5c.6-.8 1.6-.8 2.2 0M13.8 9.5c.6-.8 1.6-.8 2.2 0"/>'),
    over_the_top: icon('<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.5-8.4 1.8 1.2 2.7 3 2.6 4.8 1-.6 1.7-1.8 1.9-3.3 2.2 1.7 4 4.3 4 6.9 0 3.2-2.4 5.6-6 5.6Z"/><path d="M12 21c-1.5 0-2.5-1-2.5-2.4 0-1.5 1.2-2.3 1.8-3.6.9.7 1.4 1.6 1.4 2.5.5-.3.9-.9 1-1.6.8.8 1.3 1.7 1.3 2.7 0 1.4-1 2.4-3 2.4Z"/>'),
    back: icon('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    next: icon('<path d="M5 12h13M13 6.5 18.5 12 13 17.5"/>'),
    camera: icon('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.8" r="3.4"/>'),
    check: icon('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    plus: icon('<path d="M12 5.5v13M5.5 12h13"/>'),
    redo: icon('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>'),
    image: icon('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m3.5 16 5-5 4 4 3-3 5 5"/>'),
    face: icon('<circle cx="12" cy="12" r="8.5"/><path d="M9 10.5h.01M15 10.5h.01M9 15c1.6 1.3 4.4 1.3 6 0"/>'),
    light: icon('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/>'),
    one: icon('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>'),
    brush: icon('<path d="M14.5 4.5 19.5 9.5 11 18l-5-5Z"/><path d="M6 13c-2 0-3 1.6-3 3.5 0 1.4-.6 2.6-1.5 3 2.6.6 6.5-.3 6.5-3.5"/>')
  };
  /* the home page asks for the photo, the style, the tone and the gifts; the gift page asks about the dog and
     the note while it paints. The tone comes before the painting (Krish, 5 Nov: the four tones must change the
     picture while the face stays his dog; recipes v19 lock the face and let the tone change everything else). The toy and what the dog wears are no longer asked: the painting is the dog in
     the photo (Krish, 4 Nov: less invented scene), so they would change nothing. */
  /* where the dog rules the house comes after the feel and before the gifts, and stages the painting of every gift
     (Krish, 5 Nov: "one question on the home page"; recipes v20 places): it is the one answer that sets the place
     without a prop or a new face, and asked here it reaches the painter with no wait on the gift page */
  var HOME = ['photo', 'look', 'tone', 'spot', 'gifts'];
  var ASK = ['name', 'breed', 'pro', 'person', 'home', 'together', 'meaning'];
  var GIFT = ASK.concat(['words']);
  var MODE = 'home', STEPS = HOME;
  var MAX_TOYS = 2;
  var GIFT_ORDER = ['print', 'mug', 'blanket'];
  // the store's own published words on timing (policies/shipping-policy and the Answers article on the last
  // day to order), quoted, never improved on (Krish, 5 Nov: we never told buyers when it arrives)
  var MAKE_TIME = 'Made after you order: printing takes 2 to 5 business days, then 3 to 7 to arrive in the US.';
  // Krish, 5 Nov ("earlier date, both true"): the policy's longest times, 5 business days to print and 7 to arrive,
  // plus its own "December can add a few days", make Friday 4 December the last date both statements hold
  var CHRISTMAS = 'Order by December 4 for Christmas delivery to a US address.';
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------------------------------------------------------- the questions
     The chip ids are the ones the art profile (hs-artwork-profile.js fromChat) and the note
     writer (n8n compose) already understand. Every group is a tap. */
  var BREEDS = ['Labrador Retriever', 'Golden Retriever', 'French Bulldog', 'Dachshund', 'Poodle', 'Goldendoodle', 'German Shepherd', 'Beagle', 'Pug', 'Border Collie'];
  function groups(n) {
    return [
      { id: 'home', q: 'When you get home, ' + n.dog + '…', opts: [['door', 'waits at the door'], ['toy', 'brings you something'], ['spin', 'spins in circles'], ['cool', 'plays it cool, for a second']] },
      { id: 'spot', q: 'Where does ' + (S.dog ? n.dog : 'your dog') + ' rule the house?', sub: MODE === 'home' ? 'We paint them there, on the mug and the portrait.' : '', opts: [['feet', 'On your feet'], ['bed', 'Your side of the bed'], ['couch', 'The couch'], ['anywhere', 'Wherever you are']] },
      { id: 'together', q: 'Best thing you do together', opts: [['walk', 'Walks'], ['coffee', 'Morning coffee'], ['movie', 'Movie nights'], ['naps', 'Naps'], ['car', 'Car rides']] },
      { id: 'meaning', q: 'What ' + n.dog + ' is to ' + n.them, opts: [['shadow', 'A shadow'], ['best', 'A best friend'], ['hard', 'There on hard days'], ['boss', 'The boss of the house']] },
      { id: 'toy', q: n.possessive + ' favorite things', sub: 'Pick up to two. We paint them in.', opts: [['a tennis ball', 'Tennis ball'], ['a big stick', 'Big stick'], ['a squeaky toy', 'Squeaky toy'], ['a rope toy', 'Rope toy'], ['a stuffed toy', 'Stuffed toy'], ['a frisbee', 'Frisbee'], ['a bone', 'Bone'], ['treats', 'Treats']] },
      { id: 'wears', q: 'Anything ' + n.dog + ' wears?', opts: [['a collar', 'A collar'], ['a bandana', 'A bandana'], ['a bow', 'A bow'], ['a sweater', 'A sweater'], ['a harness', 'A harness'], ['', 'Nothing']] }
    ];
  }
  // the labels the note writer reads, the tap in words (n8n compose, 29 Oct bench)
  function label(id, v) { var g = groups(names()).filter(function (x) { return x.id === id; })[0], o = g && g.opts.filter(function (x) { return x[0] === v; })[0]; return o ? o[1].toLowerCase() : ''; }
  /* the scripted lines, the dog talking (Krish, 20 Oct), used until the writer answers or if it can't. One set
     per tone (Krish, 4 Nov: the tones were "way too similar to each other"; the one set served every tone,
     so a slow writer showed the same note on all four). Sentimental is tender with no jokes; warm smiles;
     hilarious is deadpan dog logic about the dog's own importance; roast teases the person's habits only,
     with the love in the last line. No two tones share a line (tools/preview/note-tones.test.mjs). */
  var LINES = {
    sentimental: {
      home: { door: 'I wait by the door until you come home.', toy: 'I bring you a present because I missed you.', spin: 'When you walk in, my whole body says welcome home.', cool: "I act calm when you come home, but my heart doesn't." },
      spot: { feet: 'Your feet are where I feel safest.', bed: 'Your side of the bed smells like home to me.', couch: 'I keep your spot on the couch so I can be near you.', anywhere: 'Wherever you are is where I want to be.' },
      together: { walk: 'Our walks are the best part of my day.', coffee: 'Mornings with you are my favorite kind of quiet.', movie: 'Movie nights mean a whole evening pressed against you.', naps: 'My best naps are the ones next to you.', car: "Any road is a good one if you're on it with me." },
      meaning: { shadow: 'I follow you everywhere because I never want to miss you.', best: "You're my best friend, and I'm yours forever.", hard: "On the hard days, I'll stay close to you.", boss: 'I run this house, but my heart belongs to you.' }
    },
    warm: {
      home: { door: "I wait by the door so I'm the first thing you see.", toy: "I bring you a present whenever you're back.", spin: "When you walk in, I spin like it's a party.", cool: 'I play it cool for about four seconds.' },
      spot: { feet: 'Your feet make the best pillow I know.', bed: 'I took your side of the bed to keep it warm.', couch: 'I keep your spot on the couch warm for you.', anywhere: 'Wherever you go, I go.' },
      together: { walk: 'Our walks are my favorite thing on the calendar.', coffee: 'Coffee with you is the best part of my morning.', movie: 'Movie night is better with me beside you.', naps: "I nap better when you're next to me.", car: "Any car ride is a good one if you're in it." },
      meaning: { shadow: "I'm your shadow, and I like it that way.", best: "You're my best friend, and I'm yours.", hard: "On the hard days, I'm right here, tail and all.", boss: 'I run this house, but I love you most.' }
    },
    hilarious: {
      home: { door: 'I wait at the door all day because someone has to supervise it.', toy: 'I bring you a sock when you get home, because rent is due.', spin: 'When you walk in, I do three laps, which is the house record.', cool: 'I play it cool when you get home for two whole seconds, a personal best.' },
      spot: { feet: "I sleep on your feet so they can't leave without me knowing.", bed: "I took your side of the bed, and I've filed the paperwork.", couch: 'I measured the couch, and both good spots are mine.', anywhere: "I follow you to the bathroom because it's my job to inspect it." },
      together: { walk: 'I take you on walks for your health, and I accept no thanks.', coffee: 'I sit with you at coffee in case the toast needs supervising.', movie: 'On movie nights I watch the snacks, because someone has to.', naps: "I nap next to you to make sure you're doing it right.", car: 'I ride in the car like a very important passenger with no destination.' },
      meaning: { shadow: 'I follow you everywhere, strictly for security reasons.', best: "You're my best friend, and I've told every squirrel.", hard: "On hard days I lie on you, which I'm told is medicine.", boss: "I'm the boss of this house, and I take the job very seriously." }
    },
    over_the_top: {
      home: { door: "I wait by the door all day, and you're late every single time.", toy: 'I bring you a present because your manners clearly need help.', spin: 'I spin when you walk in, and you still forget the treat.', cool: "I play it cool when you get home so you don't get a big head." },
      spot: { feet: 'Your feet are a decent pillow, which is your best quality.', bed: 'I took your side of the bed because you were using it wrong.', couch: "I let you sit on the couch, on the bit I don't want.", anywhere: "I follow you everywhere because you'd get lost without me." },
      together: { walk: "I walk you every day, and you still can't keep up.", coffee: "I sit through your coffee, even though you're slow in the mornings.", movie: 'Movie nights would be better if you shared the popcorn.', naps: "You're a mediocre nap partner, but you're mine.", car: "You drive, I navigate, and honestly I'm carrying us." },
      meaning: { shadow: 'I keep an eye on you all day, because I love you and you need it.', best: "You're lucky I picked you, and I'd pick you again.", hard: "On your hard days I stay close, and I won't tell anyone.", boss: 'I run this house, and I keep you around because I love you.' }
    }
  };
  var GIFT_NAME = { mug: 'mug', blanket: 'blanket', print: 'portrait' };

  /* ------------------------------------------------------------------- state */
  var root, app, cfg = {}, S = load(), photoURL = null, debounce = null;
  function fresh() {
    return { dog: '', breed: '', breedId: '', pro: '', rel: '', person: '', home: null, spot: null, together: null, meaning: null,
      toys: [], toysDone: false, accessory: null, tone: 'warm', style: 'cinematic', notes: {}, request: null, calls: 0, session: '',
      hasPhoto: false, photoT: 0, photoDogs: false, photoDogsOk: false, photoDogsT: 0, photoDogIssue: '', typed: {}, follow: null, gifts: {} };
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
    if (step === 'photo') return !!S.hasPhoto;
    if (step === 'look') return !!S.style;
    if (step === 'tone') return !!S.tone;
    if (step === 'spot') return !!S.spot;
    if (step === 'gifts') return chosenGifts().length > 0;
    if (step === 'name') { var n = nameCase(S.dog); return !!(n && n.length <= NAME_MAX); }
    if (step === 'person') { var p = nameCase(S.person); return S.rel === 'self' || !!(p && p.length <= NAME_MAX); }
    if (step === 'toy') return !!S.toysDone;
    if (step === 'wears') return S.accessory !== null;
    if (ASK.indexOf(step) !== -1) return !!S[step];
    return true;
  }
  function aboutDone() { return ASK.every(answered); }
  function note(tone) { return S.notes && S.notes[tone || S.tone] || null; }
  function scripted(tone) {
    var set = LINES[tone || S.tone] || LINES.warm, o = {};
    ['home', 'spot', 'together', 'meaning'].forEach(function (k) { o[k] = ((set[k] || {})[S[k]]) || ((LINES.warm[k] || {})[S[k]]) || ''; });
    return o;
  }
  function lines() { var c = note(); return c && c.lines ? c.lines : scripted(); }
  /* the gifts the buyer chose, in the order they paint, each with the variant chosen for it. Nothing is
     guessed any more (Krish, 4 Nov: the site picked the blanket for him and painted it before he chose) */
  function giftCfg(g) { return (cfg.gifts && cfg.gifts[g]) || (S.giftCfg && S.giftCfg[g]) || {}; }
  function chosenGifts() { return GIFT_ORDER.filter(function (g) { return S.gifts && S.gifts[g] && S.gifts[g].on && giftCfg(g).url; }); }
  function firstGift() { return chosenGifts()[0] || ''; }
  function variants(g) { return (giftCfg(g).variants || []).filter(function (v) { return v && v.available !== false; }); }
  // the mug's colour is its second option; the portrait is Unframed, or Framed in a frame colour
  function variantLabel(g, v) {
    var o = v.options || [];
    if (g === 'mug') return o[1] || o[0] || '';
    if (g === 'print') return /unframed/i.test(o[0] || '') ? 'Unframed' : (o[1] || 'Framed') + ' frame';
    return o[1] || o[0] || '';
  }
  function chosenVariant(g) {
    var list = variants(g), id = S.gifts && S.gifts[g] && S.gifts[g].variant;
    return list.filter(function (v) { return String(v.id) === String(id); })[0] || list[0] || null;
  }
  function money(v) { v = Number(v) || 0; return '$' + (Math.round(v) === v ? v : v.toFixed(2)); }

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
      current_lines: { home: '', spot: '', together: '', meaning: '' }, default_gift: firstGift() || 'print', note_tone: tone, session: sessionId() };
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
      save(); paintNote(); sendAnswers();
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
     Photo first: the home page hands the gift page only what paints the picture (the photo's time, the
     style, the tone, the gift and its variant) and the journey marker that tells the page to paint at once.
     The painting is the dog in the photo with the tone's scene and light (recipes v19), and nothing that
     painted it changes after the photo is sent, or hs2.js would read the finished painting as stale: a tone
     changed later, on the note screen, changes the words only. */
  function handOver() {
    var st = {}, queue = chosenGifts().map(function (g) { var v = chosenVariant(g); return { gift: g, variant: v ? v.id : null, url: giftURL(g, v && v.id) }; });
    try { st = JSON.parse(window.sessionStorage.getItem(HS2) || '{}') || {}; } catch (e) { st = {}; }
    var kinds = {}, giftCfgs = {};
    ['mug', 'blanket', 'print'].forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) { kinds[x.handle] = g; giftCfgs[g] = { url: x.url, handle: x.handle, price: x.price, priceMax: x.priceMax }; } });
    /* back on the home page after the painting started (the gift page's Back to the gifts), with the same photo,
       look, feel and spot: the same journey goes on with the gifts as chosen now, so a gift already painted is not
       painted again and the answers already given stay (5 Nov review: Start painting again made a second paid
       painting). A changed choice is a new painting, which is what the buyer asked for. */
    var was = st.hs_journey, photoT = S.hasPhoto ? S.photoT : 0;
    if (was && was.mode === 'photo-first' && was.t && Date.now() - was.t < 6 * 36e5 && photoT && was.photoT === photoT &&
        was.style === S.style && was.tone === S.tone && (was.spot || '') === (S.spot || '') && queue.length) {
      was.queue = queue; was.gift = queue[0].gift; was.gifts = journeyGifts();
      st.hs3_kinds = kinds; S.giftCfg = giftCfgs; save();
      try { window.sessionStorage.setItem(HS2, JSON.stringify(st)); } catch (e) { /* private mode */ }
      return queue;
    }
    st.dog = ''; st.person = ''; st.hs3_lines = null; st.hs3_mug_lines = null; st.hs3_copy_owner = 'generated';
    st.hs3_photo_t = S.hasPhoto ? S.photoT : 0;
    st.hs3_kinds = kinds;
    st.hs_answers = '';
    st.hs3_art_profile = window.HSArtworkProfile ? window.HSArtworkProfile.fromChat({}) : null;
    st.hs3_energy = '';
    st.hs3_art_choices = { style: S.style, tone: S.tone };
    st.hs_brief_input = { breed: '', pronoun: 'they', archetype: '', likeness: true, spot: S.spot || '' };
    st.hs_breed_id = '';
    st.hs_ship_to = '';
    st.hs_journey = { t: Date.now(), mode: 'photo-first', gift: queue[0] && queue[0].gift, tone: S.tone, style: S.style, spot: S.spot || '', photoT: S.hasPhoto ? S.photoT : 0,
      queue: queue, gifts: journeyGifts(), notes: {}, answered: false, compose: { url: cfg.composeUrl || '', ai: !!cfg.ai } };
    S.giftCfg = giftCfgs; save();
    try { window.sessionStorage.setItem(HS2, JSON.stringify(st)); } catch (e) { /* private mode */ }
    try { if (window.HSArtworkChoices) window.HSArtworkChoices.select({ style: S.style, tone: S.tone }); } catch (e) { /* the bridge holds them too */ }
    return queue;
  }
  /* on the gift page: what the buyer just told us goes onto the order (the names, the note, the answers),
     through hs2.js, which fills Teeinblue's note fields before the gift is added. The painting's own
     inputs are never touched here. */
  function sendAnswers() {
    if (MODE !== 'gift') return;
    // this file can run before hs2.js on the gift page (snippets/hs-journey-choose.liquid): an answer given
    // meanwhile goes on once hs2.js is there, never lost
    if (!window.__hs2api || !window.__hs2api.journeyAnswers) {
      if (!sendAnswers.later) sendAnswers.later = setInterval(function () {
        if (window.__hs2api && window.__hs2api.journeyAnswers) { clearInterval(sendAnswers.later); sendAnswers.later = 0; sendAnswers(); }
      }, 250);
      return;
    }
    var n = names(), l = lines(), done = ASK.every(answered);
    var patch = {
      dog: S.dog && n.dog.length <= NAME_MAX ? n.dog : '',
      person: S.rel ? (n.self ? 'Me' : n.person) : '',
      hs_ship_to: S.rel ? (n.self ? 'Me (the buyer)' : n.person) : '',
      hs_answers: ['Dog: ' + n.dog + ' (' + n.she + ')', 'For: ' + (n.self ? 'me' : n.person || ''), 'home: ' + S.home, 'spot: ' + S.spot, 'together: ' + S.together, 'meaning: ' + S.meaning, 'tone: ' + S.tone].join(' | ').slice(0, 480),
      journey: { tone: S.tone, voice: (note() || {}).voice || '', notes: writtenNotes(), answered: done }
    };
    if (done) { patch.hs3_lines = { home: l.home, spot: l.spot, together: l.together, meaning: l.meaning }; patch.hs3_mug_lines = patch.hs3_lines; }
    try { var fr = breedRow(); patch.hs_breed_id = fr ? fr.id : (window.HSBreeds && S.breed ? ((window.HSBreeds.lookup(S.breed) || {}).id || '') : ''); } catch (e) { patch.hs_breed_id = ''; }
    try { window.__hs2api.journeyAnswers(patch); } catch (e) { /* the order still carries what hs2 already has */ }
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
  /* The gifts step warms the first gift's page (5 Nov speed ask): a prefetch, never a prerender, of the very
     address Start painting opens (handOver's first gift), kept in step with the choice, plus the files that page
     needs and the home page has not loaded, Teeinblue's app among them. A prefetch only downloads: nothing on
     that page runs until the buyer opens it, and hs2.js also waits while a page is being prerendered, so no
     photo can go early. Skipped with Data Saver. The page prefetch is Chromium's (speculation rules); the
     files' prefetch helps the browsers that honor it. */
  function warmGift() {
    if (MODE !== 'home') return;
    var c = navigator.connection;
    if (c && c.saveData) return;
    var g = chosenGifts()[0], v = g && chosenVariant(g), url = g ? giftURL(g, v && v.id) : null;
    if (url && url !== warmGift.url) {
      warmGift.url = url;
      try {
        if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
          var was = document.querySelector('script[type="speculationrules"][data-hsj-warm]');
          if (was) was.parentNode.removeChild(was);
          var rules = document.createElement('script');
          rules.type = 'speculationrules'; rules.setAttribute('data-hsj-warm', '');
          rules.textContent = JSON.stringify({ prefetch: [{ source: 'list', urls: [url] }] });
          document.head.appendChild(rules);
        }
      } catch (e) { /* the page still opens, a little later */ }
    }
    if (!url || warmGift.files) return;
    warmGift.files = true;
    var files = (cfg.warm || []).slice(), tib = teeinblueApp();
    if (tib) files.push(tib);
    files.forEach(function (href) {
      var l = document.createElement('link');
      l.rel = 'prefetch'; l.href = href; l.as = /\.css(\?|$)/.test(href) ? 'style' : 'script'; l.setAttribute('data-hsj-warm', '');
      document.head.appendChild(l);
    });
  }
  /* Teeinblue's app on the gift page is app-v1.js with the store's own token and shop, the same two values its
     loader on this page carries (checked against a gift page on 5 Nov). Read here at run time, never written into
     the theme; anything unexpected and nothing is fetched. */
  function teeinblueApp() {
    var s = document.querySelector('script[src*="sdk.teeinblue.com/async.js"]'), u;
    if (!s) return '';
    try { u = new URL(s.src); } catch (e) { return ''; }
    var token = u.searchParams.get('token') || '', shop = u.searchParams.get('shop') || '';
    if (!/^[A-Za-z0-9]+$/.test(token) || !/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) return '';
    return 'https://sdk.teeinblue.com/shopify/app-v1.js?token=' + token + '&shop=' + shop;
  }
  function giftURL(gift, variant) {
    var x = cfg.gifts && cfg.gifts[gift];
    if (!x || !x.url) return null;
    var u = new URL(x.url, window.location.href);
    u.searchParams.set('journey', '1');
    if (variant) u.searchParams.set('variant', String(variant));
    else if (x.minVariant && Number(x.priceMax) > Number(x.price)) u.searchParams.set('variant', String(x.minVariant));
    return u.pathname + u.search;
  }

  /* ------------------------------------------------------------------ views
     One template for every step (Krish approved the mock, 29 Oct: "much better"): the app bar
     (Back, "Step 3 of 13") and the progress line, the headline and one line of support at the
     same place on every screen, one component per job (rows, chips, a text field, cards), and the
     one button in the dock at the bottom. Nothing moves between screens but the content. */
  var BACK = '<button type="button" class="hsj-icon-btn" data-hsj-back aria-label="Back">' + ICON.back + '</button>';
  /* five parts across both pages, not "Step 1 of 12" (audit, 30 Oct: the count says how long it is before
     it starts): the photo, the look, the gifts, then, while it paints, the dog and the note. On the gift
     page the header carries a small painting badge (hs-journey-choose.js keeps it current). */
  var PART_LABEL = { photo: 'Your photo', look: 'The look', tone: 'The feel', spot: 'The feel', gifts: 'The gifts', words: 'The note' };
  function partOf(step) { return { photo: 1, look: 2, tone: 3, spot: 3, gifts: 4, words: 6 }[step] || 5; }
  /* one line that only ever moves forward, across both pages (5 Nov judges: it ran 31% at the gifts, 60% in the
     studio, 38% at the first question, 100% at the note and 60% again while it painted). The home page's steps
     share 8 to 40%, the studio 45% (hs-journey-choose.js), the questions 50 to 85%, the note 90%, the last
     wait 95% and the painting on the gift 100%. */
  function pctOf(step) {
    var h = HOME.indexOf(step); if (h !== -1) return Math.round((h + 1) * 40 / HOME.length);
    var a = GIFT.indexOf(step); return a === -1 ? 0 : Math.round(50 + a * 40 / (GIFT.length - 1));
  }
  function screen(step, title, sub, body, dockHtml) {
    var pct = pctOf(step);
    var part = partOf(step);
    var label = PART_LABEL[step] || (S.dog && step !== 'name' ? 'About ' + esc(names().dog) : 'About your dog');
    var back = MODE === 'gift' && step === GIFT[0] ? '<span class="hsj-icon-btn" aria-hidden="true"></span>' : BACK;
    var chip = MODE === 'gift' ? '<span class="hsj-paint" data-hsj-paint role="img" aria-label="Painting your dog"><span class="hsj-paint__img" data-hsj-paint-img></span><span class="hsj-paint__ring"></span></span>' : '';
    return '<header class="hsj-bar' + (chip ? ' has-paint' : '') + '">' + back + '<p class="hsj-bar__step">' + label + ' <span class="hsj-bar__part">· ' + part + ' of 6</span></p>' + chip + '</header>' +
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
    // no stranger's name in the field or the line (5 Nov judges: a grey "Mowgli" read as already filled in, or as
    // someone else's order)
    return screen('name', 'What is your dog called?', S.dog ? 'It signs the note: "Love, ' + esc(nameCase(S.dog)) + '".' : 'Your dog signs the note with it.',
      field('data-hsj-name', "Dog's name", S.dog, 'Type their name', 'hsj-name') + '<p class="hsj-hint" data-hsj-name-hint aria-live="polite"></p>', primary('Next', 'breed', answered('name')));
  }
  // the breed shapes the note, never the painting, which comes from the photo (recipes v19; 5 Nov judges: "We paint
  // the breed you pick" contradicted "painted from your photo", and the breed is asked after painting starts)
  var BREED_SUB = 'It goes in the note. We paint your dog from the photo.';
  function viewBreed() {
    var n = names(), other = S.breed && BREEDS.indexOf(S.breed) === -1 && S.breed !== 'Mixed';
    // typing a breed: the search and its suggestions take the list's place, so they sit right under the question,
    // above the keyboard and the button (5 Nov: on a 320 px phone the suggestions were under the dock)
    if (S.breedOther) return screen('breed', 'What breed is ' + esc(n.dog) + '?', BREED_SUB,
      '<input class="hsj-input hsj-search" data-hsj-breed-search type="search" autocomplete="off" placeholder="Start typing the breed" aria-label="Search breeds">' +
      '<div class="hsj-chips" data-hsj-breed-list></div><div class="hsj-chips"><button type="button" class="hsj-chip hsj-chip--quiet" data-hsj-pick="breed" data-v="__list"><span>Pick from the list</span></button></div>',
      primary('Next', 'pro', answered('breed')));
    return screen('breed', 'What breed is ' + esc(n.dog) + '?', BREED_SUB, '<div class="hsj-chips" role="group" aria-labelledby="hsj-q">' +
      BREEDS.map(function (b) { return chip('breed', b, b, S.breed === b); }).join('') + chip('breed', 'Mixed', 'Mixed or not sure', S.breed === 'Mixed') + chip('breed', '__other', other ? S.breed : 'Another breed', !!other) + '</div>',
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
      field('data-hsj-person', 'Their name', S.rel === 'self' ? '' : S.person, 'Type their first name', 'hsj-person') + '<div class="hsj-chips">' + chip('self', 'self', "It's for me", S.rel === 'self') + '</div>',
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
    return screen('words', "Now let's capture <em>" + esc(n.possessive) + '</em> vibe.', 'This note comes with the gift. A tone here changes its words, never the painting.',
      '<div class="hsj-note" data-hsj-note aria-live="polite"></div><div class="hsj-tones" role="group" aria-label="How it sounds">' + TONES.map(function (t) {
        return '<button type="button" class="hsj-tone hsj-tone--' + t + (S.tone === t ? ' is-on' : '') + '" aria-pressed="' + (S.tone === t) + '" data-hsj-tone="' + t + '"><span class="hsj-tone__ico">' + ICON[t] + '</span><span>' + TONE_LABEL[t] + '</span></button>';
      }).join('') + '</div>', primary('See ' + esc(n.dog) + ' painted', 'done', true));
  }
  function viewLook() {
    return screen('look', 'What style of design do you want?', 'Every style is painted from your photo.', '<div class="hsj-styles">' + styles().map(function (s) {
      var src = cfg.examples && cfg.examples[s.id], on = S.style === s.id;
      return '<button type="button" class="hsj-style' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-hsj-style="' + esc(s.id) + '">' + '<span class="hsj-style__check">' + ICON.check + '</span>' +
        '<span class="hsj-style__art">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" width="360" height="450"><span class="hsj-tag">Example</span>' : ICON.image) + '</span>' +
        '<span class="hsj-style__name">' + esc(s.label) + '</span></button>';
    }).join('') + '</div>' + yours('We paint your dog as they are in your photo, in the style you pick.'), primary('Next: how it feels', 'tone', true));
  }
  /* the tone, before the painting: it changes the scene, the body and the light, never the face (recipes v19).
     The same four tones write the note later, and the note screen can still change the words. */
  var TONE_INFO = { sentimental: 'Quiet and tender.', warm: 'Happy, with a small wink.', hilarious: 'Funny at a glance.', over_the_top: 'A loving roast.' };
  function viewTone() {
    return screen('tone', 'How should it feel?', 'The tone changes the scene and the light. Your dog stays exactly your dog.', '<div class="hsj-styles hsj-styles--tones">' + TONES.map(function (t) {
      var src = cfg.toneExamples && cfg.toneExamples[t], on = S.tone === t;
      return '<button type="button" class="hsj-style' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-hsj-feel="' + t + '"><span class="hsj-style__check">' + ICON.check + '</span>' +
        '<span class="hsj-style__art">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" width="360" height="450"><span class="hsj-tag">Example</span>' : ICON[t]) + '</span>' +
        '<span class="hsj-style__name">' + esc(TONE_LABEL[t]) + '</span><span class="hsj-style__sub">' + esc(TONE_INFO[t]) + '</span></button>';
    }).join('') + '</div>', primary('Next: their spot', 'spot', true));
  }
  // the buyer's own photo, small, so they always know what is being painted
  function yours(text) {
    return '<div class="hsj-yours"><span class="hsj-yours__img" data-hsj-thumb' + (photoURL ? ' style="background-image:url(&quot;' + esc(photoURL) + '&quot;)"' : '') + '></span><p class="hsj-yours__text">' + esc(text) + '</p></div>';
  }
  /* the gifts: each one large on a real photo of the product, chosen with one tap, its colour or frame
     chosen under it, once (Krish, 4 Nov: "For the second time I'm choosing a colour"). The bundle and the
     store's own words on timing sit under the cards. */
  var GIFT_INFO = { mug: ['The mug', '11 oz ceramic, painted all the way round.'], print: ['The portrait', '12 x 18 in, on matte paper, unframed or framed.'], blanket: ['The blanket', '50 x 60 in, soft sherpa on the back.'] };
  var HEX = { 'Black': '#050505', 'Dark Blue': '#191A4D', 'Dark Green': '#216251', 'Pink': '#E49EAA', 'Red': '#D9292C' };
  function offerText(n) {
    // the saving shows only while the store's bundle switch is on (the memo strip's bundle_offer_live,
    // which also runs the discount), as everywhere else (5 Nov review)
    if (!document.querySelector('[data-hs-bundle-live]')) return '';
    if (n >= 3) return '<b>You save 20% on all 3.</b>';
    if (n === 2) return '<b>You save 15% on these 2.</b> All 3: 20% off.';
    return '<b>Add a second gift: 15% off.</b> All 3: 20% off.';
  }
  function giftOptions(g) {
    var list = variants(g);
    if (list.length < 2) return '';
    var cur = chosenVariant(g);
    var row = list.map(function (v) {
      var t = variantLabel(g, v), on = !!cur && String(v.id) === String(cur.id);
      if (g === 'mug') return '<button type="button" class="hsj-dot' + (on ? ' is-on' : '') + '" style="--dot:' + (HEX[t] || '#C9BFB6') + '" aria-pressed="' + on + '" aria-label="' + esc(t) + '" title="' + esc(t) + '" data-hsj-variant="' + g + ':' + esc(v.id) + '"></button>';
      return '<button type="button" class="hsj-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-hsj-variant="' + g + ':' + esc(v.id) + '">' + (on ? ICON.check : '') + '<span>' + esc(t) + ', ' + money(v.price) + '</span></button>';
    }).join('');
    return '<div class="hsj-gift__opts"><p class="hsj-gift__opt-name">' + (g === 'mug' ? 'Inside color' : 'Frame') + ': <b>' + esc(cur ? variantLabel(g, cur) : '') + '</b></p><div class="hsj-gift__opt-row' + (g === 'mug' ? ' is-dots' : '') + '">' + row + '</div></div>';
  }
  function giftCard(g) {
    var x = giftCfg(g), on = !!(S.gifts[g] && S.gifts[g].on), info = GIFT_INFO[g], img = cfg.scenes && cfg.scenes[g];
    var price = Number(x.priceMax) > Number(x.price) ? 'from ' + money(x.price) : money(x.price);
    return '<div class="hsj-gift' + (on ? ' is-on' : '') + '" data-hsj-gift-card="' + g + '">' +
      '<button type="button" class="hsj-gift__pick" aria-pressed="' + on + '" data-hsj-gift="' + g + '">' +
      '<span class="hsj-gift__art">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="540" height="675"><span class="hsj-tag">Example</span>' : '') +
      '<span class="hsj-gift__check">' + (on ? ICON.check : ICON.plus) + '</span></span>' +
      '<span class="hsj-gift__row"><span class="hsj-gift__name">' + esc(info[0]) + '</span><span class="hsj-gift__price">' + esc(price) + '</span></span>' +
      '<span class="hsj-gift__spec">' + esc(info[1]) + '</span></button>' +
      '<div data-hsj-gift-opts>' + (on ? giftOptions(g) : '') + '</div></div>';
  }
  function viewGifts() {
    var list = GIFT_ORDER.filter(function (g) { return giftCfg(g).url; }), n = chosenGifts().length;
    return screen('gifts', 'Which gifts should we paint?', 'Pick one or more. Each is painted from your photo.',
      '<div class="hsj-gifts" role="group" aria-labelledby="hsj-q">' + list.map(giftCard).join('') + '</div>' +
      '<p class="hsj-offer" data-hsj-offer>' + offerText(n) + '</p>' +
      '<div class="hsj-when"><p>' + esc(MAKE_TIME) + '</p><p><b>' + esc(CHRISTMAS) + '</b> Free US shipping.</p></div>',
      '<button type="button" class="hsj-btn" data-hsj-start' + (n ? '' : ' disabled') + '><span>Start painting</span>' + ICON.brush + '</button>');
  }
  // a tap on a gift or a colour changes only that card, the offer and the button, so the list never jumps
  function paintGifts() {
    if (!app || stepFromURL() !== 'gifts') return;
    warmGift();
    GIFT_ORDER.forEach(function (g) {
      var card = app.querySelector('[data-hsj-gift-card="' + g + '"]');
      if (!card) return;
      var on = !!(S.gifts[g] && S.gifts[g].on), pickBtn = card.querySelector('[data-hsj-gift]');
      card.classList.toggle('is-on', on);
      pickBtn.setAttribute('aria-pressed', String(on));
      card.querySelector('.hsj-gift__check').innerHTML = on ? ICON.check : ICON.plus;
      var opts = card.querySelector('[data-hsj-gift-opts]'), html = on ? giftOptions(g) : '';
      if (opts.__html !== html) { opts.innerHTML = html; opts.__html = html; }
    });
    var n = chosenGifts().length, offer = app.querySelector('[data-hsj-offer]'), start = app.querySelector('[data-hsj-start]');
    if (offer) offer.innerHTML = offerText(n);
    if (start) start.disabled = !n;
  }
  // the note keeps one size whatever is in it, so a tone never moves the page
  function paintNote() {
    var box = app && app.querySelector('[data-hsj-note]');
    if (!box) return;
    var n = names(), l = lines(), busy = !!(S.request && S.request.tone === S.tone);
    // writing: soft shimmering bars where the lines go; when the lines land they arrive one by one
    var fresh = paintNote.busy && !busy;
    paintNote.busy = busy;
    box.classList.toggle('is-busy', busy);
    box.innerHTML = (busy ? '<div class="hsj-bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>' :
      '<div class="hsj-letter' + (fresh ? ' is-fresh' : '') + '">' + ['home', 'spot', 'together', 'meaning'].map(function (k) { return '<p>' + esc(l[k]) + '</p>'; }).join('') +
      '<p class="hsj-sign">Love, ' + esc(n.dog) + '</p></div>') +
      '<div class="hsj-note__foot"><span class="hsj-note__ask' + (busy ? ' is-writing' : '') + '" data-hsj-note-ask>' + (busy ? 'Writing it ' + TONE_LABEL[S.tone].toLowerCase() : rewriteNote.said || 'Not quite ' + esc(n.dog) + '?') + '</span>' +
      '<button type="button" class="hsj-text-btn" data-hsj-rewrite' + (busy ? ' disabled' : '') + '>' + ICON.redo + '<span>Write it again</span></button></div>';
    fitNote();
  }
  /* every word of the note shows (Krish, 4 Nov: the copy "gets cut off"). The type steps down from 17 px to a
     13 px floor until the four lines and the signature fit the card; on the smallest phones, past the floor,
     the note scrolls inside the card, which keeps its size, so a word is never out of reach. */
  function fitNote() {
    var box = app && app.querySelector('[data-hsj-note]'), letter = box && box.querySelector('.hsj-letter');
    if (!box) return;
    box.classList.remove('is-long');
    if (!letter) return;
    // a box not laid out yet (hidden, or mid-render) measures 0: measure again on the next frame
    if (letter.clientHeight < 40) { if (!fitNote.retry) { fitNote.retry = true; requestAnimationFrame(function () { fitNote.retry = false; if (letter.isConnected && letter.clientHeight >= 40) fitNote(); }); } return; }
    var sizes = [17, 16, 15, 14, 13];
    // measured from the layout, not scrollHeight: the lines arrive with a small slide, and a slide in
    // progress would read as overflow
    var fits = function () { var last = letter.lastElementChild; return !last || last.offsetTop + last.offsetHeight <= letter.offsetTop + letter.clientHeight + 1; };
    for (var i = 0; i < sizes.length; i++) {
      letter.style.setProperty('--hsj-fs', sizes[i] + 'px');
      if (fits()) return;
    }
    box.classList.add('is-long');
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
    return screen('photo', "Start with your dog's best photo", 'We paint your dog from it, so it looks like them.',
      '<label class="hsj-drop" data-hsj-drop>' + '<input type="file" accept="image/*" class="hsj-file" data-hsj-file>' +
      '<span class="hsj-drop__img" data-hsj-preview><span class="hsj-drop__ico">' + ICON.camera + '</span></span>' +
      '<span class="hsj-drop__text">Take or choose a photo</span><span class="hsj-drop__sub">It stays on your phone until the painting starts.</span></label>' +
      '<p class="hsj-photo-note" data-hsj-photo-note role="status"></p>' +
      '<button type="button" class="hsj-text-btn" data-hsj-override hidden>It\'s my dog. Use this photo.</button>' +
      '<ul class="hsj-tips" data-hsj-tips><li data-hsj-tip="face">' + ICON.face + '<span>Their face clearly in view</span></li><li data-hsj-tip="light">' + ICON.light + '<span>Good daylight</span></li><li data-hsj-tip="one">' + ICON.one + '<span>Just your dog, no other dogs</span></li></ul>',
      '<button type="button" class="hsj-btn" data-hsj-choose-photo><span>Choose a photo</span>' + ICON.camera + '</button>');
  }
  function view(step) {
    if (step === 'gifts') return viewGifts();
    if (step === 'tone') return viewTone();
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
    if (MODE === 'gift') { var m = /(?:^#|&)ask=([a-z]+)/.exec(window.location.hash || ''), a = m ? m[1] : ''; return STEPS.indexOf(a) === -1 ? '' : a; }
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
    if (MODE === 'gift') u.hash = step ? 'ask=' + step : '';
    else if (step) u.searchParams.set('step', step); else u.searchParams.delete('step');
    try { window.history[replace ? 'replaceState' : 'pushState']({ hsj: step }, '', u.pathname + u.search + u.hash); } catch (e) { /* file:// */ }
    render(step);
  }
  function render(step) {
    // when a new screen appeared, so a tap meant for the last one never answers this one
    if (render.step !== step) { render.step = step; render.at = Date.now(); }
    var hook = root.querySelector('[data-hsj-screen="hook"]');
    if (hook) hook.hidden = !!step;
    app.hidden = !step;
    app.setAttribute('data-hsj-step', step || '');
    if (MODE === 'home') document.documentElement.classList.toggle('hsj-focus', !!step);
    if (!step) {
      var resume = root.querySelectorAll('[data-hsj-resume]');
      resume.forEach(function (el) { el.hidden = !S.hasPhoto; });
      return;
    }
    app.innerHTML = '<div class="hsj__screen hsj__screen--step" data-hsj-screen="' + step + '">' + view(step) + '</div>';
    if (step === 'words') { paintNote(); compose(S.tone); if (!render.fit) { render.fit = true; window.addEventListener('resize', function () { fitNote(); }); try { document.fonts.ready.then(function () { fitNote(); }); } catch (e) { /* no font events */ } } }
    if (step === 'look' || step === 'gifts') { thumb(); warm(); }
    if (step === 'gifts') warmGift();
    if (step === 'look' || step === 'tone' || step === 'spot' || step === 'gifts') dogsAgain();
    var input = app.querySelector('[data-hsj-name], [data-hsj-person]');
    if (input) { nameHint(input); if (!('ontouchstart' in window)) input.focus(); }
    if (MODE === 'gift') { try { root.dispatchEvent(new CustomEvent('hsj:step', { bubbles: true, detail: { step: step } })); } catch (e) { /* old browser */ } }
    else window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.pageYOffset));
  }
  // the buyer's photo for the small thumbnail, from this tab, or from the device after a reload
  function thumb() {
    var paintThumbs = function () { if (!photoURL || !app) return; app.querySelectorAll('[data-hsj-thumb]').forEach(function (el) { el.style.backgroundImage = 'url("' + photoURL + '")'; }); };
    if (photoURL) { paintThumbs(); return; }
    idb('readonly', function (st) { return st.get(PHOTO); }).then(function (rec) { if (rec && rec.file && !photoURL) { photoURL = URL.createObjectURL(rec.file); paintThumbs(); } }, function () { /* no thumbnail, nothing else lost */ });
  }
  function nameHint(input) {
    var hint = app.querySelector('[data-hsj-name-hint]');
    if (!hint || !input) return;
    var n = nameCase(input.value);
    hint.textContent = n.length > NAME_MAX ? 'That prints as "Love, ' + n + '", which is too long. Up to ' + NAME_MAX + ' letters: a nickname works.' : '';
  }

  /* ----------------------------------------------------------------- events */
  /* The second tap of a double tap lands on the next screen, where its Next and its first answer sit in
     the same place (5 Nov: a test buyer's double tap on the style's Next skipped the tone and kept Warm,
     unseen). The browser counts it (detail 2); once the first tap has moved the screen on, it is
     ignored. A single tap, however quick, always counts. */
  var lastTap = 0, ANSWERS = ['data-hsj-next', 'data-hsj-pick', 'data-hsj-feel', 'data-hsj-style', 'data-hsj-tone', 'data-hsj-gift', 'data-hsj-variant', 'data-hsj-start'];
  function ghost(e, t) {
    var prev = lastTap; lastTap = Date.now();
    if (e.detail < 2) return false;
    // on a gift card or a colour, a double tap is one tap: the second would take the first back (5 Nov, a test
    // buyer's double tap left the mug unchosen)
    if (t.hasAttribute('data-hsj-gift') || t.hasAttribute('data-hsj-variant')) return true;
    return (render.at || 0) >= prev && ANSWERS.some(function (a) { return t.hasAttribute(a); });
  }
  function onClick(e) {
    var t = e.target.closest('button, a');
    if (!t || !root.contains(t)) return;
    if (ghost(e, t)) { e.preventDefault(); return; }
    if (t.hasAttribute('data-hsj-go')) { e.preventDefault(); track('start', {}); warm(); go(firstOpen()); return; }
    if (t.hasAttribute('data-hsj-resume-go')) { go(firstOpen()); return; }
    if (t.hasAttribute('data-hsj-restart')) { S = fresh(); save(); try { window.sessionStorage.removeItem(HS2); } catch (x) { /* fine */ } go(STEPS[0]); return; }
    if (t.hasAttribute('data-hsj-back')) {
      if (MODE === 'gift') { var prev = STEPS[STEPS.indexOf(stepFromURL()) - 1]; if (prev) window.history.back(); return; }
      if (window.history.length > 1) window.history.back(); else go(STEPS[STEPS.indexOf(stepFromURL()) - 1] || ''); return;
    }
    if (t.hasAttribute('data-hsj-gift')) {
      var g = t.getAttribute('data-hsj-gift'), cur = S.gifts[g] || {};
      S.gifts[g] = { on: !cur.on, variant: cur.variant || (chosenVariant(g) || {}).id || null };
      save(); track('gift', { gift: g, on: S.gifts[g].on }); paintGifts(); return;
    }
    if (t.hasAttribute('data-hsj-variant')) {
      var at = t.getAttribute('data-hsj-variant').split(':');
      S.gifts[at[0]] = { on: true, variant: at[1] }; save(); paintGifts(); return;
    }
    // the sheet answers only a deliberate tap: never a double tap's second tap, never in its first half second
    if ((t.hasAttribute('data-hsj-dogs-repick') || t.hasAttribute('data-hsj-dogs-keep')) && (e.detail > 1 || Date.now() - (dogsSheet.at || 0) < 500)) { e.preventDefault(); return; }
    if (t.hasAttribute('data-hsj-dogs-repick')) { dogsSheet(false); go('photo'); return; }
    if (t.hasAttribute('data-hsj-dogs-keep')) { S.photoDogsOk = true; save(); track('photo_dogs_keep', {}); dogsSheet(false); var go0 = app.querySelector('[data-hsj-start]'); if (go0) go0.click(); return; }
    if (t.hasAttribute('data-hsj-start')) {
      if (t.disabled) return;
      if (dogAsk()) { track('photo_dogs', { kind: dogAsk() }); dogsSheet(true); return; }
      var queue = handOver();
      if (!queue.length || !queue[0].url) { var say0 = app.querySelector('[data-hsj-offer]'); if (say0) say0.textContent = "That gift isn't available right now."; return; }
      track('paint', { gifts: queue.map(function (x) { return x.gift; }).join(','), style: S.style });
      t.disabled = true; t.classList.add('is-busy'); t.innerHTML = '<span>Start painting</span><span class="hsj-btn__dots" aria-hidden="true"></span>';
      window.location.href = queue[0].url; return;
    }
    if (t.hasAttribute('data-hsj-pick')) { pick(t.getAttribute('data-hsj-pick'), t.getAttribute('data-v')); return; }
    if (t.hasAttribute('data-hsj-tone')) { setTone(t.getAttribute('data-hsj-tone')); return; }
    if (t.hasAttribute('data-hsj-rewrite')) { if (!t.disabled) rewriteNote(); return; }
    if (t.hasAttribute('data-hsj-choose-photo')) { var f = app.querySelector('[data-hsj-file]'); if (f) f.click(); return; }
    if (t.hasAttribute('data-hsj-feel')) {
      S.tone = t.getAttribute('data-hsj-feel'); save();
      app.querySelectorAll('[data-hsj-feel]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      track('tone', { tone: S.tone, where: 'before-painting' }); return;
    }
    if (t.hasAttribute('data-hsj-style')) {
      S.style = t.getAttribute('data-hsj-style'); save();
      app.querySelectorAll('[data-hsj-style]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      track('style', { style: S.style }); return;
    }
    if (t.hasAttribute('data-hsj-next')) {
      if (t.disabled) return;
      if (stepFromURL() === 'toy') { S.toysDone = true; save(); }
      if (t.getAttribute('data-hsj-next') === 'done') { finishAsk(); return; }
      warm(); sendAnswers(); go(t.getAttribute('data-hsj-next')); return;
    }
    if (t.hasAttribute('data-hsj-override')) { t.hidden = true; if (pendingFile) usePhoto(pendingFile, true); return; }
  }
  // the first screen still waiting for an answer, or the last screen once every question is in
  function firstOpen() { var list = MODE === 'gift' ? ASK : HOME; for (var i = 0; i < list.length; i++) if (!answered(list[i])) return list[i]; return MODE === 'gift' ? 'words' : 'gifts'; }
  // the gift page's questions are done: the note and the names go onto the order, and the panel shows the painting
  function finishAsk() {
    S.noteDone = true; save(); sendAnswers(); track('note_done', { tone: S.tone });
    // the questions are over: the address stops saying #ask=words, so back, a reload or a shared link
    // lands on the painting, not on a finished question (5 Nov, ten-buyer run)
    if (MODE === 'gift') { try { var u = new URL(window.location.href); u.hash = ''; window.history.replaceState({ hsj: '' }, '', u.pathname + u.search); } catch (e) { /* file:// */ } }
    try { root.dispatchEvent(new CustomEvent('hsj:done', { bubbles: true })); } catch (e) { /* old browser */ }
  }
  function pick(group, v) {
    var step = stepFromURL();
    if (group === 'breed') {
      if (v === '__other') { S.breedOther = true; S.breed = ''; save(); render('breed'); var f = app.querySelector('[data-hsj-breed-search]'); if (f) f.focus(); return; }
      if (v === '__list') { S.breedOther = false; save(); render('breed'); return; }
      S.breedOther = false; S.breed = v;
    } else if (group === 'self') { S.rel = 'self'; S.person = ''; }
    else if (group === 'toy') {
      var list = (S.toys || []).slice(), at = list.indexOf(v);
      if (!v) { S.toys = []; S.toysDone = true; save(); go('wears'); return; }
      if (at !== -1) list.splice(at, 1); else if (list.length < MAX_TOYS) list.push(v); else { list.shift(); list.push(v); }
      S.toys = list; S.toysDone = false; save(); render('toy'); return;
    } else if (group === 'wears') S.accessory = v;
    else S[group] = v;
    save(); warm(); sendAnswers();
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
  /* The photo check runs out of sight (Krish, 4 Nov: the "Checking the photo" screen "is horrible, cuts off
     half the picture, and needs to not be in sight at all"). A photo that passes goes straight to the
     painter: the button says so for a moment and the painting screen is the next thing seen. Only a photo
     the check refuses is shown, whole, with Buddy's reason. Only the pixel checks run at the pick. The dog
     detector (about 18 MB) loads only once a photo is chosen, on a fast connection, and finishes its check out
     of sight (lateDogs): Krish, 5 Nov, "the 18 MB dog detector loads only after a photo is chosen, on fast
     connections, still checking in the background". It never loads on this step before a photo. */
  function busyPhoto(on) {
    var b = app.querySelector('[data-hsj-choose-photo]');
    if (!b) return;
    b.disabled = !!on;
    b.classList.toggle('is-busy', !!on);
    b.innerHTML = on ? '<span>Choose a photo</span><span class="hsj-btn__dots" aria-hidden="true"></span>' : '<span>Choose a photo</span>' + ICON.camera;
  }
  function showRefused(f) {
    var drop = app.querySelector('[data-hsj-drop]'), prev = app.querySelector('[data-hsj-preview]');
    if (!drop || !prev) return;
    drop.classList.add('has-photo');
    prev.style.setProperty('--hsj-photo', 'url("' + photoURL + '")');
    prev.innerHTML = '<img src="' + esc(photoURL) + '" alt="The photo you chose">';
  }
  function onChange(e) {
    var t = e.target;
    if (!t.hasAttribute('data-hsj-file') || !t.files || !t.files[0]) return;
    var f = t.files[0]; t.value = '';
    pendingFile = f;
    S.photoDogs = false; S.photoDogsOk = false; S.photoDogIssue = '';
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(f);
    var say = app.querySelector('[data-hsj-photo-note]'), over = app.querySelector('[data-hsj-override]');
    if (over) over.hidden = true;
    if (say) { say.textContent = ''; say.classList.remove('is-good'); }
    busyPhoto(true);
    if (!window.HSPhotoQuality) { usePhoto(f, false); return; }
    window.HSPhotoQuality.check(f, { detect: false, checkTimeout: 4000 }).then(function (r) {
      if (r.verdict === 'reject') {
        track('photo_rejected', { reasons: r.reasons.map(function (x) { return x.code; }).join(',') });
        busyPhoto(false);
        showRefused(f);
        if (say) say.textContent = r.reasons.map(function (x) { return x.message; }).join(' ');
        if (over) over.hidden = !r.overridable;
        return;
      }
      S.photoDogs = manyDogs(r);
      // the dog check is owed: it runs out of sight once the photo is kept
      usePhoto(f, false, true);
    }, function () { usePhoto(f, false, true); });
  }
  /* More than one dog in the photo (5 Nov judges: a photo of two dogs was accepted in 0.3 seconds, before the
     dog detector had loaded, and the blanket painted one of them with nothing said). The detector finishes
     its check out of sight while the buyer picks the look; if it sees more than one dog, Start painting asks
     once: another photo, or this one anyway. */
  function manyDogs(r) { return !!(r && r.reasons && r.reasons.some(function (x) { return x && x.code === 'dogs'; })); }
  // no dog found, or a dog too small in the frame: once refusals at the pick, now asked at Start painting too
  function dogIssue(r) {
    var codes = (r && r.reasons || []).map(function (x) { return x && x.code; });
    return codes.indexOf('nodog') !== -1 ? 'nodog' : codes.indexOf('far') !== -1 ? 'far' : '';
  }
  /* A fast connection: 4g without Data Saver (navigator.connection, Chromium). Safari and Firefox do not say,
     so there it loads, as the gift page's own check has since 28 Oct (hs2.js warmPhotoCheck); they skip only
     what they report as slow. */
  function fastLine() {
    var c = navigator.connection;
    if (!c) return true;
    return !c.saveData && (!c.effectiveType || c.effectiveType === '4g');
  }
  function lateDogs(f) {
    var Q = window.HSPhotoQuality, t = S.photoT;
    if (!Q || !Q.loadDetector || lateDogs.running === t || !fastLine()) return;
    lateDogs.running = t;
    Promise.resolve().then(function () { return Q.loadDetector(); }).then(function (d) {
      return d ? Q.check(f, { timeout: 8000, checkTimeout: 15000 }) : null;
    }).then(function (r) {
      if (lateDogs.running === t) lateDogs.running = 0;
      if (!r || !r.detection || S.photoT !== t) return;
      S.photoDogs = manyDogs(r); S.photoDogIssue = dogIssue(r); S.photoDogsT = t; save();
    }, function () { if (lateDogs.running === t) lateDogs.running = 0; /* no detector: the painter still paints, and nothing is said */ });
  }
  // a reload, or a discarded tab, part way through the late check: it runs again from the photo on this device
  function dogsAgain() {
    if (MODE !== 'home' || !S.hasPhoto || S.photoDogsT === S.photoT || lateDogs.running === S.photoT || !window.HSPhotoQuality || !window.HSPhotoQuality.loadDetector || !fastLine()) return;
    var t = S.photoT;
    idb('readonly', function (st) { return st.get(PHOTO); }).then(function (rec) { if (rec && rec.file && rec.t === t && S.photoT === t) lateDogs(rec.file); }, function () { /* no photo here: nothing to check */ });
  }
  // what the sheet says: the background check's finding about this photo
  var DOG_ASK = {
    dogs: ['More than one dog in this photo', 'Each gift paints one dog, so the other could be left out. A photo of just your dog works best.'],
    nodog: ["We couldn't find a dog in this photo", 'The painter paints the dog it sees. A photo with your dog clearly in view works best.'],
    far: ['Your dog looks small in this photo', 'The painting works best when your dog fills more of the photo. A closer one works best.']
  };
  function dogAsk() { return S.photoDogsOk ? '' : S.photoDogIssue || (S.photoDogs ? 'dogs' : ''); }
  function dogsSheet(on) {
    var sheet = app && app.querySelector('[data-hsj-dogs]');
    if (!sheet && on) {
      sheet = document.createElement('div');
      sheet.className = 'hsj-sheet'; sheet.setAttribute('data-hsj-dogs', ''); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'hsj-dogs-title');
      // the safe answer sits where Start painting was, so a second tap of a double tap lands on it (review, 5 Nov)
      sheet.innerHTML = '<div class="hsj-sheet__panel"><p class="hsj-sheet__title" id="hsj-dogs-title">More than one dog in this photo</p>' +
        '<p class="hsj-sheet__text">Each gift paints one dog, so the other could be left out. A photo of just your dog works best.</p>' +
        '<button type="button" class="hsj-sheet__keep" data-hsj-dogs-keep>Paint this photo anyway</button>' +
        '<button type="button" class="hsj-btn" data-hsj-dogs-repick><span>Choose another photo</span></button></div>';
      app.appendChild(sheet);
    }
    var say = DOG_ASK[dogAsk()];
    if (on && sheet && say) { sheet.querySelector('#hsj-dogs-title').textContent = say[0]; sheet.querySelector('.hsj-sheet__text').textContent = say[1]; }
    if (sheet) sheet.hidden = !on;
    if (on) dogsSheet.at = Date.now();
    if (on && sheet) { var b = sheet.querySelector('[data-hsj-dogs-repick]'); if (b) b.focus(); }
  }
  // a photo that passes is kept on this device and the style comes next; nothing is sent yet
  function usePhoto(f, overridden, late) {
    var say = app.querySelector('[data-hsj-photo-note]');
    if (say) say.textContent = '';
    if (overridden) track('photo_override', {});
    busyPhoto(true);
    savePhoto(f).then(function (ok) {
      if (!ok) { busyPhoto(false); if (say) say.textContent = "This browser couldn't keep the photo. Allow this site to store data, then choose it again."; return; }
      if (late) lateDogs(f); else { S.photoDogsT = S.photoT; save(); }
      track('photo', {});
      go('look');
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
    MODE = root.getAttribute('data-hsj-mode') === 'gift' ? 'gift' : 'home';
    // a journey begun before the spot moved to the home page still asks it here, so the note has all its lines
    if (MODE === 'gift' && !S.spot) { ASK.splice(ASK.indexOf('home') + 1, 0, 'spot'); GIFT = ASK.concat(['words']); }
    STEPS = MODE === 'gift' ? GIFT : HOME;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('keydown', onKey);
    if (MODE === 'gift') {
      // the note writer's address came over with the photo (the home page's section settings)
      try { var hj = (JSON.parse(window.sessionStorage.getItem(HS2) || '{}') || {}).hs_journey || {}; if (hj.compose) { cfg.composeUrl = hj.compose.url; cfg.ai = !!hj.compose.ai; } } catch (e) { /* no writer: the scripted lines */ }
      // hs-journey-choose.js shows these screens after the studio, and the painting after them
      window.HSJourney = {
        ask: function () { var s = stepFromURL(); go(s && allowed(s) ? s : firstOpen(), true); },
        asking: function () { return !!stepFromURL(); },
        done: function () { return !!S.noteDone && ASK.every(answered); },
        hide: function () { app.hidden = true; },
        dog: function () { return S.dog ? names().dog : ''; },
        send: sendAnswers
      };
      window.addEventListener('popstate', function () {
        var s = stepFromURL();
        // the questions are over: Back steps past their entries in one press instead of eight (5 Nov review)
        if (s && S.noteDone) { window.history.back(); return; }
        if (s) render(allowed(s) ? s : firstOpen());
      });
      try { root.dispatchEvent(new CustomEvent('hsj:ready', { bubbles: true })); } catch (e) { /* old browser */ }
      return;
    }
    window.addEventListener('popstate', function () { var s = stepFromURL(); render(allowed(s) ? s : ''); });
    // a gift page reached without the journey sends the buyer here with ?gift=; the dog comes first
    var q = new URLSearchParams(window.location.search);
    if (q.get('gift')) {
      var w = q.get('gift') === 'portrait' ? 'print' : q.get('gift');
      // a buyer who came from a gift's own page finds that gift already chosen
      if (/^(mug|blanket|print)$/.test(w)) { S.wanted = w; if (!S.gifts[w]) S.gifts[w] = { on: true, variant: null }; save(); }
      /* from the cart's drawer (hs-cart-more.js): &have= names the gifts already in the cart, which an earlier
         journey in this tab may still have ticked; they are unticked, so only the wanted gift paints (a second
         painting of a gift in the cart costs money and invites a duplicate), with the frame or color chosen there */
      if (/^(mug|blanket|print)$/.test(w) && q.get('have') != null) {
        String(q.get('have')).split(',').forEach(function (h) { h = h === 'portrait' ? 'print' : h; if (h !== w && /^(mug|blanket|print)$/.test(h) && S.gifts[h]) S.gifts[h].on = false; });
        S.gifts[w].on = true;
        if (/^\d+$/.test(q.get('variant') || '')) S.gifts[w].variant = Number(q.get('variant'));
        save();
      }
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
  /* On a gift page this file is started ahead of the deferred scripts (snippets/hs-journey-choose.liquid), so it
     starts once the page is parsed ('interactive'), not at DOMContentLoaded, which waits for every deferred
     script, Teeinblue's included. On the home page it is a defer script and starts at once. */
  function boot() { if (boot.done) return; boot.done = true; init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('readystatechange', function () { if (document.readyState !== 'loading') boot(); });
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();
})();
