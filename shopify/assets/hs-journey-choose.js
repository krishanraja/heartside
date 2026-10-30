/* Journey mode on a gift page (snippets/hs-journey-choose.liquid). Krish, 29 Oct: "wow the user
   with the artwork mockup and they're so enamoured by it that they have to continue and purchase
   it", radical simplicity, no scrolling, nothing asked twice, and always offer the bundle.

   hs2.js does the painting: in journey mode it sends the saved photo once by itself (journey()).
   This panel only shows it: the painting card while Teeinblue paints, then the painting on every
   gift (this gift's real Teeinblue preview, the others as labelled previews), this gift's own
   options as pills that drive Teeinblue's radios, the bundle, one tick that is hs2's own approval
   box, and one button that is Teeinblue's own Add to cart, so the order, the print file and the
   checkout image follow the tested path. Extra gifts go in hs2's gift queue and paint on their own
   pages next, in journey mode too (paint once, more on demand: Krish, 29 Oct). */
(function () {
  'use strict';
  if (window.__hsjm) return;
  window.__hsjm = true;
  var GIFTS = ['mug', 'blanket', 'print'];
  var NAME = { mug: 'Mug', blanket: 'Sherpa blanket', print: 'Framed portrait' };
  var QKEY = 'hs2-queue';
  var root, j, st, here, picked = {}, art = null, started = Date.now();

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { n = Number(n) || 0; return '$' + (n % 1 ? n.toFixed(2) : String(n)); }
  function state() { try { return JSON.parse(window.sessionStorage.getItem('hs2-review') || '{}') || {}; } catch (e) { return {}; } }
  function gifts() { return (j && j.gifts) || {}; }
  // which gift this page is, from the journey's own list of product handles
  function giftHere() { var h = root.getAttribute('data-hs-jm-handle'); for (var i = 0; i < GIFTS.length; i++) if (gifts()[GIFTS[i]] && gifts()[GIFTS[i]].handle === h) return GIFTS[i]; return ''; }
  function painted() {
    var a = document.querySelector('[data-hs-art]'), img = a && a.querySelector('[data-hs-art-result]');
    return a && a.getAttribute('data-state') === 'done' && img && img.getAttribute('src') ? img.getAttribute('src') : '';
  }

  /* -------------------------------------------------------------- previews
     The painted gift shows Teeinblue's own preview. The others are the same painting on the
     product, drawn in the page and labelled Preview: each is painted for its own shape when it
     is added (one painting per gift campaign). */
  function preview(g, src) {
    var bg = 'style="background-image:url(\'' + esc(src) + '\')"';
    if (g === 'mug') return '<span class="hs-jm-mug"><span class="hs-jm-mug__body" ' + bg + '></span><span class="hs-jm-mug__handle"></span></span>';
    if (g === 'print') return '<span class="hs-jm-frame"><span class="hs-jm-frame__mat"><span class="hs-jm-frame__art" ' + bg + '></span></span></span>';
    return '<span class="hs-jm-blanket"><span class="hs-jm-blanket__art" ' + bg + '></span></span>';
  }
  function tiles(src) {
    var order = [here].concat(GIFTS.filter(function (g) { return g !== here && gifts()[g] && gifts()[g].url; }));
    return order.map(function (g) {
      var mine = g === here, on = mine || !!picked[g], x = gifts()[g] || {};
      return '<button type="button" class="hs-jm-tile' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '"' + (mine ? ' aria-disabled="true"' : '') + ' data-hs-jm-gift="' + g + '">' +
        '<span class="hs-jm-tile__art">' + preview(g, src) + '<span class="hs-jm-tile__tag">' + (mine ? 'Ready' : 'Preview') + '</span></span>' +
        '<span class="hs-jm-tile__name">' + NAME[g] + '</span><span class="hs-jm-tile__price">' + (mine ? priceHere() : 'from ' + money(x.price)) + '</span></button>';
    }).join('');
  }

  /* ---------------------------------------------------------- this gift's options
     Teeinblue's own variant radios (mug colour, frame), shown as pills that click them. */
  function options() {
    return Array.prototype.map.call(document.querySelectorAll('#buy .tee-option:not(.sr-only)'), function (opt, i) {
      var title = opt.querySelector('.tee-option__title'), radios = opt.querySelectorAll('input[type="radio"]');
      if (radios.length < 2) return '';
      return '<div class="hs-jm-opt"><span class="hs-jm-opt__name">' + esc(title ? title.textContent.trim() : '') + '</span><span class="hs-jm-opt__row">' +
        Array.prototype.map.call(radios, function (r, k) {
          if (r.closest('[hidden]')) return '';
          var lab = r.id && document.querySelector('label[for="' + r.id + '"]'), text = (lab ? lab.textContent : r.value).trim();
          return '<button type="button" class="hs-jm-pill' + (r.checked ? ' is-on' : '') + '" aria-pressed="' + r.checked + '" data-hs-jm-opt="' + i + ':' + k + '">' + esc(text) + '</button>';
        }).join('') + '</span></div>';
    }).join('');
  }
  function priceHere() {
    var p = document.querySelector('#buy [data-hs2-price]');
    return p ? p.textContent.trim() : money((gifts()[here] || {}).price);
  }
  function total() {
    var n = parseFloat(priceHere().replace(/[^0-9.]/g, '')) || 0;
    GIFTS.forEach(function (g) { if (g !== here && picked[g]) n += Number((gifts()[g] || {}).price) || 0; });
    return n;
  }
  function count() { return 1 + GIFTS.filter(function (g) { return g !== here && picked[g]; }).length; }

  // hs2 touches the painting card often; the tiles are only redrawn when they change, so a tap
  // never lands on a button that was just replaced
  function set(el, html) { if (el.__html !== html) { el.innerHTML = html; el.__html = html; } }
  /* the one free repaint: the four tones, with the journey's icons, in a sheet over the gifts screen */
  var TONES = [['sentimental', 'Sentimental', '<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'],
    ['warm', 'Warm', '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'],
    ['hilarious', 'Hilarious', '<circle cx="12" cy="12" r="9"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0Z"/><path d="M8 9.5c.6-.8 1.6-.8 2.2 0M13.8 9.5c.6-.8 1.6-.8 2.2 0"/>'],
    ['over_the_top', 'Over the top', '<path d="M3.5 8.5 7.5 12 12 5.5 16.5 12l4-3.5-1.8 9.5H5.3Z"/><path d="M5.5 20.5h13"/>']];
  function sheet(open) {
    var box = root.querySelector('[data-hs-jm-sheet]');
    if (open) {
      var now = (j && j.tone) || '';
      root.querySelector('[data-hs-jm-tones]').innerHTML = TONES.map(function (t) {
        return '<button type="button" class="hs-jm-tone hs-jm-tone--' + t[0] + '"' + (t[0] === now ? ' aria-current="true"' : '') + ' data-hs-jm-tone="' + t[0] + '"><svg class="hs-jm-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + t[2] + '</svg><span>' + t[1] + (t[0] === now ? ' (now)' : '') + '</span></button>';
      }).join('');
    }
    box.hidden = !open;
  }
  function paint() {
    var src = painted(), dog = st.dog || 'your dog';
    var title = root.querySelector('[data-hs-jm-title]'), choose = root.querySelector('[data-hs-jm-choose]'), slot = root.querySelector('[data-hs-jm-paint]');
    if (!src) {
      // no painting under way a few seconds in: the photo did not carry over (private mode, a cleared
      // device), so one button opens the phone's picker and the painting starts from it
      var idle = !art || art.hidden || art.getAttribute('data-state') === 'idle', late = Date.now() - started > 5000;
      root.querySelector('[data-hs-jm-nophoto]').hidden = !(idle && late);
      root.querySelector('[data-hs-jm-photo]').textContent = 'Choose ' + (st.dog ? st.dog + "'s" : 'your dog\'s') + ' photo';
      title.textContent = idle && late ? 'One photo of ' + dog : 'Painting ' + dog;
      choose.hidden = true; slot.hidden = false; root.querySelector('[data-hs-jm-repaint]').hidden = true; return;
    }
    title.textContent = dog + ' on every gift';
    slot.hidden = true; choose.hidden = false;
    root.querySelector('[data-hs-jm-repaint]').hidden = !(window.__hs2api.journeyRepaintLeft && window.__hs2api.journeyRepaintLeft());
    root.querySelector('[data-hs-jm-lead]').textContent = 'Tap to add the others. Each is painted for its shape when you add it.';
    set(root.querySelector('[data-hs-jm-tiles]'), tiles(src));
    set(root.querySelector('[data-hs-jm-options]'), options());
    root.querySelector('[data-hs-jm-tick-text]').textContent = 'Yes, this is ' + dog;
    var n = count();
    root.querySelector('[data-hs-jm-bundle]').textContent = n === 1 ? 'Add a second gift and save 15%. All three save 20%.' : n === 2 ? 'Two gifts: 15% off at checkout. Add the third for 20%.' : 'All three: 20% off at checkout.';
    button();
  }
  function button() {
    var b = root.querySelector('[data-hs-jm-add]'), tick = root.querySelector('[data-hs-jm-tick]');
    var n = count();
    b.textContent = 'Add ' + (n === 1 ? 'to cart' : n + ' gifts') + ' · ' + money(total());
    b.disabled = !tick.checked || !painted();
  }

  /* ----------------------------------------------------------------- events */
  function onClick(e) {
    var t = e.target.closest('button');
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-hs-jm-gift')) {
      var g = t.getAttribute('data-hs-jm-gift');
      if (g === here) return;
      picked[g] = !picked[g]; paint(); return;
    }
    if (t.hasAttribute('data-hs-jm-opt')) {
      var at = t.getAttribute('data-hs-jm-opt').split(':'), opt = document.querySelectorAll('#buy .tee-option:not(.sr-only)')[+at[0]];
      var r = opt && opt.querySelectorAll('input[type="radio"]')[+at[1]];
      if (r) { r.click(); setTimeout(paint, 150); }
      return;
    }
    if (t.hasAttribute('data-hs-jm-add')) add();
    if (t.hasAttribute('data-hs-jm-photo') && window.__hs2api.journeyPick) window.__hs2api.journeyPick();
    if (t.hasAttribute('data-hs-jm-repaint')) sheet(true);
    if (t.hasAttribute('data-hs-jm-keep')) sheet(false);
    if (t.hasAttribute('data-hs-jm-tone')) {
      sheet(false);
      if (window.__hs2api.journeyRepaint && window.__hs2api.journeyRepaint(t.getAttribute('data-hs-jm-tone'))) {
        root.querySelector('[data-hs-jm-tick]').checked = false; paint();
      } else root.querySelector('[data-hs-jm-status]').textContent = "The repaint couldn't start. Your painting is kept.";
    }
  }
  // the tick is hs2's own approval box, which also answers Teeinblue's agreement; hs2 refuses it
  // while the painting is still being saved, and the tick follows what hs2 decided
  function onTick(e) {
    var accept = document.querySelector('[data-hs2-artwork-accept]'), status = root.querySelector('[data-hs-jm-status]');
    if (accept) { accept.checked = e.target.checked; accept.dispatchEvent(new Event('change', { bubbles: true })); e.target.checked = accept.checked; }
    if (status) status.textContent = e.target.checked || !accept ? '' : 'The painting is still being saved. Try again in a moment.';
    button();
  }
  function add() {
    var atc = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc'), status = root.querySelector('[data-hs-jm-status]');
    if (!atc) { status.textContent = 'The cart is still loading. Try again in a moment.'; return; }
    // the extra gifts paint next, each on its own page, in journey mode
    var q = [{ url: (gifts()[here] || {}).url || location.pathname + '?journey=1', title: NAME[here] }];
    GIFTS.forEach(function (g) { var x = gifts()[g]; if (g !== here && picked[g] && x && x.url) q.push({ url: x.url, title: NAME[g] }); });
    try { if (q.length > 1) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); } catch (err) { /* hs2's own queue bar still offers the next gift */ }
    status.textContent = 'Adding ' + (st.dog || 'your dog') + '…';
    root.querySelector('[data-hs-jm-add]').disabled = true;
    cart().then(function (c) { var before = lines(c, here); atc.click(); watchAdded(q, before); });
  }
  function handleOf(url) { var m = /\/products\/([^/?#]+)/.exec(url || ''); return m ? m[1] : ''; }
  function cart() {
    return window.fetch('/cart.js', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; });
  }
  function lines(c) { var h = root.getAttribute('data-hs-jm-handle'); return (c.items || []).filter(function (i) { return i.handle === h; }).length; }
  // once this gift is in the cart, the next picked gift not yet in it paints, or the cart opens
  function watchAdded(q, before) {
    var tries = 0, timer = setInterval(function () {
      cart().then(function (c) {
        if (lines(c) > before) {
          clearInterval(timer);
          var inCart = {}; (c.items || []).forEach(function (i) { inCart[i.handle] = true; });
          var next = q.slice(1).filter(function (x) { return !inCart[handleOf(x.url)]; })[0];
          window.location.href = next ? next.url : '/cart';
        } else if (++tries > 40) {
          clearInterval(timer); button();
          root.querySelector('[data-hs-jm-status]').textContent = 'That took too long. Tap the button again.';
        }
      });
    }, 900);
  }

  function init() {
    root = document.querySelector('[data-hs-jm]');
    st = state(); j = st.hs_journey;
    if (!root || !window.__hs2api || !window.__hs2api.journey || !window.__hs2api.journey()) return;
    here = giftHere();
    if (!here) return;
    root.hidden = false;
    document.documentElement.classList.add('hs-jm-on');
    // the painting card moves into the panel, with its listeners
    art = document.querySelector('[data-hs-art]');
    if (art) root.querySelector('[data-hs-jm-paint]').appendChild(art);
    root.addEventListener('click', onClick);
    root.querySelector('[data-hs-jm-tick]').addEventListener('change', onTick);
    paint();
    if (art && window.MutationObserver) new MutationObserver(function () { paint(); }).observe(art, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src'] });
    setInterval(function () { if (!painted() || root.querySelector('[data-hs-jm-choose]').hidden) paint(); }, 1500);
  }
  // hs2.js sets up its journey state first
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
