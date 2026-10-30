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
      paint(0);
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
