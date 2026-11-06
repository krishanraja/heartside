/* One more gift, from the cart (Krish, 5 Nov: "There should be a side draw that bounces out from the left, which
   offers a special deal at checkout to upsell to other gifts"). Loaded by snippets/hs-cart-more.liquid on the
   cart page only. The deal is the store's own bundle (15% off two gifts, 20% off three or more, gifts only),
   shown only while the memo strip's bundle switch says the Shopify discount exists, with the saving in dollars
   worked out from the cart's own gift lines and Shopify's prices.

   - It offers only the gifts with no line in the cart, on the home gifts screen's photos (each tagged Example).
   - For a buyer who just came through the photo-first journey (fresh, answered), its button adds the gift to
     the end of that journey (hs2.js journeyMore), so the gift page paints once from the same photo and asks
     nothing. Otherwise it starts the home journey with that gift ticked and the cart's gifts unticked.
   - Both gifts not in the cart sit side by side, each with its own Add to cart (Krish, 6 Nov: "should offer both
     options as an upsell, not just one, and it should enable someone to one-click tap Add to Cart"). A gift
     goes in the cart only once Teeinblue has painted it, so the tap takes the buyer to that painting, from the
     same photo with nothing asked, and back to the cart.
   - It opens by itself once per session, early, never while the buyer is busy, and always from its opener
     (the bundle line, in the place the cart keeps for it) and from its tab on the left edge, there whenever it
     is closed (Krish, 6 Nov: "That draw should be slightly visible even when it's closed, so that the user can
     bring it back out again whenever they want"). While it is open the page behind is inert: a tap outside only
     closes it. It has its own Check out, which presses the page's own (so the quantity gate holds).
   Nothing here paints, adds to the cart or changes a price. */
(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : {};
  if (root.HSCartMore) return;

  /* ------------------------------------------------------------ the saving (pure, tested in node) */
  var RATES = [[3, 20], [2, 15]];
  function rate(n) { for (var i = 0; i < RATES.length; i++) if (n >= RATES[i][0]) return RATES[i][1]; return 0; }
  // the bundle's discount on these gift units (unit prices in cents), as a whole number of cents
  function bundleOff(prices) {
    var r = rate(prices.length), sum = 0;
    prices.forEach(function (p) { sum += Number(p) || 0; });
    return r ? Math.round(sum * r / 100) : 0;
  }
  function money(cents) { return '$' + (cents / 100).toFixed(2).replace(/\.00$/, ''); }
  // every gift variant, by id: {gift, price, unframed}
  function variantMap(cfg) {
    var m = {};
    (cfg.gifts || []).forEach(function (g) {
      (g.variants || []).forEach(function (v) { m[String(v.id)] = { gift: g.gift, price: Number(v.price) || 0, unframed: g.gift === 'print' && /unframed/i.test((v.options || [])[0] || '') }; });
    });
    return m;
  }
  /* the cart's gift units from its lines (each line's data-hs2-cart-line): add-ons (Artist's touch, a card) and
     anything that is not one of the three gifts are left out; a new version beside the one it replaces counts
     once, since the buyer keeps one of the two */
  function cartGifts(lines, cfg) {
    var map = variantMap(cfg), ids = {}, out = { units: [], have: {}, unframed: false, redo: false };
    lines.forEach(function (l) { (l.ids || []).forEach(function (id) { if (id) ids[id] = true; }); });
    lines.forEach(function (l) {
      var p = l.properties || {}, v = map[String(l.variant_id)];
      if (!v || p._hs_addon_for || p._hs_addon) return;
      if (l.of && ids[l.of]) { out.redo = true; return; }
      var q = Math.max(1, parseInt(l.quantity, 10) || 1);
      for (var i = 0; i < q; i++) out.units.push(v.price);
      out.have[v.gift] = true;
      if (v.unframed) out.unframed = true;
    });
    return out;
  }
  function variantLabel(g, v) {
    var o = v.options || [];
    if (g === 'mug') return o[1] || o[0] || '';
    if (g === 'print') return /unframed/i.test(o[0] || '') ? 'Unframed' : (o[1] || 'Framed') + ' frame';
    return o[1] || o[0] || '';
  }
  var MUG_ORDER = ['Black', 'Dark Blue', 'Dark Green', 'Red', 'Pink'];
  /* the offers: the gifts not in the cart, with their sellable variants. The lead keeps the 30% margin floor
     (docs/evidence/2026-10-27-bundle-economics.md): a mug with an unframed portrait fails it in the bounding
     case, while a mug with a framed portrait or a blanket clears it in every stack. So a cart with the mug (or an
     unframed portrait) leads with the blanket, and a cart with the mug offers the portrait framed first. */
  function offers(cfg, cart) {
    var list = (cfg.gifts || []).filter(function (g) { return g.available !== false && !cart.have[g.gift]; }).map(function (g) {
      var vs = (g.variants || []).filter(function (v) { return v.available !== false; });
      if (g.gift === 'mug') vs.sort(function (a, b) { return idx(MUG_ORDER, (a.options || [])[1]) - idx(MUG_ORDER, (b.options || [])[1]); });
      if (g.gift === 'print') {
        var framed = vs.filter(function (v) { return !/unframed/i.test((v.options || [])[0] || ''); }), bare = vs.filter(function (v) { return /unframed/i.test((v.options || [])[0] || ''); });
        vs = cart.have.mug ? framed.concat(bare) : bare.concat(framed);
      }
      return { gift: g.gift, cfg: g, variants: vs, variant: vs[0] };
    }).filter(function (o) { return o.variant; });
    if (cart.have.mug || cart.unframed) list.sort(function (a, b) { return (b.gift === 'blanket') - (a.gift === 'blanket'); });
    return list;
  }
  function idx(list, v) { var i = list.indexOf(v); return i < 0 ? 99 : i; }
  // the saving with this variant added, in cents, and the words for it
  function saving(cart, price) { return bundleOff(cart.units.concat([price])); }
  function savingText(cart, price) {
    var n = cart.units.length + 1, off = saving(cart, price);
    if (!off) return '';
    return 'You save ' + money(off) + (n === 2 ? ' on the two.' : n === 3 ? ' on all three.' : ' on all ' + n + '.');
  }
  function pillText(n) {
    if (n === 1) return 'Second gift: 15% off both';
    if (n === 2) return 'Third gift: 20% off all three';
    return '';
  }
  // the tab on the left edge while the drawer is closed
  function peekText(n) {
    if (n === 1) return 'Add a gift, save 15%';
    if (n === 2) return 'Add a gift, save 20%';
    return '';
  }
  var NAME = { mug: 'mug', blanket: 'blanket', print: 'portrait' };
  // "Your mug stays in your cart." / "Your mug and blanket stay in your cart."
  function staysText(have) {
    var g = ['print', 'mug', 'blanket'].filter(function (k) { return have[k]; }).map(function (k) { return NAME[k]; });
    if (!g.length) return '';
    var list = g.length === 1 ? g[0] : g.slice(0, -1).join(', ') + ' and ' + g[g.length - 1];
    return 'Your ' + list + (g.length === 1 ? ' stays' : ' stay') + ' in your cart.';
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // the store's own deadline (the memo strip's data-deadline), said only until that day ends
  function christmasLine(deadline, now) {
    var x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline || '');
    if (!x || (now == null ? Date.now() : now) > new Date(+x[1], +x[2] - 1, +x[3], 23, 59, 59).getTime()) return '';
    return 'Order by ' + MONTHS[+x[2] - 1] + ' ' + (+x[3]) + ' for Christmas delivery to a US address.';
  }
  // the home journey's start for a buyer with no fresh journey: this gift ticked, the cart's gifts unticked
  function startLink(rootUrl, gift, variant, have) {
    var h = ['print', 'mug', 'blanket'].filter(function (k) { return have[k] && k !== gift; });
    var base = rootUrl || '/';
    return base + (base.indexOf('?') < 0 ? '?' : '&') + 'step=photo&gift=' + (gift === 'print' ? 'portrait' : gift) + (variant ? '&variant=' + variant : '') + (h.length ? '&have=' + h.map(function (k) { return k === 'print' ? 'portrait' : k; }).join(',') : '');
  }
  function journeyLink(url, variant) {
    var path = String(url || '').split('?')[0];
    return path + '?journey=1' + (variant ? '&variant=' + variant : '');
  }
  root.HSCartMore = { RATES: RATES, rate: rate, bundleOff: bundleOff, money: money, cartGifts: cartGifts, offers: offers, savingText: savingText, pillText: pillText, peekText: peekText, staysText: staysText, christmasLine: christmasLine, startLink: startLink, journeyLink: journeyLink, variantLabel: variantLabel };
  if (typeof document === 'undefined') return;

  /* ------------------------------------------------------------ the page */
  var KEY = 'hs-more', AUTO_WINDOW = 4500, AUTO_DELAY = 1200;
  var cfg = null, cart = null, list = [], chosen = {}, mode = { mode: 'start', photo: false, dog: '' }, drawer = null, opener = null, peek = null, lastFocus = null;
  var isOpen = false, modeReady = false, wantOpen = '', landedAt = 0, busy = false, interacted = false, autoTimer = 0, pendTimer = 0, inerted = [], peekReady = false;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api() { return window.__hs2api || {}; }
  function track(name, data) { try { if (api().track) api().track(name, data || {}); } catch (e) { /* analytics off */ } }
  function memory() { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function remember(m) { try { sessionStorage.setItem(KEY, JSON.stringify(m)); } catch (e) { /* private mode: it opens from the opener only */ } }
  function live() { return !!document.querySelector('[data-hs-bundle-live]'); }
  function pending() {
    try { if (window.HSCartQuantity && window.HSCartQuantity.pending && window.HSCartQuantity.pending()) return true; } catch (e) { /* read it directly below */ }
    try { return !!sessionStorage.getItem('heartside.quantity.pending.v1'); } catch (e) { return false; }
  }
  function readCfg() {
    var el = document.querySelector('[data-hs-more-config]');
    try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; }
  }
  // the cart page's own rows: never Helio's drawer, never a nested line
  function rows() {
    return Array.prototype.filter.call(document.querySelectorAll('.cart-items__table-row[data-key]'), function (r) {
      return !r.closest('#cart-drawer, cart-drawer-component, [data-hs-more]') && !r.classList.contains('cart-items__nested-line') && !r.getAttribute('data-parent-key');
    });
  }
  function lineOf(row) {
    var s = null;
    try { s = JSON.parse(row.getAttribute('data-hs2-cart-line') || 'null'); } catch (e) { s = null; }
    if (!s) return null;
    var ids = [], of = '';
    [s.properties || {}].concat((s.item_components || []).map(function (c) { return c.properties || {}; })).forEach(function (p) {
      if (p._customization_id) ids.push(String(p._customization_id));
      of = of || String(p._hs_redo_of || '');
    });
    return { variant_id: s.variant_id, quantity: s.quantity, properties: s.properties || {}, ids: ids, of: of };
  }
  function refresh() {
    cfg = cfg || readCfg();
    if (!cfg) return false;
    cart = cartGifts(rows().map(lineOf).filter(Boolean), cfg);
    list = offers(cfg, cart);
    /* a frame or color the buyer chose stays chosen when the cart redraws; a gift already in this journey keeps
       the one chosen for it on the home page, shown and never asked again (Krish, 6 Nov) */
    list.forEach(function (o) {
      var pin = mode.mode === 'extend' && mode.chosen ? mode.chosen[o.gift] : '';
      var want = pin || chosen[o.gift];
      var v = want ? o.variants.filter(function (x) { return String(x.id) === String(want); })[0] : null;
      if (v) o.variant = v;
      o.fixed = !!(pin && v);
    });
    return true;
  }
  function active() { return live() && cart && (cart.units.length === 1 || cart.units.length === 2) && list.length > 0; }

  /* the opener: the bundle line itself, made a button, in the box hs2.css keeps for it from the first paint */
  function placeOpener() {
    var note = document.querySelector('.cart-page__summary .cart-totals__tax-note, .cart-summary .cart-totals__tax-note');
    if (note && note.closest('#cart-drawer, cart-drawer-component')) note = null;
    var say = note ? note.getAttribute('data-hs2-bundle-say') || '' : '';
    var have = note && note.querySelector(':scope > [data-hs-more-open]');
    if (!note || !active() || !say) { if (have) have.remove(); opener = null; return; }
    if (!have) {
      have = document.createElement('button');
      have.type = 'button'; have.className = 'hs-more-open'; have.setAttribute('data-hs-more-open', '');
      have.setAttribute('aria-haspopup', 'dialog'); have.setAttribute('aria-controls', 'hs-more');
      have.innerHTML = '<span data-hs-more-say></span><span class="hs-more-sr"> See the gifts</span>';
      have.addEventListener('click', function () { if (!isOpen) open(false); });
      note.insertBefore(have, note.firstChild);
    }
    var span = have.querySelector('[data-hs-more-say]');
    if (span.textContent !== say) span.textContent = say;
    have.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    opener = have;
  }

  /* the tab: the drawer's own edge, left on the screen whenever it is closed, so the buyer can always bring it
     back. It waits until the drawer has had its chance to open by itself, so it never shows and then hides. */
  function placePeek() {
    var on = peekReady && modeReady && !isOpen && !!cart && active();
    if (!on) { if (peek && !peek.hidden) { peek.hidden = true; peek.classList.remove('is-on'); } return; }
    if (!peek) {
      peek = document.createElement('button');
      peek.type = 'button'; peek.className = 'hs-more-peek'; peek.setAttribute('data-hs-more-peek', '');
      peek.setAttribute('aria-haspopup', 'dialog'); peek.setAttribute('aria-controls', 'hs-more'); peek.setAttribute('aria-expanded', 'false');
      peek.innerHTML = '<span class="hs-more-peek__say" data-hs-more-peek-say></span><svg class="hs-more-peek__ico" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      peek.hidden = true;
      peek.addEventListener('click', function () { if (!isOpen) { track('more_peek', { units: cart ? cart.units.length : 0 }); open(false); } });
      document.body.appendChild(peek);
    }
    var say = peekText(cart.units.length), span = peek.querySelector('[data-hs-more-peek-say]');
    if (span.textContent !== say) span.textContent = say;
    if (peek.hidden) { peek.hidden = false; peek.classList.add('is-on'); }
  }

  /* ------------------------------------------------------------ the drawer */
  function build() {
    if (drawer) return drawer;
    drawer = document.createElement('section');
    drawer.className = 'hs-more'; drawer.id = 'hs-more'; drawer.setAttribute('data-hs-more', '');
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'hs-more-title'); drawer.setAttribute('aria-describedby', 'hs-more-sub');
    drawer.hidden = true; drawer.inert = true;
    drawer.innerHTML = '<div class="hs-more__panel" data-hs-more-panel>' +
      '<div class="hs-more__head"><h2 class="hs-more__title" id="hs-more-title" tabindex="-1" data-hs-more-title></h2><p class="hs-more__sub" id="hs-more-sub" data-hs-more-sub></p>' +
      '<button type="button" class="hs-more__close" aria-label="Close" data-hs-more-x>×</button></div>' +
      '<ul class="hs-more__list" data-hs-more-list></ul>' +
      '<div class="hs-more__foot"><p class="hs-more__line" data-hs-more-xmas></p><p class="hs-more__line" data-hs-more-foot></p>' +
      '<div class="hs-more__row"><button type="button" class="hs-more__no" data-hs-more-no>No thanks</button><button type="button" class="hs-more__pay" data-hs-more-pay>Check out</button></div></div>' +
      '</div>';
    document.body.appendChild(drawer);
    drawer.querySelector('[data-hs-more-x]').addEventListener('click', function () { close('x'); });
    drawer.querySelector('[data-hs-more-no]').addEventListener('click', function () { close('no'); });
    drawer.querySelector('[data-hs-more-pay]').addEventListener('click', pay);
    swipe(drawer.querySelector('[data-hs-more-panel]'));
    return drawer;
  }
  function setText(sel, t) { var el = drawer.querySelector(sel); if (el && el.textContent !== t) el.textContent = t; }
  function subText() {
    var dog = mode.dog;
    if (mode.mode === 'extend' && mode.photo) return 'It paints ' + (dog || 'your dog') + ' from the same photo. Nothing to answer again.';
    if (mode.mode === 'extend') return 'The same style and note. Choose the photo once more, then it paints.';
    return "Start from your dog's photo, then it paints.";
  }
  function paint() {
    build();
    // the deal is the headline: no eyebrow above it (Krish, 6 Nov, on text around the picture)
    setText('[data-hs-more-title]', pillText(cart.units.length));
    setText('[data-hs-more-sub]', subText());
    setText('[data-hs-more-xmas]', christmasLine((document.querySelector('[data-hs2-memo]') || { getAttribute: function () { return ''; } }).getAttribute('data-deadline')));
    setText('[data-hs-more-foot]', staysText(cart.have) + ' The saving shows at checkout. No code needed.');
    var ul = drawer.querySelector('[data-hs-more-list]'), want = list.map(function (o) { return o.gift + (o.fixed ? ':' + o.variant.id : ''); }).join(',');
    if (ul.getAttribute('data-gifts') !== want) {
      ul.setAttribute('data-gifts', want);
      // two gifts side by side, one as a row
      ul.setAttribute('data-n', String(list.length));
      ul.innerHTML = list.map(card).join('');
      list.forEach(function (o) { bindCard(ul.querySelector('[data-hs-more-card="' + o.gift + '"]'), o); });
    } else list.forEach(function (o) { var li = ul.querySelector('[data-hs-more-card="' + o.gift + '"]'); if (li) cardState(li, o); });
    var stop = pending();
    var payBtn = drawer.querySelector('[data-hs-more-pay]');
    if (payBtn.disabled !== stop) payBtn.disabled = stop;
  }
  /* one card: the picture, the name and price, the saving, the frame or color (or the one already chosen), and Add
     to cart. Side by side, the frame list names the frame only (the price above follows it), so it fits a phone. */
  function card(o) {
    var g = o.cfg, pick = '<span class="hs-more__pick is-none"></span>', two = list.length > 1;
    if (o.fixed) pick = '<p class="hs-more__pick is-set">' + (o.gift === 'mug' ? 'Inside color: ' : '') + '<b>' + esc(variantLabel(o.gift, o.variant)) + '</b></p>';
    else if (o.variants.length > 1) {
      pick = '<label class="hs-more__pick"><span>' + (o.gift === 'mug' ? 'Inside color' : 'Frame') + '</span><select data-hs-more-variant>' + o.variants.map(function (v) {
        var label = variantLabel(o.gift, v);
        if (o.gift === 'print') label = two ? label.replace(/ frame$/, '') : label + ', ' + money(v.price);
        return '<option value="' + esc(v.id) + '"' + (v === o.variant ? ' selected' : '') + '>' + esc(label) + '</option>';
      }).join('') + '</select></label>';
    }
    return '<li class="hs-more__card" data-hs-more-card="' + esc(o.gift) + '">' +
      '<span class="hs-more__art"><img src="' + esc(g.img) + '" alt="' + esc(g.alt) + '" width="540" height="675" loading="lazy" decoding="async"><span class="hs-more__tag">Example</span></span>' +
      '<p class="hs-more__name"><span>' + esc(g.name) + '</span> <span class="hs-more__price" data-hs-more-price></span></p><p class="hs-more__spec">' + esc(g.spec) + '</p>' +
      '<p class="hs-more__save" data-hs-more-save></p>' + pick +
      '<button type="button" class="hs-more__go" data-hs-more-go aria-label="Add the ' + esc(NAME[o.gift]) + ' to your cart">Add to cart</button><p class="hs-more__note" data-hs-more-note></p></li>';
  }
  // painted before in this journey (its page found a sent painting): it paints again from the same photo
  function paintedBefore(o) {
    try { var j = api().state && api().state.hs_journey; return !!(j && j.t && sessionStorage.getItem('hs2-journey-sent:' + o.cfg.id + ':' + j.t)); } catch (e) { return false; }
  }
  function cardState(li, o) {
    var set = function (sel, t) { var el = li.querySelector(sel); if (el && el.textContent !== t) el.textContent = t; };
    set('[data-hs-more-price]', money(o.variant.price));
    set('[data-hs-more-save]', savingText(cart, o.variant.price));
    var stop = pending();
    set('[data-hs-more-note]', stop ? 'Finish the change in your cart first.' : mode.mode === 'extend' && paintedBefore(o) ? 'It paints again from the same photo.' : '');
    var b = li.querySelector('[data-hs-more-go]'), off = stop || busy;
    if (b.disabled !== off) b.disabled = off;
  }
  function bindCard(li, o) {
    cardState(li, o);
    var sel = li.querySelector('[data-hs-more-variant]');
    var now = function () { return list.filter(function (x) { return x.gift === o.gift; })[0] || o; };
    if (sel) sel.addEventListener('change', function () {
      var cur = now();
      cur.variant = cur.variants.filter(function (v) { return String(v.id) === sel.value; })[0] || cur.variant;
      chosen[cur.gift] = cur.variant.id;
      cardState(li, cur);
    });
    li.querySelector('[data-hs-more-go]').addEventListener('click', function () { take(now()); });
  }
  function take(o) {
    if (busy || pending() || Date.now() < landedAt + 450) return;
    var v = o.variant, url;
    if (mode.mode === 'extend') {
      url = journeyLink(o.cfg.url, v.id);
      if (!(api().journeyMore && api().journeyMore(o.gift, v.id, url))) { mode.mode = 'start'; url = ''; }
    }
    if (!url) url = startLink(cfg.root, o.gift, v.id, cart.have);
    busy = true; paint();
    var m = memory(); m.took = true; remember(m);
    track('more_pick', { gift: o.gift, mode: mode.mode, units: cart.units.length });
    window.location.href = url;
  }
  function pay() {
    if (pending()) return;
    track('more_pay', { units: cart ? cart.units.length : 0 });
    var real = Array.prototype.filter.call(document.querySelectorAll('[name="checkout"]'), function (b) { return !b.closest('[data-hs-more], #cart-drawer, cart-drawer-component'); })[0];
    close('pay');
    if (real) { real.click(); return; }
    // no Check out on the page: a real link, so any click gate on the page still sees it
    var a = document.createElement('a'); a.href = (cfg && cfg.root || '/').replace(/\/?$/, '/') + 'checkout'; a.hidden = true;
    document.body.appendChild(a); a.click();
  }

  /* everything else on the page is inert while the drawer is open: a tap outside reaches nothing but the
     page itself, and closes the drawer; focus and screen readers stay in it */
  function inertPage(on) {
    if (on) {
      inerted = Array.prototype.filter.call(document.body.children, function (el) { return el !== drawer && !el.inert && el.tagName !== 'SCRIPT'; });
      inerted.forEach(function (el) { el.inert = true; el.setAttribute('data-hs-more-inert', ''); });
    } else {
      inerted.forEach(function (el) { el.inert = false; el.removeAttribute('data-hs-more-inert'); });
      inerted = [];
    }
  }
  function open(auto) {
    if (isOpen || !refresh() || !active()) return;
    // the words depend on the journey (its photo is read from the device): never shown and then changed
    if (!modeReady) { wantOpen = auto ? 'auto' : 'tap'; return; }
    paint();
    lastFocus = auto ? null : document.activeElement;
    isOpen = true;
    placePeek();
    drawer.hidden = false; drawer.inert = false;
    drawer.classList.remove('is-out'); drawer.classList.add('is-in');
    landedAt = Date.now() + (reduced ? 150 : 560);
    inertPage(true);
    var title = drawer.querySelector('[data-hs-more-title]');
    try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
    if (opener) opener.setAttribute('aria-expanded', 'true');
    var m = memory(); m.shown = cart.units.length; m.took = false; remember(m);
    clearInterval(pendTimer);
    pendTimer = setInterval(function () { if (isOpen) paint(); }, 600);
    track('more_open', { auto: !!auto, units: cart.units.length, mode: mode.mode });
  }
  function close(how) {
    if (!isOpen) return;
    isOpen = false;
    clearInterval(pendTimer);
    inertPage(false);
    drawer.classList.remove('is-in'); drawer.classList.add('is-out');
    var done = function () { if (!isOpen) { drawer.hidden = true; drawer.inert = true; drawer.classList.remove('is-out'); } };
    setTimeout(done, reduced ? 150 : 200);
    if (opener) opener.setAttribute('aria-expanded', 'false');
    // closed by any route, it never opens by itself again, and its tab stays on the left edge to bring it back
    peekReady = true; placePeek();
    if (how !== 'pay' && how !== 'back') { var m = memory(); m.closed = true; remember(m); }
    var back = lastFocus && document.contains(lastFocus) ? lastFocus : opener;
    if (back && how !== 'pay') { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
    track('more_close', { how: how });
  }
  function swipe(panel) {
    var x0 = null, y0 = 0;
    panel.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    panel.addEventListener('pointermove', function (e) {
      if (x0 == null) return;
      if (x0 - e.clientX > 60 && Math.abs(e.clientY - y0) < 40) { x0 = null; close('swipe'); }
    });
    panel.addEventListener('pointerup', function () { x0 = null; });
    panel.addEventListener('pointercancel', function () { x0 = null; });
  }
  // a tap outside closes the drawer and lands nowhere (the page is inert, and its click is swallowed too)
  var swallowUntil = 0;
  document.addEventListener('pointerdown', function (e) {
    if (!isOpen || (drawer && drawer.contains(e.target))) return;
    swallowUntil = Date.now() + 700;
    e.preventDefault();
    close('outside');
  }, true);
  document.addEventListener('click', function (e) {
    if (Date.now() < swallowUntil && !(drawer && drawer.contains(e.target))) { swallowUntil = 0; e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) { e.preventDefault(); close('escape'); } }, true);

  /* ------------------------------------------------------------ opening by itself
     Once a session, early (a window from the cart being ready, never late while the buyer reaches for Check
     out), only after a short still moment, never while a change is pending, a form field, the picture zoom or a
     card offer is in use, or both versions of a redo are in the cart. After the buyer takes an offer it opens
     once more when they come back with that gift, for the next step; after any close, never again by itself. */
  function busyPage() {
    var a = document.activeElement;
    if (a && a !== document.body && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return true;
    if (a && a.closest && a.closest('.cart-totals, .cart-summary, .cart-page__summary')) return true;
    if (document.querySelector('.hs2-zoom, .hs2-review.is-zoomed, #hs-quantity-recovery')) return true;
    if (document.querySelector('[data-hs2-card] [data-hs2-card-status]:not(:empty)')) return true;
    return false;
  }
  function mayAuto() {
    if (interacted || !active() || pending() || cart.redo || busyPage()) return false;
    var m = memory();
    if (m.closed) return false;
    if (m.shown == null) return true;
    return !!m.took && cart.units.length > m.shown;
  }
  /* The window runs from the moment the cart is drawn, not from the page's start (Krish, 6 Nov: "We've lost the
     upsell in the cart"): on the live store a phone's cart is drawn several seconds in, behind Teeinblue's scripts,
     so a window counted from the page's start had closed before the drawer could open. Only a tap or a key after
     the cart is drawn holds it back; a scroll while the page loads never does. */
  var readyAt = 0;
  function scheduleAuto() {
    if (autoTimer || isOpen || !readyAt) return;
    if (Date.now() - readyAt > AUTO_WINDOW) { peekReady = true; placePeek(); return; }
    autoTimer = setTimeout(function () {
      if (Date.now() - readyAt <= AUTO_WINDOW + AUTO_DELAY && mayAuto()) open(true);
      if (!isOpen) { peekReady = true; placePeek(); }
    }, AUTO_DELAY);
  }
  ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { if (!isOpen && readyAt) interacted = true; }, { capture: true, passive: true }); });

  function journeyMode() {
    var get = api().journeyMoreState;
    if (!get) return Promise.resolve({ mode: 'start', photo: false, dog: '' });
    return Promise.resolve(get()).then(function (s) { return s || { mode: 'start', photo: false, dog: '' }; }, function () { return { mode: 'start', photo: false, dog: '' }; });
  }
  function onCart() {
    if (!refresh()) return;
    placeOpener();
    placePeek();
    if (isOpen) paint();
    if (!readyAt) {
      readyAt = Date.now();
      journeyMode().then(function (s) {
        mode = s; modeReady = true;
        if (wantOpen) { var w = wantOpen; wantOpen = ''; if (w === 'tap' || mayAuto()) open(w === 'auto'); }
        // it will not open by itself this time: the tab is there at once
        if (!isOpen && !mayAuto()) peekReady = true;
        scheduleAuto();
        placePeek();
      });
    }
  }
  function boot() {
    if (!readCfg()) return;
    document.addEventListener('hs2:cart', onCart);
    // a bundle line written after the cart pass (its /cart.js read) is mirrored into the opener
    if (window.MutationObserver) new MutationObserver(function () { if (cart) placeOpener(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-hs2-bundle-say'] });
    // hs2.js may have finished its first cart pass before this script ran
    if (document.querySelector('.cart-totals__tax-note[data-hs-note]')) onCart();
    /* Back to the cart from a gift page, restored from the browser's page cache: the buttons work again, the
       offers follow the cart as it is now, and the once-more rule applies */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      busy = false; interacted = false; autoTimer = 0; readyAt = 0;
      if (isOpen) close('back');
      onCart();
      if (cart && mayAuto()) open(true);
    });
  }
  root.HSCartMore.open = function () { open(false); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
