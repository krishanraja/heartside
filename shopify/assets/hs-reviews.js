/* What people say (sections/hs-reviews.liquid): the carousel moves one card every few seconds and loops.
   It stays still while the pointer is on it, while anything in it has focus, for 8 s after a touch or swipe,
   while the tab is hidden, after the Pause button, and always under reduced motion. Swipe and the arrows work
   at any time. The track is native scroll with snap, so nothing breaks without this script. */
(function () {
  'use strict';
  function init(root) {
    if (root.__hsr) return; root.__hsr = true;
    var track = root.querySelector('[data-hsr-track]');
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-hsr-card]'));
    if (!track || cards.length < 2) return;
    var ctl = root.querySelector('[data-hsr-ctl]'), pauseBtn = root.querySelector('[data-hsr-pause]');
    var dotsEl = root.querySelector('[data-hsr-dots]');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var every = (parseInt(root.getAttribute('data-hsr-seconds'), 10) || 6) * 1000;
    var paused = false, hover = false, focus = false, touchedAt = 0, timer = null;
    ctl.hidden = false;

    cards.forEach(function () { var d = document.createElement('span'); d.className = 'hsr__dot'; dotsEl.appendChild(d); });
    var dots = dotsEl.children;

    function step() { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; }
    function index() { return Math.round(track.scrollLeft / Math.max(1, step())); }
    function lastStart() { return Math.max(0, track.scrollWidth - track.clientWidth); }
    function mark() {
      var i = Date.now() < settle ? cur : Math.min(index(), cards.length - 1);
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('is-on', k === i);
    }
    // the card the carousel is heading to: taps in quick succession count from it, not from mid-scroll
    var cur = 0, settle = 0;
    function maxIndex() { return Math.max(0, Math.round(lastStart() / Math.max(1, step()))); }
    function go(dir) {
      var last = maxIndex();
      cur = dir > 0 ? (cur >= last ? 0 : cur + 1) : (cur <= 0 ? last : cur - 1);
      track.scrollTo({ left: Math.min(cur * step(), lastStart()), behavior: reduce ? 'auto' : 'smooth' });
      settle = Date.now() + 900;
    }
    function still() { return paused || reduce || hover || focus || document.hidden || Date.now() - touchedAt < 8000; }
    function tick() { if (!still()) go(1); }
    function start() { if (!timer) timer = setInterval(tick, every); }

    root.querySelector('[data-hsr-prev]').addEventListener('click', function () { touchedAt = Date.now(); go(-1); });
    root.querySelector('[data-hsr-next]').addEventListener('click', function () { touchedAt = Date.now(); go(1); });
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'Play the reviews' : 'Pause the reviews');
    });
    if (reduce) { paused = true; pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', 'Play the reviews'); pauseBtn.hidden = true; }
    track.addEventListener('mouseenter', function () { hover = true; });
    track.addEventListener('mouseleave', function () { hover = false; });
    root.addEventListener('focusin', function (e) { if (!e.target.closest('[data-hsr-ctl]')) focus = true; });
    root.addEventListener('focusout', function () { focus = false; });
    ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { track.addEventListener(ev, function () { touchedAt = Date.now(); }, { passive: true }); });
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; mark(); if (Date.now() > settle) cur = Math.min(index(), maxIndex()); });
    }, { passive: true });
    mark();
    // start only once it is near the screen, so nothing moves out of sight
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else { clearInterval(timer); timer = null; } }); }, { rootMargin: '100px' }).observe(root);
    } else start();
    root.__hsrApi = { go: go, index: index, still: still, target: function () { return cur; } };
  }
  function all() { document.querySelectorAll('[data-hsr]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  document.addEventListener('shopify:section:load', all);
})();
