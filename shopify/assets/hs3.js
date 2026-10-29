/* Heartside v3: gifts from your dog. Loaded (deferred) by sections/hs3-chat.liquid.
   The chat with Buddy, the reveal, choose gifts and the share card, from the approved
   prototype (design/prototype-v3/Main.dc.html) and docs/V3-GIFTS-FROM-YOUR-DOG.md.
   Chip answers never call the AI. "Something else" sends the typed words to Krish's n8n
   (two webhooks, section 5.4), which answers in the JSON of section 5.2 or not at all; any
   slow or failed call falls back to the buyer's own words, so the chat never waits long.
   State lives in sessionStorage ("hs3-gift"), so a reload or a product page loses nothing.
   Every step has its own address (/?step=spot, 27 Oct), so Back, Forward and reload land
   where the buyer expects; Back never erases an answer. The page scrolls like any page: no
   zoom-to-fit and no locked body (Krish, 27 Oct). Gifts, prices and photos come from the
   Shopify products the section picks.
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
  // the portrait's Dog's name layer holds 14, because "Love, " plus 14 fills its 20-character
  // Signed layer (Teeinblue layer-209591 and layer-501370); the mug's Signed is 20 too
  var NAME_MAX = 14;
  var COMPOSE_VERSION = 'explicit-tone-v1';
  var TYPED_MS = 5000, COMPOSE_MS = 11000; // 22 Oct: Gemini 3.5 Flash answers typed replies (about 3 s); Claude writes the note and n8n hands over to Gemini at 7.5 s
  var GIFTS = ['mug', 'blanket', 'print', 'ornament'];
  // the chat's steps in order, as they appear in the address (?step=)
  var ROUTES = ['dog', 'person', 'home', 'home-more', 'spot', 'together', 'meaning', 'ready'];
  var GIFT_ROUTE = { mug: 'mug', blanket: 'blanket', print: 'portrait', ornament: 'ornament' };
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var root, frame, cfg = {}, S = load(), photoURL = null, timers = [];
  var ui = { prefix: '', echo: '', thinking: false, typing: false, revealN: 0, editing: false, editKey: '', flagged: '', inked: {}, mugSide: 'left', mugTurned: false, toneStatus: '', view: '' };

  /* ------------------------------------------------------------------ state */
  function fresh() {
    // no pronoun until the buyer taps one (28 Oct); the copy says "they" meanwhile
    return { screen: 'hero', step: 1, dog: '', breed: '', breedId: '', pro: '', rec: '', rel: 'partner', noteSeen: '', notePolished: false,
      home: null, follow: null, spot: null, together: null, meaning: null,
      typed: {}, ai: {}, fu: null, edits: {}, composed: null, baseLines: null, toneDrafts: {}, toneCache: {}, composeRequest: null, composeBaseGift: null, appliedComposeKey: '', noteTone: 'warm', appliedTone: 'warm', gift: null, tabbed: false,
      sel: {}, shipTo: 'rec', calls: 0, session: '', hasPhoto: false, photoT: 0, photoStorageWarning: '', mugColor: '',
      more: false, composeStarted: false, answersChanged: false, returnTo: '', lastRoute: '', toy: '', accessory: '' };
  }
  function load() {
    var s = null;
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    var f = fresh();
    if (!s || typeof s !== 'object') return f;
    Object.keys(f).forEach(function (k) { if (!(k in s)) s[k] = f[k]; });
    // A reload cannot establish whether a dispatched request was billed or completed.
    if (s.composeRequest) s.composeRequest.status = 'uncertain';
    // sessions from before steps had addresses: the home follow-up and the "Show me" screen
    if (s.step === 3 && (s.fu || (s.home && s.home !== 'skip' && s.home !== 'typed' && !s.follow))) s.more = true;
    if (s.step === 6 && s.meaning) s.step = 7;
    if (s.composed || s.appliedComposeKey || s.composeRequest) s.composeStarted = true;
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
  /* A chat name as it will print (Krish, 28 Oct): spaces collapse, a stray apostrophe or hyphen
     at either end goes, and only a name typed all lowercase, or all caps with more than two
     letters, is recased: "PICKLE" and "pickle" print "Pickle", "jo-anne" "Jo-Anne", "o'malley"
     "O'Malley", "mcdonald" "McDonald". "JJ", "BB-8", "McFluffy" and "DeeDee" stay as typed, with
     the first letter up. Latin-1 letters, so "ZOË" prints "Zoë". Names typed on a product page are
     left alone. */
  function nameCase(x, d) {
    x = String(x == null ? '' : x).replace(/\s+/g, ' ').trim().replace(/^['’\- ]+|['’\- ]+$/g, '');
    if (!x) return d;
    var letters = x.replace(/[^A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/g, '');
    var lower = x === x.toLowerCase() && x !== x.toUpperCase();
    var upper = x === x.toUpperCase() && x !== x.toLowerCase() && letters.length > 2;
    if (!lower && !upper) return (x.charAt(0).toUpperCase() + x.slice(1)).replace(/([- ][a-z])/g, function (part) { return part.toUpperCase(); });
    return x.toLowerCase().split(/([ \-])/).map(function (part) {
      if (part === ' ' || part === '-' || !part) return part;
      var t = part.charAt(0).toUpperCase() + part.slice(1);
      if (/^[od]['’][a-z\u00DF-\u00F6\u00F8-\u00FF]/i.test(t)) t = t.slice(0, 2) + t.charAt(2).toUpperCase() + t.slice(3);
      else if (/^mc[a-z\u00DF-\u00F6\u00F8-\u00FF]/i.test(t) && t.length > 3) t = 'Mc' + t.charAt(2).toUpperCase() + t.slice(3);
      return t;
    }).join('');
  }
  function names() {
    var self = S.rel === 'self', rec = nameCase(S.rec, 'them');
    // she, her and is follow the pronoun the buyer tapped; none tapped reads "they" (28 Oct). When
    // the gift is for the buyer ("Me"), Buddy says you: them is "you" and theirs is "your".
    return { dog: nameCase(S.dog, 'Your dog'), rec: rec, she: S.pro === 'he' ? 'he' : S.pro === 'she' ? 'she' : 'they', her: S.pro === 'he' ? 'him' : S.pro === 'she' ? 'her' : 'them', is: S.pro === 'he' || S.pro === 'she' ? 'is' : 'are',
      self: self, them: self ? 'you' : rec, theirs: self ? 'your' : possessiveName(rec) };
  }
  function upFirst(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
  /* The breed, if the buyer gave one, through the corpus lookup (breeds-corpus/lookup). Only an
     exact match counts; its archetype (tone) is a light signal for the dog's voice, never shown.
     A breed picked from the list (S.breedId, 28 Oct) is that row; typed words count only when
     they are an exact name. A picked cross keeps its parents, which decide its energy. */
  function breedRow() {
    var B = window.HSBreeds, b = String(S.breed || '').trim();
    if (!B || (!b && !S.breedId)) return null;
    var r = null;
    try {
      if (S.breedId && typeof B.byId === 'function') r = B.byId(S.breedId);
      if (!r) r = B.lookup(b);
      if (r && S.breedId) r = r.id === S.breedId ? { id: r.id, name: r.name, kind: r.kind, exact: true, tone: r.tone, parents: r.parents } : null;
    } catch (e) { r = null; }
    return r;
  }
  function breedInfo() {
    var r = breedRow();
    return r && r.exact && r.kind !== 'mixed' ? { name: r.name, tone: r.tone } : null;
  }
  // house style (28 Oct): a name ending in s takes only an apostrophe, "Buttons'"; a stray
  // trailing apostrophe never doubles ("Sir Biscuit O'" never reads "O''s")
  // a name in Buddy's words or on a chip stays on one line, hyphen and all ("Jo-/anne" on 28 Oct)
  function keepNames(t) {
    var html = esc(t), n = names();
    [n.dog, n.rec].filter(function (x) { return x && /[\s\-\u2010]/.test(x); }).sort(function (a, b) { return b.length - a.length; }).forEach(function (x) {
      var e = esc(x);
      if (html.indexOf('<span class="hs3-nm">' + e) === -1) html = html.split(e).join('<span class="hs3-nm">' + e + '</span>');
    });
    return html;
  }
  function possessiveName(d) { d = String(d == null ? '' : d).replace(/['’]+$/, ''); return /s$/i.test(d) ? d + "'" : d + "'s"; }
  function dogFor() { var n = names(), d = { name: n.dog, pronoun: n.she }, b = breedInfo(); if (b) { d.breed = b.name; d.tone = b.tone; } return d; }
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
      door: { q: 'At the door. Every day? Even weekends? (I would.)', chips: [['weekends', 'Even weekends'], ['weekdays', 'Weekdays'], ['hears', 'Hears the car first']] },
      toy: { q: 'Ooh, a toy. The same one every time?', chips: [['same', 'Same one, always'], ['closest', 'Whatever is closest'], ['shoe', 'A shoe, honestly']] },
      spin: { q: 'Spins. How many circles are we talking?', chips: [['few', 'Two or three'], ['many', 'Too many to count'], ['dizzy', 'Until ' + n.she + ' ' + n.is + ' dizzy']] },
      cool: { q: 'Plays it cool? I could never. And then?', chips: [['follows', 'Follows ' + n.them + ' everywhere'], ['lap', 'Climbs onto ' + n.theirs + ' lap'], ['sighs', 'Sighs until ' + (n.self ? 'you look' : n.rec + ' looks')]] }
    };
  }
  /* The gift lines are the dog talking to the person (Krish, 20 Oct): I is the dog, you is the
     person, warm with a dog's logic and a little humour. Never the dog's name, he or she. */
  var H = {
    door: { weekends: 'I wait by the door for you, weekends too.', weekdays: "I'm at the door every weekday, waiting.", hears: 'I hear your car long before anyone else.' },
    toy: { same: "I bring you the same toy, because it's ours.", closest: 'I bring you whatever I can find, with love.', shoe: 'I bring you a shoe so you know I missed you.' },
    spin: { few: "When you come home, I can't help a spin.", many: 'You come home and I spin until I lose count.', dizzy: "I spin until I'm dizzy because you're home." },
    cool: { follows: 'I act cool, then follow you everywhere.', lap: "I play it cool until I'm in your lap.", sighs: 'I act cool, then sigh until you look at me.' }
  };
  var BASE = { door: 'I wait by the door until you come home.', toy: "I bring you a present whenever you're back.", spin: "When you walk in, I spin like it's a party.", cool: 'I play it cool for about four seconds.' };
  // Buddy never names a food, toy, object or place the buyer didn't (28 Oct: "hopefully some toast")
  var SP = { feet: 'Your feet make the best pillow I know.', bed: 'I took your side of the bed to keep it warm.', couch: 'I keep your spot on the couch warm for you.', anywhere: 'Wherever you go, I go.', skip: "I'm never far from you." };
  var TG = { walk: 'Our walks are the best part of my day.', coffee: 'Coffee with you is the best part of my morning.', movie: 'Movie night is better with me beside you.', naps: 'My best naps are the ones next to you.', car: "Any car ride is a good one if you're in it.", skip: 'Any time with you is my favorite time.' };
  var ME = { shadow: "I'm your shadow, and I like it that way.", best: "You're my best friend, and I'm yours.", hard: "On the hard days, I'll stay close to you.", boss: 'I run this house, but I love you most.', skip: "I'm yours, always." };
  var REACT4 = { weekends: "Weekends too? That's a dog who knows what matters.", weekdays: 'Every weekday, like clockwork. I respect that.', hears: "Hearing the car first is a dog's best trick.", same: 'A signature toy is a very classy move.', closest: 'Any present counts when it comes from the heart.', shoe: 'A shoe is a perfectly good present, if you ask me.', few: 'A tasteful little spin, I like it.', many: "That's a full spin cycle, which is my kind of dog.", dizzy: 'Spinning until dizzy is real commitment.', follows: 'Too cool for about a second, then right behind them.', lap: 'The slow climb into the lap is a classic move.', sighs: "The big sigh works every time, doesn't it." };
  var REACT5 = { feet: 'A built-in foot warmer, how thoughtful.', bed: "Their side of the bed? Bold, and I'd do the same.", couch: 'The couch spot is sacred, every dog knows that.', anywhere: 'A true shadow, which is the best kind of dog.', skip: "That's okay, on we go." };
  var REACT6 = { walk: 'Walks are the best part of the day for any dog.', coffee: 'Coffee time with company is the best kind.', movie: 'A couch and a movie sounds like the dream.', naps: "Naps together, now we're talking.", car: 'Car rides together are a big deal for any dog.', skip: 'No worries at all.' };
  // a reaction that talks about the person says you when the gift is for the buyer ("Me")
  function react(map, id, n) {
    var t = map[id] || '';
    return n && n.self ? t.replace(/\bthem\b/g, 'you').replace(/\bTheir\b/g, 'Your').replace(/\btheir\b/g, 'your') : t;
  }
  // the range as the brand book names it (27 Oct); prices and photos come from Shopify
  var GN = { mug: 'The mug', blanket: 'The blanket', print: 'The portrait', ornament: 'The ornament' };
  var SHORT = { mug: 'Mug', blanket: 'Blanket', print: 'Portrait', ornament: 'Ornament' };
  var DS = { mug: '11 oz, illustrated, inside color of your choice', blanket: '50 × 60 in tan sherpa, illustration only', print: '12 × 18 in, unframed or framed', ornament: 'Ceramic, for the tree' };
  var CATCH = "I didn't quite catch that one. Try again, or pick one of these?";

  function lineFor(key) {
    if (S.edits[key] != null) return S.edits[key];
    if (S.composed && S.composed.lines && S.composed.lines[key]) return S.composed.lines[key];
    if (key === 'home') {
      if (!S.home) return null;
      if (S.home === 'skip') return PLAIN.home;
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

  /* The mug's note prints in HS-Fraunces-Text at 70 px in an 860 px box (Cowork's mug v3 spec,
     15 Oct). Teeinblue wraps greedily and can leave one word alone ("Naps best when you are" /
     "there."), but it keeps a typed line break. So a line that won't fit one row gets "\n" at
     its most even break: "Naps best when\nyou are there.". "Steals your side of the bed."
     (858 px) still fits one row. The same breaks show on the reveal's mug. */
  /* note-widths:start (tools/fonts/build_note_widths.py, HS-Fraunces-Text, 1/1000 em; do not edit) */
  var NOTE_ADV = [221,303,331,644,586,730,955,156,343,343,621,550,248,406,238,483,646,443,590,536,592,562,590,503,578,594,244,254,508,550,508,494,876,706,674,692,776,642,591,753,822,378,464,754,610,892,770,790,660,791,709,588,670,738,694,1024,718,676,632,324,482,328,471,468,228,536,586,502,598,515,360,553,610,296,296,588,300,923,610,578,601,586,446,462,359,600,543,802,524,548,470,385,261,385,628];
  var NOTE_KERN = {"\",":-69,"\".":-69,"\":":-69,"\";":-69,"\"A":-66,"&T":-3,"&V":-4,"&W":-4,"&Y":-4,"',":-69,"'.":-69,"':":-69,"';":-69,"'A":-66,",\"":-69,",'":-69,",T":-71,",U":-14,",V":-71,",W":-71,",Y":-71,",v":-42,",w":-42,",y":-42,".\"":-69,".'":-69,".T":-71,".U":-14,".V":-71,".W":-71,".Y":-71,".v":-42,".w":-42,".y":-42,"47":-16,"70":-20,"72":-19,"74":-74,"78":-12,"79":-8,":\"":-69,":'":-69,":T":-71,":U":-14,":V":-71,":W":-71,":Y":-71,":v":-42,":w":-42,":y":-42,";\"":-69,";'":-69,";T":-71,";U":-14,";V":-71,";W":-71,";Y":-71,";v":-42,";w":-42,";y":-42,"A\"":-74,"A'":-74,"AC":-8,"AG":-8,"AO":-8,"AQ":-8,"AS":-8,"AT":-45,"AU":-8,"AV":-44,"AW":-44,"AY":-54,"Ac":-4,"Ad":-4,"Ae":-4,"Ag":-9,"Ao":-4,"Aq":-4,"As":-4,"Av":-34,"Aw":-34,"Ay":-34,"B\"":-3,"B'":-3,"BV":-18,"BW":-18,"BY":-18,"DA":-8,"DJ":-8,"DX":-14,"DY":-22,"Da":-6,"Db":-6,"Df":-6,"Dg":-14,"Dh":-6,"Di":-6,"Dj":-6,"Dk":-6,"Dl":-6,"Dm":-6,"Dn":-6,"Dr":-6,"EV":-6,"EW":-6,"EY":-6,"F,":-60,"F.":-60,"F:":-60,"F;":-60,"FA":-39,"FJ":-42,"FS":-6,"FV":-6,"FW":-6,"FX":-6,"FY":-6,"FZ":-6,"Fa":-39,"Fc":-28,"Fd":-28,"Fe":-28,"Ff":-14,"Fg":-38,"Fi":-11,"Fm":-11,"Fn":-11,"Fo":-28,"Fp":-20,"Fq":-28,"Fr":-11,"Fs":-24,"Ft":-10,"Fu":-13,"Fv":-8,"Fw":-8,"Fx":-8,"Fy":-8,"Fz":-8,"KT":-10,"Kc":-8,"Kd":-8,"Ke":-8,"Ko":-8,"Kp":-6,"Kq":-8,"Kv":-20,"Kw":-20,"Ky":-20,"L\"":-76,"L'":-76,"LA":-14,"LT":-44,"LV":-58,"LW":-58,"LY":-58,"Lf":-6,"Lv":-20,"Lw":-20,"Ly":-20,"OA":-8,"OJ":-8,"OX":-14,"OY":-22,"Oa":-6,"Ob":-6,"Of":-6,"Og":-14,"Oh":-6,"Oi":-6,"Oj":-6,"Ok":-6,"Ol":-6,"Om":-6,"On":-6,"Or":-6,"P,":-69,"P.":-69,"P:":-69,"P;":-69,"PA":-42,"PJ":-14,"PV":-13,"PW":-13,"PX":-14,"PY":-18,"Pa":-14,"Pc":-23,"Pd":-23,"Pe":-23,"Pg":-18,"Po":-23,"Pq":-23,"Ps":-14,"QA":-8,"QJ":-8,"QX":-14,"QY":-22,"Qa":-6,"Qb":-6,"Qf":-6,"Qg":-14,"Qh":-6,"Qi":-6,"Qj":-6,"Qk":-6,"Ql":-6,"Qm":-6,"Qn":-6,"Qr":-6,"RA":3,"RV":-23,"RW":-23,"RY":-30,"SA":-9,"ST":-8,"SV":-14,"SW":-14,"SY":-22,"Sf":-14,"Sg":-14,"T,":-71,"T.":-71,"T:":-71,"T;":-71,"TA":-45,"TJ":-36,"Ta":-52,"Tc":-52,"Td":-52,"Te":-52,"Tf":-14,"Tg":-50,"Ti":-26,"Tm":-26,"Tn":-26,"To":-52,"Tp":-22,"Tq":-52,"Tr":-26,"Ts":-50,"Tt":-15,"Tu":-22,"Tv":-4,"Tw":-4,"Tx":-17,"Ty":-4,"Tz":-27,"U,":-14,"U.":-14,"U:":-14,"U;":-14,"UA":-10,"UJ":-8,"Ua":-14,"Uf":-14,"Ug":-14,"Up":-6,"Us":-6,"Uv":-6,"Uw":-6,"Uy":-6,"Uz":-6,"V&":-4,"V,":-69,"V.":-69,"V:":-69,"V;":-69,"VA":-45,"VJ":-36,"VS":-14,"VZ":-14,"Va":-54,"Vc":-54,"Vd":-54,"Ve":-54,"Vf":-14,"Vg":-54,"Vi":-42,"Vj":-16,"Vm":-42,"Vn":-42,"Vo":-54,"Vp":-38,"Vq":-54,"Vr":-42,"Vs":-52,"Vt":-30,"Vu":-30,"Vv":-30,"Vw":-30,"Vx":-31,"Vy":-30,"Vz":-45,"W&":-4,"W,":-69,"W.":-69,"W:":-69,"W;":-69,"WA":-45,"WJ":-36,"WS":-14,"WZ":-14,"Wa":-54,"Wc":-54,"Wd":-54,"We":-54,"Wf":-14,"Wg":-54,"Wi":-42,"Wj":-16,"Wm":-42,"Wn":-42,"Wo":-54,"Wp":-38,"Wq":-54,"Wr":-42,"Ws":-52,"Wt":-30,"Wu":-30,"Wv":-30,"Ww":-30,"Wx":-31,"Wy":-30,"Wz":-45,"XC":-14,"XG":-14,"XO":-14,"XQ":-14,"Xc":-23,"Xd":-23,"Xe":-23,"Xg":-6,"Xo":-23,"Xq":-23,"Xt":-4,"Xu":-10,"Xv":-25,"Xw":-25,"Xy":-25,"Y&":-4,"Y,":-71,"Y.":-71,"Y:":-71,"Y;":-71,"YA":-54,"YC":-22,"YG":-22,"YJ":-36,"YO":-22,"YQ":-22,"YS":-22,"YZ":-14,"Ya":-57,"Yc":-59,"Yd":-59,"Ye":-59,"Yf":-14,"Yg":-60,"Yi":-38,"Yj":-18,"Ym":-38,"Yn":-38,"Yo":-59,"Yp":-50,"Yq":-59,"Yr":-38,"Ys":-60,"Yt":-32,"Yu":-32,"Yv":-38,"Yw":-38,"Yx":-38,"Yy":-38,"Yz":-43,"Zv":-14,"Zw":-14,"Zy":-14,"aT":-39,"aV":-44,"aW":-44,"aY":-52,"av":-14,"aw":-14,"ay":-14,"b\"":-3,"b'":-3,"bT":-48,"bV":-52,"bW":-52,"bX":-25,"bY":-59,"bv":-14,"bw":-14,"by":-14,"cT":-25,"cV":-28,"cW":-28,"cY":-36,"db":16,"dh":16,"dk":16,"dl":16,"eT":-25,"eV":-28,"eW":-28,"eY":-36,"f\"":14,"f'":14,"g,":-14,"g.":-14,"g:":-14,"g;":-14,"gT":8,"gX":-6,"gY":-29,"gZ":4,"h\"":-16,"h'":-16,"hT":-25,"hV":-38,"hW":-38,"hY":-38,"iV":-16,"iW":-16,"iY":-6,"jV":-14,"jW":-14,"jY":-15,"kC":-14,"kG":-14,"kO":-14,"kQ":-14,"kV":-28,"kW":-28,"kY":-32,"kZ":4,"lb":16,"lh":16,"lk":16,"ll":16,"m\"":-16,"m'":-16,"mT":-25,"mV":-38,"mW":-38,"mY":-38,"n\"":-16,"n'":-16,"nT":-25,"nV":-38,"nW":-38,"nY":-38,"o\"":-3,"o'":-3,"oT":-48,"oV":-52,"oW":-52,"oX":-25,"oY":-59,"ov":-14,"ow":-14,"oy":-14,"p\"":-3,"p'":-3,"pT":-48,"pV":-52,"pW":-52,"pX":-25,"pY":-59,"pv":-14,"pw":-14,"py":-14,"qT":-17,"qV":-36,"qW":-36,"qY":-48,"r,":-28,"r.":-28,"r:":-28,"r;":-28,"rA":-11,"rJ":-16,"rV":-32,"rW":-32,"rX":-25,"rY":-48,"sV":-34,"sW":-34,"sY":-48,"tV":-29,"tW":-29,"tY":-30,"uV":-16,"uW":-16,"uY":-6,"v,":-42,"v.":-42,"v:":-42,"v;":-42,"vA":-34,"vJ":-14,"vV":-28,"vW":-28,"vX":-23,"vY":-36,"va":-14,"vc":-14,"vd":-14,"ve":-14,"vo":-14,"vq":-14,"w,":-42,"w.":-42,"w:":-42,"w;":-42,"wA":-34,"wJ":-14,"wV":-28,"wW":-28,"wX":-23,"wY":-36,"wa":-14,"wc":-14,"wd":-14,"we":-14,"wo":-14,"wq":-14,"x\"":-3,"x'":-3,"xT":-16,"xV":-30,"xW":-30,"xY":-36,"y,":-42,"y.":-42,"y:":-42,"y;":-42,"yA":-34,"yJ":-14,"yV":-28,"yW":-28,"yX":-23,"yY":-36,"ya":-14,"yc":-14,"yd":-14,"ye":-14,"yo":-14,"yq":-14,"zT":-14,"zV":-36,"zW":-36,"zY":-36};
  /* note-widths:end */
  // mug note: Fraunces at 58 px since 22 Oct (Krish picked option A for 60-character lines), 70 px rows
  var NOTE_PX = 58, NOTE_LH = 70, NOTE_ROW = 860, NOTE_ALIAS = { '‘': "'", '’': "'", '“': '"', '”': '"' };
  function noteWidth(t) {
    var w = 0, prev = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      if (c.charCodeAt(0) > 126) c = NOTE_ALIAS[c] || (c.normalize ? c.normalize('NFD').charAt(0) : c);
      var code = c.charCodeAt(0);
      w += code >= 32 && code < 127 ? NOTE_ADV[code - 32] : NOTE_ADV[78]; // anything else: as wide as "n"
      if (prev) w += NOTE_KERN[prev + c] || 0;
      prev = c;
    }
    return w * NOTE_PX / 1000;
  }
  function evenBreak(line) {
    var t = String(line || '');
    if (t.indexOf('\n') !== -1 || noteWidth(t) <= NOTE_ROW) return t;
    var sp = [];
    for (var i = t.indexOf(' '); i !== -1; i = t.indexOf(' ', i + 1)) sp.push(i);
    var best = null, bestW = Infinity;
    // two rows at the most even break; three only if no two-row break fits (a very wide line)
    sp.forEach(function (a) { var w = Math.max(noteWidth(t.slice(0, a)), noteWidth(t.slice(a + 1))); if (w < bestW) { bestW = w; best = [a]; } });
    if (bestW > NOTE_ROW) sp.forEach(function (a) { sp.forEach(function (b) { if (b <= a) return; var w = Math.max(noteWidth(t.slice(0, a)), noteWidth(t.slice(a + 1, b)), noteWidth(t.slice(b + 1))); if (w < bestW) { bestW = w; best = [a, b]; } }); });
    if (!best) return t;
    var out = t.split('');
    best.forEach(function (i) { out[i] = '\n'; });
    return out.join('');
  }
  function mugLines() { var o = {}; giftKeys('mug').forEach(function (k) { o[k] = evenBreak(lineFor(k) || ''); }); return o; }
  function recGift() {
    if (S.composed && reviewGifts().indexOf(S.composed.gift) !== -1) return S.composed.gift;
    var t = S.together;
    if (t === 'movie' || t === 'naps') return 'blanket';
    if (t === 'walk' || t === 'coffee') return 'mug';
    // car rides, or anything else (a typed answer, "Not sure"): the framed print (spec 3)
    return 'print';
  }
  function giftKeys(g) {
    // the native gifts print one line, the meaning line, and the blanket prints no words (27 Oct)
    if (cfg.artworkCandidates) return g === 'blanket' ? [] : ['meaning'];
    if (g === 'mug') return ['home', 'spot', 'meaning'];
    if (g === 'ornament') return ['meaning'];
    return ['home', 'spot', 'together', 'meaning'];
  }
  function reasonFor(g, n) {
    if (S.composed && S.composed.reason && g === S.composed.gift) return S.composed.reason;
    // Buddy's mug reason repeats only the "together" answer the buyer picked; a typed answer
    // or "Not sure" gets skip (Cowork report 15 Oct, section 3; 140 characters at most)
    // when the gift is for the buyer ("Me"), Buddy says you (28 Oct)
    var d = n.dog, r = n.self ? 'you' : n.rec, s = n.self ? '' : 's';
    var MUG = {
      walk: d + ' lives for the morning walk. Good dog. The mug keeps ' + d + ' with ' + r + ' for the rest of the morning.',
      coffee: d + ' already keeps ' + r + ' company over coffee. Now ' + d + ' gets to be on the cup too.',
      movie: d + ' has movie night covered. The mug is for mornings, so ' + r + ' get' + s + ' ' + d + ' with every cup.',
      naps: d + ' naps best with ' + r + ' around. The mug keeps ' + d + ' close for the awake parts.',
      car: d + ' would ride anywhere with ' + r + '. With the mug, ' + d + ' comes along to every morning cup too.',
      skip: d + ' goes on one side, the note on the other. So ' + r + ' start' + s + ' every morning with both.'
    };
    return {
      mug: MUG[S.together] || MUG.skip,
      blanket: 'For the couch ' + (n.self ? 'you' : 'they') + ' share. Warm, soft, and ' + n.dog + ' is already on it.',
      // no door, window or couch the buyer never named (28 Oct): the portrait hangs on a wall at home
      print: 'For a wall at home, so ' + r + ' see' + s + ' ' + n.dog + ' every day.',
      ornament: 'For the tree. ' + n.dog + ' comes out every December, right where ' + r + ' will see.'
    }[g];
  }

  /* ---------------------------------------------------------------- the AI */
  function canCall(url) { return !!(cfg.ai && url && S.calls < MAX_CALLS && window.fetch); }
  function callAI(url, body, ms, lateResult) {
    if (!canCall(url)) return Promise.resolve(null);
    S.calls++; save();
    body.session = sessionId();
    var ctrl = window.AbortController ? new AbortController() : null;
    var done = false;
    return new Promise(function (resolve) {
      var t = setTimeout(function () { if (done) return; done = true; if (ctrl && !lateResult) ctrl.abort(); track('ai', { call: body.step || 'compose', result: 'timeout' }); resolve(null); }, ms);
      Promise.resolve().then(function () { return window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', mode: 'cors' }); })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (done) { if (lateResult) lateResult(j); return; } done = true; clearTimeout(t); track('ai', { call: body.step || 'compose', result: j ? 'ok' : 'error' }); resolve(j); })
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
  // the buyer's own words, cut only where a sentence or clause ends (22 Oct: a cut at 43 characters
  // printed "Always ready to run, walk and fetch. Not."); the same rule as n8n/shared.js
  // 22 Oct: lines print up to 60 characters; the meaning line stays at 44 (the ornament prints it alone)
  var MAX_LINE = { home: 60, spot: 60, together: 60, meaning: 44 };
  function maxFor(key) { return MAX_LINE[key] || 44; }
  function ownWords(t, key) {
    var cap = maxFor(key) - 1;
    // 28 Oct: a run of exclamation marks inside the words never prints; it becomes one period
    t = String(t || '').replace(/[\u2014\u2013]/g, ', ').replace(/\s+/g, ' ').trim().replace(/!+/g, '.').replace(/\.{2,}/g, '.').replace(/[.!?]+$/, '');
    t = t.replace(/([.?]\s+)([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
    if (!t) return '';
    if (t.length > cap) {
      var fit = function (parts, join) { var out = ''; for (var i = 0; i < parts.length; i++) { var next = out ? out + join + parts[i] : parts[i]; if (next.length > cap) break; out = next; } return out; };
      var sentences = t.split(/([.!?;])\s+/).reduce(function (a, x, i, all) { if (i % 2 === 0) a.push(x); return a; }, []);
      t = fit(sentences, '. ') || fit(sentences[0].split(/,\s+/), ', ');
      if (t.length < 12) return '';
    }
    return t.charAt(0).toUpperCase() + t.slice(1) + '.';
  }
  /* A typed line reads like the chip lines (Cowork round two, 15 Oct): no leading He, She, They
     or the dog's name, so "He howls until you sit on the sofa." prints "Howls until you sit on
     the sofa.". Gift lines never say I, me or my (V3 section 2), and the gift speaks to the
     person, so the buyer's own words (the line when the AI is off) turn my into your, as the AI
     does: "he howls the moment my key turns" prints "Howls the moment your key turns". A line
     that still says I after that prints the step's "Not sure" line. */
  var LEAD = /^(?:(?:he|she)(?:\s+is|\s+was|'s)?|they(?:\s+are|\s+were|'re)?)\s+/i;
  var FIRST = /(^|[^A-Za-z'])(I|I'm|I've|I'd|I'll|me|my|mine|myself)(?=$|[^A-Za-z'])/;
  var MINE = /(^|[^A-Za-z'])(I am|I was|I'm|I've|I'd|I'll|I|me|my|mine|myself)(?=$|[^A-Za-z'])/gi;
  var YOURS = { 'i am': 'you are', 'i was': 'you were', "i'm": "you're", "i've": "you've", "i'd": "you'd", "i'll": "you'll", i: 'you', me: 'you', my: 'your', mine: 'yours', myself: 'yourself' };
  var PLAIN = { home: 'Best part of my day? You walking in.', spot: SP.skip, together: TG.skip, meaning: ME.skip };
  function chipStyle(line, key) {
    var t = String(line || '').replace(/[‘’]/g, "'").trim().replace(/!+(?=.*\S)/g, '.').replace(/\.{2,}/g, '.');
    if (!t) return t;
    var dog = String(S.dog || '').trim(), rest = t.replace(LEAD, '');
    if (rest === t && dog && t.toLowerCase().indexOf(dog.toLowerCase() + ' ') === 0) rest = t.slice(dog.length + 1).replace(/^(is|was)\s+/i, '');
    if (rest !== t && /[A-Za-z]/.test(rest)) t = rest;
    t = t.replace(MINE, function (m, pre, w) { return pre + YOURS[w.toLowerCase()]; });
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return FIRST.test(t) ? (PLAIN[key] || '') : t;
  }
  /* A line from the AI is the dog talking (I, me, my) to the person (you). One that talks about
     the dog instead (he, she, its name: "Pretends he doesn't.") is the wrong voice and is dropped. */
  var THIRD = /(^|[^A-Za-z'])(he|she|him|his|her|hers|he's|she's)(?=$|[^A-Za-z'])/i;
  function dogStyle(line, key) {
    // an ellipsis or doubled period is one period, and the word after it starts a sentence (28 Oct:
    // "I wait at the window... until your car pulls in." printed "window. until"), as n8n's clean()
    var t = String(line || '').replace(/[‘’]/g, "'").replace(/!/g, '.').replace(/\.{2,}\s*([a-z])/g, function (m, c) { return '. ' + c.toUpperCase(); }).replace(/\.{2,}/g, '.').trim();
    if (!t || t.length > maxFor(key) || THIRD.test(t)) return '';
    var dog = String(S.dog || '').trim().toLowerCase();
    if (dog && t.toLowerCase().indexOf(dog) !== -1) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function clip(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n) : t; }
  // what the AI says on screen keeps the brand's level punctuation; the n8n contract is unchanged
  function level(t) { return String(t || '').replace(/!+/g, '.').replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\.{2,}/g, '.').replace(/\?\./g, '?'); }
  var GRIEF = /\b(died|dead|death|passed away|put down|put to sleep|rainbow bridge|cancer|funeral|in heaven)\b/i;
  var PROFANE = /\b(fuck|shit|bitch|cunt|asshole|bastard|whore|slut)\w*/i;
  // a chip that only says "I don't know": the page adds its own "Not sure" (28 Oct), the same rule as hs-artwork-profile.js
  var NONANSWER = /^(not sure|unsure|no idea|(i )?don['’]?t know|idk|dunno|skip|none|nothing|n\/?a|other|something else)[.!?]*$/i;
  /* Buddy never names a food, treat, toy, object or place the buyer didn't (Krish, 28 Oct: "For
     coffee time he replied hopefully some toast"). A closed list of concrete things, the same idea
     as the n8n guard: a reaction or reply that names one the buyer never said is dropped, and a
     line goes back to the buyer's own words. Singular forms; plurals are matched too. */
  var PROPS = {};
  ('toast bacon cheese croissant pizza sandwich steak chicken burger fry pancake waffle cookie cracker cake cupcake muffin bagel donut doughnut egg sausage ham turkey carrot apple banana berry peanut butter popcorn cereal kibble treat snack bone chew jerky biscuit crumb leftover breakfast lunch dinner food ' +
    'ball frisbee rope stick squeaky squeaker plush stuffie stuffy teddy duck hedgehog bunny squirrel kong ' +
    'sock shoe slipper boot sneaker blanket pillow cushion sofa couch bed rug carpet remote laptop phone key leash collar bandana sweater scarf hat glove towel newspaper mail chair table cup mug bowl basket crate door window car truck ' +
    'park beach lake river ocean sea pond forest wood mountain hill trail garden yard backyard porch balcony kitchen bathroom bedroom office store cafe vet groomer').split(' ').forEach(function (w) { PROPS[w] = true; });
  function propForms(w) {
    var out = [w];
    if (/ies$/.test(w)) out.push(w.slice(0, -3) + 'y');
    if (/es$/.test(w)) out.push(w.slice(0, -2));
    if (/s$/.test(w)) out.push(w.slice(0, -1));
    return out;
  }
  // what a word the buyer used already brings with it: coffee comes in a cup, never with food
  var IMPLIES = { coffee: ['cup', 'mug'], tea: ['cup', 'mug'], walk: ['leash'], drive: ['car'], ride: ['car'] };
  function invents(text, hay) {
    var said = {};
    String(hay || '').toLowerCase().split(/[^a-z\u00DF-\u00FF]+/).forEach(function (w) { if (w) propForms(w).forEach(function (f) { said[f] = true; (IMPLIES[f] || []).forEach(function (x) { said[x] = true; }); }); });
    return String(text || '').toLowerCase().replace(/['’]s\b/g, '').split(/[^a-z\u00DF-\u00FF]+/).some(function (w) {
      if (!w) return false;
      var forms = propForms(w), prop = forms.some(function (f) { return PROPS[f]; });
      return prop && !forms.some(function (f) { return said[f]; });
    });
  }
  // the AI's follow-up: no non-answer chips (each chip keeps its own line and reply), and no
  // question, chip, reply or line that names something the buyer never said. A question that
  // does ("Does Honey hear Sam's car?" when the buyer said only the door) is no follow-up at all,
  // the same rule as n8n's Enforce (28 Oct)
  function followUp(f, hay) {
    var out = { question: clip(level(f.question), 70), chips: [], lines: [], replies: [] };
    if (invents(out.question, hay)) return null;
    (f.chips || []).slice(0, 3).forEach(function (c, i) {
      c = clip(level(c), 24);
      if (!String(c).trim() || NONANSWER.test(String(c).trim()) || invents(c, hay)) return;
      var h = hay + ' ' + c, l = f.lines && f.lines[i], x = f.replies && f.replies[i];
      l = typeof l === 'string' ? dogStyle(l, 'home') || null : null;
      x = typeof x === 'string' && x.length <= 50 ? level(x) : null;
      out.chips.push(c); out.lines.push(l && !invents(l, h) ? l : null); out.replies.push(x && !invents(x, h) ? x : null);
    });
    return out;
  }
  // the typed-answer call (5.2); resolves to { reaction, line, follow_up, flags } or a fallback
  function typedAnswer(step, question, text, previous) {
    var n = names();
    var body = { step: step, question: question, typed_text: clip(text, 140), previous_line: previous || '', dog: dogFor(), recipient: { name: S.rec ? n.rec : '', relation: S.rel } };
    var key = step === 'home_follow' ? 'home' : step;
    return callAI(cfg.typedUrl, body, TYPED_MS).then(function (r) {
      if (r && typeof r === 'object' && (typeof r.line === 'string' || (r.flags && r.flags.length))) {
        // what the buyer said: their words, the line they are answering, the question and the names
        var hay = [text, previous, question, S.dog, S.rec].join(' ');
        var reaction = clip(level(r.reaction), 70), line = r.line ? dogStyle(r.line, key) : '';
        return {
          reaction: invents(reaction, hay) ? '' : reaction,
          line: r.line ? (line && !invents(line, hay) ? line : '') || ownWords(chipStyle(text, key), key) || previous || '' : '',
          follow_up: r.follow_up && r.follow_up.question ? followUp(r.follow_up, hay) : null,
          flags: Array.isArray(r.flags) ? r.flags : [], ai: true
        };
      }
      // no AI (off, slow, failed or over budget): the buyer's own words, and the scripted "Tell me more?"
      var flags = GRIEF.test(text) ? ['grief'] : PROFANE.test(text) ? ['profanity'] : [];
      return { reaction: 'Tell me more?', line: ownWords(chipStyle(text, key), key) || previous || '', follow_up: step === 'home' ? { question: 'Tell me more?', chips: [] } : null, flags: flags, ai: false };
    });
  }
  /* While the buyer types, a pause of 600 ms sends what they have so far. If they press Done
     on the same words, that answer is already back (or on its way), so Buddy replies at once.
     It spends from the same 8-call budget, so it never runs with fewer than 3 calls left. */
  var spec = null, specTimer = null;
  function typedParams(text) {
    if (S.step === 3 && S.fu) return { step: 'home_follow', prev: (S.ai.home && S.ai.home.line) || '', text: text };
    return { step: ({ 3: 'home', 4: 'spot', 5: 'together', 6: 'meaning' })[S.step], prev: '', text: text };
  }
  function speculate(text) {
    text = String(text || '').trim();
    if (text.length < 8 || GRIEF.test(text) || PROFANE.test(text)) return;
    if (!cfg.ai || S.calls > MAX_CALLS - 3) return;
    if (S.step === 3 && S.fu && !(S.fu.chips && S.fu.chips.length)) return; // the "Tell me more?" fallback needs no AI
    var p = typedParams(text);
    if (spec && spec.text === p.text && spec.step === p.step) return;
    var mine = spec = { step: p.step, text: p.text, prev: p.prev };
    mine.promise = typedAnswer(p.step, chatQ ? chatQ.question : '', p.text, p.prev);
    mine.promise.then(function (r) { if (!r.ai && spec === mine) spec = null; });
    track('ai_early', { step: p.step });
  }
  // the answer for exactly these words: the early one if it matches, otherwise a fresh call
  function answerFor(step, question, text, prev) {
    clearTimeout(specTimer);
    if (spec && spec.step === step && spec.text === String(text).trim() && spec.prev === (prev || '')) { var p = spec.promise; spec = null; return p; }
    spec = null;
    return typedAnswer(step, question, text, prev);
  }
  function anyTyped() { return Object.keys(S.typed).some(function (k) { return !!S.typed[k]; }); }
  /* Copy requests only. Image generation and production acceptance are separate gates.
     The chat's final button requests the first note; tone selection itself never calls AI. */
  function composeBody(tone) {
    var n = names();
    var answers = [];
    var push = function (id, chip, label) { answers.push({ id: id, chip: chip && chip !== 'typed' && chip !== 'skip' ? chip : null, label: label || '', typed: S.typed[id] || null }); };
    push('home', S.home, ''); push('home_follow', S.follow, ''); push('spot', S.spot, ''); push('together', S.together, ''); push('meaning', S.meaning, '');
    return { dog: dogFor(), recipient: { name: n.rec, relation: S.rel }, answers: answers, current_lines: S.baseLines || allLines(), default_gift: S.composeBaseGift || recGift(), note_tone: tone };
  }
  function composeKey(tone) { return JSON.stringify({ version: COMPOSE_VERSION, body: composeBody(tone) }); }
  function toneName(tone) { return { sentimental: 'Sentimental', warm: 'Warm with a wink', hilarious: 'Hilarious' }[tone] || 'Warm with a wink'; }
  /* Only what is true right now (28 Oct): Buddy's first note shows as "Buddy is writing your
     note" at the note itself, an update says it is writing, and a tone the note isn't in yet
     names both tones. */
  function toneStatus() {
    if (S.composeRequest) return S.composeRequest.status === 'pending' ? (S.composeRequest.auto ? '' : 'Buddy is writing your note…') : "Your words are safe. The last update didn't come back.";
    if (ui.toneStatus) return ui.toneStatus;
    if (S.appliedComposeKey === composeKey(S.noteTone)) return '';
    if (S.answersChanged) return 'Your answers changed. Choose Update note when you want a new version.';
    return (S.appliedComposeKey ? 'This note is ' + toneName(S.appliedTone) + '. ' : '') + 'Update note asks Buddy for a ' + toneName(S.noteTone) + ' version.';
  }
  /* One tone everywhere (28 Oct: the slider said Warm with a wink, the product page Sentimental):
     the shared choice the product pages read is the slider's tone and the first note's tone. */
  function syncTone() {
    if (!cfg.artworkCandidates || !window.HSArtworkChoices) return S.noteTone;
    try { var t = window.HSArtworkChoices.read().tone; if (['sentimental', 'warm', 'hilarious'].indexOf(t) !== -1) S.noteTone = t; } catch (e) { /* keep the chat's own */ }
    return S.noteTone;
  }
  /* While Buddy writes the first note, the note says so instead of showing a draft line that is
     about to change (28 Oct: order 3's line changed 3 seconds after the buyer read it). A word
     the buyer changed is theirs and always shows. */
  function writing(key) {
    return !!(S.composeRequest && S.composeRequest.auto && S.composeRequest.status === 'pending' && !(S.edits && S.edits[key] != null));
  }
  /* A request that never came back holds further updates, because a reload cannot tell whether
     it was billed. The buyer can let it go and keep the words on screen; nothing is sent. */
  function keepWords() {
    if (!S.composeRequest || S.composeRequest.status !== 'uncertain') return;
    S.composeRequest = null; ui.toneStatus = 'Kept your words as they are.';
    track('keep_words', {}); save(); render();
  }
  function selectTone(tone) {
    if (['sentimental', 'warm', 'hilarious'].indexOf(tone) === -1 || tone === S.noteTone) return;
    if (cfg.artworkCandidates && window.HSArtworkChoices) {
      try { window.HSArtworkChoices.select({tone: tone}); }
      catch (e) {
        ui.toneStatus = 'Your shared choice could not be saved. Your previous tone is still selected. Please try again.';
        if (frame) {
          var index = {sentimental: 0, warm: 1, hilarious: 2}[S.noteTone];
          var name = ['Sentimental', 'Warm with a wink', 'Hilarious'][index];
          var range = frame.querySelector('[data-hs3-tone]'), label = frame.querySelector('[data-hs3-tone-name]');
          var error = frame.querySelector('#hs3-tone-status');
          if (range) { range.value = index; range.setAttribute('aria-valuetext', name); }
          if (label) label.textContent = name;
          if (error) error.textContent = ui.toneStatus;
        }
        return;
      }
    }
    S.noteTone = tone; ui.toneStatus = '';
    track('tone_pick', { tone: tone }); save();
    // Keep the range element mounted so repeated arrow keys retain focus.
    if (frame) {
      var status = frame.querySelector('#hs3-tone-status');
      var button = frame.querySelector('[data-hs3="updateTone"]');
      if (status) status.textContent = cfg.artworkCandidates && (S.gift || recGift()) === 'blanket' ? 'Sets the mood of the painting.' : toneStatus();
      if (button) button.disabled = !!S.composeRequest || S.appliedComposeKey === composeKey(S.noteTone);
    }
  }
  function applyComposed(result, tone, key, rewrite) {
    // User-owned edits always win in lineFor, including edits made during a request.
    // A line the buyer already read that changes now says so at the note (28 Oct).
    var now = S.edits && S.edits.meaning != null ? S.edits.meaning : result.lines && result.lines.meaning;
    S.notePolished = !!(S.noteSeen && now && now !== S.noteSeen);
    S.composed = result; S.appliedTone = tone; S.appliedComposeKey = key; S.answersChanged = false;
    if (!rewrite && result.gift && !S.tabbed && S.screen === 'reveal') S.gift = result.gift;
    ui.toneStatus = '';
  }
  function settleCompose(request, r) {
    if (!S.composeRequest || S.composeRequest.id !== request.id) return;
    if (!r) {
      // the reveal's own first note: the chat's lines stay, the slider stays free, and nothing
      // is said; a later Update note still counts against the call cap
      if (request.auto) { S.composeRequest = null; save(); if (!ui.editing) render(); return; }
      S.composeRequest.status = 'uncertain'; save(); if (!ui.editing) render(); return;
    }
    var lines = {};
    ['home', 'spot', 'together', 'meaning'].forEach(function (k) { var l = r.lines && dogStyle(r.lines[k], k); if (l) lines[k] = l; });
    S.composeRequest = null;
    if (Object.keys(lines).length !== 4 || (request.rewrite && r.source && r.source !== 'ai') || (request.tone === 'hilarious' && Array.isArray(r.flags) && r.flags.indexOf('grief') !== -1)) {
      ui.toneStatus = 'Could not rewrite this note. Your words are unchanged.';
    } else {
      var old = S.composed;
      var result = { lines: lines, gift: request.rewrite && old ? old.gift : (GIFTS.indexOf(r.recommended_gift) !== -1 ? r.recommended_gift : null), reason: request.rewrite && old ? old.reason : (typeof r.reason === 'string' && r.reason.length <= 140 ? r.reason : '') };
      S.toneCache[request.key] = result;
      if (composeKey(S.noteTone) === request.key) applyComposed(result, request.tone, request.key, request.rewrite);
      else ui.toneStatus = 'Your earlier version is ready. Choose Update note to apply your selected tone.';
    }
    save(); if (!ui.editing) render();
  }
  function compose(tone, rewrite, auto) {
    tone = tone || 'warm';
    if (['sentimental', 'warm', 'hilarious'].indexOf(tone) === -1 || S.composeRequest) return;
    if (!S.baseLines) S.baseLines = allLines();
    if (!S.composeBaseGift) S.composeBaseGift = recGift();
    var key = composeKey(tone);
    if (S.appliedComposeKey === key) return;
    S.notePolished = false;
    if (S.toneCache[key]) { applyComposed(S.toneCache[key], tone, key, rewrite); save(); render(); return; }
    if (!canCall(cfg.composeUrl)) { ui.toneStatus = 'Updates are unavailable right now. Your words are unchanged.'; render(); return; }
    var body = composeBody(tone);
    var id = sessionId() + '-note-' + (S.composeAsked = (S.composeAsked || 0) + 1);
    var request = S.composeRequest = { id: id, key: key, tone: tone, rewrite: !!rewrite, auto: !!auto, status: 'pending' };
    save();
    // Persist before dispatch. If storage is unavailable, a reload would defeat the guard.
    var persisted = false;
    try { persisted = JSON.parse(window.sessionStorage.getItem(KEY)).composeRequest.id === id; } catch (e) { /* unavailable storage */ }
    if (!persisted) { S.composeRequest = null; ui.toneStatus = 'Your browser could not save this update. Your words are unchanged.'; render(); return; }
    render();
    return callAI(cfg.composeUrl, body, COMPOSE_MS, function (r) { settleCompose(request, r); }).then(function (r) { settleCompose(request, r); });
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
  function usePhoto(file, t, transferable) {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(file);
    S.hasPhoto = transferable !== false; S.photoT = t; save();
    document.querySelectorAll('[data-hs3-photo]').forEach(function (img) { img.src = photoURL; });
  }
  function restorePhoto() {
    return idb('readwrite', function (st) {
      var req = st.get(PHOTO);
      // Check and delete in one transaction, so cleanup cannot erase a newer photo.
      req.onsuccess = function () { var rec = req.result; if (rec && Date.now() - rec.t >= 3 * 864e5) st.delete(PHOTO); };
      return req;
    }).then(function (rec) {
      // a photo added on a product page is newer than the chat's; hs2 records its time, so the
      // chat adopts it instead of forgetting the photo for the next gift (27 Oct review)
      var bridgeT = 0;
      try { bridgeT = Number((JSON.parse(window.sessionStorage.getItem(HS2) || '{}') || {}).hs3_photo_t) || 0; } catch (e) { bridgeT = 0; }
      var fresh = rec && rec.file && Date.now() - rec.t < 3 * 864e5;
      if (fresh && ((S.hasPhoto && rec.t === S.photoT) || (bridgeT && rec.t === bridgeT))) usePhoto(rec.file, rec.t);
      else { S.hasPhoto = false; S.photoT = 0; save(); }
    }).catch(function () { S.hasPhoto = false; S.photoT = 0; save(); });
  }
  function photoStorageStatus() {
    if (!frame) return;
    var status = frame.querySelector('[data-hs3-photo-storage]');
    var message = ui.photoSaving ? 'Saving your photo before you continue…' : S.photoStorageWarning;
    if (!status && message) {
      status = document.createElement('p'); status.className = 'hs3-small';
      status.setAttribute('data-hs3-photo-storage', ''); status.setAttribute('role', 'status'); frame.appendChild(status);
    }
    if (status) { status.hidden = !message; status.textContent = message || ''; }
  }
  function attachPhoto(file) {
    var t = Math.max(Date.now(), (ui.photoSaving || S.photoT || 0) + 1);
    usePhoto(file, t, false);
    // A local preview is not proof that another page can restore the photo.
    S.hasPhoto = false; S.photoStorageWarning = ''; ui.photoSaving = t; save(); photoStorageStatus();
    var timer;
    var timeout = new Promise(function (_, reject) { timer = setTimeout(function () { reject(new Error('photo storage timeout')); }, 8000); });
    return Promise.race([idb('readwrite', function (st) { return st.put({file: file, t: t}, PHOTO); }), timeout]).then(function () {
      clearTimeout(timer);
      if (ui.photoSaving !== t) return;
      S.hasPhoto = true; ui.photoSaving = 0; save(); photoStorageStatus();
    }).catch(function () {
      clearTimeout(timer);
      if (ui.photoSaving !== t) return;
      S.hasPhoto = false; S.photoT = 0; ui.photoSaving = 0;
      S.photoStorageWarning = 'Your browser could not save this photo. Choose it again on your gift, or try adding a photo here again.';
      save(); photoStorageStatus();
    });
  }
  /* The same on-device check the product page runs (hs-photo-quality.js): a photo that can't make
     good artwork is turned away here, with the reason, before it is saved for the gifts. A dog the
     detector missed can still be used ("It's my dog"); a warning keeps the photo. */
  function checkPhoto(f, done) {
    if (!window.HSPhotoQuality) { done(); return; }
    photoNote('Checking your photo on your device.');
    window.HSPhotoQuality.check(f, { timeout: 4000 }).then(function (r) {
      var say = r.reasons.map(function (x) { return x.message; }).join(' ');
      if (r.verdict === 'reject') {
        track('photo_rejected', { reasons: r.reasons.map(function (x) { return x.code; }).join(',') });
        photoNote(say, r.overridable ? function () { track('photo_override', {}); photoNote(''); done(); } : null);
        return;
      }
      photoNote(r.verdict === 'warn' ? say : '');
      done();
    });
  }
  function photoNote(message, override) {
    if (!frame) return;
    var box = frame.querySelector('[data-hs3-photo-note]');
    if (!box && message) {
      box = document.createElement('div'); box.className = 'hs3-photo-note'; box.setAttribute('data-hs3-photo-note', '');
      box.innerHTML = '<p class="hs3-small" role="alert"></p><button type="button" class="hs3-quiet" hidden>It\'s my dog. Use this photo.</button>';
      var dock = frame.querySelector('.hs3-dock'); (dock || frame).appendChild(box);
    }
    if (!box) return;
    box.hidden = !message;
    box.querySelector('p').textContent = message || '';
    var btn = box.querySelector('button');
    btn.hidden = !override;
    btn.onclick = override ? function () { btn.hidden = true; override(); } : null;
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
    // a name longer than the signature holds never reaches the product page (28 Oct: it printed cut)
    st.dog = S.dog && n.dog.length <= NAME_MAX ? n.dog : '';
    st.person = S.rec ? n.rec : '';
    st.hs3_lines = allLines();
    st.hs3_mug_lines = mugLines();
    st.hs3_copy_owner = Object.keys(S.edits || {}).some(function(k) { return S.edits[k] != null; }) ? 'user' : 'generated';
    // never clobber a newer photo the buyer added on a product page (27 Oct review)
    if (S.hasPhoto) st.hs3_photo_t = S.photoT;
    else if (!(Number(st.hs3_photo_t) > (S.photoT || 0))) st.hs3_photo_t = 0;
    var kinds = {};
    GIFTS.forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) kinds[x.handle] = g; });
    st.hs3_kinds = kinds;
    st.hs_answers = answerSummary();
    if (window.HSArtworkProfile) st.hs3_art_profile = window.HSArtworkProfile.fromChat(S);
    // the breed's energy for the painting: pose and expression only, never shown and never a fact
    st.hs3_energy = '';
    try { if ((S.breed || S.breedId) && window.HSArtworkEngine && window.HSBreeds) st.hs3_energy = window.HSArtworkEngine.energyFor(breedRow()) || ''; } catch (e) { /* unknown breed: no energy */ }
    if (cfg.artworkCandidates && window.HSArtworkChoices) st.hs3_art_choices = window.HSArtworkChoices.read();
    st.hs_ship_to = S.shipTo === 'me' || n.self ? 'Me (the buyer)' : (S.rec ? n.rec : 'Them');
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
  var BUDDY = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g class="hs3-head"><path d="M34 120 C 34 96, 44 86, 58 84 L 74 84 C 84 88, 88 100, 88 120 Z" fill="#7A4027"/><rect x="44" y="84" width="40" height="7" rx="3.5" fill="#F0C0C0"/><ellipse cx="58" cy="58" rx="30" ry="27" fill="#8A4A2B"/><ellipse cx="90" cy="66" rx="22" ry="13" fill="#95553A"/><ellipse cx="95" cy="70" rx="15" ry="8.5" fill="#CFC4BA"/><ellipse cx="110" cy="62" rx="6.5" ry="5.5" fill="#121010"/><circle cx="70" cy="50" r="4" fill="#121010"/><circle cx="71.3" cy="48.6" r="1.2" fill="#FFFDF9"/><path d="M64 42 Q 70 38 76 42" fill="none" stroke="#CFC4BA" stroke-width="2.5" stroke-linecap="round"/><path d="M96 76 Q 102 79 107 75" fill="none" stroke="#5A2E1C" stroke-width="2" stroke-linecap="round"/><g class="hs3-ear"><path d="M44 34 C 24 36, 20 72, 32 88 C 40 98, 54 90, 54 74 C 54 58, 54 42, 44 34 Z" fill="#6A3520"/></g></g></svg>';
  var PAW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><ellipse cx="6" cy="9" rx="2.4" ry="3.1"/><ellipse cx="10.5" cy="5.5" rx="2.4" ry="3.1"/><ellipse cx="15.5" cy="5.5" rx="2.4" ry="3.1"/><ellipse cx="20" cy="9" rx="2.4" ry="3.1"/><path d="M13 11c-4 0-7 4-7 7 0 2 1.6 3 3.4 3 1.6 0 2.4-.8 3.6-.8s2 .8 3.6.8c1.8 0 3.4-1 3.4-3 0-3-3-7-7-7z"/></svg>';
  var ICON = {
    mug: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/></svg>',
    blanket: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10.5h18"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="1.5"/><circle cx="12" cy="10" r="3"/><path d="M8.5 16h7"/></svg>',
    ornament: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="7"/><path d="M10 7V5h4v2M12 5V2"/></svg>'
  };
  function pills() { return '<div class="hs3-pills" aria-hidden="true">' + reviewGifts().map(function (g) { return '<span class="hs3-pill">' + ICON[g] + SHORT[g] + '</span>'; }).join('') + '</div>'; }
  function sign(n) { return '<span class="hs3-sign">Love, ' + esc(n.dog) + ' ' + PAW + '</span>'; }
  // the blanket, print and ornament print the paw centered under the signature (round two, 14 Oct)
  function signUnder(n) { return '<span class="hs3-sign hs3-sign--under">Love, ' + esc(n.dog) + PAW + '</span>'; }
  function img(alt, cls) { var src = photoSrc(); return src ? '<img data-hs3-photo src="' + esc(src) + '" alt="' + esc(alt) + '" class="hs3-photo ' + (cls || '') + '">' : '<span class="hs3-photo hs3-photo--empty ' + (cls || '') + '">' + PAW + '</span>'; }
  function privacy() { var p = root.querySelector('[data-hs3-privacy]'); return p ? '<p class="hs3-privacy">' + esc(p.textContent) + '</p>' : ''; }

  /* ------------------------------------------------------------------ the address
     Each step is a real page: /?step=spot. render() writes it (push when the buyer moves on,
     replace when restoring), Back and Forward re-apply it, and a reload lands on it. A step the
     answers don't reach yet clamps back to the furthest one they do, so a shared or stale link
     can never skip a question. Other query parameters (utm_*) ride along untouched. */
  var nav = { route: '', depth: 0, replace: false };
  function historyOK() {
    return !!(window.history && typeof window.history.pushState === 'function' && window.location && !(window.Shopify && window.Shopify.designMode));
  }
  function routeOf() {
    if (S.screen === 'hero') return 'hero';
    if (S.screen === 'reveal') { var g = reviewGifts().indexOf(S.gift) !== -1 ? S.gift : recGift(); return 'gift-' + GIFT_ROUTE[g]; }
    if (S.screen === 'choose') return 'choose';
    if (S.screen === 'share') return 'card';
    if (S.step === 3) return S.more ? 'home-more' : 'home';
    return ROUTES[[0, 0, 1, 2, 4, 5, 6, 7][S.step] || 0];
  }
  // the dog's name as Next lets it through: there, and no longer than the signature holds (28 Oct:
  // the browser's Forward once carried a 23-letter name past Next, and the gift went unsigned)
  function dogOK() { var d = nameCase(S.dog, ''); return !!d && d.length <= NAME_MAX; }
  function routeOK(r) {
    var chip = S.home && S.home !== 'skip' && S.home !== 'typed';
    switch (r) {
      case 'hero': case 'dog': return true;
      case 'person': return dogOK();
      case 'home': return !!(dogOK() && String(S.rec).trim());
      case 'home-more': return routeOK('home') && !!(chip || S.fu);
      case 'spot': return routeOK('home') && !!S.home && !S.fu;
      case 'together': return routeOK('spot') && !!S.spot;
      case 'meaning': return routeOK('together') && !!S.together;
      default: return routeOK('meaning') && !!S.meaning; // ready, the gifts, choose and the card
    }
  }
  function clampRoute(r) {
    var giftKey = null;
    Object.keys(GIFT_ROUTE).forEach(function (k) { if (r === 'gift-' + GIFT_ROUTE[k] && reviewGifts().indexOf(k) !== -1) giftKey = k; });
    if (r !== 'hero' && r !== 'choose' && r !== 'card' && ROUTES.indexOf(r) === -1 && !giftKey) return 'hero';
    if (routeOK(r)) return r;
    for (var i = ROUTES.length - 1; i >= 0; i--) if (ROUTES.indexOf(r) === -1 || i < ROUTES.indexOf(r)) { if (routeOK(ROUTES[i])) return ROUTES[i]; }
    return 'dog';
  }
  // the state a route shows; answers are never part of it
  function routeFor(r) {
    if (r === 'hero') return { screen: 'hero' };
    if (r === 'choose') return { screen: 'choose' };
    if (r === 'card') return { screen: 'share' };
    if (r.indexOf('gift-') === 0) {
      var g = recGift();
      Object.keys(GIFT_ROUTE).forEach(function (k) { if ('gift-' + GIFT_ROUTE[k] === r) g = k; });
      return { screen: 'reveal', gift: g };
    }
    var i = ROUTES.indexOf(r);
    return { screen: 'chat', step: [1, 2, 3, 3, 4, 5, 6, 7][i] || 1, more: r === 'home-more' };
  }
  function prevRoute(r) {
    if (r === 'card') return 'choose';
    if (r === 'choose') return 'gift-' + GIFT_ROUTE[reviewGifts().indexOf(S.gift) !== -1 ? S.gift : recGift()];
    if (r.indexOf('gift-') === 0) return 'ready';
    if (r === 'spot') return S.fu || (S.home && S.home !== 'skip' && S.home !== 'typed') ? 'home-more' : 'home';
    var i = ROUTES.indexOf(r);
    return i > 0 ? ROUTES[i - 1] : 'hero';
  }
  function urlFor(r) {
    var u = new URL(window.location.href);
    if (r === 'hero') u.searchParams.delete('step'); else u.searchParams.set('step', r);
    ['hs3', 'gift', 'return'].forEach(function (k) { u.searchParams.delete(k); });
    return u.pathname + u.search + u.hash;
  }
  function routeFromURL() {
    var q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return ''; }
    return q.get('step') || '';
  }
  function writeHistory() {
    if (!historyOK()) return;
    var r = routeOf();
    if (r === nav.route) return;
    try {
      if (!nav.route || nav.replace) window.history.replaceState({ hs3: r, depth: nav.depth }, '', urlFor(r));
      else {
        // remember where the buyer was on the page they leave, for Back
        window.history.replaceState({ hs3: nav.route, depth: nav.depth, y: window.scrollY || 0 }, '');
        nav.depth++;
        window.history.pushState({ hs3: r, depth: nav.depth }, '', urlFor(r));
      }
    } catch (e) { /* a sandboxed frame can refuse */ }
    nav.route = r; nav.replace = false;
    // where "Pick up where you left off" returns to; saved now, since render runs after save
    if (r !== 'hero' && S.lastRoute !== r) { S.lastRoute = r; save(); }
  }
  // show a route without touching any answer; replace keeps the browser's history as it is
  function applyRoute(r, replace) {
    var o = routeFor(clampRoute(r));
    clearTimers();
    ui.thinking = false; ui.typing = false; ui.flagged = ''; ui.prefix = ''; ui.echo = ''; ui.editing = false; ui.pending = null;
    if (o.screen === 'reveal') ui.revealN = 9;
    if (o.screen === 'chat' && o.step === 3 && o.more && S.fu && !(S.fu.chips && S.fu.chips.length)) ui.typing = true;
    nav.replace = !!replace;
    Object.keys(o).forEach(function (k) { S[k] = o[k]; });
    save(); render();
  }

  function render() {
    if (!frame) return;
    var keepToneFocus = document.activeElement && document.activeElement.hasAttribute('data-hs3-tone');
    // a buyer working in the chat keeps their place: the control they pressed is about to be redrawn
    var hadFocus = !!(document.activeElement && frame.contains(document.activeElement));
    var n = names();
    writeHistory();
    // animations play when a new view arrives, never on a re-render of the same one
    var view = routeOf() + (ui.thinking ? ':t' : '') + (ui.typing ? ':y' : '') + (ui.editing ? ':e' : '');
    frame.classList.toggle('is-new', view !== ui.view);
    ui.view = view;
    frame.setAttribute('data-hs3-screen', S.screen);
    root.classList.toggle('hs3--app', S.screen !== 'hero');
    // the reminder offer: where a buyer decides (choose, the card), and whenever Shopify answered a post
    var remind = root.querySelector('[data-hs3-remind]');
    if (remind) remind.hidden = !(S.screen === 'choose' || S.screen === 'share' || remind.querySelector('[data-hs3-remind-show]'));
    document.documentElement.classList.remove('hs3-routed');
    if (S.screen === 'hero') { frame.innerHTML = heroHTML; bindHero(); return; }
    if (S.screen === 'chat') frame.innerHTML = chatView(n);
    else if (S.screen === 'reveal') frame.innerHTML = revealView(n);
    else if (S.screen === 'choose') frame.innerHTML = chooseView(n);
    else if (S.screen === 'share') frame.innerHTML = shareView(n);
    photoStorageStatus();
    bind();
    if (keepToneFocus) { var tone = frame.querySelector('[data-hs3-tone]'); if (tone) tone.focus(); }
    // a new step: focus lands on Buddy's question (read once, so its live region steps aside),
    // never on the page, so a screen reader hears the question and keyboard users carry on
    else if (hadFocus && frame.classList.contains('is-new') && !frame.contains(document.activeElement)) {
      var q = frame.querySelector('.hs3-bubble') || frame.querySelector('h1, h2');
      if (q) { q.removeAttribute('aria-live'); q.setAttribute('tabindex', '-1'); try { q.focus({ preventScroll: true }); } catch (e) { q.focus(); } }
    }
  }
  // a new step starts where its top is in view; the header stays where it is
  function toView() {
    if (!frame || !frame.getBoundingClientRect) return;
    var top = frame.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      try { frame.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { /* old browser */ }
    }
  }

  // ---- the chat
  var chatQ = null; // the current question: { prefix, question, chips, skip, next, input }
  function hasArtworkFacts() {
    return !!(window.HSArtworkProfile && window.HSArtworkProfile.fromChat(S).facts.length);
  }
  function chatModel(n) {
    var m = { prefix: ui.prefix, question: '', chips: [], skip: false, next: null, nextLabel: 'Next', input: null, other: false, on: null };
    var step = S.step;
    var answered = function (v) { if (v) { m.on = v; m.next = 'fwd'; } };
    if (step === 1) {
      m.question = "Hi, I'm Buddy. I sniff out gifts from dogs to the people they love. Who's your dog?";
      m.input = 'dog'; m.next = 'dog'; m.nextLabel = "That's my dog";
    } else if (step === 2) {
      m.prefix = m.prefix || n.dog + '. Great name. My tail is going.';
      m.question = 'So who does ' + n.dog + ' love most?';
      m.input = 'rec'; m.next = 'rec';
    } else if (step === 3) {
      if (S.more && S.fu) {
        m.question = S.fu.question;
        m.chips = (S.fu.chips || []).map(function (c, i) { return { id: 'fu' + i, label: c }; });
        m.skip = true; m.other = true;
        if (!m.chips.length) ui.typing = true;
      } else if (S.more && S.home && homeQ(n)[S.home]) {
        var fq = homeQ(n)[S.home];
        m.question = fq.q;
        m.chips = fq.chips.map(function (c) { return { id: c[0], label: c[1] }; });
        m.skip = true;
        answered(S.follow);
      } else {
        m.prefix = m.prefix || 'Lucky ' + n.them + '.';
        m.question = 'What does ' + n.dog + ' do when ' + (n.self ? 'you come' : n.rec + ' comes') + ' home?';
        m.chips = [['door', 'Waits at the door'], ['toy', 'Brings ' + n.them + ' a toy'], ['spin', 'Spins in circles'], ['cool', 'Plays it cool']].map(function (c) { return { id: c[0], label: c[1] }; });
        m.skip = true; m.other = true;
        answered(S.home);
      }
    } else if (step === 4) {
      m.question = "Where's " + possessiveName(n.dog) + ' spot when ' + (n.self ? "you're" : n.rec + ' is') + ' around?';
      m.chips = [['feet', 'On ' + n.theirs + ' feet'], ['bed', upFirst(n.theirs) + ' side of the bed'], ['couch', 'Next to ' + n.them + ' on the couch'], ['anywhere', 'Wherever ' + (n.self ? 'you are' : n.rec + ' is')]].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
      answered(S.spot);
    } else if (step === 5) {
      m.question = n.self ? 'What do you and ' + n.dog + ' do together, just the two of you?' : 'What do ' + n.dog + ' and ' + n.rec + ' do together, just the two of them?';
      m.chips = [['walk', 'The morning walk'], ['coffee', 'Coffee time'], ['movie', 'Couch and a movie'], ['naps', 'Naps'], ['car', 'Car rides']].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
      answered(S.together);
    } else if (step === 6) {
      m.question = 'Last one. What is ' + n.dog + ' to ' + n.them + '?';
      m.chips = [['shadow', upFirst(n.theirs) + ' shadow'], ['best', upFirst(n.theirs) + ' best friend'], ['hard', 'There on the hard days'], ['boss', 'The boss of the house']].map(function (c) { return { id: c[0], label: c[1] }; });
      m.skip = true; m.other = true;
      answered(S.meaning);
    } else {
      m.prefix = m.prefix || (S.meaning === 'skip' ? "That's plenty to go on." : 'Oh. That one got me right in the ears.');
      m.question = "I've sniffed it out. I know what " + n.dog + ' would get ' + n.them + '.';
      if (cfg.artworkCandidates && !hasArtworkFacts()) {
        m.prefix = 'We can keep this simple.';
        m.question = 'Without any habits to go on, the artwork will focus on ' + n.dog + '. You can go back to add a detail.';
      }
      m.next = 'show'; m.nextLabel = 'Show me';
    }
    if (ui.flagged) m.prefix = '';
    return m;
  }
  // what the painting will draw on: the buyer's own answers, never the breed; a home answer and
  // its follow-up read as one line, naming the person (28 Oct)
  function paintFacts(n) {
    if (!window.HSArtworkProfile) return [];
    try { return window.HSArtworkProfile.forBuyer(S, { rec: S.rec && n ? n.rec : '', self: !!(n && n.self) }); } catch (e) { return []; }
  }
  /* The dog's name prints in "Love, <name>", which holds 14 (NAME_MAX). From 11 letters the box
     counts down; over 14, Next waits and one tap picks a short form (Krish, 28 Oct: never cut a
     name without saying). The recipient's box holds 14 and counts the same way. */
  var TITLE = /^(sir|lady|lord|dame|mr|mrs|ms|miss|mister|dr|doctor|captain|capt|prince|princess|king|queen|duke|duchess|baron|baroness|count|countess|sergeant|sgt|major|general|professor|prof|saint|st)\.?$/i;
  function shortNames(name) {
    var words = String(name || '').split(' '), out = [], pre = '';
    for (var i = 0; i < words.length; i++) { var t = pre ? pre + ' ' + words[i] : words[i]; if (t.length > NAME_MAX) break; pre = t; }
    pre = pre.replace(/['’\-]+$/, '');
    if (pre && pre !== name && !TITLE.test(pre)) out.push(pre);
    for (var j = 0; j < words.length; j++) {
      var w = words[j].replace(/^['’\-]+|['’\-]+$/g, '');
      if (w && w.length <= NAME_MAX && !TITLE.test(w)) { if (out.indexOf(w) === -1 && w !== name) out.push(w); break; }
    }
    return out;
  }
  function nameHintHTML(k) {
    var name = nameCase(S[k], ''), len = name.length, left = NAME_MAX - len;
    if (len < 11) return '';
    var fits = k === 'dog' ? ' Up to ' + NAME_MAX + ' fit in the signature.' : '';
    if (left >= 0) return '<p class="hs3-small">' + (left === 0 ? 'No letters left.' : left + (left === 1 ? ' letter left.' : ' letters left.')) + fits + '</p>';
    return '<p class="hs3-small">"' + esc(name) + '" is ' + len + ' letters. ' + NAME_MAX + ' fit in "Love, …" on the gift.</p>' +
      '<div class="hs3-chips">' + shortNames(name).map(function (s) { return '<button type="button" class="hs3-chip" data-hs3="short" data-v="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
  }
  // the count updates as the buyer types, without redrawing the box they are typing in
  function nameHint(k) {
    if (!frame) return;
    var box = frame.querySelector('[data-hs3-name-hint="' + k + '"]');
    if (!box) return;
    var html = nameHintHTML(k);
    if (box.innerHTML === html) return;
    box.innerHTML = html;
    box.querySelectorAll('[data-hs3]').forEach(function (el) { el.addEventListener('click', function () { act(el.getAttribute('data-hs3'), el.getAttribute('data-v')); }); });
  }
  /* Breed: a list to pick from as the buyer types (Krish, 28 Oct: "I bet tonnes of people will
     spell things wrong"), at most five, "Mixed or not sure" always last, from HSBreeds.suggest.
     A picked row is S.breedId with its name in S.breed; words that match nothing are kept, and
     Buddy goes by the photo and answers. */
  var breedUI = { options: [], active: -1 };
  function breedOptions(q) {
    var B = window.HSBreeds, list = [];
    q = String(q || '').trim();
    if (!q || !B || typeof B.suggest !== 'function') return [];
    try { list = B.suggest(q, 5) || []; } catch (e) { list = []; }
    list = list.filter(function (o) { return o && o.id && o.name; });
    var mixed = list.filter(function (o) { return o.id === 'mixed-breed'; })[0] || { id: 'mixed-breed', name: 'Mixed or not sure' };
    return list.filter(function (o) { return o.id !== 'mixed-breed'; }).slice(0, 4).concat([mixed]);
  }
  function breedUnmatched() {
    return !!(String(S.breed || '').trim() && !S.breedId && !breedInfo() && window.HSBreeds);
  }
  function breedListHTML() {
    return breedUI.options.map(function (o, i) {
      return '<button type="button" class="hs3-chip' + (i === breedUI.active ? ' is-on' : '') + '" role="option" id="hs3-breed-opt-' + i + '" tabindex="-1" aria-selected="' + (i === breedUI.active) + '" data-hs3-opt="' + i + '">' + esc(o.name) + '</button>';
    }).join('');
  }
  function breedShow(inp, open) {
    if (!frame) return;
    var list = frame.querySelector('#hs3-breed-list'), note = frame.querySelector('[data-hs3-breed-note]');
    var on = !!open && breedUI.options.length > 0;
    if (list) {
      list.innerHTML = on ? breedListHTML() : '';
      list.hidden = !on;
      list.querySelectorAll('[data-hs3-opt]').forEach(function (el) {
        // the box keeps focus while a finger or mouse picks, so the list doesn't close under it
        el.addEventListener('mousedown', function (e) { e.preventDefault(); });
        el.addEventListener('click', function () { breedPick(Number(el.getAttribute('data-hs3-opt'))); });
      });
    }
    if (inp) {
      inp.setAttribute('aria-expanded', String(on));
      if (on && breedUI.active >= 0) inp.setAttribute('aria-activedescendant', 'hs3-breed-opt-' + breedUI.active); else inp.removeAttribute('aria-activedescendant');
    }
    if (note) note.hidden = on || !breedUnmatched() || (inp && document.activeElement === inp);
  }
  function breedPick(i) {
    var o = breedUI.options[i];
    if (!o) return;
    S.breedId = o.id; S.breed = o.name; save();
    var inp = frame && frame.querySelector('#hs3-breed');
    if (inp) inp.value = o.name;
    breedUI.options = []; breedUI.active = -1;
    breedShow(inp, false);
    stepEvent('breed', { pick: o.id === 'mixed-breed' ? 'mixed' : 'listed' });
  }
  function breedTyped(inp) {
    S.breed = inp.value.slice(0, 40); S.breedId = ''; save();
    breedUI.options = breedOptions(S.breed); breedUI.active = -1;
    breedShow(inp, true);
  }
  // arrows move through the list, Enter picks, Escape closes; true when the key was the list's
  function breedKey(e, inp) {
    var n = breedUI.options.length, open = inp.getAttribute('aria-expanded') === 'true';
    if (e.key === 'Escape' && open) { breedShow(inp, false); return true; }
    if (!n || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter')) return false;
    if (e.key === 'Enter') { if (!open || breedUI.active < 0) return false; e.preventDefault(); breedPick(breedUI.active); return true; }
    e.preventDefault();
    breedUI.active = (breedUI.active + (e.key === 'ArrowDown' ? 1 : n - 1) + (breedUI.active < 0 && e.key === 'ArrowUp' ? 1 : 0)) % n;
    breedShow(inp, true);
    return true;
  }
  function chatView(n) {
    var m = chatQ = chatModel(n);
    var dots = '';
    for (var i = 1; i <= 6; i++) dots += '<span class="hs3-dot' + (i <= S.step ? ' is-on' : '') + '"></span>';
    var h = '';
    h += '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="back">Back</button><span class="hs3-dots" role="img" aria-label="Question ' + Math.min(S.step, 6) + ' of 6">' + dots + '</span><span class="hs3-count">' + Math.min(S.step, 6) + ' of 6</span></div>';
    // on a phone the note waits until there is something to show (step 3), so the first questions
    // open on Buddy; a wide screen keeps its note column from the start
    if (cfg.artworkCandidates && (S.step >= 3 || window.innerWidth >= 1000)) {
      // the note shows what prints (one line and the signature); the rest of the answers feed the painting
      var meaning = ui.pending && ui.pending.key === 'meaning' && ui.pending.line ? ui.pending.line : lineFor('meaning');
      var fresh_ = meaning && ui.inked.meaning !== meaning; if (meaning) ui.inked.meaning = meaning;
      var facts = paintFacts(n);
      var open = ui.noteOpen == null ? window.innerWidth >= 1000 : ui.noteOpen;
      // a line the buyer has read; if Buddy's note later differs, the note says so
      if (open && meaning) S.noteSeen = meaning;
      h += '<details class="hs3-note-wrap"' + (open ? ' open' : '') + ' data-hs3-notebox><summary class="hs3-label">What ' + esc(n.dog) + ' is writing<span class="hs3-note-wrap__more" aria-hidden="true">' + (facts.length ? facts.length + ' to paint' : '') + '</span></summary>';
      h += '<div class="hs3-note"><div class="hs3-note__head"><div class="hs3-note__for">For ' + esc(S.step >= 3 ? (n.self ? 'you' : n.rec) : '________') + '</div>' + img('Your dog', 'hs3-photo--note') + '</div>';
      h += '<div class="hs3-note__lines">' + (meaning ? '<div class="hs3-line hs3-ink' + (fresh_ ? ' hs3-ink--new' : '') + '">' + esc(meaning) + '</div>' : '<div class="hs3-line hs3-pencil" aria-hidden="true">_______________________</div>') + '</div>' + sign(n) + '</div>';
      h += '<div class="hs3-paint"><div class="hs3-label">What I\'ll paint</div>' + (facts.length ? '<ul class="hs3-paint__list">' + facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '<p class="hs3-small">' + esc(n.dog) + ', just as ' + n.she + ' ' + n.is + '. Your answers add the details.</p>') + '</div></details>';
    } else if (!cfg.artworkCandidates) {
      var note = ['home', 'spot', 'together', 'meaning'].map(function (k) {
        var t = ui.pending && ui.pending.key === k && ui.pending.line ? ui.pending.line : lineFor(k);
        var fresh2 = t && ui.inked[k] !== t; if (t) ui.inked[k] = t;
        return t ? '<div class="hs3-line hs3-ink' + (fresh2 ? ' hs3-ink--new' : '') + '">' + esc(t) + '</div>' : '<div class="hs3-line hs3-pencil" aria-hidden="true">_______________________</div>';
      }).join('');
      h += '<div class="hs3-note-wrap"><div class="hs3-label">' + esc(S.step >= 3 ? 'What ' + n.dog + ' wants ' + n.rec + ' to know' : 'What ' + n.dog + ' wants to say') + '</div>';
      h += '<div class="hs3-note"><div class="hs3-note__head"><div class="hs3-note__for">For ' + esc(S.step >= 3 ? (n.self ? 'you' : n.rec) : '________') + '</div>' + img('Your dog', 'hs3-photo--note') + '</div>';
      h += '<div class="hs3-note__lines">' + note + '</div>' + sign(n) + '</div>';
      h += '<div class="hs3-onany"><div class="hs3-small">At the end, put these words on any gift you like:</div>' + pills() + '</div></div>';
    }
    h += '<div class="hs3-talk">';
    if (ui.echo && !ui.thinking) h += '<div class="hs3-echo">' + esc(ui.echo) + '</div>';
    h += '<div class="hs3-says"><span class="hs3-biscuit' + (ui.thinking ? ' is-tilt' : '') + '">' + BUDDY + '</span>';
    if (ui.thinking) h += '<div class="hs3-bubble" aria-label="Buddy is sniffing around"><span class="hs3-dotty"></span><span class="hs3-dotty"></span><span class="hs3-dotty"></span></div>';
    else h += '<div class="hs3-bubble hs3-pop" aria-live="polite">' + (ui.flagged ? '<span class="hs3-prefix">' + esc(ui.flagged) + ' </span>' : (m.prefix ? '<span class="hs3-prefix">' + keepNames(m.prefix) + ' </span>' : '')) + keepNames(m.question) + '</div>';
    h += '</div></div>';
    h += '<div class="hs3-dock">';
    if (!ui.thinking) {
      if (m.input === 'dog') {
        // the field names sit inside the fields, so the first question is two boxes and a button
        // the box takes a long name so nothing is cut while typing; Next asks for 14 or fewer
        h += '<input id="hs3-dog" class="hs3-field" type="text" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="next" placeholder="Your dog\'s name" aria-label="Your dog\'s name" aria-describedby="hs3-dog-hint" value="' + esc(S.dog) + '" data-hs3-in="dog">';
        h += '<div id="hs3-dog-hint" role="status" aria-live="polite" data-hs3-name-hint="dog">' + nameHintHTML('dog') + '</div>';
        // Next sits straight under the name, the one thing this step needs; the breed and photo are optional
        if (m.next) h += '<button type="button" class="hs3-btn" data-hs3="next">' + esc(m.nextLabel) + '</button>';
        h += '<input id="hs3-breed" class="hs3-field" type="text" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="next" placeholder="Breed, if you know it" aria-label="Breed, if you know it (optional)" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hs3-breed-list" value="' + esc(S.breed) + '" data-hs3-in="breed">';
        h += '<div id="hs3-breed-list" class="hs3-chips hs3-breeds" role="listbox" aria-label="Breeds" hidden></div>';
        h += '<p class="hs3-small" data-hs3-breed-note' + (breedUnmatched() ? '' : ' hidden') + '>I\'ll go by your photo and answers.</p>';
        h += '<div class="hs3-row"><button type="button" class="hs3-chip' + (S.pro === 'she' ? ' is-on' : '') + '" data-hs3="pro" data-v="she" aria-pressed="' + (S.pro === 'she') + '">She</button><button type="button" class="hs3-chip' + (S.pro === 'he' ? ' is-on' : '') + '" data-hs3="pro" data-v="he" aria-pressed="' + (S.pro === 'he') + '">He</button>';
        h += '<label class="hs3-photo-pick">' + img('', 'hs3-photo--tiny') + '<span>' + (S.hasPhoto ? 'Change photo' : 'Add a photo') + '</span><input type="file" accept="image/*" data-hs3-file></label></div>';
        if (!S.hasPhoto) h += '<div class="hs3-small hs3-later">No photo handy? Add it later, on the gift.</div>';
      } else if (m.input === 'rec') {
        h += '<div class="hs3-chips">' + [['self', 'Me'], ['partner', 'My partner'], ['mom', 'Mom'], ['dad', 'Dad'], ['kid', 'Our kid'], ['friend', 'A friend']].map(function (c) {
          return '<button type="button" class="hs3-chip' + (S.rel === c[0] ? ' is-on' : '') + '" data-hs3="rel" data-v="' + c[0] + '" aria-pressed="' + (S.rel === c[0]) + '">' + esc(c[1]) + '</button>';
        }).join('') + '</div>';
        h += '<label class="hs3-small" for="hs3-rec">' + (S.rel === 'self' ? 'Your first name' : 'Their first name') + '</label><input id="hs3-rec" class="hs3-field" type="text" maxlength="' + NAME_MAX + '" autocomplete="off" autocapitalize="words" enterkeyhint="go" aria-describedby="hs3-rec-hint" value="' + esc(S.rec) + '" data-hs3-in="rec">';
        h += '<div id="hs3-rec-hint" role="status" aria-live="polite" data-hs3-name-hint="rec">' + nameHintHTML('rec') + '</div>';
      } else if (ui.typing) {
        h += '<label class="hs3-small" for="hs3-typed">In your own words</label><div class="hs3-row hs3-row--typed"><input id="hs3-typed" class="hs3-field" type="text" maxlength="140" autocomplete="off" enterkeyhint="send" data-hs3-in="typed"><button type="button" class="hs3-btn hs3-btn--small" data-hs3="send">Done</button></div>' + privacy();
        h += '<div class="hs3-row"><button type="button" class="hs3-quiet" data-hs3="untype">Back to the choices</button></div>';
      } else if (m.chips.length || m.other) {
        // a step the buyer comes back to shows the answer they gave
        h += '<div class="hs3-chips">' + m.chips.map(function (c) { var on = m.on === c.id; return '<button type="button" class="hs3-chip' + (on ? ' is-on' : '') + '" data-hs3="chip" data-v="' + esc(c.id) + '" aria-pressed="' + on + '">' + keepNames(c.label) + '</button>'; }).join('');
        if (m.other) h += '<button type="button" class="hs3-chip hs3-chip--other' + (m.on === 'typed' ? ' is-on' : '') + '" data-hs3="other" aria-pressed="' + (m.on === 'typed') + '">Something else</button>';
        h += '</div>';
      }
      if (m.skip && (!ui.typing || S.fu)) h += '<div class="hs3-row"><button type="button" class="hs3-quiet" data-hs3="skip">Not sure</button></div>';
      if (S.step === 7 && cfg.artworkCandidates) {
        // optional, typed as plain words with no AI step: they become facts the painting may use
        var lim = (window.HSArtworkProfile && window.HSArtworkProfile.limits) || { toy: 80, accessory: 80 };
        h += '<details class="hs3-extras"' + (S.toy || S.accessory ? ' open' : '') + '><summary>Anything I should paint with ' + esc(n.dog) + '? (optional)</summary>';
        h += '<label class="hs3-small" for="hs3-toy">Favorite toy</label><input id="hs3-toy" class="hs3-field" type="text" maxlength="' + lim.toy + '" autocomplete="off" placeholder="For example, a squeaky duck" value="' + esc(S.toy) + '" data-hs3-in="toy">';
        h += '<label class="hs3-small" for="hs3-accessory">Collar or accessory</label><input id="hs3-accessory" class="hs3-field" type="text" maxlength="' + lim.accessory + '" autocomplete="off" placeholder="For example, a red bandana" value="' + esc(S.accessory) + '" data-hs3-in="accessory"></details>';
      }
      if (m.next && !ui.typing && m.input !== 'dog') h += '<button type="button" class="hs3-btn" data-hs3="next">' + esc(m.nextLabel) + '</button>';
      if (S.returnTo && cfg.gifts && cfg.gifts[S.returnTo] && cfg.gifts[S.returnTo].url && S.step > 1) h += '<button type="button" class="hs3-ghost" data-hs3="returnTo">Back to your ' + esc(SHORT[S.returnTo].toLowerCase()) + '</button>';
    }
    h += '</div>';
    return h;
  }

  // ---- the reveal
  function toneView(n, wordFree) {
    var toneIndex = { sentimental: 0, warm: 1, hilarious: 2 }[S.noteTone] || 0;
    var toneName = ['Sentimental', 'Warm with a wink', 'Hilarious'][toneIndex];
    if (wordFree) return '<div class="hs3-tone"><div class="hs3-tone__top"><span>Artwork tone</span><strong data-hs3-tone-name>' + toneName + '</strong></div><div class="hs3-tone__row"><span>Sentimental</span><input type="range" min="0" max="2" step="1" value="' + toneIndex + '" aria-label="Artwork tone" aria-valuetext="' + toneName + '" aria-describedby="hs3-tone-status" data-hs3-tone><span>Hilarious</span></div><p id="hs3-tone-status" class="hs3-tone__status" role="status">Sets the mood of the painting.</p></div>';
    var status = toneStatus(), stuck = S.composeRequest && S.composeRequest.status === 'uncertain';
    return '<div class="hs3-tone"><div class="hs3-tone__top"><span>Make it sound more like ' + esc(n.dog) + '</span><strong data-hs3-tone-name>' + toneName + '</strong></div><div class="hs3-tone__row"><span>Sentimental</span><input type="range" min="0" max="2" step="1" value="' + toneIndex + '" aria-label="Note tone" aria-valuetext="' + toneName + '" aria-describedby="hs3-tone-status" data-hs3-tone><span>Hilarious</span></div><div class="hs3-tone__update"><p id="hs3-tone-status" class="hs3-tone__status" role="status">' + esc(status) + '</p>' + (stuck ? '<button type="button" class="hs3-tone__button" data-hs3="keepWords">Keep these words</button>' : '<button type="button" class="hs3-tone__button" data-hs3="updateTone"' + (S.composeRequest || S.appliedComposeKey === composeKey(S.noteTone) ? ' disabled' : '') + '>Update note</button>') + '</div></div>';
  }
  function revealView(n) {
    syncTone();
    var g = reviewGifts().indexOf(S.gift) !== -1 ? S.gift : recGift();
    var wordFree = cfg.artworkCandidates && g === 'blanket';
    if (wordFree) ui.editing = false;
    var pick = recGift();
    var keys = giftKeys(g);
    // the tabs say which gift is on show and which is Buddy's pick, so the top bar holds only Back (28 Oct)
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="back">Back</button><span class="hs3-spacer"></span></div>';
    // a name in a heading never splits across lines, not even at its hyphen (Jo-anne); the span keeps
    // the real hyphen, since Fraunces has no non-breaking hyphen (U+2011 would draw from another font)
    h += '<h2 class="hs3-h2"><span class="hs3-nm">' + esc(possessiveName(n.dog)) + '</span> gift for <span class="hs3-nm">' + esc(n.them) + '</span></h2>';
    if (!ui.editing) {
      // every tab shows its price; Buddy's pick is a badge on its tab, not a stand-in for the price
      h += '<div class="hs3-tabs" role="group" aria-label="Gifts">' + reviewGifts().map(function (k) {
        var price = cfg.artworkCandidates ? priceLabel(k) : '';
        return '<button type="button" class="hs3-tab' + (k === g ? ' is-on' : '') + '" data-hs3="tab" data-v="' + k + '" aria-pressed="' + (k === g) + '">' + ICON[k] + '<span>' + SHORT[k] + '</span><span class="hs3-tab__tag">' + esc(price) + '</span>' + (k === pick ? '<span class="hs3-tab__pick">Buddy\'s pick</span>' : '') + '</button>';
      }).join('') + '</div>';
      if (cfg.artworkCandidates) h += '<details class="hs-art-choices"><summary>Explore artwork styles</summary><div data-hs-art-choices></div></details>';
      h += toneView(n, wordFree);
    }
    var lines = keys.map(function (k, i) { return '<span class="hs3-line ' + (i < ui.revealN ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(lineFor(k) || '') + '</span>'; }).join('');
    // the mug's color is asked on the choose screen, once the mug is chosen (F05, 28 Oct)
    h += '<div class="hs3-stage">' + mockup(g, n, lines) + '</div>';
    if (ui.editing) {
      var editIndex = keys.indexOf(ui.editKey);
      if (editIndex < 0) { editIndex = 0; ui.editKey = keys[0]; }
      var editText = lineFor(ui.editKey) || '';
      if (keys.length > 1) h += '<div class="hs3-edit"><div class="hs3-edit__nav"><button type="button" class="hs3-edit__arrow" data-hs3="editPrev" aria-label="Previous sentence"' + (editIndex === 0 ? ' disabled' : '') + '>‹</button><span>Sentence ' + (editIndex + 1) + ' of ' + keys.length + '</span><button type="button" class="hs3-edit__arrow" data-hs3="editNext" aria-label="Next sentence"' + (editIndex === keys.length - 1 ? ' disabled' : '') + '>›</button></div>';
      else h += '<div class="hs3-edit">';
      h += '<label class="hs3-edit__row" for="hs3-edit-line"><span class="hs3-sr">Change sentence ' + (editIndex + 1) + '</span><input id="hs3-edit-line" class="hs3-field hs3-field--mono" type="text" maxlength="' + maxFor(ui.editKey) + '" value="' + esc(editText) + '" data-hs3-edit="' + ui.editKey + '"><span class="hs3-small hs3-right" data-hs3-left="' + ui.editKey + '">' + (maxFor(ui.editKey) - editText.length) + ' characters left</span></label></div>';
    } else {
      h += '<div class="hs3-says hs3-says--reveal"><span class="hs3-biscuit">' + BUDDY + '</span><div class="hs3-bubble hs3-pop"><strong>' + esc(GN[g]) + '.</strong> ' + esc(wordFree ? 'A word-free design, painted from ' + possessiveName(n.dog) + ' photo and the details you share.' : reasonFor(g, n)) + '</div></div>';
    }
    var ret = S.returnTo && cfg.gifts && cfg.gifts[S.returnTo] && cfg.gifts[S.returnTo].url ? '<button type="button" class="hs3-ghost" data-hs3="returnTo">Back to your ' + esc(SHORT[S.returnTo].toLowerCase()) + '</button>' : '';
    // the blanket says it has no words once on this screen, in Buddy's bubble (28 Oct)
    h += '<div class="hs3-dock">' + (wordFree ? '' : '<p class="hs3-small hs3-center">' + (ui.editing ? 'Your changes appear on the gift as you type.' : 'Written from your answers. Change any word.') + '</p>') + (ret && !ui.editing ? ret : '<button type="button" class="hs3-btn" data-hs3="them">Choose ' + esc(possessiveName(n.dog)) + ' gifts</button>') + (wordFree ? '' : '<button type="button" class="hs3-ghost" data-hs3="edit">' + (ui.editing ? 'Done' : 'Change a word') + '</button>') + '</div>';
    return h;
  }
  /* The gift as it arrives: the real product photo (labelled Example, it is someone else's dog),
     with the buyer's own photo beside it, the words that print on a paper note, and the details
     the painting will use. The artwork itself is made on the product page, from the photo. */
  function productStage(g, n) {
    var photo = giftPhoto(g), src = photoSrc();
    var h = '<figure class="hs3-product hs3-product--' + g + '"><span class="hs3-example">EXAMPLE</span>';
    h += photo ? '<img class="hs3-product__img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" width="800" height="800" decoding="async">' : '<span class="hs3-product__img hs3-product__img--none" aria-hidden="true">' + ICON[g] + '</span>';
    h += '<span class="hs3-inset">' + (src ? '<img data-hs3-photo src="' + esc(src) + '" alt="Your photo of ' + esc(n.dog) + '" class="hs3-photo hs3-photo--inset">' : '<span class="hs3-photo hs3-photo--inset hs3-photo--empty">' + PAW + '</span>') + '<span class="hs3-inset__label">' + (src ? 'Your photo' : 'Your photo goes here') + '</span></span>';
    if (g === 'mug' && giftPhoto('mug', ui.mugSide === 'left' ? 'right' : 'left')) h += '<button type="button" class="hs3-quiet hs3-turn" data-hs3="turn">Turn the mug</button>';
    h += '</figure>';
    if (g === 'blanket') h += '<p class="hs3-small hs3-center">Example design. Photo reference only: yours is painted from your photo on the next step.</p>';
    else {
      // Buddy's first note: "writing" until it settles, never a draft that is about to change;
      // a line the buyer already read that changed says so here (28 Oct)
      var w = writing('meaning'), line = lineFor('meaning') || '';
      if (!w && line) S.noteSeen = line;
      h += '<div class="hs3-note hs3-note--print"><div class="hs3-note__for">For ' + esc(n.self ? 'you' : n.rec) + '</div><div class="hs3-note__lines">' + (w ? '<span class="hs3-line hs3-pencil" data-hs3-writing>Buddy is writing your note…</span>' : '<span class="hs3-line ' + (ui.revealN > 0 ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(line) + '</span>') + '</div>' + sign(n) + (!w && S.notePolished && !(S.edits && S.edits.meaning != null) ? '<p class="hs3-small" data-hs3-polished>Buddy polished this.</p>' : '') + '</div>';
    }
    // what gets painted: open on a wide screen, one tap away on a phone so the button stays in view
    var facts = paintFacts(n);
    h += '<details class="hs3-paint"' + (window.innerWidth >= 1000 ? ' open' : '') + '><summary class="hs3-label">What I\'ll paint' + (facts.length ? ' (' + facts.length + ')' : '') + '</summary>' + (facts.length ? '<ul class="hs3-paint__list">' + facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '<p class="hs3-small">' + esc(n.dog) + ', just as ' + n.she + ' ' + n.is + '.</p>') + '</details>';
    return h;
  }
  // a product photo for the gift from Shopify: the mug in the chosen color and side, the portrait's first example
  function giftPhoto(g, side) {
    var x = cfg.gifts && cfg.gifts[g];
    if (!x) return null;
    if (g === 'mug') {
      var c = mugColor();
      var s = side || (ui.mugSide === 'left' ? 'left' : 'right');
      if (c && c[s]) return { src: c[s], alt: 'Example mug, ' + c.name.toLowerCase() + ' inside' };
    }
    return x.images && x.images[0] ? x.images[0] : null;
  }
  function mockup(g, n, lines) {
    if (cfg.artworkCandidates) return productStage(g, n);
    // laid out like the real print files (Cowork's fit test, 14 Oct): the name in normal case, signed with a paw
    if (g === 'mug') return mugFaces(n);
    if (g === 'blanket') return '<div class="hs3-blanket"><div class="hs3-blanket__in">' + img('Your dog on the blanket', 'hs3-photo--blanket') + '<div class="hs3-blanket__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
    if (g === 'print') return '<div class="hs3-print"><div class="hs3-print__in">' + img('Your dog on the print', 'hs3-photo--print') + '<div class="hs3-print__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
    return '<div class="hs3-orn"><span class="hs3-orn__string"></span><span class="hs3-orn__cap"></span><div class="hs3-orn__ball">' + img('Your dog on the ornament', 'hs3-photo--orn') + '<div class="hs3-orn__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
  }
  /* The mug's colors (inside and handle), one Shopify variant each, Black first (Krish, 19 Oct),
     each with its handle-left and handle-right product photos (matched by alt text in the section). */
  function mugColors() { return (cfg.mug && cfg.mug.colors) || []; }
  function mugColor() {
    var cs = mugColors();
    for (var i = 0; i < cs.length; i++) if (cs[i].name === S.mugColor) return cs[i];
    return cs[0] || null;
  }
  function mugSwatches() {
    var cs = mugColors(), cur = mugColor();
    if (cs.length < 2) return '';
    return '<div class="hs3-swatches"><span class="hs3-small" id="hs3-mugcolor">Mug color: <strong>' + esc(cur.name) + '</strong></span><span class="hs3-swatches__row" role="radiogroup" aria-labelledby="hs3-mugcolor">' + cs.map(function (c) {
      var on = c === cur;
      return '<button type="button" class="hs3-swatch' + (on ? ' is-on' : '') + '" role="radio" aria-checked="' + on + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '" data-hs3="mugColor" data-v="' + esc(c.name) + '" style="--sw:' + esc(c.hex) + '"></button>';
    }).join('') + '</span></div>';
  }
  function setMugColor(v) {
    if (!mugColors().some(function (c) { return c.name === v; })) return;
    S.mugColor = v; save(); render();
    var b = frame.querySelector('[data-hs3="mugColor"][data-v="' + v + '"]');
    if (b) b.focus();
    track('mug_color', { color: v });
  }
  function mugLineTexts() { return giftKeys('mug').map(function (k) { return evenBreak(lineFor(k) || ''); }); }
  // the earlier word-mug layout, for the legacy (non-candidate) reveal: the product photo with the words beside it
  function mugFaces(n) {
    var photo = giftPhoto('mug');
    var lines = mugLineTexts().map(function (t, i) { return '<span class="hs3-line ' + (i < ui.revealN ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(t.replace(/\n/g, ' ')) + '</span>'; }).join('');
    return '<div class="hs3-mugwrap">' + (photo ? '<img class="hs3-product__img" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '">' : '') + '<div class="hs3-note">' + lines + sign(n) + '</div></div>';
  }
  function turnMug(side) {
    ui.mugSide = side === 'left' ? 'left' : 'right';
    var im = frame && frame.querySelector('.hs3-product--mug .hs3-product__img'), photo = giftPhoto('mug');
    if (im && photo) { im.src = photo.src; im.alt = photo.alt; }
  }
  function startReveal(g) {
    clearTimers();
    ui.editing = false; ui.revealN = reduced ? 9 : 0; ui.mugSide = 'left'; ui.mugTurned = false; // the side the dog is painted on
    S.screen = 'reveal'; S.gift = g; save(); render(); toView();
    if (reduced) return;
    var k = Math.max(1, giftKeys(g).length);
    for (var i = 1; i <= k; i++) (function (x) { later(function () { ui.revealN = x; inkLines(); }, 450 + x * 650); })(i);
  }
  function inkLines() {
    frame.querySelectorAll('.hs3-stage .hs3-line').forEach(function (el, i) { if (i < ui.revealN && !el.classList.contains('hs3-ink') && !el.hasAttribute('data-hs3-writing')) { el.classList.remove('hs3-pencil'); el.classList.add('hs3-ink', 'hs3-ink--new'); } });
  }

  // ---- choose gifts
  // prices come from the Shopify products the section picks; a gift without one shows no price
  function priceOf(k, others) {
    var p = Number(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].price) || 0;
    if (k === 'ornament' && cfg.ornamentBundle && others > 0) p = Math.max(0, p - 5);
    return p;
  }
  function priceLabel(k) {
    var x = cfg.gifts && cfg.gifts[k], p = priceOf(k, 0);
    if (!p) return '';
    return x && Number(x.priceMax) > p ? 'From ' + fmt(p) : fmt(p);
  }
  function fmt(p) { return '$' + (Math.round(p * 100) % 100 ? p.toFixed(2) : String(Math.round(p))); }
  function reviewGifts() { return cfg.artworkCandidates ? GIFTS.filter(function (k) { return k !== 'ornament'; }) : GIFTS; }
  function blanketPurchaseEnabled() { return !!(cfg.artworkCandidates && (cfg.blanketPurchase || cfg.corePurchase) && cfg.gifts && cfg.gifts.blanket && cfg.gifts.blanket.url); }
  function giftPurchasable(k) { return !!(cfg.artworkCandidates && cfg.gifts && cfg.gifts[k] && cfg.gifts[k].url && (cfg.corePurchase && ['mug', 'blanket', 'print'].indexOf(k) !== -1 || k === 'blanket' && blanketPurchaseEnabled())); }
  // several gifts go through together once each has its own native page (27 Oct); the paused
  // blanket-only route still takes one at a time, so a draft never sits in the cart queue
  function multiOK() { return !cfg.artworkCandidates || !!cfg.corePurchase || !blanketPurchaseEnabled(); }
  function selectedGifts() {
    var selected = reviewGifts().filter(function (k) { return S.sel[k]; });
    if (multiOK()) return selected;
    // Restored mixed selections display the purchasable blanket as the one choice.
    return selected.indexOf('blanket') !== -1 ? ['blanket'] : selected.slice(0, 1);
  }
  function selectGift(k, forceOn) {
    var on = !!forceOn || selectedGifts().indexOf(k) === -1;
    if (!multiOK()) S.sel = {};
    S.sel[k] = on;
  }
  // the bundle (Krish, 27 Oct): 15% off two gifts, 20% off three, shown only once the real
  // automatic discount exists (bundle_offer_live); the cart shows the saving Shopify applies
  function bundleTier(count) { return !cfg.bundleOffer ? 0 : count >= 3 ? 20 : count === 2 ? 15 : 0; }
  function daysToChristmas() {
    var now = new Date(), day = 864e5, xmas = new Date(now.getFullYear(), 11, 25);
    var d = Math.floor((xmas - now) / day); // whole days, as the product pages count them
    return d > 0 && d <= 75 ? d : 0;
  }
  function chooseModel() {
    var others = ['mug', 'blanket', 'print'].filter(function (k) { return S.sel[k]; }).length;
    var selected = selectedGifts(), count = selected.length;
    var total = selected.reduce(function (a, k) { return a + priceOf(k, others); }, 0);
    var missing = selected.filter(function (k) { return !(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].url); });
    var range = selected.some(function (k) { return Number(cfg.gifts[k] && cfg.gifts[k].priceMax) > priceOf(k, 0); });
    // the total after the bundle saving, to the cent (28 Oct: three gifts read $186.40 after 20% off)
    var tier = bundleTier(count), after = Math.round(total * (100 - tier)) / 100;
    return { others: others, count: count, total: total, missing: missing, tier: tier, range: range, after: after };
  }
  function giftDesc(k) {
    if (k === 'mug' && mugColor()) return '11 oz, illustrated, ' + mugColor().name.toLowerCase() + ' inside';
    if (k === 'print' && cfg.gifts && cfg.gifts.print && Number(cfg.gifts.print.priceMax) > priceOf('print', 0)) return '12 × 18 in. Unframed ' + fmt(priceOf('print', 0)) + ', framed ' + fmt(Number(cfg.gifts.print.priceMax));
    if (k === 'ornament') return cfg.ornamentBundle ? 'For the tree. ' + fmt(priceOf('ornament', 1)) + ' with another gift' : DS.ornament;
    return DS[k];
  }
  function chooseView(n) {
    var pick = recGift(), c = chooseModel(), core = cfg.artworkCandidates && cfg.corePurchase;
    var gifts = c.count === 1 ? 'gift' : 'gifts'; // one gift chosen reads "gift" (28 Oct)
    ui.opening = false; // a fresh button, after a return through the browser's cache
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="back">Back</button><span class="hs3-spacer"></span></div>';
    h += '<h2 class="hs3-h2"><span class="hs3-nm">' + esc(possessiveName(n.dog)) + '</span> ' + gifts + ' for <span class="hs3-nm">' + esc(n.them) + '</span></h2><p class="hs3-sub">' + (core ? 'Pick one, or a few. Your photo and answers carry over to each one.' : blanketPurchaseEnabled() ? 'Choose one at a time: personalize your word-free blanket, or review a draft. Drafts cannot be ordered. Use Back to return after reviewing one.' : cfg.artworkCandidates ? 'Review the artwork drafts. The blanket stays word-free.' : 'Pick one or more. Your words go on each one.') + '</p>';
    if (core && cfg.bundleOffer) h += '<p class="hs3-bundle' + (c.tier ? ' is-on' : '') + '" role="status">' + (c.tier ? c.count + ' gifts: ' + c.tier + '% off, taken at checkout.' : c.count === 1 ? 'Add a second gift and save 15%. Three saves 20%.' : 'Give two, save 15%. Give three, save 20%.') + '</p>';
    h += '<div class="hs3-strip">' + img('Your dog', 'hs3-photo--strip') + '<div><div class="hs3-line hs3-ink">' + esc(writing('meaning') ? 'Buddy is writing your note…' : lineFor('meaning') || lineFor('home') || '') + '</div><span class="hs3-sign">Love, ' + esc(n.dog) + '</span></div></div>';
    h += '<div class="hs3-opts">' + reviewGifts().map(function (k) {
      var on = selectedGifts().indexOf(k) !== -1, photo = cfg.artworkCandidates ? giftPhoto(k) : null;
      return '<button type="button" class="hs3-opt' + (on ? ' is-on' : '') + '" data-hs3="sel" data-v="' + k + '" aria-pressed="' + on + '"><span class="hs3-tick" aria-hidden="true">' + (on ? '✓' : '') + '</span>' + (photo ? '<img class="hs3-opt__img" src="' + esc(photo.src) + '" alt="" width="64" height="64" loading="lazy">' : '') + '<span class="hs3-opt__body">' + (k === pick ? '<span class="hs3-opt__pick">BUDDY\'S PICK</span>' : '') + '<span class="hs3-opt__name">' + esc(GN[k]) + '</span><span class="hs3-small">' + esc(giftDesc(k)) + '</span></span><span class="hs3-opt__price">' + (cfg.artworkCandidates && !giftPurchasable(k) ? 'Draft' : esc(priceLabel(k))) + '</span></button>';
    }).join('') + '</div>';
    if (selectedGifts().indexOf('mug') !== -1) h += mugSwatches();
    // a gift for the buyer ("Me") ships to them; the choice would ask twice (28 Oct)
    if (!n.self) h += '<div class="hs3-row hs3-ship"><span class="hs3-small">Ship to</span><button type="button" class="hs3-chip' + (S.shipTo === 'rec' ? ' is-on' : '') + '" data-hs3="ship" data-v="rec" aria-pressed="' + (S.shipTo === 'rec') + '">' + esc(n.rec) + '</button><button type="button" class="hs3-chip' + (S.shipTo === 'me' ? ' is-on' : '') + '" data-hs3="ship" data-v="me" aria-pressed="' + (S.shipTo === 'me') + '">Me</button></div>';
    // Publish an order-by date only after Printful confirms the current year's cutoff for
    // every selected variant and fulfillment route, including any gift bundle.
    h += '<div class="hs3-dock"><p class="hs3-small hs3-center hs3-promise">Free US shipping on every order. A person checks every design before it prints.</p>';
    var label = c.count === 0 ? 'Pick a gift' : (c.count === 1 ? 'Personalize gift · ' + fmt(c.total) : 'Personalize ' + c.count + ' gifts · ' + fmt(c.total));
    if (core && c.count) label = c.count === 1 ? 'Personalize the ' + SHORT[selectedGifts()[0]].toLowerCase() + ' · ' + priceLabel(selectedGifts()[0]) : 'Personalize ' + c.count + ' gifts · ' + (c.range ? 'from ' : '') + (c.tier ? fmt(c.after) + ' after ' + c.tier + '% off' : fmt(c.total));
    else if (cfg.artworkCandidates && !blanketPurchaseEnabled()) label = c.count ? 'Review selected drafts' : 'Pick a draft';
    else if (cfg.artworkCandidates) label = !c.count ? 'Pick a gift or draft' : giftPurchasable(selectedGifts()[0]) ? 'Personalize ' + {mug:'mug',blanket:'blanket',print:'portrait'}[selectedGifts()[0]] + ' · ' + fmt(priceOf(selectedGifts()[0], c.others)) : 'Review draft';
    h += '<button type="button" class="hs3-btn" data-hs3="add"' + (c.count === 0 || c.missing.length ? ' disabled' : '') + '>' + esc(label) + '</button>';
    var days = daysToChristmas();
    if (days && core) h += '<p class="hs3-small hs3-center hs3-countdown">' + days + (days === 1 ? ' day' : ' days') + ' to Christmas morning. Made to order, checked by a person, then shipped.</p>';
    if (c.missing.length) h += '<p class="hs3-small hs3-center" role="status">' + esc(c.missing.map(function (k) { return GN[k]; }).join(' and ')) + (c.missing.length > 1 ? ' are' : ' is') + ' not in the shop yet.</p>';
    h += '<button type="button" class="hs3-ghost" data-hs3="toShare">Save ' + esc(possessiveName(n.dog)) + ' ' + gifts + ' to your story</button></div>';
    return h;
  }
  function addToCart() {
    var c = chooseModel();
    if (!c.count || c.missing.length) return;
    shareWithBridge();
    // the mug opens on the color picked here; Teeinblue follows the variant in the link
    var mc = mugColor();
    var q = selectedGifts().map(function (k) {
      var u = new URL(cfg.gifts[k].url, window.location.href);
      if (cfg.artworkCandidates) {
        // each gift's own address: the native template is its default, so no ?view= unless
        // the gift is a draft (or the paused blanket-only route), and never two view values
        u.searchParams.delete('view');
        if (!giftPurchasable(k)) u.searchParams.set('view', {mug:'mug-art-preview',blanket:'blanket-art-preview',print:'city-art-preview'}[k]);
        else if (!cfg.corePurchase) u.searchParams.set('view', {mug:'mug-native',blanket:'blanket-native',print:'portrait-native'}[k]);
      }
      if (k === 'mug' && mc && mc.id) u.searchParams.set('variant', mc.id);
      // a gift with more than one price opens on the price the choose screen showed (28 Oct: the
      // portrait said from $59 and opened Framed at $119); a variant already in the link stays
      var x = cfg.gifts[k];
      if (x.minVariant && Number(x.priceMax) > Number(x.price) && !u.searchParams.get('variant')) u.searchParams.set('variant', String(x.minVariant));
      return { url: u.pathname + u.search + u.hash, title: GN[k] };
    });
    try { if (q.length > 1) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); else window.sessionStorage.removeItem(QKEY); } catch (e) { /* private mode */ }
    track('personalize_gifts', { gifts: q.length, picks: selectedGifts().join(',') });
    S.returnTo = ''; save();
    window.location.href = q[0].url;
    return selectedGifts()[0];
  }
  // the button answers the tap at once, pressed and busy, while the gift's page opens (28 Oct:
  // the product page took about 8 seconds behind an unchanged button); a second tap does nothing
  function opening(k) {
    if (!k || !frame) return;
    var b = frame.querySelector('[data-hs3="add"]');
    if (!b) return;
    ui.opening = true;
    b.classList.add('is-on', 'is-busy');
    b.setAttribute('aria-busy', 'true'); b.setAttribute('aria-disabled', 'true');
    b.textContent = 'Opening ' + possessiveName(names().dog) + ' ' + (SHORT[k] || '').toLowerCase() + '…';
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
  /* A step the buyer comes back to and answers differently: that answer's line, and any word
     edit or AI version of it, no longer fits, so only that one goes. Nothing is sent: the note
     offers Update note on the reveal, and the product page sees new facts (new artwork). */
  function answerChanged(key) {
    if (S.composed && S.composed.lines) { delete S.composed.lines[key]; if (key === 'home') delete S.composed.lines.home_follow; }
    if (S.edits) delete S.edits[key];
    S.baseLines = null;
    if (S.composeStarted) S.answersChanged = true;
  }
  // move on from an answered step without changing its answer
  function forward() {
    if (S.step === 3 && !S.more && S.home && S.home !== 'skip' && (S.fu || S.home !== 'typed')) { S.more = true; }
    else if (S.step >= 3 && S.step < 7) { S.more = false; S.step++; }
    ui.prefix = ''; ui.echo = '';
    save(); render(); toView(); stepEvent('shown');
  }
  function chip(id) {
    var n = names(), m = chatQ, label = '';
    (m.chips || []).forEach(function (c) { if (c.id === id) label = c.label; });
    ui.echo = label; ui.flagged = '';
    stepEvent('answered', { kind: 'chip', value: id });
    if (S.step === 3 && S.more && S.fu) {
      var i = Number(String(id).slice(2)), ready = S.fu.lines && S.fu.lines[i];
      if (!ready) { followAnswer(label, true); return; }
      stepEvent('answered', { kind: 'chip', sub: 'follow', value: 'prepared' });
      S.typed.home_follow = label; S.follow = 'typed';
      S.ai.home_follow = { line: ready, reaction: (S.fu.replies && S.fu.replies[i]) || '' };
      ui.prefix = (S.fu.replies && S.fu.replies[i]) || '';
      S.fu = null; S.more = false; S.step = 4; save(); render(); stepEvent('shown');
      return;
    }
    if (S.step === 3 && !S.more) {
      if (S.home !== id) { answerChanged('home'); S.home = id; S.follow = null; S.fu = null; delete S.typed.home_follow; }
      S.more = true; save();
      ui.prefix = '';
      // a follow-up the buyer already answered comes straight back; a new one gets Buddy's pause
      if (S.follow) { render(); stepEvent('shown', { sub: 'follow' }); return; }
      think(1300, function () { render(); stepEvent('shown', { sub: 'follow' }); });
      return;
    }
    if (S.step === 3) { if (S.follow !== id) answerChanged('home'); S.follow = id; ui.prefix = react(REACT4, id, n); S.more = false; S.step = 4; save(); render(); stepEvent('shown'); return; }
    if (S.step === 4) { if (S.spot !== id) answerChanged('spot'); S.spot = id; ui.prefix = react(REACT5, id, n); S.step = 5; save(); render(); stepEvent('shown'); return; }
    if (S.step === 5) { if (S.together !== id) answerChanged('together'); S.together = id; ui.prefix = react(REACT6, id, n); S.step = 6; save(); render(); stepEvent('shown'); return; }
    if (S.step === 6) { if (S.meaning !== id) answerChanged('meaning'); S.meaning = id; ui.prefix = ''; S.step = 7; save(); render(); warm(cfg.composeUrl); return; }
    void n;
  }
  function skip() {
    // no "Not sure" bubble under the list: Buddy's own words acknowledge it (28 Oct)
    ui.echo = ''; ui.flagged = ''; ui.typing = false;
    stepEvent('skipped');
    if (S.step === 3 && S.more && S.fu) { S.fu = null; ui.prefix = ''; S.more = false; S.step = 4; save(); render(); stepEvent('shown'); return; }
    // a chip follow-up the buyer isn't sure about: the home answer stays, only the detail is skipped
    if (S.step === 3 && S.more && S.home && S.home !== 'typed') { if (S.follow !== 'skip') answerChanged('home'); S.follow = 'skip'; S.more = false; ui.prefix = "That's okay, on we go."; S.step = 4; save(); render(); stepEvent('shown'); return; }
    if (S.step === 3) { if (S.home !== 'skip') answerChanged('home'); S.home = 'skip'; S.follow = null; S.fu = null; delete S.typed.home_follow; S.more = false; ui.prefix = "No problem. Let's sniff around somewhere else."; S.step = 4; }
    else if (S.step === 4) { if (S.spot !== 'skip') answerChanged('spot'); S.spot = 'skip'; ui.prefix = REACT5.skip; S.step = 5; }
    else if (S.step === 5) { if (S.together !== 'skip') answerChanged('together'); S.together = 'skip'; ui.prefix = REACT6.skip; S.step = 6; }
    else if (S.step === 6) { if (S.meaning !== 'skip') answerChanged('meaning'); S.meaning = 'skip'; ui.prefix = ''; S.step = 7; }
    save(); render();
    if (S.step <= 6) stepEvent('shown');
  }
  // a typed answer: Buddy reacts, a line inks, and on the home question one follow-up
  function sendTyped(text) {
    text = String(text || '').trim();
    if (!text) return;
    ui.typing = false; ui.echo = window.HSArtworkProfile ? window.HSArtworkProfile.tidy(text) : text.replace(/!+/g, '.'); ui.flagged = '';
    var key = ({ 3: 'home', 4: 'spot', 5: 'together', 6: 'meaning' })[S.step];
    if (S.step === 3 && S.more && S.fu) { followAnswer(text, false); return; }
    stepEvent('answered', { kind: 'typed' });
    // the buyer's own words ink at once; Buddy's version replaces them when it lands
    ui.pending = GRIEF.test(text) || PROFANE.test(text) ? null : { key: key, line: ownWords(chipStyle(text, key), key) };
    ui.thinking = true; render();
    var q = chatQ ? chatQ.question : '';
    answerFor(key, q, text, '').then(function (r) {
      ui.thinking = false; ui.pending = null;
      if (r.flags.some(function (f) { return f === 'grief' || f === 'profanity' || f === 'unclear'; })) {
        ui.flagged = CATCH; ui.echo = ''; render(); stepEvent('flagged'); return;
      }
      answerChanged(key);
      S.typed[key] = text;
      S.ai[key] = { line: r.line, reaction: r.reaction };
      S[key] = 'typed';
      if (key === 'home') {
        // a new home answer: its old follow-up no longer fits (28 Oct: a stale "Not sure" survived)
        S.follow = null; S.ai.home_follow = null; delete S.typed.home_follow;
        S.fu = r.follow_up && (r.follow_up.chips.length || !r.ai) ? r.follow_up : null;
        ui.prefix = r.reaction && r.reaction !== 'Tell me more?' ? r.reaction : '';
        if (S.fu) S.more = true; else { S.more = false; S.step = 4; }
        save(); render(); stepEvent('shown', S.fu ? { sub: 'follow' } : null);
        return;
      }
      ui.prefix = r.reaction && r.reaction !== 'Tell me more?' ? r.reaction : '';
      if (key === 'spot') S.step = 5; else if (key === 'together') S.step = 6; else if (key === 'meaning') S.step = 7;
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
    S.fu = null; S.more = false; save();
    if (!aiFollow) { ui.prefix = ''; S.step = 4; save(); render(); stepEvent('shown'); return; }
    ui.thinking = true; render();
    answerFor('home_follow', chatQ ? chatQ.question : '', text, prev).then(function (r) {
      ui.thinking = false;
      if (r.ai && r.line && !r.flags.length) S.ai.home_follow = { line: r.line, reaction: r.reaction };
      ui.prefix = r.ai && r.reaction ? r.reaction : '';
      S.step = 4; save(); render(); stepEvent('shown');
    });
  }
  function next() {
    if (ui.photoSaving) { photoStorageStatus(); return; }
    var n = names();
    if (S.step === 1) {
      var dog = nameCase(S.dog, '');
      if (!dog) { focusField('hs3-dog'); return; }
      // longer than the signature holds: Next waits, and the hint offers short forms (28 Oct)
      if (dog.length > NAME_MAX) { focusField('hs3-dog'); nameHint('dog'); stepEvent('name_long', { letters: dog.length }); return; }
      // the name as it will print, so Back shows it the same way
      S.dog = dog; n = names();
      stepEvent('answered'); ui.echo = n.dog; ui.prefix = ''; S.step = 2; save(); render(); stepEvent('shown'); return;
    }
    if (S.step === 2) {
      var rec = nameCase(S.rec, '');
      if (!rec) { focusField('hs3-rec'); return; }
      S.rec = rec.slice(0, NAME_MAX); n = names();
      stepEvent('answered'); ui.echo = n.rec; ui.prefix = ''; S.step = 3; S.more = false; save(); render(); stepEvent('shown'); return;
    }
    if (S.step < 7) { forward(); return; }
    // the end of the chat: the reveal. The first time, the button asks for the note; after
    // that, coming back here never sends anything (Update note on the reveal does, on request)
    if (!S.composeStarted) {
      // the first note is written in the tone the slider and the product pages show (28 Oct)
      S.composed = null; S.baseLines = allLines(); S.composeBaseGift = null; S.appliedComposeKey = ''; syncTone(); S.appliedTone = S.noteTone; S.notePolished = false; S.tabbed = false; S.composeStarted = true; save();
      track('reveal', { typed: anyTyped() ? 'yes' : 'no' });
      compose(S.noteTone, false, true);
    }
    startReveal(reviewGifts().indexOf(S.gift) !== -1 && S.tabbed ? S.gift : recGift());
  }
  // Back goes to the previous step with its answer still there, through the browser's own history
  function back() {
    ui.flagged = ''; ui.typing = false; ui.prefix = ''; ui.echo = '';
    if (historyOK() && nav.depth > 0) { window.history.back(); return; }
    applyRoute(prevRoute(routeOf()), true);
  }
  function focusField(id) { var f = document.getElementById(id); if (f) { f.focus(); f.classList.add('is-need'); } }

  /* ------------------------------------------------------------------ binding */
  var heroHTML = '';
  function bindHero() {
    var start = frame.querySelector('[data-hs3-start]'), resume = frame.querySelector('[data-hs3-resume]');
    var going = !!String(S.dog || '').trim() && !!S.lastRoute;
    if (resume) {
      // a returning buyer: their answers are still here, so the one button picks up where they left off
      frame.querySelectorAll('[data-hs3-resume]').forEach(function (r) { r.hidden = !going; });
      var who = frame.querySelector('[data-hs3-resume-dog]');
      if (who) who.textContent = names().dog;
      if (going && start) start.textContent = 'Pick up where you left off';
    }
    if (start) start.addEventListener('click', function () {
      if (going) { track('resume', { step: S.lastRoute }); applyRoute(S.lastRoute); toView(); return; }
      track('start', {});
      applyRoute('dog'); stepEvent('shown');
      warm(cfg.typedUrl);
      toView();
    });
    var over = frame.querySelector('[data-hs3-restart]');
    if (over) over.addEventListener('click', function () { track('start_over', {}); restart(); });
    // the signature feature on the first screen: slide the example note from sentimental to hilarious
    var demo = frame.querySelector('[data-hs3-demo]');
    if (demo) {
      var lines = frame.querySelectorAll('[data-hs3-demo-line]'), names_ = ['Sentimental', 'Warm with a wink', 'Hilarious'];
      var show = function () {
        var i = Number(demo.value) || 0, label = frame.querySelector('[data-hs3-demo-name]');
        lines.forEach(function (l) { l.hidden = Number(l.getAttribute('data-hs3-demo-line')) !== i; });
        // the example painting moves with the words (examples_on): the matching tone fades in
        frame.querySelectorAll('[data-hs3-demo-img]').forEach(function (img) {
          var on = Number(img.getAttribute('data-hs3-demo-img')) === i;
          img.classList.toggle('is-on', on);
          if (on) img.removeAttribute('aria-hidden'); else img.setAttribute('aria-hidden', 'true');
        });
        demo.setAttribute('aria-valuetext', names_[i]);
        if (label) label.textContent = names_[i];
      };
      demo.addEventListener('input', show);
      demo.addEventListener('change', function () { track('demo_tone', { tone: names_[Number(demo.value) || 0] }); });
      show();
    }
  }
  // Start over: a fresh chat, nothing kept from the last one (the photo is deleted from this device)
  function restart() {
    S = fresh();
    try { window.sessionStorage.removeItem(HS2); window.sessionStorage.removeItem(QKEY); window.sessionStorage.removeItem('hs-artwork-choices-v1'); } catch (e) { /* private mode */ }
    idb('readwrite', function (st) { return st.delete(PHOTO); }).catch(function () {});
    if (photoURL) { URL.revokeObjectURL(photoURL); photoURL = null; }
    applyRoute('dog'); stepEvent('shown');
  }
  function bind() {
    frame.querySelectorAll('[data-hs3]').forEach(function (el) {
      el.addEventListener('click', function () { act(el.getAttribute('data-hs3'), el.getAttribute('data-v')); });
    });
    var box = frame.querySelector('[data-hs3-notebox]');
    if (box) box.addEventListener('toggle', function () { ui.noteOpen = box.open; if (box.open && lineFor('meaning')) S.noteSeen = lineFor('meaning'); });
    frame.querySelectorAll('[data-hs3-in]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-in');
      inp.addEventListener('input', function () {
        inp.classList.remove('is-need');
        if (k === 'typed') { clearTimeout(specTimer); specTimer = setTimeout(function () { speculate(inp.value); }, 600); }
        if (k === 'dog' || k === 'rec') { S[k] = inp.value.slice(0, k === 'dog' ? 40 : NAME_MAX); save(); nameHint(k); }
        if (k === 'breed') breedTyped(inp);
        if (k === 'toy' || k === 'accessory') { S[k] = inp.value.slice(0, 80); save(); }
      });
      inp.addEventListener('keydown', function (e) {
        if (k === 'breed' && breedKey(e, inp)) return;
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (k === 'typed') sendTyped(inp.value); else if (k === 'toy' || k === 'accessory') inp.blur(); else next();
      });
      if (k === 'breed') inp.addEventListener('blur', function () { breedUI.options = []; breedUI.active = -1; breedShow(inp, false); });
    });
    var file = frame.querySelector('[data-hs3-file]');
    // the dog detector starts loading as the buyer reaches for a photo, so the no-dog check is
    // ready by the time they have picked one
    var pick = file && file.closest ? file.closest('label') : null;
    if (pick) pick.addEventListener('pointerdown', function () { try { if (window.HSPhotoQuality) window.HSPhotoQuality.loadDetector(); } catch (e) { /* the check fails open */ } }, { once: true });
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f || !/^image\//.test(f.type || 'image/')) return;
      file.value = ''; // Permit an explicit retry with the same file after storage failure.
      checkPhoto(f, function () {
        attachPhoto(f);
        track('photo_attached', {});
        var lab = frame.querySelector('.hs3-photo-pick span'); if (lab) lab.textContent = 'Change photo';
        var later_ = frame.querySelector('.hs3-later'); if (later_) later_.remove();
      });
    });
    frame.querySelectorAll('[data-hs3-edit]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-edit');
      inp.addEventListener('input', function () {
        S.edits[k] = inp.value.slice(0, maxFor(k)); save();
        var left = frame.querySelector('[data-hs3-left="' + k + '"]'); if (left) left.textContent = (maxFor(k) - inp.value.length) + ' characters left';
        var g = S.gift || recGift(), i = giftKeys(g).indexOf(k), l = frame.querySelectorAll('.hs3-stage .hs3-line')[i];
        if (l) l.textContent = inp.value;
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (giftKeys(S.gift || recGift()).indexOf(k) < giftKeys(S.gift || recGift()).length - 1) moveEdit(1);
        else { ui.editing = false; render(); }
      });
    });
    var tone = frame.querySelector('[data-hs3-tone]');
    if (cfg.artworkCandidates && window.HSArtworkChoices) window.HSArtworkChoices.mount(frame.querySelector('[data-hs-art-choices]'), {toneElsewhere: true});
    if (tone) {
      tone.addEventListener('input', function () {
        var name = ['Sentimental', 'Warm with a wink', 'Hilarious'][Number(tone.value)] || 'Warm with a wink';
        tone.setAttribute('aria-valuetext', name);
        var label = frame.querySelector('[data-hs3-tone-name]'); if (label) label.textContent = name;
      });
      tone.addEventListener('change', function () {
        var name = ['sentimental', 'warm', 'hilarious'][Number(tone.value)] || 'warm';
        selectTone(name);
      });
    }
    var typed = frame.querySelector('#hs3-typed');
    if (typed) typed.focus();
    if (S.screen === 'share') drawCard();
  }
  function focusEdit() {
    var inp = frame.querySelector('[data-hs3-edit]');
    if (inp) { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* input may not support selection */ } }
  }
  function moveEdit(delta) {
    var keys = giftKeys(S.gift || recGift());
    var nextIndex = Math.max(0, Math.min(keys.length - 1, keys.indexOf(ui.editKey) + delta));
    ui.editKey = keys[nextIndex];
    render(); focusEdit();
  }
  function act(a, v) {
    var n = names();
    switch (a) {
      case 'back': case 'toChat': case 'toReveal': case 'toChoose': back(); break;
      case 'pro': S.pro = v === 'he' ? 'he' : 'she'; save(); render(); break;
      case 'rel': S.rel = v; save(); render(); break;
      case 'next': next(); break;
      case 'chip': chip(v); break;
      case 'skip': skip(); break;
      case 'other': warm(cfg.typedUrl); ui.typing = true; ui.flagged = ''; render(); stepEvent('something_else'); break;
      case 'untype': ui.typing = false; if (S.more && S.fu && !S.fu.chips.length) { skip(); return; } render(); break;
      case 'send': var t = frame.querySelector('#hs3-typed'); sendTyped(t ? t.value : ''); break;
      // tabs show the same step, so they replace the address rather than add to Back
      case 'tab': S.tabbed = true; track('gift_tab', { gift: v }); nav.replace = true; startReveal(v); break;
      case 'edit': ui.editing = !ui.editing; ui.editKey = giftKeys(S.gift || recGift())[0]; ui.revealN = 9; ui.mugTurned = true; render(); if (ui.editing) { track('edit', {}); focusEdit(); } break;
      case 'editPrev': moveEdit(-1); break;
      case 'editNext': moveEdit(1); break;
      case 'updateTone': compose(S.noteTone, true); break;
      case 'keepWords': keepWords(); break;
      case 'turn': ui.mugTurned = true; turnMug(ui.mugSide === 'left' ? 'right' : 'left'); track('mug_turn', { side: ui.mugSide }); break;
      case 'them': var g = S.gift || recGift(); S.sel = S.sel || {}; selectGift(g, true); ui.editing = false; S.screen = 'choose'; save(); render(); toView(); track('choose', { gift: g }); break;
      case 'sel': selectGift(v); save(); render(); track('gift_pick', { gift: v, on: S.sel[v] ? 'yes' : 'no' }); break;
      case 'mugColor': setMugColor(v); break;
      case 'ship': S.shipTo = v === 'me' ? 'me' : 'rec'; save(); render(); break;
      case 'add': if (!ui.opening) opening(addToCart()); break;
      case 'short': if (v) { S.dog = v; save(); render(); var dogBox = frame && frame.querySelector('#hs3-dog'); if (dogBox) dogBox.focus(); } break;
      case 'toShare': S.screen = 'share'; save(); render(); toView(); break;
      case 'returnTo': var u = cfg.gifts && cfg.gifts[S.returnTo] && cfg.gifts[S.returnTo].url; if (u) { shareWithBridge(); track('return_to_gift', { gift: S.returnTo }); window.location.href = u; } break;
    }
    void n;
  }

  /* The keyboard never covers Next (Krish's phone, 28 Oct). Chromium on Android resizes the page for
     the keyboard once the viewport asks it to: this page only, so the product pages keep their
     one-screen sizes. Where only the visual viewport shrinks (Safari), --hs3-kb carries the
     keyboard's height to the CSS that pins Next above it, and the field being typed in is brought
     into view with room for Next under it. Pinch zoom is not a keyboard. */
  function keyboardRoom() {
    var vp = document.querySelector('meta[name="viewport"]'), was = vp ? vp.getAttribute('content') || '' : '';
    if (vp && !/interactive-widget/.test(was)) vp.setAttribute('content', (was ? was + ', ' : '') + 'interactive-widget=resizes-content');
    var vv = window.visualViewport;
    var lift = function (panned) {
      var kb = vv && Math.abs((vv.scale || 1) - 1) < 0.01 ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      root.style.setProperty('--hs3-kb', kb + 'px');
      if (panned) return;
      var f = document.activeElement;
      if (f && frame && frame.contains(f) && /^(INPUT|TEXTAREA)$/.test(f.tagName)) { try { f.scrollIntoView({ block: 'nearest' }); } catch (e) { /* old browser */ } }
    };
    if (vv && vv.addEventListener) { vv.addEventListener('resize', function () { lift(false); }); vv.addEventListener('scroll', function () { lift(true); }); }
    window.addEventListener('resize', function () { lift(false); });
  }

  function init() {
    root = document.querySelector('[data-hs3]');
    if (!root) return;
    frame = root.querySelector('.hs3__frame');
    keyboardRoom();
    try { cfg = JSON.parse(root.querySelector('[data-hs3-config]').textContent); } catch (e) { cfg = {}; }
    // the bundle saving shows only when the memo strip's one switch says the real discount exists
    cfg.bundleOffer = !!(cfg.bundleOffer || document.querySelector('[data-hs-bundle-live]'));
    heroHTML = frame.innerHTML;
    if (cfg.artworkCandidates && window.HSArtworkChoices) S.noteTone = window.HSArtworkChoices.read().tone;
    if (S.composeRequest) save();
    var q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { /* old browser */ }
    if (q && q.get('hs3') === 'reset') {
      S = fresh();
      try { window.sessionStorage.removeItem(HS2); window.sessionStorage.removeItem(QKEY); window.sessionStorage.removeItem('hs-artwork-choices-v1'); } catch (e) { /* private mode */ }
      idb('readwrite', function (st) { return st.delete(PHOTO); }).catch(function () {});
      save();
    }
    // from a product page: that gift is picked, and a "Change" link brings the buyer back to it
    var giftKey = { mug: 'mug', blanket: 'blanket', portrait: 'print' };
    var giftQ = q && giftKey[q.get('gift')], ret = q && giftKey[q.get('return')];
    if (giftQ && reviewGifts().indexOf(giftQ) !== -1) { S.sel = S.sel || {}; S.sel[giftQ] = true; S.gift = giftQ; }
    if (ret) S.returnTo = ret; else if (!(q && q.get('step'))) S.returnTo = '';
    var want = routeFromURL(), o = routeFor(want ? clampRoute(want) : 'hero');
    Object.keys(o).forEach(function (k) { S[k] = o[k]; });
    if (S.screen === 'reveal') ui.revealN = 9;
    if (S.screen === 'chat' && S.step === 3 && S.more && S.fu && !S.fu.chips.length) ui.typing = true;
    if (S.screen === 'chat') warm(cfg.typedUrl);
    try { nav.depth = (window.history && window.history.state && window.history.state.depth) || 0; } catch (e) { nav.depth = 0; }
    save();
    render();
    restorePhoto().then(function () { if (S.screen !== 'hero') render(); });
    if (!historyOK()) return;
    // Back and Forward show the step they land on, with its answer; nothing is sent
    window.addEventListener('popstate', function (e) {
      var st = e.state || {}, was = nav.depth, want = st.hs3 || routeFromURL() || 'hero';
      nav.depth = st.depth || 0;
      // a step the answers no longer reach (a typed answer's follow-up, once answered) is passed
      // over in the direction the buyer pressed, untouched, so no Back or Forward press lands nowhere.
      // A dog's name Next would refuse reaches no later step, so the buyer lands on the name instead.
      if (want !== 'hero' && clampRoute(want) !== want && nav.depth !== was && dogOK()) {
        try { if (nav.depth < was && nav.depth > 0) { window.history.back(); return; } if (nav.depth > was) { window.history.forward(); return; } } catch (err) { /* show the clamped step below */ }
      }
      nav.route = '';
      applyRoute(want, true);
      if (typeof st.y === 'number') { try { window.scrollTo(0, st.y); } catch (err) { /* old browser */ } } else toView();
    });
    // back from a product page through the browser's cache: re-read the answers that page may have used
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      S = load(); nav.route = '';
      applyRoute(routeFromURL() || 'hero', true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // for tools/preview tests
  window.__hs3api = { state: function () { return S; }, lineFor: lineFor, recGift: recGift, typedAnswer: typedAnswer, names: names, evenBreak: evenBreak, noteWidth: noteWidth, chipStyle: chipStyle, route: { routeOf: routeOf, clampRoute: clampRoute, routeFor: routeFor, prevRoute: prevRoute, urlFor: urlFor, applyRoute: applyRoute, back: back, chip: chip, act: act }, mugColors: mugColors, mugColor: mugColor };
})();
