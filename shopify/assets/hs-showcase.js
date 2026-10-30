/* The example artwork under the first screen (sections/hs-showcase.liquid).
   Two small jobs: a slider that fades photo, painting and gift into each other, and tabs for the
   three gifts. Without this file every picture is already on the page. */
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

  // one gift at a time
  var gifts = root.querySelector('[data-hss-gifts]');
  if (gifts) {
    var tabs = gifts.querySelectorAll('[data-hss-tab]');
    var panels = gifts.querySelectorAll('[data-hss-panel]');
    var bar = gifts.querySelector('[data-hss-tabs]');
    if (tabs.length && panels.length && bar) {
      gifts.classList.add('is-live');
      bar.hidden = false;
      var show = function (key) {
        for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-selected', tabs[i].getAttribute('data-hss-tab') === key ? 'true' : 'false');
        for (var p = 0; p < panels.length; p++) panels[p].hidden = panels[p].getAttribute('data-hss-panel') !== key;
      };
      for (var t = 0; t < tabs.length; t++) {
        tabs[t].addEventListener('click', function () { show(this.getAttribute('data-hss-tab')); });
      }
      show('mug');
    }
  }

  // tap any Example to see it large; Escape, the close button or a tap on the backdrop closes it
  var box = null, last = null;
  var close = function () { if (!box) return; box.remove(); box = null; document.documentElement.style.overflow = ''; if (last) last.focus(); };
  root.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('.hss-fig img');
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
  root.querySelectorAll('.hss-fig').forEach(function (f) { if (!f.closest('[data-hss-stage]')) { f.setAttribute('tabindex', '0'); f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var i = f.querySelector('img'); if (i) i.click(); } }); } });

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
