/* Journey mode on a gift page (snippets/hs-journey-choose.liquid), photo first (Krish, 4 Nov, after a real
   purchase: "one step at a time, non-duplicative, in the right order, and then the user purchases"; every
   step should look like "What style of design do you want?"; the painting screen "for a few seconds, which
   then can fade into the next steps of all the user inputs"; "Nothing on this page must randomly change size").

   The buyer already chose the photo, the style and every gift (with its colour or frame) on the home page.
   hs2.js sends the photo to Teeinblue as this page opens (journey()), once. This panel then shows, in the
   journey's own frame:
   1. the studio (hs-wait.js) for a few seconds while the painter starts;
   2. on the first gift only, the questions about the dog and the note (hs-journey.js in gift mode), while it
      paints, with a small painting badge in the header;
   3. if the painting is not back yet, the studio again, in the same frame;
   4. the painting on the real product, from Teeinblue's own mockups (its engine places the painting on the
      product, so it shows what prints), with a close-up of the painting itself; one tick, one button.
   Teeinblue's framing box is saved as the painter framed it and never shown. Each further gift opens its own
   page (Shopify refuses pages inside pages, and Teeinblue paints one product per page), which paints the
   same photo in the same style, shows the same studio, and asks nothing again. Then the cart. */
(function () {
  'use strict';
  if (window.__hsjm) return;
  window.__hsjm = true;
  var NAME = { mug: 'mug', blanket: 'blanket', print: 'portrait' };
  var STUDIO_MS = 6000;
  var root, frame, j, here, art, phase = '', adding = false, studioUntil = 0, galleryMoved = false, view = 'product';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function state() { try { return JSON.parse(window.sessionStorage.getItem('hs2-review') || '{}') || {}; } catch (e) { return {}; } }
  function $(sel) { return root.querySelector(sel); }
  function queue() { return (j && j.queue) || []; }
  function handle() { return root.getAttribute('data-hs-jm-handle'); }
  function handleOf(url) { var m = /\/products\/([^/?#]+)/.exec(url || ''); return m ? m[1] : ''; }
  function giftHere() {
    var h = handle(), q = queue();
    for (var i = 0; i < q.length; i++) if (handleOf(q[i].url) === h) return q[i].gift;
    var g = j && j.gifts || {};
    for (var k in g) if (g[k] && g[k].handle === h) return k;
    return '';
  }
  function at() { var h = handle(), q = queue(); for (var i = 0; i < q.length; i++) if (handleOf(q[i].url) === h) return i; return 0; }
  function first() { return at() === 0; }
  function nextGift() { return queue()[at() + 1] || null; }
  function dog() { var d = (window.HSJourney && window.HSJourney.dog()) || state().dog || ''; return d; }
  function artSrc() {
    var img = art && art.querySelector('[data-hs-art-result]');
    return art && art.getAttribute('data-state') === 'done' && img && img.getAttribute('src') ? img.getAttribute('src') : '';
  }
  // after a repaint the old painting stays on the card for a moment: it never counts as the new one
  var stale = '';
  function painted() { var s = artSrc(); return !!s && s !== stale; }
  function photoSrc() { var p = art && art.querySelector('[data-hs-art-photo]'); return p && p.getAttribute('src') || ''; }
  function asking() { return first() && window.HSJourney && !window.HSJourney.done(); }
  // the photo did not come to this page (a private window, a cleared device): nothing is painting a few seconds in
  var opened = Date.now();
  function lost() { return !!art && !painted() && (art.hidden || art.getAttribute('data-state') === 'idle') && Date.now() - opened > 5000; }

  /* Teeinblue opens its framing box once a painting is back and waits for Save. The buyer never sees it:
     the painter's framing is saved as it is (Krish, 4 Nov: the crop box was a fourth screen he had to
     work out), and the painting is shown on the product to approve. */
  function saveFraming() {
    var box = document.querySelector('.vm--container');
    if (!box) return;
    var save = Array.prototype.filter.call(box.querySelectorAll('button, .tee-btn, [role="button"]'), function (b) {
      return /^(save|done|apply|confirm|ok)\b/i.test((b.innerText || b.textContent || '').trim());
    })[0];
    if (save && !save.__hsSaved) { save.__hsSaved = true; save.click(); setTimeout(function () { save.__hsSaved = false; }, 4000); }
  }

  /* --------------------------------------------------------------- the frame
     The same bar, progress line, headline, body and dock as every journey step. The dock always holds the
     same three rows (the tick, the button, the quiet link), shown or held invisible, so it never changes
     height as the painting arrives. */
  function setText(sel, text) { var el = $(sel); if (el && el.textContent !== text) el.textContent = text; }
  // the dock's one line: a problem when there is one, otherwise what happens next; it never changes height
  var said = '', note = '';
  function line() { setText('[data-hs-jm-line]', said || note); }
  function status(text) { said = text || ''; line(); }
  function setNote(text) { note = text || ''; line(); }
  function show(el, on) { if (el) el.style.visibility = on ? '' : 'hidden'; }
  function go(next) {
    if (next === phase) return;
    phase = next;
    root.setAttribute('data-phase', phase);
    var askEl = $('[data-hsj]');
    if (phase === 'ask') {
      frame.hidden = true;
      if (askEl) askEl.hidden = false;
      window.HSJourney.ask();
      chip();
      return;
    }
    if (askEl) askEl.hidden = true;
    if (window.HSJourney) window.HSJourney.hide();
    frame.hidden = false;
    // one transition: the frame fades up a few pixels, as every journey step does
    frame.classList.remove('is-in'); void frame.offsetWidth; frame.classList.add('is-in');
    paint();
  }
  function label() {
    var q = queue(), n = q.length, g = here;
    if (phase === 'reveal') return 'Your ' + NAME[g] + (n > 1 ? ' <span class="hsj-bar__part">· gift ' + (at() + 1) + ' of ' + n + '</span>' : '');
    return 'The painting' + (n > 1 ? ' <span class="hsj-bar__part">· gift ' + (at() + 1) + ' of ' + n + '</span>' : '');
  }
  function paint() {
    if (!frame) return;
    var d = dog(), who = d || 'your dog', g = here, step = $('[data-hs-jm-step]');
    if (step && step.__html !== label()) { step.innerHTML = label(); step.__html = label(); }
    var bar = $('[data-hs-jm-progress]');
    if (bar) bar.style.width = (phase === 'reveal' ? 100 : first() ? 60 : 90) + '%';
    var paintBox = $('[data-hs-jm-paint]'), reveal = $('[data-hs-jm-reveal]');
    var tick = $('[data-hs-jm-tickrow]'), add = $('[data-hs-jm-add]'), link = $('[data-hs-jm-repaint]');
    if (phase === 'reveal') {
      setText('[data-hs-jm-title]', (d || 'Your dog') + ' on the ' + NAME[g]);
      setText('[data-hs-jm-sub]', 'This is how it prints. See it on the gift, or up close.');
      paintBox.hidden = true; reveal.hidden = false;
      moveGallery(); views();
      setText('[data-hs-jm-tick-text]', 'Yes, this is ' + who);
      show(tick, true); show(link, !!(window.__hs2api.journeyRepaintLeft && window.__hs2api.journeyRepaintLeft()) && !adding);
      var nx = nextGift();
      if (!adding) add.querySelector('span').textContent = nx ? 'Add it, then paint the ' + NAME[nx.gift] : 'Add to cart';
      add.disabled = adding || !$('[data-hs-jm-tick]').checked;
      setNote(nx ? 'The ' + NAME[nx.gift] + ' paints next, from the same photo. Nothing to answer again.' : '');
      return;
    }
    paintBox.hidden = false; reveal.hidden = true;
    show(tick, false); show(link, false);
    if (phase === 'nophoto') {
      setText('[data-hs-jm-title]', 'One photo of ' + who);
      setText('[data-hs-jm-sub]', (d ? d + "'s" : 'Your') + " photo didn't come with you to this page. Choose it again. It takes a second.");
      add.disabled = false; add.querySelector('span').textContent = 'Choose ' + (d ? d + "'s" : "your dog's") + ' photo';
      setNote('');
      return;
    }
    if (phase === 'studio' && first()) {
      setText('[data-hs-jm-title]', 'Painting ' + who);
      setText('[data-hs-jm-sub]', 'Your photo is with the painter. A few quick questions while it works.');
      add.disabled = false; add.querySelector('span').textContent = 'Next';
      setNote('');
    } else if (phase === 'studio') {
      setText('[data-hs-jm-title]', 'Now the ' + NAME[g]);
      setText('[data-hs-jm-sub]', 'Painting ' + who + ' for the ' + NAME[g] + ', from the same photo, in the same style.');
      add.disabled = true; add.querySelector('span').textContent = 'Add to cart';
      setNote('Most paintings take 1 to 3 minutes.');
    } else {
      setText('[data-hs-jm-title]', 'Almost there');
      setText('[data-hs-jm-sub]', 'Painting ' + who + '. Most take 1 to 3 minutes.');
      add.disabled = true; add.querySelector('span').textContent = 'Add to cart';
      setNote('');
    }
  }
  // the painting badge in the questions' header: the buyer's photo, turning while it paints, a tick when done
  function chip() {
    var c = document.querySelector('[data-hsj-paint]');
    if (!c) return;
    var img = c.querySelector('[data-hsj-paint-img]'), src = artSrc() || photoSrc();
    if (img && src && img.__src !== src) { img.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")'; img.__src = src; }
    var done = painted();
    c.classList.toggle('is-done', done);
    c.setAttribute('aria-label', done ? 'Your dog is painted' : 'Painting your dog');
  }

  /* --------------------------------------------------------------- the reveal
     Teeinblue's own gallery (its mockups, with the buyer's painting placed by its engine) moves into the
     panel; the close-up is the painting itself. Both sit in one square of fixed size. */
  function moveGallery() {
    if (galleryMoved) return;
    var g = document.querySelector('[data-hs2-tib-gallery]'), slot = $('[data-hs-jm-gallery]');
    if (!g || !slot || !g.querySelector('.tee-slide, .tee-mockup')) return;
    slot.appendChild(g);
    galleryMoved = true;
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* old browser */ }
  }
  function views() {
    var gal = $('[data-hs-jm-gallery]'), close = $('[data-hs-jm-close]'), src = artSrc();
    var useGallery = galleryMoved && view === 'product';
    gal.hidden = !useGallery; close.hidden = useGallery;
    var img = close.querySelector('img');
    if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
    root.querySelectorAll('[data-hs-jm-view]').forEach(function (b) {
      var on = b.getAttribute('data-hs-jm-view') === (useGallery ? 'product' : 'close');
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
      if (b.getAttribute('data-hs-jm-view') === 'product') b.hidden = !galleryMoved;
    });
    var pl = root.querySelector('[data-hs-jm-view="product"] span');
    if (pl) pl.textContent = 'On the ' + NAME[here];
  }

  /* ---------------------------------------------------------------- the tick
     hs2's own approval box, which also answers Teeinblue's agreement; hs2 refuses it while the painting is
     still being saved, and the tick follows what hs2 decided */
  function accept(on) {
    var box = document.querySelector('[data-hs2-artwork-accept]');
    if (!box) return true;
    box.checked = on;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    return box.checked === on;
  }
  function onTick(e) {
    var ok = accept(e.target.checked), hs = document.querySelector('[data-hs2-artwork-accept]');
    if (hs) e.target.checked = hs.checked;
    status(e.target.checked || ok ? '' : 'The painting is still being saved. Try again in a moment.');
    paint();
  }

  /* ---------------------------------------------------------------- adding
     Teeinblue's own Add to cart, then the next gift's page or the cart. The note and the names are on the
     order first (hs-journey.js sends them, hs2.js fills Teeinblue's fields). */
  function cart() { return window.fetch('/cart.js', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return { items: [] }; }); }
  function lines(c) { var h = handle(); return (c.items || []).filter(function (i) { return i.handle === h; }).length; }
  function added(before) {
    return new Promise(function (resolve, reject) {
      var tries = 0, timer = setInterval(function () {
        cart().then(function (c) {
          if (lines(c) > before) { clearInterval(timer); resolve(); }
          else if (++tries > 40) { clearInterval(timer); reject(new Error('That took too long. Tap the button again.')); }
        });
      }, 900);
    });
  }
  function add() {
    var atc = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc');
    if (!atc) { status('The cart is still loading. Try again in a moment.'); return; }
    adding = true; paint();
    var b = $('[data-hs-jm-add]');
    b.disabled = true; b.classList.add('is-busy');
    if (window.HSJourney) window.HSJourney.send();
    try { window.__hs2api.runBridge(); } catch (e) { /* the fields were filled on the last tick */ }
    setTimeout(function () {
      cart().then(function (c) { var before = lines(c); atc.click(); return added(before); }).then(function () {
        var nx = nextGift();
        window.location.href = nx && nx.url ? nx.url : '/cart';
      }, function (why) {
        adding = false; b.classList.remove('is-busy'); paint();
        status(why && why.message ? why.message : 'That took too long. Tap the button again.');
      });
    }, 500);
  }

  /* ---------------------------------------------------------------- events */
  function onClick(e) {
    var t = e.target.closest('button');
    if (!t || !frame.contains(t) && !t.closest('[data-hs-jm-sheet]')) return;
    if (t.hasAttribute('data-hs-jm-add')) {
      if (t.disabled) return;
      if (phase === 'nophoto') {
        // Teeinblue's own photo field opens and sends it; the automatic send stands down (hs2.js journeyPick)
        if (window.__hs2api.journeyPick) window.__hs2api.journeyPick();
        opened = Date.now() + 60000; studioUntil = Date.now() + STUDIO_MS; go('studio');
        return;
      }
      if (phase === 'studio' && first() && !painted()) { go(asking() ? 'ask' : 'wait'); return; }
      if (phase === 'reveal') add();
      return;
    }
    if (t.hasAttribute('data-hs-jm-view')) { view = t.getAttribute('data-hs-jm-view'); views(); return; }
    if (t.hasAttribute('data-hs-jm-repaint')) { $('[data-hs-jm-sheet]').hidden = false; return; }
    if (t.hasAttribute('data-hs-jm-keep')) { $('[data-hs-jm-sheet]').hidden = true; return; }
    if (t.hasAttribute('data-hs-jm-again')) {
      $('[data-hs-jm-sheet]').hidden = true;
      // the same photo and style, painted once more; the note and the names stay as the buyer left them
      var was = artSrc();
      // the painting's own tone (chosen before it painted), not the note's
      var paintedTone = (state().hs3_art_choices || {}).tone || 'warm';
      if (window.__hs2api.journeyRepaint && window.__hs2api.journeyRepaint(paintedTone)) {
        stale = was;
        if (window.HSJourney) window.HSJourney.send();
        $('[data-hs-jm-tick]').checked = false; accept(false);
        go('wait');
      } else status("The repaint couldn't start. Your painting is kept.");
    }
  }
  function tick() {
    saveFraming();
    chip();
    if (phase === 'reveal') { if (!adding) paint(); return; }
    if (adding || phase === 'ask') return;
    var ready = painted();
    if (phase === 'studio' && lost()) { go('nophoto'); return; }
    if (phase === 'studio' && first()) {
      // the studio shows for a few seconds, then the questions (or the painting, once they are answered)
      if (Date.now() < studioUntil) return;
      if (asking()) { go('ask'); return; }
      go(ready ? 'reveal' : 'wait');
      return;
    }
    if (ready) go('reveal');
  }

  function init() {
    root = document.querySelector('[data-hs-jm]');
    var st = state(); j = st.hs_journey;
    if (!root || !j || j.mode !== 'photo-first' || !window.__hs2api || !window.__hs2api.journey || !window.__hs2api.journey()) return;
    here = giftHere();
    if (!here) return;
    frame = $('[data-hs-jm-frame]');
    root.hidden = false;
    document.documentElement.classList.add('hs-jm-on');
    // the painting card moves into the frame, with its listeners
    art = document.querySelector('[data-hs-art]');
    if (art) $('[data-hs-jm-paint]').appendChild(art);
    root.addEventListener('click', onClick);
    $('[data-hs-jm-tick]').addEventListener('change', onTick);
    root.addEventListener('hsj:done', function () { go(painted() ? 'reveal' : 'wait'); });
    // a reload part way through the questions goes straight back to them; otherwise the studio first
    studioUntil = Date.now() + STUDIO_MS;
    var resume = window.HSJourney && window.HSJourney.asking() && asking();
    go(resume ? 'ask' : 'studio');
    if (art && window.MutationObserver) new MutationObserver(function () { tick(); }).observe(art, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src'] });
    setInterval(tick, 700);
  }
  // hs2.js sets up its journey state first, and hs-journey.js its questions
  function start() { setTimeout(init, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
