/* Heartside v3: gifts from your dog. Loaded (deferred) by sections/hs3-chat.liquid.
   The chat with Buddy, the reveal, choose gifts and the share card, from the approved
   prototype (design/prototype-v3/Main.dc.html) and docs/V3-GIFTS-FROM-YOUR-DOG.md.
   Buddy's lines and every gift line for a chip answer are the prototype's, word for word.
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
  var COMPOSE_VERSION = 'explicit-tone-v1';
  var TYPED_MS = 5000, COMPOSE_MS = 11000; // 22 Oct: Gemini 3.5 Flash answers typed replies (about 3 s); Claude writes the note and n8n hands over to Gemini at 7.5 s
  var GIFTS = ['mug', 'blanket', 'print', 'ornament'];
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var root, frame, cfg = {}, S = load(), photoURL = null, timers = [];
  var ui = { prefix: '', echo: '', thinking: false, typing: false, revealN: 0, editing: false, editKey: '', flagged: '', inked: {}, mugSide: 'note', mugTurned: false, toneStatus: '' };

  /* ------------------------------------------------------------------ state */
  function fresh() {
    return { screen: 'hero', step: 1, dog: '', breed: '', pro: 'she', rec: '', rel: 'partner',
      home: null, follow: null, spot: null, together: null, meaning: null,
      typed: {}, ai: {}, fu: null, edits: {}, composed: null, baseLines: null, toneDrafts: {}, toneCache: {}, composeRequest: null, composeBaseGift: null, appliedComposeKey: '', noteTone: 'warm', appliedTone: 'warm', gift: null, tabbed: false,
      sel: {}, shipTo: 'rec', calls: 0, session: '', hasPhoto: false, photoT: 0, photoStorageWarning: '', mugColor: '' };
  }
  function load() {
    var s = null;
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    var f = fresh();
    if (!s || typeof s !== 'object') return f;
    Object.keys(f).forEach(function (k) { if (!(k in s)) s[k] = f[k]; });
    // A reload cannot establish whether a dispatched request was billed or completed.
    if (s.composeRequest) s.composeRequest.status = 'uncertain';
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
  /* The breed, if the buyer gave one, through the corpus lookup (breeds-corpus/lookup). Only an
     exact match counts; its archetype (tone) is a light signal for the dog's voice, never shown. */
  function breedInfo() {
    var b = String(S.breed || '').trim();
    if (!b || !window.HSBreeds) return null;
    var r = null;
    try { r = window.HSBreeds.lookup(b); } catch (e) { r = null; }
    return r && r.exact ? { name: r.name, tone: r.tone } : null;
  }
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
      door: { q: 'At the door! Every day? Even weekends? (I would.)', chips: [['weekends', 'Even weekends'], ['weekdays', 'Weekdays'], ['hears', 'Hears the car first']] },
      toy: { q: 'Ooh, a toy. The same one every time?', chips: [['same', 'Same one, always'], ['closest', 'Whatever is closest'], ['shoe', 'A shoe, honestly']] },
      spin: { q: 'Spins! How many circles are we talking?', chips: [['few', 'Two or three'], ['many', 'Too many to count'], ['dizzy', 'Until ' + n.she + ' is dizzy']] },
      cool: { q: 'Plays it cool? I could never. And then?', chips: [['follows', 'Follows ' + n.rec + ' everywhere'], ['lap', 'Climbs onto ' + n.rec + "'s lap"], ['sighs', 'Sighs until ' + n.rec + ' looks']] }
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
  var SP = { feet: 'Your feet make the best pillow I know.', bed: 'I took your side of the bed to keep it warm.', couch: 'I keep your spot on the couch warm for you.', anywhere: 'Wherever you go, I go, even the bathroom.', skip: "I'm never far from you." };
  var TG = { walk: 'Our walks are the best part of my day.', coffee: 'You have your coffee and I wait for toast.', movie: 'Movie night is better with me beside you.', naps: 'My best naps are the ones next to you.', car: "Any car ride is a good one if you're in it.", skip: 'Any time with you is my favorite time.' };
  var ME = { shadow: "I'm your shadow, and I like it that way.", best: "You're my best friend, and I'm yours.", hard: "On the hard days, I'll stay close to you.", boss: 'I run this house, but I love you most.', skip: "I'm yours, always." };
  var REACT4 = { weekends: "Weekends too? That's a dog who knows what matters.", weekdays: 'Every weekday, like clockwork. I respect that.', hears: "Hearing the car first is a dog's best trick.", same: 'A signature toy is a very classy move.', closest: 'Any present counts when it comes from the heart.', shoe: 'A shoe is a perfectly good present, if you ask me.', few: 'A tasteful little spin, I like it.', many: "That's a full spin cycle, which is my kind of dog.", dizzy: 'Spinning until dizzy is real commitment.', follows: 'Too cool for about a second, then right behind them.', lap: 'The slow climb into the lap is a classic move.', sighs: "The big sigh works every time, doesn't it." };
  var REACT5 = { feet: 'A built-in foot warmer, how thoughtful.', bed: "Their side of the bed? Bold, and I'd do the same.", couch: 'The couch spot is sacred, every dog knows that.', anywhere: 'A true shadow, which is the best kind of dog.', skip: "That's okay, on we go." };
  var REACT6 = { walk: 'Walks are the best part of the day for any dog.', coffee: 'Coffee time, and hopefully some toast for the dog.', movie: 'A couch and a movie sounds like the dream.', naps: "Naps together, now we're talking.", car: 'Car rides, with ears out the window I hope!', skip: 'No worries at all.' };
  var GN = { mug: 'The Morning Mug', blanket: 'The Couch Blanket', print: 'The Framed Print', ornament: 'The Tree Ornament' };
  var SHORT = { mug: 'Mug', blanket: 'Blanket', print: 'Print', ornament: 'Ornament' };
  var DS = { mug: '11 oz ceramic, blush inside', blanket: '50 by 60 in sherpa, so soft', print: '12 by 18 in, black, white or oak frame', ornament: 'Ceramic, for the tree' };
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
    if (g === 'mug') return ['home', 'spot', 'meaning'];
    if (g === 'ornament') return ['meaning'];
    return ['home', 'spot', 'together', 'meaning'];
  }
  function reasonFor(g, n) {
    if (S.composed && S.composed.reason && g === S.composed.gift) return S.composed.reason;
    // Buddy's mug reason repeats only the "together" answer the buyer picked; a typed answer
    // or "Not sure" gets skip (Cowork report 15 Oct, section 3; 140 characters at most)
    var d = n.dog, r = n.rec;
    var MUG = {
      walk: d + ' lives for the morning walk. Good dog. The mug keeps ' + d + ' with ' + r + ' for the rest of the morning.',
      coffee: d + ' already keeps ' + r + ' company over coffee. Now ' + d + ' gets to be on the cup too.',
      movie: d + ' has movie night covered. The mug is for mornings, so ' + r + ' gets ' + d + ' with every cup.',
      naps: d + ' naps best with ' + r + ' around. The mug keeps ' + d + ' close for the awake parts.',
      car: d + ' would ride anywhere with ' + r + '. With the mug, ' + d + ' comes along to every morning cup too.',
      skip: d + ' goes on one side, the note on the other. So ' + r + ' starts every morning with both.'
    };
    return {
      mug: MUG[S.together] || MUG.skip,
      blanket: 'For the couch they share. Warm, soft, and ' + n.dog + ' is already on it.',
      print: 'For the wall by the door, so ' + n.rec + ' sees ' + n.dog + ' the minute they get home.',
      ornament: 'For the tree. ' + n.dog + ' comes out every December, right where ' + n.rec + ' will see.'
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
    t = String(t || '').replace(/[\u2014\u2013]/g, ', ').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
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
    var t = String(line || '').replace(/[‘’]/g, "'").trim();
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
    var t = String(line || '').replace(/[‘’]/g, "'").replace(/!/g, '.').trim();
    if (!t || t.length > maxFor(key) || THIRD.test(t)) return '';
    var dog = String(S.dog || '').trim().toLowerCase();
    if (dog && t.toLowerCase().indexOf(dog) !== -1) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function clip(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n) : t; }
  var GRIEF = /\b(died|dead|death|passed away|put down|put to sleep|rainbow bridge|cancer|funeral|in heaven)\b/i;
  var PROFANE = /\b(fuck|shit|bitch|cunt|asshole|bastard|whore|slut)\w*/i;
  // the typed-answer call (5.2); resolves to { reaction, line, follow_up, flags } or a fallback
  function typedAnswer(step, question, text, previous) {
    var n = names();
    var body = { step: step, question: question, typed_text: clip(text, 140), previous_line: previous || '', dog: dogFor(), recipient: { name: S.rec ? n.rec : '', relation: S.rel } };
    var key = step === 'home_follow' ? 'home' : step;
    return callAI(cfg.typedUrl, body, TYPED_MS).then(function (r) {
      if (r && typeof r === 'object' && (typeof r.line === 'string' || (r.flags && r.flags.length))) {
        return {
          reaction: clip(r.reaction, 70), line: r.line ? dogStyle(r.line, key) || ownWords(chipStyle(text, key), key) || previous || '' : '',
          follow_up: r.follow_up && r.follow_up.question ? {
            question: clip(r.follow_up.question, 70),
            chips: (r.follow_up.chips || []).slice(0, 3).map(function (c) { return clip(c, 24); }),
            lines: (r.follow_up.lines || []).slice(0, 3).map(function (l) { return typeof l === 'string' ? dogStyle(l, 'home') || null : null; }),
            replies: (r.follow_up.replies || []).slice(0, 3).map(function (x) { return typeof x === 'string' && x.length <= 50 ? x : null; })
          } : null,
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
  function toneStatus() {
    if (S.composeRequest) return S.composeRequest.status === 'pending' ? 'Updating your note. Your edits stay as written.' : 'Your update has not been confirmed. Your words are safe; please keep this page open. Another update is paused.';
    if (ui.toneStatus) return ui.toneStatus;
    return S.appliedComposeKey === composeKey(S.noteTone) ? '' : 'Choose Update note to apply this tone. Your edits stay as written.';
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
      if (status) status.textContent = cfg.artworkCandidates && (S.gift || recGift()) === 'blanket' ? 'Applies when you create the blanket artwork. No words are printed.' : toneStatus();
      if (button) button.disabled = !!S.composeRequest || S.appliedComposeKey === composeKey(S.noteTone);
      fit();
    }
  }
  function applyComposed(result, tone, key, rewrite) {
    // User-owned edits always win in lineFor, including edits made during a request.
    S.composed = result; S.appliedTone = tone; S.appliedComposeKey = key;
    if (!rewrite && result.gift && !S.tabbed && S.screen === 'reveal') S.gift = result.gift;
    ui.toneStatus = '';
  }
  function settleCompose(request, r) {
    if (!S.composeRequest || S.composeRequest.id !== request.id) return;
    if (!r) {
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
  function compose(tone, rewrite) {
    tone = tone || 'warm';
    if (['sentimental', 'warm', 'hilarious'].indexOf(tone) === -1 || S.composeRequest) return;
    if (!S.baseLines) S.baseLines = allLines();
    if (!S.composeBaseGift) S.composeBaseGift = recGift();
    var key = composeKey(tone);
    if (S.appliedComposeKey === key) return;
    if (S.toneCache[key]) { applyComposed(S.toneCache[key], tone, key, rewrite); save(); render(); return; }
    if (!canCall(cfg.composeUrl)) { ui.toneStatus = 'Updates are unavailable right now. Your words are unchanged.'; render(); return; }
    var body = composeBody(tone);
    var id = sessionId() + '-note-' + (S.composeAsked = (S.composeAsked || 0) + 1);
    var request = S.composeRequest = { id: id, key: key, tone: tone, rewrite: !!rewrite, status: 'pending' };
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
      if (rec && rec.file && S.hasPhoto && rec.t === S.photoT && Date.now() - rec.t < 3 * 864e5) usePhoto(rec.file, rec.t);
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
    if (status) { status.hidden = !message; status.textContent = message || ''; fit(); }
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
    st.hs3_mug_lines = mugLines();
    st.hs3_copy_owner = Object.keys(S.edits || {}).some(function(k) { return S.edits[k] != null; }) ? 'user' : 'generated';
    st.hs3_photo_t = S.hasPhoto ? S.photoT : 0;
    var kinds = {};
    GIFTS.forEach(function (g) { var x = cfg.gifts && cfg.gifts[g]; if (x && x.handle) kinds[x.handle] = g; });
    st.hs3_kinds = kinds;
    st.hs_answers = answerSummary();
    if (window.HSArtworkProfile) st.hs3_art_profile = window.HSArtworkProfile.fromChat(S);
    if (cfg.artworkCandidates && window.HSArtworkChoices) st.hs3_art_choices = window.HSArtworkChoices.read();
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

  function render() {
    if (!frame) return;
    var keepToneFocus = document.activeElement && document.activeElement.hasAttribute('data-hs3-tone');
    var n = names();
    frame.setAttribute('data-hs3-screen', S.screen);
    root.classList.toggle('hs3--app', S.screen !== 'hero');
    if (S.screen === 'hero') { frame.innerHTML = heroHTML; bindHero(); return; }
    if (S.screen === 'chat') frame.innerHTML = chatView(n);
    else if (S.screen === 'reveal') frame.innerHTML = revealView(n);
    else if (S.screen === 'choose') frame.innerHTML = chooseView(n);
    else if (S.screen === 'share') frame.innerHTML = shareView(n);
    photoStorageStatus();
    bind();
    fit();
    if (keepToneFocus) { var tone = frame.querySelector('[data-hs3-tone]'); if (tone) tone.focus(); }
  }

  /* One screen, no scroll (Krish, 21 Oct): every screen fits the window under the header on
     every device. hs3.css locks the page and gives each screen one flexible area (ART); this
     sizes the frame to the window, scales that area's picture to the room it gets, and if the
     rest still doesn't fit, zooms the screen's content down until it does. Not while the
     keyboard is up: the browser moves the page to the field, and fit runs again on blur. */
  var ART = { hero: '.hs3-hero__art > .hs3-mugwrap', chat: null, reveal: '.hs3-stage > *', choose: null, share: '.hs3-share__card > *' };
  function typing_() { var a = document.activeElement; return !!(a && frame && frame.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName)); }
  function fit() {
    if (!frame || typing_()) return;
    var de = document.documentElement;
    try { window.scrollTo(0, 0); } catch (e) { /* old browser */ }
    var top = frame.getBoundingClientRect().top;
    de.style.setProperty('--hs3-h', Math.max(320, Math.floor(window.innerHeight - top)) + 'px');
    var kids = Array.prototype.slice.call(frame.children);
    kids.forEach(function (k) { k.style.zoom = ''; });
    var sel = ART[frame.getAttribute('data-hs3-screen')], art = sel ? frame.querySelector(sel) : null;
    var artFit = function () {
      if (!art) return;
      art.style.zoom = '';
      var box = art.parentNode, cs = window.getComputedStyle(box);
      var h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var z = Math.min(cfgZoom(art), h / (art.offsetHeight || 1), w / (art.offsetWidth || 1));
      if (z > 0 && Math.abs(z - 1) > 0.01) art.style.zoom = Math.max(0.3, z).toFixed(3);
    };
    var fits = function (z) {
      kids.forEach(function (k) { k.style.zoom = z === 1 ? '' : z.toFixed(3); });
      artFit();
      return frame.scrollHeight <= frame.clientHeight + 1;
    };
    // zoomed content also wraps less, so search for the largest zoom that fits
    var z = 1;
    if (!fits(1)) {
      var lo = 0.4, hi = 1;
      for (var i = 0; i < 7; i++) { var mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
      z = lo; fits(z);
    }
    frame.setAttribute('data-hs3-fit', z.toFixed(2));
  }
  // the picture may grow up to this much on a roomy screen (the desktop reveal draws large)
  function cfgZoom(art) { return art.closest('.hs3-stage') && window.innerWidth >= 1000 ? 1.35 : 1; }

  // ---- the chat
  var chatQ = null; // the current question: { prefix, question, chips, skip, next, input }
  function hasArtworkFacts() {
    return !!(window.HSArtworkProfile && window.HSArtworkProfile.fromChat(S).facts.length);
  }
  function chatModel(n) {
    var m = { prefix: ui.prefix, question: '', chips: [], skip: false, next: null, nextLabel: 'Next', input: null, other: false };
    var step = S.step;
    if (step === 1) {
      m.question = "Hi! I'm Buddy. I sniff out gifts from dogs to the people they love. Who's your dog?";
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
      if (cfg.artworkCandidates && !hasArtworkFacts()) {
        m.prefix = 'We can keep this simple.';
        m.question = 'Without any habits to go on, the artwork will focus on ' + n.dog + '. You can go back to add a detail.';
      }
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
    h += '<div class="hs3-says"><span class="hs3-biscuit' + (ui.thinking ? ' is-tilt' : '') + '">' + BUDDY + '</span>';
    if (ui.thinking) h += '<div class="hs3-bubble" aria-label="Buddy is sniffing around"><span class="hs3-dotty"></span><span class="hs3-dotty"></span><span class="hs3-dotty"></span></div>';
    else h += '<div class="hs3-bubble hs3-pop" aria-live="polite">' + (ui.flagged ? '<span class="hs3-prefix">' + esc(ui.flagged) + ' </span>' : (m.prefix ? '<span class="hs3-prefix">' + esc(m.prefix) + ' </span>' : '')) + esc(m.question) + '</div>';
    h += '</div></div>';
    h += '<div class="hs3-dock">';
    if (!ui.thinking) {
      if (m.input === 'dog') {
        // the field names sit inside the fields, so the first question is two boxes and a button
        h += '<input id="hs3-dog" class="hs3-field" type="text" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="Your dog\'s name" aria-label="Your dog\'s name" value="' + esc(S.dog) + '" data-hs3-in="dog">';
        h += '<input id="hs3-breed" class="hs3-field" type="text" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="Breed, if you know it" aria-label="Breed, if you know it (optional)" value="' + esc(S.breed) + '" data-hs3-in="breed">';
        h += '<div class="hs3-row"><button type="button" class="hs3-chip' + (S.pro === 'she' ? ' is-on' : '') + '" data-hs3="pro" data-v="she" aria-pressed="' + (S.pro === 'she') + '">She</button><button type="button" class="hs3-chip' + (S.pro === 'he' ? ' is-on' : '') + '" data-hs3="pro" data-v="he" aria-pressed="' + (S.pro === 'he') + '">He</button>';
        h += '<label class="hs3-photo-pick">' + img('', 'hs3-photo--tiny') + '<span>' + (S.hasPhoto ? 'Change photo' : 'Add a photo') + '</span><input type="file" accept="image/*" data-hs3-file></label></div>';
        if (!S.hasPhoto) h += '<div class="hs3-small hs3-later">No photo handy? Add it later, on the gift.</div>';
      } else if (m.input === 'rec') {
        h += '<div class="hs3-chips">' + [['self', 'Me'], ['partner', 'My partner'], ['mom', 'Mom'], ['dad', 'Dad'], ['kid', 'Our kid'], ['friend', 'A friend']].map(function (c) {
          return '<button type="button" class="hs3-chip' + (S.rel === c[0] ? ' is-on' : '') + '" data-hs3="rel" data-v="' + c[0] + '" aria-pressed="' + (S.rel === c[0]) + '">' + esc(c[1]) + '</button>';
        }).join('') + '</div>';
        h += '<label class="hs3-small" for="hs3-rec">' + (S.rel === 'self' ? 'Your first name' : 'Their first name') + '</label><input id="hs3-rec" class="hs3-field" type="text" maxlength="14" autocomplete="off" autocapitalize="words" value="' + esc(S.rec) + '" data-hs3-in="rec">';
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
    var g = reviewGifts().indexOf(S.gift) !== -1 ? S.gift : recGift();
    var wordFree = cfg.artworkCandidates && g === 'blanket';
    if (wordFree) ui.editing = false;
    var pick = recGift();
    var keys = giftKeys(g);
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="toChat">Back</button><span class="hs3-label">' + (g === pick ? 'Buddy\'s pick' : esc(GN[g])) + '</span><span class="hs3-spacer"></span></div>';
    h += '<h2 class="hs3-h2">' + esc(n.dog) + '\'s gift for ' + esc(n.rec) + '</h2>';
    if (!ui.editing) {
      h += '<div class="hs3-tabs" role="group" aria-label="Gifts">' + reviewGifts().map(function (k) {
        return '<button type="button" class="hs3-tab' + (k === g ? ' is-on' : '') + '" data-hs3="tab" data-v="' + k + '" aria-pressed="' + (k === g) + '">' + ICON[k] + '<span>' + SHORT[k] + '</span><span class="hs3-tab__tag">' + (k === pick ? "Buddy's pick" : '') + '</span></button>';
      }).join('') + '</div>';
      var toneIndex = { sentimental: 0, warm: 1, hilarious: 2 }[S.noteTone] || 0;
      var toneName = ['Sentimental', 'Warm with a wink', 'Hilarious'][toneIndex];
      var status = toneStatus();
      if (cfg.artworkCandidates) h += '<details class="hs-art-choices"><summary>Explore artwork styles</summary><div data-hs-art-choices></div></details>';
      if (wordFree) {
        h += '<div class="hs3-tone"><div class="hs3-tone__top"><span>Artwork tone</span><strong data-hs3-tone-name>' + toneName + '</strong></div><input type="range" min="0" max="2" step="1" value="' + toneIndex + '" aria-label="Artwork tone" aria-valuetext="' + toneName + '" aria-describedby="hs3-tone-status" data-hs3-tone><p id="hs3-tone-status" class="hs3-tone__status" role="status">Applies when you create the blanket artwork. No words are printed.</p></div>';
      } else h += '<div class="hs3-tone"><div class="hs3-tone__top"><span>Make it sound more like ' + esc(n.dog) + '</span><strong data-hs3-tone-name>' + toneName + '</strong></div><div class="hs3-tone__row"><span>Sentimental</span><input type="range" min="0" max="2" step="1" value="' + toneIndex + '" aria-label="Note tone" aria-valuetext="' + toneName + '" aria-describedby="hs3-tone-status" data-hs3-tone><span>Hilarious</span></div><div class="hs3-tone__update"><p id="hs3-tone-status" class="hs3-tone__status" role="status">' + esc(status) + '</p><button type="button" class="hs3-tone__button" data-hs3="updateTone"' + (S.composeRequest || S.appliedComposeKey === composeKey(S.noteTone) ? ' disabled' : '') + '>Update note</button></div></div>';
    }
    var lines = keys.map(function (k, i) { return '<span class="hs3-line ' + (i < ui.revealN ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(lineFor(k) || '') + '</span>'; }).join('');
    h += '<div class="hs3-stage">' + mockup(g, n, lines) + '</div>';
    if (g === 'mug' && !ui.editing) h += mugSwatches();
    if (ui.editing) {
      var editIndex = keys.indexOf(ui.editKey);
      if (editIndex < 0) { editIndex = 0; ui.editKey = keys[0]; }
      var editText = lineFor(ui.editKey) || '';
      h += '<div class="hs3-edit"><div class="hs3-edit__nav"><button type="button" class="hs3-edit__arrow" data-hs3="editPrev" aria-label="Previous sentence"' + (editIndex === 0 ? ' disabled' : '') + '>‹</button><span>Sentence ' + (editIndex + 1) + ' of ' + keys.length + '</span><button type="button" class="hs3-edit__arrow" data-hs3="editNext" aria-label="Next sentence"' + (editIndex === keys.length - 1 ? ' disabled' : '') + '>›</button></div>';
      h += '<label class="hs3-edit__row" for="hs3-edit-line"><span class="hs3-sr">Change sentence ' + (editIndex + 1) + '</span><input id="hs3-edit-line" class="hs3-field hs3-field--mono" type="text" maxlength="' + maxFor(ui.editKey) + '" value="' + esc(editText) + '" data-hs3-edit="' + ui.editKey + '"><span class="hs3-small hs3-right" data-hs3-left="' + ui.editKey + '">' + (maxFor(ui.editKey) - editText.length) + ' characters left</span></label></div>';
    } else {
      h += '<div class="hs3-says hs3-says--reveal"><span class="hs3-biscuit">' + BUDDY + '</span><div class="hs3-bubble hs3-pop"><strong>' + esc(GN[g]) + '.</strong> ' + esc(wordFree ? 'A word-free design made from your dog’s photo and the details you share.' : reasonFor(g, n)) + '</div></div>';
    }
    h += '<div class="hs3-dock"><p class="hs3-small hs3-center">' + (wordFree ? 'The blanket has no note, name or signature.' : ui.editing ? 'Your changes appear on the gift as you type.' : 'Written from your answers. Change any word.') + '</p><button type="button" class="hs3-btn" data-hs3="them">That\'s them. Choose gifts</button>' + (wordFree ? '' : '<button type="button" class="hs3-ghost" data-hs3="edit">' + (ui.editing ? 'Done' : 'Change a word') + '</button>') + '</div>';
    return h;
  }
  function mockup(g, n, lines) {
    // laid out like the real print files (Cowork's fit test, 14 Oct): the name in normal case, signed with a paw
    if (g === 'mug') return mugFaces(n);
    if (g === 'blanket' && cfg.artworkCandidates) return '<div class="hs3-blanket"><div class="hs3-blanket__in">' + img('Photo reference for your blanket', 'hs3-photo--blanket') + '</div></div><p class="hs3-small hs3-center">Photo reference only. Your word-free artwork is created on the product page.</p>';
    if (g === 'blanket') return '<div class="hs3-blanket"><div class="hs3-blanket__in">' + img('Your dog on the blanket', 'hs3-photo--blanket') + '<div class="hs3-blanket__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
    if (g === 'print') return '<div class="hs3-print"><div class="hs3-print__in">' + img('Your dog on the print', 'hs3-photo--print') + '<div class="hs3-print__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
    return '<div class="hs3-orn"><span class="hs3-orn__string"></span><span class="hs3-orn__cap"></span><div class="hs3-orn__ball">' + img('Your dog on the ornament', 'hs3-photo--orn') + '<div class="hs3-orn__name">' + esc(n.dog) + '</div>' + lines + signUnder(n) + '</div></div>';
  }
  /* The mug as it prints (mug v3, approved 15 Oct). The reveal draws it the way the approved
     Shopify images were made (tools/realphoto/shopify_mug_images.py): the print file's face is
     laid out at print size in the fonts Teeinblue prints with, then wrapped around the cylinder
     of Printful's photo, so rows bow and narrow toward the edge and the glaze shading runs through
     the ink. tools/preview/mockup-gate.mjs holds it to that render. The dog is on the face others
     see (handle left) and the note on the drinker's face (handle right). A phone can't show both
     faces side by side at a readable size, so the mug turns. Teeinblue removes the photo's
     background on the product page; here the photo sits whole, with soft edges. If a browser
     can't draw it, the flat layout underneath shows instead. */
  // RIM_TOP and RIM_BOT: how far a row rises at the mug's edge, at the top and the bottom of the
  // print. Measured from Printful's photo (15 Oct): the rim's front edge sags 18 px and the base
  // 59 px (700 px photo), so lower rows curve about three times as much, as in any photo taken
  // from slightly above. One constant for every row looked flat and tilted (Krish, 15 Oct).
  var MUG = { W: 2700, H: 1050, RPX: 487.5, R: 330, TOP: 260.5714, BAND: 742.2857, RIM_TOP: 34.0171, RIM_BOT: 97.9695, Y0: 150, CROP: 1060, OUT: 640, OUTH: 549, DS: 0.5,
    dog: { cx: 726, x0: 80, centre: 585 }, note: { cx: 472.2857, x0: 60, centre: 2115 } };
  var mugCache = {}, mugAssets = {}, mugPhoto = { src: '', p: null };
  /* The mug's colors (inside and handle), one Shopify variant each, Black first (Krish, 19 Oct,
     after Mowgli's pink mug). The section lists only the colors the product has, with each
     one's variant and its recolored photo layers (tools/realphoto/recolor_mug.py). */
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
  function mugFaces(n) {
    var m = cfg.mug || {}, c = mugColor() || {}, side = ui.mugSide === 'dog' ? 'dog' : 'note', src = photoSrc(), texts = mugLineTexts();
    var layer = function (url, cls) { return url ? '<img src="' + esc(url) + '" alt="" width="640" height="549" class="' + cls + '">' : ''; };
    var canvas = function (face, label) { return '<canvas class="hs3-mugface__canvas" width="' + MUG.OUT + '" height="' + MUG.OUTH + '" data-hs3-mug="' + face + '" role="img" aria-label="' + esc(label) + '"></canvas>'; };
    var dog = src ? '<img data-hs3-photo src="' + esc(src) + '" alt="" class="hs3-mugface__dog">' : '<span class="hs3-mugface__nodog">' + PAW + '</span>';
    var lines = texts.map(function (t, i) {
      return '<span class="hs3-line hs3-mugface__line hs3-mugface__line--' + (i + 1) + ' ' + (i < ui.revealN ? 'hs3-ink' : 'hs3-pencil') + '">' + esc(t) + '</span>';
    }).join('');
    var h = '<div class="hs3-mugwrap"><div class="hs3-mugs" data-side="' + side + '">';
    h += '<div class="hs3-mugface hs3-mugface--dog"' + (side === 'dog' ? '' : ' aria-hidden="true"') + '>' + layer(c.dog || m.dog, 'hs3-mugface__base') + layer(m.dogShade, 'hs3-mugface__shade');
    h += '<span class="hs3-mugface__flat" aria-hidden="true"><span class="hs3-mugface__photo">' + dog + '</span></span>' + canvas('dog', src ? n.dog + ' on the mug' : "Your dog's photo goes here") + '</div>';
    h += '<div class="hs3-mugface hs3-mugface--note"' + (side === 'note' ? '' : ' aria-hidden="true"') + '>' + layer(c.note || m.note, 'hs3-mugface__base') + layer(m.noteShade, 'hs3-mugface__shade');
    h += '<span class="hs3-mugface__flat" aria-hidden="true">' + lines + '<span class="hs3-mugface__sign">' + PAW + '<span>Love, ' + esc(n.dog) + '</span></span></span>' + canvas('note', texts.join(' ').replace(/\n/g, ' ') + ' Love, ' + n.dog) + '</div>';
    h += '</div>' + (ui.editing ? '' : '<button type="button" class="hs3-quiet hs3-turn" data-hs3="turn">Turn the mug</button>') + '</div>';
    return h;
  }
  function loadImg(src) {
    return new Promise(function (resolve, reject) { var i = new Image(); i.onload = function () { resolve(i); }; i.onerror = reject; i.src = src; });
  }
  function loadMugAssets(color) {
    var c = color || mugColor() || {}, key = c.name || '';
    if (mugAssets[key]) return mugAssets[key];
    var m = cfg.mug || {};
    var font = function (name, url) {
      if (!window.FontFace || !document.fonts || !url) return Promise.reject(new Error('no font'));
      return new window.FontFace(name, 'url(' + url + ')').load().then(function (f) { document.fonts.add(f); });
    };
    var p = Promise.all([loadImg(c.dog || m.dog), loadImg(m.dogShade), loadImg(c.note || m.note), loadImg(m.noteShade), loadImg(m.paw), font('HS Note Text', m.fontText), font('HS Note Italic', m.fontItalic)])
      .then(function (r) { return { dog: { base: r[0], shade: r[1] }, note: { base: r[2], shade: r[3] }, paw: r[4] }; });
    mugAssets[key] = p;
    p.catch(function () { delete mugAssets[key]; });
    return p;
  }
  function mugKey(face) {
    var c = (mugColor() || {}).name || '';
    if (face === 'dog') return c + '|dog|' + photoSrc();
    return c + '|note|' + JSON.stringify([mugLineTexts(), Math.min(ui.revealN, 3), names().dog]);
  }
  // the note face at print size: lines 1 to 3 (58 px, 70 px rows, centred in 190 px boxes),
  // the paw, and "Love, [dog]" (96 px, shrunk to fit 775 px as Teeinblue does)
  function drawNote(d, a, spec) {
    var texts = spec.texts, ink = spec.ink, sig = 'Love, ' + spec.name;
    d.textBaseline = 'alphabetic';
    d.font = NOTE_PX + 'px "HS Note Text"';
    [130, 345, 560].forEach(function (top, i) {
      var rows = String(texts[i] || '').split('\n');
      d.fillStyle = i < ink ? '#121010' : '#CDC2B9';
      rows.forEach(function (r, j) { d.fillText(r, 1685, top + 95 + (j - (rows.length - 1) / 2) * NOTE_LH + 22); });
    });
    d.drawImage(a.paw, 1685, 833, 72, 69);
    var size = 96;
    d.font = '96px "HS Note Italic"';
    var w = d.measureText(sig).width;
    if (w > 775) { size = 96 * 775 / w; d.font = size.toFixed(2) + 'px "HS Note Italic"'; }
    d.fillStyle = '#8A4A2B';
    d.fillText(sig, 1774, 855 + 34 * size / 96); // Teeinblue sets it 4 px into its box at 1770
  }
  // the dog face: the photo layer (900 x 1000 at 135, 50), fitted whole ("Contain"), soft edges
  function drawDog(d, a, photo) {
    var L = 135, T = 50, BW = 900, BH = 1000;
    if (!photo) { d.globalAlpha = 0.2; d.drawImage(a.paw, L + BW / 2 - 150, T + BH / 2 - 144, 300, 288); d.globalAlpha = 1; return; }
    var s = Math.min(BW / photo.width, BH / photo.height), w = photo.width * s, h = photo.height * s;
    var tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.round(w * MUG.DS)); tmp.height = Math.max(1, Math.round(h * MUG.DS));
    var t = tmp.getContext('2d');
    t.drawImage(photo, 0, 0, tmp.width, tmp.height);
    t.globalCompositeOperation = 'destination-in';
    var fade = function (g, stops) { stops.forEach(function (st) { g.addColorStop(st[0], st[1] ? '#000' : 'rgba(0,0,0,0)'); }); return g; };
    t.fillStyle = fade(t.createLinearGradient(0, 0, tmp.width, 0), [[0, 0], [0.1, 1], [0.9, 1], [1, 0]]); t.fillRect(0, 0, tmp.width, tmp.height);
    t.fillStyle = fade(t.createLinearGradient(0, 0, 0, tmp.height), [[0, 0], [0.08, 1], [0.84, 1], [1, 0]]); t.fillRect(0, 0, tmp.width, tmp.height);
    d.drawImage(tmp, L + (BW - w) / 2, T + (BH - h) / 2, w, h);
  }
  // wrap the print-size design around the mug in the photo: arcsin mapping, each row's curve
  // growing from the rim to the base, edge fade, shading and glaze (golden_reveal_mug.py is the
  // same in Python), 2 x 2 samples per pixel
  function wrapOnto(base, design, g) {
    var bd = base.data, dd = design.data, BW = base.width, BH = base.height, DW = design.width, DH = design.height;
    var k = MUG.OUT / MUG.CROP, s = MUG.DS, sub = [0.25, 0.75], dA = MUG.RIM_BOT - MUG.RIM_TOP;
    for (var x = 0; x < BW; x++) {
      var cols = [];
      for (var i = 0; i < 2; i++) {
        var t = ((x + sub[i]) / k + g.x0 - g.cx) / MUG.R;
        if (Math.abs(t) >= 0.995) continue;
        var u = (g.centre + Math.asin(t) * MUG.RPX) * s;
        if (u < 0 || u >= DW - 1) continue;
        var cv = 1 - Math.sqrt(1 - t * t);
        // a print row v sits at y = TOP + v/H * BAND - (RIM_TOP + dA * v/H) * cv; solved for v
        cols.push(u, MUG.TOP - MUG.RIM_TOP * cv, MUG.H * s / (MUG.BAND - dA * cv), Math.min(1, (0.995 - Math.abs(t)) / 0.07));
      }
      if (!cols.length) continue;
      for (var y = 0; y < BH; y++) {
        var pr = 0, pg = 0, pb = 0, pa = 0;
        for (var c = 0; c < cols.length; c += 4) {
          for (var j = 0; j < 2; j++) {
            var v = ((y + sub[j]) / k + MUG.Y0 - cols[c + 1]) * cols[c + 2];
            if (v < 0 || v >= DH - 1) continue;
            var u0 = cols[c] | 0, v0 = v | 0, fx = cols[c] - u0, fy = v - v0;
            var p = (v0 * DW + u0) * 4, q = p + DW * 4;
            var w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
            var a0 = dd[p + 3] * w0, a1 = dd[p + 7] * w1, a2 = dd[q + 3] * w2, a3 = dd[q + 7] * w3, lim = cols[c + 3] / 255;
            pr += (dd[p] * a0 + dd[p + 4] * a1 + dd[q] * a2 + dd[q + 4] * a3) * lim;
            pg += (dd[p + 1] * a0 + dd[p + 5] * a1 + dd[q + 1] * a2 + dd[q + 5] * a3) * lim;
            pb += (dd[p + 2] * a0 + dd[p + 6] * a1 + dd[q + 2] * a2 + dd[q + 6] * a3) * lim;
            pa += (a0 + a1 + a2 + a3) * lim;
          }
        }
        if (pa <= 0) continue;
        var A = pa / 4, o = (y * BW + x) * 4, lum = (bd[o] + bd[o + 1] + bd[o + 2]) / 3;
        var shade = Math.pow(Math.min(Math.max(lum / 250, 0), 1.05), 1.15), spec = Math.min(Math.max((lum - 246) / 9, 0), 1) * 0.35;
        for (var ch = 0; ch < 3; ch++) {
          var col = (ch === 0 ? pr : ch === 1 ? pg : pb) / pa * shade, out = bd[o + ch] * (1 - A) + col * A;
          if (A > 0.01) out = out * (1 - spec) + 255 * spec;
          bd[o + ch] = out;
        }
      }
    }
  }
  // spec (for tools/preview/mockup-gate.mjs): { texts, ink, name } for the note, or { print }, a
  // whole 2700 x 1050 print file to wrap as it is; otherwise the buyer's own words and photo
  function renderFace(face, a, photo, spec) {
    spec = spec || { texts: mugLineTexts(), ink: Math.min(ui.revealN, 3), name: names().dog };
    var bg = document.createElement('canvas');
    bg.width = MUG.OUT; bg.height = MUG.OUTH;
    var b = bg.getContext('2d');
    b.drawImage(a[face].base, 0, 0, MUG.OUT, MUG.OUTH);
    b.drawImage(a[face].shade, 0, 0, MUG.OUT, MUG.OUTH);
    var dz = document.createElement('canvas');
    dz.width = Math.round(MUG.W * MUG.DS); dz.height = Math.round(MUG.H * MUG.DS);
    var d = dz.getContext('2d');
    d.scale(MUG.DS, MUG.DS);
    if (spec.print) d.drawImage(spec.print, 0, 0, MUG.W, MUG.H);
    else if (face === 'note') drawNote(d, a, spec);
    else drawDog(d, a, photo);
    var base = b.getImageData(0, 0, MUG.OUT, MUG.OUTH);
    wrapOnto(base, d.getImageData(0, 0, dz.width, dz.height), MUG[face]);
    b.putImageData(base, 0, 0);
    return bg;
  }
  // the first screen's example mug: the same real-photo mug as the reveal, with Teeinblue's sample
  // dog and the dog's own words (the chip lines), turning between the dog's face and the note
  var HERO_MUG = { texts: [H.door.weekends, SP.bed, ME.shadow], name: 'Kuku' };
  function heroMug() {
    var box = frame && frame.querySelector('[data-hs3-hero-mug]'), m = cfg.mug || {};
    if (!box || !m.sample) return;
    Promise.all([loadMugAssets(mugColors()[0]), loadImg(m.sample)]).then(function (r) {
      var spec = { texts: HERO_MUG.texts.map(evenBreak), ink: 3, name: HERO_MUG.name };
      box.querySelectorAll('canvas[data-hs3-heromug]').forEach(function (c) {
        var face = c.getAttribute('data-hs3-heromug');
        c.getContext('2d').drawImage(renderFace(face, r[0], face === 'dog' ? r[1] : null, spec), 0, 0);
        c.classList.add('is-drawn');
      });
      var mugs = box.querySelector('.hs3-mugs');
      if (reduced) { mugs.setAttribute('data-side', 'note'); return; }
      clearInterval(heroMug.t);
      heroMug.t = setInterval(function () {
        if (!mugs.isConnected) { clearInterval(heroMug.t); return; }
        mugs.setAttribute('data-side', mugs.getAttribute('data-side') === 'dog' ? 'note' : 'dog');
      }, 3200);
    }).catch(function () { /* the plain mug photo stays */ });
  }
  function paintMugs() {
    var cvs = frame ? Array.prototype.slice.call(frame.querySelectorAll('canvas[data-hs3-mug]')) : [];
    if (!cvs.length) return;
    var src = photoSrc();
    if (src && mugPhoto.src !== src) mugPhoto = { src: src, p: loadImg(src) };
    Promise.all([loadMugAssets(), src ? mugPhoto.p : null]).then(function (r) {
      cvs.forEach(function (c) {
        if (!c.isConnected) return;
        var face = c.getAttribute('data-hs3-mug'), key = mugKey(face);
        if (!mugCache[key]) { if (Object.keys(mugCache).length > 16) mugCache = {}; mugCache[key] = renderFace(face, r[0], r[1]); }
        var x = c.getContext('2d');
        x.clearRect(0, 0, c.width, c.height);
        x.drawImage(mugCache[key], 0, 0);
        c.classList.add('is-drawn');
      });
    }).catch(function () { var m = frame && frame.querySelector('.hs3-mugs'); if (m) m.classList.add('is-flat'); });
  }
  function turnMug(side) {
    ui.mugSide = side;
    var m = frame && frame.querySelector('.hs3-mugs');
    if (!m) return;
    m.setAttribute('data-side', side);
    var dog = m.querySelector('.hs3-mugface--dog'), note = m.querySelector('.hs3-mugface--note');
    if (side === 'dog') { dog.removeAttribute('aria-hidden'); note.setAttribute('aria-hidden', 'true'); } else { note.removeAttribute('aria-hidden'); dog.setAttribute('aria-hidden', 'true'); }
  }
  function startReveal(g) {
    clearTimers();
    ui.editing = false; ui.revealN = reduced ? 9 : 0;
    // the mug opens on the buyer's dog, then turns to the note; with no photo yet, on the note
    var turn = g === 'mug' && !reduced && !!photoSrc();
    ui.mugSide = turn ? 'dog' : 'note'; ui.mugTurned = false;
    S.screen = 'reveal'; S.gift = g; save(); render();
    if (reduced) return;
    var lag = turn ? 1400 : 0;
    if (turn) later(function () { if (!ui.mugTurned) turnMug('note'); }, lag - 250);
    var k = giftKeys(g).length;
    for (var i = 1; i <= k; i++) (function (x) { later(function () { ui.revealN = x; inkLines(); }, lag + 450 + x * 650); })(i);
  }
  function inkLines() {
    frame.querySelectorAll('.hs3-stage .hs3-line').forEach(function (el, i) { if (i < ui.revealN && !el.classList.contains('hs3-ink')) { el.classList.remove('hs3-pencil'); el.classList.add('hs3-ink', 'hs3-ink--new'); } });
    paintMugs();
  }

  // ---- choose gifts
  function priceOf(k, others) {
    var p = Number(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].price) || ({ mug: 29, blanket: 89, print: 89, ornament: 24 })[k];
    if (k === 'ornament' && cfg.ornamentBundle && others > 0) p = Math.max(0, p - 5);
    return p;
  }
  function fmt(p) { return '$' + (Math.round(p * 100) % 100 ? p.toFixed(2) : String(Math.round(p))); }
  function reviewGifts() { return cfg.artworkCandidates ? GIFTS.filter(function (k) { return k !== 'ornament'; }) : GIFTS; }
  function blanketPurchaseEnabled() { return !!(cfg.artworkCandidates && (cfg.blanketPurchase || cfg.corePurchase) && cfg.gifts && cfg.gifts.blanket && cfg.gifts.blanket.url); }
  function giftPurchasable(k) { return !!(cfg.artworkCandidates && cfg.gifts && cfg.gifts[k] && cfg.gifts[k].url && (cfg.corePurchase && ['mug', 'blanket', 'print'].indexOf(k) !== -1 || k === 'blanket' && blanketPurchaseEnabled())); }
  function selectedGifts() {
    var selected = reviewGifts().filter(function (k) { return S.sel[k]; });
    // A draft cannot complete the cart step used by the multi-gift queue.
    // Restored mixed selections display the purchasable blanket as the one choice.
    return blanketPurchaseEnabled() ? selected.indexOf('blanket') !== -1 ? ['blanket'] : selected.slice(0, 1) : selected;
  }
  function selectGift(k, forceOn) {
    var on = !!forceOn || selectedGifts().indexOf(k) === -1;
    if (blanketPurchaseEnabled()) S.sel = {};
    S.sel[k] = on;
  }
  function chooseModel() {
    var others = ['mug', 'blanket', 'print'].filter(function (k) { return S.sel[k]; }).length;
    var selected = selectedGifts(), count = selected.length;
    var total = selected.reduce(function (a, k) { return a + priceOf(k, others); }, 0);
    var missing = selected.filter(function (k) { return !(cfg.gifts && cfg.gifts[k] && cfg.gifts[k].url); });
    return { others: others, count: count, total: total, missing: missing };
  }
  function chooseView(n) {
    var pick = recGift(), c = chooseModel();
    var h = '<div class="hs3-top"><button type="button" class="hs3-quiet" data-hs3="toReveal">Back</button><span class="hs3-brand">Heartside</span><span class="hs3-spacer"></span></div>';
    h += '<h2 class="hs3-h2">' + esc(n.dog) + '\'s gifts for ' + esc(n.rec) + '</h2><p class="hs3-sub">' + (cfg.corePurchase ? 'Choose one gift to personalize. Your photo and answers carry over.' : blanketPurchaseEnabled() ? 'Choose one at a time: personalize your word-free blanket, or review a draft. Drafts cannot be ordered. Use Back to return after reviewing one.' : cfg.artworkCandidates ? 'Review the artwork drafts. The blanket stays word-free.' : 'Pick one or more. Your words go on each one.') + '</p>';
    h += '<div class="hs3-strip">' + img('Your dog', 'hs3-photo--strip') + '<div><div class="hs3-line hs3-ink">' + esc(lineFor('home') || lineFor('meaning') || '') + '</div><span class="hs3-sign">Love, ' + esc(n.dog) + '</span></div></div>';
    h += '<div class="hs3-opts">' + reviewGifts().map(function (k) {
      var on = selectedGifts().indexOf(k) !== -1;
      var desc = k === 'mug' && mugColor() ? '11 oz ceramic, ' + mugColor().name.toLowerCase() + ' inside' : k === 'ornament' ? (cfg.ornamentBundle ? 'For the tree. ' + fmt(priceOf('ornament', 1)) + ' with another gift' : 'Ceramic, for the tree') : DS[k];
      return '<button type="button" class="hs3-opt' + (on ? ' is-on' : '') + '" data-hs3="sel" data-v="' + k + '" aria-pressed="' + on + '"><span class="hs3-tick" aria-hidden="true">' + (on ? '✓' : '') + '</span><span class="hs3-opt__body"><span class="hs3-opt__name">' + esc(GN[k]) + (k === pick ? '<span class="hs3-opt__pick">BUDDY\'S PICK</span>' : '') + '</span><span class="hs3-small">' + esc(desc) + '</span></span><span class="hs3-opt__price">' + (cfg.artworkCandidates && !giftPurchasable(k) ? 'Draft' : fmt(priceOf(k, c.others))) + '</span></button>';
    }).join('') + '</div>';
    if (selectedGifts().indexOf('mug') !== -1) h += mugSwatches();
    h += '<div class="hs3-row hs3-ship"><span class="hs3-small">Ship to</span><button type="button" class="hs3-chip' + (S.shipTo === 'rec' ? ' is-on' : '') + '" data-hs3="ship" data-v="rec" aria-pressed="' + (S.shipTo === 'rec') + '">' + esc(n.rec) + '</button><button type="button" class="hs3-chip' + (S.shipTo === 'me' ? ' is-on' : '') + '" data-hs3="ship" data-v="me" aria-pressed="' + (S.shipTo === 'me') + '">Me</button></div>';
    // Publish an order-by date only after Printful confirms the current year's cutoff for
    // every selected variant and fulfillment route, including any gift bundle.
    h += '<div class="hs3-dock"><p class="hs3-small hs3-center hs3-promise">' + (blanketPurchaseEnabled() ? 'Delivery details appear on the product page.' : 'Free US shipping.') + ' A person checks every order before it prints.</p>';
    var label = c.count === 0 ? 'Pick a gift' : (c.count === 1 ? 'Personalize gift · ' + fmt(c.total) : 'Personalize ' + c.count + ' gifts · ' + fmt(c.total));
    if (cfg.artworkCandidates) label = c.count ? 'Review selected drafts' : 'Pick a draft';
    if (blanketPurchaseEnabled()) label = !c.count ? 'Pick a gift or draft' : giftPurchasable(selectedGifts()[0]) ? 'Personalize ' + {mug:'mug',blanket:'blanket',print:'portrait'}[selectedGifts()[0]] + ' · ' + fmt(priceOf(selectedGifts()[0], c.others)) : 'Review draft';
    h += '<button type="button" class="hs3-btn" data-hs3="add"' + (c.count === 0 || c.missing.length ? ' disabled' : '') + '>' + esc(label) + '</button>';
    if (c.missing.length) h += '<p class="hs3-small hs3-center" role="status">' + esc(c.missing.map(function (k) { return GN[k]; }).join(' and ')) + (c.missing.length > 1 ? ' are' : ' is') + ' not in the shop yet.</p>';
    h += '<button type="button" class="hs3-ghost" data-hs3="toShare">Save ' + esc(n.dog) + '\'s gift to your story</button></div>';
    return h;
  }
  function addToCart() {
    var c = chooseModel();
    if (!c.count || c.missing.length) return;
    shareWithBridge();
    // the mug opens on the color picked here; Teeinblue follows the variant in the link
    var mc = mugColor();
    var q = selectedGifts().map(function (k) {
      var u = cfg.gifts[k].url;
      if (cfg.artworkCandidates) {
        // Liquid already supplies ?view=gift. Replace it; duplicate view values
        // could otherwise send the draft journey back to the ordering template.
        var draftUrl = new URL(u, window.location.href);
        draftUrl.searchParams.set('view', giftPurchasable(k) ? {mug:'mug-native',blanket:'blanket-native',print:'portrait-native'}[k] : {mug:'mug-art-preview',blanket:'blanket-art-preview',print:'city-art-preview'}[k]);
        if (k === 'mug' && mc && mc.id) draftUrl.searchParams.set('variant', mc.id);
        u = draftUrl.pathname + draftUrl.search + draftUrl.hash;
      } else if (k === 'mug' && mc && mc.id) u += (u.indexOf('?') < 0 ? '?' : '&') + 'variant=' + mc.id;
      return { url: u, title: GN[k] };
    });
    try { if (q.length > 1) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); else window.sessionStorage.removeItem(QKEY); } catch (e) { /* private mode */ }
    track('personalize_gifts', { gifts: q.length, picks: selectedGifts().join(',') });
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
    if (S.step === 3 && S.fu) {
      var i = Number(String(id).slice(2)), ready = S.fu.lines && S.fu.lines[i];
      if (!ready) { followAnswer(label, true); return; }
      stepEvent('answered', { kind: 'chip', sub: 'follow', value: 'prepared' });
      S.typed.home_follow = label; S.follow = 'typed';
      S.ai.home_follow = { line: ready, reaction: (S.fu.replies && S.fu.replies[i]) || '' };
      ui.prefix = (S.fu.replies && S.fu.replies[i]) || '';
      S.fu = null; S.step = 4; save(); render(); stepEvent('shown');
      return;
    }
    if (S.step === 3 && (!S.home || S.home === 'skip')) {
      S.home = id; S.follow = null; save();
      ui.prefix = '';
      think(1300, function () { render(); stepEvent('shown', { sub: 'follow' }); });
      return;
    }
    if (S.step === 3) { S.follow = id; ui.prefix = REACT4[id] || ''; S.step = 4; save(); render(); stepEvent('shown'); return; }
    if (S.step === 4) { S.spot = id; ui.prefix = REACT5[id] || ''; S.step = 5; save(); render(); stepEvent('shown'); return; }
    if (S.step === 5) { S.together = id; ui.prefix = REACT6[id] || ''; S.step = 6; save(); render(); stepEvent('shown'); return; }
    if (S.step === 6) { S.meaning = id; ui.prefix = ''; save(); render(); warm(cfg.composeUrl); return; }
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
  // a typed answer: Buddy reacts, a line inks, and on the home question one follow-up
  function sendTyped(text) {
    text = String(text || '').trim();
    if (!text) return;
    ui.typing = false; ui.echo = text; ui.flagged = '';
    var key = ({ 3: 'home', 4: 'spot', 5: 'together', 6: 'meaning' })[S.step];
    if (S.step === 3 && S.fu) { followAnswer(text, false); return; }
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
      if (!String(S.dog).trim()) { focusField('hs3-dog'); return; }
      stepEvent('answered'); ui.echo = n.dog; ui.prefix = ''; S.step = 2; save(); render(); stepEvent('shown'); return;
    }
    if (S.step === 2) {
      if (!String(S.rec).trim()) { focusField('hs3-rec'); return; }
      stepEvent('answered'); ui.echo = n.rec; ui.prefix = ''; S.step = 3; save(); render(); stepEvent('shown'); return;
    }
    // the end of the chat: the reveal
    S.composed = null; S.baseLines = allLines(); S.composeBaseGift = null; S.appliedComposeKey = ''; S.noteTone = cfg.artworkCandidates && window.HSArtworkChoices ? window.HSArtworkChoices.read().tone : 'warm'; S.appliedTone = 'warm'; S.tabbed = false; save();
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
    heroMug();
    var b = frame.querySelector('[data-hs3-start]');
    if (b) b.addEventListener('click', function () {
      track('start', {});
      S.screen = 'chat'; if (S.step > 6 || S.step < 1) S.step = 1; ui.echo = ''; ui.prefix = ''; save(); render(); stepEvent('shown');
      warm(cfg.typedUrl);
      scrollTop();
    });
  }
  // the page is locked to one screen (fit), so going to the top is all a new screen needs
  function scrollTop() { try { window.scrollTo(0, 0); } catch (e) { /* old browser */ } }
  function bind() {
    frame.querySelectorAll('[data-hs3]').forEach(function (el) {
      el.addEventListener('click', function () { act(el.getAttribute('data-hs3'), el.getAttribute('data-v')); });
    });
    frame.querySelectorAll('[data-hs3-in]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-in');
      inp.addEventListener('input', function () {
        inp.classList.remove('is-need');
        if (k === 'typed') { clearTimeout(specTimer); specTimer = setTimeout(function () { speculate(inp.value); }, 600); }
        if (k === 'dog' || k === 'rec') { S[k] = inp.value.slice(0, 14); save(); }
        if (k === 'breed') { S.breed = inp.value.slice(0, 40); save(); }
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
      attachPhoto(f);
      file.value = ''; // Permit an explicit retry with the same file after storage failure.
      track('photo_attached', {});
      var lab = frame.querySelector('.hs3-photo-pick span'); if (lab) lab.textContent = 'Change photo';
      var later_ = frame.querySelector('.hs3-later'); if (later_) later_.remove();
    });
    frame.querySelectorAll('[data-hs3-edit]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs3-edit');
      inp.addEventListener('input', function () {
        S.edits[k] = inp.value.slice(0, maxFor(k)); save();
        var left = frame.querySelector('[data-hs3-left="' + k + '"]'); if (left) left.textContent = (maxFor(k) - inp.value.length) + ' characters left';
        var g = S.gift || recGift(), i = giftKeys(g).indexOf(k), l = frame.querySelectorAll('.hs3-stage .hs3-line')[i];
        if (l) l.textContent = g === 'mug' ? evenBreak(inp.value) : inp.value;
        if (g === 'mug') { clearTimeout(ui.paintT); ui.paintT = setTimeout(paintMugs, 120); }
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
    if (frame.querySelector('canvas[data-hs3-mug]')) paintMugs();
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
      case 'edit': ui.editing = !ui.editing; ui.editKey = giftKeys(S.gift || recGift())[0]; ui.revealN = 9; ui.mugSide = 'note'; ui.mugTurned = true; render(); if (ui.editing) { track('edit', {}); focusEdit(); } break;
      case 'editPrev': moveEdit(-1); break;
      case 'editNext': moveEdit(1); break;
      case 'updateTone': compose(S.noteTone, true); break;
      case 'turn': ui.mugTurned = true; turnMug(ui.mugSide === 'dog' ? 'note' : 'dog'); track('mug_turn', { side: ui.mugSide }); break;
      case 'them': var g = S.gift || recGift(); S.sel = S.sel || {}; selectGift(g, true); ui.editing = false; S.screen = 'choose'; save(); render(); scrollTop(); track('choose', { gift: g }); break;
      case 'toChat': clearTimers(); S.screen = 'chat'; save(); render(); break;
      case 'sel': selectGift(v); save(); render(); track('gift_pick', { gift: v, on: S.sel[v] ? 'yes' : 'no' }); break;
      case 'mugColor': setMugColor(v); break;
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
    if (cfg.artworkCandidates && window.HSArtworkChoices) S.noteTone = window.HSArtworkChoices.read().tone;
    if (S.composeRequest) save();
    var q = null;
    try { q = new URLSearchParams(window.location.search); } catch (e) { /* old browser */ }
    if (q && q.get('hs3') === 'reset') {
      S = fresh();
      try { window.sessionStorage.removeItem(HS2); window.sessionStorage.removeItem(QKEY); } catch (e) { /* private mode */ }
      idb('readwrite', function (st) { return st.delete(PHOTO); }).catch(function () {});
      save();
    }
    if (S.screen === 'reveal') ui.revealN = 9;
    if (S.screen === 'chat' && S.step === 3 && S.fu && !S.fu.chips.length) ui.typing = true;
    if (S.screen === 'chat') warm(cfg.typedUrl);
    render();
    restorePhoto().then(function () { if (S.screen !== 'hero') render(); });
    var refit = function () { clearTimeout(fit.t); fit.t = setTimeout(fit, 80); };
    window.addEventListener('resize', refit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
    window.addEventListener('load', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    document.addEventListener('focusout', function () { setTimeout(fit, 150); });
    frame.addEventListener('load', refit, true); // images that arrive after the first fit
    // hs2.js moves the section under Helio's header after this runs; follow the frame's top
    if (window.ResizeObserver) new ResizeObserver(refit).observe(root.parentNode || root);
    [300, 1200].forEach(function (t) { setTimeout(fit, t); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // for tools/preview tests
  window.__hs3api = { state: function () { return S; }, lineFor: lineFor, recGift: recGift, typedAnswer: typedAnswer, names: names, evenBreak: evenBreak, noteWidth: noteWidth, chipStyle: chipStyle, mug: { MUG: MUG, drawNote: drawNote, drawDog: drawDog, wrapOnto: wrapOnto, loadMugAssets: loadMugAssets, renderFace: renderFace, mugColors: mugColors, mugColor: mugColor } };
})();
