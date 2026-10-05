/* Heartside v2 behaviour. Loaded (deferred) by snippets/hs2-head.liquid.
   One shared review state drives every section: the dog's name typed in the hero
   rewrites the whole page, the HR-26 answers drive the live poster, the evidence
   photos, the story cards and the links to product pages. State lives in
   sessionStorage (key "hs2-review") so it survives page changes in the same visit.
   The headshot a shopper attaches stays on their device (IndexedDB) until they
   hand it to the personalizer on a product page. */
(function () {
  'use strict';
  if (window.__hs2) return;
  window.__hs2 = true;

  var KEY = 'hs2-review';
  var ANSWERS = ['dog', 'person', 'cupboard', 'improvement', 'incident', 'enemy'];
  var DEFAULTS = { dog: 'Biscuit', person: 'Sarah', cupboard: '1,412', improvement: 'Leaving', incident: 'The sock', enemy: 'The mailman', voice: false, leak: 'rating' };
  var LEAKS = ['rating', 'incident', 'threat', 'memo'];
  var state = load();
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|Bytedance|Snapchat|Pinterest/i.test(navigator.userAgent || '');
  document.documentElement.classList.add('hs2-js');
  if (inApp) document.documentElement.classList.add('hs2-inapp');
  var photoURL = null; // the shopper's headshot, as an object URL, once attached or restored

  function load() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    // answers carried in the URL (from the homepage or a shared link) win over storage
    try {
      var q = new URLSearchParams(window.location.search);
      ANSWERS.forEach(function (k) { if (q.get(k)) s[k] = q.get(k).slice(0, 40); });
      if (q.get('video') === '1') s.voice = true;
    } catch (e) { /* old browser */ }
    return s;
  }
  function save() { try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
  function val(k) {
    var v = state[k];
    if (k === 'voice') return !!v;
    v = (v == null ? '' : String(v)).trim();
    return v || DEFAULTS[k];
  }
  /* What the shopper actually gave us. The names have no default: "Biscuit" and "Sarah"
     only fill the page until they type. They never go into a link, an order or the
     personalizer, or the poster would print a stranger's name. The treat count and the
     chips keep their defaults, because those print sensibly as they are. */
  var NAMES = ['dog', 'person'];
  function answer(k) {
    var v = (state[k] == null ? '' : String(state[k])).trim();
    return v || (NAMES.indexOf(k) === -1 ? DEFAULTS[k] : '');
  }
  function missingNames() { return NAMES.filter(function (k) { return !answer(k); }); }
  function engaged() { return !!(answer('dog') || answer('person')); }
  function possessive(n) { return /s$/i.test(n) ? n + "'" : n + "'s"; }
  function json(sel) {
    var el = document.querySelector(sel);
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }
  function lines(kind) { return json('script[data-hs2-lines="' + kind + '"]'); }
  function photos() { return json('script[data-hs2-photos]'); }
  function status(el, text) { if (el) el.textContent = text; }

  /* ------------------------------------------------------------------ render */
  function render() {
    var dog = val('dog'), person = val('person');
    var map = {
      dog: dog, DOG: dog.toUpperCase(), dogs: possessive(dog), person: person, cupboard: val('cupboard'),
      improvement: val('improvement'), incident: val('incident'), enemy: val('enemy'),
      improvementLine: lines('improvement')[val('improvement')] || '',
      incidentLine: lines('incident')[val('incident')] || '',
      enemyLine: lines('enemy')[val('enemy')] || ''
    };
    document.querySelectorAll('[data-hs2]').forEach(function (el) {
      var k = el.getAttribute('data-hs2');
      if (k in map && map[k] !== '' && el.textContent !== map[k]) el.textContent = map[k];
    });
    document.querySelectorAll('[data-hs2-chip]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-value') === val(b.getAttribute('data-hs2-chip')) ? 'true' : 'false');
    });
    var offer = offerLabel();
    document.querySelectorAll('[data-hs2-voice]').forEach(function (b) {
      var on = val('voice');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-offer', !!offer);
      b.textContent = on
        ? 'Added: ' + dog + ' reads it out loud (15s video, emailed) · ' + (offer || '+$12')
        : '+ Hear ' + dog + ' read it out loud · 15s video · ' + (offer || '$12');
    });
    // links to product pages carry the answers
    document.querySelectorAll('[data-hs2-carry]').forEach(function (a) {
      var base = a.getAttribute('data-hs2-base') || a.getAttribute('href');
      if (!a.getAttribute('data-hs2-base')) a.setAttribute('data-hs2-base', base);
      if (!base || base.charAt(0) === '#') return;
      a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?' : '&') + answerParams().toString());
    });
    // hidden line-item properties on product forms
    document.querySelectorAll('[data-hs2-prop]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-prop');
      inp.value = k === 'voice' ? (val('voice') ? 'Yes' : '') : answer(k);
    });
    document.querySelectorAll('[data-hs2-input]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-input');
      if (state[k] != null && inp !== document.activeElement && inp.value !== String(state[k])) inp.value = state[k];
    });
    document.querySelectorAll('[data-hs2-names-nudge]').forEach(function (n) { if (!n.hidden && !missingNames().length) n.hidden = true; });
    var answers = document.querySelector('[data-hs2-answers]');
    if (answers && engaged()) answers.hidden = false;
    bridgeSoon();
    exhibits();
    leakUI();
    drawSoon();
  }
  function answerParams() {
    var p = new URLSearchParams();
    ANSWERS.forEach(function (k) { var v = answer(k); if (v) p.set(k, v); });
    if (val('voice')) p.set('video', '1');
    return p;
  }

  function bindInputs() {
    document.querySelectorAll('[data-hs2-input]').forEach(function (inp) {
      if (inp.__hs2) return; inp.__hs2 = true;
      var k = inp.getAttribute('data-hs2-input');
      if (state[k]) inp.value = state[k];
      inp.addEventListener('input', function () {
        state[k] = inp.value; save(); render();
        if (k === 'dog') inkName();
        if (!bindInputs.sent && k === 'dog' && inp.value.length > 1) { bindInputs.sent = true; track('name_entered'); }
      });
    });
    document.querySelectorAll('[data-hs2-chip]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        var kind = b.getAttribute('data-hs2-chip');
        state[kind] = b.getAttribute('data-value'); save(); render();
        flashExhibit(kind);
        b.classList.remove('is-picked'); void b.offsetWidth; b.classList.add('is-picked');
        var prints = b.closest('.hs2-step') && b.closest('.hs2-step').querySelector('.hs2-step__prints');
        if (prints) { prints.classList.remove('is-new'); void prints.offsetWidth; prints.classList.add('is-new'); }
        // the first pick on each question moves on by itself, unless the shopper moves first
        var own = b.closest('[data-hs2-step]'), from = own ? Number(own.getAttribute('data-hs2-step')) : 0;
        if (steps.go && from && !steps.auto[kind]) {
          steps.auto[kind] = true;
          clearTimeout(steps.timer);
          steps.timer = setTimeout(function () { if (steps.at === from) steps.go(from + 1); }, 700);
        }
      });
    });
    document.querySelectorAll('[data-hs2-voice]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { state.voice = !val('voice'); save(); render(); });
    });
    document.querySelectorAll('[data-hs2-photo-in]').forEach(function (inp) {
      if (inp.__hs2) return; inp.__hs2 = true;
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        if (!f || !/^image\//.test(f.type)) return;
        usePhoto(f);
        savePhoto(f);
        var lab = inp.closest('.hs2-attach');
        if (lab) lab.classList.add('is-done');
        track('photo_attached');
      });
    });
    document.querySelectorAll('[data-hs2-story]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function (e) { e.preventDefault(); stopLeakAuto(); downloadCard(); track('story_card', { card: val('leak') }); });
    });
    document.querySelectorAll('[data-hs2-leak]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); setLeak(b.getAttribute('data-hs2-leak')); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        stopLeakAuto();
        stepLeak(d);
        var on = document.querySelector('[data-hs2-leak="' + val('leak') + '"]');
        if (on) on.focus();
      });
    });
    document.querySelectorAll('[data-hs2-leak-step]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); stepLeak(Number(b.getAttribute('data-hs2-leak-step'))); });
    });
    document.querySelectorAll('[data-hs2-caption]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        stopLeakAuto(); track('caption_copied', { card: val('leak') });
        copy(caption()).then(function (ok) {
          status(document.querySelector('[data-hs2-story-status]'), ok ? 'Caption copied. Paste it under the card.' : caption());
        });
      });
    });
    document.querySelectorAll('[data-hs2-link]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); track('link_shared', { card: val('leak') }); sendLink(); });
    });
  }

  /* ------------------------------------------------------- the shopper's photo */
  var DB = 'hs2', STORE = 'files', PHOTO = 'headshot', PHOTO_DAYS = 3;
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
    idb('readwrite', function (st) { return st.put({ file: file, t: Date.now() }, PHOTO); }).catch(function () {});
  }
  function restorePhoto() {
    return idb('readonly', function (st) { return st.get(PHOTO); }).then(function (rec) {
      if (!rec || !rec.file || Date.now() - rec.t > PHOTO_DAYS * 864e5) return null;
      return rec.file;
    }).catch(function () { return null; });
  }
  function usePhoto(file) {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(file);
    usePhoto.file = file;
    document.querySelectorAll('[data-hs2-photo]').forEach(function (img) { img.src = photoURL; img.removeAttribute('srcset'); });
    leakUI();
    drawSoon();
    handoff();
  }

  /* ------------------------------------------------- evidence under the poster */
  var EXHIBIT = {
    improvement: { 'Leaving': 'bed', 'The vacuum': 'vacuum', 'Bath time': 'bed', 'Sharing food': 'team-01', 'Your phone': 'asleep' },
    incident: { 'The sandwich': 'team-01', _: 'incident' },
    enemy: { 'The vacuum': 'vacuum', _: 'window' }
  };
  var ALT = {
    bed: 'a dachshund across the middle of the bed', vacuum: 'a dachshund squaring up to the vacuum', 'team-01': 'a pug with its head tilted',
    asleep: 'a spaniel asleep on the laptop', incident: 'a dachshund holding a sock, unrepentant', window: 'a terrier at the window, watching the delivery driver'
  };
  var FOCUS = { manager: [0.5, 0.26], headshot: [0.5, 0.5], bed: [0.6, 0.6], window: [0.5, 0.35], vacuum: [0.35, 0.5], incident: [0.5, 0.45], 'team-01': [0.5, 0.4], asleep: [0.55, 0.5], memo: [0.55, 0.5] };
  function exhibitKey(kind) { var m = EXHIBIT[kind] || {}; return m[val(kind)] || m._ || null; }
  function exhibits() {
    var urls = photos();
    document.querySelectorAll('[data-hs2-exhibit]').forEach(function (fig) {
      var key = exhibitKey(fig.getAttribute('data-hs2-exhibit'));
      var img = fig.querySelector('img');
      if (!key || !img || !urls[key] || img.getAttribute('data-key') === key) return;
      img.setAttribute('data-key', key);
      img.src = urls[key];
      img.alt = 'Evidence: ' + ALT[key];
      var f = FOCUS[key] || [0.5, 0.5];
      img.style.objectPosition = (f[0] * 100) + '% ' + (f[1] * 100) + '%';
    });
  }
  function flashExhibit(kind) {
    var img = document.querySelector('[data-hs2-exhibit="' + kind + '"] img');
    if (!img) return;
    img.classList.add('is-swapping');
    setTimeout(function () { img.classList.remove('is-swapping'); }, 180);
  }

  /* ----------------------------------------------- the free story cards (1080 x 1920) */
  var W = 1080, H = 1920, P = 86;
  var MONO = '"HS Courier Prime", "Courier Prime", "Courier New", monospace';
  var SERIF = '"HS Fraunces", "Fraunces", Georgia, serif';
  var C = { ink: '#121010', paper: '#FFFDF9', stamp: '#A8284E', night: '#1E1714', cream: '#FBF6F1', blush: '#F0C0C0', chestnut: '#8A4A2B' };
  var imgCache = {};
  var fontsReady = false;

  function picture(url) {
    if (!url) return null;
    if (imgCache[url]) return imgCache[url].complete && imgCache[url].naturalWidth ? imgCache[url] : null;
    var im = new Image();
    if (!/^blob:/.test(url)) im.crossOrigin = 'anonymous';
    im.onload = drawSoon;
    im.src = url;
    imgCache[url] = im;
    return null;
  }
  function cardPhoto(type) {
    if (photoURL) return { url: photoURL, focus: [0.5, 0.42] };
    var urls = photos(), key;
    if (type === 'rating') key = 'manager';
    else if (type === 'incident') key = exhibitKey('incident');
    else if (type === 'threat') key = exhibitKey('enemy');
    else key = 'memo';
    var url = urls[key + '-lg'] || urls[key];
    return { url: url, focus: FOCUS[key] || [0.5, 0.5] };
  }
  function wrap(ctx, text, maxW) {
    var words = String(text).split(' '), out = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else { line = t; }
    });
    if (line) out.push(line);
    return out;
  }
  function fit(ctx, text, font, size, min, maxW, maxLines) {
    var l;
    for (; size >= min; size -= 4) {
      ctx.font = font.replace('%', size);
      l = wrap(ctx, text, maxW);
      if (l.length <= maxLines && l.every(function (x) { return ctx.measureText(x).width <= maxW; })) return { size: size, lines: l };
    }
    ctx.font = font.replace('%', min);
    return { size: min, lines: wrap(ctx, text, maxW) };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function cover(ctx, im, x, y, w, h, focus, r) {
    ctx.save();
    rr(ctx, x, y, w, h, r); ctx.clip();
    if (!im) { ctx.fillStyle = 'rgba(138, 74, 43, 0.15)'; ctx.fillRect(x, y, w, h); ctx.restore(); return; }
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    var dx = x - (dw - w) * focus[0], dy = y - (dh - h) * focus[1];
    ctx.drawImage(im, dx, dy, dw, dh);
    ctx.restore();
  }
  function star(ctx, cx, cy, R, filled, color) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * 0.42 : R;
      ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    if (filled) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.stroke(); }
  }
  function stamp(ctx, text, cx, cy, size, deg, color, fill) {
    ctx.save();
    ctx.font = '700 ' + size + 'px ' + MONO;
    var tw = ctx.measureText(text).width, bw = tw + size * 1.1, bh = size * 1.75;
    ctx.translate(cx, cy); ctx.rotate(deg * Math.PI / 180);
    rr(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.38);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = size * 0.19; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, size * 0.04);
    ctx.restore();
  }
  function paw(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.fillStyle = color;
    [[6.2, 9.2], [10, 5.8], [14.4, 5.8], [18.2, 9.2]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0], p[1], 2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fill(new Path2D('M12.2 10.6c-3.2 0-6 3.6-6 6.2 0 1.8 1.4 2.6 3 2.6 1.3 0 2-.6 3-.6s1.7.6 3 .6c1.6 0 3-.8 3-2.6 0-2.6-2.8-6.2-6-6.2z'));
    ctx.restore();
  }
  function label(ctx, text, x, y, color) {
    ctx.font = '700 40px ' + MONO;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  function drawCard(canvas, type) {
    var x = canvas.getContext('2d');
    var dog = val('dog'), person = val('person'), maxW = W - P * 2;
    var dark = type === 'memo';
    var ink = dark ? C.cream : C.ink;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = dark ? C.night : C.paper; x.fillRect(0, 0, W, H);

    var top = { rating: 'LEAKED · HR-26', incident: 'LEAKED · INCIDENT REPORT', threat: 'LEAKED · THREAT ASSESSMENT', memo: 'LEAKED · FROM MANAGEMENT' }[type];
    label(x, top, P, P, dark ? C.blush : C.ink);

    var ph = cardPhoto(type), photoH = dark ? 640 : 760, photoY = P + 84;
    cover(x, picture(ph.url), P, photoY, maxW, photoH, ph.focus, 34);

    // bottom lines
    x.fillStyle = ink;
    x.font = '700 44px ' + MONO;
    var domainY = H - P - 44;
    x.fillText('heartside.io', P, domainY);
    var y = photoY + photoH + 64;

    if (dark) {
      x.font = '400 50px ' + MONO; x.fillStyle = C.cream;
      wrap(x, 'To ' + person + '.', maxW).forEach(function (l) { x.fillText(l, P, y); y += 64; });
      y += 22;
      var t = fit(x, 'You also came back. Every single time. I noticed.', '600 %px ' + SERIF, 96, 60, maxW, 5);
      x.fillStyle = C.cream;
      t.lines.forEach(function (l) { x.fillText(l, P, y); y += t.size * 1.06; });
      y += 40;
      x.font = '400 50px ' + MONO; x.fillStyle = C.blush;
      x.fillText('Keep me close.', P, y); y += 66;
      x.fillText(dog, P, y);
      paw(x, P + Math.min(x.measureText(dog).width, maxW - 80) + 26, y - 6, 60, C.blush);
      x.font = '400 46px ' + MONO; x.fillStyle = C.cream;
      x.fillText("Who is your dog's person?", P, domainY - 64);
      return;
    }

    stamp(x, 'CONFIDENTIAL', W - P - 210, photoY + photoH - 26, 50, -12, C.stamp, 'rgba(255, 253, 249, 0.92)');
    x.fillStyle = ink;
    x.font = '400 46px ' + MONO;
    wrap(x, dog + ' has reviewed ' + person + '.', maxW).slice(0, 2).forEach(function (l) { x.fillText(l, P, y); y += 60; });
    y += 26;
    if (type === 'rating') {
      var big = fit(x, 'Leaving the house:', '700 %px ' + SERIF, 136, 96, maxW, 2);
      x.fillStyle = ink;
      big.lines.forEach(function (l) { x.fillText(l, P, y); y += big.size; });
      y += 30;
      for (var i = 0; i < 5; i++) star(x, P + 54 + i * 128, y + 54, 54, i === 0, C.stamp);
    } else {
      x.fillStyle = C.stamp;
      label(x, type === 'incident' ? 'INCIDENT REPORT' : 'THREAT ASSESSMENT', P, y, C.stamp);
      y += 66;
      var line = type === 'incident' ? lines('incident')[val('incident')] : lines('enemy')[val('enemy')];
      var room = domainY - 110 - y; // keep clear of "Who is your dog's person?"
      var maxLines = Math.max(2, Math.floor(room / 100));
      var body = fit(x, line || '', '600 %px ' + SERIF, 92, 56, maxW, maxLines);
      x.fillStyle = ink;
      body.lines.forEach(function (l) { x.fillText(l, P, y); y += body.size * 1.08; });
    }
    x.fillStyle = ink;
    x.font = '400 46px ' + MONO;
    x.fillText("Who is your dog's person?", P, domainY - 64);
  }

  var drawQueued = false;
  function drawSoon() {
    if (drawQueued) return;
    drawQueued = true;
    (window.requestAnimationFrame || setTimeout)(function () { drawQueued = false; drawPreview(); });
  }
  function drawPreview() {
    var canvas = document.querySelector('[data-hs2-story-canvas]');
    if (!canvas || !canvas.getContext) return;
    drawCard(canvas, val('leak'));
    var still = document.querySelector('[data-hs2-story-static]');
    if (still) still.hidden = true;
    canvas.hidden = false;
    canvas.setAttribute('aria-label', 'Story card preview: ' + caption());
    if (!fontsReady && document.fonts) {
      fontsReady = true;
      Promise.all([
        document.fonts.load('700 40px "HS Courier Prime"'), document.fonts.load('400 40px "HS Courier Prime"'),
        document.fonts.load('700 120px "HS Fraunces"'), document.fonts.load('600 120px "HS Fraunces"')
      ]).then(drawSoon, function () {});
    }
  }
  function leakUI() {
    var leak = val('leak'), i = LEAKS.indexOf(leak);
    document.querySelectorAll('[data-hs2-leak]').forEach(function (b) {
      var on = b.getAttribute('data-hs2-leak') === leak;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.hs2-phone__bars i').forEach(function (bar, n) { bar.classList.toggle('is-done', n < i); bar.classList.toggle('is-on', n === i); });
    document.querySelectorAll('[data-hs2-nudge]').forEach(function (n) { n.hidden = !!photoURL; });
  }
  function setLeak(type) {
    if (LEAKS.indexOf(type) === -1) return;
    state.leak = type; save(); leakUI(); drawSoon();
    var cv = document.querySelector('[data-hs2-story-canvas]');
    if (cv && !reduced) { cv.classList.add('is-swapping'); setTimeout(function () { cv.classList.remove('is-swapping'); }, 160); }
    status(document.querySelector('[data-hs2-story-status]'), '');
  }
  function stepLeak(d) { setLeak(LEAKS[(LEAKS.indexOf(val('leak')) + d + LEAKS.length) % LEAKS.length]); }

  function caption() {
    var dog = val('dog'), person = val('person'), t = val('leak');
    if (t === 'incident') return dog + ' has reviewed ' + person + '. Incident report: ' + (lines('incident')[val('incident')] || '') + ' heartside.io';
    if (t === 'threat') return dog + ' has reviewed ' + person + '. Threat assessment: ' + (lines('enemy')[val('enemy')] || '') + ' heartside.io';
    if (t === 'memo') return 'To ' + person + '. You also came back. Every single time. I noticed. Keep me close. ' + dog + ' heartside.io';
    return dog + ' has reviewed ' + person + '. Leaving the house: ★☆☆☆☆ Who is your dog\'s person? heartside.io';
  }
  function shareURL() {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    var p = answerParams();
    p.delete('video');
    p.set('utm_source', 'leak'); p.set('utm_medium', 'share'); p.set('utm_campaign', val('leak'));
    return window.location.origin + root + '?' + p.toString();
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    t.remove();
    return ok;
  }
  function sendLink() {
    var url = shareURL(), msg = document.querySelector('[data-hs2-story-status]');
    var dogs = possessive(val('dog'));
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ title: dogs + ' annual review', text: caption(), url: url }).catch(function () {});
      return;
    }
    copy(url).then(function (ok) { status(msg, ok ? 'Link copied. It opens on ' + dogs + ' review.' : url); });
  }
  function downloadCard() {
    var msg = document.querySelector('[data-hs2-story-status]');
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('700 40px "HS Courier Prime"'), document.fonts.load('400 40px "HS Courier Prime"'),
      document.fonts.load('700 120px "HS Fraunces"'), document.fonts.load('600 120px "HS Fraunces"')
    ]) : Promise.resolve();
    var ph = cardPhoto(val('leak'));
    var ready = new Promise(function (resolve) {
      var im = imgCache[ph.url];
      if (!ph.url || (im && im.complete)) { resolve(); return; }
      picture(ph.url);
      im = imgCache[ph.url];
      im.addEventListener('load', resolve); im.addEventListener('error', resolve);
      setTimeout(resolve, 4000);
    });
    Promise.all([fonts, ready]).then(function () {
      drawCard(c, val('leak'));
      var name = val('dog').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + val('leak') + '.png';
      try {
        c.toBlob(function (blob) {
          if (!blob) { status(msg, 'This browser could not make the card. A screenshot of it works too.'); return; }
          if (inApp) { showCard(c.toDataURL('image/png')); return; }
          var file = new File([blob], name, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            navigator.share({ files: [file], text: caption() }).catch(function () {});
            return;
          }
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          status(msg, 'Saved. Post it, tag the person.');
        }, 'image/png');
      } catch (e) {
        status(msg, 'This browser could not make the card. A screenshot of it works too.');
      }
    });
  }

  /* ------------------------------------------------------ sticky "Read review" pill */
  function sticky() {
    var bar = document.querySelector('[data-hs2-sticky]');
    if (!bar || bar.__hs2 || !('IntersectionObserver' in window)) return; bar.__hs2 = true;
    var watch = [document.querySelector('[data-hs2-hero]'), document.querySelector('#review'), document.querySelector('.hs2-faq__close'), document.querySelector('.hs2-signoff'), document.querySelector('#buy'), document.querySelector('footer')].filter(Boolean);
    var seen = new Map();
    var link = bar.querySelector('a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen.set(e.target, e.isIntersecting); });
      var on = watch.length > 0 && watch.every(function (t) { return !seen.get(t); });
      bar.classList.toggle('is-on', on);
      if (link) link.tabIndex = on ? 0 : -1;
    });
    watch.forEach(function (t) { seen.set(t, true); io.observe(t); });
  }

  /* ---------------------------------------------------------- product gallery */
  function gallery() {
    document.querySelectorAll('[data-hs2-thumb]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        var main = document.querySelector('[data-hs2-main]');
        if (!main) return;
        main.src = b.getAttribute('data-hs2-thumb'); main.removeAttribute('srcset');
        main.alt = b.getAttribute('data-alt') || '';
        document.querySelectorAll('[data-hs2-thumb]').forEach(function (o) { o.setAttribute('aria-current', o === b ? 'true' : 'false'); });
      });
    });
    var sel = document.querySelector('[data-hs2-variant]');
    if (sel && !sel.__hs2) {
      sel.__hs2 = true;
      sel.addEventListener('change', function () {
        var opt = sel.options[sel.selectedIndex];
        var price = document.querySelector('[data-hs2-price]');
        if (price && opt.getAttribute('data-price')) price.textContent = opt.getAttribute('data-price');
        var btn = document.querySelector('[data-hs2-add]');
        if (btn) btn.disabled = opt.getAttribute('data-available') !== 'true';
      });
    }
    // With Teeinblue's picker in charge, follow the variant it puts in the URL, so the one
    // price on the page (ours, Teeinblue's is off) and the form's variant stay with it
    var buy = document.getElementById('buy');
    if (buy && buy.classList.contains('hs2-product--tib') && !buy.__hs2v) {
      buy.__hs2v = true;
      var follow = function () {
        var id = new URLSearchParams(window.location.search).get('variant');
        var prices = json('script[data-hs2-prices]'), price = document.querySelector('[data-hs2-price]');
        if (!id || !(id in prices)) return;
        if (price && price.textContent !== prices[id]) price.textContent = prices[id];
        var idIn = buy.querySelector('[data-hs2-variant-id]');
        if (idIn) idIn.value = id;
      };
      buy.addEventListener('change', function (e) {
        if (!e.target.closest || !e.target.closest('.tee-variants')) return;
        setTimeout(follow, 80); setTimeout(follow, 500);
      });
      document.addEventListener('teeinblue-event-variant-changed', function () { setTimeout(follow, 80); });
    }
  }

  /* ------------------------------------------------------------ Teeinblue bridge
     Copies the homepage answers into Teeinblue's personalizer, so nobody types twice.
     It reads each Teeinblue field's heading (the labels in docs/TEEINBLUE-SETUP.md),
     sets the value the way typing does, and checks Teeinblue's own record
     (window.teeinblue.getCurrentCustomization). If a value didn't take, it writes
     Teeinblue's saved customization and asks it to refill (refillCustomizationData).
     It never touches a field the shopper has edited, and it copies their edits back
     into the order's hidden answers. Tested against Teeinblue's storefront code on
     its demo store, 4 October 2026. */
  var TIB_RULES = [
    { k: 'dog', re: /manager|dog'?s name|pet'?s name|name of (your|the) (dog|pet)|reviewer/i },
    { k: 'person', re: /employee|your name|person'?s name|owner|human/i },
    { k: 'cupboard', re: /cupboard|treat/i },
    { k: 'improvement', re: /improvement/i, choice: true },
    { k: 'incident', re: /incident/i, choice: true },
    { k: 'enemy', re: /enemy|threat/i, choice: true }
  ];
  var bridge = { owned: {}, filled: 0, refilled: false, announced: false };
  function norm(t) { return String(t || '').replace(/[\s*:]+/g, ' ').replace(/[’‘]/g, "'").trim().toLowerCase(); }
  function tibFields() {
    return Array.prototype.slice.call(document.querySelectorAll('.tee-field')).filter(function (f) {
      return !/tee-field--photo|tee-field--template/.test(f.className);
    }).map(function (f) {
      var h = f.querySelector('.tee-field__heading span, .tee-field__heading, label');
      var heading = h ? h.textContent : '';
      var rule = null;
      for (var i = 0; i < TIB_RULES.length; i++) { if (TIB_RULES[i].re.test(heading)) { rule = TIB_RULES[i]; break; } }
      return { el: f, heading: heading, rule: rule };
    }).filter(function (x) { return x.rule; });
  }
  function setValue(inp, v) {
    var proto = inp.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : inp.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(inp, v); else inp.value = v;
    inp.__hs2set = true;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.__hs2set = false;
  }
  function choiceMatches(text, k) {
    var t = norm(text), label = norm(val(k)), line = norm(lines(k)[val(k)]);
    return !!t && (t === label || t === line || t.indexOf(label + ' ') === 0 || (line && t.indexOf(line) === 0));
  }
  function tibCurrent() {
    try { return (window.teeinblue && window.teeinblue.getCurrentCustomization && window.teeinblue.getCurrentCustomization()) || null; } catch (e) { return null; }
  }
  function fillField(f, fresh) {
    var k = f.rule.k, el = f.el;
    var text = el.querySelector('input[type="text"], input:not([type]), textarea');
    var select = el.querySelector('select');
    if (text) {
      var name = text.name || text.id;
      watchField(text, k);
      if (bridge.owned[name]) return null;
      var want = answer(k);
      if (!want) return null; // no name yet: leave the field for the shopper, never a placeholder
      if (text.value === want) return { name: name, value: want };
      if (text.value && !fresh) return null; // keep what Teeinblue restored from an earlier visit
      setValue(text, want);
      return { name: name, value: want, changed: true };
    }
    if (select) {
      watchField(select, k);
      if (bridge.owned[select.name]) return null;
      var opt = Array.prototype.slice.call(select.options).filter(function (o) { return !o.disabled && choiceMatches(o.textContent, k); })[0];
      if (!opt) return null;
      if (select.value === opt.value) return { name: select.name, value: opt.value };
      setValue(select, opt.value);
      return { name: select.name, value: opt.value, changed: true };
    }
    // radio buttons or swatch buttons
    var radios = Array.prototype.slice.call(el.querySelectorAll('input[type="radio"]'));
    for (var i = 0; i < radios.length; i++) {
      var lab = (radios[i].labels && radios[i].labels[0] && radios[i].labels[0].textContent) || radios[i].value;
      if (choiceMatches(lab, k)) {
        if (radios[i].checked) return { name: radios[i].name, value: radios[i].value };
        radios[i].click();
        return { name: radios[i].name, value: radios[i].value, changed: true };
      }
    }
    var buttons = Array.prototype.slice.call(el.querySelectorAll('button, [role="radio"], [role="option"], .tee-option'));
    for (var j = 0; j < buttons.length; j++) {
      if (choiceMatches(buttons[j].textContent, k)) {
        if (/active|selected|checked/.test(buttons[j].className) || buttons[j].getAttribute('aria-checked') === 'true') return { name: k, value: val(k) };
        buttons[j].click();
        return { name: k, value: val(k), changed: true };
      }
    }
    return null;
  }
  // answers typed on the same page (the ad landing page) reach the personalizer too
  function bridgeSoon() {
    if (!document.querySelector('.tee-field')) return;
    clearTimeout(bridgeSoon.t);
    bridgeSoon.t = setTimeout(function () { runBridge(); }, 400);
  }
  function watchField(inp, k) {
    if (inp.__hs2watch) return; inp.__hs2watch = true;
    var handler = function () {
      if (inp.__hs2set) return;
      bridge.owned[inp.name || inp.id] = true;
      // carry the shopper's edit back to the order's hidden answers
      if (inp.tagName === 'SELECT') {
        var o = inp.options[inp.selectedIndex], all = lines(k);
        Object.keys(all).forEach(function (label) { if (o && (norm(o.textContent) === norm(label) || norm(o.textContent) === norm(all[label]))) state[k] = label; });
      } else {
        state[k] = inp.value;
      }
      save(); render();
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  }
  function productId() {
    var c = window.teeinblueCampaign, m = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
    return (c && c.productId) || (m && m.product && m.product.id) || null;
  }
  function refill(wanted) {
    var pid = productId(), api = window.teeinblue;
    if (!pid || !api || !api.refillCustomizationData || bridge.refilled) return;
    bridge.refilled = true;
    try {
      var keyName = 'teeinblue-customizations';
      var list = JSON.parse(window.localStorage.getItem(keyName) || '[]');
      if (!Array.isArray(list)) list = [];
      var mine = list.filter(function (x) { return String(x.productId) === String(pid); })[0];
      var data = Object.assign({}, (mine && mine.customization) || {}, tibCurrent() || {});
      wanted.forEach(function (w) { data[w.name] = w.value; });
      list = list.filter(function (x) { return String(x.productId) !== String(pid); });
      list.push({ productId: String(pid), customization: data, timestamp: Date.now() });
      window.localStorage.setItem(keyName, JSON.stringify(list.slice(-10)));
      api.refillCustomizationData(pid);
    } catch (e) { /* Teeinblue changed; the shopper still sees the answers card */ }
  }
  function runBridge() {
    if (!engaged()) return;
    var fields = tibFields();
    if (!fields.length) return;
    var pid = productId() || location.pathname;
    var fp = JSON.stringify(ANSWERS.map(answer));
    var seenKey = 'hs2-tib-' + pid, fresh = true;
    try { fresh = window.sessionStorage.getItem(seenKey) !== fp; } catch (e) { fresh = true; }
    var wanted = [];
    fields.forEach(function (f) { var r = fillField(f, fresh); if (r) wanted.push(r); });
    if (!wanted.some(function (w) { return w.changed; })) return; // nothing new to copy
    try { window.sessionStorage.setItem(seenKey, fp); } catch (e) { /* private mode */ }
    bridge.filled = wanted.length;
    setTimeout(function () {
      var cur = tibCurrent();
      if (cur) {
        var missed = wanted.filter(function (w) { return w.name in cur && String(cur[w.name]) !== String(w.value); });
        if (missed.length) refill(wanted);
      }
      bridgeStatus();
    }, 400);
  }
  function bridgeStatus() {
    var st = document.querySelector('[data-hs2-bridge-status]');
    if (!st || !bridge.filled || bridge.announced) return;
    bridge.announced = true;
    st.textContent = 'Copied into the personalizer below. Change anything you like there.';
    st.hidden = false;
    var note = document.querySelector('[data-hs2-bridge-note]');
    if (note) note.hidden = true;
  }
  function tibGallery() {
    var box = document.querySelector('[data-hs2-tib-gallery]'), media = document.querySelector('[data-hs2-media]');
    if (box && media) media.setAttribute('data-tib', box.children.length ? 'on' : 'off');
  }
  /* The headshot: one tap hands the homepage photo to Teeinblue's own upload, which
     opens its cropper. It needs the tap, so nothing uploads without the shopper. */
  function photoInput() { return document.querySelector('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]'); }
  function handoff() {
    var box = document.querySelector('[data-hs2-handoff]');
    if (!box) return;
    var inp = photoInput(), file = usePhoto.file;
    var uploaded = false, cur = tibCurrent();
    if (cur) Object.keys(cur).forEach(function (k) { if (/-origin$|-upload-id$/.test(k) && cur[k]) uploaded = true; });
    var can = !!(inp && file && !uploaded && !box.__done && typeof DataTransfer === 'function');
    box.hidden = !can;
    if (!can) return;
    var img = box.querySelector('[data-hs2-handoff-img]');
    if (img && img.src !== photoURL) img.src = photoURL;
    var btn = box.querySelector('[data-hs2-handoff-btn]');
    if (btn && !btn.__hs2) {
      btn.__hs2 = true;
      btn.addEventListener('click', function () {
        var target = photoInput();
        var st = document.querySelector('[data-hs2-bridge-status]');
        try {
          var dt = new DataTransfer();
          dt.items.add(new File([usePhoto.file], usePhoto.file.name || 'headshot.jpg', { type: usePhoto.file.type || 'image/jpeg' }));
          target.files = dt.files;
          target.dispatchEvent(new Event('change', { bubbles: true }));
          box.__done = true; box.hidden = true;
          if (st) { st.textContent = 'Headshot sent to the personalizer. Crop it there.'; st.hidden = false; }
        } catch (e) {
          box.hidden = true;
          if (st) { st.textContent = 'Upload the headshot again in the personalizer below.'; st.hidden = false; }
        }
      });
    }
  }
  function teeinblue() {
    if (!document.querySelector('[data-hs2-answers], [data-hs2-tib-gallery]')) return;
    var tick = function () { runBridge(); tibGallery(); handoff(); };
    ['teeinblue-event-component-injected', 'teeinblue-event-campaign-loaded', 'teeinblue-event-variant-changed', 'teeinblue-event-customization-changed'].forEach(function (ev) {
      document.addEventListener(ev, function () { setTimeout(tick, 60); });
    });
    tick();
    if ('MutationObserver' in window) {
      var queued = false;
      var mo = new MutationObserver(function () {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; tick(); }, 150);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 60000);
    }
  }

  /* Helio can lay its header over the first section (a transparent header). When it
     does, push the hero down by the overlap so the stamp and headline never sit under
     the logo or menu. Turning the overlay off in Helio's header settings also fixes it. */
  function clearHeader() {
    var hero = document.querySelector('[data-hs2-hero]');
    var header = document.querySelector('.header-section, header.shopify-section');
    if (!hero || !header || window.scrollY > 10) return;
    var box = hero.closest('.shopify-section') || hero;
    box.style.paddingTop = '';
    var top = box.getBoundingClientRect().top;
    // the drawn header can extend past its section box, so take the lowest visible part
    var bottom = header.getBoundingClientRect().bottom;
    header.querySelectorAll('*').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom <= bottom) return;
      if (r.right <= 0 || r.left >= window.innerWidth || r.top > top + 200) return; // off-screen drawers
      if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return;
      bottom = r.bottom;
    });
    var overlap = bottom - top;
    if (overlap > 0) box.style.paddingTop = Math.ceil(overlap + 12) + 'px';
  }

  /* =================================================================== screens
     Every section is one screen tall (hs2.css). The script supplies what CSS can't
     know: where the hero starts under Helio's header, how far to scale the poster,
     how many FAQ tickets fit, and whether the memo needs to scroll as a ticker. */
  function stickyHead() {
    var h = 0;
    document.querySelectorAll('#header-group > .shopify-section, .shopify-section-group-header-group').forEach(function (sec) {
      if (sec.classList.contains('hs2-section')) return;
      var cs = window.getComputedStyle(sec);
      if (cs.display === 'none' || (cs.position !== 'sticky' && cs.position !== 'fixed')) return;
      var inner = sec.querySelector('header-component, header, .header') || sec;
      h = Math.max(h, Math.round(inner.getBoundingClientRect().height));
    });
    document.documentElement.style.setProperty('--hs2-head', h + 'px');
    return h;
  }
  function heroTop() {
    var hero = document.querySelector('[data-hs2-hero]');
    if (!hero) return;
    var top = Math.max(0, Math.round(hero.getBoundingClientRect().top + window.scrollY));
    document.documentElement.style.setProperty('--hs2-hero-top', top + 'px');
  }
  function fitPoster() {
    var stage = document.querySelector('[data-hs2-stage]'), box = document.querySelector('[data-hs2-poster-box]');
    if (!stage || !box) return;
    var review = stage.closest('.hs2-review');
    var zoomed = review && review.classList.contains('is-zoomed');
    var w = zoomed ? window.innerWidth - 24 : stage.clientWidth;
    var h = zoomed ? window.innerHeight - 80 : stage.clientHeight;
    var nh = box.offsetHeight || 640;
    var sc = Math.min((w - 16) / 480, (h - (zoomed ? 0 : 44)) / (nh + 30));
    sc = Math.max(0.18, Math.min(zoomed ? 1.5 : 1, sc));
    box.style.setProperty('--hs2-scale', sc.toFixed(3));
  }
  function zoom() {
    var review = document.querySelector('[data-hs2-review]');
    if (!review || review.__hs2z) return; review.__hs2z = true;
    var open = function () {
      review.classList.add('is-zoomed'); document.documentElement.style.overflow = 'hidden'; fitPoster();
      var c = review.querySelector('[data-hs2-zoom-close]'); if (c) c.focus();
    };
    var close = function () {
      review.classList.remove('is-zoomed'); document.documentElement.style.overflow = ''; fitPoster();
      var z = review.querySelector('[data-hs2-zoom]'); if (z && z.offsetParent) z.focus();
    };
    var z = review.querySelector('[data-hs2-zoom]'), c = review.querySelector('[data-hs2-zoom-close]'), stage = review.querySelector('[data-hs2-stage]');
    if (z) z.addEventListener('click', open);
    if (c) c.addEventListener('click', close);
    if (stage) stage.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      if (review.classList.contains('is-zoomed')) close(); else if (z && z.offsetParent) open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && review.classList.contains('is-zoomed')) close(); });
  }
  function ticker() {
    document.querySelectorAll('[data-hs2-memo]').forEach(function (bar) {
      var track = bar.querySelector('[data-hs2-ticker]'), vp = bar.querySelector('.hs2-memo__viewport');
      if (!track || !vp) return;
      bar.classList.remove('is-ticker');
      track.querySelectorAll('.is-clone').forEach(function (c) { c.remove(); });
      var item = track.querySelector('.hs2-memo__item');
      if (!item || reduced) return;
      item.style.whiteSpace = 'nowrap'; item.style.display = 'inline-block';
      var w = item.getBoundingClientRect().width;
      item.style.whiteSpace = ''; item.style.display = '';
      if (w <= vp.clientWidth - 32) return;
      var clone = item.cloneNode(true);
      clone.classList.add('is-clone'); clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      bar.classList.add('is-ticker');
      bar.style.setProperty('--ticker-s', Math.max(16, Math.round((w + 64) / 42)) + 's');
    });
  }
  function fitFaq() {
    var list = document.querySelector('[data-hs2-faq]');
    if (!list || list.__hs2open) return;
    var sec = list.closest('.hs2-faq'), more = list.querySelector('[data-hs2-faq-more]');
    var tickets = Array.prototype.slice.call(list.querySelectorAll('.hs2-ticket'));
    tickets.forEach(function (t) { t.classList.remove('is-folded'); });
    if (more) more.hidden = true;
    if (!sec || !more) return;
    var room = window.innerHeight - (stickyHead.h || 0) + 2, shown = tickets.length;
    if (sec.offsetHeight <= room) return;
    more.hidden = false;
    while (sec.offsetHeight > room && shown > 2) {
      shown--;
      if (tickets[shown].open) { shown++; break; }
      tickets[shown].classList.add('is-folded');
      more.querySelector('[data-hs2-faq-more-n]').textContent = tickets.length - shown;
    }
    if (shown === tickets.length) more.hidden = true;
  }
  function faq() {
    var list = document.querySelector('[data-hs2-faq]');
    if (!list || list.__hs2) return; list.__hs2 = true;
    var tickets = Array.prototype.slice.call(list.querySelectorAll('.hs2-ticket'));
    tickets.forEach(function (t) {
      t.addEventListener('toggle', function () {
        if (!t.open) return;
        tickets.forEach(function (o) { if (o !== t && o.open) o.open = false; });
        track('faq_open', { question: (t.querySelector('.hs2-ticket__q') || {}).textContent || '' });
        if (reduced) return;
        t.classList.add('is-typing');
        setTimeout(function () { t.classList.remove('is-typing'); }, 520);
      });
    });
    var more = list.querySelector('[data-hs2-faq-more]');
    if (more) more.addEventListener('click', function () {
      list.__hs2open = true;
      tickets.forEach(function (t) { t.classList.remove('is-folded'); });
      more.hidden = true;
    });
  }

  /* ===================================================================== motion */
  function reveal() {
    var els = document.querySelectorAll('[data-hs2-reveal]:not(.is-in)');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    if (!reveal.io) {
      reveal.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); reveal.io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
      reveal.drift = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-on', en.isIntersecting); });
      });
    }
    els.forEach(function (e) { reveal.io.observe(e); });
    document.querySelectorAll('.hs2-anim-drift').forEach(function (e) { reveal.drift.observe(e); });
  }
  function inkName() {
    if (reduced) return;
    clearTimeout(inkName.t);
    inkName.t = setTimeout(function () {
      document.querySelectorAll('.hs2-hero h1 [data-hs2="dog"]').forEach(function (el) {
        el.classList.remove('is-inked'); void el.offsetWidth; el.classList.add('is-inked');
      });
    }, 250);
  }
  function cycleNames() {
    var inp = document.querySelector('[data-hs2-cycle]');
    if (!inp || reduced || state.dog) return;
    var names = inp.getAttribute('data-hs2-cycle').split(','), i = 1, ch = 0, del = false, timer, stopped = false;
    var stop = function () { stopped = true; clearTimeout(timer); inp.placeholder = names[0]; };
    inp.addEventListener('focus', stop);
    inp.addEventListener('input', stop);
    function step() {
      if (stopped || inp.value) return;
      var n = names[i];
      if (!del) {
        ch++; inp.placeholder = n.slice(0, ch);
        if (ch >= n.length) { del = true; timer = setTimeout(step, 1500); return; }
      } else {
        ch--; inp.placeholder = n.slice(0, Math.max(ch, 0));
        if (ch <= 0) { del = false; i = (i + 1) % names.length; }
      }
      timer = setTimeout(step, del ? 45 : 95);
    }
    timer = setTimeout(function () { del = true; ch = names[0].length; i = 0; step(); }, 2600);
  }

  /* ====================================================== the review, one step at a time */
  function steps() {
    var box = document.querySelector('[data-hs2-steps]');
    steps.auto = steps.auto || {};
    if (!box || box.__hs2) return; box.__hs2 = true;
    var all = box.querySelectorAll('[data-hs2-step]'), n = all.length;
    all.forEach(function (st) { st.setAttribute('tabindex', '-1'); });
    function go(k, focus) {
      clearTimeout(steps.timer); // a pending chip auto-advance must never skip a step
      k = Math.max(1, Math.min(n, k));
      var back = k < (steps.at || 1);
      steps.at = k;
      all.forEach(function (st) {
        var on = Number(st.getAttribute('data-hs2-step')) === k;
        st.classList.toggle('is-on', on);
        st.classList.toggle('is-back', on && back);
      });
      box.querySelectorAll('[data-hs2-step-go]').forEach(function (b) {
        var i = Number(b.getAttribute('data-hs2-step-go'));
        b.classList.toggle('is-done', i < k);
        if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var no = box.querySelector('[data-hs2-step-no]'); if (no) no.textContent = k;
      var bk = box.querySelector('[data-hs2-step-back]'); if (bk) bk.disabled = k === 1;
      var nx = box.querySelector('[data-hs2-step-next]'); if (nx) nx.hidden = k === n;
      if (focus) { var cur = box.querySelector('.hs2-step.is-on'); if (cur) cur.focus({ preventScroll: true }); }
      fitPoster();
      track('review_step', { step: k });
    }
    steps.go = go;
    var nx = box.querySelector('[data-hs2-step-next]'), bk = box.querySelector('[data-hs2-step-back]');
    if (nx) nx.addEventListener('click', function () { go(steps.at + 1, true); });
    if (bk) bk.addEventListener('click', function () { go(steps.at - 1, true); });
    box.querySelectorAll('[data-hs2-step-go]').forEach(function (b) {
      b.addEventListener('click', function () { go(Number(b.getAttribute('data-hs2-step-go')), true); });
    });
    box.querySelectorAll('[data-hs2-step="1"] input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(steps.at + 1, true); } });
    });
    go(1);
  }
  /* Both names print on the poster, so Approve waits for them. It takes the shopper back
     to step 1, opens the dog's name there if the hero was skipped, and says what HR needs. */
  function askNames(a) {
    var review = a.closest('.hs2-review') || document;
    var box = review.querySelector('[data-hs2-steps]'), nudge = review.querySelector('[data-hs2-names-nudge]');
    if (!box || !steps.go) return false;
    var missing = missingNames();
    var ask = review.querySelector('[data-hs2-ask="dog"]');
    if (ask && missing.indexOf('dog') !== -1) ask.hidden = false;
    steps.go(1);
    if (nudge) {
      nudge.textContent = nudge.getAttribute(missing.length > 1 ? 'data-both' : 'data-' + missing[0]) || '';
      nudge.hidden = false;
      nudge.classList.remove('is-new'); void nudge.offsetWidth; nudge.classList.add('is-new');
    }
    var first = box.querySelector('[data-hs2-step="1"] [data-hs2-input="' + missing[0] + '"]');
    if (first) {
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      first.focus({ preventScroll: true });
    }
    track('names_needed', { missing: missing.join(',') });
    return true;
  }
  /* Approve: the stamp lands on the poster, then the shopper moves on */
  function approve() {
    document.querySelectorAll('[data-hs2-approve]').forEach(function (a) {
      if (a.__hs2a) return; a.__hs2a = true;
      a.addEventListener('click', function (e) {
        if (missingNames().length && askNames(a)) { e.preventDefault(); return; }
        track('approve_clicked', { dog: val('dog') });
        var review = a.closest('.hs2-review'), stampEl = review && review.querySelector('.hs2-poster__approved');
        var href = a.getAttribute('href') || '';
        if (reduced || !stampEl || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        review.classList.add('is-approving');
        stampEl.classList.remove('is-slam'); void stampEl.offsetWidth; stampEl.classList.add('is-slam');
        setTimeout(function () {
          review.classList.remove('is-approving');
          if (href.charAt(0) === '#') {
            var t = document.querySelector(href);
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.location.href = a.href;
          }
        }, 800);
      });
    });
  }

  /* ===================================================== honest urgency
     Every countdown counts to a real date: Christmas morning, or the confirmed last
     order date once it is entered in the memo bar's settings. The free video offer
     shows only inside its dates (docs/V2-FROM-THE-DOG.md section 4). Nothing resets,
     nothing invents stock. ?hs2_now=YYYY-MM-DD previews another day. */
  var DAY = 864e5;
  function parseISO(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || '').trim());
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function endOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
  function now() {
    var q = null;
    try { q = parseISO(new URLSearchParams(window.location.search).get('hs2_now')); } catch (e) { q = null; }
    if (!q) return new Date();
    var t = new Date(); q.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    return q;
  }
  function config() {
    var m = document.querySelector('[data-hs2-memo]');
    if (!m) return {};
    return {
      deadline: parseISO(m.getAttribute('data-deadline')),
      offerStart: parseISO(m.getAttribute('data-offer-start')),
      offerEnd: parseISO(m.getAttribute('data-offer-end')),
      offerText: (m.getAttribute('data-offer-label') || '').trim()
    };
  }
  function offerLabel() {
    var c = config(), t = now();
    return c.offerStart && c.offerEnd && c.offerText && t >= c.offerStart && t <= endOfDay(c.offerEnd) ? c.offerText : '';
  }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function timeline() {
    var t = now(), c = config();
    var xmas = new Date(t.getFullYear(), 11, 25);
    var out = { now: t };
    if (c.deadline && t <= endOfDay(c.deadline)) { out.deadline = endOfDay(c.deadline); out.dl = Math.ceil((out.deadline - t) / DAY); }
    if (t < xmas) { out.xmas = xmas; out.xd = Math.floor((xmas - t) / DAY); }
    return out;
  }
  function countdownText(kind) {
    var tl = timeline(), offer = offerLabel(), parts = [];
    var dl = tl.dl, xd = tl.xd;
    var xmasLine = tl.xmas ? (xd < 1 ? 'Christmas morning is tomorrow' : 'Christmas morning in ' + plural(xd, 'day')) : '';
    var lead = dl ? (dl <= 1 ? 'Last day to order for Christmas' : plural(dl, 'day') + ' left to order for Christmas') : xmasLine;
    if (kind === 'memo') return dl ? (dl <= 1 ? 'Last day' : plural(dl, 'day') + ' left') : lead;
    if (kind === 'sub') return dl ? (dl <= 1 ? 'Last day to order for Christmas' : 'Order within ' + plural(dl, 'day') + ' for Christmas') : lead;
    if (kind === 'buy' || kind === 'product') {
      if (offer) parts.push('Read-aloud video ' + offer.charAt(0).toLowerCase() + offer.slice(1));
      if (lead) parts.push(lead);
      return parts.join(' · ');
    }
    return lead;
  }
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function parseLoose(text, year) {
    var s = String(text || '').trim().toLowerCase();
    if (!s || s.indexOf('[') !== -1) return null;
    if (s === 'christmas eve') return new Date(year, 11, 24);
    var iso = parseISO(s); if (iso) return iso;
    var m = /([a-z]{3})[a-z]*\.?\s+(\d{1,2})/.exec(s) || null, d, mo;
    if (m) { mo = MONTHS.indexOf(m[1]); d = Number(m[2]); }
    else { m = /(\d{1,2})\s+([a-z]{3})/.exec(s); if (m) { d = Number(m[1]); mo = MONTHS.indexOf(m[2]); } }
    return m && mo > -1 ? new Date(year, mo, d) : null;
  }
  function urgency() {
    var tl = timeline();
    document.querySelectorAll('[data-hs2-countdown]').forEach(function (el) {
      var txt = countdownText(el.getAttribute('data-hs2-countdown'));
      if (el.textContent !== txt) el.textContent = txt;
      el.hidden = !txt;
    });
    document.querySelectorAll('[data-hs2-date]').forEach(function (el) {
      var left = el.parentNode.querySelector('[data-hs2-left]');
      if (!left) return;
      var d = parseLoose(el.textContent, tl.now.getFullYear());
      if (!d) { left.hidden = true; return; }
      var days = Math.ceil((endOfDay(d) - tl.now) / DAY);
      left.textContent = days < 1 ? 'Closed' : days === 1 ? 'Last day' : plural(days, 'day') + ' left';
      left.hidden = false;
    });
    var label = document.querySelector('[data-hs2-clock-label]');
    if (label) label.textContent = tl.deadline ? 'LAST DAY TO ORDER FOR CHRISTMAS IN' : 'CHRISTMAS MORNING IN';
  }
  function clock() {
    var box = document.querySelector('[data-hs2-clock]');
    if (!box || box.__hs2) return; box.__hs2 = true;
    var parts = {};
    box.querySelectorAll('[data-hs2-clock-part]').forEach(function (b) { parts[b.getAttribute('data-hs2-clock-part')] = b; });
    var timer = null;
    function paint() {
      var tl = timeline(), target = tl.deadline || tl.xmas;
      if (!target) { box.hidden = true; return; }
      box.hidden = false;
      var ms = Math.max(0, target - new Date(tl.now.getTime()));
      var v = { d: Math.floor(ms / DAY), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
      Object.keys(v).forEach(function (k) {
        var t = (v[k] < 10 ? '0' : '') + v[k];
        if (parts[k] && parts[k].textContent !== t) {
          parts[k].textContent = t;
          if (!reduced && k !== 's') { parts[k].classList.remove('is-flip'); void parts[k].offsetWidth; parts[k].classList.add('is-flip'); }
        }
      });
    }
    paint();
    if (!('IntersectionObserver' in window)) { timer = setInterval(paint, 1000); return; }
    new IntersectionObserver(function (en) {
      clearInterval(timer); timer = null;
      if (en[0].isIntersecting) timer = setInterval(paint, 1000);
    }).observe(box);
  }

  /* ========================================================== benefits carousel */
  function carousels() {
    document.querySelectorAll('[data-hs2-carousel]').forEach(function (list) {
      if (list.__hs2) return; list.__hs2 = true;
      var nav = list.parentElement.querySelector('[data-hs2-carousel-nav]');
      if (!nav) return;
      var dots = nav.querySelector('[data-hs2-carousel-dots]'), items = Array.prototype.slice.call(list.children);
      dots.innerHTML = '';
      items.forEach(function () { dots.appendChild(document.createElement('i')); });
      function current() {
        var r = list.getBoundingClientRect(), mid = r.left + r.width / 2, best = 0, bd = Infinity;
        items.forEach(function (it, i) { var ir = it.getBoundingClientRect(), d = Math.abs(ir.left + ir.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
        return best;
      }
      function paint() { var c = current(); Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('is-on', i === c); }); }
      list.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
      nav.querySelectorAll('[data-hs2-carousel-step]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Math.max(0, Math.min(items.length - 1, current() + Number(b.getAttribute('data-hs2-carousel-step'))));
          list.scrollTo({ left: items[i].offsetLeft - (list.clientWidth - items[i].offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
        });
      });
      paint();
    });
  }

  /* ============================================== the story cards play like a story */
  var leakAuto = { stopped: false, timer: null };
  function leakAutoplay() {
    var phone = document.querySelector('[data-hs2-phone]');
    if (!phone || phone.__hs2 || reduced || !('IntersectionObserver' in window)) return; phone.__hs2 = true;
    var ms = 4500;
    phone.style.setProperty('--leak-s', ms + 'ms');
    function restart() { phone.classList.remove('is-playing'); void phone.offsetWidth; phone.classList.add('is-playing'); }
    function tick() { if (leakAuto.stopped) return; stepLeak(1); restart(); leakAuto.timer = setTimeout(tick, ms); }
    new IntersectionObserver(function (en) {
      clearTimeout(leakAuto.timer);
      if (en[0].isIntersecting && !leakAuto.stopped) { restart(); leakAuto.timer = setTimeout(tick, ms); }
      else phone.classList.remove('is-playing');
    }, { threshold: 0.6 }).observe(phone);
  }
  function stopLeakAuto() {
    leakAuto.stopped = true; clearTimeout(leakAuto.timer);
    var p = document.querySelector('[data-hs2-phone]'); if (p) p.classList.remove('is-playing');
  }

  /* ========================================= Instagram and TikTok in-app browsers
     They can't download files, so the story card opens full size to press and hold. */
  function showCard(src) {
    var ov = document.createElement('div');
    ov.className = 'hs2 hs2-cardview';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your story card');
    ov.innerHTML = '<div class="hs2-cardview__box"><img alt="Your story card" src="' + src + '"><p>Press and hold the card to save it. Then post it and tag the person.</p><button type="button" class="hs2-btn hs2-btn--blush">Done</button></div>';
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';
    var btn = ov.querySelector('button');
    var close = function () { ov.remove(); document.documentElement.style.overflow = ''; };
    btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    btn.focus();
  }

  /* ============================== funnel events for Shopify's customer events and pixels
     Subscribe in Settings > Customer events (analytics.subscribe('hs2_approve_clicked', ...)). */
  function track(name, data) {
    try { if (window.Shopify && window.Shopify.analytics && window.Shopify.analytics.publish) window.Shopify.analytics.publish('hs2_' + name, data || {}); } catch (e) { /* analytics off */ }
  }

  function layout() { stickyHead.h = stickyHead(); heroTop(); fitPoster(); ticker(); fitFaq(); }
  function init() {
    bindInputs(); render(); sticky(); gallery(); clearHeader();
    steps(); zoom(); approve(); faq(); carousels(); clock(); urgency(); reveal(); cycleNames(); leakAutoplay();
    layout();
    setInterval(urgency, 60000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    var late = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 1500); });
    Promise.race([restorePhoto(), late]).then(function (f) { if (f && !usePhoto.file) usePhoto(f); teeinblue(); });
  }
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { clearHeader(); layout(); }, 120); });
  window.addEventListener('load', function () { clearHeader(); layout(); setTimeout(function () { clearHeader(); layout(); }, 600); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('shopify:section:load', function () { bindInputs(); render(); sticky(); gallery(); steps(); zoom(); approve(); faq(); carousels(); clock(); urgency(); reveal(); layout(); });
  // for tools/preview tests
  window.__hs2api = { state: state, val: val, answer: answer, drawCard: drawCard, caption: caption, shareURL: shareURL, runBridge: runBridge, rules: TIB_RULES, usePhoto: usePhoto, countdownText: countdownText, steps: steps, showCard: showCard };
})();
