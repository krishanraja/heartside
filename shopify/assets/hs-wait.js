/* The painting wait (snippets/hs-native-artwork.liquid), Krish, 4 Nov: "While the second loading screen is
   going for 1 to 3 minutes, we should have beautiful beautiful visuals that come in with a fun fact about
   their dog breed ... running commentary from that dog ... People want to wait around for it."

   While hs2.js says the card is painting (data-state="painting"), this file turns it into a small studio:
   - the buyer's photo, whole, painted in from grey to colour by brush strokes that grow with the time
     waited (an SVG mask, so it works the same in every browser); the brush follows the newest stroke
   - Buddy, the house's host, keeping the buyer company in a speech bubble (Krish, 6 Nov: "Why doesnt This
     character appear throughout the UX instead of these stupid paw emojis? ... talk to them while they're
     waiting for their painting"; "buddy in a classy way and dont just shoe horn him in"). He tells them how
     their dog is getting on, from what the buyer told us; the dog's own voice is the note in the box
   - every third beat, Buddy's note: one true fact about the breed (hs-breed-facts.js, each one sourced)
   - a tap on Buddy brings his next line at once
   - a progress bar that eases towards the end and fills when the painting lands, instead of a sweep
   - when the painting lands while the buyer is in another tab, the tab title says so
   It never touches Teeinblue and never decides anything: hs2.js still owns the states, the words of the
   honest status line, and the reveal. Reduced motion: no drifting, no typing, no growing strokes. */
(function () {
  'use strict';
  if (window.__hsWait) return;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var BEAT = 7000, STROKES = 14, card, built = false, timer = null, start = 0, beat = 0, used = {}, lastSay = 0;
  var stage, svg, colour, grey, paths = [], lens = [], brush, bubble, sayEl, who, avatar, factEl, titleWas = '';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function review() { try { return JSON.parse(window.sessionStorage.getItem('hs2-review') || '{}') || {}; } catch (e) { return {}; } }

  /* ------------------------------------------------------------------ the words
     Buddy talks to the buyer about their dog, by name, from the studio. Only what the buyer told us goes in:
     the spot, the thing they do together, the welcome home and who the gift is for. He never names a food, toy,
     object or place they did not mention (docs/SCOPE.md), and never claims what the painting will hold. No
     exclamation marks, no dashes (the house voice, n8n/README.md). */
  function info() {
    var st = review(), b = st.hs_brief_input || {}, j = st.hs_journey || {};
    var dog = String(st.dog || '').trim() || 'your dog';
    var person = String(st.person || '').trim();
    return { dog: dog, breed: st.hs_breed_id || b.breed || '', spot: b.spot || '', together: b.together || '', home: b.home || '',
      meaning: b.meaning || '', person: person && person !== 'Me' ? person : '', tone: j.tone || (st.hs3_art_choices || {}).tone || 'warm' };
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  // "Mowgli's", "Pickles'", "your dog's"
  function poss(n) { return /s$/i.test(n) && n !== 'your dog' ? n + "'" : n + "'s"; }
  function lines(d) {
    var D = d.dog, C = cap(D), P = poss(D);
    var open = [
      C + " is with the painter now. I'll keep you posted.",
      "The painter starts with the eyes. That's where " + D + ' keeps the charm.',
      'The painter wants ' + D + " very still. It's a big ask, and it's going well."
    ];
    var mid = [
      'The painter is mixing colors. ' + C + ' is watching every one.',
      C + " has been very good so far. I'm making a note of it.",
      'The painter asked ' + D + ' to look noble. No trouble at all.',
      C + " offered to help with the brush. We're leaving it to the painter.",
      "There's still some white canvas. I think that's where the ears go."
    ];
    var spot = { couch: 'The couch stays warm until ' + D + " is back. I've promised.", bed: 'Your side of the bed is still ' + P + '. Nothing changes after today.', feet: 'Keep your feet where they are. ' + C + ' will be back on them soon.', anywhere: C + ' rules wherever you are. Today that includes the studio.' }[d.spot];
    var together = { walk: "After this, I'd say " + D + ' has earned a long walk.', coffee: C + ' would like a corner of whatever comes with your coffee.', movie: 'Pick a movie for later. ' + C + ' wants the seat nearest you.', naps: 'Holding this still counts as a nap, ' + D + ' says. A good one.', car: 'If you drive home after this, ' + D + ' has the window.' }[d.together];
    var home = { door: 'When this is done, ' + D + ' will be by the door as usual.', toy: C + ' is already thinking about what to bring you later.', spin: C + " is saving a spin for when you're home. It's a good one.", cool: C + ' is playing it cool in here. Mostly.' }[d.home];
    var meaning = { boss: C + " has made it clear who's in charge at home. The painter got the message.", shadow: C + " hasn't been this far from you in a while. Nearly there.", best: 'I told the painter ' + D + ' is your best friend. They said it shows.', hard: "This one's for the hard days. We're taking our time with it." }[d.meaning];
    var tone = { over_the_top: [C + " holds still better than you do. I'm only reporting.", C + " asked to be painted taller than you. We'll see."], hilarious: ['This is called sitting for a portrait. ' + C + ' is lying down, and the painter is working with it.'], sentimental: ["We're painting the look " + D + ' gives you when you come home.'], warm: ['The painter is taking extra care over ' + P + ' ears.'] }[d.tone] || [];
    var extra = [spot, together, home, meaning].filter(Boolean).concat(tone);
    if (d.person) extra.push("This one's for " + d.person + '. We want it just right.');
    var long = ['Good art takes time. This is very good art.', C + " is still holding still. A personal best, I'm told.", 'I think the painter is doing the whiskers one at a time.'];
    return { open: open, mid: extra.concat(mid), long: long };
  }
  // the studio's first line, the same on the easel before this file runs (snippets/hs-journey-choose.liquid)
  function firstLine(dog) { return 'The paints are out. ' + cap(poss(dog || 'your dog')) + ' photo goes on the easel first.'; }

  /* ------------------------------------------------------------------- Buddy
     One copy of his drawing, from the page (<template data-hs-buddy>, snippets/hs-buddy.liquid); without it the
     circle stays plain cream. */
  function buddy() { var t = document.querySelector('template[data-hs-buddy]'); return t ? t.innerHTML.trim() : ''; }

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
    // at least 200 units on the short side, at the canvas's own shape (a 200 x 200 floor squared a small phone's
    // portrait canvas and stretched the photo)
    var r = canvas.getBoundingClientRect(), k = Math.max(1, 200 / Math.max(1, Math.min(r.width, r.height))), w = Math.round(Math.max(r.width, 1) * k), h = Math.round(Math.max(r.height, 1) * k);
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
      '<image class="hs-wait__colour" href="' + esc(src) + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet" mask="url(#hs-wait-mask)"/></svg>' ;
    canvas.appendChild(stage);
    svg = stage.querySelector('svg');
    paths = Array.prototype.slice.call(svg.querySelectorAll('mask path'));
    lens = paths.map(function (p) { var L = 0; try { L = p.getTotalLength(); } catch (e) { L = w * 1.4; } p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = String(L); return L; });
    brush = canvas.querySelector('.hs-art__brush');
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
  /* --------------------------------------------------------------------- the talk */
  /* On a journey's gift page the studio's easel (snippets/hs-journey-choose.liquid) shows the dog's bubble before
     this card does. The card's bubble is the same one (Krish, 5 Nov: the screen before the painting "isn't a very
     nice experience"): the easel's label, and its words as the first line, already there, never typed again. */
  function easelTalk() { return document.querySelector('[data-hs-jm-easel] .hs-jm__talk'); }
  var adopted = null;
  function buildTalk(d, src) {
    var box = card.querySelector('[data-hs-art-painting]'), title = box && box.querySelector('[data-hs-art-title]');
    if (!box || !title) return;
    var ez = card.closest && card.closest('[data-hs-jm-paint]') ? easelTalk() : null;
    var ezWho = ez && ez.querySelector('.hs-wait__who'), ezSay = ez && ez.querySelector('.hs-wait__say');
    adopted = ezWho && ezSay && ezSay.textContent.trim() ? { who: ezWho.textContent, say: ezSay.textContent } : null;
    bubble = document.createElement('div');
    bubble.className = 'hs-wait__talk';
    bubble.innerHTML = '<button type="button" class="hs-wait__me is-buddy" data-hs-wait-buddy aria-label="Hear the next update from Buddy">' + buddy() + '</button>' +
      '<div class="hs-wait__bubble"><p class="hs-wait__who">' + esc(adopted ? adopted.who : label()) + '</p><p class="hs-wait__say" data-hs-wait-say aria-live="polite">' + (adopted ? esc(adopted.say) : '') + '</p></div>' +
      '<div class="hs-wait__fact" data-hs-wait-fact hidden><p class="hs-wait__who">Buddy\'s note</p><p class="hs-wait__fact-text"></p></div>';
    // the easel's height, held from before the card arrived, until the card has measured its own
    var h = ez && ez.style.getPropertyValue('--hs-wait-h');
    if (h) bubble.style.setProperty('--hs-wait-h', h);
    title.insertAdjacentElement('afterend', bubble);
    sayEl = bubble.querySelector('[data-hs-wait-say]');
    factEl = bubble.querySelector('[data-hs-wait-fact]');
    avatar = bubble.querySelector('[data-hs-wait-buddy]');
    avatar.addEventListener('click', function () { tap(d); });
    fitTalk(d);
  }
  function label() { return 'Buddy, at the studio'; }

  /* The bubble never changes size (Krish, 4 Nov: "Nothing on this page must randomly change size with
     volatility like that when text is generating"). Every line Buddy could say is measured once
     at the bubble's real width, and the bubble is held at the tallest of them; it is measured again only
     when the width or the fonts change, never while text is typing. The easel's bubble is measured the same
     way, over the same lines, so the two are one height. */
  function measureTalk(talk, d, who0, extra) {
    var L = lines(d), facts = window.HSBreedFacts ? window.HSBreedFacts.for(d.breed) : [], breed = breedName(d);
    var says = L.open.concat(L.mid, L.long, [firstLine(d.dog)], extra || []);
    var probe = document.createElement('div');
    probe.className = 'hs-wait__probe';
    probe.setAttribute('aria-hidden', 'true');
    probe.innerHTML = '<p class="hs-wait__who"></p><p></p>';
    talk.appendChild(probe);
    var who = probe.firstChild, p = probe.lastChild, tallest = 0;
    function measure(kind, text, list) {
      probe.className = 'hs-wait__probe ' + (kind === 'fact' ? 'hs-wait__fact' : 'hs-wait__bubble');
      p.className = kind === 'fact' ? 'hs-wait__fact-text' : 'hs-wait__say';
      who.textContent = text;
      list.forEach(function (t) { p.textContent = t; tallest = Math.max(tallest, probe.offsetHeight); });
    }
    measure('say', who0, says);
    if (facts.length) measure('fact', "Buddy's note" + (breed ? ' on ' + breed : ''), facts);
    talk.removeChild(probe);
    // in the journey's frame, never less than the height the bubble had before this script ran
    // (hs-journey-choose.css --hs-jm-talk-h), so the measuring never shrinks a bubble on screen
    var floor = parseFloat(window.getComputedStyle(talk).getPropertyValue('--hs-jm-talk-h')) || 0;
    if (tallest) talk.style.setProperty('--hs-wait-h', Math.ceil(Math.max(tallest, floor)) + 'px');
    return tallest;
  }
  function easelLines(ez) { var s = ez && ez.querySelector('.hs-wait__say'); return s && s.textContent.trim() ? [s.textContent] : []; }
  function fitEasel() {
    var ez = easelTalk();
    if (!ez || !ez.offsetWidth) return;
    var w = ez.querySelector('.hs-wait__who');
    measureTalk(ez, info(), w ? w.textContent : label(), easelLines(ez));
  }
  function fitTalk(d) {
    if (!bubble) return;
    measureTalk(bubble, d, adopted ? adopted.who : label(), adopted ? [adopted.say] : []);
    if (!fitTalk.watching) {
      fitTalk.watching = true;
      // a card going out of sight (width 0) and back is not a new width: it is never measured again for that
      // (transitions report, 5 Nov: a 54 ms stall at 4x CPU before "See it painted" moved anything)
      var w = bubble.offsetWidth, again = function () { var nw = bubble && bubble.offsetWidth; if (nw && nw !== w) { w = nw; fitTalk(info()); } };
      if (window.ResizeObserver) new ResizeObserver(function () { again(); }).observe(card);
      else window.addEventListener('resize', again);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (bubble) fitTalk(info()); });
    }
  }
  var typing = null;
  // the whole line is laid out from the first letter, with the part not yet typed held invisible, so words
  // never jump from one line to the next as they arrive
  function typed(n, text) {
    var shown = document.createElement('span'), rest = document.createElement('span');
    shown.textContent = text.slice(0, n);
    rest.className = 'hs-wait__rest';
    rest.textContent = text.slice(n);
    sayEl.textContent = '';
    sayEl.appendChild(shown);
    sayEl.appendChild(rest);
  }
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
    typed(0, text);
    typing = setInterval(function () { i += 2; typed(i, text); if (i >= text.length) { clearInterval(typing); sayEl.textContent = text; sayEl.removeAttribute('aria-label'); } }, 28);
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
  // a tap on Buddy: his next line now, and a flick of the ear (none with reduced motion)
  function tap(d) {
    if (!avatar) return;
    avatar.classList.remove('is-tapped'); void avatar.offsetWidth; avatar.classList.add('is-tapped');
    next(d, lines(d), Date.now() - start);
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
  }
  function begin() {
    var photo = card.querySelector('[data-hs-art-photo]'), src = photo && photo.getAttribute('src');
    var d = info(), L = lines(d);
    if (!built) {
      if (!buildCanvas(src)) return false;
      follow.src = src;
      buildTalk(d, src);
      // the first frame is drawn where it starts, never animated there: without this the bar shrank from the
      // sweep's 38% and the photo un-painted from full colour in the card's first half second (5 Nov)
      still(true);
      card.classList.add('has-wait');
      built = true;
      start = startTime();
    }
    clearInterval(timer);
    // the first line is the easel's, already in the bubble: the next one comes a beat from now
    if (adopted && beat === 0 && sayEl && sayEl.textContent) lastSay = Date.now();
    var tick = function () {
      if (card.getAttribute('data-state') !== 'painting') { finish(d); return; }
      follow();
      var t = Date.now() - start, f = reach(t);
      paintTo(f);
      bar(Math.min(0.95, 1 - Math.exp(-t / 70000)));
      if (Date.now() - lastSay >= BEAT) next(d, L, t);
    };
    if (!(adopted && beat === 0 && sayEl && sayEl.textContent)) next(d, L, 0);
    tick();
    if (card.classList.contains('is-still')) requestAnimationFrame(function () { requestAnimationFrame(function () { still(false); }); });
    timer = setInterval(tick, 500);
    return true;
  }
  function still(on) { if (card) card.classList.toggle('is-still', on); }
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
    built = false; beat = 0; fitTalk.watching = false; stage = bubble = null; svg = avatar = null; paths = []; lens = []; follow.src = ''; adopted = null;
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && titleWas) { document.title = titleWas; titleWas = ''; } });

  function watch() {
    card = document.querySelector('[data-hs-art]');
    // the easel's bubble takes the card's height before the card arrives, and again when the width or fonts change
    var ez = easelTalk();
    if (ez) {
      fitEasel();
      var ew = ez.offsetWidth;
      if (window.ResizeObserver) new ResizeObserver(function () { var nw = ez.offsetWidth; if (nw && nw !== ew) { ew = nw; fitEasel(); } }).observe(ez);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitEasel);
    }
    if (!card) return;
    var check = function () {
      // on a journey's gift page the card is dressed only once it is in the studio's frame (hs-journey-choose.js
      // moves it there and calls this at once), so it is measured at its own size and takes the easel's words
      var panel = document.querySelector('[data-hs-jm]:not([hidden])');
      if (panel && !(card.closest && card.closest('[data-hs-jm-paint]'))) return;
      var painting = card.getAttribute('data-state') === 'painting';
      if (painting && !timer) begin();
      else if (!painting && timer) finish(info());
    };
    if (window.MutationObserver) new MutationObserver(check).observe(card, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src', 'hidden'] });
    setInterval(check, 1500);
    check();
    watch.check = check;
  }
  window.__hsWait = { lines: lines, info: info, reach: reach, firstLine: firstLine, label: label, fitEasel: fitEasel };
  window.__hsWait.check = function () { if (watch.check) watch.check(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
