/* Journey mode on a gift page (snippets/hs-journey-choose.liquid). Krish, 29 Oct: "wow the user
   with the artwork mockup and they're so enamoured by it that they have to continue and purchase
   it", radical simplicity, no scrolling, nothing asked twice, and always offer the bundle.

   hs2.js does the painting: in journey mode it sends the saved photo once by itself (journey()).
   This panel shows it: the painting card while Teeinblue paints, then "Select your gifts" (Krish,
   2 Nov): the three gifts, clean, with nothing over the pictures; each gift's colours as small
   circles; the offer in one line; one tick; one button; and a quiet link for the one free repaint.

   One choice, then one continuous add (Krish, 2 Nov: "there should only ever be one painting Mowgli
   experience"). Shopify refuses to show a store page inside another (frame-ancestors 'none'), and
   Teeinblue paints one product per page, so each extra gift still paints on its own page; but the
   buyer is never asked again. "Add 2 gifts" adds this gift and opens each extra gift in auto mode:
   one progress screen ("Putting Mowgli on the mug"), that gift's colours while it paints, Teeinblue's
   framing saved as painted, the painting shown for a few seconds with a way to repaint, then it goes
   in the cart by itself and the next gift, or the cart, opens. The buyer's one tick covers them all. */
(function () {
  'use strict';
  if (window.__hsjm) return;
  window.__hsjm = true;
  // an extra gift opened by "Add N gifts" (?hsauto=1) adds itself once it is painted
  var auto = false;
  try { auto = new URLSearchParams(window.location.search).get('hsauto') === '1'; } catch (e) { auto = false; }
  var GIFTS = ['print', 'mug', 'blanket'];
  var NAME = { mug: 'Mug', blanket: 'Blanket', print: 'Portrait' };
  var LONG = { mug: 'mug', blanket: 'blanket', print: 'portrait' };
  var QKEY = 'hs2-queue';
  var SHOW = 4; // seconds an auto-mode painting shows before it goes in the cart
  var root, j, st, here, picked = {}, art = null, started = Date.now(), adding = false, countdown = null, held = false;

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { n = Math.round((Number(n) || 0) * 100) / 100; return '$' + (n % 1 ? n.toFixed(2) : String(n)); }
  function state() { try { return JSON.parse(window.sessionStorage.getItem('hs2-review') || '{}') || {}; } catch (e) { return {}; } }
  function gifts() { return (j && j.gifts) || {}; }
  // which gift this page is, from the journey's own list of product handles
  function giftHere() { var h = root.getAttribute('data-hs-jm-handle'); for (var i = 0; i < GIFTS.length; i++) if (gifts()[GIFTS[i]] && gifts()[GIFTS[i]].handle === h) return GIFTS[i]; return ''; }
  function artIn(doc) {
    var a = doc && doc.querySelector('[data-hs-art]'), img = a && a.querySelector('[data-hs-art-result]');
    return a && a.getAttribute('data-state') === 'done' && img && img.getAttribute('src') ? img.getAttribute('src') : '';
  }
  function painted() { return artIn(document); }

  function status(g) { return g === here ? (painted() ? 'done' : 'painting') : 'idle'; }
  /* Teeinblue opens its framing box once a painting is back and waits for Save. In auto mode the
     buyer already approved this dog's painting on the first gift, so the painter's framing is saved. */
  function saveFraming() {
    var box = document.querySelector('.vm--container');
    if (!box) return;
    var save = Array.prototype.filter.call(box.querySelectorAll('button, .tee-btn, [role="button"]'), function (b) {
      return /^(save|done|apply|confirm|ok)\b/i.test((b.innerText || b.textContent || '').trim());
    })[0];
    if (save && !save.__hsSaved) { save.__hsSaved = true; save.click(); setTimeout(function () { save.__hsSaved = false; }, 4000); }
  }

  /* ---------------------------------------------------------------- the tiles
     Each gift shows its own painting once it has one; until then the painting made for this page,
     drawn on the product. Nothing sits over the pictures (Krish, 2 Nov). A wide painting (the mug's
     wrap) is drawn from its front, where the painter puts the dog. */
  function preview(g, src, wide) {
    var pos = wide ? '22% 50%' : '50% 40%';
    var bg = 'style="background-image:url(\'' + esc(src) + '\');background-position:' + pos + '"';
    if (g === 'mug') return '<span class="hs-jm-mug"><span class="hs-jm-mug__body" ' + bg + '></span><span class="hs-jm-mug__handle"></span></span>';
    if (g === 'print') return '<span class="hs-jm-frame"><span class="hs-jm-frame__mat"><span class="hs-jm-frame__art" ' + bg + '></span></span></span>';
    return '<span class="hs-jm-blanket"><span class="hs-jm-blanket__art" ' + bg + '></span></span>';
  }
  function order() { return [here].concat(GIFTS.filter(function (g) { return g !== here && gifts()[g] && gifts()[g].url; })); }
  function tiles(src) {
    return order().map(function (g) {
      var mine = g === here, on = !!picked[g], s = status(g), own = mine ? src : '';
      var wide = g === 'mug' && mine;
      return '<button type="button" class="hs-jm-tile' + (on ? ' is-on' : '') + (s === 'painting' && !mine ? ' is-painting' : '') + '" aria-pressed="' + on + '" data-hs-jm-gift="' + g + '" data-hs-jm-state="' + s + '">' +
        '<span class="hs-jm-tile__art">' + preview(g, own || src, wide) + '</span>' +
        '<span class="hs-jm-tile__check" aria-hidden="true">' + (on ? '✓' : '+') + '</span>' +
        '<span class="hs-jm-tile__row"><span class="hs-jm-tile__name">' + NAME[g] + '</span><span class="hs-jm-tile__price">' + esc(priceOf(g, true)) + '</span></span>' +
        '</button>';
    }).join('');
  }

  /* ------------------------------------------------- each chosen gift's options
     Teeinblue's own variant radios, on this page or in the gift's background copy. Colours are
     small circles (Krish, 2 Nov: "Everyone knows how to do that"); anything else is a small pill. */
  var SWATCH = { black: '#1d1b1b', white: '#ffffff', 'dark blue': '#26344f', navy: '#26344f', 'dark green': '#2f4a3a', green: '#2f4a3a', pink: '#f2b7c6', red: '#b3262e', 'red oak': '#9b5a32', oak: '#b98a5a', tan: '#d2b48c', grey: '#9a9a9a', gray: '#9a9a9a', cream: '#f3ead8', natural: '#efe3cf', brown: '#6b4a33' };
  function optionDoc(g) { return g === here ? document : null; }
  function optionList(g) {
    var d = optionDoc(g);
    if (!d) return [];
    return Array.prototype.filter.call(d.querySelectorAll('#buy .tee-option:not(.sr-only)'), function (opt) { return opt.querySelectorAll('input[type="radio"]').length > 1; });
  }
  // Teeinblue's option titles, in a word or two
  function short(t) {
    var l = t.toLowerCase();
    if (/framed or unframed/.test(l)) return 'Finish';
    if (/frame/.test(l)) return 'Frame';
    if (/colou?r/.test(l)) return 'Color';
    if (/size/.test(l)) return 'Size';
    return t || 'Option';
  }
  function options() {
    var list = [here].filter(function (g) { return optionList(g).length; });
    var many = false;
    return list.map(function (g) {
      var d = optionDoc(g);
      return optionList(g).map(function (opt, i) {
        var title = opt.querySelector('.tee-option__title'), radios = opt.querySelectorAll('input[type="radio"]'), now = '';
        var row = Array.prototype.map.call(radios, function (r, k) {
          if (r.closest('[hidden]')) return '';
          var lab = r.id && d.querySelector('label[for="' + r.id + '"]'), text = (lab ? lab.textContent : r.value).trim(), hex = SWATCH[text.toLowerCase()];
          if (r.checked) now = text;
          var key = g + ':' + i + ':' + k;
          if (hex) return '<button type="button" class="hs-jm-dot' + (r.checked ? ' is-on' : '') + '" style="--dot:' + hex + '" aria-pressed="' + r.checked + '" aria-label="' + esc(text) + '" title="' + esc(text) + '" data-hs-jm-opt="' + key + '"></button>';
          return '<button type="button" class="hs-jm-pill' + (r.checked ? ' is-on' : '') + '" aria-pressed="' + r.checked + '" data-hs-jm-opt="' + key + '">' + esc(text) + '</button>';
        }).join('');
        var label = short(title ? title.textContent.trim() : '');
        if (many) label = NAME[g] + ' ' + label.toLowerCase();
        return '<div class="hs-jm-opt"><span class="hs-jm-opt__name">' + esc(label) + (now ? '<b>' + esc(now) + '</b>' : '') + '</span><span class="hs-jm-opt__row">' + row + '</span></div>';
      }).join('');
    }).join('');
  }
  function priceOf(g, label) {
    var d = optionDoc(g), p = d && d.querySelector('#buy [data-hs2-price]');
    if (p && g === here) return p.textContent.trim();
    var x = gifts()[g] || {};
    return (label ? 'from ' : '') + money(x.price);
  }
  // every gift is a choice, this page's too (Krish, 4 Nov: "why can't I unselect the blanket?"); this page's
  // gift starts chosen, since its painting is the one on screen
  function chosen() { return order().filter(function (g) { return !!picked[g]; }); }
  function count() { return chosen().length; }
  function total() {
    var n = 0;
    chosen().forEach(function (g) { n += parseFloat(String(priceOf(g, false)).replace(/[^0-9.]/g, '')) || 0; });
    var c = count();
    return n * (c >= 3 ? 0.8 : c === 2 ? 0.85 : 1);
  }
  function offer(n) {
    if (n === 1) return '<b>Add a second gift: 15% off.</b> All 3: 20% off.';
    if (n === 2) return '<b>You save 15% on 2 gifts.</b> 20% on all 3.';
    return '<b>You save 20% on all 3 gifts.</b>';
  }

  // hs2 touches the painting card often; the tiles are only redrawn when they change, so a tap
  // never lands on a button that was just replaced
  function set(el, html) { if (el.__html !== html) { el.innerHTML = html; el.__html = html; } }
  /* the one free repaint: the four tones, with the journey's icons, in a sheet over the gifts screen */
  var TONES = [['sentimental', 'Sentimental', '<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/>'],
    ['warm', 'Warm', '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'],
    ['hilarious', 'Hilarious', '<circle cx="12" cy="12" r="9"/><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0Z"/><path d="M8 9.5c.6-.8 1.6-.8 2.2 0M13.8 9.5c.6-.8 1.6-.8 2.2 0"/>'],
    ['over_the_top', 'Roast', '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.5-8.4 1.8 1.2 2.7 3 2.6 4.8 1-.6 1.7-1.8 1.9-3.3 2.2 1.7 4 4.3 4 6.9 0 3.2-2.4 5.6-6 5.6Z"/><path d="M12 21c-1.5 0-2.5-1-2.5-2.4 0-1.5 1.2-2.3 1.8-3.6.9.7 1.4 1.6 1.4 2.5.5-.3.9-.9 1-1.6.8.8 1.3 1.7 1.3 2.7 0 1.4-1 2.4-3 2.4Z"/>']];
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
    if (auto) return paintAuto(src, dog);
    if (!src) {
      // no painting under way a few seconds in: the photo did not carry over (private mode, a cleared
      // device), so one button opens the phone's picker and the painting starts from it
      var idle = !art || art.hidden || art.getAttribute('data-state') === 'idle', late = Date.now() - started > 5000;
      root.querySelector('[data-hs-jm-nophoto]').hidden = !(idle && late);
      root.querySelector('[data-hs-jm-photo]').textContent = 'Choose ' + (st.dog ? st.dog + "'s" : 'your dog\'s') + ' photo';
      var nl = root.querySelector('[data-hs-jm-nophoto-lead]');
      if (nl && st.dog) nl.textContent = st.dog + "'s photo didn't come with you to this page. Choose it again. It takes a second.";
      title.textContent = idle && late ? 'One photo of ' + dog : 'Painting ' + dog;
      choose.hidden = true; slot.hidden = false; return;
    }
    title.textContent = 'Select your gifts';
    slot.hidden = true; choose.hidden = false;
    root.querySelector('[data-hs-jm-repaint]').hidden = !(window.__hs2api.journeyRepaintLeft && window.__hs2api.journeyRepaintLeft()) || adding;
    set(root.querySelector('[data-hs-jm-tiles]'), tiles(src));
    set(root.querySelector('[data-hs-jm-options]'), options());
    root.querySelector('[data-hs-jm-tick-text]').textContent = 'Yes, this is ' + dog;
    set(root.querySelector('[data-hs-jm-bundle]'), offer(count()));
    button();
  }
  function waiting() { return painted() ? [] : [here]; }
  function button() {
    var b = root.querySelector('[data-hs-jm-add]'), tick = root.querySelector('[data-hs-jm-tick]');
    var n = count(), wait = waiting();
    if (adding) return;
    if (!n) { b.textContent = 'Choose a gift'; b.disabled = true; return; }
    b.textContent = 'Add ' + (n === 1 ? 'to cart' : n + ' gifts') + ' · ' + money(total());
    b.disabled = !tick.checked || !painted() || wait.length > 0;
  }

  /* ----------------------------------------------------------------- events */
  function onClick(e) {
    var t = e.target.closest('button');
    if (!t || !root.contains(t) || adding) return;
    if (t.hasAttribute('data-hs-jm-gift')) {
      var g = t.getAttribute('data-hs-jm-gift');
      picked[g] = !picked[g]; paint(); return;
    }
    if (t.hasAttribute('data-hs-jm-opt')) {
      var at = t.getAttribute('data-hs-jm-opt').split(':'), opt = optionList(at[0])[+at[1]];
      var r = opt && opt.querySelectorAll('input[type="radio"]')[+at[2]];
      if (r) { r.click(); setTimeout(paint, 150); setTimeout(paint, 700); }
      return;
    }
    if (t.hasAttribute('data-hs-jm-add')) add();
    if (t.hasAttribute('data-hs-jm-photo') && window.__hs2api.journeyPick) window.__hs2api.journeyPick();
    if (t.hasAttribute('data-hs-jm-repaint')) { held = true; clearInterval(countdown); countdown = null; sheet(true); }
    if (t.hasAttribute('data-hs-jm-now')) { held = false; clearInterval(countdown); countdown = null; addAuto(); }
    if (t.hasAttribute('data-hs-jm-keep')) { sheet(false); if (auto) { held = false; paint(); } }
    if (t.hasAttribute('data-hs-jm-tone')) {
      sheet(false);
      var tone = t.getAttribute('data-hs-jm-tone');
      if (window.__hs2api.journeyRepaint && window.__hs2api.journeyRepaint(tone)) {
        if (!auto) root.querySelector('[data-hs-jm-tick]').checked = false;
        held = false; paint();
      } else root.querySelector('[data-hs-jm-status]').textContent = "The repaint couldn't start. Your painting is kept.";
    }
  }
  // the tick is hs2's own approval box, which also answers Teeinblue's agreement; hs2 refuses it
  // while the painting is still being saved, and the tick follows what hs2 decided
  function accept(doc, on) {
    var box = doc && doc.querySelector('[data-hs2-artwork-accept]');
    if (!box) return true;
    box.checked = on;
    box.dispatchEvent(new (doc.defaultView || window).Event('change', { bubbles: true }));
    return box.checked === on;
  }
  function onTick(e) {
    var say = root.querySelector('[data-hs-jm-status]'), ok = accept(document, e.target.checked);
    if (document.querySelector('[data-hs2-artwork-accept]')) e.target.checked = document.querySelector('[data-hs2-artwork-accept]').checked;
    if (say) say.textContent = e.target.checked || ok ? '' : 'The painting is still being saved. Try again in a moment.';
    button();
  }

  /* ------------------------------------------------------------------- adding
     Every gift goes in through its own page's Teeinblue Add to cart: the background copies first,
     one at a time, then this page; then the cart, or the page of a gift that still needs painting. */
  function add() {
    var atc = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc'), say = root.querySelector('[data-hs-jm-status]');
    if (!atc) { say.textContent = 'The cart is still loading. Try again in a moment.'; return; }
    if (!count()) return;
    adding = true;
    var b = root.querySelector('[data-hs-jm-add]'); b.disabled = true;
    // each extra gift opens in auto mode after this one is in the cart, in the order shown. With this page's
    // gift unticked, nothing is added here: the first chosen gift opens and paints in auto mode, the buyer's
    // tick here covering it, as it covers every extra gift.
    var mine = !!picked[here];
    var q = mine ? [{ url: (gifts()[here] || {}).url || location.pathname + '?journey=1', title: NAME[here] }] : [];
    chosen().forEach(function (g) {
      var x = gifts()[g];
      if (g !== here && x && x.url) q.push({ url: x.url + (x.url.indexOf('?') > -1 ? '&' : '?') + 'hsauto=1', title: NAME[g] });
    });
    try { if (q.length > 1 || !mine) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); else window.sessionStorage.removeItem(QKEY); } catch (err) { /* hs2's own queue bar still offers the next gift */ }
    if (!mine) {
      say.textContent = 'Putting ' + (st.dog || 'your dog') + ' on the ' + LONG[chosen()[0]] + '…';
      b.textContent = 'Opening…';
      window.location.href = q[0].url;
      return;
    }
    say.textContent = 'Adding ' + (st.dog || 'your dog') + '…';
    b.textContent = 'Adding…';
    addHere(atc).then(next, function (why) {
      adding = false; button();
      say.textContent = why && why.message ? why.message : 'That took too long. Tap the button again.';
    });
  }
  // the next gift in the queue that is not in the cart yet, or the cart
  function next() {
    return cart().then(function (c) {
      var inCart = {}; (c.items || []).forEach(function (i) { inCart[i.handle] = true; });
      var q = []; try { q = JSON.parse(window.sessionStorage.getItem(QKEY) || '[]') || []; } catch (e) { q = []; }
      var n = q.slice(1).filter(function (x) { return !inCart[handleOf(x.url)]; })[0];
      window.location.href = n ? n.url : '/cart';
    });
  }
  function addHere(atc) {
    var h = root.getAttribute('data-hs-jm-handle');
    return cart().then(function (c) { var before = lines(c, h); atc.click(); return added(h, before); });
  }

  /* ---------------------------------------------------------------- auto mode
     One progress screen for an extra gift: this gift's colours while it paints, then its painting for
     a few seconds, with a way to repaint, then into the cart. */
  function queueInfo() {
    var q = []; try { q = JSON.parse(window.sessionStorage.getItem(QKEY) || '[]') || []; } catch (e) { q = []; }
    var h = root.getAttribute('data-hs-jm-handle'), at = 0;
    q.forEach(function (x, i) { if (handleOf(x.url) === h) at = i; });
    return { at: at + 1, of: Math.max(q.length, at + 1) };
  }
  function paintAuto(src, dog) {
    var title = root.querySelector('[data-hs-jm-title]'), choose = root.querySelector('[data-hs-jm-choose]'), slot = root.querySelector('[data-hs-jm-paint]');
    var qi = queueInfo(), lead = root.querySelector('[data-hs-jm-auto]');
    root.classList.add('is-auto');
    saveFraming();
    if (lead) lead.textContent = 'Gift ' + qi.at + ' of ' + qi.of + '.' + (qi.at > 1 ? ' The others are in your cart.' : '');
    set(root.querySelector('[data-hs-jm-options]'), options());
    if (!src) {
      title.textContent = 'Putting ' + dog + ' on the ' + LONG[here];
      slot.hidden = false; choose.hidden = false;
      root.querySelector('[data-hs-jm-tiles]').hidden = true;
      root.querySelector('[data-hs-jm-dock-auto]').hidden = true;
      return;
    }
    title.textContent = dog + ' on the ' + LONG[here];
    slot.hidden = true; choose.hidden = false;
    var tilesEl = root.querySelector('[data-hs-jm-tiles]');
    tilesEl.hidden = false;
    set(tilesEl, '<div class="hs-jm-solo">' + preview(here, src, here === 'mug') + '</div>');
    root.querySelector('[data-hs-jm-dock-auto]').hidden = false;
    root.querySelector('[data-hs-jm-repaint]').hidden = !(window.__hs2api.journeyRepaintLeft && window.__hs2api.journeyRepaintLeft()) || adding;
    if (adding || held || countdown) return;
    var left = SHOW, say = root.querySelector('[data-hs-jm-auto-say]');
    say.textContent = 'Adding it to your cart in ' + left + '…';
    countdown = setInterval(function () {
      left -= 1;
      if (left > 0) { say.textContent = 'Adding it to your cart in ' + left + '…'; return; }
      clearInterval(countdown); countdown = null; addAuto();
    }, 1000);
  }
  function addAuto() {
    if (adding) return;
    var atc = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc'), say = root.querySelector('[data-hs-jm-auto-say]');
    if (!atc || !painted()) { say.textContent = 'Almost ready…'; setTimeout(addAuto, 1500); return; }
    adding = true;
    // the buyer's tick on the first gift covers this one: hs2's approval box, then Teeinblue's add
    accept(document, true);
    say.textContent = 'Adding the ' + LONG[here] + ' to your cart…';
    addHere(atc).then(next, function () {
      adding = false;
      say.textContent = "That didn't go through. Tap Add now to try again.";
    });
  }
  function handleOf(url) { var m = /\/products\/([^/?#]+)/.exec(url || ''); return m ? m[1] : ''; }
  function cart() {
    return window.fetch('/cart.js', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; });
  }
  function lines(c, h) { return (c.items || []).filter(function (i) { return i.handle === h; }).length; }
  function added(h, before) {
    return new Promise(function (resolve, reject) {
      var tries = 0, timer = setInterval(function () {
        cart().then(function (c) {
          if (lines(c, h) > before) { clearInterval(timer); resolve(); }
          else if (++tries > 40) { clearInterval(timer); reject(new Error('That took too long. Tap the button again.')); }
        });
      }, 900);
    });
  }

  function init() {
    root = document.querySelector('[data-hs-jm]');
    st = state(); j = st.hs_journey;
    if (!root || !window.__hs2api || !window.__hs2api.journey || !window.__hs2api.journey()) return;
    here = giftHere();
    if (!here) return;
    picked[here] = true;
    root.hidden = false;
    document.documentElement.classList.add('hs-jm-on');
    // the painting card moves into the panel, with its listeners
    art = document.querySelector('[data-hs-art]');
    if (art) root.querySelector('[data-hs-jm-paint]').appendChild(art);
    root.addEventListener('click', onClick);
    root.querySelector('[data-hs-jm-tick]').addEventListener('change', onTick);
    if (auto) root.classList.add('is-auto');
    paint();
    if (art && window.MutationObserver) new MutationObserver(function () { paint(); }).observe(art, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src'] });
    setInterval(function () { if (!adding) paint(); else if (auto) saveFraming(); }, 1200);
  }
  // hs2.js sets up its journey state first
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
