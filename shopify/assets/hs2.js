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
      ANSWERS.forEach(function (k) { if (q.get(k)) s[k] = q.get(k).slice(0, 40); });
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
    if (k === 'art_energy' && (cityArtPreview() || nativeArtworkPurchase())) return artworkEnergy() || 'none';
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
  function blanketUploadPending() {
    var key = 'hs2-blanket-upload:' + productId(), pending;
    try { pending = JSON.parse(window.sessionStorage.getItem(key) || 'null'); } catch (e) { return true; }
    if (!pending) return false;
    var src = cityArtSource(), photo = document.querySelector('.tee-field--photo .tee-photo-image');
    if (src && src !== pending.before && photo && photo.getAttribute('src') === src && !document.querySelector('.vm--container')) {
      try { window.sessionStorage.removeItem(key); } catch (e) { return true; }
      return false;
    }
    return true;
  }
  function beginBlanketUpload() {
    if (!productId() || blanketUploadPending() || !nativeBlanketInputsReady()) return false;
    try { window.sessionStorage.setItem('hs2-blanket-upload:' + productId(), JSON.stringify({before: cityArtSource()})); return true; }
    catch (e) { return false; }
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
  /* What the on-device photo check found, beside the artwork status: a reason in plain words,
     and for a dog the detector may have missed, "It's my dog. Use this photo." */
  function photoCheck(message, override) {
    var box = document.querySelector('[data-hs2-photo-check]');
    if (!box) { if (message) blanketPurchaseStatus(message); return; }
    box.hidden = !message;
    var text = box.querySelector('[data-hs2-photo-check-text]'), btn = box.querySelector('[data-hs2-photo-override]');
    if (text) text.textContent = message || '';
    if (btn) {
      btn.hidden = !override;
      btn.onclick = override ? function () { btn.hidden = true; override(); } : null;
    }
  }
  // start the dog detector when the buyer heads for the photo, so the check is ready by the time they pick one
  function warmPhotoCheck() {
    if (warmPhotoCheck.done || !nativeArtworkPurchase()) return;
    warmPhotoCheck.done = true;
    var go = function (e) {
      if (!window.HSPhotoQuality || !e.target || !e.target.closest || !e.target.closest('.tee-field--photo, [data-hs2-blanket-create]')) return;
      document.removeEventListener('pointerdown', go, true);
      try { window.HSPhotoQuality.loadDetector(); } catch (err) { /* the check fails open without it */ }
    };
    document.addEventListener('pointerdown', go, true);
  }
  function sendBlanketPhoto() {
    if (!nativeArtworkPurchase() || !usePhoto.file || blanketUploadPending() || !nativeBlanketInputsReady()) return;
    var target = photoInput();
    if (!target) { blanketPurchaseStatus('The personalizer is still loading. Your photo is saved here.'); return; }
    try {
      var transfer = new DataTransfer(); transfer.items.add(usePhoto.file);
      target.files = transfer.files;
      // The capture handler persists the single-request guard before native dispatch.
      // No timers, refill API or retry follows this explicit click.
      target.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      blanketPurchaseStatus('Your photo could not be sent automatically. Check whether the personalizer is working before choosing it below.');
    }
  }
  function bindBlanketRecovery() {
    var box = document.querySelector('[data-hs2-upload-recovery]');
    if (!nativeArtworkPurchase() || !box) return;
    document.querySelector('[data-hs2-blanket-create]').addEventListener('click', sendBlanketPhoto);
    var acceptance = document.querySelector('[data-hs2-artwork-accept]');
    acceptance.addEventListener('change', function () {
      blanketAcceptedKey = acceptance.checked && !blanketUploadPending() && cityArtSaved() && !blanketNativeError() ? blanketReviewKey() : '';
      acceptance.checked = !!blanketAcceptedKey;
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
    // a campaign without the Energy field is still ready; one that has it must carry the code
    var keys = ['personality', 'art_style', 'art_tone'];
    if (fields.some(function (f) { return f.rule.k === 'art_energy'; })) keys.push('art_energy');
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
  function updateBlanketPurchaseStatus() {
    updatePortraitSignatureRecovery();
    updateRestoredArtworkReview();
    var pending = blanketUploadPending();
    var photoBox = document.querySelector('[data-hs2-blanket-photo]');
    if (photoBox) {
      photoBox.hidden = !usePhoto.file || artRequested();
      var photo = photoBox.querySelector('[data-hs2-blanket-photo-img]'), create = photoBox.querySelector('[data-hs2-blanket-create]');
      if (photoURL && photo.getAttribute('src') !== photoURL) photo.src = photoURL;
      create.disabled = pending || !nativeBlanketInputsReady();
    }
    var recovery = document.querySelector('[data-hs2-upload-recovery]');
    if (recovery) recovery.hidden = !pending;
    var link = document.querySelector('[data-hs2-artwork-source]');
    if (link) { link.hidden = true; link.removeAttribute('href'); }
    var acceptance = document.querySelector('[data-hs2-artwork-accept]'), review = document.querySelector('[data-hs2-artwork-accept-wrap]');
    if (review) review.hidden = true;
    if (acceptance && !blanketReviewAccepted()) { acceptance.checked = false; blanketAcceptedKey = ''; }
    document.querySelectorAll('[data-hs-art-choices] select').forEach(function (select) { select.disabled = pending; });
    if (pending) { blanketPurchaseStatus('Waiting for your artwork. Save its placement when it appears. Another upload is held while this request is unresolved.'); return; }
    if (!nativeBlanketInputsReady()) { blanketPurchaseStatus('Loading your choices into the personalizer.'); return; }
    var saved = cityArtSaved() && !blanketNativeError(), requested = artRequested();
    blanketPurchaseStatus(saved ? 'Artwork saved. Check every face and marking before adding your gift.' : restoredArtworkAvailable() ? 'Saved artwork is available. Choose Review this saved artwork to inspect it without creating another image.' : requested ? 'Creating your artwork. Save its placement when it appears. Uploading again creates another image.' : latestArtRequest() ? 'Create matching artwork with your photo below before adding your gift.' : 'Create artwork with your saved photo, or choose a photo below. Check the result before adding your gift.');
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
  function possessive(n) { return /s$/i.test(n) ? n + "'" : n + "'s"; }
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
    // hidden line-item properties on product forms
    document.querySelectorAll('[data-hs2-prop]').forEach(function (inp) {
      var k = inp.getAttribute('data-hs2-prop');
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
    var want = 'Last step. Let\'s make ' + possessive(dog) + ' ' + gift + '.';
    if (line && line.textContent !== want) line.textContent = want;
    if (!card) return;
    var esc_ = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var change = function (step) { return shopRoot() + '?step=' + step + '&return=' + gift; };
    var facts = [];
    try { facts = JSON.parse(artworkFacts()).facts.map(function (f) { return f.text; }); } catch (e) { facts = []; }
    var style = '', tone = '';
    try {
      var choice = window.HSArtworkChoices && window.HSArtworkChoices.read(), recipes = window.HSArtworkEngine && window.HSArtworkEngine.recipes;
      if (choice && recipes) { style = recipes.styles[choice.style].label; tone = recipes.tones[choice.tone].label; }
    } catch (e) { /* the choices load after this page's first paint */ }
    var row = function (k, v, href, label) { return '<div class="hs-journey__row"><span class="hs-journey__k">' + k + '</span><span class="hs-journey__v">' + v + '</span>' + (href ? '<a href="' + esc_(href) + '">' + (label || 'Change') + '</a>' : '') + '</div>'; };
    var html = row('From', esc_(dog) + (person ? ' for ' + esc_(person) : ''), change(person ? 'person' : 'dog'));
    html += gift === 'blanket' ? row('Words', 'None. The blanket is all painting.') : row('Words', '<span class="hs-journey__note">' + esc_((state.hs3_lines || {}).meaning || '') + '</span> <em>' + esc_(answer('signed')) + '</em>', change('gift-' + gift));
    html += row('What I\'ll paint', facts.length ? facts.map(esc_).join(' · ') : esc_(dog) + ', just as they are.', change('home'));
    if (style) html += row('Style and tone', esc_(style) + ' · ' + esc_(tone), '#hs-art-choices', 'Change below');
    if (cityArtSaved()) html += '<p class="hs-journey__warn">Changing these means painting new artwork.</p>';
    if (card.innerHTML !== html) card.innerHTML = html;
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
      b.addEventListener('click', function () { if (media) media.removeAttribute('data-show'); current(b); });
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
        if (!blanketUploadPending() && nativeBlanketInputsReady() && cityArtSaved() && blanketReviewAccepted() && nativePurchaseReady()) { syncBlanketProperties(); return; }
        e.preventDefault(); e.stopImmediatePropagation();
        var nativeBuy = document.querySelector('#buy[data-hs2-artwork-kind]');
        blanketPurchaseStatus(nativeBuy && nativeBuy.getAttribute('data-hs2-purchase-enabled') !== 'true' ? 'This gift is not available to order yet.' : 'Finish and save your artwork, then tick the artwork review before adding this gift. If an error appears, follow the instructions beside your artwork.');
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
    if ((cityArtPreview() || nativeArtworkPurchase()) && ['art_style', 'art_tone', 'personality', 'art_energy'].indexOf(k) !== -1) el.setAttribute('data-hs2-art-personality', '');
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
      if (k === 'art_energy' && (cityArtPreview() || nativeArtworkPurchase())) {
        // always written, "none" included, so a cleared breed never leaves an old code behind
        var code = answer('art_energy');
        if (text.value !== code) setValue(text, code);
        return { name: name, value: code };
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
    if (!buy || !buy.getAttribute('data-hs2-option-labels')) return;
    var map = {};
    try { map = JSON.parse(buy.getAttribute('data-hs2-option-labels')) || {}; } catch (e) { return; }
    buy.querySelectorAll('.tee-option').forEach(function (opt) {
      var m = /(?:^|\s)tee-option--([a-z0-9_-]+)/.exec(opt.className), title = opt.querySelector('.tee-option__title');
      if (!title) return;
      // Teeinblue's own key ("color"), or the title's words ("Available Product") for a key it spells differently
      var key = m ? m[1].replace(/_/g, '-') : '', words = title.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var want = map[key] || (title.__hs2key && map[title.__hs2key]) || map[words];
      if (!want) return;
      if (!title.__hs2key) title.__hs2key = map[key] ? key : words;
      if (title.textContent.trim() === want) return;
      // change only the text, never Teeinblue's elements
      var walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT), node, done = false;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        node.nodeValue = done ? '' : want;
        done = true;
      }
    });
    if (!buy.__hs2labels && 'MutationObserver' in window) {
      buy.__hs2labels = true;
      var queued = false;
      new MutationObserver(function () {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; relabelOptions(); }, 50);
      }).observe(buy, { childList: true, subtree: true, characterData: true });
    }
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
    if (media.getAttribute('data-tib') === on) return;
    media.setAttribute('data-tib', on);
    var pv = media.querySelector('[data-hs2-thumb-preview]');
    /* A gift page opens on the product photo until the shopper adds their own (open_on photo).
       After the chat, though, the words are already in the preview, and the product photo
       shows Teeinblue's sample dog and lines ("Bartholomew Jr"), so the buyer could not see
       their own words before Add to cart (Krish, 19 Oct). So when the chat handed this gift
       its words, the preview is the picture on show, unless the shopper picked a photo. */
    if (on === 'on' && pv && media.getAttribute('data-show') === 'photo' && v3Kind() && state.hs3_lines && !media.__hs2picked) media.removeAttribute('data-show');
    // the preview arrived: it is the picture on show, so its thumbnail is the current one
    if (on === 'on' && pv && !media.hasAttribute('data-show')) {
      media.querySelectorAll('[data-hs2-thumb], [data-hs2-thumb-preview]').forEach(function (o) { o.setAttribute('aria-current', o === pv ? 'true' : 'false'); });
    }
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
    document.addEventListener('change', function (e) {
      var inp = e.target;
      if (doHandoff.busy || !inp || inp.type !== 'file' || !inp.matches) return;
      if (!inp.matches('.tee-field--photo input[type="file"], input[type="file"][id^="tee-photo"]')) return;
      var f = inp.files && inp.files[0];
      if (!f || !/^image\//.test(f.type)) return;
      if (nativeArtworkPurchase() && inp.__hs2PreparedPhoto !== f && window.HSPhotoQuality && inp.__hs2CheckedPhoto !== f) {
        // The photo check comes first, on the device (hs-photo-quality.js): a photo that can't make
        // good artwork never reaches Teeinblue and never reserves the upload (27 Oct).
        e.preventDefault(); e.stopImmediatePropagation();
        if (keepTibPhoto.checking) return;
        keepTibPhoto.checking = f;
        photoCheck('Checking your photo on your device.');
        window.HSPhotoQuality.check(f, { timeout: 4000 }).then(function (r) {
          keepTibPhoto.checking = null;
          if (r.verdict === 'reject' && !(r.overridable && inp.__hs2Override === f)) {
            inp.value = '';
            photoCheck(r.reasons.map(function (x) { return x.message; }).join(' '), r.overridable ? function () {
              // the buyer knows their dog: the detector can miss an unusual one
              inp.__hs2Override = f;
              try { var dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; } catch (err) { return; }
              track('photo_override', {});
              inp.dispatchEvent(new Event('change', { bubbles: true }));
            } : null);
            track('photo_rejected', { reasons: r.reasons.map(function (x) { return x.code; }).join(',') });
            return;
          }
          photoCheck(r.verdict === 'warn' ? r.reasons.map(function (x) { return x.message; }).join(' ') : '');
          inp.__hs2CheckedPhoto = f;
          if (!inp.isConnected) return;
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return;
      }
      if (nativeArtworkPurchase() && inp.__hs2PreparedPhoto !== f) {
        // Capture before the vendor receives the File. Preparing is local only;
        // the sole vendor event is emitted after metadata removal succeeds.
        e.preventDefault(); e.stopImmediatePropagation();
        if (keepTibPhoto.preparing || !beginBlanketUpload()) {
          blanketPurchaseStatus('Upload held: wait for your current artwork or photo preparation to finish.');
          return;
        }
        var token = { key: artRequestKey() };
        keepTibPhoto.preparing = token;
        blanketPurchaseStatus('Preparing your photo and removing its location metadata.');
        Promise.resolve().then(function () {
          if (!window.HSArtworkPhoto || typeof DataTransfer !== 'function') throw new Error('Photo preparation is unavailable.');
          return window.HSArtworkPhoto.prepare(f);
        }).then(function (prepared) {
          if (keepTibPhoto.preparing !== token) return;
          if (!inp.isConnected || token.key !== artRequestKey() || !nativeBlanketInputsReady()) throw new Error('Your artwork choices changed.');
          var dt = new DataTransfer(); dt.items.add(prepared.file);
          inp.files = dt.files;
          inp.__hs2PreparedPhoto = prepared.file;
          state.hs3_photo_provenance = { photo: prepared.photo, width: prepared.width, height: prepared.height };
          keepTibPhoto.preparing = null;
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }).catch(function () {
          if (keepTibPhoto.preparing !== token) return;
          keepTibPhoto.preparing = null;
          resetBlanketUpload(); inp.value = '';
          blanketPurchaseStatus('No artwork was started. Use a JPEG, PNG or WebP photo up to 40 megapixels, then try again.');
        });
        return;
      }
      var preparedUpload = inp.__hs2PreparedPhoto === f;
      delete inp.__hs2PreparedPhoto;
      if (nativeArtworkPurchase() && !preparedUpload && !beginBlanketUpload()) {
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
      document.querySelectorAll('.cart-totals__tax-note small, .cart-totals__tax-note').forEach(function (n) {
        if (n.tagName !== 'SMALL' && n.querySelector('small')) return;
        var want = 'Free US shipping on every order. Tax is added at checkout.';
        if (n.textContent.trim() !== want) n.textContent = want;
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
      cartTidy.mo = new MutationObserver(function () {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; run(); }, 60);
      });
      cartTidy.mo.observe(document.body, { childList: true, subtree: true });
    }
  }
  function cartPicture(row, url) {
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
  function checkoutImageStatus(message) {
    var status = document.querySelector('[data-hs2-checkout-image-status]');
    if (status) { status.textContent = message; status.hidden = !message; }
  }
  function prepareCheckoutCart(body) {
    var config = checkoutImageConfig();
    if (!config) return null; // The new route is opt-in until its endpoint is verified.
    if (prepareCheckoutCart.pending) return Promise.reject(new Error('Checkout artwork is already being prepared.'));
    var revision = function () { return JSON.stringify([blanketReviewKey(), answer('line4'), answer('signed'), hsProps()]); };
    var identity = revision(), variant = document.querySelector('[data-hs2-variant-id]');
    var variantId = variant && variant.value;
    prepareCheckoutCart.pending = true;
    checkoutImageStatus('Preparing your saved artwork for checkout.');
    return Promise.resolve().then(function () {
      if (!window.HSCheckoutImage) throw new Error('Checkout artwork service is unavailable.');
      return window.HSCheckoutImage.prepare(body, config);
    }).then(function (prepared) {
      var currentVariant = document.querySelector('[data-hs2-variant-id]');
      if (identity !== revision() || variantId !== (currentVariant && currentVariant.value) || !cityArtSaved() || !blanketReviewAccepted() || !nativePurchaseReady() || blanketUploadPending()) throw new Error('Your artwork selection changed.');
      checkoutImageStatus('Your artwork is ready for checkout.');
      prepareCheckoutCart.pending = false;
      return prepared;
    }, function (error) {
      prepareCheckoutCart.pending = false;
      checkoutImageStatus('We could not prepare your checkout picture. Try Add to cart again. Your saved artwork does not need another upload.');
      throw error;
    }).catch(function (error) {
      prepareCheckoutCart.pending = false;
      checkoutImageStatus('We could not prepare your checkout picture. Check your saved artwork, then try Add to cart again. You do not need to upload your photo again.');
      throw error;
    });
  }
  function onCartAdd(cb) {
    (onCartAdd.cbs = onCartAdd.cbs || []).push(cb);
    if (onCartAdd.hooked) return;
    onCartAdd.hooked = true;
    var fire = function (body) {
      var items = body && (Array.isArray(body.items) ? body.items : body.variant_id ? [body] : null);
      setTimeout(function () { onCartAdd.cbs.forEach(function (f) { try { f(items); } catch (e) { /* keep going */ } }); }, 400);
    };
    var isAdd = function (u) { return /\/cart\/add(\.js)?(?:[?#]|$)/.test(String(u || '')); };
    if (window.fetch) {
      var f0 = window.fetch;
      window.fetch = function (input) {
        var u = typeof input === 'string' ? input : (input && input.url);
        var args = arguments;
        if (isAdd(u) && args[1] && typeof args[1].body === 'string') { args = [input, Object.assign({}, args[1], { body: withHsProps(args[1].body) })]; }
        var context = this, preparation = isAdd(u) ? prepareCheckoutCart(args[1] && args[1].body) : null;
        var pr = preparation ? preparation.then(function (body) { return f0.call(context, input, Object.assign({}, args[1], {body: body})); }) : f0.apply(this, args);
        if (isAdd(u)) pr.then(function (r) {
          if (!r || !r.ok) return;
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
        if (this.__hs2add && typeof b === 'string') arguments[0] = withHsProps(b);
        if (this.__hs2add) this.addEventListener('load', function () {
          if (this.status < 200 || this.status >= 300) return;
          var body = null;
          try { body = JSON.parse(this.responseText); } catch (e) { /* not JSON */ }
          fire(body);
        });
        var xhr = this, generation = this.__hs2generation;
        var preparation = this.__hs2add ? prepareCheckoutCart(arguments[0]) : null;
        if (!preparation) return send0.apply(this, arguments);
        preparation.then(function (body) {
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
  function announceAdd(items) {
    var list = queueGet().length > 0;
    var fallback = function () { if (!list) showNext('In your cart', 'Free US shipping on every order.', shopRoot() + 'checkout', 'Check out'); };
    if (!document.querySelector('cart-icon, cart-drawer-component')) { fallback(); return; }
    var settle = {};
    var promise = new Promise(function (resolve, reject) { settle.resolve = resolve; settle.reject = reject; });
    promise.catch(function () { /* each listener handles its own */ });
    var ev;
    try { ev = new Event('shopify:cart:lines-update', { bubbles: true, cancelable: true }); } catch (e) { fallback(); return; }
    ev.action = list ? 'update' : 'add';
    ev.context = 'product';
    ev.promise = promise;
    if (!list) ev.lines = (items || []).filter(function (it) { return it && it.variant_id; }).map(function (it) { return { merchandiseId: GID + 'ProductVariant/' + it.variant_id, quantity: it.quantity || 1 }; });
    document.dispatchEvent(ev);
    fetch(shopRoot() + 'cart.js', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('cart ' + r.status); return r.json(); })
      .then(function (cart) {
        settle.resolve({ cart: cartForEvent(cart), detail: { items: cart.items, itemCount: cart.item_count, source: 'hs2-personalizer', didError: false } });
        // read back, then say it: the gift is in the cart, and the other gifts are one tap away
        var dog = answer('dog');
        if (!list && (cart.items || []).length) showNext(dog ? possessive(dog) + ' gift is in your cart.' : 'Your gift is in your cart.', 'Free US shipping on every order.', shopRoot() + '?step=choose', 'Add another gift');
      })
      .catch(function (e) { settle.reject(e); fallback(); });
  }
  function hideNext() {
    var bar = document.querySelector('[data-hs2-next]');
    if (bar) bar.remove();
    document.documentElement.classList.remove('hs2-has-next');
    giftFit();
  }
  function showNext(title, sub, href, label) {
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
  function queueBar() {
    var q = queueGet();
    if (!q.length) return;
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
          showNext('All ' + q.length + ' gifts are in your cart', 'Free US shipping on every order.', shopRoot() + 'checkout', 'Check out');
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
  function personalizeCatalogCards() {
    var handles = ['your-dogs-illustrated-mug', 'your-dogs-personality-blanket', 'your-dogs-portrait', 'the-morning-mug', 'the-couch-blanket', 'the-framed-print', 'the-tree-ornament'];
    document.querySelectorAll('product-card quick-add-component').forEach(function (quick) {
      var card = quick.closest('product-card');
      var productLink = card && card.querySelector('a[href*="/products/"]');
      if (!productLink || handles.indexOf(handleOf(productLink.href)) === -1) return;
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

  function layout() { stickyHead.h = stickyHead(); heroTop(); fitPoster(); ticker(); fitFaq(); }
  function init() {
    if ((cityArtPreview() || nativeArtworkPurchase()) && window.HSArtworkChoices) {
      window.HSArtworkChoices.mount(document.querySelector('[data-hs-art-choices]'), {wordFree: blanketArtPreview(), nativeUpload: nativeArtworkPurchase()});
      window.addEventListener('hs-artwork-choices', artworkChoicesChanged);
    }
    guardSearchFocus();
    bindBlanketRecovery();
    guardCatalogQuickAdd();
    bindInputs(); render(); sticky(); gallery(); clearHeader();
    steps(); zoom(); approve(); faq(); carousels(); clock(); urgency(); reveal(); cycleNames(); leakAutoplay();
    shop(); giftList(); confirmAdds(); previewOnPhoto(); warmPhotoCheck(); keepTibPhoto(); guardGiftPhoto(); window.addEventListener('hs-artwork-choices', function () { journeyCard(); }); guardMugProof();
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
