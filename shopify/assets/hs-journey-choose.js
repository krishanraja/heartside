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
  // the studio shows for about six seconds from the tap that opened the page (the easel is there from its first
  // paint), and never less than STUDIO_MIN once this script runs: on the live store the scripts load late
  // (5 Nov judges: the questions came 11 seconds after the page opened)
  var STUDIO_MS = 6000, STUDIO_MIN = 2500;
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
  /* The easel (snippets/hs-journey-choose.liquid): the studio before hs2.js shows its painting card, which is
     hidden until the photo has gone to the painter (5 Nov judges: an empty "Painting your dog" for 11 to 22
     seconds). It carries the buyer's own photo and a line from the studio, and steps aside for the card. */
  function cardOn() { return !!art && !art.hidden && art.getAttribute('data-state') !== 'idle'; }
  function ownPhoto() {
    if (ownPhoto.url) return ownPhoto.url;
    var f = window.__hs2api && window.__hs2api.usePhoto && window.__hs2api.usePhoto.file;
    try { if (f && window.URL && URL.createObjectURL) ownPhoto.url = URL.createObjectURL(f); } catch (e) { /* the wash alone */ }
    return ownPhoto.url || '';
  }
  function easel() {
    var e = $('[data-hs-jm-easel]');
    if (!e) return;
    var on = (phase === 'studio' || phase === 'wait') && !cardOn() && !painted();
    if (e.hidden !== !on) e.hidden = !on;
    if (!on) return;
    var src = photoSrc() || ownPhoto(), d = dog();
    ['[data-hs-jm-photo]', '[data-hs-jm-face]'].forEach(function (sel) {
      var img = $(sel);
      if (img && src && img.getAttribute('src') !== src) {
        img.src = src; img.hidden = false;
        // the face's paw icon gives way to the photo; the canvas keeps its brush
        var paw = sel === '[data-hs-jm-face]' && img.parentNode.querySelector('.hs-wait__ico');
        if (paw) paw.style.display = 'none';
      }
    });
    setText('[data-hs-jm-who]', (d ? d + ', live' : 'Live') + ' from the studio');
    var s = journeyStatus();
    setText('[data-hs-jm-say]', s === 'sent' ? 'My photo is on the easel. The first strokes go on now.' : src ? 'Getting the paints out. My photo goes on the easel first.' : 'Getting the paints out. Your photo goes on the easel first.');
  }
  /* The photo did not come to this page (a private window, a cleared device). hs2.js says so once it has
     read this device's copy (journeyStatus): never a timer, because Teeinblue's painter can take well over
     five seconds to open on the live store (5 Nov: all ten test buyers were told a photo on the page was
     lost). After the buyer opens the picker, a pick that sends nothing within a minute asks again. */
  var picked = 0, lastStatus = '';
  function journeyStatus() { return window.__hs2api && window.__hs2api.journeyStatus ? window.__hs2api.journeyStatus() : ''; }
  function idle() { return !!art && (art.hidden || art.getAttribute('data-state') === 'idle'); }
  // a gift added from this journey: coming Back to its page never offers to paint it again (5 Nov review)
  function addedKey() { return 'hs-jm-added:' + handle() + ':' + (j && j.t); }
  function wasAdded() { try { return !!window.sessionStorage.getItem(addedKey()); } catch (e) { return false; } }
  function lost() {
    if (!art || painted()) return false;
    var s = journeyStatus();
    if (s === 'nophoto') return true;
    return s === 'picked' && idle() && Date.now() - picked > 60000;
  }

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
  /* the Christmas date where the buyer decides (5 Nov judges: every buyer worked it out alone; it was never in
     view at the reveal). It comes from the store's own deadline (the memo strip's data-deadline, set by the theme
     push's christmas_deadline) and is said only until that day ends. */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function christmasLine() {
    var m = document.querySelector('[data-hs2-memo]'), x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(m && m.getAttribute('data-deadline') || '');
    if (!x || Date.now() > new Date(+x[1], +x[2] - 1, +x[3], 23, 59, 59).getTime()) return '';
    return 'Order by ' + MONTHS[+x[2] - 1] + ' ' + (+x[3]) + ' for Christmas delivery to a US address.';
  }
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
    // the journey's one forward line (hs-journey.js pctOf): the studio before the questions, then the wait after
    // the note, then the painting on the gift
    if (bar) bar.style.width = (phase === 'reveal' || phase === 'added' ? 100 : first() && (phase === 'studio' || phase === 'nophoto' && asking()) ? 45 : 95) + '%';
    var paintBox = $('[data-hs-jm-paint]'), reveal = $('[data-hs-jm-reveal]');
    var tick = $('[data-hs-jm-tickrow]'), add = $('[data-hs-jm-add]'), link = $('[data-hs-jm-repaint]');
    if (phase === 'reveal') {
      setText('[data-hs-jm-title]', (d || 'Your dog') + ' on the ' + NAME[g]);
      // the whole print, never a crop of it: on a mug the dog can sit round the side (5 Nov judges: all three mug
      // buyers saw its back half, and a zoomed close-up cut the face off)
      setText('[data-hs-jm-sub]', g === 'mug' ? 'This is how it prints, all the way round the mug. Turn it with the arrows, or see the whole print.' : 'This is how it prints. See it on the gift, or the whole print.');
      paintBox.hidden = true; reveal.hidden = false;
      moveGallery(); views();
      setText('[data-hs-jm-tick-text]', 'Yes, this is ' + who);
      show(tick, true); show(link, !!(window.__hs2api.journeyRepaintLeft && window.__hs2api.journeyRepaintLeft()) && !adding);
      var nx = nextGift();
      if (!adding) add.querySelector('span').textContent = nx ? 'Add it, then paint the ' + NAME[nx.gift] : 'Add to cart';
      add.disabled = adding || !$('[data-hs-jm-tick]').checked;
      setNote(nx ? 'The ' + NAME[nx.gift] + ' paints next, from the same photo. Nothing to answer again.' : christmasLine());
      return;
    }
    paintBox.hidden = false; reveal.hidden = true;
    easel();
    show(tick, false); show(link, false);
    if (phase === 'added') {
      var after = nextGift();
      setText('[data-hs-jm-title]', (d ? d + "'s " : 'Your ') + NAME[g] + ' is in your cart');
      setText('[data-hs-jm-sub]', "It's painted and added. Nothing more to do here.");
      add.disabled = false; add.querySelector('span').textContent = after ? 'Next: the ' + NAME[after.gift] : 'Go to the cart';
      setNote('');
      return;
    }
    if (phase === 'refused') {
      var why = window.__hs2api.journeyNote ? window.__hs2api.journeyNote() : {};
      setText('[data-hs-jm-title]', "This photo didn't go through");
      setText('[data-hs-jm-sub]', why.text || "The painter didn't take this photo.");
      add.disabled = false; add.querySelector('span').textContent = why.override ? "It's my dog. Paint it." : 'Choose another photo';
      setNote('');
      return;
    }
    if (phase === 'stuck') {
      setText('[data-hs-jm-title]', "The painter didn't start");
      setText('[data-hs-jm-sub]', 'Reload this page to start it again. Your photo is saved.');
      add.disabled = false; add.querySelector('span').textContent = 'Reload the page';
      setNote('');
      return;
    }
    if (phase === 'stopped') {
      setText('[data-hs-jm-title]', 'The painting stopped');
      setText('[data-hs-jm-sub]', 'It stopped when the page reloaded. One tap paints it again from the same photo.');
      add.disabled = false; add.querySelector('span').textContent = 'Paint it again';
      setNote('');
      return;
    }
    if (phase === 'nophoto') {
      setText('[data-hs-jm-title]', 'One photo of ' + who);
      setText('[data-hs-jm-sub]', (d ? d + "'s" : 'Your') + " photo didn't come with you to this page. Choose it again. It takes a second.");
      add.disabled = false; add.querySelector('span').textContent = 'Choose ' + (d ? d + "'s" : "your dog's") + ' photo';
      setNote('');
      return;
    }
    if (phase === 'studio' && first()) {
      setText('[data-hs-jm-title]', 'Painting ' + who);
      // said only once the photo has really gone (5 Nov review)
      setText('[data-hs-jm-sub]', journeyStatus() === 'sent' ? 'Your photo is with the painter. A few quick questions while it works.' : 'The painter is getting ready. A few quick questions while it starts.');
      add.disabled = false; add.querySelector('span').textContent = 'Next';
      setNote('');
    } else if (phase === 'studio') {
      setText('[data-hs-jm-title]', 'Now the ' + NAME[g]);
      setText('[data-hs-jm-sub]', 'Painting ' + who + ' for the ' + NAME[g] + ', from the same photo, in the same style.');
      add.disabled = true; add.querySelector('span').textContent = 'Add to cart';
      setNote('Most paintings take 1 to 3 minutes.');
    } else {
      // honest about the time (5 Nov judges: "Almost there" showed at 40 seconds and stayed for minutes)
      setText('[data-hs-jm-title]', 'Still painting ' + who);
      setText('[data-hs-jm-sub]', 'Most take 1 to 3 minutes. It shows here, on the ' + NAME[g] + ', when it is done.');
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
  // copies of this gift in the cart: a second copy merged into one line still counts (5 Nov review)
  function lines(c) { var h = handle(); return (c.items || []).filter(function (i) { return i.handle === h; }).reduce(function (n, i) { return n + (Number(i.quantity) || 1); }, 0); }
  /* Teeinblue's add waits for hs2.js to register the painting for checkout, which may take up to its 90
     second budget on a large print file (5 Nov, ten buyers on the live store: the portrait's and the
     blanket's first add gave up at 36 s while that ran, and a second tap went through). The dock says
     what hs2 says while it works. If hs2 reports the copy failed, one more press is safe: nothing
     uploads, the same design registers again, and the cart is checked before and after. */
  function addNote() { var n = document.querySelector('[data-hs2-add-note]'); return n && !n.hidden ? (n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  var FAILED = /didn't go through|not ready|changed while/i;
  function added(before, atc) {
    return new Promise(function (resolve, reject) {
      var tries = 0, again = false, asking = false, timer = setInterval(function () {
        if (asking) return;
        asking = true;
        var say = addNote();
        cart().then(function (c) {
          asking = false;
          if (lines(c) > before) { clearInterval(timer); resolve(); return; }
          if (FAILED.test(say)) {
            // the retry gets the whole budget again, never what the first try left (5 Nov review)
            if (!again) { again = true; tries = 0; status('Almost there.'); atc.click(); return; }
            clearInterval(timer); reject(new Error("That didn't go through. Your design is saved. Tap the button again.")); return;
          }
          if (say && say !== said) status(say);
          // past the budget, an add hs2 still reports as running is waited for, never invited a second time
          if (++tries > 115 && !(say && tries < 175)) { clearInterval(timer); reject(new Error('This is taking longer than it should. Check your cart before you add it again.')); }
        });
      }, 900);
    });
  }
  function add() {
    var atc = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc');
    if (!atc) { status('The cart is still loading. Try again in a moment.'); return; }
    adding = true; paint();
    // the add can take a while (5 Nov judges: 15 to 40 seconds with only a dot on the button): said in words
    status('Adding it to your cart. This can take up to a minute.');
    var b = $('[data-hs-jm-add]');
    b.disabled = true; b.classList.add('is-busy');
    if (window.HSJourney) window.HSJourney.send();
    try { window.__hs2api.runBridge(); } catch (e) { /* the fields were filled on the last tick */ }
    setTimeout(function () {
      cart().then(function (c) { var before = lines(c); atc.click(); return added(before, atc); }).then(function () {
        try { window.sessionStorage.setItem(addedKey(), String(Date.now())); } catch (e) { /* the cart still has it */ }
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
      if (phase === 'added') { var after = nextGift(); window.location.href = after && after.url ? after.url : '/cart'; return; }
      if (phase === 'stuck') { window.location.reload(); return; }
      if (phase === 'nophoto' || phase === 'refused') {
        // "It's my dog": the same photo goes on (hs2.js journeyOverride); otherwise Teeinblue's own photo field
        // opens and sends the new one, and the automatic send stands down (journeyPick)
        var api = window.__hs2api, why = phase === 'refused' && api.journeyNote ? api.journeyNote() : {};
        if (why.override && api.journeyOverride && api.journeyOverride()) { status(''); studioUntil = Date.now() + STUDIO_MS; go(first() && asking() ? 'studio' : 'wait'); return; }
        if (!(api.journeyPick && api.journeyPick())) { status('The painter is still loading. Tap again in a moment.'); return; }
        status(''); picked = Date.now(); studioUntil = Date.now() + STUDIO_MS; go(first() && asking() ? 'studio' : 'wait');
        return;
      }
      if (phase === 'stopped') {
        // the same photo goes again (hs2.js journeyResume); a photo that is gone opens the picker instead
        if (!(window.__hs2api.journeyResume && window.__hs2api.journeyResume())) { if (window.__hs2api.journeyPick) window.__hs2api.journeyPick(); picked = Date.now(); }
        studioUntil = Date.now() + STUDIO_MS; go(first() && asking() ? 'studio' : 'wait');
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
    easel();
    if (phase === 'added') return;
    if (phase === 'reveal') { if (!adding) paint(); return; }
    if (adding || phase === 'ask') return;
    var ready = painted(), s = journeyStatus();
    if (!ready) {
      if ((phase === 'studio' || phase === 'wait') && lost()) { go('nophoto'); return; }
      var waiting = phase === 'wait' || phase === 'studio' && !first();
      // sent by a page that is gone (a reload, Back then Forward): one tap paints again
      if (waiting && s === 'interrupted') { go('stopped'); return; }
      // refused on the way (hs2.js journeyRefused), or the painter never opened: said, with one way on
      if (waiting && s === 'refused') { go('refused'); return; }
      if (waiting && s === 'stuck') { go('stuck'); return; }
    }
    if (phase === 'studio' && first() && s !== lastStatus) { lastStatus = s; paint(); }
    if (phase === 'studio' && first()) {
      // the studio shows for a few seconds, then the questions (or the painting, once they are answered)
      if (Date.now() < studioUntil) return;
      if (asking()) { go('ask'); return; }
      go(ready ? 'reveal' : 'wait');
      return;
    }
    if (ready) go('reveal');
  }

  // the snippet's inline check may have stepped the page aside already: a wrong guess is taken back
  var dead = false, ticker = 0;
  function off() {
    var was = document.documentElement.classList.contains('hs-jm-on');
    document.documentElement.classList.remove('hs-jm-on'); if (root) root.hidden = true;
    // the header the guess hid is cleared again (hs2.js listens to resize)
    if (was) { try { window.dispatchEvent(new Event('resize')); } catch (e) { /* old browser */ } }
  }
  // the painting card moves into the frame, with its listeners, at the easel's size; only once hs2.js runs
  function takeCard() {
    if (art) return;
    art = document.querySelector('[data-hs-art]');
    if (!art) return;
    $('[data-hs-jm-paint]').appendChild(art);
    var e = $('[data-hs-jm-easel]');
    if (e) ['--hs-art-ratio', '--hs-art-r'].forEach(function (v) { var x = art.style.getPropertyValue(v); if (x) e.style.setProperty(v, x); });
    if (window.MutationObserver) new MutationObserver(function () { tick(); }).observe(art, { attributes: true, subtree: true, attributeFilter: ['data-state', 'src'] });
  }
  /* early: this file runs ahead of hs2.js (snippets/hs-journey-choose.liquid), so the studio and the questions
     start on the snippet's own check (the same rules as hs2.js journey()), and hs2.js confirms it once it runs */
  function init(early) {
    root = document.querySelector('[data-hs-jm]');
    var st = state(); j = st.hs_journey;
    if (!root || !j || j.mode !== 'photo-first' || !early && !(window.__hs2api && window.__hs2api.journey && window.__hs2api.journey())) return off();
    here = giftHere();
    if (!here) return off();
    frame = $('[data-hs-jm-frame]');
    root.hidden = false;
    document.documentElement.classList.add('hs-jm-on');
    if (!early) takeCard();
    root.addEventListener('click', onClick);
    $('[data-hs-jm-tick]').addEventListener('change', onTick);
    root.addEventListener('hsj:done', function () { go(painted() ? 'reveal' : 'wait'); });
    // a reload part way through the questions goes straight back to them; otherwise the studio first
    var opened = window.performance && performance.timeOrigin ? performance.timeOrigin : Date.now();
    studioUntil = Math.max(Date.now() + STUDIO_MIN, opened + STUDIO_MS);
    var resume = window.HSJourney && window.HSJourney.asking() && asking();
    go(wasAdded() ? 'added' : resume ? 'ask' : 'studio');
    if (phase === 'added') cart().then(function (c) {
      if (lines(c) > 0 || phase !== 'added') return;
      try { window.sessionStorage.removeItem(addedKey()); } catch (e) { /* the page decides again on a reload */ }
      go(resume ? 'ask' : 'studio');
    });
    /* Back to this page from the next gift or the cart, restored from the browser's page cache (Safari, Firefox):
       the add finished, so the page says the gift is in the cart instead of a busy button (review, 5 Nov) */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted || !wasAdded()) return;
      adding = false;
      var b = $('[data-hs-jm-add]'); if (b) b.classList.remove('is-busy');
      status(''); phase = ''; go('added');
    });
    ticker = setInterval(function () { if (!dead) tick(); }, 700);
  }
  // hs2.js has run: it confirms the snippet's check, or the page goes back to the normal gift page
  function confirmed() {
    if (!frame) return init();
    if (!window.__hs2api.journey || !window.__hs2api.journey()) {
      dead = true; clearInterval(ticker);
      if (window.HSJourney) window.HSJourney.hide();
      return off();
    }
    takeCard(); tick();
  }
  /* hs-journey.js sets up its questions first (the snippet loads it just before this file). hs2.js sets up the
     journey's state; when it has not run yet, the studio starts on the snippet's check and waits for it. A
     page whose hs2.js never runs goes back to the normal gift page, as before. */
  function hs2() { return !!(window.__hs2api && window.__hs2api.journey); }
  function start() {
    if (start.done) return;
    start.done = true;
    setTimeout(function () {
      if (hs2()) return init();
      var early = document.documentElement.classList.contains('hs-jm-on');
      if (early) init(true);
      var since = 0, wait = setInterval(function () {
        if (hs2()) { clearInterval(wait); if (early) confirmed(); else init(); return; }
        if (document.readyState === 'complete' && (since = since || Date.now()) && Date.now() - since > 20000) {
          clearInterval(wait);
          if (early) { dead = true; clearInterval(ticker); if (window.HSJourney) window.HSJourney.hide(); }
          off();
        }
      }, 100);
    }, 0);
  }
  // the page is parsed ('interactive'): DOMContentLoaded would wait for every deferred script, Teeinblue's included
  if (document.readyState === 'loading') {
    document.addEventListener('readystatechange', function () { if (document.readyState !== 'loading') start(); });
    document.addEventListener('DOMContentLoaded', start);
  } else start();
})();
