/* Heartside v2 behaviour. Loaded (deferred) by snippets/hs2-head.liquid.
   One shared review state drives every section: the dog's name typed in the hero
   rewrites the whole page, the HR-26 answers drive the live poster, the evidence
   photos, the story cards and the links to product pages. State lives in
   sessionStorage (key "hs2-review") so it survives page changes in the same visit.
   The headshot a shopper attaches stays on their device (IndexedDB) until they
   hand it to the personalizer on a product page. */
(function () {
  'use strict';
  if (window.__hs2) return;
  window.__hs2 = true;

  var KEY = 'hs2-review';
  var ANSWERS = ['dog', 'person', 'cupboard', 'improvement', 'incident', 'enemy'];
  var DEFAULTS = { dog: 'Buddy', person: 'Sarah', cupboard: '1,412', improvement: 'Leaving', incident: 'The sock', enemy: 'The mailman', voice: false, leak: 'rating' };
  var LEAKS = ['rating', 'incident', 'threat', 'memo'];
  var state = load();
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|TikTok|musical_ly|Bytedance|Snapchat|Pinterest/i.test(navigator.userAgent || '');
  document.documentElement.classList.add('hs2-js');
  if (inApp) document.documentElement.classList.add('hs2-inapp');
  var photoURL = null; // the shopper's headshot, as an object URL, once attached or restored

  function load() {
    var s = {};
    try { s = JSON.parse(window.sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    // answers carried in the URL (from the homepage or a shared link) win over storage
    try {
      var q = new URLSearchParams(window.location.search);
      // a name fits in 14 letters: the portrait signs "Love, " and the Dog's name field (14), and
      // Signed holds 20. A longer ?dog= from a link would be cut by Teeinblue anyway (28 Oct)
      ANSWERS.forEach(function (k) { if (q.get(k)) s[k] = q.get(k).slice(0, k === 'dog' || k === 'person' ? 14 : 40); });
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
  /* What the shopper actually gave us. The names have no default: "Buddy" and "Sarah"
     only fill the page until they type. They never go into a link, an order or the
     personalizer, or the poster would print a stranger's name. The treat count and the
     chips keep their defaults, because those print sensibly as they are. */
  var NAMES = ['dog', 'person'];
  function answer(k) {
    if (k === 'personality' && (cityArtPreview() || nativeArtworkPurchase())) return nativeArtworkEvidence();
    if ((cityArtPreview() || nativeArtworkPurchase()) && window.HSArtworkChoices && (k === 'art_style' || k === 'art_tone')) {
      var choice = window.HSArtworkChoices.read(), recipes = window.HSArtworkEngine.recipes;
      return k === 'art_style' ? recipes.styles[choice.style].label : recipes.tones[choice.tone].label;
    }
    // 28 Oct: Teeinblue's prompt reads only the chosen medium, mood and energy, in hidden fields
    // (tools/print-art/native-candidate.mjs nativeFieldValues writes the same text)
    if ((cityArtPreview() || nativeArtworkPurchase()) && window.HSArtworkChoices && (k === 'art_style_direction' || k === 'art_tone_direction')) {
      var chosen = window.HSArtworkChoices.read(), rs = window.HSArtworkEngine.recipes;
      return k === 'art_style_direction' ? rs.styles[chosen.style].label + '. ' + rs.styles[chosen.style].grammar : rs.tones[chosen.tone].label + '. ' + rs.tones[chosen.tone].art;
    }
    if (k === 'art_energy' && (cityArtPreview() || nativeArtworkPurchase())) { var code = artworkEnergy(); return code ? window.HSArtworkEngine.recipes.energy.directions[code] : 'none'; }
    if (k === 'city' && (cityArtPreview() || nativeArtworkPurchase())) return String(state.city || '').trim();
    if (V3_ANSWER.test(k)) return v3Answer(k);
    var v = (state[k] == null ? '' : String(state[k])).trim();
    return v || (NAMES.indexOf(k) === -1 ? DEFAULTS[k] : '');
  }
  /* v3, gifts from your dog (docs/V3-GIFTS-FROM-YOUR-DOG.md). The chat (hs3.js) leaves its
     words in this same state: hs3_lines (home, spot, together, meaning) and hs3_kinds, which
     gift each product handle is. Each Teeinblue campaign numbers its lines in the order below,
     so "Line 1" on the mug is the home line and on the ornament the meaning line. */
  var V3_ANSWER = /^(line[1-4]|signed|hs_answers|hs_lines|hs_ship_to)$/;
  var V3_ORDER = { mug: ['home', 'spot', 'meaning'], ornament: ['meaning'], blanket: ['home', 'spot', 'together', 'meaning'], print: ['home', 'spot', 'together', 'meaning'] };
  function v3Kind() { var native = document.querySelector('#buy[data-hs2-artwork-kind]'); if (native) return native.getAttribute('data-hs2-artwork-kind'); var kinds = state.hs3_kinds || {}; return kinds[handleOf(window.location.pathname)] || ''; }
  function mugProduct() { return v3Kind() === 'mug' || handleOf(window.location.pathname) === 'the-morning-mug'; }
  // Opt-in preview only. Existing products retain their approved photo flow.
  function cityArtPreview() { return !!document.querySelector('#buy[data-hs2-city-art-preview]'); }
  function blanketArtPreview() { return !!document.querySelector('#buy[data-hs2-blanket-art-preview], #buy[data-hs2-blanket-purchase]'); }
  function nativeArtworkPurchase() { return !!document.querySelector('#buy[data-hs2-blanket-purchase], #buy[data-hs2-artwork-kind]'); }
  /* The one upload a painting may use, held in sessionStorage so a reload cannot send a second.
     It has two stages (28 Oct): 'preparing' while the photo is checked and cleaned on this device,
     and 'sent', written synchronously just before the photo is handed to Teeinblue. A 'preparing'
     lock with no preparation running on this page (the tab reloaded or was discarded first) sent
     nothing, so it is cleared. A 'sent' lock, and a lock from before the stages, holds until a new
     image arrives. */
  function blanketUploadPending() {
    var key = 'hs2-blanket-upload:' + productId(), pending;
    try { pending = JSON.parse(window.sessionStorage.getItem(key) || 'null'); } catch (e) { return true; }
    if (!pending) return false;
    if (pending.stage === 'preparing' && !keepTibPhoto.preparing) {
      try { window.sessionStorage.removeItem(key); } catch (e) { return true; }
      photoLog('lock:stale', { lock: 'preparing' });
      return false;
    }
    var src = cityArtSource(), photo = document.querySelector('.tee-field--photo .tee-photo-image');
    if (src && src !== pending.before && photo && photo.getAttribute('src') === src && !document.querySelector('.vm--container')) {
      try { window.sessionStorage.removeItem(key); } catch (e) { return true; }
      return false;
    }
    return true;
  }
  function beginBlanketUpload() {
    if (!productId() || blanketUploadPending() || !nativeBlanketInputsReady()) return false;
    try { window.sessionStorage.setItem('hs2-blanket-upload:' + productId(), JSON.stringify({before: cityArtSource(), stage: 'preparing'})); return true; }
    catch (e) { return false; }
  }
  // the lock's second stage, written before the vendor's change event and never after it
  function blanketUploadSent() {
    var key = 'hs2-blanket-upload:' + productId();
    try {
      var lock = JSON.parse(window.sessionStorage.getItem(key) || 'null');
      if (!lock || typeof lock !== 'object') return false;
      lock.stage = 'sent';
      window.sessionStorage.setItem(key, JSON.stringify(lock));
      return true;
    } catch (e) { return false; }
  }
  function blanketPurchaseStatus(message) {
    var buy = document.querySelector('#buy[data-hs2-artwork-kind]');
    var unavailable = 'This gift is not available to order yet.';
    if (buy && buy.getAttribute('data-hs2-purchase-enabled') !== 'true' && message.indexOf(unavailable) !== 0) message = unavailable + ' ' + message;
    var el = document.querySelector('[data-hs2-artwork-status]');
    if (el && el.textContent !== message) el.textContent = message;
  }
  var blanketAcceptedKey = '';
  function blanketReviewKey() { return artRequestKey() + ':' + cityArtSource(); }
  function blanketNativeError() {
    return Array.prototype.some.call(document.querySelectorAll('#buy .tee-field--invalid, #buy [role="alert"]'), function (el) {
      return !!el.getClientRects().length && (el.classList.contains('tee-field--invalid') || /failed|error|could not|unable/i.test(el.textContent));
    });
  }
  function invalidateBlanketReview() {
    blanketAcceptedKey = '';
    var acceptance = document.querySelector('[data-hs2-artwork-accept]');
    if (acceptance) acceptance.checked = false;
    try { syncTibAgreement(false); } catch (err) { /* our own review is already cleared */ }
  }
  /* Teeinblue asks for its own "responsible for my personalization" tick after ours (28 Oct: two
     boxes for one painting). Krish: our one tick covers both, and our sentence carries the clause.
     Its box is found by its words, so no design option is ever touched; it is clicked only when it
     differs (Teeinblue keeps its own state), at most three times for each change, and hidden only
     once recognized. A box with other words stays on show for the buyer to answer. */
  function syncTibAgreement(on) {
    on = !!on;
    if (syncTibAgreement.on !== on) { syncTibAgreement.on = on; syncTibAgreement.tries = 0; }
    Array.prototype.forEach.call(document.querySelectorAll('#buy .tee-checkbox-wrapper'), function (wrap) {
      var box = wrap.querySelector('input[type="checkbox"]');
      if (!box || !/responsib|approve|confirm|agree/i.test(wrap.textContent || '')) return;
      if (!wrap.hasAttribute('data-hs2-tib-agreement')) wrap.setAttribute('data-hs2-tib-agreement', '');
      if (box.checked !== on && syncTibAgreement.tries < 3) { syncTibAgreement.tries++; box.click(); }
    });
  }
  function blanketReviewAccepted() {
    if (document.querySelector('.vm--container')) { invalidateBlanketReview(); return false; }
    return blanketAcceptedKey === blanketReviewKey() && !blanketNativeError();
  }
  function syncBlanketProperties() {
    if (!nativeArtworkPurchase()) return;
    document.querySelectorAll('#hs2-product-form [data-hs2-prop]').forEach(function (input) {
      var key = input.getAttribute('data-hs2-prop');
      if (['personality', 'art_style', 'art_tone', 'hs_lines', 'hs_answers', 'hs_ship_to'].indexOf(key) !== -1) input.value = answer(key);
    });
  }
  function artworkChoicesChanged() { syncBlanketProperties(); runBridge(); }
  function resetBlanketUpload() {
    try {
      // Invalidate the old UI request before unlocking. Reset never sends a photo.
      window.sessionStorage.setItem('hs2-art-request:' + productId() + ':latest', 'retry-required');
      window.sessionStorage.removeItem('hs2-blanket-upload:' + productId());
      keepTibPhoto.preparing = null; // Cancel local preparation; never dispatch after an explicit reset.
      doHandoff.artKey = '';
      blanketAcceptedKey = '';
      return true;
    } catch (e) { return false; }
  }
  /* The fallback home for a photo outcome, used only while Teeinblue has not drawn its photo field
     (photoNote puts it right after that field once it exists): a reason in plain words, and for a
     dog the detector may have missed, "It's my dog. Use this photo." */
  function photoCheck(message, override) {
    var box = document.querySelector('[data-hs2-photo-check]');
    if (!box) { if (message) blanketPurchaseStatus(message); return; }
    box.hidden = !message;
    var text = box.querySelector('[data-hs2-photo-check-text]'), btn = box.querySelector('[data-hs2-photo-override]');
    if (text && text.textContent !== (message || '')) text.textContent = message || '';
    if (btn) {
      btn.hidden = !override;
      btn.onclick = override ? function () { btn.hidden = true; override(); } : null;
    }
  }
  /* Every photo outcome where the buyer is (Krish's Android phone, 28 Oct: a rejected or failed photo
     just reset Teeinblue's field, and the reason was written above the form, out of sight). The same
     words, and the "It's my dog. Use this photo." override, go (1) under the journey card's photo
     button, (2) inside the saved-photo choice card while it shows and (3) in a line right after
     Teeinblue's photo field. Only the last is a live region, so a screen reader hears it once. */
  function photoNote(text, override) {
    var message = text || '', used = false;
    photoNote.text = message; photoNote.override = override || null;
    var run = override ? function () { if (used) return; used = true; photoNote(''); override(); } : null;
    var go = document.querySelector('[data-hs-journey-photo]'), card = go && go.closest ? go.closest('[data-hs-journey-card]') : null;
    var under = document.querySelector('[data-hs-journey-photo-status]');
    if (card && !under && message) under = photoNoteSpot('data-hs-journey-photo-status', false);
    if (under && card && card.nextElementSibling !== under && card.insertAdjacentElement) card.insertAdjacentElement('afterend', under);
    if (under) photoNoteFill(under, card ? message : '', run);
    var choice = document.querySelector('[data-hs2-blanket-photo-status]');
    if (choice) photoNoteFill(choice, message, run);
    var field = document.querySelector('.tee-field--photo'), inline = document.querySelector('[data-hs2-photo-inline]');
    if (field && !inline && message) inline = photoNoteSpot('data-hs2-photo-inline', true);
    if (inline && field && field.nextElementSibling !== inline && field.insertAdjacentElement) field.insertAdjacentElement('afterend', inline);
    if (inline && field) { photoNoteFill(inline, message, run); photoCheck(''); }
    else { if (inline) photoNoteFill(inline, '', null); photoCheck(message, run); }
  }
  function photoNoteSpot(attr, live) {
    var spot = document.createElement('div'), text = document.createElement('p'), btn = document.createElement('button');
    spot.className = 'hs-photo-note'; spot.setAttribute(attr, ''); spot.hidden = true;
    if (live) { spot.setAttribute('role', 'status'); spot.setAttribute('aria-live', 'polite'); }
    text.setAttribute('data-hs-photo-note-text', '');
    btn.type = 'button'; btn.hidden = true; btn.setAttribute('data-hs-photo-note-override', ''); btn.textContent = "It's my dog. Use this photo.";
    spot.appendChild(text); spot.appendChild(btn);
    return spot;
  }
  function photoNoteFill(spot, message, run) {
    spot.hidden = !message;
    var text = spot.querySelector('[data-hs-photo-note-text]') || spot, btn = spot.querySelector('[data-hs-photo-note-override]');
    if (text.textContent !== message) text.textContent = message;
    if (btn) { btn.hidden = !run; btn.onclick = run; }
  }
  // why a photo is held instead of starting another painting, in words the buyer can act on. "Artwork
  // failed or stopped?" is named only while it shows: artStage holds it back for a painting's first
  // two minutes, and the words sent the buyer to a control that was not on the page (28 Oct review).
  function photoHeld() {
    if (keepTibPhoto.preparing) return "I'm still getting your last photo ready. Give me a moment.";
    if (blanketUploadPending()) {
      var recovery = document.querySelector('[data-hs2-upload-recovery]'), who = String(answer('dog') || '').trim() || 'your dog';
      if (recovery && recovery.getClientRects().length) return 'I\'m still working on the photo you sent. If it stopped, open "Artwork failed or stopped?" below.';
      return "I'm still painting " + who + ' from the photo you sent. Most paintings take 1 to 3 minutes.';
    }
    if (!nativeBlanketInputsReady()) return 'Your choices are still loading into the painter. Choose the photo again in a moment.';
    return "This browser didn't let me hold your place. Allow this site to save data, then choose the photo again.";
  }
  // the real reason a photo could not be made ready, never one sentence for every cause
  function photoReason(error, file) {
    var code = error && error.code;
    if (file && (/^image\/hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || ''))) return "This photo is saved as HEIC, which I can't paint from. Choose a JPEG of your dog instead.";
    if (code === 'type') return 'I can paint from a JPEG, PNG or WebP photo. Choose one of those.';
    if (code === 'megapixels') return 'This photo is over 40 megapixels, more than I can get ready. Choose a smaller copy of it.';
    if (code === 'unreadable' || (error && error.name === 'NotReadableError')) return "I couldn't open this photo. Try a JPEG or PNG from your camera roll.";
    if (code === 'timeout') return 'This photo took too long to get ready. Choose it again, or try a different photo.';
    if (code === 'changed') return 'Your choices changed while I was getting the photo ready. Choose it again.';
    if (code === 'detached') return "Your photo didn't reach the painter. Choose it again.";
    if (code === 'storage') return "This browser didn't let me hold your place. Allow this site to save data, then choose the photo again.";
    return "I couldn't get this photo ready in this browser. Choose it again, or try a different photo.";
  }
  // Teeinblue's photo input as it is now: it redraws its fields, and a redrawn input is a new element
  function livePhotoInput(inp) {
    if (inp && inp.isConnected) return inp;
    var live = photoInput();
    return live && live !== inp && live.isConnected ? live : null;
  }
  /* One tap opens the phone's picker (Krish, 28 Oct: "Add Mochi's photo" only scrolled a long way and
     needed a second tap). click() must run inside the tap, before any timer or promise, or the
     browser refuses to open the picker. Teeinblue's input is never display:none (see hs2.css). */
  function openPhotoPicker(from) {
    if (blanketUploadPending()) { photoNote(photoHeld()); photoLog('picker:held', { from: from }); return false; }
    var inp = photoInput();
    if (inp && !inp.disabled) {
      photoLog('picker', { from: from, id: inp.id || '', accept: inp.getAttribute ? inp.getAttribute('accept') || '' : '', capture: inp.getAttribute ? inp.getAttribute('capture') || '' : '' });
      inp.click();
      return true;
    }
    // Teeinblue has not drawn its photo field yet: go to where it will be, without a long animation
    var target = document.querySelector('.tee-field--photo, [data-hs2-photo-step], .tee-form-wrapper');
    if (target && target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'auto' });
    photoNote('The photo step is still loading. Tap again in a moment.');
    photoLog('picker:loading', { from: from, input: !!inp });
    return false;
  }
  /* The dog detector (about 19 MB) loads only once a photo is picked (28 Oct). Warming it as the
     photo step scrolled into view could put that download and a WebGL pause on a phone just before
     its picker opened; check() skips the dog checks when the detector is not ready in time. */
  function warmPhotoCheck() {
    if (warmPhotoCheck.done || !nativeArtworkPurchase()) return;
    warmPhotoCheck.done = true;
    document.addEventListener('change', function (e) {
      var inp = e.target;
      if (warmPhotoCheck.loaded || !window.HSPhotoQuality || !inp || inp.type !== 'file' || !inp.matches) return;
      if (!inp.matches('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]') || !(inp.files && inp.files[0])) return;
      var conn = navigator.connection || {};
      if (conn.saveData || /2g/.test(conn.effectiveType || '')) return;
      warmPhotoCheck.loaded = true;
      var t0 = Date.now();
      photoLog('detector', { trigger: 'pick' });
      try {
        Promise.resolve(window.HSPhotoQuality.loadDetector()).then(function (detector) { photoLog(detector ? 'detector:ready' : 'detector:none', { ms: Date.now() - t0 }); });
      } catch (err) { /* the check fails open without it */ }
    }, true);
  }
  function sendBlanketPhoto() {
    if (!nativeArtworkPurchase() || !usePhoto.file || blanketUploadPending() || !nativeBlanketInputsReady()) return;
    var target = photoInput();
    if (!target) { photoNote('The painter is still loading. Your photo is saved, so tap again in a moment.'); return; }
    try {
      var transfer = new DataTransfer(); transfer.items.add(usePhoto.file);
      target.files = transfer.files;
      // The capture handler persists the single-request guard before native dispatch.
      // No timers, refill API or retry follows this explicit click.
      target.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      photoNote("I couldn't pass your saved photo to the painter in this browser. Choose it again with Use a different photo.");
    }
  }
  function bindBlanketRecovery() {
    var box = document.querySelector('[data-hs2-upload-recovery]');
    if (!nativeArtworkPurchase() || !box) return;
    document.querySelector('[data-hs2-blanket-create]').addEventListener('click', sendBlanketPhoto);
    // "Use a different photo": Teeinblue's field comes back first, then the picker opens in this same tap
    var different = document.querySelector('[data-hs2-photo-different]');
    if (different) different.addEventListener('click', function () {
      updateBlanketPurchaseStatus.different = true;
      var buy = document.getElementById('buy');
      if (buy) buy.classList.remove('hs2-photo-choice');
      openPhotoPicker('different');
    });
    var acceptance = document.querySelector('[data-hs2-artwork-accept]');
    acceptance.addEventListener('change', function () {
      blanketAcceptedKey = acceptance.checked && !blanketUploadPending() && cityArtSaved() && !blanketNativeError() ? blanketReviewKey() : '';
      acceptance.checked = !!blanketAcceptedKey;
      // the same tick answers Teeinblue's own agreement box (Krish, 28 Oct)
      try { syncTibAgreement(!!blanketAcceptedKey); } catch (err) { /* our review stands on its own */ }
    });
    var ack = box.querySelector('[data-hs2-upload-retry-ack]'), button = box.querySelector('[data-hs2-upload-retry]');
    ack.addEventListener('change', function () { button.disabled = !ack.checked; });
    button.addEventListener('click', function () {
      if (!ack.checked) return;
      if (!resetBlanketUpload()) { blanketPurchaseStatus('This browser could not save the retry choice. No new upload has started.'); return; }
      ack.checked = false; button.disabled = true; box.open = false;
      updateBlanketPurchaseStatus();
      blanketPurchaseStatus('No new artwork has started. Use your saved photo or choose a different photo below when you are ready to retry.');
    });
  }
  function nativeBlanketInputsReady() {
    var fields = tibFields();
    // a campaign without the hidden direction fields is still ready; one that has them must carry
    // the chosen text, so the storefront can go live before Teeinblue gets the 28 Oct prompt
    var keys = ['personality', 'art_style', 'art_tone'];
    ['art_energy', 'art_style_direction', 'art_tone_direction'].forEach(function (k) { if (fields.some(function (f) { return f.rule.k === k; })) keys.push(k); });
    return keys.every(function (key) {
      var field = fields.find(function (f) { return f.rule.k === key; });
      if (!field) return false;
      var text = field.el.querySelector('input[type="text"], input:not([type]), textarea');
      if (text) return text.value === answer(key);
      var select = field.el.querySelector('select');
      if (select) { var option = select.options[select.selectedIndex]; return !!option && choiceMatches(option.textContent, key); }
      var selectedRadio = Array.prototype.some.call(field.el.querySelectorAll('input[type="radio"]'), function (radio) {
        var label = radioLabel(radio);
        return radioPicked(radio) && choiceMatches(label ? label.textContent : radio.value, key);
      });
      return selectedRadio || Array.prototype.some.call(field.el.querySelectorAll('button, [role="radio"], [role="option"], .tee-option'), function (option) {
        return (/active|selected|checked/.test(option.className) || option.getAttribute('aria-checked') === 'true') && choiceMatches(option.textContent, key);
      });
    });
  }
  /* The painting, then the finished design (Krish, 28 Oct: the wait "looks broken", and the tickbox
     sat above the picture). While Teeinblue paints, the card shows the buyer's photo as a sketch
     under a moving wash and says only what is known (29 Oct handover): the photo is being checked on
     this device, it is with the painter, the framing box is open, or it is going onto the gift.
     Teeinblue reports nothing between "sent" and "ready", so there is no percentage and no "nearly
     there": the bar sweeps without a value and the card counts the time since it started. */
  function artPhase(t, open) {
    var lock = '';
    try { lock = (JSON.parse(window.sessionStorage.getItem('hs2-blanket-upload:' + productId()) || 'null') || {}).stage || ''; } catch (e) { lock = ''; }
    if (open) return 'framing';
    if (artStage.framed) return 'placing';
    if (lock === 'preparing') return 'checking';
    return t > 120000 ? 'long' : 'painting';
  }
  function artWords(phase) {
    return { checking: 'Checking your photo on this device and getting it ready.', painting: 'Your photo is with the painter. The finished picture comes back all at once.',
      long: "This one is taking longer than most. It's still going, and you don't need to send the photo again.", framing: "It's painted. Check the framing, then Save.", placing: 'Putting it on your gift.' }[phase];
  }
  function artElapsed(t) {
    var s = Math.max(0, Math.floor(t / 1000));
    if (s < 10) return 'Started just now.';
    if (s < 60) return 'Started ' + (s - s % 10) + ' seconds ago.';
    var m = Math.floor(s / 60);
    return 'Started ' + m + (m === 1 ? ' minute' : ' minutes') + ' ago.';
  }
  function artStage(pending) {
    var card = document.querySelector('[data-hs-art]');
    if (!card) return '';
    var key = 'hs-art-start:' + productId();
    var painting = (pending || !!document.querySelector('#buy .tee-field--photo .tee-photo-uploading')) && !blanketNativeError();
    var done = !painting && cityArtSaved() && !blanketNativeError();
    var next = done ? 'done' : painting ? 'painting' : 'idle', was = card.getAttribute('data-state');
    var who = String(answer('dog') || '').trim() || 'your dog';
    card.hidden = next === 'idle';
    card.setAttribute('data-state', next);
    // the gallery paints too, over the preview that is still empty
    var stage = document.querySelector('[data-hs2-stage]');
    if (stage) { stage.classList.toggle('hs-painting', next === 'painting'); stage.setAttribute('data-hs-painting', 'Painting ' + who); }
    // Until the buyer's painting is in it, Teeinblue's preview shows its own sample dog. The blanket
    // has no words, and a gift page reached without the chat has none of the buyer's either, so the
    // labeled example photo stays on show until there is art, unless the buyer chose a picture
    // themselves. After the chat the preview carries the buyer's words (Krish, 19 Oct), so it stays
    // on show, labeled as an example while the dog in it is Teeinblue's (29 Oct: "Your design" was the
    // current thumbnail over the sample pug on the mug and the portrait).
    var media = document.querySelector('[data-hs2-media]'), sample = next === 'idle' && !previewHasArt();
    if (media) { if (sample) media.setAttribute('data-hs2-sample-dog', ''); else media.removeAttribute('data-hs2-sample-dog'); }
    // the release runs whatever the lines are: typing the note in Teeinblue's field writes lines
    // after the hold began, and the painting must still come back on show (29 Oct review)
    if (media && !media.__hs2picked) {
      var hold = sample && (blanketArtPreview() || !state.hs3_lines), pick = null;
      if (hold && !media.hasAttribute('data-show')) { media.setAttribute('data-show', 'photo'); media.__hs2held = true; pick = media.querySelector('[data-hs2-thumb]:not([hidden])'); }
      else if (!hold && media.__hs2held) { media.removeAttribute('data-show'); media.__hs2held = false; pick = media.querySelector('[data-hs2-thumb-preview]'); }
      if (pick) media.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === pick ? 'true' : 'false'); });
    }
    card.querySelector('[data-hs-art-painting]').hidden = next !== 'painting';
    card.querySelector('[data-hs-art-done]').hidden = next !== 'done';
    var photo = card.querySelector('[data-hs-art-photo]'), result = card.querySelector('[data-hs-art-result]');
    // "Artwork failed or stopped?" only once a painting has run two minutes, or on a real error:
    // under a normal run it invited doubt (28 Oct, order 1). The status code still owns hidden.
    var recovery = document.querySelector('[data-hs2-upload-recovery]');
    if (next !== 'painting') { clearInterval(artStage.timer); artStage.timer = null; artStage.tick = null; artStage.framed = false; if (recovery) recovery.style.display = ''; }
    if (next === 'painting') {
      var start = 0;
      try { start = Number(window.sessionStorage.getItem(key)) || 0; if (!start) window.sessionStorage.setItem(key, String(start = Date.now())); } catch (e) { start = artStage.start || (artStage.start = Date.now()); }
      card.querySelector('[data-hs-art-title]').textContent = 'Painting ' + who;
      // honest timing, and Teeinblue's framing box named before it opens by itself (28 Oct)
      var note = card.querySelector('.hs-art__note'), timing = "Most paintings take 1 to 3 minutes. When it's done, check the framing, then Save.";
      if (note && note.textContent !== timing) note.textContent = timing;
      photo.hidden = !photoURL;
      if (photoURL && photo.getAttribute('src') !== photoURL) photo.src = photoURL;
      var tick = function () {
        var t = Date.now() - start, line = card.querySelector('[data-hs-art-line]'), elapsed = card.querySelector('[data-hs-art-elapsed]');
        var open = !!document.querySelector('.vm--container');
        // the framing box opens once the painting is back; after it closes the words move on and never
        // return to "painting" (a timer kept from the first call once put an old line over the open box)
        if (open) artStage.framed = true;
        var say = artWords(artPhase(t, open));
        if (line.textContent !== say) line.textContent = say;
        var since = artElapsed(t);
        if (elapsed && elapsed.textContent !== since) elapsed.textContent = since;
        if (recovery) recovery.style.display = t < 120000 ? 'none' : '';
      };
      artStage.tick = tick;
      tick();
      if (!artStage.timer) artStage.timer = setInterval(function () { if (card.getAttribute('data-state') === 'painting' && artStage.tick) artStage.tick(); }, 1000);
      // the moment it starts, bring the painting into view instead of the small loader below
      if (was !== 'painting' && card.scrollIntoView) card.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    } else {
      try { window.sessionStorage.removeItem(key); } catch (e) { artStage.start = 0; }
    }
    if (next === 'done') {
      var src = cityArtSource();
      if (src && result.getAttribute('src') !== src) result.src = src;
      result.hidden = !src;
      card.querySelector('[data-hs-art-done-title]').textContent = "Here's " + who + '.';
      var yes = card.querySelector('[data-hs-art-yes]');
      if (yes) yes.textContent = who === 'your dog' ? 'Yes, this is my dog.' : 'Yes, this is ' + who + '.';
      if (was === 'painting') {
        card.classList.add('is-new');
        setTimeout(function () { card.classList.remove('is-new'); }, 1200);
        if (card.scrollIntoView) card.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        var title = card.querySelector('[data-hs-art-done-title]');
        if (title.focus) title.focus({ preventScroll: true });
      }
    }
    return next;
  }
  // a blocked Add to cart shows the buyer the one thing left to do, where it is
  function nudgeReview() {
    var wrap = document.querySelector('[data-hs2-artwork-accept-wrap]');
    if (!wrap || wrap.hidden || !wrap.getClientRects || !wrap.getClientRects().length) return false;
    if (wrap.scrollIntoView) wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
    wrap.classList.remove('is-nudged'); void wrap.offsetWidth; wrap.classList.add('is-nudged');
    return true;
  }
  function updateBlanketPurchaseStatus() {
    updatePortraitSignatureRecovery();
    updateRestoredArtworkReview();
    var pending = blanketUploadPending();
    // the card says it in pictures; the status line stays for anything the card does not cover
    var staged = artStage(pending) !== 'idle' && !!document.querySelector('[data-hs-art]');
    /* The photo the buyer gave Buddy, as one choice (Krish, 28 Oct: "the UI should absolutely really be
       asking if you want to add to that or use a different picture"). While the card shows, Teeinblue's
       empty uploader is clip-hidden by the hs2-photo-choice class (never display:none, iOS ignores
       click() on those) until the buyer picks "Use a different photo". */
    var photoBox = document.querySelector('[data-hs2-blanket-photo]'), choosing = false;
    if (photoBox) {
      var wasHidden = photoBox.hidden;
      photoBox.hidden = !usePhoto.file || artRequested();
      var photo = photoBox.querySelector('[data-hs2-blanket-photo-img]'), create = photoBox.querySelector('[data-hs2-blanket-create]');
      if (photoURL && photo.getAttribute('src') !== photoURL) photo.src = photoURL;
      create.disabled = pending || !nativeBlanketInputsReady();
      var named = answer('dog') || 'your dog', ask = photoBox.querySelector('[data-hs2-blanket-photo-line]');
      if (ask && ask.textContent !== 'Paint ' + named + ' from this photo?') ask.textContent = 'Paint ' + named + ' from this photo?';
      if (create.textContent !== 'Use ' + possessive(named) + ' photo') create.textContent = 'Use ' + possessive(named) + ' photo';
      choosing = !photoBox.hidden && !updateBlanketPurchaseStatus.different;
      var buyBox = document.getElementById('buy');
      if (buyBox) buyBox.classList.toggle('hs2-photo-choice', choosing);
      // the journey card's photo button reads "Paint <dog> from your photo" while this card shows
      if (wasHidden !== photoBox.hidden) journeyCard();
      // a photo outcome stays where the buyer is, even after Teeinblue redraws its field
      if (photoNote.text) photoNote(photoNote.text, photoNote.override);
    }
    var recovery = document.querySelector('[data-hs2-upload-recovery]');
    if (recovery) recovery.hidden = !pending;
    var link = document.querySelector('[data-hs2-artwork-source]');
    if (link) { link.hidden = true; link.removeAttribute('href'); }
    var acceptance = document.querySelector('[data-hs2-artwork-accept]'), review = document.querySelector('[data-hs2-artwork-accept-wrap]');
    if (review) review.hidden = true;
    if (acceptance && !blanketReviewAccepted()) { acceptance.checked = false; blanketAcceptedKey = ''; }
    document.querySelectorAll('[data-hs-art-choices] select').forEach(function (select) { select.disabled = pending; });
    if (pending) { blanketPurchaseStatus(staged ? '' : 'Waiting for your artwork. Save its placement when it appears. Another upload is held while this request is unresolved.'); return; }
    if (!nativeBlanketInputsReady()) { blanketPurchaseStatus('Loading your choices into the personalizer.'); return; }
    var saved = cityArtSaved() && !blanketNativeError(), requested = artRequested();
    var who = answer('dog') || 'your dog';
    blanketPurchaseStatus(saved ? (staged ? '' : 'Artwork saved. Check every whisker, face and marking before you add your gift.') : restoredArtworkAvailable() ? 'Saved artwork is available. Choose Review this saved artwork to inspect it without creating another image.' : requested ? 'Painting ' + who + ' now. This can take a minute. Save its placement when it appears. Uploading again makes another image.' : latestArtRequest() ? 'Create matching artwork with your photo below before adding your gift.' : choosing ? 'Create artwork with your saved photo. Check the result before adding your gift.' : 'Add ' + possessive(who) + ' photo below. Buddy paints from it.');
    if (link) { link.hidden = !saved; if (saved) link.href = cityArtSource(); else link.removeAttribute('href'); }
    if (review) review.hidden = !saved;
  }
  function artworkFacts() {
    var profile = state.hs3_art_profile;
    // Existing chat sessions can migrate without making the buyer answer again.
    if (!profile && window.HSArtworkProfile) {
      try { profile = window.HSArtworkProfile.fromChat(JSON.parse(window.sessionStorage.getItem('hs3-gift') || '{}')); } catch (e) { /* portrait-only fallback */ }
    }
    return window.HSArtworkProfile ? window.HSArtworkProfile.serialize(profile) : '{"version":1,"facts":[]}';
  }
  // The breed's energy code, worked out in the chat (HSBreeds only loads there). Never a fact.
  function artworkEnergy() {
    var code = state.hs3_energy, engine = window.HSArtworkEngine;
    return code && engine && engine.recipes.energy && Object.prototype.hasOwnProperty.call(engine.recipes.energy.directions, code) ? code : null;
  }
  function nativeArtworkEvidence() {
    var evidence = JSON.parse(artworkFacts());
    // Transport projection only: the buyer's optional place is not a personality fact.
    if (!blanketArtPreview() && !document.querySelector('#buy[data-hs2-mug-art-preview], #buy[data-hs2-artwork-kind="mug"]')) {
      var city = String(state.city || '').trim();
      evidence.place = city ? { source: 'buyer', text: city } : null;
    }
    return JSON.stringify(evidence);
  }
  function artRequestKey() {
    // UI staleness key only. This timestamp cannot attest photo bytes; the engine
    // requires original/upload hashes before a production request can be prepared.
    var choice = window.HSArtworkChoices ? window.HSArtworkChoices.read() : null;
    var key = {
      photoSession: usePhoto.t, facts: artworkFacts(), city: blanketArtPreview() ? '' : state.city || '',
      choices: choice ? {style: choice.style, tone: choice.tone} : null,
      variant: document.querySelector('#buy[data-hs2-artwork-kind]') ? v3Kind() + '-native-family' : document.querySelector('[data-hs2-variant-id]') && document.querySelector('[data-hs2-variant-id]').value,
      format: blanketArtPreview() ? 'blanket' : v3Kind() || 'portrait',
      recipe: window.HSArtworkEngine && window.HSArtworkEngine.recipeHash
    };
    // energy only when set, so a Warm, no-breed session keeps the key it had
    var energy = artworkEnergy();
    if (energy) key.energy = energy;
    return 'hs2-art-request:' + productId() + ':candidate-v3-optional-place:' + JSON.stringify(key);
  }
  async function prepareCurrentArtwork(format, variant, exactModel) {
    if (!cityArtPreview() || !window.HSArtworkPhoto || !window.HSArtworkChoices) throw new Error('Draft artwork preparation only');
    // The image reuse key ignores words only: tone and breed energy change the painting.
    // Preparation must still bind the exact copy and choices across both awaits.
    function preparationRevision() {
      return JSON.stringify([artRequestKey(), window.HSArtworkChoices.read(),
        state.hs3_copy_owner || 'generated', String((state.hs3_lines || {}).meaning || ''), answer('signed')]);
    }
    var file = usePhoto.file, revision = preparationRevision();
    if (!file) throw new Error('The original dog photo is required');
    var prepared = await window.HSArtworkPhoto.prepare(file);
    if (file !== usePhoto.file || revision !== preparationRevision()) throw new Error('Your choices changed during preparation');
    var request = await window.HSArtworkChoices.prepare({photo: prepared.photo,
      factsProfile: JSON.parse(artworkFacts()), city: String(state.city || ''), citySource: state.city ? 'buyer' : null, energy: artworkEnergy(),
      format: format, variant: variant, model: exactModel,
      copy: {owner: state.hs3_copy_owner || 'generated', note: String((state.hs3_lines || {}).meaning || ''), signature: answer('signed')}});
    if (file !== usePhoto.file || revision !== preparationRevision()) throw new Error('Your choices changed during preparation');
    // No dispatch. Keep original bytes private; only the normalized file may be
    // handed to a future gated adapter after source/model/provider verification.
    return {request: request, upload: prepared.file, sourceWidth: prepared.width, sourceHeight: prepared.height};
  }
  function latestArtRequest() {
    if (doHandoff.artKey) return doHandoff.artKey;
    try {
      var prefix = 'hs2-art-request:' + productId() + ':', latest = window.sessionStorage.getItem(prefix + 'latest');
      if (latest) return latest;
      // Preserve an existing single-request draft session. Multiple old requests
      // have no reliable ordering, so none can certify the displayed image.
      var legacy = [];
      for (var i = 0; i < window.sessionStorage.length; i++) {
        var key = window.sessionStorage.key(i);
        if (key.indexOf(prefix) === 0 && window.sessionStorage.getItem(key) === 'sent') legacy.push(key);
      }
      if (legacy.length === 1) {
        window.sessionStorage.setItem(prefix + 'latest', legacy[0]);
        return legacy[0];
      }
    } catch (e) { /* memory guard remains */ }
    return '';
  }
  function artRequested() {
    return latestArtRequest() === artRequestKey();
  }
  function markArtRequested() {
    doHandoff.artCity = answer('city'); doHandoff.artPhoto = usePhoto.t;
    doHandoff.artKey = artRequestKey();
    try {
      window.sessionStorage.setItem('hs2-art-request:' + productId() + ':latest', doHandoff.artKey);
      window.sessionStorage.setItem(artRequestKey(), 'sent');
      window.sessionStorage.setItem(artRequestKey() + ':before', cityArtSource());
    } catch (e) { /* memory guard remains */ }
  }
  // A saved provider image is a preview to inspect, not proof of AI success or print readiness.
  function cityArtSource() {
    var link = document.querySelector('[data-hs2-artwork-source]');
    var id = link && link.getAttribute('data-hs2-artwork-layer');
    var layer = id && (document.getElementById('artwork-layer--' + id + '-image-placement') || document.getElementById('artwork-layer--' + id));
    var image = layer && (layer.matches('image') ? layer : layer.querySelector('image'));
    var src = image && (image.getAttribute('href') || image.getAttribute('xlink:href')) || '';
    if (!src || src.indexOf('6adb83e021733') !== -1) return ''; // approved concept placeholder
    try { var url = new URL(src, location.href); return url.protocol === 'https:' ? url.href : ''; } catch (e) { return ''; }
  }
  // art is in the preview once Teeinblue shows the same image in its photo field; each campaign's
  // empty preview is its own placeholder file, so the image alone proves nothing
  function previewHasArt() {
    var src = cityArtSource(), photo = document.querySelector('.tee-field--photo .tee-photo-image');
    return !!src && !!photo && photo.getAttribute('src') === src;
  }
  function cityArtSaved() {
    if (!(cityArtPreview() || nativeArtworkPurchase()) || (!artRequested() && !restoredArtworkChosen()) || document.querySelector('.vm--container')) return false;
    var src = cityArtSource(), before = '';
    var photo = document.querySelector('.tee-field--photo .tee-photo-image');
    if (!photo || photo.getAttribute('src') !== src) return false;
    try { before = window.sessionStorage.getItem(artRequestKey() + ':before') || ''; } catch (e) { /* no storage */ }
    return !!src && src !== before;
  }
  var restoredArtworkChoice = '';
  function restoredArtworkKey() {
    var dog = tibFields().filter(function (field) { return field.rule.k === 'dog'; })[0];
    var input = dog && dog.el.querySelector('input[type="text"], input:not([type]), textarea');
    return JSON.stringify([productId(), artRequestKey(), cityArtSource(), answer('dog'), input ? input.value : '']);
  }
  function restoredArtworkAvailable() {
    // No local request receipt means the native app may have restored an older design.
    // Never turn that into a claimed generation or revive a stale/uncertain local request.
    if (!nativeArtworkPurchase() || latestArtRequest() || blanketUploadPending() || !nativeBlanketInputsReady() || blanketNativeError() || document.querySelector('.vm--container')) return false;
    var src = cityArtSource(), photo = document.querySelector('.tee-field--photo .tee-photo-image');
    return !!src && !!photo && photo.getAttribute('src') === src;
  }
  function restoredArtworkChosen() {
    return !!restoredArtworkChoice && restoredArtworkAvailable() && restoredArtworkChoice === restoredArtworkKey();
  }
  function updateRestoredArtworkReview() {
    if (restoredArtworkChoice && restoredArtworkChoice !== restoredArtworkKey()) {
      restoredArtworkChoice = ''; invalidateBlanketReview();
    }
    var available = restoredArtworkAvailable();
    var box = document.querySelector('[data-hs2-restored-artwork]');
    if (!available || restoredArtworkChosen()) { if (box) box.hidden = true; return; }
    var status = document.querySelector('[data-hs2-artwork-status]');
    if (!status) return;
    if (!box) {
      box = document.createElement('div'); box.setAttribute('data-hs2-restored-artwork', '');
      var message = document.createElement('p'); message.setAttribute('role', 'status');
      message.textContent = 'We found artwork from your earlier visit. Review this saved design before adding your gift. Changing style or tone does not change this saved artwork.';
      var button = document.createElement('button'); button.type = 'button'; button.textContent = 'Review this saved artwork';
      button.addEventListener('click', function () {
        if (!restoredArtworkAvailable()) return;
        restoredArtworkChoice = restoredArtworkKey(); invalidateBlanketReview();
        updateBlanketPurchaseStatus();
        var review = document.querySelector('[data-hs2-artwork-accept]');
        if (review && review.getClientRects().length) review.focus();
      });
      box.appendChild(message); box.appendChild(button); status.parentNode.insertBefore(box, status);
    }
    box.hidden = false;
  }
  function v3Answer(k) {
    var lines = state.hs3_lines || {};
    if (k === 'signed') { if (typeof state.hs3_signature_override === 'string') return state.hs3_signature_override; var d = (state.dog == null ? '' : String(state.dog)).trim(); return d && state.hs3_lines ? 'Love, ' + d : ''; }
    if (k === 'hs_answers' || k === 'hs_ship_to') return state.hs3_lines ? String(state[k] || '') : '';
    var kind = v3Kind(), order = V3_ORDER[kind] || V3_ORDER.print;
    if (nativeArtworkPurchase() && !blanketArtPreview() && (k === 'line4' || k === 'hs_lines')) return String(lines.meaning || '');
    if (k === 'hs_lines') return cityArtPreview() ? String(lines.meaning || '') : order.map(function (key) { return lines[key] || ''; }).filter(Boolean).join(' / ');
    var key = order[Number(k.slice(4)) - 1];
    if (!key) return '';
    // the mug's note: the same words with "\n" at the most even break where a line won't fit one
    // row (hs3.js evenBreak, mug v3 spec), as long as they are still the words in hs3_lines
    var mug = kind === 'mug' && state.hs3_mug_lines ? state.hs3_mug_lines[key] : null;
    if (mug && String(mug).replace(/\n/g, ' ') === String(lines[key] || '')) return String(mug);
    return String(lines[key] || '');
  }
  function missingNames() { return NAMES.filter(function (k) { return !answer(k); }); }
  function engaged() { return !!(answer('dog') || answer('person')); }
  // a name cut to "Sir Biscuit O'" read "O''s" in the toast (28 Oct): its own apostrophes go first
  function possessive(n) { n = String(n == null ? '' : n).replace(/['’]+$/, ''); return /s$/i.test(n) ? n + "'" : n + "'s"; }
  function json(sel) {
    var el = document.querySelector(sel);
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }
  function lines(kind) { return json('script[data-hs2-lines="' + kind + '"]'); }
  function photos() { return json('script[data-hs2-photos]'); }
  function status(el, text) { if (el) el.textContent = text; }

  /* ------------------------------------------------------------------ render */
  function render() {
    var dog = val('dog'), person = val('person');
    var map = {
      dog: dog, DOG: dog.toUpperCase(), dogs: possessive(dog), person: person, cupboard: val('cupboard'),
      yourdog: answer('dog') || 'Your dog',
      improvement: val('improvement'), incident: val('incident'), enemy: val('enemy'),
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
    var offer = offerLabel();
    document.querySelectorAll('[data-hs2-voice]').forEach(function (b) {
      var on = val('voice');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-offer', !!offer);
      b.textContent = on
        ? 'Added: ' + dog + ' reads it out loud (15s video, emailed) · ' + (offer || '+$12')
        : '+ Hear ' + dog + ' read it out loud · 15s video · ' + (offer || '$12');
    });
    // links to product pages carry the answers
    document.querySelectorAll('[data-hs2-carry]').forEach(function (a) {
      var base = a.getAttribute('data-hs2-base') || a.getAttribute('href');
      if (!a.getAttribute('data-hs2-base')) a.setAttribute('data-hs2-base', base);
      if (!base || base.charAt(0) === '#') return;
      a.setAttribute('href', base + (base.indexOf('?') === -1 ? '?' : '&') + answerParams().toString());
    });
    // hidden line-item properties on product forms. An input with no key (the redo's _hs_redo_of)
    // carries its own value: answer('') turned it into "undefined" on the first edit (28 Oct)
    document.querySelectorAll('[data-hs2-prop]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-prop');
      if (!k) return;
      inp.value = k === 'voice' ? (val('voice') ? 'Yes' : '') : answer(k);
    });
    document.querySelectorAll('[data-hs2-input]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-input');
      if (state[k] != null && inp !== document.activeElement && inp.value !== String(state[k])) inp.value = state[k];
    });
    document.querySelectorAll('[data-hs2-names-nudge]').forEach(function (n) { if (!n.hidden && !missingNames().length) n.hidden = true; });
    var answers = document.querySelector('[data-hs2-answers]');
    if (answers && engaged()) answers.hidden = false;
    var personWrap = document.querySelector('[data-hs2-person-wrap]');
    if (personWrap) personWrap.hidden = !answer('person');
    bridgeSoon();
    journeyCard();
    exhibits();
    leakUI();
    drawSoon();
  }
  /* The product page as the chat's last step (27 Oct): Buddy's bar and the journey card show what
     the buyer told Buddy (from, to, the printed words, what gets painted, style and tone), each
     with a Change link back to that exact chat step, which returns here (&return=). */
  function journeyCard() {
    var box = document.querySelector('[data-hs-journey]');
    if (!box) return;
    var gift = box.getAttribute('data-gift'), dog = answer('dog'), person = answer('person');
    var line = box.querySelector('[data-hs-journey-line]'), intro = box.querySelector('[data-hs-journey-intro]'), card = box.querySelector('[data-hs-journey-card]');
    var here = box.querySelector('[data-hs-journey-here]');
    if (here && !here.__hs2) {
      here.__hs2 = true;
      here.addEventListener('click', function () {
        journeyCard.here = true; journeyCard(); track('journey_fill_here', { gift: gift });
        var form = document.querySelector('.tee-form-wrapper, [data-hs2-tib-gallery]');
        if (form && form.scrollIntoView) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
    if (!(dog && state.hs3_lines)) {
      if (line) line.textContent = journeyCard.here ? "Fill it in below. I'll be right here." : "Hi, I'm Buddy. I help dogs pick gifts for their people.";
      if (intro) intro.hidden = !!journeyCard.here;
      if (card) card.hidden = true;
      return;
    }
    if (intro) intro.hidden = true;
    // several gifts picked in the chat: say which one this is. Never "Last step.": the photo, the
    // painting, the tick and the add are all still to come on this page (28 Oct)
    var q = queueGet(), at = -1;
    q.forEach(function (it, i) { if (at === -1 && handleOf(it.url) === handleOf(location.pathname)) at = i; });
    var lead = q.length > 1 && at !== -1 ? 'Gift ' + (at + 1) + ' of ' + q.length + '. ' : '';
    var want = redoMode.landed ? 'Your new version is in your cart. Choose which one to keep there.' : redoMode.id ? 'Another version, then. Your first design stays in your cart until you choose.' : lead + 'Let\'s make ' + possessive(dog) + ' ' + gift + '.';
    if (line && line.textContent !== want) line.textContent = want;
    if (!card) return;
    var esc_ = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var change = function (step) { return shopRoot() + '?step=' + step + '&return=' + gift; };
    // the chat in this tab: its pronoun ("Until she is dizzy") and whether the gift is the buyer's own
    var chat = {};
    try { chat = JSON.parse(window.sessionStorage.getItem('hs3-gift') || '{}') || {}; } catch (e) { /* no chat in this tab */ }
    var facts = [];
    // the buyer's reading of each fact, tidied and naming the person as the chat does, without the
    // image model's instructions
    try {
      var P = window.HSArtworkProfile, parsed = JSON.parse(artworkFacts());
      facts = P && P.display ? P.display(parsed, { rec: person, self: chat.rel === 'self' }) : parsed.facts.map(function (f) { return f.text; });
    } catch (e) { facts = []; }
    var style = '', tone = '';
    try {
      var choice = window.HSArtworkChoices && window.HSArtworkChoices.read(), recipes = window.HSArtworkEngine && window.HSArtworkEngine.recipes;
      if (choice && recipes) { style = recipes.styles[choice.style].label; tone = recipes.tones[choice.tone].label; }
    } catch (e) { /* the choices load after this page's first paint */ }
    var row = function (k, v, href, label) { return '<div class="hs-journey__row"><span class="hs-journey__k">' + k + '</span><span class="hs-journey__v">' + v + '</span>' + (href ? '<a href="' + esc_(href) + '">' + (label || 'Change') + '</a>' : '') + '</div>'; };
    var html = row('From', esc_(dog) + (chat.rel === 'self' ? ' for you' : person ? ' for ' + esc_(person) : ''), change(chat.rel === 'self' || person ? 'person' : 'dog'));
    html += gift === 'blanket' ? row('Words', 'None. The blanket is all painting.') : row('Words', '<span class="hs-journey__note">' + esc_((state.hs3_lines || {}).meaning || '') + '</span> <em>' + esc_(answer('signed')) + '</em>', change('gift-' + gift));
    // the pronoun the chat used, so the two pages agree; none tapped reads "they" (28 Oct)
    var isNow = chat.pro === 'he' ? 'he is' : chat.pro === 'she' ? 'she is' : 'they are';
    html += row('What I\'ll paint', facts.length ? facts.map(esc_).join(' · ') : esc_(dog) + ', just as ' + isNow + '.', change('home'));
    if (style) html += row('Style and tone', esc_(style) + ' · ' + esc_(tone), '#hs-art-choices', 'Change below');
    if (cityArtSaved()) html += '<p class="hs-journey__warn">Changing these means painting new artwork.</p>';
    // the first thing to do on this page, in the first screen: go to the photo step
    // with the photo the buyer gave Buddy on show as a choice card, the button goes to that card
    else { var savedChoice = document.querySelector('[data-hs2-blanket-photo]'); html += '<button type="button" class="hs-journey__go hs-journey__photo" data-hs-journey-photo>' + (savedChoice && !savedChoice.hidden ? 'Paint ' + esc_(dog) + ' from your photo' : 'Add ' + esc_(possessive(dog)) + ' photo') + '</button>'; }
    if (card.innerHTML !== html) card.innerHTML = html;
    var go = card.querySelector('[data-hs-journey-photo]');
    if (go && !go.__hs2) {
      go.__hs2 = true;
      // one tap opens the phone's picker, with no scroll (openPhotoPicker); the outcome shows under this button
      go.addEventListener('click', function () {
        track('journey_photo', { gift: gift });
        var choice = document.querySelector('[data-hs2-blanket-photo]');
        if (choice && !choice.hidden) {
          if (choice.scrollIntoView) choice.scrollIntoView({ block: 'center', behavior: 'auto' });
          var use = choice.querySelector('[data-hs2-blanket-create]');
          if (use && use.focus) { try { use.focus({ preventScroll: true }); } catch (e) { /* old browser */ } }
          return;
        }
        openPhotoPicker('journey');
      });
    }
    card.hidden = false;
  }
  function answerParams() {
    var p = new URLSearchParams();
    ANSWERS.forEach(function (k) { var v = answer(k); if (v) p.set(k, v); });
    if (val('voice')) p.set('video', '1');
    return p;
  }

  function bindInputs() {
    document.querySelectorAll('[data-hs2-input]').forEach(function (inp) {
      if (inp.__hs2) return; inp.__hs2 = true;
      var k = inp.getAttribute('data-hs2-input');
      if (state[k]) inp.value = state[k];
      // the treat-cupboard field starts on a real value ("1,412"), not a placeholder, so a
      // tap and a typed digit used to land after it ("1,4124"). Select it on focus, the way
      // a phone's own numeric fields do, so typing replaces it.
      if (k === 'cupboard') inp.addEventListener('focus', function () { inp.select(); });
      inp.addEventListener('input', function () {
        state[k] = inp.value; save(); render();
        if (k === 'dog') inkName();
        if (!bindInputs.sent && k === 'dog' && inp.value.length > 1) { bindInputs.sent = true; track('name_entered'); }
      });
    });
    document.querySelectorAll('[data-hs2-chip]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        var kind = b.getAttribute('data-hs2-chip');
        state[kind] = b.getAttribute('data-value'); save(); render();
        flashExhibit(kind);
        b.classList.remove('is-picked'); void b.offsetWidth; b.classList.add('is-picked');
        var prints = b.closest('.hs2-step') && b.closest('.hs2-step').querySelector('.hs2-step__prints');
        if (prints) { prints.classList.remove('is-new'); void prints.offsetWidth; prints.classList.add('is-new'); }
        // the first pick on each question moves on by itself, unless the shopper moves first
        var own = b.closest('[data-hs2-step]'), from = own ? Number(own.getAttribute('data-hs2-step')) : 0;
        if (steps.go && from && !steps.auto[kind]) {
          steps.auto[kind] = true;
          clearTimeout(steps.timer);
          steps.timer = setTimeout(function () { if (steps.at === from) steps.go(from + 1); }, 700);
        }
      });
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
        var t = Date.now();
        usePhoto(f, t);
        savePhoto(f, t);
        track('photo_attached');
      });
    });
    document.querySelectorAll('[data-hs2-story]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function (e) { e.preventDefault(); stopLeakAuto(); downloadCard(); track('story_card', { card: val('leak') }); });
    });
    document.querySelectorAll('[data-hs2-leak]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); setLeak(b.getAttribute('data-hs2-leak')); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        stopLeakAuto();
        stepLeak(d);
        var on = document.querySelector('[data-hs2-leak="' + val('leak') + '"]');
        if (on) on.focus();
      });
    });
    document.querySelectorAll('[data-hs2-leak-step]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); stepLeak(Number(b.getAttribute('data-hs2-leak-step'))); });
    });
    document.querySelectorAll('[data-hs2-caption]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        stopLeakAuto(); track('caption_copied', { card: val('leak') });
        copy(caption()).then(function (ok) {
          status(document.querySelector('[data-hs2-story-status]'), ok ? 'Caption copied. Paste it under the card.' : caption());
        });
      });
    });
    document.querySelectorAll('[data-hs2-link]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { stopLeakAuto(); track('link_shared', { card: val('leak') }); sendLink(); });
    });
  }

  /* ------------------------------------------------------- the shopper's photo */
  var DB = 'hs2', STORE = 'files', PHOTO = 'headshot', PHOTO_DAYS = 3;
  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
      var open;
      try { open = window.indexedDB.open(DB, 1); } catch (e) { reject(e); return; }
      open.onupgradeneeded = function () { open.result.createObjectStore(STORE); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        var db = open.result, tx, req;
        try { tx = db.transaction(STORE, mode); req = fn(tx.objectStore(STORE)); } catch (e) { db.close(); reject(e); return; }
        tx.oncomplete = function () { db.close(); resolve(req && req.result); };
        tx.onerror = tx.onabort = function () { db.close(); reject(tx.error); };
      };
    });
  }
  function savePhoto(file, t) {
    idb('readwrite', function (st) { return st.put({ file: file, t: t }, PHOTO); }).catch(function () {});
  }
  function restorePhoto() {
    return idb('readwrite', function (st) {
      var req = st.get(PHOTO);
      req.onsuccess = function () { var rec = req.result; if (rec && Date.now() - rec.t >= PHOTO_DAYS * 864e5) st.delete(PHOTO); };
      return req;
    }).then(function (rec) {
      if (!state.hs3_photo_t || !rec || !rec.file || rec.t !== state.hs3_photo_t || Date.now() - rec.t >= PHOTO_DAYS * 864e5) return null;
      return rec;
    }).catch(function () { return null; });
  }
  // t marks which photo this is, so the product page knows whether it has handed this one over yet
  function usePhoto(file, t) {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(file);
    usePhoto.file = file;
    usePhoto.t = t || Date.now();
    document.querySelectorAll('[data-hs2-photo]').forEach(function (img) { img.src = photoURL; img.removeAttribute('srcset'); });
    attachDone();
    leakUI();
    drawSoon();
    handoff();
  }
  // the review's attach box shows the photo it holds, and says it can be changed
  function attachDone() {
    document.querySelectorAll('.hs2-attach').forEach(function (lab) {
      lab.classList.add('is-done');
      var thumb = lab.querySelector('[data-hs2-attach-thumb]');
      if (thumb && photoURL) thumb.src = photoURL;
      var txt = lab.querySelector('.hs2-attach__text');
      if (txt && !lab.__hs2done) { lab.__hs2done = true; txt.innerHTML = '<strong>Headshot attached</strong> · change'; }
    });
  }

  /* ------------------------------------------------- evidence under the poster */
  var EXHIBIT = {
    improvement: { 'Leaving': 'bed', 'The vacuum': 'vacuum', 'Bath time': 'bed', 'Sharing food': 'team-01', 'Your phone': 'asleep' },
    incident: { 'The sandwich': 'team-01', _: 'incident' },
    enemy: { 'The vacuum': 'vacuum', _: 'window' }
  };
  var ALT = {
    bed: 'a dachshund across the middle of the bed', vacuum: 'a dachshund squaring up to the vacuum', 'team-01': 'a pug with its head tilted',
    asleep: 'a spaniel asleep on the laptop', incident: 'a dachshund holding a sock, unrepentant', window: 'a terrier at the window, watching the delivery driver'
  };
  var FOCUS = { manager: [0.5, 0.26], headshot: [0.5, 0.5], bed: [0.6, 0.6], window: [0.5, 0.35], vacuum: [0.35, 0.5], incident: [0.5, 0.45], 'team-01': [0.5, 0.4], asleep: [0.55, 0.5], memo: [0.55, 0.5] };
  function exhibitKey(kind) { var m = EXHIBIT[kind] || {}; return m[val(kind)] || m._ || null; }
  function exhibits() {
    var urls = photos();
    document.querySelectorAll('[data-hs2-exhibit]').forEach(function (fig) {
      var key = exhibitKey(fig.getAttribute('data-hs2-exhibit'));
      var img = fig.querySelector('img');
      if (!key || !img || !urls[key] || img.getAttribute('data-key') === key) return;
      img.setAttribute('data-key', key);
      img.src = urls[key];
      img.alt = 'Evidence: ' + ALT[key];
      var f = FOCUS[key] || [0.5, 0.5];
      img.style.objectPosition = (f[0] * 100) + '% ' + (f[1] * 100) + '%';
    });
  }
  function flashExhibit(kind) {
    var img = document.querySelector('[data-hs2-exhibit="' + kind + '"] img');
    if (!img) return;
    img.classList.add('is-swapping');
    setTimeout(function () { img.classList.remove('is-swapping'); }, 180);
  }

  /* ----------------------------------------------- the free story cards (1080 x 1920) */
  var W = 1080, H = 1920, P = 86;
  var MONO = '"HS Courier Prime", "Courier Prime", "Courier New", monospace';
  var SERIF = '"HS Fraunces", "Fraunces", Georgia, serif';
  var C = { ink: '#121010', paper: '#FFFDF9', stamp: '#A8284E', night: '#1E1714', cream: '#FBF6F1', blush: '#F0C0C0', chestnut: '#8A4A2B' };
  var imgCache = {};
  var fontsReady = false;

  function picture(url) {
    if (!url) return null;
    if (imgCache[url]) return imgCache[url].complete && imgCache[url].naturalWidth ? imgCache[url] : null;
    var im = new Image();
    if (!/^blob:/.test(url)) im.crossOrigin = 'anonymous';
    im.onload = drawSoon;
    im.src = url;
    imgCache[url] = im;
    return null;
  }
  function cardPhoto(type) {
    if (photoURL) return { url: photoURL, focus: [0.5, 0.42] };
    var urls = photos(), key;
    if (type === 'rating') key = 'manager';
    else if (type === 'incident') key = exhibitKey('incident');
    else if (type === 'threat') key = exhibitKey('enemy');
    else key = 'memo';
    var url = urls[key + '-lg'] || urls[key];
    return { url: url, focus: FOCUS[key] || [0.5, 0.5] };
  }
  function wrap(ctx, text, maxW) {
    var words = String(text).split(' '), out = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else { line = t; }
    });
    if (line) out.push(line);
    return out;
  }
  function fit(ctx, text, font, size, min, maxW, maxLines) {
    var l;
    for (; size >= min; size -= 4) {
      ctx.font = font.replace('%', size);
      l = wrap(ctx, text, maxW);
      if (l.length <= maxLines && l.every(function (x) { return ctx.measureText(x).width <= maxW; })) return { size: size, lines: l };
    }
    ctx.font = font.replace('%', min);
    return { size: min, lines: wrap(ctx, text, maxW) };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function cover(ctx, im, x, y, w, h, focus, r) {
    ctx.save();
    rr(ctx, x, y, w, h, r); ctx.clip();
    if (!im) { ctx.fillStyle = 'rgba(138, 74, 43, 0.15)'; ctx.fillRect(x, y, w, h); ctx.restore(); return; }
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    var dx = x - (dw - w) * focus[0], dy = y - (dh - h) * focus[1];
    ctx.drawImage(im, dx, dy, dw, dh);
    ctx.restore();
  }
  function star(ctx, cx, cy, R, filled, color) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * 0.42 : R;
      ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    if (filled) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.stroke(); }
  }
  function stamp(ctx, text, cx, cy, size, deg, color, fill) {
    ctx.save();
    ctx.font = '700 ' + size + 'px ' + MONO;
    var tw = ctx.measureText(text).width, bw = tw + size * 1.1, bh = size * 1.75;
    ctx.translate(cx, cy); ctx.rotate(deg * Math.PI / 180);
    rr(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.38);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = size * 0.19; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, size * 0.04);
    ctx.restore();
  }
  function paw(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24); ctx.fillStyle = color;
    [[6.2, 9.2], [10, 5.8], [14.4, 5.8], [18.2, 9.2]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0], p[1], 2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fill(new Path2D('M12.2 10.6c-3.2 0-6 3.6-6 6.2 0 1.8 1.4 2.6 3 2.6 1.3 0 2-.6 3-.6s1.7.6 3 .6c1.6 0 3-.8 3-2.6 0-2.6-2.8-6.2-6-6.2z'));
    ctx.restore();
  }
  function label(ctx, text, x, y, color) {
    ctx.font = '700 40px ' + MONO;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  function drawCard(canvas, type) {
    var x = canvas.getContext('2d');
    var dog = val('dog'), person = val('person'), maxW = W - P * 2;
    var dark = type === 'memo';
    var ink = dark ? C.cream : C.ink;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = dark ? C.night : C.paper; x.fillRect(0, 0, W, H);

    var top = { rating: 'LEAKED · HR-26', incident: 'LEAKED · INCIDENT REPORT', threat: 'LEAKED · THREAT ASSESSMENT', memo: 'LEAKED · FROM MANAGEMENT' }[type];
    label(x, top, P, P, dark ? C.blush : C.ink);

    var ph = cardPhoto(type), photoH = dark ? 640 : 760, photoY = P + 84;
    cover(x, picture(ph.url), P, photoY, maxW, photoH, ph.focus, 34);

    // bottom lines
    x.fillStyle = ink;
    x.font = '700 44px ' + MONO;
    var domainY = H - P - 44;
    x.fillText('heartside.io', P, domainY);
    var y = photoY + photoH + 64;

    if (dark) {
      x.font = '400 50px ' + MONO; x.fillStyle = C.cream;
      wrap(x, 'To ' + person + '.', maxW).forEach(function (l) { x.fillText(l, P, y); y += 64; });
      y += 22;
      var t = fit(x, 'You also came back. Every single time. I noticed.', '600 %px ' + SERIF, 96, 60, maxW, 5);
      x.fillStyle = C.cream;
      t.lines.forEach(function (l) { x.fillText(l, P, y); y += t.size * 1.06; });
      y += 40;
      x.font = '400 50px ' + MONO; x.fillStyle = C.blush;
      x.fillText('Keep me close.', P, y); y += 66;
      x.fillText(dog, P, y);
      paw(x, P + Math.min(x.measureText(dog).width, maxW - 80) + 26, y - 6, 60, C.blush);
      x.font = '400 46px ' + MONO; x.fillStyle = C.cream;
      x.fillText("Who is your dog's person?", P, domainY - 64);
      return;
    }

    stamp(x, 'CONFIDENTIAL', W - P - 210, photoY + photoH - 26, 50, -12, C.stamp, 'rgba(255, 253, 249, 0.92)');
    x.fillStyle = ink;
    x.font = '400 46px ' + MONO;
    wrap(x, dog + ' has reviewed ' + person + '.', maxW).slice(0, 2).forEach(function (l) { x.fillText(l, P, y); y += 60; });
    y += 26;
    if (type === 'rating') {
      var big = fit(x, 'Leaving the house:', '700 %px ' + SERIF, 136, 96, maxW, 2);
      x.fillStyle = ink;
      big.lines.forEach(function (l) { x.fillText(l, P, y); y += big.size; });
      y += 30;
      for (var i = 0; i < 5; i++) star(x, P + 54 + i * 128, y + 54, 54, i === 0, C.stamp);
    } else {
      x.fillStyle = C.stamp;
      label(x, type === 'incident' ? 'INCIDENT REPORT' : 'THREAT ASSESSMENT', P, y, C.stamp);
      y += 66;
      var line = type === 'incident' ? lines('incident')[val('incident')] : lines('enemy')[val('enemy')];
      var room = domainY - 110 - y; // keep clear of "Who is your dog's person?"
      var maxLines = Math.max(2, Math.floor(room / 100));
      var body = fit(x, line || '', '600 %px ' + SERIF, 92, 56, maxW, maxLines);
      x.fillStyle = ink;
      body.lines.forEach(function (l) { x.fillText(l, P, y); y += body.size * 1.08; });
    }
    x.fillStyle = ink;
    x.font = '400 46px ' + MONO;
    x.fillText("Who is your dog's person?", P, domainY - 64);
  }

  var drawQueued = false;
  function drawSoon() {
    if (drawQueued) return;
    drawQueued = true;
    (window.requestAnimationFrame || setTimeout)(function () { drawQueued = false; drawPreview(); });
  }
  function drawPreview() {
    var canvas = document.querySelector('[data-hs2-story-canvas]');
    if (!canvas || !canvas.getContext) return;
    drawCard(canvas, val('leak'));
    var still = document.querySelector('[data-hs2-story-static]');
    if (still) still.hidden = true;
    canvas.hidden = false;
    canvas.setAttribute('aria-label', 'Story card preview: ' + caption());
    if (!fontsReady && document.fonts) {
      fontsReady = true;
      Promise.all([
        document.fonts.load('700 40px "HS Courier Prime"'), document.fonts.load('400 40px "HS Courier Prime"'),
        document.fonts.load('700 120px "HS Fraunces"'), document.fonts.load('600 120px "HS Fraunces"')
      ]).then(drawSoon, function () {});
    }
  }
  function leakUI() {
    var leak = val('leak'), i = LEAKS.indexOf(leak);
    document.querySelectorAll('[data-hs2-leak]').forEach(function (b) {
      var on = b.getAttribute('data-hs2-leak') === leak;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.hs2-phone__bars i').forEach(function (bar, n) { bar.classList.toggle('is-done', n < i); bar.classList.toggle('is-on', n === i); });
    document.querySelectorAll('[data-hs2-nudge]').forEach(function (n) { n.hidden = !!photoURL; });
  }
  function setLeak(type) {
    if (LEAKS.indexOf(type) === -1) return;
    state.leak = type; save(); leakUI(); drawSoon();
    var cv = document.querySelector('[data-hs2-story-canvas]');
    if (cv && !reduced) { cv.classList.add('is-swapping'); setTimeout(function () { cv.classList.remove('is-swapping'); }, 160); }
    status(document.querySelector('[data-hs2-story-status]'), '');
  }
  function stepLeak(d) { setLeak(LEAKS[(LEAKS.indexOf(val('leak')) + d + LEAKS.length) % LEAKS.length]); }

  function caption() {
    var dog = val('dog'), person = val('person'), t = val('leak');
    if (t === 'incident') return dog + ' has reviewed ' + person + '. Incident report: ' + (lines('incident')[val('incident')] || '') + ' heartside.io';
    if (t === 'threat') return dog + ' has reviewed ' + person + '. Threat assessment: ' + (lines('enemy')[val('enemy')] || '') + ' heartside.io';
    if (t === 'memo') return 'To ' + person + '. You also came back. Every single time. I noticed. Keep me close. ' + dog + ' heartside.io';
    return dog + ' has reviewed ' + person + '. Leaving the house: ★☆☆☆☆ Who is your dog\'s person? heartside.io';
  }
  function shareURL() {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    var p = answerParams();
    p.delete('video');
    p.set('utm_source', 'leak'); p.set('utm_medium', 'share'); p.set('utm_campaign', val('leak'));
    return window.location.origin + root + '?' + p.toString();
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    t.remove();
    return ok;
  }
  function sendLink() {
    var url = shareURL(), msg = document.querySelector('[data-hs2-story-status]');
    var dogs = possessive(val('dog'));
    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ title: dogs + ' annual review', text: caption(), url: url }).catch(function () {});
      return;
    }
    copy(url).then(function (ok) { status(msg, ok ? 'Link copied. It opens on ' + dogs + ' review.' : url); });
  }
  function downloadCard() {
    var msg = document.querySelector('[data-hs2-story-status]');
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('700 40px "HS Courier Prime"'), document.fonts.load('400 40px "HS Courier Prime"'),
      document.fonts.load('700 120px "HS Fraunces"'), document.fonts.load('600 120px "HS Fraunces"')
    ]) : Promise.resolve();
    var ph = cardPhoto(val('leak'));
    var ready = new Promise(function (resolve) {
      var im = imgCache[ph.url];
      if (!ph.url || (im && im.complete)) { resolve(); return; }
      picture(ph.url);
      im = imgCache[ph.url];
      im.addEventListener('load', resolve); im.addEventListener('error', resolve);
      setTimeout(resolve, 4000);
    });
    Promise.all([fonts, ready]).then(function () {
      drawCard(c, val('leak'));
      var name = val('dog').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + val('leak') + '.png';
      try {
        c.toBlob(function (blob) {
          if (!blob) { status(msg, 'This browser could not make the card. A screenshot of it works too.'); return; }
          if (inApp) { showCard(c.toDataURL('image/png')); return; }
          var file = new File([blob], name, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            navigator.share({ files: [file], text: caption() }).catch(function () {});
            return;
          }
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          status(msg, 'Saved. Post it, tag the person.');
        }, 'image/png');
      } catch (e) {
        status(msg, 'This browser could not make the card. A screenshot of it works too.');
      }
    });
  }

  /* ------------------------------------------------------ sticky "Read review" pill */
  function sticky() {
    var bar = document.querySelector('[data-hs2-sticky]');
    if (!bar || bar.__hs2 || !('IntersectionObserver' in window)) return; bar.__hs2 = true;
    var watch = [document.querySelector('[data-hs2-hero]'), document.querySelector('#review'), document.querySelector('.hs2-faq__close'), document.querySelector('.hs2-signoff'), document.querySelector('#buy'), document.querySelector('footer')].filter(Boolean);
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
  /* The product photo changes only once the new one has decoded, with its srcset kept, so the
     box is never blank (it showed nothing for about 600 ms on 27 Oct) and never drops to a
     smaller file. A newer swap wins over one still loading. */
  function swapMain(src, srcset, alt) {
    var main = document.querySelector('[data-hs2-main]');
    if (!main || !src) return;
    var token = swapMain.n = (swapMain.n || 0) + 1;
    if (main.getAttribute('src') === src) { main.alt = alt || ''; return; }
    var put = function () {
      if (token !== swapMain.n) return;
      if (srcset && main.setAttribute) main.setAttribute('srcset', srcset); else main.removeAttribute('srcset');
      main.src = src; main.alt = alt || '';
      if (main.classList) main.classList.remove('is-swapping');
    };
    // without a decoder (an old browser) the swap is immediate, as before
    if (typeof Image !== 'function') { put(); return; }
    var next = new Image();
    if (srcset) { next.sizes = main.getAttribute('sizes') || '100vw'; next.srcset = srcset; }
    next.src = src;
    if (main.classList) main.classList.add('is-swapping');
    (next.decode ? next.decode() : Promise.resolve()).then(put, put);
  }
  function gallery() {
    var media = document.querySelector('[data-hs2-media]');
    var current = function (b) { document.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === b ? 'true' : 'false'); }); };
    document.querySelectorAll('[data-hs2-thumb]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () {
        if (!document.querySelector('[data-hs2-main]')) return;
        swapMain(b.getAttribute('data-hs2-thumb'), b.getAttribute('data-srcset'), b.getAttribute('data-alt'));
        if (media) { media.setAttribute('data-show', 'photo'); media.__hs2picked = true; }
        current(b);
      });
    });
    // the shopper's own live preview (Teeinblue's), first in the row
    document.querySelectorAll('[data-hs2-thumb-preview]').forEach(function (b) {
      if (b.__hs2) return; b.__hs2 = true;
      b.addEventListener('click', function () { if (media) { media.removeAttribute('data-show'); media.__hs2picked = true; } current(b); });
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
    // With Teeinblue's picker in charge, follow the variant it puts in the URL, so the one
    // price on the page (ours, Teeinblue's is off) and the form's variant stay with it
    var buy = document.getElementById('buy');
    if (buy && buy.classList.contains('hs2-product--tib') && !buy.__hs2v) {
      buy.__hs2v = true;
      var follow = function () {
        var id = new URLSearchParams(window.location.search).get('variant');
        var prices = json('script[data-hs2-prices]'), price = document.querySelector('[data-hs2-price]');
        if (!id || !(id in prices)) return;
        if (price && price.textContent !== prices[id]) price.textContent = prices[id];
        var idIn = buy.querySelector('[data-hs2-variant-id]');
        if (idIn) idIn.value = id;
        // the variant's own photo (the mug in that color) becomes the product picture
        var img = json('script[data-hs2-vimages]')[id], main = document.querySelector('[data-hs2-main]');
        // the blank technical reference never becomes the product picture (the page already hides it)
        if (img && /shown in your cart|checkout tile|(^|\s)blank\s/i.test(img.alt || '')) img = null;
        // a gift sold in colors shows only that color's pair of photos
        var col = img && /, (.+?) inside/i.exec(img.alt || '');
        if (col) document.querySelectorAll('[data-hs2-thumb][data-hs2-color]').forEach(function (b) { b.hidden = b.getAttribute('data-hs2-color') !== col[1].toLowerCase(); });
        if (img && main && main.getAttribute('src') !== img.src) {
          var th = document.querySelector('[data-hs2-thumb="' + img.src + '"]');
          swapMain(img.src, th && th.getAttribute('data-srcset'), img.alt);
          if (th && document.querySelector('[data-hs2-media]').getAttribute('data-show') === 'photo') {
            document.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === th ? 'true' : 'false'); });
          }
        }
        swatchTib();
      };
      swatchTib();
      buy.addEventListener('change', function (e) {
        if (!e.target.closest || !e.target.closest('.tee-variants')) return;
        setTimeout(follow, 80); setTimeout(follow, 500);
      });
      document.addEventListener('teeinblue-event-variant-changed', function () { setTimeout(follow, 80); });
    }
  }

  /* Teeinblue draws the mug's Color choice as plain text buttons. A dot of each color goes in
     front of its name (Printful's hex), so the choice reads at a glance; the name stays for
     screen readers and for anyone who can't tell the colors apart. */
  var MUG_HEX = { 'black': '#050505', 'dark blue': '#1b1b51', 'dark green': '#226653', 'red': '#e32a2d', 'pink': '#f6a1b1' };
  function swatchTib() {
    document.querySelectorAll('#buy .tee-variants .tee-radio').forEach(function (r) {
      var hex = MUG_HEX[(r.textContent || '').trim().toLowerCase()];
      if (hex && r.getAttribute('data-hs2-swatch') !== hex) { r.setAttribute('data-hs2-swatch', hex); r.style.setProperty('--hs2-sw', hex); }
    });
  }

  /* ------------------------------------------------------------ Teeinblue bridge
     Copies the homepage answers into Teeinblue's personalizer, so nobody types twice.
     It reads each Teeinblue field's heading (the labels in docs/TEEINBLUE-SETUP.md),
     sets the value the way typing does, and checks Teeinblue's own record
     (window.teeinblue.getCurrentCustomization). If a value didn't take, it writes
     Teeinblue's saved customization and asks it to refill (refillCustomizationData).
     It never touches a field the shopper has edited, and it copies their edits back
     into the order's hidden answers. Tested against Teeinblue's storefront code on
     its demo store, 4 October 2026. */
  var TIB_RULES = [
    // v3 gifts: the words and the signature (labels "Line 1" to "Line 4" and "Signed")
    { k: 'line1', re: /^\s*line\s*1\b/i },
    { k: 'line2', re: /^\s*line\s*2\b/i },
    { k: 'line3', re: /^\s*line\s*3\b/i },
    { k: 'line4', re: /^\s*(?:line\s*4|your note)\b/i },
    { k: 'signed', re: /^\s*sign(ed|ature)\b/i },
    { k: 'city', re: /^\s*city\b/i },
    { k: 'personality', re: /^\s*personality\b/i },
    { k: 'art_style', re: /^\s*artwork style\b/i, choice: true },
    { k: 'art_tone', re: /^\s*artwork tone\b/i, choice: true },
    { k: 'art_style_direction', re: /^\s*style direction\b/i },
    { k: 'art_tone_direction', re: /^\s*tone direction\b/i },
    { k: 'art_energy', re: /^\s*energy\b/i },
    { k: 'dog', re: /manager|dog'?s name|pet'?s name|name of (your|the) (dog|pet)|reviewer/i },
    { k: 'person', re: /employee|your name|person'?s name|owner|human/i },
    { k: 'cupboard', re: /cupboard|treat/i },
    { k: 'improvement', re: /improvement/i, choice: true },
    { k: 'incident', re: /incident/i, choice: true },
    { k: 'enemy', re: /enemy|threat/i, choice: true }
  ];
  var bridge = { owned: {}, filled: 0, fields: 0, tries: 0, refilled: false, folded: false, opened: false, sent: {}, selfAt: 0 };
  /* Loop guard (27 Oct review): Teeinblue answers our own writes with its events, and those used
     to reset the retry count, so a field it would not take could be resent forever. Our writes
     are timestamped and ignored as triggers for 600 ms, and one value goes to one field at most
     three times per page; a new value starts its own count. */
  function mayResend(name, want) { return (bridge.sent[name + '\u0000' + want] || 0) < 3; }
  function selfTriggered() { return Date.now() - (bridge.selfAt || 0) < 600; }
  function norm(t) { return String(t || '').replace(/[\s*:]+/g, ' ').replace(/[’‘]/g, "'").trim().toLowerCase(); }
  function tibFields() {
    return Array.prototype.slice.call(document.querySelectorAll('.tee-field')).filter(function (f) {
      return !/tee-field--photo|tee-field--template/.test(f.className);
    }).map(function (f) {
      var h = f.querySelector('.tee-field__heading span, .tee-field__heading, label');
      // Teeinblue may print "Your dog’s name" with a curly apostrophe
      var heading = h ? h.textContent.replace(/[’‘]/g, "'") : '';
      var rule = null;
      for (var i = 0; i < TIB_RULES.length; i++) { if (TIB_RULES[i].re.test(heading)) { rule = TIB_RULES[i]; break; } }
      return { el: f, heading: heading, rule: rule };
    }).filter(function (x) { return x.rule; });
  }
  function setValue(inp, v) {
    var proto = inp.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : inp.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(inp, v); else inp.value = v;
    var key = (inp.name || inp.id) + '\u0000' + v;
    bridge.sent[key] = (bridge.sent[key] || 0) + 1; bridge.selfAt = Date.now();
    inp.__hs2set = true;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.__hs2set = false;
  }
  function choiceMatches(text, k) {
    if ((cityArtPreview() || nativeArtworkPurchase()) && (k === 'art_style' || k === 'art_tone')) return norm(text) === norm(answer(k));
    var t = norm(text), label = norm(val(k)), line = norm(lines(k)[val(k)]);
    return !!t && (t === label || t === line || t.indexOf(label + ' ') === 0 || (line && t.indexOf(line) === 0));
  }
  function tibCurrent() {
    try { return (window.teeinblue && window.teeinblue.getCurrentCustomization && window.teeinblue.getCurrentCustomization()) || null; } catch (e) { return null; }
  }
  // Teeinblue can retain an older SVG proof after its fields receive our words. This was
  // reproduced on the live mug: the inputs said "Love, Milo" while the note face still
  // rendered "Love, Test Dog". Compare the print artwork, not only the input values.
  function mugArtworkValue(name) {
    if (!mugProduct() && !nativeArtworkPurchase()) return null;
    var layer = document.getElementById('artwork-layer--' + name);
    if (!layer) return null; // the mockup has not rendered yet
    var visible = layer.querySelector('text[opacity="1"]');
    if (!visible) return null;
    var spans = Array.prototype.slice.call(visible.querySelectorAll('tspan'));
    return (spans.length ? spans.map(function (s) { return s.textContent; }).join(' ') : visible.textContent).replace(/\s+/g, ' ').trim();
  }
  function mugArtworkMismatch(name, want) {
    var shown = mugArtworkValue(name);
    return shown !== null && shown !== String(want).replace(/\s+/g, ' ').trim();
  }
  function guardMugProof() {
    document.addEventListener('click', function (e) {
      var button = e.target.closest && e.target.closest('#teeAtcButton');
      if (!button || !mugProduct() || nativeArtworkPurchase()) return;
      var fields = tibFields().filter(function (f) { return /^(line[1-3]|signed)$/.test(f.rule.k); });
      var ready = fields.length === 4 && fields.every(function (f) {
        var inp = f.el.querySelector('input[type="text"], input:not([type]), textarea');
        return inp && inp.value.trim() && mugArtworkValue(inp.name || inp.id) !== null && !mugArtworkMismatch(inp.name || inp.id, inp.value);
      });
      if (ready) {
        var old = document.querySelector('[data-hs2-proof-wait]');
        if (old) old.remove();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      // Also covers a word the shopper edited directly: that field is theirs, so the
      // automatic bridge will not overwrite it, but it can safely resend its value.
      fields.forEach(function (f) {
        var inp = f.el.querySelector('input[type="text"], input:not([type]), textarea');
        if (inp && inp.value && mugArtworkMismatch(inp.name || inp.id, inp.value)) setValue(inp, inp.value);
      });
      runBridge();
      var note = document.querySelector('[data-hs2-proof-wait]');
      if (!note) {
        note = document.createElement('p');
        note.setAttribute('data-hs2-proof-wait', '');
        note.setAttribute('role', 'status');
        button.parentNode.insertBefore(note, button.nextSibling);
      }
      note.textContent = 'Just finishing your mug preview. Please try again in a moment.';
    }, true);
  }
  // Every v3 gift prints a dog photo. Teeinblue can otherwise submit its sample image
  // when the chat's optional photo step was skipped or an earlier photo was restored.
  function nativePurchaseReady() {
    var buy = document.querySelector('#buy[data-hs2-artwork-kind]');
    if (!buy) return true; // Existing blanket route retains its separate opt-in contract.
    if (buy.getAttribute('data-hs2-purchase-enabled') !== 'true') return false;
    var portrait = buy.getAttribute('data-hs2-artwork-kind') === 'print';
    return ['line4', portrait ? 'dog' : 'signed'].every(function (key) {
      var field = tibFields().filter(function (f) { return f.rule.k === key; })[0];
      var input = field && field.el.querySelector('input[type="text"], input:not([type]), textarea');
      if (!input) return false;
      var exact = function (value) { return String(value || '').replace(/\s+/g, ' ').trim(); };
      if (portrait && key === 'dog') {
        // Artwork 1378371 renders Signed from the form-only dog name; there is no Signed input.
        // Keep any owned signature override in the comparison rather than silently losing it.
        var signature = mugArtworkValue('layer-501370');
        return input.name === 'layer-209591' && exact(input.value) !== '' && exact(input.value) === exact(answer('dog')) && signature !== null && exact(signature) === exact('Love, ' + input.value) && exact(signature) === exact(answer('signed'));
      }
      var shown = mugArtworkValue(input.name || input.id);
      return shown !== null && exact(input.value) === exact(answer(key)) && exact(shown) === exact(answer(key));
    });
  }
  /* The portrait signs itself: artwork 1378371 prints "Love, " and the Dog's name field, and has no
     Signed field (the 23 Oct design, kept on 28 Oct). So a line under that field says what will be
     signed, as they type, and from 11 letters how many still fit (Signed holds 20: "Love, " + 14). */
  function portraitSignLine() {
    if (!document.querySelector('#buy[data-hs2-artwork-kind="print"]')) return;
    var field = tibFields().filter(function (f) { return f.rule.k === 'dog'; })[0];
    var input = field && field.el.querySelector('input[type="text"], input:not([type]), textarea');
    if (!input || !field.el.parentNode) return;
    var line = document.querySelector('[data-hs2-sign-line]');
    if (!line) {
      line = document.createElement('p');
      line.className = 'hs2-sign-line'; line.setAttribute('data-hs2-sign-line', ''); line.setAttribute('role', 'status');
      line.innerHTML = '<span data-hs2-sign-text></span><span data-hs2-sign-hint></span>';
    }
    // Teeinblue redraws its form: the line goes back right under the field it describes
    if (field.el.nextSibling !== line) field.el.parentNode.insertBefore(line, field.el.nextSibling);
    if (!input.__hs2sign) { input.__hs2sign = true; input.addEventListener('input', portraitSignLine); }
    var name = input.value.replace(/\s+/g, ' ').trim(), max = input.maxLength > 0 ? input.maxLength : 14, left = max - input.value.length;
    var say = name ? 'Signed on the print: Love, ' + name : "Your dog's name signs the print.";
    var hint = input.value.length < max - 3 ? '' : (left > 1 ? left + ' letters left. ' : left === 1 ? '1 letter left. ' : "That's the most that fits. ") + 'Up to ' + max + ' fit in the signature.';
    var text = line.querySelector('[data-hs2-sign-text]'), more = line.querySelector('[data-hs2-sign-hint]');
    if (text.textContent !== say) text.textContent = say;
    if (more.textContent !== hint) more.textContent = hint;
    more.hidden = !hint;
  }
  function portraitSignatureChoice() {
    if (!document.querySelector('#buy[data-hs2-artwork-kind="print"]')) return '';
    var input = document.querySelector('#buy input[name="layer-209591"]');
    var dog = input && input.value.replace(/\s+/g, ' ').trim();
    var supported = dog ? 'Love, ' + dog : '';
    return supported && supported !== String(answer('signed') || '').replace(/\s+/g, ' ').trim() ? supported : '';
  }
  function updatePortraitSignatureRecovery() {
    var supported = portraitSignatureChoice();
    var box = document.querySelector('[data-hs2-portrait-signature-recovery]');
    if (!supported) { if (box) box.hidden = true; return; }
    var status = document.querySelector('[data-hs2-artwork-status]');
    if (!status) return;
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-hs2-portrait-signature-recovery', '');
      var message = document.createElement('p');
      message.setAttribute('role', 'status');
      var button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', function () {
        var current = portraitSignatureChoice();
        if (!current) return;
        state.hs3_signature_override = current;
        state.hs3_copy_owner = 'user';
        save(); invalidateBlanketReview(); render();
        updatePortraitSignatureRecovery();
        // The native signature already follows the dog name. No upload or AI request.
        var review = document.querySelector('[data-hs2-artwork-accept]');
        if (review && review.getClientRects().length) review.focus();
      });
      box.appendChild(message); box.appendChild(button);
      status.parentNode.insertBefore(box, status);
    }
    box.hidden = false;
    var text = 'Portraits are signed "' + supported + '" using your dog\'s name. Your saved signature is different. Choose the portrait signature, then review your artwork again.';
    if (box.firstChild.textContent !== text) box.firstChild.textContent = text;
    var label = 'Use "' + supported + '"';
    if (box.lastChild.textContent !== label) box.lastChild.textContent = label;
  }
  function guardGiftPhoto() {
    document.addEventListener('submit', function (e) {
      if ((cityArtPreview() || nativeArtworkPurchase()) && e.target.closest && e.target.closest('#buy')) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    document.addEventListener('click', function (e) {
      if (nativeArtworkPurchase() && e.target.closest && e.target.closest('#buy .tee-field--photo .tee-btn--recustomize')) {
        invalidateBlanketReview();
        return; // Native placement editing continues without another upload.
      }
      var button = e.target.closest && e.target.closest(cityArtPreview() || nativeArtworkPurchase() ? '#teeAtcButton, .tee-btn--atc, [data-hs2-add]' : '#teeAtcButton');
      if (!button || !(giftView() || nativeArtworkPurchase())) return;
      if (nativeArtworkPurchase()) {
        if (!blanketUploadPending() && nativeBlanketInputsReady() && cityArtSaved() && blanketReviewAccepted() && nativePurchaseReady()) {
          syncBlanketProperties();
          // words beside the button and Teeinblue's own box are courtesies: neither may hold the add
          try { startedAdd(); } catch (err) { /* the add goes ahead */ }
          return;
        }
        e.preventDefault(); e.stopImmediatePropagation();
        var nativeBuy = document.querySelector('#buy[data-hs2-artwork-kind]');
        blanketPurchaseStatus(nativeBuy && nativeBuy.getAttribute('data-hs2-purchase-enabled') !== 'true' ? 'This gift is not available to order yet.' : 'Finish and save your artwork, then tick the artwork review before adding this gift. If an error appears, follow the instructions beside your artwork.');
        if (cityArtSaved() && !blanketReviewAccepted()) nudgeReview();
        // the one thing left, said beside the button the buyer pressed; the block above stands either way
        try { blockedAdd(); } catch (err) { /* the block holds without the words */ }
        return;
      }
      // This isolated template is for acceptance testing. AI completion, raw-photo
      // fallback and source resolution still need provider-backed verification.
      if (cityArtPreview()) {
        e.preventDefault(); e.stopImmediatePropagation();
        var previewNote = document.querySelector('[data-hs2-artwork-status]');
        if (previewNote) previewNote.textContent = 'Preview only. Ordering opens after the final artwork checks.';
        return;
      }
      // Dispatching a file is not proof that Teeinblue accepted it. The upload
      // field must acknowledge the image, and its crop dialog must be closed.
      var ready = !!(usePhoto.file && handed() && tibTookPhoto() && !document.querySelector('.vm--container'));
      if (ready) {
        var old = document.querySelector('[data-hs2-photo-wait]');
        if (old) old.remove();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      var note = document.querySelector('[data-hs2-photo-wait]');
      if (!note) {
        note = document.createElement('p');
        note.setAttribute('data-hs2-photo-wait', '');
        note.setAttribute('role', 'status');
        button.parentNode.insertBefore(note, button.nextSibling);
      }
      if (!usePhoto.file) note.textContent = "Add your dog's photo before adding this gift.";
      else if (document.querySelector('.vm--container')) note.textContent = 'Save your photo crop before adding this gift.';
      else { handoff(); note.textContent = 'Finish your photo in the personalizer, check the preview, then try again.'; }
    }, true);
  }
  /* A blocked Add to cart on a gift page says the one thing left, in the line beside the button
     (28 Oct, order 1: no word at all, and the photo step never opened). The block itself is in
     guardGiftPhoto; this only explains it, and opens the photo step when the photo is missing. */
  function blockedAdd() {
    var buy = document.querySelector('#buy[data-hs2-artwork-kind]');
    var dog = String(answer('dog') || '').trim(), whose = dog ? possessive(dog) : "your dog's", name = dog || 'your dog';
    var say = 'One more thing first. See the message above.';
    if (buy && buy.getAttribute('data-hs2-purchase-enabled') !== 'true') say = 'This gift is not available to order yet.';
    else if (blanketUploadPending() || (artRequested() && !cityArtSaved())) say = 'Still painting ' + name + '. Most take 1 to 3 minutes.';
    else if (cityArtSaved()) { if (!blanketReviewAccepted()) say = 'Tick the box under ' + whose + ' painting first.'; }
    else if (restoredArtworkAvailable()) say = 'Review your saved design above first, or add a new photo.';
    else if (!nativeBlanketInputsReady()) say = 'One moment. Your choices are still loading.';
    else {
      say = 'Add ' + whose + ' photo first. Buddy paints from it.';
      // open the photo step: the field in view and its upload button ready for the next tap. While
      // the saved-photo card shows, Teeinblue's field is clip-hidden, so the card is the step
      var card = document.querySelector('#buy.hs2-photo-choice [data-hs2-blanket-photo]:not([hidden])');
      if (card) say = 'Use ' + whose + ' photo first, or a different one. Buddy paints from it.';
      var field = card || document.querySelector('#buy .tee-field--photo');
      if (field && field.scrollIntoView) field.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      var upload = card ? card.querySelector('[data-hs2-blanket-create]') : field && field.querySelector('.tee-btn--upload, button, label');
      if (upload && upload.focus) { try { upload.focus({ preventScroll: true }); } catch (err) { /* old browser */ } }
    }
    checkoutImageStatus(say);
    return say;
  }
  /* An add that goes ahead: Teeinblue's own box gets our tick before its handler reads it, the
     line beside the button starts saying what is happening, and the clock starts for add_timing. */
  function startedAdd() {
    var dog = String(answer('dog') || '').trim();
    checkoutImageStatus.dog = dog ? possessive(dog) : '';
    onCartAdd.clickAt = Date.now();
    syncTibAgreement(true);
    checkoutImageStatus('Saving ' + (checkoutImageStatus.dog || 'your') + ' design.');
  }
  /* A scripted click on a label moves focus to its radio, and the browser scrolls to it: on
     the ad landing page that pulled a shopper typing in the hero 5,000px down the page. So
     the bridge puts focus and scroll back where the shopper had them. */
  function stayPut(fn) {
    var had = document.activeElement, x = window.scrollX, y = window.scrollY;
    var wrap = document.querySelector('.page-wrapper'), wy = wrap ? wrap.scrollTop : 0;
    fn();
    if (document.activeElement !== had) {
      try { if (had && had !== document.body && had.focus) had.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { /* old browser */ }
    }
    if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
    holdScroll(x, y, wrap, wy);
  }
  /* The browser's scroll to a newly focused input starts a beat later, and the page's smooth
     scrolling stretches it over half a second, so the check above can't see it. For a second
     after a scripted click, any scroll the shopper didn't make is undone; the first touch,
     wheel or key hands the page straight back to them. */
  function holdScroll(x, y, wrap, wy) {
    var until = Date.now() + 1200, mine = false;
    var off = function () {
      window.removeEventListener('scroll', back, true);
      ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { window.removeEventListener(t, theirs, true); });
    };
    var theirs = function () { mine = true; off(); };
    var back = function () {
      if (mine || Date.now() > until) { off(); return; }
      var html = document.documentElement, was = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo(x, y);
      if (wrap && Math.abs(wrap.scrollTop - wy) > 2) { wrap.style.scrollBehavior = 'auto'; wrap.scrollTop = wy; wrap.style.scrollBehavior = ''; }
      html.style.scrollBehavior = was;
    };
    window.addEventListener('scroll', back, true);
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { window.addEventListener(t, theirs, { capture: true, passive: true }); });
    setTimeout(off, 1300);
  }
  function fillField(f) {
    var k = f.rule.k, el = f.el;
    if ((cityArtPreview() || nativeArtworkPurchase()) && ['art_style', 'art_tone', 'personality', 'art_energy', 'art_style_direction', 'art_tone_direction'].indexOf(k) !== -1) el.setAttribute('data-hs2-art-personality', '');
    var text = el.querySelector('input[type="text"], input:not([type]), textarea');
    var select = el.querySelector('select');
    if (text) {
      var name = text.name || text.id;
      if (k === 'personality' && (cityArtPreview() || nativeArtworkPurchase())) {
        el.setAttribute('data-hs2-art-personality', '');
        var facts = nativeArtworkEvidence();
        if (text.value !== facts) setValue(text, facts);
        return { name: name, value: facts };
      }
      if (['art_energy', 'art_style_direction', 'art_tone_direction'].indexOf(k) !== -1 && (cityArtPreview() || nativeArtworkPurchase())) {
        // always written ("none" included for energy), so a changed choice never leaves old text behind
        var direction = answer(k);
        if (text.value !== direction) setValue(text, direction);
        return { name: name, value: direction };
      }
      watchField(text, k);
      if (bridge.owned[name]) return { name: name, value: text.value, mine: true };
      var want = answer(k);
      if (!want && !(k === 'city' && (cityArtPreview() || nativeArtworkPurchase())) && !(nativeArtworkPurchase() && /^(line4|signed)$/.test(k))) return null; // blank city must clear a previous native default
      // a one-line input drops "\n" and would join two words, so it gets the line unbroken
      if (text.tagName !== 'TEXTAREA') want = want.replace(/\n/g, ' ');
      // A matching field does not prove Teeinblue rebuilt the print artwork. Re-send its
      // input event when the mug's visible SVG still shows an older customization.
      if (text.value === want && !mugArtworkMismatch(name, want)) return { name: name, value: want };
      if (!mayResend(name, want)) return { name: name, value: want }; // tried enough: leave the field as it is
      setValue(text, want);
      return { name: name, value: want, changed: true };
    }
    if (select) {
      var sharedArtChoice = (cityArtPreview() || nativeArtworkPurchase()) && (k === 'art_style' || k === 'art_tone');
      if (!sharedArtChoice) watchField(select, k);
      if (!sharedArtChoice && bridge.owned[select.name]) return { name: select.name, value: select.value, mine: true };
      var opt = Array.prototype.slice.call(select.options).filter(function (o) { return !o.disabled && choiceMatches(o.textContent, k); })[0];
      if (!opt) return null;
      if (select.value === opt.value) return { name: select.name, value: opt.value };
      if (!mayResend(select.name, opt.value)) return { name: select.name, value: opt.value };
      setValue(select, opt.value);
      return { name: select.name, value: opt.value, changed: true };
    }
    // radio buttons, like Teeinblue's clipart choices. Teeinblue listens to the label, not
    // the input: ticking the input leaves its own pick (marked "active") as it was, and
    // that is what prints. So judge by its mark and click the label, as a shopper does.
    var radios = Array.prototype.slice.call(el.querySelectorAll('input[type="radio"]'));
    if (radios.length) watchChoice(el, radios, k);
    if (radios.length && el.__hs2owned) return { name: radios[0].name, value: '', mine: true };
    for (var i = 0; i < radios.length; i++) {
      var lab = radioLabel(radios[i]);
      if (choiceMatches(lab ? lab.textContent : radios[i].value, k)) {
        if (radioPicked(radios[i])) return { name: radios[i].name, value: radios[i].value };
        el.__hs2set = true;
        stayPut(function () { (lab || radios[i]).click(); });
        el.__hs2set = false;
        return { name: radios[i].name, value: radios[i].value, changed: true };
      }
    }
    var buttons = Array.prototype.slice.call(el.querySelectorAll('button, [role="radio"], [role="option"], .tee-option'));
    for (var j = 0; j < buttons.length; j++) {
      if (choiceMatches(buttons[j].textContent, k)) {
        if (/active|selected|checked/.test(buttons[j].className) || buttons[j].getAttribute('aria-checked') === 'true') return { name: k, value: val(k) };
        stayPut(function () { buttons[j].click(); });
        return { name: k, value: val(k), changed: true };
      }
    }
    return null;
  }
  // answers typed on the same page (the ad landing page) reach the personalizer too
  function bridgeSoon() {
    if (!document.querySelector('.tee-field')) return;
    if (!selfTriggered()) bridge.tries = 0;
    clearTimeout(bridgeSoon.t);
    bridgeSoon.t = setTimeout(function () { runBridge(); }, 400);
  }
  function radioLabel(r) { return (r.labels && r.labels[0]) || null; }
  function radioPicked(r) {
    var wrap = r.closest('.tee-radio');
    return wrap ? wrap.classList.contains('active') : r.checked;
  }
  // a shopper's own pick in Teeinblue's choices flows back to the answers card and the order
  function watchChoice(el, radios, k) {
    if (el.__hs2watch) return; el.__hs2watch = true;
    el.addEventListener('click', function (e) {
      if (el.__hs2set || !e.isTrusted) return;
      var lab = e.target.closest && e.target.closest('label');
      if (!lab) return;
      var text = norm(lab.textContent), all = lines(k);
      Object.keys(all).forEach(function (label) {
        if (text === norm(label) || text === norm(all[label])) { state[k] = label; el.__hs2owned = true; bridge.opened = true; save(); render(); }
      });
    });
  }
  function watchField(inp, k) {
    if (inp.__hs2watch) return; inp.__hs2watch = true;
    var handler = function () {
      if (inp.__hs2set) return;
      bridge.owned[inp.name || inp.id] = true;
      bridge.opened = true; // the shopper is working in the personalizer: it never folds under them
      // carry the shopper's edit back to the order's hidden answers
      if (inp.tagName === 'SELECT') {
        var o = inp.options[inp.selectedIndex], all = lines(k);
        Object.keys(all).forEach(function (label) { if (o && (norm(o.textContent) === norm(label) || norm(o.textContent) === norm(all[label]))) state[k] = label; });
      } else if (/^line[1-4]$/.test(k)) {
        // a v3 line edited in the personalizer flows back to the gift's words
        var key = nativeArtworkPurchase() && k === 'line4' ? 'meaning' : (V3_ORDER[v3Kind()] || V3_ORDER.print)[Number(k.slice(4)) - 1];
        if (key) {
          state.hs3_lines = state.hs3_lines || {}; state.hs3_lines[key] = inp.value.replace(/\s*\n\s*/g, ' '); state.hs3_copy_owner = 'user';
          try { var chat = JSON.parse(sessionStorage.getItem('hs3-gift') || '{}'); chat.edits = chat.edits || {}; chat.edits[key] = state.hs3_lines[key]; sessionStorage.setItem('hs3-gift', JSON.stringify(chat)); } catch (e) { /* current product keeps the edit */ }
        }
      } else if (k === 'signed') {
        state.hs3_signature_override = inp.value; state.hs3_copy_owner = 'user';
      } else if (k !== 'signed') {
        state[k] = inp.value;
      }
      if (nativeArtworkPurchase() && /^(line4|signed)$/.test(k)) invalidateBlanketReview();
      save(); render();
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
    if (k === 'city') inp.addEventListener('blur', function () {
      if ((cityArtPreview() || nativeArtworkPurchase()) && !inp.value.trim()) {
        state.city = ''; save(); if (inp.value !== '') setValue(inp, '');
      }
    });
  }
  function productId() {
    var c = window.teeinblueCampaign, m = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
    return (c && c.productId) || (m && m.product && m.product.id) || null;
  }
  function refill(wanted) {
    if (nativeArtworkPurchase()) return; // Never replay a stored photo through a paid native effect.
    var pid = productId(), api = window.teeinblue;
    if (!pid || !api || !api.refillCustomizationData || bridge.refilled) return;
    bridge.refilled = true;
    try {
      var keyName = 'teeinblue-customizations';
      var list = JSON.parse(window.localStorage.getItem(keyName) || '[]');
      if (!Array.isArray(list)) list = [];
      var mine = list.filter(function (x) { return String(x.productId) === String(pid); })[0];
      var data = Object.assign({}, (mine && mine.customization) || {}, tibCurrent() || {});
      wanted.forEach(function (w) { if (!w.mine) data[w.name] = w.value; });
      list = list.filter(function (x) { return String(x.productId) !== String(pid); });
      list.push({ productId: String(pid), customization: data, timestamp: Date.now() });
      window.localStorage.setItem(keyName, JSON.stringify(list.slice(-10)));
      api.refillCustomizationData(pid);
    } catch (e) { /* Teeinblue changed; the shopper still sees the answers card */ }
  }
  /* Every pass compares the answers with what Teeinblue holds and copies over the
     difference, on every visit (Teeinblue restores an earlier visit's picks, or its own
     first options, and those used to stay). A field the shopper changed in Teeinblue is
     theirs: its value flows back into the answers instead. After a change the bridge
     looks again, since Teeinblue can redraw a field after the click. */
  // the ad landing page has the review on the same page, so the review owns these answers
  function reviewHere() { return !!document.querySelector('[data-hs2-steps]'); }
  function runBridge() {
    // The new mug artwork is unbound. The global app embed can still insert the
    // old mug form; never refill that campaign from this reference-only template.
    if (document.querySelector('#buy[data-hs2-mug-art-preview]')) return;
    var fields = tibFields();
    if (!fields.length) return;
    bridge.all = fields;
    if (!engaged()) {
      // Nothing of ours to push yet, but a shopper who lands straight on a product page
      // (no review above it) can still type into Teeinblue directly. Attach the watchers
      // so that reaches the answers card, the live poster and the framed-poster upsell link.
      fields.forEach(function (f) { fillField(f); });
      if (reviewHere()) { bridge.fields = fields.length; bridge.filled = 0; bridge.wanted = []; fold(!bridge.opened); }
      if (giftView() && !reviewHere()) {
        document.documentElement.classList.add('hs2-v3-direct');
        showGiftEdit();
      }
      return;
    }
    var wanted = [], changed = false;
    fields.forEach(function (f) {
      var r = fillField(f);
      if (r) { r.el = f.el; wanted.push(r); if (r.changed) changed = true; }
    });
    bridge.filled = wanted.length;
    bridge.fields = fields.length;
    bridge.wanted = wanted;
    if (changed && bridge.tries < 6) {
      bridge.tries++;
      clearTimeout(runBridge.t);
      runBridge.t = setTimeout(function () {
        var cur = tibCurrent();
        if (cur) {
          var missed = wanted.filter(function (w) { return !w.mine && w.name in cur && String(cur[w.name]) !== String(w.value); });
          if (missed.length) refill(wanted);
        }
        runBridge();
      }, 450);
      bridgeStatus(false);
      return;
    }
    bridgeStatus(true);
  }
  /* The answers card says where the answers went. Once every field the review fills holds
     its answer, Teeinblue's copies of them fold away behind "Edit details", so the page
     reads preview, price, photo, Add To Cart. The photo field and any field the review
     doesn't fill (a line to pick, say) stay open. */
  function bridgeStatus(settled) {
    if (nativeArtworkPurchase()) return; // Keep the native upload and dog-name field visible.
    var card = document.querySelector('[data-hs2-answers]');
    if (!card) return;
    var st = card.querySelector('[data-hs2-bridge-status]'), note = card.querySelector('[data-hs2-bridge-note]');
    var complete = bridge.fields > 0 && bridge.filled === bridge.fields;
    if (st && !st.__hs2photo) {
      var say = complete ? 'Copied into the preview.' : bridge.filled ? 'Copied into the personalizer below. Change anything you like there.' : '';
      if (st.textContent !== say) st.textContent = say;
      st.hidden = !say;
    }
    if (note) note.hidden = !!bridge.filled;
    if (!settled) return; // mid-copy: leave the fold as it is until Teeinblue holds the answers
    fold((complete || reviewHere()) && !bridge.opened);
    var edit = card.querySelector('[data-hs2-tib-edit]');
    if (edit) edit.hidden = !complete;
    if (giftView()) {
      // the gift view always offers "Change a word"; with words missing (no chat, say), the
      // fields open in the panel so the shopper can fill them
      if (edit) edit.hidden = !bridge.fields;
      if (document.documentElement.classList.contains('hs2-v3-direct')) { showGiftEdit(); return; }
      if (!complete && bridge.fields && !bridge.autoOpened && !document.documentElement.classList.contains('hs2-v3-editing')) { bridge.autoOpened = true; editing(true); }
      else if (document.documentElement.classList.contains('hs2-v3-editing')) showGiftEdit();
    }
  }
  function fold(on) {
    var buy = document.getElementById('buy');
    if (!buy) return;
    var css = document.getElementById('hs2-tib-fold');
    if (!css) { css = document.createElement('style'); css.id = 'hs2-tib-fold'; document.head.appendChild(css); }
    // by id, which Teeinblue keeps when it redraws a field (it rewrites the class list). With the
    // review on the same page, every field it answers folds, filled or not: a name still missing
    // is asked for in the review, and Teeinblue's own check at Add To Cart opens the fold.
    var els = reviewHere() ? (bridge.all || []).map(function (f) { return f.el; }) : (bridge.wanted || []).map(function (w) { return w.el; });
    // a headshot from the review waiting for its button: Teeinblue's photo box waits behind it
    var photo = document.querySelector('.tee-field--photo');
    if (bridge.photoReady && photo) els = els.concat([photo]);
    var ids = on ? els.map(function (el) { return el && el.id; }).filter(Boolean) : [];
    var rules = ids.map(function (id) { return '#buy.hs2-tib-folded #' + (window.CSS && CSS.escape ? CSS.escape(id) : id); });
    var text = rules.length ? rules.join(',') + '{display:none!important}' : '';
    if (css.textContent !== text) css.textContent = text;
    on = on && rules.length > 0;
    buy.classList.toggle('hs2-tib-folded', on);
    document.documentElement.classList.toggle('hs2-tib-folded', on);
    bridge.folded = on;
    var edit = document.querySelector('[data-hs2-tib-edit]');
    if (edit && giftView()) { var ed = document.documentElement.classList.contains('hs2-v3-editing'); edit.textContent = ed ? 'Done' : 'Change a word'; edit.setAttribute('aria-expanded', ed ? 'true' : 'false'); }
    else if (edit) { edit.textContent = on ? 'Edit details' : 'Hide details'; edit.setAttribute('aria-expanded', on ? 'false' : 'true'); }
  }

  /* ------------------------------------------------------------ the gift view (v3)
     product.gift is one screen (hs2.css "the gift view"). Teeinblue's word fields are folded
     away; "Change a word" opens them in a panel (the details column scrolls on its own) and
     Done folds them again. giftFit sizes the screen to the window, the preview to the room
     left, and zooms the details down to the largest size that fits. */
  function giftView() { return !!document.querySelector('#buy[data-hs2-v3]'); }
  var giftEditKey = '';
  function giftEditFields() {
    return tibFields().filter(function (f) { return /^(dog|line[1-4]|signed)$/.test(f.rule.k) || cityArtPreview() && f.rule.k === 'city'; });
  }
  function giftEditLabel(k) {
    if (k === 'dog') return "Dog's name";
    if (k === 'city') return 'City (optional)';
    if (k === 'line4' && cityArtPreview()) return 'Your note';
    if (k === 'signed') return 'Signature';
    return 'Sentence ' + k.slice(4);
  }
  function showGiftEdit() {
    if (!giftView() || !document.documentElement.classList.contains('hs2-v3-editing') && !document.documentElement.classList.contains('hs2-v3-direct')) return;
    var fields = giftEditFields();
    if (!fields.length) return;
    var i = fields.findIndex(function (f) { return f.rule.k === giftEditKey; });
    if (i < 0) { i = 0; giftEditKey = fields[0].rule.k; }
    fields.forEach(function (f) { f.el.classList.toggle('hs2-v3-active', f.rule.k === giftEditKey); });
    var wrap = fields[0].el.parentElement;
    if (!wrap) return;
    var nav = wrap.querySelector('[data-hs2-gift-edit-nav]');
    if (!nav) {
      nav = document.createElement('div'); nav.className = 'hs2-gift-edit-nav'; nav.setAttribute('data-hs2-gift-edit-nav', '');
      nav.innerHTML = '<button type="button" data-hs2-gift-edit-prev aria-label="Previous field">‹</button><span data-hs2-gift-edit-label></span><button type="button" data-hs2-gift-edit-next aria-label="Next field">›</button>';
      wrap.insertBefore(nav, fields[0].el);
      nav.querySelector('[data-hs2-gift-edit-prev]').addEventListener('click', function () { moveGiftEdit(-1); });
      nav.querySelector('[data-hs2-gift-edit-next]').addEventListener('click', function () { moveGiftEdit(1); });
    }
    nav.querySelector('[data-hs2-gift-edit-label]').textContent = giftEditLabel(giftEditKey) + ' · ' + (i + 1) + ' of ' + fields.length;
    nav.querySelector('[data-hs2-gift-edit-prev]').disabled = i === 0;
    nav.querySelector('[data-hs2-gift-edit-next]').disabled = i === fields.length - 1;
  }
  function moveGiftEdit(delta) {
    var fields = giftEditFields(), i = fields.findIndex(function (f) { return f.rule.k === giftEditKey; });
    if (!fields.length) return;
    giftEditKey = fields[Math.max(0, Math.min(fields.length - 1, i + delta))].rule.k;
    showGiftEdit();
    var active = fields.find(function (f) { return f.rule.k === giftEditKey; });
    var inp = active && active.el.querySelector('input:not([type="hidden"]), textarea');
    if (inp) inp.focus();
  }
  function editing(on) {
    var html = document.documentElement;
    if (!on && cityArtPreview() && giftEditFields().every(function (f) {
      var inp = f.el.querySelector('input:not([type="hidden"]), textarea');
      return inp && inp.value.trim();
    })) html.classList.remove('hs2-v3-direct');
    html.classList.toggle('hs2-v3-editing', on);
    bridge.opened = on;
    fold(!on);
    if (on) showGiftEdit();
    if (!on) { try { window.scrollTo(0, 0); } catch (e) { /* old browser */ } }
    giftFit();
  }
  function giftFit() {
    // Candidate controls stay readable; allow scrolling instead of shrinking art and controls.
    if (cityArtPreview()) return;
    var buy = document.querySelector('#buy[data-hs2-v3]');
    if (!buy) return;
    var a = document.activeElement;
    if (a && buy.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== 'file') return; // keyboard up
    var html = document.documentElement, info = buy.querySelector('.hs2-product__info'), media = buy.querySelector('.hs2-product__media');
    if (!info || !media) return;
    if (!html.classList.contains('hs2-v3-editing')) { try { window.scrollTo(0, 0); } catch (e) { /* old browser */ } }
    var bar = html.classList.contains('hs2-has-next') && document.querySelector('.hs2-next');
    var under = bar ? Math.ceil(window.innerHeight - bar.getBoundingClientRect().top) + 4 : 0;
    var top = buy.getBoundingClientRect().top + (window.scrollY || 0);
    html.style.setProperty('--hs2-v3-h', Math.max(320, Math.floor(window.innerHeight - top - under)) + 'px');
    info.style.zoom = '';
    var wide = window.innerWidth >= 900;
    // the preview is scaled, not resized: Teeinblue lays its slider out once, at its own width
    var art = function () {
      var cs = window.getComputedStyle(media);
      var w = media.clientWidth, h = media.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      media.querySelectorAll('.hs2-product__tib, .hs2-product__main').forEach(function (el) {
        el.style.zoom = '';
        if (!el.offsetHeight) return;
        var z = Math.min(1, h / el.offsetHeight, w / el.offsetWidth);
        if (z < 0.995) el.style.zoom = Math.max(0.2, z).toFixed(3);
      });
      return h;
    };
    if (html.classList.contains('hs2-v3-editing')) { art(); return; }
    // the preview keeps at least 38% of a phone screen; the details zoom down until it does
    var minArt = wide ? 0 : buy.clientHeight * 0.38;
    var fits = function (z) {
      info.style.zoom = z === 1 ? '' : z.toFixed(3);
      var h = art();
      if (wide) return info.scrollHeight * z <= buy.clientHeight - 36 + 1;
      return buy.scrollHeight <= buy.clientHeight + 1 && h >= minArt;
    };
    var z = 1;
    if (!fits(1)) {
      var lo = 0.5, hi = 1;
      for (var i = 0; i < 7; i++) { var mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
      z = lo; fits(z);
    }
    buy.setAttribute('data-hs2-fit', z.toFixed(2));
  }
  // Teeinblue names its photo buttons for a generic image; on the gift view they name the dog
  function giftLabels() {
    if (!giftView()) return;
    var d = (state.dog == null ? '' : String(state.dog)).trim();
    var has = !!document.querySelector('#buy .tee-field--photo .tee-photo-head img');
    var media = document.querySelector('#buy [data-hs2-media]');
    if (media) media.toggleAttribute('data-hs2-sample', cityArtPreview() ? !cityArtSaved() : !(usePhoto.file && handed() && tibTookPhoto() && !document.querySelector('.vm--container')));
    if (cityArtPreview()) {
      var previewLabel = media && media.querySelector('.hs2-product__example');
      if (previewLabel) previewLabel.textContent = 'Existing reference artwork. Generation is paused.';
      document.querySelectorAll('#buy #teeAtcButton, #buy .tee-btn--atc, #buy [data-hs2-add]').forEach(function (orderButton) { orderButton.disabled = true; orderButton.textContent = 'Preview only'; });
      var place = document.querySelector('[data-hs2-artwork-city]');
      if (place) place.textContent = answer('city') || 'No city selected';
      var editPlace = document.querySelector('[data-hs2-artwork-edit-city]');
      if (editPlace && !editPlace.__hs2) {
        editPlace.__hs2 = true;
        editPlace.addEventListener('click', function () { giftEditKey = 'city'; editing(true); });
      }
    }
    document.querySelectorAll('#buy .tee-field--photo .tee-btn--upload, #buy .tee-field--photo .tee-btn--recustomize').forEach(function (b) {
      var want = /recustomize/.test(b.className) ? 'Crop' : has ? 'Change photo' : (d ? 'Add ' + d + '\'s photo' : 'Add your dog\'s photo');
      var t = b.querySelector('span') || b;
      if (t.textContent.trim() !== want && !t.children.length) t.textContent = want;
    });
  }
  function editDetails() {
    var edit = document.querySelector('[data-hs2-tib-edit]');
    if (!edit || edit.__hs2) return; edit.__hs2 = true;
    edit.addEventListener('click', function () {
      if (giftView()) { editing(!document.documentElement.classList.contains('hs2-v3-editing')); return; }
      bridge.opened = bridge.folded;
      fold(!bridge.opened);
      if (bridge.opened) {
        var first = (bridge.wanted || [])[0];
        if (first && first.el) first.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }
  // a field Teeinblue marks invalid (at Add To Cart) never stays folded away
  function unfoldInvalid() {
    if ((bridge.folded || document.documentElement.classList.contains('hs2-v3-direct')) && document.querySelector('#buy .tee-field--invalid')) {
      if (giftView()) {
        var invalid = document.querySelector('#buy .tee-field--invalid');
        var field = tibFields().find(function (f) { return f.el === invalid; });
        if (field) giftEditKey = field.rule.k;
        if (document.documentElement.classList.contains('hs2-v3-direct')) { showGiftEdit(); return; }
        editing(true); return;
      }
      bridge.opened = true; fold(false);
    }
  }
  /* Teeinblue titles its own picker with its raw option key ("color"), set inside its block,
     not from the Shopify option name. The section's "Plain names for product options" map
     ("color" -> "Frame") is applied to the title's text here, and again whenever Teeinblue
     redraws the picker, so the shopper reads "Frame". */
  function relabelOptions() {
    var buy = document.getElementById('buy');
    var native = nativeArtworkPurchase();
    if (!buy || (!buy.getAttribute('data-hs2-option-labels') && !native)) return;
    var map = {};
    try { map = JSON.parse(buy.getAttribute('data-hs2-option-labels') || '{}') || {}; } catch (e) { if (!native) return; }
    // one key for "Available Product" and the "Available Products" the live title reads (28 Oct)
    var one = function (k) { return k ? k.replace(/s$/, '') : k; };
    buy.querySelectorAll('.tee-option').forEach(function (opt) {
      var m = /(?:^|\s)tee-option--([a-z0-9_-]+)/.exec(opt.className), title = opt.querySelector('.tee-option__title');
      if (!title) return;
      // Teeinblue's own key ("color"), or the title's words ("Available Product") for a key it spells differently
      var key = m ? m[1].replace(/_/g, '-') : '', words = title.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var want = map[key] || (title.__hs2key && map[title.__hs2key]) || map[words] || map[one(key)] || map[one(words)];
      // a gift page reads in sentence case even where the section names nothing: "Color", "Framed or unframed"
      if (!want && native) {
        var raw = title.__hs2raw || title.textContent.trim();
        if (/^available[ _-]?products?$/i.test(raw) || one(key) === 'available-product') want = 'Framed or unframed';
        else if (raw && raw === raw.toLowerCase() && /^[a-z]/.test(raw)) want = raw.charAt(0).toUpperCase() + raw.slice(1);
        if (want && !title.__hs2raw) title.__hs2raw = raw;
      }
      if (!want) return;
      if (!title.__hs2key) title.__hs2key = map[key] ? key : map[words] ? words : map[one(key)] ? one(key) : one(words);
      if (title.textContent.trim() === want) return;
      // change only the text, never Teeinblue's elements
      var walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT), node, done = false;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        node.nodeValue = done ? '' : want;
        done = true;
      }
    });
    if (native) tibChrome();
    if (!buy.__hs2labels && 'MutationObserver' in window) {
      buy.__hs2labels = true;
      var queued = false;
      new MutationObserver(function () {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; relabelOptions(); }, 50);
      }).observe(buy, { childList: true, subtree: true, characterData: true });
    }
  }
  /* Teeinblue's own chrome on the gift pages (28 Oct, Krish's stills): "Add to cart" in sentence case,
     "Adjust the framing" for "Recustomize image", and its upload count and its own added-to-cart
     line put away, since the painting card and the cart drawer say those. Only text nodes change,
     never Teeinblue's elements, and a line holding a control is never put away. relabelOptions
     runs this again whenever Teeinblue redraws. */
  function tibChrome() {
    var buy = document.querySelector('#buy[data-hs2-artwork-kind], #buy[data-hs2-blanket-purchase]');
    if (!buy) return;
    [['#teeAtcButton, .tee-btn--atc', /^add to cart$/i, 'Add to cart'], ['.tee-btn--recustomize', /^re-?customi[sz]e(?: image)?$/i, 'Adjust the framing']].forEach(function (w) {
      buy.querySelectorAll(w[0]).forEach(function (el) {
        var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), text;
        while ((text = walk.nextNode())) { if (w[1].test(text.nodeValue.trim()) && text.nodeValue.trim() !== w[2]) text.nodeValue = w[2]; }
      });
    });
    var ours = '[data-hs2-add-note], [data-hs2-sign-line], .hs-journey, .hs-art, .hs-extras, [data-hs2-answers], [data-hs2-next]';
    var walker = document.createTreeWalker(buy, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el || !/uploads? remaining|has been added to (?:your |the )?cart/i.test(node.nodeValue) || el.closest(ours)) continue;
      if (el.querySelector('button, input, select, textarea, label, a:not([href*="/cart"])')) continue;
      if (!el.hasAttribute('data-hs2-tib-hide')) el.setAttribute('data-hs2-tib-hide', '');
    }
    buy.querySelectorAll('a').forEach(function (a) {
      if (/^view cart$/i.test((a.textContent || '').trim()) && !a.closest(ours) && !a.hasAttribute('data-hs2-tib-hide')) a.setAttribute('data-hs2-tib-hide', '');
    });
    // Teeinblue may draw its agreement box again, unticked: it follows ours on every redraw
    syncTibAgreement(!!blanketAcceptedKey && blanketReviewAccepted());
    portraitSignLine();
  }
  function tibGallery() {
    var box = document.querySelector('[data-hs2-tib-gallery]'), media = document.querySelector('[data-hs2-media]');
    if (!box || !media) return;
    var on = box.children.length ? 'on' : 'off';
    // Teeinblue empties its gallery for a moment when it redraws; switching off only after it has
    // stayed empty for 800 ms keeps the picture from flicking to the photo and back (27 Oct)
    if (on === 'off' && media.getAttribute('data-tib') === 'on') {
      if (!tibGallery.offAt) { tibGallery.offAt = Date.now(); setTimeout(tibGallery, 850); return; }
      if (Date.now() - tibGallery.offAt < 800) return;
    }
    tibGallery.offAt = 0;
    var pv = media.querySelector('[data-hs2-thumb-preview]');
    if (media.getAttribute('data-tib') !== on) {
      media.setAttribute('data-tib', on);
      /* A gift page opens on the product photo until the shopper adds their own (open_on photo).
         After the chat, though, the words are already in the preview, and the product photo
         shows Teeinblue's sample dog and lines ("Bartholomew Jr"), so the buyer could not see
         their own words before Add to cart (Krish, 19 Oct). So when the chat handed this gift
         its words, the preview is the picture on show, unless the shopper picked a photo. */
      // the blanket has no words, so its preview stays the example photo until there is art in it:
      // an empty cream blanket read as broken (Krish, 28 Oct)
      if (on === 'on' && pv && media.getAttribute('data-show') === 'photo' && v3Kind() && state.hs3_lines && !media.__hs2picked && (!blanketArtPreview() || previewHasArt())) media.removeAttribute('data-show');
      // the preview arrived: it is the picture on show, so its thumbnail is the current one
      if (on === 'on' && pv && !media.hasAttribute('data-show')) {
        media.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === pv ? 'true' : 'false'); });
      }
    }
    // Teeinblue's arrows and swipes also show its own sample mockups (the pug mug): "Your design" is
    // the current thumbnail only while the buyer's design is the slide on show (28 Oct)
    if (!box.__hs2slides && 'MutationObserver' in window) {
      box.__hs2slides = true;
      var soon = function () { clearTimeout(tibGallery.slideT); tibGallery.slideT = setTimeout(tibGallery, 120); };
      box.addEventListener('click', function () { setTimeout(tibGallery, 400); }, true);
      box.addEventListener('transitionend', soon);
      new MutationObserver(soon).observe(box, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    }
    if (on === 'on' && pv && !media.hasAttribute('data-show')) {
      var mine = tibSlideShown(box) <= 0 ? 'true' : 'false';
      if (pv.getAttribute('aria-current') !== mine) pv.setAttribute('aria-current', mine);
    }
  }
  // which of Teeinblue's slides is on show: the one across the middle of its slider. The first is
  // the buyer's design; the others are its mockups. 0 also for a gallery of one slide.
  function tibSlideShown(box) {
    var slides = box.querySelectorAll('.tee-slide'), frame = box.querySelector('.tee-slider__inner, .tee-slider, .tee-gallery__stage');
    if (slides.length < 2 || !frame) return 0;
    var r = frame.getBoundingClientRect(), mid = r.left + r.width / 2;
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i].getBoundingClientRect();
      if (s.width && s.left <= mid && s.right > mid) return i;
    }
    return -1;
  }
  function photoInput() { return document.querySelector('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]'); }
  function handedKey() { return 'hs2-handed-' + (productId() || location.pathname); }
  function handed() {
    if (handed.mem === handedKey() + String(usePhoto.t)) return true;
    try { return window.localStorage.getItem(handedKey()) === String(usePhoto.t); } catch (e) { return false; }
  }
  function markHanded(t) {
    handed.mem = handedKey() + String(t);
    try { window.localStorage.setItem(handedKey(), String(t)); } catch (e) { /* private mode */ }
  }
  // Teeinblue took the photo: its crop dialog opened, or its field offers "Choose another image"
  function tibTookPhoto() {
    var f = document.querySelector('.tee-field--photo');
    return !!document.querySelector('.vm--container') || !!(f && /choose another image/i.test(f.innerText || ''));
  }
  /* Hands the review's photo to Teeinblue's own upload field, the way picking a file does.
     Used both automatically (handoff, below) and by the fallback button. Teeinblue draws its
     upload field a beat before it listens to it: a gift list's second gift handed the photo
     over 0.2s after the field appeared and Teeinblue never saw it (6 October). So the hand-off
     checks that Teeinblue took it and tries again, a few times, if it didn't. */
  function doHandoff(box, attempt) {
    // Candidate system has no paid dispatch authority or verified original source.
    // No option selection, reload or legacy handoff may start an image effect.
    if (cityArtPreview() || nativeArtworkPurchase()) return;
    attempt = attempt || 0;
    if (cityArtPreview() && artRequested()) return;
    var target = photoInput();
    var st = document.querySelector('[data-hs2-bridge-status]');
    try {
      var dt = new DataTransfer();
      dt.items.add(new File([usePhoto.file], usePhoto.file.name || 'headshot.jpg', { type: usePhoto.file.type || 'image/jpeg' }));
      target.files = dt.files;
      if (cityArtPreview()) {
        // An uncertain request is never retried automatically: AI can take minutes.
        markArtRequested();
      }
      doHandoff.busy = true;
      try { target.dispatchEvent(new Event('change', { bubbles: true })); } finally { doHandoff.busy = false; }
      markHanded(usePhoto.t);
      if (box) box.hidden = true;
      bridge.photoReady = false; if (bridge.folded) fold(true);
      if (st) { st.__hs2photo = true; st.textContent = 'Headshot sent below. Place it in the frame and press Save.'; st.hidden = false; }
      if (!attempt) track('photo_handoff');
      if (cityArtPreview()) {
        if (st) st.textContent = 'Creating your artwork. Save its placement when it appears, then check your dog' + (blanketArtPreview() ? ' and their personality.' : ' and city.');
        return;
      }
      var t0 = Date.now(), file = usePhoto.file;
      clearInterval(doHandoff.watch);
      doHandoff.watch = setInterval(function () {
        if (usePhoto.file !== file) { clearInterval(doHandoff.watch); return; }
        if (tibTookPhoto()) { clearInterval(doHandoff.watch); placed(st); return; }
        // Teeinblue takes about 6.6 s to show it has the photo (19 Oct); retrying at 1.2 s sent
        // the same headshot five times. Only a field that never answers gets it again.
        if (Date.now() - t0 < 10000) return;
        clearInterval(doHandoff.watch);
        if (attempt < 2) doHandoff(box, attempt + 1);
        else if (box) box.hidden = false; // Teeinblue never took it: the button lets the shopper try
      }, 150);
    } catch (e) {
      if (box) box.hidden = false; // let the shopper send it themselves
      if (st) { st.__hs2photo = true; st.textContent = 'Upload the headshot again in the personalizer below.'; st.hidden = false; }
    }
  }
  // once Teeinblue's placement dialog closes with the photo in, the box says so (Krish, 19 Oct:
  // it kept asking to crop after Save)
  function placed(st) {
    clearInterval(placed.t);
    placed.t = setInterval(function () {
      if (document.querySelector('.vm--container')) return;
      clearInterval(placed.t);
      if (st && st.__hs2photo) st.textContent = 'Headshot in place. Check the preview, then add it to the cart.';
    }, 300);
  }
  /* The headshot now hands itself to Teeinblue's upload as soon as its photo field appears,
     instead of waiting for a tap on "Use [Dog]'s headshot". A phone test on 5 October found
     Add To Cart could otherwise succeed before that tap, with Teeinblue falling back to its
     own sample photo and nothing in the cart or checkout to show the order held a stranger's
     dog, not the shopper's. The card and its button stay, only as a fallback for a browser
     where the automatic hand-off throws. */
  function handoff() {
    if (nativeArtworkPurchase()) { updateBlanketPurchaseStatus(); return; }
    var box = document.querySelector('[data-hs2-handoff]');
    if (!box) return;
    var img = box.querySelector('[data-hs2-handoff-img]');
    if (img && photoURL && img.src !== photoURL) img.src = photoURL;
    var btn = box.querySelector('[data-hs2-handoff-btn]');
    if (cityArtPreview()) {
      box.hidden = false;
      if (btn) { btn.disabled = true; btn.textContent = 'Artwork update paused'; }
      var paused = document.querySelector('[data-hs2-artwork-status]');
      if (paused) paused.textContent = 'Your shared choices are saved. Candidate artwork is not ready to generate or order yet.';
      return;
    }
    if (btn && !btn.__hs2) {
      btn.__hs2 = true;
      btn.addEventListener('click', function () {
        if (cityArtPreview() && artRequested()) return;
        doHandoff(box);
      });
    }
    var inp = photoInput(), file = usePhoto.file;
    if (cityArtPreview()) {
      var sent = artRequested();
      if (sent) { doHandoff.artPhoto = usePhoto.t; doHandoff.artCity = answer('city'); }
      var saved = cityArtSaved();
      box.hidden = saved || !(inp && file);
      if (btn) {
        btn.disabled = !!sent;
        btn.textContent = sent ? 'Artwork requested' : doHandoff.artPhoto ? 'Create new artwork' : 'Create artwork';
      }
      var artStatus = document.querySelector('[data-hs2-artwork-status]');
      if (artStatus) artStatus.textContent = saved ? 'Check the saved image for your dog' + (blanketArtPreview() ? ' and their actual habits' : answer('city') ? ' and ' + answer('city') : '') + '. Preview only.' : doHandoff.artPhoto && !sent ? 'Your photo or ' + (blanketArtPreview() ? 'answers' : 'city') + ' changed. Create new artwork to use it.' : sent ? 'Your artwork is being prepared. Save its placement when it appears.' : blanketArtPreview() ? 'Preview only. Check their face, markings and personality.' : 'Preview only. Check your dog, any selected city and note before release.';
      var sourceLink = document.querySelector('[data-hs2-artwork-source]');
      if (sourceLink) { sourceLink.hidden = !saved; if (saved) sourceLink.href = cityArtSource(); else sourceLink.removeAttribute('href'); }
      return;
    }
    var can = !!(inp && file && !handed() && typeof DataTransfer === 'function');
    if (bridge.photoReady !== can) { bridge.photoReady = can; if (bridge.folded) fold(true); }
    if (can) { doHandoff(box); return; }
    box.hidden = true;
  }
  /* A photo picked in Teeinblue's own upload field is kept the same way as one from the
     review's attach box, so the next gift on a gift list opens with it. The in-app test on
     6 October found the second gift opening on an empty photo box, under a bar promising
     the photo carries over. This page's field already holds the photo, so it is marked as
     handed here and never sent back in. */
  function keepTibPhoto() {
    if (keepTibPhoto.done) return;
    keepTibPhoto.done = true;
    photoLogOn();
    document.addEventListener('change', function (e) {
      var inp = e.target;
      if (doHandoff.busy || !inp || inp.type !== 'file' || !inp.matches) return;
      if (!inp.matches('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]')) return;
      var f = inp.files && inp.files[0];
      // some Android pickers hand over a file with no type; on a gift page its name still says what it is
      if (!f || !(/^image\//.test(f.type) || (nativeArtworkPurchase() && !f.type && /\.(jpe?g|png|webp|hei[cf])$/i.test(f.name || '')))) return;
      var who = answer('dog') || 'your dog';
      if (nativeArtworkPurchase() && inp.__hs2PreparedPhoto !== f && window.HSPhotoQuality && inp.__hs2CheckedPhoto !== f) {
        // The photo check comes first, on the device (hs-photo-quality.js): a photo that can't make
        // good artwork never reaches Teeinblue and never reserves the upload (27 Oct).
        e.preventDefault(); e.stopImmediatePropagation();
        photoLog('change', photoLogFile(f, inp, 'check', e));
        // a second pick while a check runs replaces the first: only the latest photo's result counts
        var run = keepTibPhoto.checking = { file: f }, t0 = Date.now();
        keepTibPhoto.warn = '';
        photoNote('Checking ' + possessive(who) + ' photo on your device.');
        photoLog('check', {});
        // ten seconds at most on the device, the dog detector included (Krish, 28 Oct); a checker that fails lets the photo go on, as a timeout does
        Promise.resolve().then(function () { return window.HSPhotoQuality.check(f, { timeout: 4000, checkTimeout: 10000 }); }).catch(function (err) {
          photoLog('check:error', { name: err && err.name || '', message: err && err.message || '' });
          return { verdict: 'ok', overridable: false, reasons: [], metrics: null, detection: null };
        }).then(function (r) {
          if (keepTibPhoto.checking !== run) { photoLog('check:replaced', {}); return; }
          keepTibPhoto.checking = null;
          var found = r.detection && r.detection.dogs && r.detection.dogs[0];
          photoLog(r.timedOut ? 'check:timeout' : 'check:' + r.verdict, { ms: Date.now() - t0, codes: r.reasons.map(function (x) { return x.code; }).join(','),
            size: r.metrics ? r.metrics.width + 'x' + r.metrics.height : '', dog: r.detection ? (found ? Math.round(found.score * 100) / 100 : 'none') : 'skipped' });
          if (r.verdict === 'reject' && !(r.overridable && inp.__hs2Override === f)) {
            inp.value = '';
            photoNote(r.reasons.map(function (x) { return x.message; }).join(' '), r.overridable ? function () {
              // the buyer knows their dog: the detector can miss an unusual one
              var again = livePhotoInput(inp);
              if (!again) { photoNote(photoReason({ code: 'detached' }, f)); return; }
              again.__hs2Override = f;
              try { var dt = new DataTransfer(); dt.items.add(f); again.files = dt.files; } catch (err) { photoNote(photoReason({ code: 'detached' }, f)); return; }
              track('photo_override', {});
              again.dispatchEvent(new Event('change', { bubbles: true }));
            } : null);
            track('photo_rejected', { reasons: r.reasons.map(function (x) { return x.code; }).join(',') });
            return;
          }
          keepTibPhoto.warn = r.verdict === 'warn' ? r.reasons.map(function (x) { return x.message; }).join(' ') : '';
          photoNote(keepTibPhoto.warn);
          // Teeinblue may have redrawn its field during the check: the photo goes to the field as it is now
          var target = livePhotoInput(inp);
          if (target && target !== inp) {
            try { var moved = new DataTransfer(); moved.items.add(f); target.files = moved.files; } catch (err) { target = null; }
          }
          if (!target) { inp.value = ''; photoLog('detach', { stage: 'check' }); photoNote(photoReason({ code: 'detached' }, f)); return; }
          if (target !== inp) photoLog('redrawn', { id: target.id || '' });
          target.__hs2CheckedPhoto = f;
          target.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return;
      }
      if (nativeArtworkPurchase() && inp.__hs2PreparedPhoto !== f) {
        // Capture before the vendor receives the File. Preparing is local only;
        // the sole vendor event is emitted after metadata removal succeeds.
        e.preventDefault(); e.stopImmediatePropagation();
        photoLog('change', photoLogFile(f, inp, 'prepare', e));
        if (keepTibPhoto.preparing || !beginBlanketUpload()) {
          // cleared, so choosing the same photo again fires a change
          inp.value = '';
          photoNote(photoHeld());
          photoLog('held', { lock: photoLogLock() });
          return;
        }
        var token = { key: artRequestKey() }, p0 = Date.now();
        keepTibPhoto.preparing = token;
        photoNote(keepTibPhoto.warn || 'Getting ' + possessive(who) + ' photo ready and removing its location data.');
        photoLog('prepare', { lock: photoLogLock() });
        Promise.resolve().then(function () {
          if (!window.HSArtworkPhoto || typeof DataTransfer !== 'function') { var none = new Error('Photo preparation is unavailable.'); none.code = 'unavailable'; throw none; }
          return window.HSArtworkPhoto.prepare(f);
        }).then(function (prepared) {
          if (keepTibPhoto.preparing !== token) return;
          var why = function (code) { var err = new Error(code); err.code = code; return err; };
          if (token.key !== artRequestKey() || !nativeBlanketInputsReady()) throw why('changed');
          var target = livePhotoInput(inp);
          if (!target) throw why('detached');
          if (target !== inp) photoLog('redrawn', { id: target.id || '' });
          var dt = new DataTransfer(); dt.items.add(prepared.file);
          target.files = dt.files;
          target.__hs2PreparedPhoto = prepared.file;
          state.hs3_photo_provenance = { photo: prepared.photo, width: prepared.width, height: prepared.height, uploadWidth: prepared.uploadWidth, uploadHeight: prepared.uploadHeight };
          photoLog('prepare:ok', { ms: Date.now() - p0, bytes: prepared.uploadBytes || (prepared.file && prepared.file.size) || 0, size: prepared.width + 'x' + prepared.height, upload: prepared.uploadWidth ? prepared.uploadWidth + 'x' + prepared.uploadHeight : '' });
          // the lock reads 'sent' before Teeinblue hears of the photo, so no reload can send a second
          if (!blanketUploadSent()) throw why('storage');
          keepTibPhoto.preparing = null;
          photoNote(keepTibPhoto.warn || '');
          photoLog('vendor', { id: target.id || '', lock: photoLogLock() });
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }).catch(function (err) {
          if (keepTibPhoto.preparing !== token) return;
          keepTibPhoto.preparing = null;
          resetBlanketUpload(); inp.value = '';
          photoLog('prepare:error', { ms: Date.now() - p0, code: err && err.code || '', name: err && err.name || '', message: err && err.message || '' });
          photoNote(photoReason(err, f));
        });
        return;
      }
      var preparedUpload = inp.__hs2PreparedPhoto === f;
      delete inp.__hs2PreparedPhoto;
      if (nativeArtworkPurchase() && !preparedUpload && !(beginBlanketUpload() && blanketUploadSent())) {
        e.preventDefault(); e.stopImmediatePropagation(); inp.value = '';
        blanketPurchaseStatus('Upload held: wait for any current artwork to finish and your choices to load. This browser must allow session storage before creating artwork.');
        return;
      }
      var t = Date.now();
      markHanded(t);
      usePhoto(f, t);
      if (cityArtPreview() || nativeArtworkPurchase()) markArtRequested();
      state.hs3_photo_t = t; save();
      savePhoto(f, t);
      track('photo_attached', { where: 'personalizer' });
    }, true);
  }
  /* ?hsdebug=photo: an on-screen log of every photo stage, for a real phone (28 Oct: the Android photo
     failed where no desktop run could see why). It lives in sessionStorage (hs-photo-log, the last 120
     entries), so it survives the picker, a reload and a discarded tab. It stays on the device: nothing
     is sent anywhere and no pixels are kept. Off by default; ?hsdebug=off turns it off and clears it. */
  function photoLog(stage, data) {
    if (!photoLogOn()) return;
    var entry = { t: new Date().toISOString().slice(11, 23), s: String(stage) };
    Object.keys(data || {}).forEach(function (k) {
      var v = data[k];
      entry[k] = v == null || typeof v === 'number' || typeof v === 'boolean' ? v : String(v).slice(0, 200);
    });
    var log = photoLog.entries || (photoLog.entries = photoLogRead());
    log.push(entry);
    if (log.length > 120) log.splice(0, log.length - 120);
    try { window.sessionStorage.setItem('hs-photo-log', JSON.stringify(log)); } catch (e) { /* the overlay still shows it */ }
    photoLogDraw(log);
  }
  function photoLogRead() {
    try { var log = JSON.parse(window.sessionStorage.getItem('hs-photo-log') || '[]'); return Array.isArray(log) ? log : []; } catch (e) { return []; }
  }
  function photoLogOn() {
    if (photoLogOn.on !== undefined) return photoLogOn.on;
    var on = false;
    try {
      var flag = new URLSearchParams(window.location.search).get('hsdebug');
      if (flag === 'photo') window.sessionStorage.setItem('hs-debug', 'photo');
      if (flag === 'off') { window.sessionStorage.removeItem('hs-debug'); window.sessionStorage.removeItem('hs-photo-log'); }
      on = window.sessionStorage.getItem('hs-debug') === 'photo';
    } catch (e) { on = false; }
    photoLogOn.on = on;
    if (on) { try { photoLogStart(); } catch (e) { /* a debug aid never breaks the page */ } }
    return on;
  }
  function photoLogFile(f, inp, branch, e) {
    return { branch: branch, name: f.name || '', type: f.type || '', size: f.size, modified: f.lastModified || 0, id: inp.id || '', connected: !!inp.isConnected, trusted: !!(e && e.isTrusted) };
  }
  function photoLogLock() {
    try { return window.sessionStorage.getItem('hs2-blanket-upload:' + productId()) || 'none'; } catch (e) { return 'unreadable'; }
  }
  function photoLogStart() {
    var nav = '', earlier = photoLogRead().length;
    try { var entry = window.performance.getEntriesByType('navigation')[0]; nav = entry ? entry.type : ''; } catch (e) { nav = 'unknown'; }
    photoLog('page', { path: window.location.pathname, nav: nav, discarded: !!document.wasDiscarded, ua: navigator.userAgent, memory: navigator.deviceMemory || '',
      viewport: window.innerWidth + 'x' + window.innerHeight + '@' + window.devicePixelRatio, earlier: earlier });
    document.addEventListener('visibilitychange', function () { photoLog('visibility', { state: document.visibilityState }); });
    document.addEventListener('freeze', function () { photoLog('freeze', {}); });
    document.addEventListener('resume', function () { photoLog('resume', {}); });
    window.addEventListener('pagehide', function (e) { photoLog('pagehide', { persisted: !!e.persisted }); });
    window.addEventListener('pageshow', function (e) { photoLog('pageshow', { persisted: !!e.persisted }); });
    window.addEventListener('error', function (e) { photoLog('error', { message: e.message || '', at: String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0) }); });
    window.addEventListener('unhandledrejection', function (e) { photoLog('rejection', { message: e.reason && e.reason.message ? e.reason.message : String(e.reason) }); });
    // Teeinblue's reaction: its crop dialog, its upload spinner, its photo message, an invalid field
    if (!('MutationObserver' in window)) return;
    var last = '', look = function () {
      var message = document.querySelector('.tee-photo-message');
      var now = { dialog: !!document.querySelector('.vm--container'), uploading: !!document.querySelector('.tee-photo-uploading'),
        message: message ? String(message.textContent || '').trim().slice(0, 120) : '', invalid: !!document.querySelector('.tee-field--invalid') };
      if (JSON.stringify(now) !== last) { last = JSON.stringify(now); photoLog('teeinblue', now); }
    };
    var watch = function () {
      if (!document.body) return;
      new MutationObserver(function () { clearTimeout(look.timer); look.timer = setTimeout(look, 120); })
        .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      look();
    };
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  }
  // the overlay: fixed to the bottom of the screen, with Copy, Clear and Hide
  function photoLogDraw(log) {
    if (!document.body) return;
    var box = document.querySelector('[data-hs-photo-log]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-hs-photo-log', '');
      box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-direction:column;max-height:40vh;background:rgba(18,16,16,.94);color:#FBF6F1;font:11px/1.35 ui-monospace,Menlo,monospace';
      var bar = document.createElement('div'), title = document.createElement('strong'), pre = document.createElement('pre');
      bar.style.cssText = 'display:flex;gap:6px;align-items:center;padding:4px 8px';
      title.textContent = 'Photo log'; title.style.flex = '1';
      bar.appendChild(title);
      ['Copy', 'Clear', 'Hide'].forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = label; b.setAttribute('data-hs-photo-log-' + label.toLowerCase(), '');
        b.style.cssText = 'min-height:32px;padding:0 10px;border:1px solid #FBF6F1;border-radius:8px;background:transparent;color:inherit;font:inherit';
        bar.appendChild(b);
      });
      pre.style.cssText = 'margin:0;padding:4px 8px;overflow:auto;white-space:pre-wrap;word-break:break-all';
      box.appendChild(bar); box.appendChild(pre);
      document.body.appendChild(box);
      var copy = bar.querySelector('[data-hs-photo-log-copy]'), hide = bar.querySelector('[data-hs-photo-log-hide]');
      copy.addEventListener('click', function () {
        var text = pre.textContent, done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1500); };
        var select = function () { var range = document.createRange(); range.selectNodeContents(pre); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); try { document.execCommand('copy'); done(); } catch (e) { /* selected, ready to copy */ } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, select); else select();
      });
      bar.querySelector('[data-hs-photo-log-clear]').addEventListener('click', function () {
        photoLog.entries = [];
        try { window.sessionStorage.removeItem('hs-photo-log'); } catch (e) { /* nothing stored */ }
        photoLogDraw(photoLog.entries);
      });
      hide.addEventListener('click', function () { var shut = pre.style.display !== 'none'; pre.style.display = shut ? 'none' : ''; hide.textContent = shut ? 'Show' : 'Hide'; });
    }
    var out = box.querySelector('pre');
    out.textContent = log.map(function (entry) {
      var rest = Object.keys(entry).filter(function (k) { return k !== 't' && k !== 's'; }).map(function (k) { return k + '=' + entry[k]; }).join(' ');
      return entry.t + ' ' + entry.s + (rest ? ' ' + rest : '');
    }).join('\n');
    out.scrollTop = out.scrollHeight;
  }
  function watchBlanketCompletion() {
    if (!nativeArtworkPurchase() || watchBlanketCompletion.done || !('MutationObserver' in window)) return;
    watchBlanketCompletion.done = true;
    var queued = false;
    var relevantNode = function (node) {
      return node.nodeType === 1 && (node.matches('.vm--container, .tee-photo-image, image') || node.querySelector('.vm--container, .tee-photo-image, image'));
    };
    new MutationObserver(function (records) {
      var relevant = records.some(function (record) {
        if (record.type === 'attributes') return record.target.matches('image, .tee-field--photo .tee-photo-image');
        return Array.prototype.some.call(record.addedNodes, relevantNode) || Array.prototype.some.call(record.removedNodes, relevantNode);
      });
      if (!relevant || queued) return;
      queued = true;
      setTimeout(function () { queued = false; updateBlanketPurchaseStatus(); }, 150);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'xlink:href'] });
  }
  function teeinblue() {
    if (!document.querySelector('[data-hs2-answers], [data-hs2-tib-gallery]')) return;
    editDetails();
    var tick = function () { runBridge(); tibGallery(); handoff(); relabelOptions(); unfoldInvalid(); giftLabels(); giftFit(); };
    ['teeinblue-event-component-injected', 'teeinblue-event-campaign-loaded', 'teeinblue-event-variant-changed', 'teeinblue-event-customization-changed'].forEach(function (ev) {
      document.addEventListener(ev, function () { if (!selfTriggered()) bridge.tries = 0; setTimeout(tick, 60); setTimeout(swatchTib, 120); });
    });
    tick();
    watchBlanketCompletion(); // Native AI may finish long after the general bridge observer stops.
    if ('MutationObserver' in window) {
      var queued = false;
      var mo = new MutationObserver(function () {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; tick(); }, 150);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 60000);
      // invalid marks arrive at Add To Cart, long after the first minute
      var buy = document.getElementById('buy');
      if (buy) new MutationObserver(function () { unfoldInvalid(); }).observe(buy, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }

  /* ------------------------------------------------------------------ the cart
     Helio's cart (drawer and page) shows what Printful and Teeinblue call things. This
     tidies each line: no "Available Product", "Frame: Red Oak" for the framed poster,
     options that aren't a choice ("Default", "1 pc") left out, the shopper's own
     preview (Teeinblue's _customization_image, read from /cart.js) as the picture,
     and preserves an accurate checkout-rate message for mixed shipping profiles. */
  var CART_DROP_PROPS = /^available product$/i;
  var CART_DROP_VALUES = /^(default|default title|1 pc|one size)$/i;
  var cartImages = {};
  function cartArtworkImage(item) {
    if (!item) return '';
    var own = function (line) {
      var p = line.properties || {}, prepared = p._hs_checkout_image, native = p._customization_image;
      if (/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/(?:[0-9]+\/){3}files\/heartside-checkout-[a-f0-9-]{36}\.jpg(?:\?v=[0-9]+)?$/i.test(prepared || '')) return prepared;
      if (/^https:\/\/cdn\.teeinblue\.com\/customizations\/[a-f0-9-]{36}\.jpg(?:\?[^\s<>]*)?$/i.test(native || '')) return native;
      return '';
    };
    var image = own(item), components = item.item_components;
    if (image) return image;
    // Only our one-variant presentation bundle can inherit its sole child's image.
    if (Array.isArray(components) && components.length === 1 && item.variant_id != null && String(components[0].variant_id) === String(item.variant_id)) return own(components[0]);
    return '';
  }
  /* One redo per gift (Krish, 27 Oct). A personalised line in the cart offers "Make another
     version" once; the new version is added with _hs_redo_of naming the design it replaces, and the
     old line then offers to be removed by the buyer. Nothing is removed for them, so a failed step
     leaves two designs, never none, and every new design passes the same purchase gates. */
  function cartLineFacts(row) {
    var snap = null;
    try { snap = JSON.parse(row.getAttribute('data-hs2-cart-line') || 'null'); } catch (e) { snap = null; }
    if (!snap) return null;
    var id = '', of = '';
    [snap.properties || {}].concat((snap.item_components || []).map(function (c) { return c.properties || {}; })).forEach(function (p) {
      id = id || p._customization_id || ''; of = of || p._hs_redo_of || '';
    });
    return { id: String(id), of: String(of), addonFor: String((snap.properties || {})._hs_addon_for || ''), quantity: snap.quantity, personal: !!row.getAttribute('data-hs2-quantity-key') };
  }
  // the offers sit with the line's title and price, never in the narrow picture column
  function cartOfferHost(row) {
    var link = row.querySelector('a[href*="/products/"]');
    return row.querySelector('.cart-items__details') || (link && link.closest('td'));
  }
  function redoOffers(rows) {
    var lines = [], redone = {}, here = {};
    rows.forEach(function (row) { var f = cartLineFacts(row); if (f) { f.row = row; lines.push(f); if (f.of) redone[f.of] = true; if (f.id) here[f.id] = true; } });
    lines.forEach(function (l) {
      var link = l.row.querySelector('a[href*="/products/"]'), host = cartOfferHost(l.row);
      if (!host) return;
      var slot = l.row.querySelector('[data-hs2-redo]');
      var html = '';
      // both designs in the cart: each line says which it is (28 Oct)
      if (redone[l.id]) html = '<p class="hs2-redo__tag">First version</p><p>You made a new version of this gift. Keep the new one?</p><button type="button" class="hs2-redo__remove" data-hs2-redo-remove>Remove this version</button>';
      else if (l.of && here[l.of]) html = '<p class="hs2-redo__tag">New version</p>';
      else if (l.personal && l.quantity === 1 && /^[a-f0-9-]{36}$/i.test(l.id) && !l.of && link) {
        // the redo link is the product, the variant and the design id, nothing else the cart's
        // own link carries (a vendor customization_id or edit flag rode along before, 28 Oct)
        var u = null, variant = '', path = '';
        try { u = new URL(link.getAttribute('href') || '', location.href); path = (/^(?:\/[^/?#]+)*?\/products\/[^/?#]+/.exec(u.pathname) || [''])[0]; } catch (e) { path = ''; }
        try { variant = String((JSON.parse(l.row.getAttribute('data-hs2-cart-line') || '{}') || {}).variant_id || ''); } catch (e) { variant = ''; }
        if (!/^\d+$/.test(variant)) variant = (u && u.searchParams.get('variant')) || '';
        if (path) html = '<a href="' + path + '?' + (/^\d+$/.test(variant) ? 'variant=' + variant + '&' : '') + 'redo=' + l.id + '" data-hs2-redo-go>Not quite right? Make another version.</a><span>One redo per gift. Your design stays here until you choose.</span>';
      }
      if (!html) { if (slot) slot.remove(); return; }
      if (!slot) { slot = document.createElement('div'); slot.className = 'hs2-redo'; slot.setAttribute('data-hs2-redo', ''); host.appendChild(slot); }
      // a cart redraw can morph the slot back to the server's markup and keep the element, so the cache
      // holds only while the slot still shows what was drawn here
      if (slot.__html === html && slot.innerHTML === slot.__drawn) return;
      slot.__html = html; slot.innerHTML = html; slot.__drawn = slot.innerHTML;
      var remove = slot.querySelector('[data-hs2-redo-remove]');
      if (remove) remove.addEventListener('click', function () {
        var own = l.row.querySelector('.cart-items__remove');
        track('redo_remove_old', {});
        if (own && !own.hidden) own.click();
      });
      var go = slot.querySelector('[data-hs2-redo-go]');
      if (go) go.addEventListener('click', function () { track('redo_start', { from: 'cart' }); });
    });
  }
  /* The bundle in the cart (Krish, 27 Oct: 15% off two gifts, 20% off three), only while the memo
     strip's switch says the real discount exists: one gift gets the nudge, and two or more show
     the saving Shopify actually applied, read from /cart.js, never a computed promise. A gift is
     any line that is not an Artist's touch (linked by _hs_addon_for), never a match on its title.
     Every summary says it, the drawer's and the cart page's (N5), as the first line of its tax
     note (data-hs2-bundle-say, drawn by hs2.css), whose place is kept from first paint so Check
     out never moves when it arrives (28 Oct). */
  function bundleLine(rows) {
    if (!document.querySelector('[data-hs-bundle-live]') || !document.querySelector('.cart-totals__tax-note')) return;
    var show = function (say) {
      Array.prototype.forEach.call(document.querySelectorAll('.cart-totals__tax-note'), function (note) {
        if (note.getAttribute('data-hs2-bundle-say') !== say) note.setAttribute('data-hs2-bundle-say', say);
      });
    };
    // read /cart.js once per cart (its lines and quantities), not on every redraw: Teeinblue re-runs
    // its whole cart pass on each /cart.js request, and that pass redraws the cart again
    var seen = rows.map(function (row) {
      var q = row.querySelector('input[type="number"]');
      return row.getAttribute('data-key') + ':' + (q ? q.value : '');
    }).join('|');
    if (seen === bundleLine.seen) { if (!bundleLine.busy) show(bundleLine.say); return; }
    if (bundleLine.busy) return;
    bundleLine.busy = true;
    fetch(shopRoot() + 'cart.js', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (cart) {
      var gifts = (cart.items || []).filter(function (it) { return !(it.properties && it.properties._hs_addon_for); }).length;
      var saved = Number(cart.total_discount) || 0, say = '';
      if (gifts === 1) say = 'Add a second gift and save 15%. Three saves 20%.';
      else if (gifts > 1 && saved > 0) say = 'You are saving $' + (saved / 100).toFixed(2).replace(/\.00$/, '') + ' on ' + gifts + ' gifts.';
      bundleLine.seen = seen; bundleLine.say = say;
      show(say);
    }).catch(function () { /* the cart works without it */ }).then(function () {
      bundleLine.busy = false;
      // the cart may have changed while this was in flight; asks again only if it did
      bundleLine(Array.prototype.slice.call(document.querySelectorAll('.cart-items__table-row[data-key]')));
    });
  }
  /* Artist's touch (Krish, 27 Oct): a paid hand rework of one design, offered on each personalised
     cart line once the add-on product exists (memo strip setting). It goes in as its own line,
     linked by _hs_addon_for, with the buyer's notes, the 5 days it adds (a visible Delivery
     property, so checkout, the order and the packing slip say it too) and up to three tagged
     photos as file properties, for a person to read. Offered on the cart page only, in the place
     cart-products.liquid keeps for it (so nothing moves when it arrives); the drawer has none. */
  var ADDON_TAGS = ['Another photo of my dog', 'Favorite toy', 'Collar or accessory', 'Something else'];
  function artistTouch(rows) {
    var memo = document.querySelector('[data-hs-artist-variant]');
    // a kept place with nothing to put in it goes, rather than stay empty
    var unslot = function (row) { var slot = row.querySelector('[data-hs2-artist-slot]'); if (slot && !slot.querySelector('[data-hs2-artist]') && slot.parentNode) slot.parentNode.removeChild(slot); };
    if (!memo || !/^\/cart\/?$/.test(location.pathname)) { rows.forEach(unslot); return; }
    var variant = memo.getAttribute('data-hs-artist-variant'), price = memo.getAttribute('data-hs-artist-price') || '';
    var lines = [], taken = {}, gifts = {};
    // any line with a design is its gift, merged by the checkout transform or not (N4)
    rows.forEach(function (row) { var f = cartLineFacts(row); if (f) { f.row = row; lines.push(f); if (f.addonFor) taken[f.addonFor] = true; if (f.id) gifts[f.id] = true; } });
    // an add-on whose gift has left the cart (removed, or replaced by a redo) says so, so nobody
    // pays for a rework of a design they no longer have; removing it stays the buyer's tap
    lines.forEach(function (l) {
      if (!l.addonFor || gifts[l.addonFor] || l.row.querySelector('[data-hs2-artist-orphan]')) return;
      var host = cartOfferHost(l.row);
      if (!host) return;
      var note = document.createElement('p');
      note.className = 'hs2-artist__orphan'; note.setAttribute('data-hs2-artist-orphan', ''); note.setAttribute('role', 'status');
      note.textContent = 'The design this rework was for is no longer in your cart. Remove this line unless you meant to keep it.';
      host.appendChild(note);
    });
    lines.forEach(function (l) {
      var slot = l.row.querySelector('[data-hs2-artist-slot]');
      if (l.row.closest && l.row.closest('[data-drawer]')) { unslot(l.row); return; }
      if (!l.personal || !/^[a-f0-9-]{36}$/i.test(l.id) || taken[l.id]) { unslot(l.row); return; }
      if (l.row.querySelector('[data-hs2-artist]')) return;
      var host = slot || cartOfferHost(l.row);
      if (!host) return;
      var box = document.createElement('details');
      box.className = 'hs2-artist'; box.setAttribute('data-hs2-artist', '');
      // each photo starts on its own tag, so two never default to the same one; the file picker is a
      // labelled button that names the chosen photo, not the browser's "Choose File / No file chosen"
      var photo = function (i) {
        var tag = ADDON_TAGS[(i - 1) % ADDON_TAGS.length];
        return '<div class="hs2-artist__photo"><select aria-label="What photo ' + i + ' shows" data-hs2-artist-tag>' + ADDON_TAGS.map(function (t) { return '<option' + (t === tag ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
          '<label class="hs-file"><input type="file" accept="image/*" aria-label="Photo ' + i + '" data-hs2-artist-file><span class="hs-file__text" data-hs-file-text>Choose photo ' + i + '</span></label></div>';
      };
      box.innerHTML = '<summary>Want it reworked by hand? Artist\'s touch' + (price ? ', ' + price : '') + '. Adds 5\u00a0days.</summary>' +
        '<p>Our artist reworks this design by hand from your notes and photos, then a person checks it before it prints.</p>' +
        '<label>What should change?<textarea maxlength="500" rows="3" data-hs2-artist-notes></textarea></label>' + photo(1) + photo(2) + photo(3) +
        '<button type="button" data-hs2-artist-add>Add the artist\'s touch</button><p role="status" data-hs2-artist-status></p>';
      host.appendChild(box);
      box.querySelectorAll('[data-hs2-artist-file]').forEach(function (input, i) {
        input.addEventListener('change', function () {
          var text = input.parentNode && input.parentNode.querySelector('[data-hs-file-text]'), file = input.files && input.files[0];
          if (text) text.textContent = file ? file.name : 'Choose photo ' + (i + 1);
        });
      });
      box.querySelector('[data-hs2-artist-add]').addEventListener('click', function () {
        var btn = this, status = box.querySelector('[data-hs2-artist-status]');
        var notes = box.querySelector('[data-hs2-artist-notes]').value.trim();
        if (!notes) { status.textContent = 'Tell our artist what to change first.'; return; }
        var form = new FormData();
        form.append('id', variant); form.append('quantity', '1');
        form.append('properties[_hs_addon_for]', l.id);
        form.append('properties[What to change]', notes);
        form.append('properties[Delivery]', 'Adds 5 days');
        var n = 0;
        // "Photo 1 (favorite toy)": the cart adds its own colon after the name, so none inside it (A9e)
        box.querySelectorAll('.hs2-artist__photo').forEach(function (p) {
          var file = p.querySelector('[data-hs2-artist-file]').files[0];
          if (file) { n++; form.append('properties[Photo ' + n + ' (' + p.querySelector('[data-hs2-artist-tag]').value.toLowerCase() + ')]', file); }
        });
        btn.disabled = true; status.textContent = 'Adding it to your cart.';
        track('artist_touch_add', { photos: n });
        fetch(shopRoot() + 'cart/add.js', { method: 'POST', body: form, credentials: 'same-origin', headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error('add ' + r.status); return r.json(); })
          .then(function () { status.textContent = 'Added. Our artist will be in touch if anything is unclear.'; location.reload(); })
          .catch(function () { btn.disabled = false; status.textContent = 'That did not go through. Your gift is unchanged; try again, or leave out a large photo.'; });
      });
    });
  }
  // arriving from "Make another version": the new design carries the id of the one it replaces
  function redoMode() {
    if (redoMode.done) return;
    redoMode.done = true;
    var id = '';
    try { id = new URLSearchParams(window.location.search).get('redo') || ''; } catch (e) { id = ''; }
    var form = document.getElementById('hs2-product-form');
    if (!nativeArtworkPurchase() || !form || !/^[a-f0-9-]{36}$/i.test(id)) return;
    var inp = document.createElement('input');
    // data-hs2-prop: hsProps() copies only marked inputs into Teeinblue's add request
    inp.type = 'hidden'; inp.name = 'properties[_hs_redo_of]'; inp.value = id; inp.setAttribute('data-hs2-prop', '');
    form.appendChild(inp);
    redoMode.id = id;
    onCartAdd.redo = id; // the add wrapper refuses to send this first design again
    // the one new upload this redo allows, still started by the buyer's click. Once per redo in a
    // tab: a reload used to throw away the new painting and ask for another paid one (28 Oct)
    var once = 'hs2-redo:' + productId() + ':' + id, fresh = true;
    try { fresh = !window.sessionStorage.getItem(once); window.sessionStorage.setItem(once, '1'); } catch (e) { fresh = true; }
    if (fresh) resetBlanketUpload();
    journeyCard();
    // An add is not proof the new version landed (28 Oct, order #1008 kept only the first design).
    // The cart is read back: a line naming this redo with a different design confirms it.
    onCartAdd(function () {
      if (!redoMode.id) return;
      fetch(shopRoot() + 'cart.js', { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('cart ' + r.status); return r.json(); })
        .then(function (cart) {
          var landed = (cart.items || []).some(function (it) {
            var of = '', design = '';
            [it.properties || {}].concat((it.item_components || []).map(function (c) { return c.properties || {}; })).forEach(function (p) { of = of || p._hs_redo_of || ''; design = design || p._customization_id || ''; });
            return of === id && !!design && design !== id;
          });
          if (!landed) { checkoutImageStatus('Your new version did not reach your cart. Your first design is still there.'); return; }
          if (inp.parentNode) inp.parentNode.removeChild(inp);
          redoMode.id = ''; onCartAdd.redo = ''; redoMode.landed = true;
          showNext.held = false;
          showNext('Your new version is in your cart.', 'Choose which one to keep.', shopRoot() + 'cart', 'Choose in cart');
          showNext.held = true; // this, not the usual added bar, is the one to read
          journeyCard();
        })
        .catch(function () { /* the cart page still shows both designs */ });
    });
  }
  /* Their toy or collar on the product page (Krish, 28 Oct). The words are the chat's own toy and
     accessory facts, so they reach the painting the same way; changing them asks for a new
     painting like any other change. Words the chat already has show as one line with a way to
     change them, not as the question again. The facts the painter reads are tidied (Krish, 28 Oct,
     HSArtworkProfile.tidy when it is there); the chat keeps the words as typed.
     The Artist's touch is a choice the buyer makes in so many words (28 Oct: one tap on a sentence
     added it, with no price shown and no way off): "Add our artist's touch, $29", then "Added.
     Remove". When on, it goes in right after the gift, linked to its design, with the notes, the
     5 days it adds and the photos (extrasAfterAdd). */
  function bindExtras() {
    var box = document.querySelector('[data-hs-extras]');
    if (!box || !nativeArtworkPurchase() || !window.HSArtworkProfile) return;
    box.hidden = false;
    var profile = window.HSArtworkProfile;
    var tidy = function (text) {
      if (typeof profile.tidy !== 'function') return text;
      try { var out = profile.tidy(text); return typeof out === 'string' ? out : text; } catch (e) { return text; }
    };
    var facts = function () { try { return JSON.parse(artworkFacts()).facts; } catch (e) { return []; } };
    var inputs = box.querySelectorAll('[data-hs-extra]');
    var summary = box.querySelector('[data-hs-extras-summary]'), said = box.querySelector('[data-hs-extras-said]'), ask = box.querySelector('[data-hs-extras-ask]');
    var told = function () { return facts().filter(function (f) { return f.source === 'toy' || f.source === 'accessory'; }).map(function (f) { return f.text; }).filter(Boolean); };
    var fold = function (shut) {
      if (!summary || !ask) return;
      var have = told();
      shut = shut && have.length > 0;
      summary.hidden = !shut; ask.hidden = shut;
      if (said) said.textContent = have.join(' · ');
    };
    inputs.forEach(function (input) {
      var source = input.getAttribute('data-hs-extra'), had = facts().filter(function (f) { return f.source === source; })[0];
      input.value = had ? had.text : '';
      var persistWords = function () {
        var typed = input.value.replace(/\s+/g, ' ').trim().slice(0, 80), text = typed ? tidy(typed).slice(0, 80) : '';
        var existing = facts().filter(function (f) { return f.source === source; })[0];
        if ((existing ? existing.text : '') === text) return;
        var now = facts().filter(function (f) { return f.source !== source; });
        if (text) now.push({ source: source, text: text });
        state.hs3_art_profile = { version: 1, facts: now };
        save();
        try { var chat = JSON.parse(window.sessionStorage.getItem('hs3-gift') || '{}'); chat[source] = typed; window.sessionStorage.setItem('hs3-gift', JSON.stringify(chat)); } catch (e) { /* this page keeps it */ }
        invalidateBlanketReview(); artworkChoicesChanged(); journeyCard(); updateBlanketPurchaseStatus();
        if (said) said.textContent = told().join(' · ');
        track('extras_words', { source: source, filled: !!text });
      };
      input.addEventListener('input', persistWords);
      input.addEventListener('change', persistWords);
    });
    fold(true);
    var change = box.querySelector('[data-hs-extras-change]');
    if (change) change.addEventListener('click', function () {
      fold(false);
      if (inputs[0] && inputs[0].focus) inputs[0].focus();
    });
    var memo = document.querySelector('[data-hs-artist-variant]'), artist = box.querySelector('[data-hs-extras-artist]');
    if (!memo || !artist) return;
    artist.hidden = false;
    var price = artist.querySelector('[data-hs-extras-price]');
    if (price) price.textContent = memo.getAttribute('data-hs-artist-price') || '';
    var offer = artist.querySelector('[data-hs-extras-offer]'), on = artist.querySelector('[data-hs-extras-on]');
    var add = artist.querySelector('[data-hs-extras-add]'), remove = artist.querySelector('[data-hs-extras-remove]');
    var choose = function (yes) {
      artist.setAttribute('data-hs-extras-state', yes ? 'on' : 'off');
      if (offer) offer.hidden = yes;
      if (on) on.hidden = !yes;
    };
    choose(false);
    if (add) add.addEventListener('click', function () {
      choose(true);
      track('artist_touch_on', {});
      if (remove && remove.focus) remove.focus();
    });
    if (remove) remove.addEventListener('click', function () {
      choose(false);
      track('artist_touch_off', {});
      if (add && add.focus) add.focus();
    });
    // the file picker is a labelled button that names the chosen photo
    Array.prototype.forEach.call(artist.querySelectorAll('[data-hs-extras-file]'), function (input, i) {
      input.addEventListener('change', function () {
        var text = input.parentNode && input.parentNode.querySelector('[data-hs-file-text]'), file = input.files && input.files[0];
        if (text) text.textContent = file ? file.name : 'Choose photo ' + (i + 1);
      });
    });
    onCartAdd(extrasAfterAdd);
    // While its photos upload, another Add to cart would add the gift and the touch again (28 Oct
    // review): the tap is held, and said so beside the button. Runs before guardGiftPhoto's check.
    document.addEventListener('click', function (e) {
      if (!extrasAfterAdd.busy || !e.target || !e.target.closest || !e.target.closest('#teeAtcButton, .tee-btn--atc, [data-hs2-add]')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      checkoutImageStatus("One moment. Adding our artist's touch.");
    }, true);
  }
  /* After the gift's add: when the buyer chose the Artist's touch, its line goes in right after the
     gift. announceAdd waits for it (extrasAfterAdd.pending), so the drawer opens once, on both. Until
     it lands (extrasAfterAdd.busy) its words show beside Add to cart too, where the buyer is looking:
     the gift's own line has cleared and the drawer waits, so nothing else said the gift went in. */
  function extrasAfterAdd(items) {
    var artist = document.querySelector('[data-hs-extras-artist]'), memo = document.querySelector('[data-hs-artist-variant]');
    if (!artist || artist.hidden || !memo || artist.getAttribute('data-hs-extras-state') !== 'on' || extrasAfterAdd.sending) return;
    var notes = artist.querySelector('[data-hs-extras-notes]'), status = artist.querySelector('[data-hs-extras-status]');
    var photos = Array.prototype.filter.call(artist.querySelectorAll('.hs-extras__photo'), function (p) { var f = p.querySelector('[data-hs-extras-file]'); return f && f.files && f.files[0]; });
    var words = [];
    try { words = JSON.parse(artworkFacts()).facts.filter(function (f) { return f.source === 'toy' || f.source === 'accessory'; }).map(function (f) { return f.text; }).filter(Boolean); } catch (e) { words = []; }
    var what = notes.value.trim() || (photos.length ? 'Paint in the toy or collar from my photos.' : words.length ? 'Paint in by hand: ' + words.join(', ') + '.' : '');
    if (!what) { status.textContent = 'Your gift is in your cart. Tell our artist what to change, then add the artist\'s touch from your cart page.'; return; }
    var gift = (items || []).filter(function (it) { return it && it.properties && /^[a-f0-9-]{36}$/i.test(it.properties._customization_id || ''); })[0];
    if (!gift) { status.textContent = 'Your gift is in your cart. Add the artist\'s touch from your cart page.'; return; }
    var form = new FormData();
    form.append('id', memo.getAttribute('data-hs-artist-variant')); form.append('quantity', '1');
    form.append('properties[_hs_addon_for]', gift.properties._customization_id);
    form.append('properties[What to change]', what);
    form.append('properties[Delivery]', 'Adds 5 days');
    // "Photo 1 (favorite toy)": the cart adds its own colon after the name, so none inside it (A9e)
    photos.forEach(function (p, i) { form.append('properties[Photo ' + (i + 1) + ' (' + p.querySelector('[data-hs-extras-tag]').value.toLowerCase() + ')]', p.querySelector('[data-hs-extras-file]').files[0]); });
    status.textContent = photos.length ? 'Sending your photos to our artist.' : 'Adding our artist\'s touch.';
    checkoutImageStatus(status.textContent);
    track('artist_touch_add', { photos: photos.length, from: 'product' });
    // the add-on has no design of its own, so it skips the checkout-image preparation every gift add goes through
    var sent = (onCartAdd.fetch0 || window.fetch).call(window, shopRoot() + 'cart/add.js', { method: 'POST', body: form, credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('add ' + r.status); return r.json(); })
      .then(function (added) {
        clearTimeout(lift); extrasAfterAdd.busy = extrasAfterAdd.sending = false;
        notes.value = '';
        photos.forEach(function (p) {
          var input = p.querySelector('[data-hs-extras-file]'), text = input.parentNode && input.parentNode.querySelector('[data-hs-file-text]');
          input.value = '';
          if (text) text.textContent = text.getAttribute('data-hs-file-empty') || text.textContent;
        });
        // it is in the cart now: the next gift asks again
        artist.setAttribute('data-hs-extras-state', 'off');
        var offer = artist.querySelector('[data-hs-extras-offer]'), on = artist.querySelector('[data-hs-extras-on]');
        if (offer) offer.hidden = false;
        if (on) on.hidden = true;
        status.textContent = 'Added. Our artist will paint it in by hand, and a person checks it before it prints.';
        checkoutImageStatus(''); // the drawer opens next, on both lines, and is the confirmation
        // the gift's own announcement waits for this one; a page without it still tells the drawer
        if (!confirmAdds.done) announceAdd([added]);
        return true;
      })
      .catch(function () {
        clearTimeout(lift); extrasAfterAdd.busy = extrasAfterAdd.sending = false;
        status.textContent = 'Your gift is in your cart, but the artist\'s touch did not go through. Add it from your cart page, or leave out a large photo.';
        checkoutImageStatus(status.textContent);
        return false;
      });
    extrasAfterAdd.busy = extrasAfterAdd.sending = true; // set once the request is on its way; it settles either way
    // a request that never settles must not hold every later Add to cart (28 Oct review): the hold
    // lifts after a minute, and the touch is still never sent twice, since sending lasts until it settles
    var lift = setTimeout(function () { extrasAfterAdd.busy = false; }, extrasAfterAdd.holdMs || 60000);
    extrasAfterAdd.pending = sent;
    return sent;
  }
  function cartTidy() {
    var run = function () {
      var rows = document.querySelectorAll('.cart-items__table-row[data-key]');
      if (!rows.length && !document.querySelector('.cart-totals__tax-note')) return;
      var need = false;
      rows.forEach(function (row) {
        var link = row.querySelector('a[href*="/products/"]');
        var framed = !!link && /framed/i.test(link.getAttribute('href') || '');
        // the portrait: its first option says Framed or Unframed, and a framed one's color is the frame
        var rowFramed = Array.prototype.some.call(row.querySelectorAll('.cart-items__variant dd'), function (dd) { return /^framed[,\s ]*$/i.test(dd.textContent.trim()); });
        row.querySelectorAll('.cart-items__variant').forEach(function (v) {
          var dt = v.querySelector('dt'), dd = v.querySelector('dd');
          if (!dt || !dd || v.__hs2) return; v.__hs2 = true;
          var name = norm(dt.textContent), value = dd.textContent.replace(/[,\s ]+$/, '').trim();
          var format = name === 'available product' && /^(framed|unframed)$/i.test(value);
          if ((name === 'available product' && !format) || CART_DROP_VALUES.test(value)) { v.hidden = true; return; }
          var nice = format ? 'Format' : name === 'color' && (framed || rowFramed) ? 'Frame' : dt.textContent.replace(/:\s*$/, '').trim();
          dt.classList.remove('visually-hidden');
          dt.textContent = nice + ':';
          dd.textContent = value;
          v.classList.add('hs2-cart-opt');
        });
        row.querySelectorAll('.cart-items__property').forEach(function (p) {
          var dt = p.querySelector('dt');
          if (dt && CART_DROP_PROPS.test(norm(dt.textContent))) p.hidden = true;
        });
        var key = row.getAttribute('data-key'), snapshot = row.getAttribute('data-hs2-cart-line');
        if (snapshot !== null) {
          var current = null;
          try { current = JSON.parse(snapshot); } catch (e) {}
          cartPicture(row, current && current.key === key ? cartArtworkImage(current) : '');
          return;
        }
        if (cartImages[key]) cartPicture(row, cartImages[key]);
        else if (!(key in cartImages)) need = true;
      });
      redoOffers(Array.prototype.slice.call(rows));
      artistTouch(Array.prototype.slice.call(rows));
      bundleLine(Array.prototype.slice.call(rows));
      document.querySelectorAll('.cart-totals__tax-note small, .cart-totals__tax-note').forEach(function (n) {
        if (n.tagName !== 'SMALL' && n.querySelector('small')) return;
        var want = 'Free US shipping on every order. Any tax is shown at checkout.';
        if (n.textContent.trim() !== want) n.textContent = want;
        // hs-brand.css keeps Helio's "calculated at checkout" hidden until this line replaces it
        var box = n.closest ? n.closest('.cart-totals__tax-note') : null;
        if (box && !box.hasAttribute('data-hs-note')) box.setAttribute('data-hs-note', '');
      });
      if (need && !cartTidy.busy) {
        cartTidy.busy = true;
        fetch((window.Shopify && window.Shopify.routes && window.Shopify.routes.root || '/') + 'cart.js', { credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (cart) {
            (cart.items || []).forEach(function (it) {
              cartImages[it.key] = cartArtworkImage(it);
            });
          })
          .catch(function () {})
          .then(function () { cartTidy.busy = false; run(); });
      }
    };
    run();
    if ('MutationObserver' in window && !cartTidy.mo) {
      var queued = false;
      // only changes inside the cart wake this up; the personalizer on a product page redraws
      // constantly, and every needless pass was another chance to fight over the thumbnail
      var CART = '.cart-items__table-row, .cart-totals, .cart-items__media';
      var touches = function (n) {
        var el = n && (n.nodeType === 1 ? n : n.parentElement);
        return !!el && (!!el.closest(CART) || (n.nodeType === 1 && !!el.querySelector(CART)));
      };
      cartTidy.mo = new MutationObserver(function (records) {
        if (queued || !records.some(function (r) { return touches(r.target) || Array.prototype.some.call(r.addedNodes, touches); })) return;
        queued = true;
        setTimeout(function () { queued = false; run(); }, 60);
      });
      cartTidy.mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }
  // the server already drew the design (cart-products.liquid); Teeinblue may still be rendering its
  // copy just after a generation, so a design that fails to load is asked for again, 6 times at most
  function cartDesignRetry(img) {
    if (img.__hs2Retry) return;
    img.__hs2Retry = 0;
    var again = function () {
      if (img.complete && img.naturalWidth) return;
      if (++img.__hs2Retry > 6 || !/^\/\/cdn\.teeinblue\.com\/customizations\//.test(img.getAttribute('src') || '')) return;
      setTimeout(function () { img.src = img.getAttribute('src').split('?')[0] + '?v=' + Date.now(); }, 3500);
    };
    img.addEventListener('error', again);
    if (img.complete && !img.naturalWidth) again();
  }
  function cartPicture(row, url) {
    var designed = row.querySelector('.cart-items__media img[data-hs2-design]');
    if (designed) { cartDesignRetry(designed); return; }
    // one owner per thumbnail: a cell Teeinblue's own widget already holds is left to it
    if (row.querySelector('.cart-items__media .tee-customization-image, .cart-items__media .tee-cart-thumbnail')) return;
    var img = row.querySelector('.cart-items__media img');
    if (!img) return;
    if (!url) {
      if (img.__hs2Original) {
        img.src = img.__hs2Original.src;
        if (img.__hs2Original.srcset) img.setAttribute('srcset', img.__hs2Original.srcset);
        else img.removeAttribute('srcset');
        if (img.__hs2Original.alt !== null) img.setAttribute('alt', img.__hs2Original.alt);
        else img.removeAttribute('alt');
        img.removeAttribute('data-hs2-src'); img.classList.remove('hs2-cart-preview');
        delete img.__hs2Original;
      }
      return;
    }
    if (img.getAttribute('data-hs2-src') === url) return;
    if (!img.__hs2Original) img.__hs2Original = {src: img.getAttribute('src'), srcset: img.getAttribute('srcset'), alt: img.getAttribute('alt')};
    img.setAttribute('data-hs2-src', url);
    img.src = url; img.removeAttribute('srcset');
    img.setAttribute('alt', 'Your personalized artwork');
    img.classList.add('hs2-cart-preview');
  }

  /* Helio can lay its header over the first section (a transparent header). When it
     does, push the hero down by the overlap so the stamp and headline never sit under
     the logo or menu. Turning the overlay off in Helio's header settings also fixes it. */
  function clearHeader() {
    // whichever of ours opens the page: the hero on the homepage and landing, the buy box on a product page
    var hero = document.querySelector('[data-hs2-hero]') || document.querySelector('[data-hs3]') || document.querySelector('.hs2-product');
    var header = document.querySelector('.header-section, header.shopify-section');
    if (!hero || !header || window.scrollY > 10) return;
    var box = hero.closest('.shopify-section') || hero;
    // a box's own padding never moves its top edge, so measure without clearing it first: the
    // clear-then-pad used to make the page jump on every resize and load (27 Oct)
    var top = box.getBoundingClientRect().top;
    /* The drawn header can extend past its section box (Helio draws the row as an overlay, so
       the section measures 0 px). Measure the row itself, never what hangs off it: walking every
       element inside the header counted menus and overlays, and on Krish's screen (19 Oct) pushed
       the chat down a grey band of about 135 px, or a whole screen. */
    var bottom = header.getBoundingClientRect().bottom;
    var rows = header.querySelectorAll('header-component, .header__row, .header__underlay');
    if (!rows.length) rows = header.querySelectorAll('header, .header');
    Array.prototype.forEach.call(rows, function (el) {
      var r = el.getBoundingClientRect();
      if (r.width && r.height) bottom = Math.max(bottom, r.bottom);
    });
    bottom = Math.min(bottom, top + 200); // never more than a header can be tall
    var overlap = bottom - top, want = overlap > 0 ? Math.ceil(overlap + 12) : 0;
    // write only a real change (more than 1 px), so a repeat measurement never shifts the page
    if (Math.abs(want - (parseFloat(box.style.paddingTop) || 0)) > 1) box.style.paddingTop = want ? want + 'px' : '';
    // a sticky gallery has to stop below the same line, or it slides back under the logo on scroll
    var de = document.documentElement, clear = Math.max(0, Math.ceil(bottom));
    if (Math.abs(clear - (parseFloat(de.style.getPropertyValue('--hs2-clear')) || 0)) > 1) de.style.setProperty('--hs2-clear', clear + 'px');
  }

  /* =================================================================== screens
     Every section is one screen tall (hs2.css). The script supplies what CSS can't
     know: where the hero starts under Helio's header, how far to scale the poster,
     how many FAQ tickets fit, and whether the memo needs to scroll as a ticker. */
  function stickyHead() {
    var h = 0;
    document.querySelectorAll('#header-group > .shopify-section, .shopify-section-group-header-group').forEach(function (sec) {
      if (sec.classList.contains('hs2-section')) return;
      var cs = window.getComputedStyle(sec);
      if (cs.display === 'none' || (cs.position !== 'sticky' && cs.position !== 'fixed')) return;
      var inner = sec.querySelector('header-component, header, .header') || sec;
      h = Math.max(h, Math.round(inner.getBoundingClientRect().height));
    });
    document.documentElement.style.setProperty('--hs2-head', h + 'px');
    return h;
  }
  function heroTop() {
    var hero = document.querySelector('[data-hs2-hero]');
    if (!hero) return;
    var top = Math.max(0, Math.round(hero.getBoundingClientRect().top + window.scrollY));
    document.documentElement.style.setProperty('--hs2-hero-top', top + 'px');
  }
  function fitPoster() {
    var stage = document.querySelector('[data-hs2-stage]'), box = document.querySelector('[data-hs2-poster-box]');
    if (!stage || !box) return;
    var review = stage.closest('.hs2-review');
    var zoomed = review && review.classList.contains('is-zoomed');
    var w = zoomed ? window.innerWidth - 24 : stage.clientWidth;
    var h = zoomed ? window.innerHeight - 80 : stage.clientHeight;
    var nh = box.offsetHeight || 640;
    var sc = Math.min((w - 16) / 480, (h - (zoomed ? 0 : 44)) / (nh + 30));
    sc = Math.max(0.18, Math.min(zoomed ? 1.5 : 1, sc));
    box.style.setProperty('--hs2-scale', sc.toFixed(3));
  }
  function zoom() {
    var review = document.querySelector('[data-hs2-review]');
    if (!review || review.__hs2z) return; review.__hs2z = true;
    var open = function () {
      review.classList.add('is-zoomed'); document.documentElement.style.overflow = 'hidden'; fitPoster();
      var c = review.querySelector('[data-hs2-zoom-close]'); if (c) c.focus();
    };
    var close = function () {
      review.classList.remove('is-zoomed'); document.documentElement.style.overflow = ''; fitPoster();
      var z = review.querySelector('[data-hs2-zoom]'); if (z && z.offsetParent) z.focus();
    };
    var z = review.querySelector('[data-hs2-zoom]'), c = review.querySelector('[data-hs2-zoom-close]'), stage = review.querySelector('[data-hs2-stage]');
    if (z) z.addEventListener('click', open);
    if (c) c.addEventListener('click', close);
    if (stage) stage.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      if (review.classList.contains('is-zoomed')) close(); else if (z && z.offsetParent) open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && review.classList.contains('is-zoomed')) close(); });
  }
  function ticker() {
    document.querySelectorAll('[data-hs2-memo]').forEach(function (bar) {
      var track = bar.querySelector('[data-hs2-ticker]'), vp = bar.querySelector('.hs2-memo__viewport');
      if (!track || !vp) return;
      bar.classList.remove('is-ticker');
      track.querySelectorAll('.is-clone').forEach(function (c) { c.remove(); });
      var item = track.querySelector('.hs2-memo__item');
      if (!item || reduced) return;
      item.style.whiteSpace = 'nowrap'; item.style.display = 'inline-block';
      var w = item.getBoundingClientRect().width;
      item.style.whiteSpace = ''; item.style.display = '';
      if (w <= vp.clientWidth - 32) return;
      var clone = item.cloneNode(true);
      clone.classList.add('is-clone'); clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      bar.classList.add('is-ticker');
      bar.style.setProperty('--ticker-s', Math.max(16, Math.round((w + 64) / 42)) + 's');
    });
  }
  function fitFaq() {
    var list = document.querySelector('[data-hs2-faq]');
    if (!list || list.__hs2open) return;
    var sec = list.closest('.hs2-faq'), more = list.querySelector('[data-hs2-faq-more]');
    var tickets = Array.prototype.slice.call(list.querySelectorAll('.hs2-ticket'));
    tickets.forEach(function (t) { t.classList.remove('is-folded'); });
    if (more) more.hidden = true;
    if (!sec || !more) return;
    var room = window.innerHeight - (stickyHead.h || 0) + 2, shown = tickets.length;
    if (sec.offsetHeight <= room) return;
    more.hidden = false;
    while (sec.offsetHeight > room && shown > 2) {
      shown--;
      if (tickets[shown].open) { shown++; break; }
      tickets[shown].classList.add('is-folded');
      more.querySelector('[data-hs2-faq-more-n]').textContent = tickets.length - shown;
    }
    if (shown === tickets.length) more.hidden = true;
  }
  function faq() {
    var list = document.querySelector('[data-hs2-faq]');
    if (!list || list.__hs2) return; list.__hs2 = true;
    var tickets = Array.prototype.slice.call(list.querySelectorAll('.hs2-ticket'));
    tickets.forEach(function (t) {
      t.addEventListener('toggle', function () {
        if (!t.open) return;
        tickets.forEach(function (o) { if (o !== t && o.open) o.open = false; });
        track('faq_open', { question: (t.querySelector('.hs2-ticket__q') || {}).textContent || '' });
      });
    });
    var more = list.querySelector('[data-hs2-faq-more]');
    if (more) more.addEventListener('click', function () {
      list.__hs2open = true;
      tickets.forEach(function (t) { t.classList.remove('is-folded'); });
      more.hidden = true;
    });
  }

  /* ===================================================================== motion */
  function reveal() {
    var els = document.querySelectorAll('[data-hs2-reveal]:not(.is-in)');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    if (!reveal.io) {
      reveal.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); reveal.io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
      reveal.drift = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-on', en.isIntersecting); });
      });
    }
    els.forEach(function (e) { reveal.io.observe(e); });
    document.querySelectorAll('.hs2-anim-drift').forEach(function (e) { reveal.drift.observe(e); });
  }
  function inkName() {
    if (reduced) return;
    clearTimeout(inkName.t);
    inkName.t = setTimeout(function () {
      document.querySelectorAll('.hs2-hero h1 [data-hs2="dog"], .hs2-hero h1 [data-hs2="yourdog"]').forEach(function (el) {
        el.classList.remove('is-inked'); void el.offsetWidth; el.classList.add('is-inked');
      });
    }, 250);
  }
  function cycleNames() {
    var inp = document.querySelector('[data-hs2-cycle]');
    if (!inp || reduced || state.dog) return;
    var names = inp.getAttribute('data-hs2-cycle').split(','), i = 1, ch = 0, del = false, timer, stopped = false;
    var stop = function () { stopped = true; clearTimeout(timer); inp.placeholder = names[0]; };
    inp.addEventListener('focus', stop);
    inp.addEventListener('input', stop);
    function step() {
      if (stopped || inp.value) return;
      var n = names[i];
      if (!del) {
        ch++; inp.placeholder = n.slice(0, ch);
        if (ch >= n.length) { del = true; timer = setTimeout(step, 1500); return; }
      } else {
        ch--; inp.placeholder = n.slice(0, Math.max(ch, 0));
        if (ch <= 0) { del = false; i = (i + 1) % names.length; }
      }
      timer = setTimeout(step, del ? 45 : 95);
    }
    timer = setTimeout(function () { del = true; ch = names[0].length; i = 0; step(); }, 2600);
  }

  /* ====================================================== the review, one step at a time */
  function steps() {
    var box = document.querySelector('[data-hs2-steps]');
    steps.auto = steps.auto || {};
    if (!box || box.__hs2) return; box.__hs2 = true;
    var all = box.querySelectorAll('[data-hs2-step]'), n = all.length;
    all.forEach(function (st) { st.setAttribute('tabindex', '-1'); });
    function go(k, focus) {
      clearTimeout(steps.timer); // a pending chip auto-advance must never skip a step
      k = Math.max(1, Math.min(n, k));
      var back = k < (steps.at || 1);
      steps.at = k;
      all.forEach(function (st) {
        var on = Number(st.getAttribute('data-hs2-step')) === k;
        st.classList.toggle('is-on', on);
        st.classList.toggle('is-back', on && back);
      });
      box.querySelectorAll('[data-hs2-step-go]').forEach(function (b) {
        var i = Number(b.getAttribute('data-hs2-step-go'));
        b.classList.toggle('is-done', i < k);
        if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var no = box.querySelector('[data-hs2-step-no]'); if (no) no.textContent = k;
      var bk = box.querySelector('[data-hs2-step-back]'); if (bk) bk.disabled = k === 1;
      var nx = box.querySelector('[data-hs2-step-next]'); if (nx) nx.hidden = k === n;
      if (focus) { var cur = box.querySelector('.hs2-step.is-on'); if (cur) cur.focus({ preventScroll: true }); }
      fitPoster();
      track('review_step', { step: k });
    }
    steps.go = go;
    var nx = box.querySelector('[data-hs2-step-next]'), bk = box.querySelector('[data-hs2-step-back]');
    if (nx) nx.addEventListener('click', function () { go(steps.at + 1, true); });
    if (bk) bk.addEventListener('click', function () { go(steps.at - 1, true); });
    box.querySelectorAll('[data-hs2-step-go]').forEach(function (b) {
      b.addEventListener('click', function () { go(Number(b.getAttribute('data-hs2-step-go')), true); });
    });
    // step 1's "Skip to the photo": the picks keep their starting answers
    box.querySelectorAll('[data-hs2-step-skip]').forEach(function (b) {
      b.addEventListener('click', function () { go(n, true); });
    });
    box.querySelectorAll('[data-hs2-step="1"] input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(steps.at + 1, true); } });
    });
    go(1);
  }
  /* Both names print on the poster, so Approve waits for them. It takes the shopper back
     to step 1, opens the dog's name there if the hero was skipped, and says what HR needs. */
  function askNames(a) {
    var review = a.closest('.hs2-review') || document;
    var box = review.querySelector('[data-hs2-steps]'), nudge = review.querySelector('[data-hs2-names-nudge]');
    if (!box || !steps.go) return false;
    var missing = missingNames();
    var ask = review.querySelector('[data-hs2-ask="dog"]');
    if (ask && missing.indexOf('dog') !== -1) ask.hidden = false;
    steps.go(1);
    if (nudge) {
      nudge.textContent = nudge.getAttribute(missing.length > 1 ? 'data-both' : 'data-' + missing[0]) || '';
      nudge.hidden = false;
      nudge.classList.remove('is-new'); void nudge.offsetWidth; nudge.classList.add('is-new');
    }
    var first = box.querySelector('[data-hs2-step="1"] [data-hs2-input="' + missing[0] + '"]');
    if (first) {
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      first.focus({ preventScroll: true });
    }
    track('names_needed', { missing: missing.join(',') });
    return true;
  }
  /* Approve: the stamp lands on the poster, then the shopper moves on */
  function approve() {
    document.querySelectorAll('[data-hs2-approve]').forEach(function (a) {
      if (a.__hs2a) return; a.__hs2a = true;
      a.addEventListener('click', function (e) {
        if (missingNames().length && askNames(a)) { e.preventDefault(); return; }
        track('approve_clicked', { dog: val('dog') });
        var review = a.closest('.hs2-review'), stampEl = review && review.querySelector('.hs2-poster__approved');
        var href = a.getAttribute('href') || '';
        if (reduced || !stampEl || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        review.classList.add('is-approving');
        stampEl.classList.remove('is-slam'); void stampEl.offsetWidth; stampEl.classList.add('is-slam');
        setTimeout(function () {
          review.classList.remove('is-approving');
          if (href.charAt(0) === '#') {
            var t = document.querySelector(href);
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.location.href = a.href;
          }
        }, 800);
      });
    });
  }

  /* ===================================================== honest urgency
     Every countdown counts to a real date: Christmas morning, or the confirmed last
     order date once it is entered in the memo bar's settings. The free video offer
     shows only inside its dates (docs/V2-FROM-THE-DOG.md section 4). Nothing resets,
     nothing invents stock. ?hs2_now=YYYY-MM-DD previews another day. */
  var DAY = 864e5;
  function parseISO(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || '').trim());
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function endOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
  function now() {
    var q = null;
    try { q = parseISO(new URLSearchParams(window.location.search).get('hs2_now')); } catch (e) { q = null; }
    if (!q) return new Date();
    var t = new Date(); q.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
    return q;
  }
  function config() {
    var m = document.querySelector('[data-hs2-memo]');
    if (!m) return {};
    return {
      deadline: parseISO(m.getAttribute('data-deadline')),
      offerStart: parseISO(m.getAttribute('data-offer-start')),
      offerEnd: parseISO(m.getAttribute('data-offer-end')),
      offerText: (m.getAttribute('data-offer-label') || '').trim()
    };
  }
  function offerLabel() {
    // the offer is the read-aloud video: with its button switched off (hs2-review), no line
    // on any page mentions it
    if (!document.querySelector('[data-hs2-voice]')) return '';
    var c = config(), t = now();
    return c.offerStart && c.offerEnd && c.offerText && t >= c.offerStart && t <= endOfDay(c.offerEnd) ? c.offerText : '';
  }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function timeline() {
    var t = now(), c = config();
    var xmas = new Date(t.getFullYear(), 11, 25);
    var out = { now: t };
    if (c.deadline && t <= endOfDay(c.deadline)) { out.deadline = endOfDay(c.deadline); out.dl = Math.ceil((out.deadline - t) / DAY); }
    if (t < xmas) { out.xmas = xmas; out.xd = Math.floor((xmas - t) / DAY); }
    return out;
  }
  function countdownText(kind) {
    var tl = timeline(), offer = offerLabel(), parts = [];
    var dl = tl.dl, xd = tl.xd;
    var xmasLine = tl.xmas ? (xd < 1 ? 'Christmas morning is tomorrow' : 'Christmas morning in ' + plural(xd, 'day')) : '';
    var lead = dl ? (dl <= 1 ? 'Last day to order for Christmas' : plural(dl, 'day') + ' left to order for Christmas') : xmasLine;
    if (kind === 'memo') return dl ? (dl <= 1 ? 'Last day' : plural(dl, 'day') + ' left') : lead;
    if (kind === 'sub') return dl ? (dl <= 1 ? 'Last day to order for Christmas' : 'Order within ' + plural(dl, 'day') + ' for Christmas') : lead;
    if (kind === 'buy' || kind === 'product') {
      if (offer) parts.push('Read-aloud video ' + offer.charAt(0).toLowerCase() + offer.slice(1));
      if (lead) parts.push(lead);
      return parts.join(' · ');
    }
    return lead;
  }
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function parseLoose(text, year) {
    var s = String(text || '').trim().toLowerCase();
    if (!s || s.indexOf('[') !== -1) return null;
    if (s === 'christmas eve') return new Date(year, 11, 24);
    var iso = parseISO(s); if (iso) return iso;
    var m = /([a-z]{3})[a-z]*\.?\s+(\d{1,2})/.exec(s) || null, d, mo;
    if (m) { mo = MONTHS.indexOf(m[1]); d = Number(m[2]); }
    else { m = /(\d{1,2})\s+([a-z]{3})/.exec(s); if (m) { d = Number(m[1]); mo = MONTHS.indexOf(m[2]); } }
    return m && mo > -1 ? new Date(year, mo, d) : null;
  }
  function urgency() {
    var tl = timeline();
    document.querySelectorAll('[data-hs2-countdown]').forEach(function (el) {
      var txt = countdownText(el.getAttribute('data-hs2-countdown'));
      if (el.textContent !== txt) el.textContent = txt;
      el.hidden = !txt;
    });
    document.querySelectorAll('[data-hs2-date]').forEach(function (el) {
      var left = el.parentNode.querySelector('[data-hs2-left]');
      if (!left) return;
      var d = parseLoose(el.textContent, tl.now.getFullYear());
      if (!d) { left.hidden = true; return; }
      var days = Math.ceil((endOfDay(d) - tl.now) / DAY);
      left.textContent = days < 1 ? 'Closed' : days === 1 ? 'Last day' : plural(days, 'day') + ' left';
      left.hidden = false;
    });
    var label = document.querySelector('[data-hs2-clock-label]');
    if (label) label.textContent = tl.deadline ? 'LAST DAY TO ORDER FOR CHRISTMAS IN' : 'CHRISTMAS MORNING IN';
  }
  function clock() {
    var box = document.querySelector('[data-hs2-clock]');
    if (!box || box.__hs2) return; box.__hs2 = true;
    var parts = {};
    box.querySelectorAll('[data-hs2-clock-part]').forEach(function (b) { parts[b.getAttribute('data-hs2-clock-part')] = b; });
    var timer = null;
    function paint() {
      var tl = timeline(), target = tl.deadline || tl.xmas;
      if (!target) { box.hidden = true; return; }
      box.hidden = false;
      var ms = Math.max(0, target - new Date(tl.now.getTime()));
      var v = { d: Math.floor(ms / DAY), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
      Object.keys(v).forEach(function (k) {
        var t = (v[k] < 10 ? '0' : '') + v[k];
        if (parts[k] && parts[k].textContent !== t) {
          parts[k].textContent = t;
          if (!reduced && k !== 's') { parts[k].classList.remove('is-flip'); void parts[k].offsetWidth; parts[k].classList.add('is-flip'); }
        }
      });
    }
    paint();
    if (!('IntersectionObserver' in window)) { timer = setInterval(paint, 1000); return; }
    new IntersectionObserver(function (en) {
      clearInterval(timer); timer = null;
      if (en[0].isIntersecting) timer = setInterval(paint, 1000);
    }).observe(box);
  }

  /* ========================================================== benefits carousel */
  function carousels() {
    document.querySelectorAll('[data-hs2-carousel]').forEach(function (list) {
      if (list.__hs2) return; list.__hs2 = true;
      var nav = list.parentElement.querySelector('[data-hs2-carousel-nav]');
      if (!nav) return;
      var dots = nav.querySelector('[data-hs2-carousel-dots]'), items = Array.prototype.slice.call(list.children);
      dots.innerHTML = '';
      items.forEach(function () { dots.appendChild(document.createElement('i')); });
      function current() {
        var r = list.getBoundingClientRect(), mid = r.left + r.width / 2, best = 0, bd = Infinity;
        items.forEach(function (it, i) { var ir = it.getBoundingClientRect(), d = Math.abs(ir.left + ir.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
        return best;
      }
      function paint() { var c = current(); Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('is-on', i === c); }); }
      list.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
      nav.querySelectorAll('[data-hs2-carousel-step]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = Math.max(0, Math.min(items.length - 1, current() + Number(b.getAttribute('data-hs2-carousel-step'))));
          list.scrollTo({ left: items[i].offsetLeft - (list.clientWidth - items[i].offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
        });
      });
      paint();
    });
  }

  /* ============================================== the story cards play like a story */
  var leakAuto = { stopped: false, timer: null };
  function leakAutoplay() {
    var phone = document.querySelector('[data-hs2-phone]');
    if (!phone || phone.__hs2 || reduced || !('IntersectionObserver' in window)) return; phone.__hs2 = true;
    var ms = 4500;
    phone.style.setProperty('--leak-s', ms + 'ms');
    function restart() { phone.classList.remove('is-playing'); void phone.offsetWidth; phone.classList.add('is-playing'); }
    function tick() { if (leakAuto.stopped) return; stepLeak(1); restart(); leakAuto.timer = setTimeout(tick, ms); }
    new IntersectionObserver(function (en) {
      clearTimeout(leakAuto.timer);
      if (en[0].isIntersecting && !leakAuto.stopped) { restart(); leakAuto.timer = setTimeout(tick, ms); }
      else phone.classList.remove('is-playing');
    }, { threshold: 0.6 }).observe(phone);
  }
  function stopLeakAuto() {
    leakAuto.stopped = true; clearTimeout(leakAuto.timer);
    var p = document.querySelector('[data-hs2-phone]'); if (p) p.classList.remove('is-playing');
  }

  /* ========================================= Instagram and TikTok in-app browsers
     They can't download files, so the story card opens full size to press and hold. */
  function showCard(src) {
    var ov = document.createElement('div');
    ov.className = 'hs2 hs2-cardview';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your story card');
    ov.innerHTML = '<div class="hs2-cardview__box"><img alt="Your story card" src="' + src + '"><p>Press and hold the card to save it. Then post it and tag the person.</p><button type="button" class="hs2-btn hs2-btn--blush">Done</button></div>';
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';
    var btn = ov.querySelector('button');
    var close = function () { ov.remove(); document.documentElement.style.overflow = ''; };
    btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    btn.focus();
  }

  /* ============================== funnel events for Shopify's customer events and pixels
     Subscribe in Settings > Customer events (analytics.subscribe('hs2_approve_clicked', ...)). */
  function track(name, data) {
    try { if (window.Shopify && window.Shopify.analytics && window.Shopify.analytics.publish) window.Shopify.analytics.publish('hs2_' + name, data || {}); } catch (e) { /* analytics off */ }
  }

  /* ------------------------------------------------------------- gift list
     The shop grid (hs2-shop) keeps the gifts a shopper picked in sessionStorage and opens the
     first. Each product page personalizes as usual (the bridge carries the photo and names);
     after its Add To Cart, a bar offers the next gift not yet in the cart, then checkout. */
  var QKEY = 'hs2-queue';
  function queueGet() { try { var q = JSON.parse(window.sessionStorage.getItem(QKEY) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  function queueSet(q) { try { if (q && q.length) window.sessionStorage.setItem(QKEY, JSON.stringify(q)); else window.sessionStorage.removeItem(QKEY); } catch (e) { /* private mode */ } }
  function handleOf(u) { var m = /\/products\/([^/?#]+)/.exec(u || ''); return m ? decodeURIComponent(m[1]) : ''; }
  function shopRoot() { return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/'; }
  function shop() {
    document.querySelectorAll('[data-hs2-shop]').forEach(function (root) {
      if (root.__hs2) return; root.__hs2 = true;
      var boxes = Array.prototype.slice.call(root.querySelectorAll('[data-hs2-shop-check]'));
      var bar = root.querySelector('[data-hs2-shop-bar]'), go = root.querySelector('[data-hs2-shop-go]');
      var count = root.querySelector('[data-hs2-shop-count]'), total = root.querySelector('[data-hs2-shop-total]'), hint = root.querySelector('[data-hs2-shop-hint]');
      var picked = function () { return boxes.filter(function (b) { return b.checked; }); };
      var update = function () {
        var p = picked();
        boxes.forEach(function (b) { var card = b.closest('.hs2-shop__item'); if (card) card.classList.toggle('is-picked', b.checked); });
        if (bar) bar.hidden = !p.length;
        if (hint) hint.hidden = p.length > 0;
        if (!p.length) return;
        var cents = p.reduce(function (s, b) { return s + (parseInt(b.getAttribute('data-price'), 10) || 0); }, 0);
        if (count) count.textContent = p.length === 1 ? '1 gift' : p.length + ' gifts';
        if (total) total.textContent = '$' + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100));
        if (go) go.textContent = (p.length === 1 ? go.getAttribute('data-one') : go.getAttribute('data-many')) || go.textContent;
      };
      boxes.forEach(function (b) {
        b.addEventListener('change', function () { update(); if (b.checked) track('shop_pick', { gift: b.getAttribute('data-title') }); });
      });
      if (go) go.addEventListener('click', function (e) {
        var p = picked();
        if (!p.length) return;
        e.preventDefault();
        var q = p.map(function (b) { return { url: b.getAttribute('data-url'), title: b.getAttribute('data-title') }; });
        queueSet(q);
        track('shop_go', { gifts: q.length });
        window.location.href = q[0].url;
      });
      update();
    });
  }
  /* Teeinblue adds to the cart with its own request; watch for any successful /cart/add.
     Each callback gets the added lines as /cart/add answers them (null if unreadable). */
  /* Teeinblue's Add To Cart posts its own JSON to /cart/add and never reads our form, so the
     hidden answers (_hs_answers, _hs_lines, _hs_ship_to) never reached an order (found in the
     live cart test, 21 Oct). Add our properties on the way out. On native artwork routes,
     our raw _hs values also replace vendor-escaped copies; vendor design identifiers stay intact. */
  function hsProps() {
    var o = {}, n = 0, native = nativeArtworkPurchase();
    document.querySelectorAll('#hs2-product-form [data-hs2-prop]').forEach(function (inp) {
      var m = /^properties\[(.+)\]$/.exec(inp.name || '');
      if (m && (inp.value || (native && m[1].indexOf('_hs_') === 0))) { o[m[1]] = inp.value; n++; }
    });
    if (native && restoredArtworkChosen()) {
      // Do not relabel an older image as generated for today's default choices/profile.
      o._hs_art_source = 'restored-buyer-reviewed';
      o._hs_art_style = 'Unverified original style (restored artwork)';
      o._hs_art_tone = 'Unverified original tone (restored artwork)';
      o._hs_art_profile = '';
      n++;
    }
    return n ? o : null;
  }
  function withHsProps(body) {
    var add = hsProps();
    if (!add || typeof body !== 'string') return body;
    try {
      var j = JSON.parse(body);
      (Array.isArray(j.items) ? j.items : [j]).forEach(function (it) {
        if (!it || !it.id) return;
        it.properties = it.properties || {};
        Object.keys(add).forEach(function (k) {
          if (!(k in it.properties) || (nativeArtworkPurchase() && k.indexOf('_hs_') === 0)) it.properties[k] = add[k];
        });
        // Teeinblue encoded this label in the observed native cart. Correct only the
        // known label; never HTML-decode customer prose or customization/design URLs.
        // one unit per design (28 Oct): Shopify's checkout merge turned 2 of a design into 4
        if (nativeArtworkPurchase() && it.properties._customization_id && Number(it.quantity) !== 1) it.quantity = 1;
        if (nativeArtworkPurchase() && Object.prototype.hasOwnProperty.call(it.properties, 'Dog&#39;s name') && !Object.prototype.hasOwnProperty.call(it.properties, "Dog's name")) {
          it.properties["Dog's name"] = it.properties['Dog&#39;s name'];
          delete it.properties['Dog&#39;s name'];
        }
      });
      return JSON.stringify(j);
    } catch (e) { return body; }
  }
  function checkoutImageConfig() {
    var buy = document.querySelector('#buy[data-hs2-checkout-image-enabled="true"]');
    return nativeArtworkPurchase() && buy ? {endpoint: buy.getAttribute('data-hs2-checkout-image-endpoint') || '', cdnPrefix: buy.getAttribute('data-hs2-checkout-image-cdn-prefix') || ''} : null;
  }
  /* Every word about an add, in one line right after Teeinblue's Add to cart, where the buyer is
     looking (28 Oct: the words went to the top of the form, out of sight, under a bare 30 second
     spinner). It clears itself after a minute, when the add lands, and when Teeinblue marks a field
     to fix, since then its own check stopped the add. With no button on the page the words go to the
     status line above the form, as before. checkoutImageStatus.dog is the dog's possessive, set
     when an add starts (startedAdd). */
  function checkoutImageStatus(message) {
    var status = document.querySelector('[data-hs2-checkout-image-status]');
    var button = document.querySelector('#buy #teeAtcButton, #buy .tee-btn--atc');
    clearTimeout(checkoutImageStatus.timer);
    if (!button || !button.parentNode) { if (status) { status.textContent = message; status.hidden = !message; } return; }
    if (status && !status.hidden) { status.textContent = ''; status.hidden = true; }
    var note = document.querySelector('[data-hs2-add-note]');
    if (!note && !message) return; // nothing said yet, nothing to clear
    if (!note) {
      note = document.createElement('p');
      note.className = 'hs2-add-note'; note.setAttribute('data-hs2-add-note', ''); note.setAttribute('role', 'status');
    }
    // Teeinblue redraws its button: the line goes back right after it
    if (button.nextSibling !== note) button.parentNode.insertBefore(note, button.nextSibling);
    if (note.textContent !== message) note.textContent = message;
    note.hidden = !message;
    if (message) checkoutImageStatus.timer = setTimeout(function () { checkoutImageStatus(''); }, 60000);
    var buy = document.getElementById('buy');
    if (!checkoutImageStatus.watching && buy && window.MutationObserver) {
      checkoutImageStatus.watching = true;
      new window.MutationObserver(function () {
        var shown = document.querySelector('[data-hs2-add-note]');
        if (shown && !shown.hidden && document.querySelector('#buy .tee-field--invalid')) checkoutImageStatus('');
      }).observe(buy, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }
  function prepareCheckoutCart(body) {
    var config = checkoutImageConfig();
    if (!config) return null; // The new route is opt-in until its endpoint is verified.
    if (prepareCheckoutCart.pending) return Promise.reject(new Error('Checkout artwork is already being prepared.'));
    var revision = function () { return JSON.stringify([blanketReviewKey(), answer('line4'), answer('signed'), hsProps()]); };
    var identity = revision(), variant = document.querySelector('[data-hs2-variant-id]');
    var variantId = variant && variant.value;
    var whose = checkoutImageStatus.dog || 'your', Whose = checkoutImageStatus.dog || 'Your';
    prepareCheckoutCart.pending = true;
    checkoutImageStatus('Getting ' + whose + ' picture ready for checkout.');
    // registration polls while Teeinblue finishes its copy; it never uploads (hs-checkout-image.js)
    prepareCheckoutCart.retries = 0;
    var options = Object.assign({}, config, { onPending: function () { prepareCheckoutCart.retries++; checkoutImageStatus('Almost there.'); } });
    return Promise.resolve().then(function () {
      if (!window.HSCheckoutImage) throw new Error('Checkout artwork service is unavailable.');
      return window.HSCheckoutImage.prepare(body, options);
    }).then(function (prepared) {
      var currentVariant = document.querySelector('[data-hs2-variant-id]');
      if (identity !== revision() || variantId !== (currentVariant && currentVariant.value) || !cityArtSaved() || !blanketReviewAccepted() || !nativePurchaseReady() || blanketUploadPending()) {
        var changed = new Error('Your artwork selection changed.'); changed.hs2Changed = true; throw changed;
      }
      checkoutImageStatus('Almost there.');
      prepareCheckoutCart.pending = false;
      return prepared;
    }).catch(function (error) {
      prepareCheckoutCart.pending = false;
      // plain words, and the one thing a buyer must not do: paint again
      checkoutImageStatus(error && error.hs2Changed
        ? Whose + ' design changed while it was saving. Check it, then try Add to cart again. You do not need to upload a photo again.'
        : "That didn't go through. " + Whose + ' design is saved, so you do not need to upload a photo again. Try Add to cart again.');
      throw error;
    });
  }
  function onCartAdd(cb) {
    (onCartAdd.cbs = onCartAdd.cbs || []).push(cb);
    if (onCartAdd.hooked) return;
    onCartAdd.hooked = true;
    var fire = function (body) {
      var items = body && (Array.isArray(body.items) ? body.items : body.variant_id ? [body] : null);
      checkoutImageStatus(''); // it landed: the line beside the button has said its piece
      setTimeout(function () { onCartAdd.cbs.forEach(function (f) { try { f(items); } catch (e) { /* keep going */ } }); }, 400);
    };
    var isAdd = function (u) { return /\/cart\/add(\.js)?(?:[?#]|$)/.test(String(u || '')); };
    /* On a redo page (redoMode sets onCartAdd.redo) an add carrying the first design's id again is
       refused: order #1008 kept the first design under the redo (28 Oct). The words ask for a new
       photo; nothing here paints, uploads or retries. */
    var firstDesign = function (body) {
      if (!onCartAdd.redo || !body) return false;
      if (typeof body !== 'string') return !!(body.get && body.get('properties[_customization_id]') === onCartAdd.redo);
      try {
        var j = JSON.parse(body);
        return (Array.isArray(j.items) ? j.items : [j]).some(function (it) { return !!it && !!it.properties && it.properties._customization_id === onCartAdd.redo; });
      } catch (e) { return false; }
    };
    var refuse = function () { checkoutImageStatus('This is still your first design. Add a new photo to make another version.'); };
    // where the 30 seconds go (28 Oct): Teeinblue's own save, our checkout picture, Shopify's add
    var timed = function (at, ready) {
      try { track('add_timing', { teeinblue_ms: onCartAdd.clickAt ? at - onCartAdd.clickAt : null, prepare_ms: ready - at, add_ms: Date.now() - ready, retries: prepareCheckoutCart.retries || 0 }); } catch (e) { /* analytics never holds an add */ }
      onCartAdd.clickAt = 0;
    };
    if (window.fetch) {
      var f0 = window.fetch;
      onCartAdd.fetch0 = f0;
      window.fetch = function (input) {
        var u = typeof input === 'string' ? input : (input && input.url);
        var args = arguments;
        if (isAdd(u) && args[1] && firstDesign(args[1].body)) { refuse(); return Promise.reject(new Error('This is still the first design.')); }
        if (isAdd(u) && args[1] && typeof args[1].body === 'string') { args = [input, Object.assign({}, args[1], { body: withHsProps(args[1].body) })]; }
        var at = Date.now(), ready = at;
        var context = this, preparation = isAdd(u) ? prepareCheckoutCart(args[1] && args[1].body) : null;
        var pr = preparation ? preparation.then(function (body) { ready = Date.now(); return f0.call(context, input, Object.assign({}, args[1], {body: body})); }) : f0.apply(this, args);
        if (isAdd(u)) pr.then(function (r) {
          if (!r || !r.ok) { checkoutImageStatus(''); return; } // Shopify said no; Teeinblue shows why
          timed(at, ready);
          var copy = null;
          try { copy = r.clone(); } catch (e) { /* body already read */ }
          if (copy) copy.json().then(fire, function () { fire(null); }); else fire(null);
        }, function () {});
        return pr;
      };
    }
    if (window.XMLHttpRequest) {
      var X = window.XMLHttpRequest.prototype, open0 = X.open, send0 = X.send, abort0 = X.abort;
      X.open = function (m, u) { this.__hs2add = isAdd(u); this.__hs2generation = (this.__hs2generation || 0) + 1; return open0.apply(this, arguments); };
      X.abort = function () { this.__hs2generation = (this.__hs2generation || 0) + 1; return abort0.apply(this, arguments); };
      X.send = function (b) {
        if (this.__hs2add && firstDesign(b)) {
          refuse();
          // Teeinblue's XHR client hears a normal failure and releases its button; nothing is sent
          this.dispatchEvent(new Event('error')); this.dispatchEvent(new Event('loadend'));
          return;
        }
        if (this.__hs2add && typeof b === 'string') arguments[0] = withHsProps(b);
        var at = Date.now(), ready = at;
        if (this.__hs2add) this.addEventListener('load', function () {
          if (this.status < 200 || this.status >= 300) { checkoutImageStatus(''); return; }
          timed(at, ready);
          var body = null;
          try { body = JSON.parse(this.responseText); } catch (e) { /* not JSON */ }
          fire(body);
        });
        var xhr = this, generation = this.__hs2generation;
        var preparation = this.__hs2add ? prepareCheckoutCart(arguments[0]) : null;
        if (!preparation) return send0.apply(this, arguments);
        preparation.then(function (body) {
          ready = Date.now();
          if (xhr.__hs2generation === generation) send0.call(xhr, body);
        }, function () {
          if (xhr.__hs2generation !== generation) return;
          // Teeinblue's XHR client receives a normal network failure and releases its button.
          xhr.dispatchEvent(new Event('error'));
          xhr.dispatchEvent(new Event('loadend'));
        });
      };
    }
  }
  /* Teeinblue's Add To Cart tells nobody: the header's cart count stayed at nothing and the
     cart drawer stayed shut, leaving a shopper from an ad with a small green line and no next
     step (in-app test, 6 October). So hs2 tells Helio the way Helio's own Add To Cart does,
     with Shopify's cart event: the count updates, the drawer refreshes and, for a single
     gift, opens on its Check out button. On a gift list the drawer stays shut, since the bar
     below names the next gift. If Helio can't hear it, a bar offers checkout instead.
     The event is built by hand, field for field as Shopify's standard-events.js builds
     its CartLinesUpdateEvent, because Shopify minifies theme assets and its minifier turns
     an import() of that module into a require() that fails in the browser. */
  var GID = 'gid://shopify/';
  function money(cents, currency) {
    var digits = 2;
    try { digits = new Intl.NumberFormat('en', { style: 'currency', currency: currency }).resolvedOptions().maximumFractionDigits; } catch (e) { /* default */ }
    return (Number(cents) / 100).toFixed(digits);
  }
  function cartForEvent(cart) {
    return {
      id: GID + 'Cart/' + cart.token,
      totalQuantity: cart.item_count,
      cost: { totalAmount: { amount: money(cart.total_price, cart.currency), currencyCode: cart.currency } },
      lines: (cart.items || []).map(function (it) {
        return { id: String(it.key || it.id), quantity: it.quantity, cost: { totalAmount: { amount: money(it.final_line_price, cart.currency), currencyCode: cart.currency } } };
      }),
      discountCodes: (Array.isArray(cart.discount_codes) ? cart.discount_codes : []).map(function (c) { return { applicable: c.applicable, code: c.code }; })
    };
  }
  /* One confirmation per add (28 Oct: Teeinblue's green line, this toast and the drawer fired together,
     and the drawer opened on "Your cart is empty", then 1 item, then 2 within 4 seconds). Helio hears
     once, after the gift and its Artist's touch (extrasAfterAdd.pending) are both in the cart, with
     the cart and the drawer's own new markup already read, so the drawer opens on the finished cart.
     When it opens it is the confirmation; the toast shows only when it does not, and never outlives
     the next step: it goes after 8 seconds, a scroll past 600px, or on leaving the page. */
  function announceAdd(items) {
    var list = queueGet().length > 0;
    var toast = function (title, sub, href, label) {
      showNext(title, sub, href, label);
      var bar = document.querySelector('[data-hs2-next]');
      if (!bar) return; // on the cart page the next step sits in the page, not over it
      var from = window.scrollY || 0, timer = null;
      var gone = function () {
        clearTimeout(timer);
        window.removeEventListener('scroll', far);
        window.removeEventListener('pagehide', gone);
        var head = bar.querySelector('strong');
        // only this toast: a later one in the same bar is that one's to clear
        if (bar.parentNode && head && head.textContent === title) hideNext();
      };
      var far = function () { if (Math.abs((window.scrollY || 0) - from) > 600) gone(); };
      timer = setTimeout(gone, 8000);
      window.addEventListener('scroll', far, { passive: true });
      window.addEventListener('pagehide', gone);
    };
    var fallback = function () { if (!list) toast('In your cart', 'Free US shipping on every order.', shopRoot() + 'checkout', 'Check out'); };
    if (!document.querySelector('cart-icon, cart-drawer-component')) { fallback(); return; }
    var drawerOpen = function () {
      var drawer = document.querySelector('cart-drawer-component'), dialog = drawer && drawer.closest ? drawer.closest('dialog') : null;
      return !!((dialog && dialog.open) || document.querySelector('#cart-drawer dialog[open]'));
    };
    var json = function (r) { if (!r.ok) throw new Error('read ' + r.status); return r.json(); };
    // after every other handler of this add has run, so an Artist's touch on its way is waited for
    setTimeout(function () {
      var addon = extrasAfterAdd.pending;
      var wait = addon ? Promise.race([addon, new Promise(function (resolve) { setTimeout(resolve, 30000); })]) : Promise.resolve();
      wait.then(function () {
        var ids = [];
        Array.prototype.forEach.call(document.querySelectorAll('cart-items-component[data-section-id]'), function (el) {
          var id = el.getAttribute('data-section-id');
          if (id && ids.indexOf(id) < 0) ids.push(id);
        });
        var markup = ids.length ? fetch(shopRoot() + '?sections=' + encodeURIComponent(ids.join(',')), { credentials: 'same-origin' }).then(json).catch(function () { return null; }) : Promise.resolve(null);
        return Promise.all([fetch(shopRoot() + 'cart.js', { credentials: 'same-origin' }).then(json), markup]);
      }).then(function (read) {
        var cart = read[0], sections = read[1];
        var ev = new Event('shopify:cart:lines-update', { bubbles: true, cancelable: true });
        ev.action = list ? 'update' : 'add';
        ev.context = 'product';
        ev.promise = Promise.resolve({ cart: cartForEvent(cart), detail: { items: cart.items, itemCount: cart.item_count, sections: sections || undefined, source: 'hs2-personalizer', didError: false } });
        if (!list) ev.lines = (items || []).filter(function (it) { return it && it.variant_id; }).map(function (it) { return { merchandiseId: GID + 'ProductVariant/' + it.variant_id, quantity: it.quantity || 1 }; });
        document.dispatchEvent(ev);
        if (list || !(cart.items || []).length) return;
        // the drawer is the confirmation when it opens; the gift and the way to the next one otherwise
        setTimeout(function () {
          if (drawerOpen()) return;
          var dog = answer('dog');
          toast(dog ? possessive(dog) + ' gift is in your cart.' : 'Your gift is in your cart.', 'Free US shipping on every order.', shopRoot() + '?step=choose', 'Add another gift');
        }, 900);
      }).catch(function () { fallback(); });
    }, 0);
  }
  function hideNext() {
    var bar = document.querySelector('[data-hs2-next]');
    if (bar) bar.remove();
    showNext.held = false;
    document.documentElement.classList.remove('hs2-has-next');
    giftFit();
  }
  // a bar marked held (the redo's "Your new version is in your cart.") stays until the buyer closes it
  function showNext(title, sub, href, label) {
    if (showNext.held) return;
    var onCart = /^\/cart\/?$/.test(location.pathname);
    var anchor = onCart && document.querySelector('.cart-totals__tax-note');
    if (anchor) {
      // on the cart page the next step sits in the page, beside the totals, not over them
      var a = document.querySelector('[data-hs2-next-inline]');
      if (!a) { a = document.createElement('a'); a.className = 'hs2-next-inline'; a.setAttribute('data-hs2-next-inline', ''); anchor.parentNode.insertBefore(a, anchor); }
      a.href = href; a.textContent = title + ' · ' + label;
      return;
    }
    var bar = document.querySelector('[data-hs2-next]');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'hs2-next';
      bar.setAttribute('data-hs2-next', '');
      bar.setAttribute('role', 'status');
      bar.innerHTML = '<div class="hs2-next__text"><strong></strong><span></span></div><a class="hs2-next__go"></a><button type="button" class="hs2-next__x" aria-label="Close">&times;</button>';
      bar.querySelector('.hs2-next__x').addEventListener('click', function () { hideNext(); queueSet([]); });
      document.body.appendChild(bar);
    }
    bar.querySelector('strong').textContent = title;
    bar.querySelector('.hs2-next__text span').textContent = sub;
    var go = bar.querySelector('.hs2-next__go');
    go.textContent = label; go.href = href;
    document.documentElement.classList.add('hs2-has-next');
    giftFit(); // the bar takes the bottom of a one-screen gift page
  }
  // items: the lines an add just put in (onCartAdd), or undefined on a plain page load
  function queueBar(items) {
    var q = queueGet();
    if (!q.length) return;
    // a redo page makes a new version of a gift already in the cart: the list's bar covered it and
    // read "All 3 gifts are in your cart" over the new painting (28 Oct, Recording 4)
    if (/[?&]redo=[a-f0-9-]{36}(?:[&#]|$)/i.test(location.search || '')) { if (!showNext.held) hideNext(); return; }
    var fromAdd = items !== undefined;
    fetch(shopRoot() + 'cart.js', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        var inCart = {};
        (cart.items || []).forEach(function (it) { inCart[it.handle] = true; });
        var here = handleOf(location.pathname);
        var left = q.filter(function (it) { return !inCart[handleOf(it.url)]; });
        // on a gift still to personalize, this page is the step: no bar until it's in the cart
        if (left.some(function (it) { return handleOf(it.url) === here; })) { hideNext(); return; }
        var next = left[0];
        if (next) {
          var done = q.length - left.length;
          showNext('Next: ' + next.title, done + ' of ' + q.length + ' in your cart. Photo and names carry over.', next.url, 'Personalize it');
        } else {
          // the list is done: said once, by the add that finished it; a later page load ends it quietly
          queueSet([]);
          if (fromAdd) showNext('All ' + q.length + ' gifts are in your cart', 'Free US shipping on every order.', shopRoot() + 'checkout', 'Check out');
        }
      })
      .catch(function () { /* the bar is a convenience; the cart still works */ });
  }
  function confirmAdds() {
    if (confirmAdds.done || !document.querySelector('#buy')) return;
    confirmAdds.done = true;
    onCartAdd(announceAdd);
  }
  function giftList() {
    if (giftList.done) return;
    giftList.done = true;
    if (!document.querySelector('#buy') && !/^\/cart\/?$/.test(location.pathname)) return;
    // nothing to do (and nothing hooked) unless the shopper came through the gift grid
    if (!queueGet().length) return;
    onCartAdd(queueBar);
    queueBar();
  }
  /* Helio's search resets itself when its panel "closes", and every reset focuses its input,
     even while the panel is shut. The shut input sits near the foot of the page, so the browser
     scrolls there: a shopper landing on a product page watched it slide to the footer three
     seconds in (the bridge's chip clicks were one trigger). The input may only take focus
     while it can be seen, which is whenever the shopper has actually opened search. */
  function guardSearchFocus() {
    document.querySelectorAll('predictive-search-component input, #cmdk-input').forEach(function (inp) {
      if (inp.__hs2guard) return;
      inp.__hs2guard = true;
      var focus0 = inp.focus;
      inp.focus = function () {
        var r = inp.getBoundingClientRect();
        var shown = r.width > 1 && r.height > 1 && (!inp.checkVisibility || inp.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
        var dlg = inp.closest('dialog');
        if (!shown && !(dlg && dlg.open)) return;
        return focus0.apply(inp, arguments);
      };
    });
  }
  // a product page that opens on its photo switches to the shopper's live preview once they add one
  function previewOnPhoto() {
    var media = document.querySelector('[data-hs2-media][data-open="photo"]');
    if (!media || previewOnPhoto.done) return;
    previewOnPhoto.done = true;
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.type !== 'file' || !t.closest || !t.closest('.tee-field--photo')) return;
      setTimeout(function () {
        media.removeAttribute('data-show');
        var pv = media.querySelector('[data-hs2-thumb-preview]');
        media.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === pv ? 'true' : 'false'); });
      }, 900);
    }, true);
  }

  // Every gift needs Teeinblue's photo and note. Helio's collection quick-add
  // submits a bare variant, so a catalog card must open the product form first.
  // Every card does, whatever its handle: a list of handles let a renamed one
  // (28 Oct, a Teeinblue campaign Update) keep the bare quick add. Only the
  // Artist's touch add-on, which is no gift, keeps Helio's own button.
  function personalizeCatalogCards() {
    var keep = ['artists-touch'];
    document.querySelectorAll('product-card quick-add-component').forEach(function (quick) {
      var card = quick.closest('product-card');
      var productLink = card && card.querySelector('a[href*="/products/"]');
      var handle = productLink ? handleOf(productLink.href) : '';
      if (!handle || keep.indexOf(handle) !== -1) return;
      var link = quick.querySelector('.hs2-catalog-personalize');
      if (link) { link.href = productLink.href; return; }
      link = document.createElement('a');
      link.className = 'button quick-add__button add-to-cart-button hs2-catalog-personalize';
      link.href = productLink.href;
      link.textContent = 'Personalize';
      quick.replaceChildren(link);
    });
  }
  function guardCatalogQuickAdd() {
    if (guardCatalogQuickAdd.done) return;
    guardCatalogQuickAdd.done = true;
    personalizeCatalogCards();
    if (document.body && window.MutationObserver) {
      new MutationObserver(personalizeCatalogCards).observe(document.body, { childList: true, subtree: true });
    }
  }

  /* The phone menu: Helio's drawer showed three product cards, with the framed portrait's price and the
     blanket's blank template picture (CoWork Part B, 28 Oct). hs-footer.liquid renders Heartside's own
     list with Shopify's prices; it goes at the top of the drawer, and hs-brand.css hides the cards. */
  function heartsideMenu() {
    var tpl = document.querySelector('template[data-hs-menu]'), drawer = document.querySelector('.header .menu-drawer');
    if (tpl && drawer && !drawer.querySelector('.hs-menu') && tpl.content && tpl.content.firstElementChild) {
      var close = drawer.querySelector('.menu-drawer__close-button'), menu = tpl.content.firstElementChild.cloneNode(true);
      drawer.insertBefore(menu, close ? close.nextSibling : drawer.firstChild);
    }
    // Helio redraws its header after load and replaces the whole drawer, so the list goes back in
    // whenever that happens, and again as the menu opens
    var header = document.querySelector('.header');
    if (!tpl || !header || heartsideMenu.watching) return;
    heartsideMenu.watching = true;
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.header__icon--menu')) heartsideMenu(); }, true);
    if ('MutationObserver' in window) new MutationObserver(function () {
      if (heartsideMenu.queued) return;
      heartsideMenu.queued = true;
      requestAnimationFrame(function () { heartsideMenu.queued = false; heartsideMenu(); });
    }).observe(header, { childList: true, subtree: true });
  }
  function layout() { stickyHead.h = stickyHead(); heroTop(); fitPoster(); ticker(); fitFaq(); }
  function init() {
    if ((cityArtPreview() || nativeArtworkPurchase()) && window.HSArtworkChoices) {
      window.HSArtworkChoices.mount(document.querySelector('[data-hs-art-choices]'), {wordFree: blanketArtPreview(), nativeUpload: nativeArtworkPurchase()});
      window.addEventListener('hs-artwork-choices', artworkChoicesChanged);
    }
    guardSearchFocus();
    bindBlanketRecovery();
    bindExtras();
    guardCatalogQuickAdd();
    bindInputs(); render(); sticky(); gallery(); clearHeader(); heartsideMenu();
    steps(); zoom(); approve(); faq(); carousels(); clock(); urgency(); reveal(); cycleNames(); leakAutoplay();
    shop(); giftList(); confirmAdds(); previewOnPhoto(); warmPhotoCheck(); keepTibPhoto(); guardGiftPhoto(); redoMode(); window.addEventListener('hs-artwork-choices', function () { journeyCard(); }); guardMugProof();
    layout();
    setInterval(urgency, 60000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    var late = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 1500); });
    Promise.race([restorePhoto(), late]).then(function (rec) { if (rec && !usePhoto.file) usePhoto(rec.file, rec.t); teeinblue(); });
    cartTidy();
  }
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { clearHeader(); layout(); giftFit(); }, 120); });
  document.addEventListener('focusout', function () { setTimeout(giftFit, 150); });
  window.addEventListener('load', function () { guardSearchFocus(); clearHeader(); layout(); giftFit(); setTimeout(function () { clearHeader(); layout(); giftFit(); }, 600); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('shopify:section:load', function () { personalizeCatalogCards(); bindInputs(); render(); sticky(); gallery(); steps(); zoom(); approve(); faq(); carousels(); clock(); urgency(); reveal(); shop(); layout(); });
  // for tools/preview tests
  window.__hs2api = { state: state, val: val, answer: answer, drawCard: drawCard, caption: caption, shareURL: shareURL, runBridge: runBridge, rules: TIB_RULES, usePhoto: usePhoto, prepareCurrentArtwork: prepareCurrentArtwork, countdownText: countdownText, steps: steps, showCard: showCard };
})();
