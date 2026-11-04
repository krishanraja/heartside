/* The painting wait (snippets/hs-native-artwork.liquid), Krish, 4 Nov: "While the second loading screen is
   going for 1 to 3 minutes, we should have beautiful beautiful visuals that come in with a fun fact about
   their dog breed ... running commentary from that dog ... People want to wait around for it."

   While hs2.js says the card is painting (data-state="painting"), this file turns it into a small studio:
   - the buyer's photo, whole, painted in from grey to colour by brush strokes that grow with the time
     waited (an SVG mask, so it works the same in every browser); the brush follows the newest stroke
   - the dog's own running commentary in a speech bubble, from what the buyer told us (the invented fun)
   - every third beat, Buddy's note: one true fact about the breed (hs-breed-facts.js, each one sourced)
   - the dog's favourite things drifting past, and a treat to give by tapping the dog
   - a progress bar that eases towards the end and fills when the painting lands, instead of a sweep
   - when the painting lands while the buyer is in another tab, the tab title says so
   It never touches Teeinblue and never decides anything: hs2.js still owns the states, the words of the
   honest status line, and the reveal. Reduced motion: no drifting, no typing, no growing strokes. */
(function () {
  'use strict';
  if (window.__hsWait) return;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var BEAT = 7000, STROKES = 14, card, built = false, timer = null, start = 0, beat = 0, used = {}, treats = 0, lastSay = 0;
  var stage, svg, colour, grey, paths = [], lens = [], brush, bubble, sayEl, who, avatar, factEl, things, titleWas = '';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function review() { try { return JSON.parse(window.sessionStorage.getItem('hs2-review') || '{}') || {}; } catch (e) { return {}; } }

  /* ------------------------------------------------------------------ the words
     The dog talks to the buyer, first person, from the studio. Only what the buyer told us goes in: the
     spot, the thing they do together, the welcome home, the toys and what the dog wears. No exclamation
     marks, no dashes (the house voice, n8n/README.md). */
  function info() {
    var st = review(), b = st.hs_brief_input || {}, j = st.hs_journey || {};
    var dog = String(st.dog || '').trim() || 'your dog';
    var toys = String(b.toys || '').replace(/\b(in|at|by|under|beside|next to) (his|her|their) [a-z ]+$/i, '').trim();
    var firstToy = (toys.split(/ and |, /)[0] || '').replace(/^(a|an|the|his|her|their) /i, '').trim();
    var person = String(st.person || '').trim();
    return { dog: dog, breed: st.hs_breed_id || b.breed || '', spot: b.spot || '', together: b.together || '', home: b.home || '',
      meaning: b.meaning || '', toy: firstToy, toyRaw: toys, wears: String(b.accessory || '').replace(/^(a|an) /i, ''),
      person: person && person !== 'Me' ? person : '', tone: j.tone || (st.hs3_art_choices || {}).tone || 'warm', ai: Array.isArray(st.hs_wait_lines) ? st.hs_wait_lines : [] };
  }
  function lines(d) {
    var open = [
      "I'm at the painter's. I've been asked to sit very still, which is a big ask.",
      "The painter says I have a good side. I told them they're all good sides.",
      "We're starting with the eyes. Apparently that's where all my charm is."
    ];
    var mid = [
      'The painter is mixing colors. None of them smell like anything, which is disappointing.',
      "I've been very good so far. I'd like that written down.",
      "The painter asked me to look noble. I'm looking noble.",
      "I tried to help with the brush. I've been asked not to help with the brush.",
      "There's a lot of white canvas left. I think it's where my ears go."
    ];
    var spot = { couch: 'Somebody keep my spot on the couch warm until I get back.', bed: "Don't let anyone take my side of the bed while I'm here.", feet: "Keep your feet right where they are. I'll be back on them soon.", anywhere: "I can still see you from here, so it's basically like being home." }[d.spot];
    var together = { walk: "After this, I think we've earned a long walk.", coffee: 'Save me a corner of whatever you have with your coffee.', movie: "Pick a movie for later. I'll take the seat nearest the snacks.", naps: "Holding still this long is basically a nap. I'm a natural.", car: 'If we drive home after this, I call the window.' }[d.together];
    var home = { door: "When this is done, I'll be by the door as usual.", toy: "I'm already thinking about what to bring you when we get home.", spin: "I'm saving my spin for when we get home. It's a good one.", cool: "I'm playing it cool in here. Mostly." }[d.home];
    var meaning = { boss: "I've told the painter who's in charge at home. They seemed to get it.", shadow: "This is the longest I've been out of your shadow. I don't love it.", best: 'I told the painter you were my best friend. They said it shows.', hard: "This one's going to be on your wall for the hard days. I'll make it good." }[d.meaning];
    var tone = { over_the_top: ['The painter holds still better than you do. Just saying.', "I've asked the painter to make me look taller than you."], hilarious: ["I've been told this is called sitting for a portrait. I'm lying down, but they're working with it."], sentimental: ['I hope I look the way I feel when you come home.'], warm: ['I hope they get my good ear right.'] }[d.tone] || [];
    var extra = [spot, together, home, meaning].filter(Boolean).concat(tone);
    if (d.toy) extra.push('I asked if my ' + d.toy + ' could be in the picture. It made the cut.');
    if (d.wears) extra.push("I'm wearing my " + d.wears + ' for this. It felt like an occasion.');
    if (d.person) extra.push("This one's for " + d.person + ". I want it to be perfect.");
    var long = ["Good art takes time. I'm told this is very good art.", "Still holding still. This is the longest I've ever held still.", "I think the painter is doing my whiskers one at a time."];
    return { open: open, mid: d.ai.length ? d.ai.slice(0, 12).concat(extra.slice(0, 3)) : extra.concat(mid), long: long };
  }
  var TREATS = ['Thank you. That one went straight to the ears.', 'Crunchy. The painter didn\'t see that.', "That's {n} treats. I'm keeping count.", 'One more and I could hold still forever. Probably.', 'You always know exactly what I need.'];

  /* ----------------------------------------------------------------- the things
     Small line icons for the dog's favourite things, the house icon style (24 px grid, round ends). */
  var ICO = {
    ball: '<circle cx="12" cy="12" r="8"/><path d="M5.5 8.5c3 1.5 4 4.5 3 9M18.5 15.5c-3-1.5-4-4.5-3-9"/>',
    bone: '<path d="M8.5 9.5 14.5 15.5M7 5.5a2 2 0 1 0-1.5 3.4 2 2 0 1 0 3.4 1.6l5.6 5.6a2 2 0 1 0 1.6 3.4 2 2 0 1 0 3.4-1.5 2 2 0 1 0-1.6-3.4L12.3 9a2 2 0 1 0-1.6-3.4A2 2 0 1 0 7 5.5Z"/>',
    stick: '<path d="M4 19 19.5 6M13 11l3.5 1M9.5 14l-.5 3.2"/>',
    disc: '<ellipse cx="12" cy="12" rx="9" ry="4.5"/><ellipse cx="12" cy="11.5" rx="4.5" ry="1.8"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>',
    paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="10.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12.5 11.5c-3 0-5.5 3.3-5.5 5.5 0 1.6 1.2 2.5 2.7 2.5 1.2 0 1.8-.6 2.8-.6s1.6.6 2.8.6c1.5 0 2.7-.9 2.7-2.5 0-2.2-2.5-5.5-5.5-5.5Z"/>',
    rope: '<path d="M5 18c3-1 3-4 6-5s4-4 6-6M5 18l-1.5 1.5M17 7l1.5-1.5"/><path d="M8 15.5 10 17M11 12.5l2 1.5M14 9.5l2 1.5"/>',
    treat: '<rect x="4.5" y="7.5" width="15" height="9" rx="4.5"/><path d="M9 12h.01M12 12h.01M15 12h.01"/>'
  };
  function icoFor(t) {
    t = String(t || '').toLowerCase();
    if (/ball/.test(t)) return 'ball'; if (/bone/.test(t)) return 'bone'; if (/stick/.test(t)) return 'stick';
    if (/frisbee/.test(t)) return 'disc'; if (/rope/.test(t)) return 'rope'; if (/treat/.test(t)) return 'treat';
    return '';
  }
  function svgIco(k, cls) { return '<svg class="' + (cls || 'hs-wait__ico') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICO[k] + '</svg>'; }

  /* ------------------------------------------------------------------ the canvas */
  function strokes(w, h) {
    /* loose, slightly diagonal sweeps with wobble, painted from the middle of the picture outwards, the way a
       painter blocks in the dog before the background; the mask is feathered, so the edges read as paint */
    var out = [], band = h / (STROKES - 3), wide = band * 1.9;
    for (var i = 0; i < STROKES; i++) {
      var y = band * (i - 1) + band * 0.5, l2r = i % 2 === 0, tilt = band * 0.6 * (i % 3 - 1);
      var x0 = l2r ? -w * 0.12 : w * 1.12, x1 = l2r ? w * 1.12 : -w * 0.12;
      var wob = band * (0.5 + (i * 7 % 5) * 0.12) * (i % 2 ? 1 : -1);
      out.push({ y: y, d: 'M' + x0.toFixed(1) + ' ' + (y - tilt).toFixed(1) + ' C ' + (x0 + (x1 - x0) * 0.3).toFixed(1) + ' ' + (y + wob).toFixed(1) + ', ' + (x0 + (x1 - x0) * 0.7).toFixed(1) + ' ' + (y - wob).toFixed(1) + ', ' + x1.toFixed(1) + ' ' + (y + tilt).toFixed(1), w: wide * (0.85 + (i * 3 % 4) * 0.1) });
    }
    var mid = h * 0.45;
    return out.sort(function (a, b) { return Math.abs(a.y - mid) - Math.abs(b.y - mid); });
  }
  function buildCanvas(src) {
    var canvas = card.querySelector('[data-hs-art-canvas]');
    if (!canvas || !src) return false;
    var r = canvas.getBoundingClientRect(), w = Math.max(200, Math.round(r.width)), h = Math.max(200, Math.round(r.height));
    stage = document.createElement('div');
    stage.className = 'hs-wait__stage';
    stage.setAttribute('aria-hidden', 'true');
    var ps = strokes(w, h);
    stage.innerHTML = '<svg class="hs-wait__paint" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs><filter id="hs-wait-gray"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer></filter>' +
      '<filter id="hs-wait-soft"><feGaussianBlur stdDeviation="14"/></filter>' +
      '<filter id="hs-wait-feather" filterUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="' + Math.round(Math.min(w, h) * 0.09) + '"/><feGaussianBlur stdDeviation="' + Math.max(4, Math.round(Math.min(w, h) * 0.018)) + '"/></filter>' +
      '<mask id="hs-wait-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" fill="#000"/><g filter="url(#hs-wait-feather)">' +
      ps.map(function (p) { return '<path d="' + p.d + '" fill="none" stroke="#fff" stroke-width="' + p.w.toFixed(1) + '" stroke-linecap="round"/>'; }).join('') + '</g></mask></defs>' +
      '<image href="' + esc(src) + '" x="-6%" y="-6%" width="112%" height="112%" preserveAspectRatio="xMidYMid slice" filter="url(#hs-wait-soft)" opacity=".35"/>' +
      '<image class="hs-wait__gray" href="' + esc(src) + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet" filter="url(#hs-wait-gray)"/>' +
      '<image class="hs-wait__colour" href="' + esc(src) + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet" mask="url(#hs-wait-mask)"/></svg>' +
      '<div class="hs-wait__things"></div>';
    canvas.appendChild(stage);
    svg = stage.querySelector('svg');
    paths = Array.prototype.slice.call(svg.querySelectorAll('mask path'));
    lens = paths.map(function (p) { var L = 0; try { L = p.getTotalLength(); } catch (e) { L = w * 1.4; } p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = String(L); return L; });
    brush = canvas.querySelector('.hs-art__brush');
    things = stage.querySelector('.hs-wait__things');
    return true;
  }
  // how much of the picture is in colour after t ms: quick at first, never quite done until it is
  function reach(t) { return reduced ? 0.5 : 0.88 * (1 - Math.exp(-t / 55000)); }
  function paintTo(f) {
    if (!paths.length) return;
    var per = 1 / paths.length, tip = null;
    paths.forEach(function (p, i) {
      var k = Math.max(0, Math.min(1, (f - i * per) / per));
      p.style.strokeDashoffset = String(lens[i] * (1 - k));
      if (k > 0 && k < 1) tip = { p: p, at: lens[i] * k };
    });
    if (brush && tip && svg && !reduced) {
      try {
        var pt = tip.p.getPointAtLength(tip.at), vb = svg.viewBox.baseVal, box = svg.getBoundingClientRect();
        var s = Math.max(box.width / vb.width, box.height / vb.height), ox = (box.width - vb.width * s) / 2, oy = (box.height - vb.height * s) / 2;
        brush.style.animation = 'none';
        brush.style.transform = 'translate(' + Math.round(ox + pt.x * s - box.width / 2 + 14) + 'px,' + Math.round(oy + pt.y * s - box.height / 2 - 18) + 'px) rotate(-14deg)';
      } catch (e) { /* the brush keeps its own loop */ }
    }
  }
  function drift(d) {
    if (!things || reduced) return;
    var list = [];
    String(d.toyRaw || '').split(/ and |, /).forEach(function (t) { var k = icoFor(t); if (k) list.push(k); });
    if (!list.length) list.push('ball');
    list.push('heart', 'paw');
    things.innerHTML = list.slice(0, 4).map(function (k, i) { return '<span class="hs-wait__thing" style="--i:' + i + '">' + svgIco(k) + '</span>'; }).join('');
  }

  /* --------------------------------------------------------------------- the talk */
  function buildTalk(d, src) {
    var box = card.querySelector('[data-hs-art-painting]'), title = box && box.querySelector('[data-hs-art-title]');
    if (!box || !title) return;
    bubble = document.createElement('div');
    bubble.className = 'hs-wait__talk';
    bubble.innerHTML = '<button type="button" class="hs-wait__me" data-hs-wait-treat aria-label="Give ' + esc(d.dog) + ' a treat">' +
      (src ? '<img src="' + esc(src) + '" alt="">' : svgIco('paw')) + '<span class="hs-wait__count" data-hs-wait-count hidden></span></button>' +
      '<div class="hs-wait__bubble"><p class="hs-wait__who">' + esc(d.dog) + ', live from the studio</p><p class="hs-wait__say" data-hs-wait-say aria-live="polite"></p></div>' +
      '<div class="hs-wait__fact" data-hs-wait-fact hidden><p class="hs-wait__who">Buddy\'s note</p><p class="hs-wait__fact-text"></p></div>';
    title.insertAdjacentElement('afterend', bubble);
    sayEl = bubble.querySelector('[data-hs-wait-say]');
    factEl = bubble.querySelector('[data-hs-wait-fact]');
    avatar = bubble.querySelector('[data-hs-wait-treat]');
    avatar.addEventListener('click', function () { treat(d); });
  }
  var typing = null;
  function say(text) {
    if (!sayEl) return;
    clearInterval(typing);
    bubble.classList.remove('is-fact');
    factEl.hidden = true;
    sayEl.parentNode.hidden = false;
    lastSay = Date.now();
    if (reduced) { sayEl.textContent = text; return; }
    sayEl.classList.remove('is-in'); void sayEl.offsetWidth; sayEl.classList.add('is-in');
    var i = 0;
    sayEl.setAttribute('aria-label', text);
    sayEl.textContent = '';
    typing = setInterval(function () { i += 2; sayEl.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(typing); sayEl.removeAttribute('aria-label'); } }, 28);
  }
  function fact(text, breed) {
    if (!factEl) return;
    clearInterval(typing);
    sayEl.parentNode.hidden = true;
    factEl.hidden = false;
    bubble.classList.add('is-fact');
    factEl.querySelector('.hs-wait__who').textContent = "Buddy's note" + (breed ? ' on ' + breed : '');
    var p = factEl.querySelector('.hs-wait__fact-text');
    p.textContent = text;
    p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in');
  }
  function pick(list, key) {
    var left = list.filter(function (x) { return !used[key + x]; });
    if (!left.length) { list.forEach(function (x) { delete used[key + x]; }); left = list.slice(); }
    var x = left[0];
    used[key + x] = true;
    return x;
  }
  function treat(d) {
    treats++;
    var c = avatar.querySelector('[data-hs-wait-count]');
    c.hidden = false; c.textContent = String(treats);
    avatar.classList.remove('is-fed'); void avatar.offsetWidth; avatar.classList.add('is-fed');
    if (!reduced) crumbs();
    say(TREATS[(treats - 1) % TREATS.length].replace('{n}', String(treats)));
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* no vibration */ }
  }
  function crumbs() {
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('i');
      s.className = 'hs-wait__crumb';
      s.style.setProperty('--a', (i * 60 + Math.random() * 30) + 'deg');
      avatar.appendChild(s);
      setTimeout(function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; }(s), 800);
    }
  }
  function breedName(d) {
    var n = String(d.breed || '');
    if (/^[a-z0-9-]+$/.test(n)) n = '';
    return /mixed|not sure/i.test(n) ? '' : n;
  }
  function next(d, L, t) {
    beat++;
    var facts = window.HSBreedFacts ? window.HSBreedFacts.for(d.breed) : [];
    if (beat % 3 === 0 && facts.length) { fact(pick(facts, 'f:'), breedName(d)); return; }
    if (beat === 1) { say(L.open[Math.floor(Math.random() * L.open.length)]); return; }
    say(pick(t > 120000 ? L.long : L.mid, t > 120000 ? 'l:' : 'm:'));
  }

  /* ------------------------------------------------------------------- running */
  function bar(f) {
    var b = card.querySelector('[data-hs-art-bar] span');
    if (b) b.style.width = Math.round(f * 100) + '%';
  }
  // the time the painting started survives a reload, so the picture does not paint from grey again
  function startTime() {
    var key = 'hs-wait-start:' + location.pathname, t = 0;
    try { t = Number(window.sessionStorage.getItem(key)) || 0; if (!t || Date.now() - t > 30 * 60000) { t = Date.now(); window.sessionStorage.setItem(key, String(t)); } } catch (e) { t = Date.now(); }
    return t;
  }
  function forgetStart() { try { window.sessionStorage.removeItem('hs-wait-start:' + location.pathname); } catch (e) { /* private mode */ } }
  // hs2.js may hand the card a new address for the same photo (a fresh object URL after the old one is
  // revoked); the studio follows it, or the picture would go blank
  function follow() {
    var photo = card.querySelector('[data-hs-art-photo]'), src = photo && photo.getAttribute('src');
    if (!src || !svg || src === follow.src) return;
    follow.src = src;
    Array.prototype.forEach.call(svg.querySelectorAll('image'), function (im) { im.setAttribute('href', src); });
    var face = avatar && avatar.querySelector('img');
    if (face) face.src = src;
    else if (avatar) avatar.insertAdjacentHTML('afterbegin', '<img src="' + esc(src) + '" alt="">');
  }
  function begin() {
    var photo = card.querySelector('[data-hs-art-photo]'), src = photo && photo.getAttribute('src');
    var d = info(), L = lines(d);
    if (!built) {
      if (!buildCanvas(src)) return false;
      follow.src = src;
      buildTalk(d, src);
      drift(d);
      card.classList.add('has-wait');
      built = true;
      start = startTime();
    }
    clearInterval(timer);
    var tick = function () {
      if (card.getAttribute('data-state') !== 'painting') { finish(d); return; }
      follow();
      var t = Date.now() - start, f = reach(t);
      paintTo(f);
      bar(Math.min(0.95, 1 - Math.exp(-t / 70000)));
      if (Date.now() - lastSay >= BEAT) next(d, L, t);
    };
    next(d, L, 0);
    tick();
    timer = setInterval(tick, 500);
    return true;
  }
  function finish(d) {
    clearInterval(timer); timer = null; clearInterval(typing);
    if (!built) return;
    if (card.getAttribute('data-state') === 'done') {
      forgetStart();
      bar(1);
      paintTo(1);
      if (document.hidden) {
        titleWas = document.title;
        document.title = (d.dog === 'your dog' ? 'Your dog' : d.dog) + ' is ready';
        try { if (navigator.vibrate) navigator.vibrate([20, 60, 20]); } catch (e) { /* no vibration */ }
      }
    }
    card.classList.remove('has-wait');
    if (stage && stage.parentNode) stage.parentNode.removeChild(stage);
    if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble);
    if (brush) { brush.style.transform = ''; brush.style.animation = ''; }
    var b = card.querySelector('[data-hs-art-bar] span'); if (b) b.style.width = '';
    built = false; beat = 0; stage = bubble = null; svg = avatar = null; paths = []; lens = []; follow.src = '';
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && titleWas) { document.title = titleWas; titleWas = ''; } });

  function watch() {
    card = document.querySelector('[data-hs-art]');
    if (!card) return;
    var check = function () {
      var painting = card.getAttribute('data-state') === 'painting';
      if (painting && !timer) begin();
      else if (!painting && timer) finish(info());
    };
    if (window.MutationObserver) new MutationObserver(check).observe(card, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src', 'hidden'] });
    setInterval(check, 1500);
    check();
  }
  window.__hsWait = { lines: lines, info: info, reach: reach, treats: TREATS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
