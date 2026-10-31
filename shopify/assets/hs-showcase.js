/* The example artwork under the first screen (sections/hs-showcase.liquid).
   A slider that fades photo, painting and gift into each other, a reel through the six sets and a
   drifting row of styles, gifts and moods. Without this file every picture is already on the page. */
(function () {
  'use strict';
  var root = document.querySelector('[data-hss]');
  if (!root || root.__hss) return;
  root.__hss = true;

  // photo to painting to gift: 0 is the photo, 1 the painting, 2 the gift
  var flow = root.querySelector('[data-hss-flow]');
  if (flow) {
    var figs = flow.querySelectorAll('[data-hss-stage] .hss-fig');
    var range = flow.querySelector('[data-hss-range]');
    var ctl = flow.querySelector('[data-hss-ctl]');
    var steps = flow.querySelectorAll('[data-hss-step]');
    var names = ['Photo', 'Painting', 'Gift'];
    if (figs.length === 3 && range && ctl) {
      flow.classList.add('is-live');
      ctl.hidden = false;
      var paint = function (v) {
        v = Math.max(0, Math.min(2, v));
        for (var i = 0; i < 3; i++) figs[i].style.opacity = String(Math.max(0, 1 - Math.abs(v - i)));
        var near = Math.round(v);
        range.setAttribute('aria-valuetext', names[near]);
        for (var s = 0; s < steps.length; s++) steps[s].classList.toggle('is-on', s === near);
        // frames that carry no weight leave the reading order
        for (var f = 0; f < 3; f++) figs[f].setAttribute('aria-hidden', f === near ? 'false' : 'true');
      };
      range.addEventListener('input', function () { paint(parseFloat(range.value)); });
      for (var s = 0; s < steps.length; s++) {
        steps[s].addEventListener('click', function () {
          var to = parseFloat(this.getAttribute('data-hss-step'));
          range.value = String(to);
          paint(to);
        });
      }
      // it opens on the painting, the reason to be here (audit, 30 Oct), and nudges once toward the
      // gift the first time it comes into view, so the slider reads as something to drag
      paint(1);
      var touched = false;
      range.addEventListener('pointerdown', function () { touched = true; });
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!still && 'IntersectionObserver' in window) {
        var seen = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          seen.disconnect();
          var t0 = null;
          var step = function (t) {
            if (touched) return;
            if (t0 === null) t0 = t;
            var k = Math.min(1, (t - t0) / 1400), v = 1 + 0.45 * Math.sin(Math.PI * k);
            range.value = String(v); paint(v);
            if (k < 1) window.requestAnimationFrame(step);
          };
          window.setTimeout(function () { window.requestAnimationFrame(step); }, 400);
        }, {threshold: 0.6});
        seen.observe(flow);
      }
    }
  }

  // Krish, 31 Oct: "it looks so intense to just have all the pictures visible at once". The sets fade
  // through one at a time and the rest drift by in one row. Both stop when out of view, when the tab is
  // hidden, under a pointer or keyboard focus, and on their pause button (motion past 5 s needs one).
  // With reduced motion neither starts, and both stay the swipe rows the markup draws.
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dragged = false; // a drag is not a tap, so it never opens the large view
  var watch = function (el, onChange) {
    var state = {seen: false, over: false, focus: false, paused: false};
    var fire = function () { onChange(state.seen && !state.over && !state.focus && !state.paused && !document.hidden); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { state.seen = es[0].isIntersecting; fire(); }, {threshold: 0.25}).observe(el);
    else state.seen = true;
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { state.over = true; fire(); } });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { state.over = false; fire(); } });
    el.addEventListener('focusin', function () { state.focus = true; fire(); });
    el.addEventListener('focusout', function (e) { state.focus = el.contains(e.relatedTarget); fire(); });
    document.addEventListener('visibilitychange', fire);
    return {state: state, fire: fire};
  };
  var pauser = function (btn, w) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      w.state.paused = !w.state.paused;
      btn.setAttribute('aria-pressed', w.state.paused ? 'true' : 'false');
      btn.textContent = w.state.paused ? 'Play' : 'Pause';
      w.fire();
    });
  };

  // the six sets, one at a time: a fade every 2.2 s, a swipe or an arrow key skips, a fast flick skips two
  var reel = root.querySelector('[data-hss-reel]');
  var rtrack = reel && reel.querySelector('[data-hss-reel-track]');
  var slides = rtrack ? rtrack.children : [];
  if (reel && slides.length > 1 && !calm) {
    reel.classList.add('is-live');
    var rctl = reel.querySelector('[data-hss-reel-ctl]'), ticks = reel.querySelector('[data-hss-ticks]');
    rctl.hidden = false;
    rtrack.setAttribute('aria-roledescription', 'carousel');
    rtrack.setAttribute('aria-label', 'Six example sets');
    rtrack.tabIndex = 0;
    var cur = 0, timer = null, playing = false;
    var dots = [];
    for (var d = 0; d < slides.length; d++) {
      var cap = slides[d].querySelector('figcaption strong');
      var dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'hss-tick';
      dot.setAttribute('aria-label', 'Show ' + (cap ? cap.textContent : 'set ' + (d + 1)));
      dot.setAttribute('data-i', String(d));
      dot.addEventListener('click', function () { go(+this.getAttribute('data-i')); restart(); });
      ticks.appendChild(dot); dots.push(dot);
    }
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      for (var k = 0; k < slides.length; k++) {
        var on = k === cur;
        slides[k].classList.toggle('is-on', on);
        slides[k].setAttribute('aria-hidden', on ? 'false' : 'true');
        var f = slides[k].querySelector('.hss-fig'); if (f) f.tabIndex = on ? 0 : -1;
        dots[k].setAttribute('aria-current', on ? 'true' : 'false');
      }
      // the next picture loads before its turn
      var nx = slides[(cur + 1) % slides.length].querySelector('img'); if (nx) nx.loading = 'eager';
    };
    var restart = function () { window.clearInterval(timer); timer = playing ? window.setInterval(function () { go(cur + 1); }, 2200) : null; };
    var rw = watch(reel, function (run) { if (run === playing) return; playing = run; rtrack.setAttribute('aria-live', run ? 'off' : 'polite'); restart(); });
    pauser(reel.querySelector('[data-hss-pause]'), rw);
    rtrack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1); restart(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1); restart(); e.preventDefault(); }
    });
    var sx = null, sy = 0, st = 0;
    rtrack.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; st = e.timeStamp; dragged = false; });
    rtrack.addEventListener('pointermove', function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 8) dragged = true; });
    rtrack.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy, v = Math.abs(dx) / Math.max(1, e.timeStamp - st);
      sx = null;
      if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx)) return;
      var n = v > 1.2 ? 2 : 1;
      go(cur + (dx < 0 ? n : -n)); restart();
    });
    rtrack.addEventListener('pointercancel', function () { sx = null; });
    go(0);
  }

  // styles, gifts and moods in one row that drifts left by itself; a drag moves it under the finger and
  // a flick throws it, faster the harder the flick, then it eases back to the drift
  var strip = root.querySelector('[data-hss-strip]');
  var view = strip && strip.querySelector('[data-hss-strip-view]');
  var track = view && view.querySelector('[data-hss-strip-track]');
  if (strip && track && track.children.length > 2 && !calm && window.requestAnimationFrame) {
    strip.classList.add('is-live');
    strip.querySelector('[data-hss-strip-ctl]').hidden = false;
    // a second copy makes the loop seamless; it is for the eye only
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-hss-copy', '');
      c.querySelectorAll('img').forEach(function (im) { im.alt = ''; });
      c.querySelectorAll('.hss-fig').forEach(function (f) { f.tabIndex = -1; });
      track.appendChild(c);
    });
    var x = 0, fling = 0, last = 0, run = false, hold = null;
    var BASE = window.innerWidth < 720 ? 32 : 44; // px per second
    var loop = function () { return track.scrollWidth / 2; };
    var place = function () {
      var W = loop(); if (W > 0) { x = x % W; if (x > 0) x -= W; }
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    };
    var tick = function (t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      if (!hold) {
        x -= ((run ? BASE : 0) + fling) * dt;
        fling *= Math.pow(0.12, dt); // a flick fades out in about a second
        if (Math.abs(fling) < 2) fling = 0;
        place();
      }
      if (run || fling || hold) window.requestAnimationFrame(tick); else last = 0;
    };
    var kick = function () { if (!last) window.requestAnimationFrame(tick); };
    var sw = watch(strip, function (go) { run = go; kick(); });
    pauser(strip.querySelector('[data-hss-pause]'), sw);
    view.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      hold = {x: e.clientX, y: e.clientY, at: e.timeStamp, x0: x, v: 0, lx: e.clientX, lt: e.timeStamp, axis: null};
      dragged = false; fling = 0; kick();
    });
    view.addEventListener('pointermove', function (e) {
      if (!hold) return;
      var dx = e.clientX - hold.x, dy = e.clientY - hold.y;
      if (!hold.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        hold.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (hold.axis === 'x') { try { view.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      if (hold.axis === 'y') { hold = null; return; }
      if (hold.axis !== 'x') return;
      dragged = true;
      x = hold.x0 + dx; place();
      var ddt = e.timeStamp - hold.lt;
      if (ddt > 0) { hold.v = 0.7 * hold.v + 0.3 * ((e.clientX - hold.lx) / ddt) * 1000; hold.lx = e.clientX; hold.lt = e.timeStamp; }
    });
    var let_go = function () {
      if (!hold) return;
      // dragging left (negative velocity) throws it forward, the way it already drifts
      if (hold.axis === 'x') fling = Math.max(-2400, Math.min(2400, -hold.v));
      hold = null; kick();
    };
    view.addEventListener('pointerup', let_go);
    view.addEventListener('pointercancel', let_go);
    place();
  }

  // tap any Example to see it large; Escape, the close button or a tap on the backdrop closes it
  var box = null, last = null;
  var close = function () { if (!box) return; box.remove(); box = null; document.documentElement.style.overflow = ''; if (last) last.focus(); };
  root.addEventListener('click', function (e) {
    if (dragged) { dragged = false; return; }
    var hit = e.target.closest && e.target.closest('.hss-fig');
    var img = hit && hit.querySelector('img');
    var copy = img && img.closest('[data-hss-copy]');
    if (copy) { // a copy in the strip opens its original, which carries the alt text
      var row = Array.prototype.slice.call(copy.parentNode.children);
      img = row[row.indexOf(copy) - row.length / 2].querySelector('img');
    }
    if (!img || img.closest('[data-hss-stage]')) return;
    last = img.closest('.hss-fig');
    box = document.createElement('div');
    box.className = 'hss-zoom'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', img.alt || 'Example');
    box.innerHTML = '<button type="button" class="hss-zoom__close" aria-label="Close">×</button>';
    var big = document.createElement('img'); big.src = img.currentSrc || img.src; big.alt = img.alt; box.appendChild(big);
    box.addEventListener('click', function (ev) { if (ev.target !== big) close(); });
    document.body.appendChild(box); document.documentElement.style.overflow = 'hidden';
    box.querySelector('.hss-zoom__close').focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  root.querySelectorAll('.hss-fig').forEach(function (f) { if (!f.closest('[data-hss-stage]') && !f.closest('[data-hss-copy]')) { if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '0'); f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var i = f.querySelector('img'); if (i) i.click(); } }); } });

  // the button goes back to the start of the journey
  var top = root.querySelector('[data-hss-top]');
  if (top) {
    top.addEventListener('click', function (e) {
      var go = document.querySelector('[data-hsj-go="name"]');
      if (!go) return;
      e.preventDefault();
      window.scrollTo(0, 0);
      go.focus();
    });
  }
})();
