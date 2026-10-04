/* Heartside v2 behaviour. Loaded (deferred) by snippets/hs2-head.liquid.
   One shared review state drives every section: the dog's name typed in the hero
   rewrites the whole page, the HR-26 answers drive the live poster, the story
   card and the links to product pages. State lives in sessionStorage (key
   "hs2-review") so it survives page changes in the same visit. */
(function () {
  'use strict';
  if (window.__hs2) return;
  window.__hs2 = true;

  var KEY = 'hs2-review';
  var DEFAULTS = { dog: 'Biscuit', person: 'Sarah', cupboard: '1,412', improvement: 'Leaving', incident: 'The sock', enemy: 'The mailman', voice: false };
  var state = load();

  function load() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    // answers carried in the URL (from the homepage) win over storage
    try {
      var q = new URLSearchParams(window.location.search);
      ['dog', 'person', 'cupboard', 'improvement', 'incident', 'enemy'].forEach(function (k) { if (q.get(k)) s[k] = q.get(k).slice(0, 40); });
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
  function possessive(n) { return /s$/i.test(n) ? n + "'" : n + "'s"; }
  function lines(kind) {
    var el = document.querySelector('script[data-hs2-lines="' + kind + '"]');
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }

  function render() {
    var dog = val('dog'), person = val('person');
    var map = {
      dog: dog, DOG: dog.toUpperCase(), dogs: possessive(dog), person: person, cupboard: val('cupboard'),
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
    document.querySelectorAll('[data-hs2-voice]').forEach(function (b) {
      var on = val('voice');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on
        ? 'Added: ' + dog + ' reads it out loud (15s video, emailed) · +$12'
        : '+ Hear ' + dog + ' read it out loud · 15s video · $12';
    });
    // links to product pages carry the answers
    document.querySelectorAll('[data-hs2-carry]').forEach(function (a) {
      var base = a.getAttribute('data-hs2-base') || a.getAttribute('href');
      if (!a.getAttribute('data-hs2-base')) a.setAttribute('data-hs2-base', base);
      if (!base || base.charAt(0) === '#') return;
      var p = new URLSearchParams();
      ['dog', 'person', 'cupboard', 'improvement', 'incident', 'enemy'].forEach(function (k) { p.set(k, val(k)); });
      if (val('voice')) p.set('video', '1');
      a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?' : '&') + p.toString());
    });
    // hidden line-item properties on product forms
    document.querySelectorAll('[data-hs2-prop]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-prop');
      inp.value = k === 'voice' ? (val('voice') ? 'Yes' : '') : val(k);
    });
    var answers = document.querySelector('[data-hs2-answers]');
    if (answers && (state.dog || state.person)) answers.hidden = false;
  }

  function bindInputs() {
    document.querySelectorAll('[data-hs2-input]').forEach(function (inp) {
      if (inp.__hs2) return; inp.__hs2 = true;
      var k = inp.getAttribute('data-hs2-input');
      if (state[k]) inp.value = state[k];
      inp.addEventListener('input', function () { state[k] = inp.value; save(); render(); });
    });
    document.querySelectorAll('[data-hs2-chip]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { state[b.getAttribute('data-hs2-chip')] = b.getAttribute('data-value'); save(); render(); });
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
        var url = URL.createObjectURL(f);
        document.querySelectorAll('[data-hs2-photo]').forEach(function (img) { img.src = url; img.removeAttribute('srcset'); });
      });
    });
    document.querySelectorAll('[data-hs2-story]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function (e) { e.preventDefault(); storyCard(b); });
    });
  }

  /* ---------------------------------------------- the free story card (1080 x 1920) */
  function wrap(ctx, text, maxW) {
    var words = text.split(' '), out = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else { line = t; }
    });
    if (line) out.push(line);
    return out;
  }
  function storyCard(btn) {
    var status = document.querySelector('[data-hs2-story-status]');
    var dog = val('dog'), person = val('person');
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('700 40px "HS Courier Prime"'), document.fonts.load('400 40px "HS Courier Prime"'), document.fonts.load('700 120px "HS Fraunces"')
    ]) : Promise.resolve();
    fonts.then(function () {
      // Mirrors the 300 x 533 card on the page at 3.6x (1080 x 1920).
      var S = 3.6, W = 1080, H = 1920, pad = 24 * S, c = document.createElement('canvas');
      c.width = W; c.height = H;
      var x = c.getContext('2d');
      var mono = '"HS Courier Prime", "Courier New", monospace';
      x.fillStyle = '#FFFDF9'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#121010'; x.textBaseline = 'top';
      // top: LEAKED · HR-26 (12px bold, 0.1em tracking)
      x.font = '700 ' + (12 * S) + 'px ' + mono;
      if ('letterSpacing' in x) x.letterSpacing = (1.2 * S) + 'px';
      x.fillText('LEAKED · HR-26', pad, pad);
      if ('letterSpacing' in x) x.letterSpacing = '0px';
      // bottom: question and domain
      x.font = '400 ' + (12 * S) + 'px ' + mono;
      var domainY = H - pad - 12 * S * 1.2;
      x.fillText('heartside.io', pad, domainY);
      x.font = '400 ' + (13 * S) + 'px ' + mono;
      x.fillText("Who is your dog's person?", pad, domainY - 4 * S - 13 * S * 1.2);
      // middle: who line (14px) and the big line (Fraunces 40px, line-height 1)
      var maxW = W - pad * 2;
      x.font = '400 ' + (14 * S) + 'px ' + mono;
      var who = wrap(x, dog + ' has reviewed ' + person + '.', maxW);
      x.font = '700 ' + (40 * S) + 'px "HS Fraunces", Georgia, serif';
      var big = wrap(x, 'Leaving the house:', maxW);
      var whoH = who.length * 14 * S * 1.3, bigH = (big.length + 1) * 40 * S;
      var midY = (H - (whoH + 10 * S + bigH)) / 2;
      x.font = '400 ' + (14 * S) + 'px ' + mono;
      who.forEach(function (l, i) { x.fillText(l, pad, midY + i * 14 * S * 1.3); });
      var y = midY + whoH + 10 * S;
      x.font = '700 ' + (40 * S) + 'px "HS Fraunces", Georgia, serif';
      big.forEach(function (l) { x.fillText(l, pad, y); y += 40 * S; });
      x.font = '400 ' + (36 * S) + 'px "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif';
      x.fillText('★☆☆☆☆', pad, y + 2 * S);
      // CONFIDENTIAL stamp: right 16px, top 46%, rotated -12deg, 3px border, 4px 8px padding
      x.font = '700 ' + (16 * S) + 'px ' + mono;
      var tw = x.measureText('CONFIDENTIAL').width, bw = tw + 16 * S + 6 * S, bh = 16 * S * 1.2 + 8 * S + 6 * S;
      x.save();
      x.translate(W - 16 * S - bw / 2, H * 0.46 + bh / 2);
      x.rotate(-12 * Math.PI / 180);
      x.strokeStyle = '#A8284E'; x.lineWidth = 3 * S; x.fillStyle = '#A8284E';
      x.beginPath();
      if (x.roundRect) x.roundRect(-bw / 2, -bh / 2, bw, bh, 6 * S); else x.rect(-bw / 2, -bh / 2, bw, bh);
      x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('CONFIDENTIAL', 0, 0);
      x.restore();
      c.toBlob(function (blob) {
        var name = dog.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-review.png';
        var file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: "Who is your dog's person? heartside.io" }).catch(function () {});
          return;
        }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        if (status) status.textContent = 'Saved. Post it, tag the person.';
      }, 'image/png');
    });
  }

  /* ------------------------------------------------------ sticky "Read review" pill */
  function sticky() {
    var bar = document.querySelector('[data-hs2-sticky]');
    if (!bar || bar.__hs2 || !('IntersectionObserver' in window)) return; bar.__hs2 = true;
    var watch = [document.querySelector('[data-hs2-hero]'), document.querySelector('#review'), document.querySelector('footer')].filter(Boolean);
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
  }

  /* Best effort: copy the homepage answers into a personalizer on the product page
     (Teeinblue) when its text fields carry recognisable labels. Teeinblue documents no
     prefill API, so this only fills empty fields and never blocks anything. */
  function autofill() {
    var form = document.querySelector('[data-hs2-answers]');
    if (!form || !(state.dog || state.person)) return;
    var rules = [
      { re: /(dog|pet|manager).*name|name.*(dog|pet)|^manager/i, k: 'dog' },
      { re: /your name|employee|person|owner|human/i, k: 'person' },
      { re: /cupboard|treat|times/i, k: 'cupboard' }
    ];
    function fill() {
      document.querySelectorAll('form[action*="/cart/add"] input[type="text"], form[action*="/cart/add"] textarea, [class*="teeinblue"] input[type="text"]').forEach(function (inp) {
        if (inp.value || inp.__hs2fill || inp.closest('[data-hs2-answers]')) return;
        var label = (inp.labels && inp.labels[0] && inp.labels[0].textContent) || inp.getAttribute('placeholder') || inp.getAttribute('aria-label') || inp.name || '';
        for (var i = 0; i < rules.length; i++) {
          if (rules[i].re.test(label)) {
            inp.__hs2fill = true;
            var setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'value');
            if (setter && setter.set) setter.set.call(inp, val(rules[i].k)); else inp.value = val(rules[i].k);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });
    }
    fill();
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(fill);
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 15000);
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

  function init() { bindInputs(); render(); sticky(); gallery(); autofill(); clearHeader(); }
  window.addEventListener('resize', clearHeader);
  window.addEventListener('load', function () { clearHeader(); setTimeout(clearHeader, 600); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('shopify:section:load', init);
})();
