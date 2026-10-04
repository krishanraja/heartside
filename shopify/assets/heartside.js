/* Heartside homepage behaviour. Loaded (deferred) by snippets/hs-head.liquid.
   Vanilla JS, no dependencies. Every feature is optional: if a section is not on
   the page, its code does nothing. Re-initialises when a section is edited in the
   theme editor. */
(function () {
  'use strict';
  if (window.__heartside) return; // every hs- section includes this file; run it once
  window.__heartside = true;

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ countdown (real date) */
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function initCountdown(root) {
    var bar = root.querySelector('[data-hs-ends]') || (root.matches && root.matches('[data-hs-ends]') ? root : null);
    if (!bar || bar.__hs) return; bar.__hs = true;
    var ends = Date.parse(bar.getAttribute('data-hs-ends'));
    var out = bar.querySelector('[data-hs-count]');
    if (isNaN(ends)) return;
    function tick() {
      var ms = ends - Date.now();
      if (ms <= 0) { bar.hidden = true; return; }
      var m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
      var text = d >= 2 ? 'Ends in ' + plural(d, 'day')
        : d === 1 ? 'Ends in 1 day, ' + plural(h, 'hour')
        : h >= 1 ? 'Ends in ' + plural(h, 'hour') + ', ' + plural(mm, 'minute')
        : 'Ends in ' + plural(Math.max(mm, 1), 'minute');
      if (out) out.textContent = text;
    }
    tick(); setInterval(tick, 30000);
  }

  /* ------------------------------------------------- fade-and-rise reveal */
  function initReveal(root) {
    var els = root.querySelectorAll('[data-hs-reveal]:not(.is-in)');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------- the ornament maker */
  function possessive(name) { return /s$/i.test(name) ? name + "'" : name + "'s"; }
  function initMaker(root) {
    var maker = root.querySelector('[data-hs-maker]');
    if (!maker || maker.__hs) return; maker.__hs = true;

    var input = maker.querySelector('[data-hs-name-in]');
    var wrap = maker.querySelector('.hs-input-wrap');
    var nameOut = maker.querySelector('[data-hs-name-out]');
    var ctaName = maker.querySelector('[data-hs-cta-name]');
    var cta = maker.querySelector('[data-hs-cta]');
    var photo = maker.querySelector('[data-hs-photo]');
    var orn = maker.querySelector('[data-hs-orn]');
    var flip = maker.querySelector('[data-hs-flip]');
    var flipLabel = maker.querySelector('[data-hs-flip-label]');
    var upload = maker.querySelector('[data-hs-upload]');
    var share = maker.querySelector('[data-hs-share]');
    var status = maker.querySelector('[data-hs-status]');
    var fallback = maker.getAttribute('data-default-name') || 'Biscuit';
    var baseUrl = cta ? cta.getAttribute('href') : '';
    var face = maker.querySelector('.hs-orn__front');

    function fit() { // shrink very wide names so they stay inside the safe area
      if (!nameOut || !face) return;
      nameOut.style.fontSize = '';
      var max = face.clientWidth * 0.6;
      if (nameOut.scrollWidth > max && nameOut.scrollWidth > 0) {
        nameOut.style.fontSize = (11.2 * max / nameOut.scrollWidth).toFixed(2) + 'cqw';
      }
    }
    function render() {
      var name = (input && input.value.trim()) || fallback;
      if (nameOut) nameOut.textContent = name;
      if (ctaName) ctaName.textContent = possessive(name);
      if (cta && baseUrl && input && input.value.trim()) {
        var sep = baseUrl.indexOf('?') === -1 ? '?' : '&';
        cta.setAttribute('href', baseUrl + sep + 'name=' + encodeURIComponent(name));
      } else if (cta) { cta.setAttribute('href', baseUrl); }
      fit();
    }
    if (input) {
      var saved = store.get('hs-dog-name');
      if (saved && !input.value) { input.value = saved; if (wrap) wrap.classList.remove('is-hinting'); }
      input.addEventListener('input', function () {
        if (wrap) wrap.classList.remove('is-hinting');
        store.set('hs-dog-name', input.value.trim());
        render();
      });
      input.addEventListener('focus', function () { if (wrap) wrap.classList.remove('is-hinting'); });
    }

    maker.querySelectorAll('[data-hs-face]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked || !photo) return;
        photo.src = radio.getAttribute('data-hs-face');
        photo.style.objectPosition = '50% 50%';
        if (orn) orn.classList.remove('is-flipped');
        if (flip) { flip.setAttribute('aria-pressed', 'false'); if (flipLabel) flipLabel.textContent = 'Turn it over'; }
      });
    });

    if (upload) {
      upload.addEventListener('change', function () {
        var file = upload.files && upload.files[0];
        if (!file || !photo) return;
        if (!/^image\//.test(file.type)) { if (status) status.textContent = 'That file is not a photo. Try a JPG or PNG.'; return; }
        photo.src = URL.createObjectURL(file);
        photo.style.objectPosition = '50% 38%';
        maker.querySelectorAll('[data-hs-face]').forEach(function (r) { r.checked = false; });
        if (orn) orn.classList.remove('is-flipped');
        if (status) status.textContent = 'That photo stays on your device. You add it again when you order.';
      });
    }

    if (flip && orn) {
      flip.addEventListener('click', function () {
        var on = !orn.classList.contains('is-flipped');
        orn.classList.toggle('is-flipped', on);
        flip.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (flipLabel) flipLabel.textContent = on ? 'Turn it back' : 'Turn it over';
      });
    }

    if (share) share.addEventListener('click', function () { shareOrnament(maker, status); });

    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
  }

  /* Draw the front of the ornament to a canvas so it can be shared as an image.
     Falls back to sharing the link, then to copying it. */
  function loadImg(src) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); }; im.onerror = rej; im.src = src;
    });
  }
  function drawCover(ctx, im, x, y, w, h, posY) {
    var s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) * posY, dw, dh);
  }
  function composeCanvas(maker) {
    var S = 1080, R = 470, cx = S / 2, cy = S / 2 - 10;
    var photo = maker.querySelector('[data-hs-photo]');
    var frameSrc = maker.getAttribute('data-frame');
    var name = (maker.querySelector('[data-hs-name-out]') || {}).textContent || 'Biscuit';
    var fontsReady = document.fonts ? Promise.all([
      document.fonts.load('italic 500 100px "HS Cormorant"'), document.fonts.load('500 40px "HS Cormorant"')
    ]) : Promise.resolve();
    return Promise.all([loadImg(photo.currentSrc || photo.src), loadImg(frameSrc), fontsReady]).then(function (r) {
      var c = document.createElement('canvas'); c.width = S; c.height = S;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fbf6f1'; ctx.fillRect(0, 0, S, S);
      var d = R * 2, ox = cx - R, oy = cy - R;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#fbf6f1'; ctx.fillRect(ox, oy, d, d);
      drawCover(ctx, r[0], ox + d * 0.253, oy + d * 0.148, d * 0.493, d * 0.47, photo.src.indexOf('blob:') === 0 ? 0.38 : 0.5);
      ctx.drawImage(r[1], ox, oy, d, d);
      ctx.fillStyle = '#121010'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var size = d * 0.112;
      ctx.font = 'italic 500 ' + size + 'px "HS Cormorant", Georgia, serif';
      while (ctx.measureText(name).width > d * 0.6 && size > 20) { size -= 2; ctx.font = 'italic 500 ' + size + 'px "HS Cormorant", Georgia, serif'; }
      ctx.fillText(name, cx, oy + d * 0.723);
      ctx.font = '500 ' + (d * 0.0573) + 'px "HS Cormorant", Georgia, serif';
      ctx.fillText('is my person.', cx, oy + d * 0.812);
      ctx.restore();
      ctx.strokeStyle = 'rgba(110,80,60,0.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#6b605b'; ctx.font = '500 26px "HS DM Sans", system-ui, sans-serif';
      ctx.fillText(maker.getAttribute('data-share-domain') || '', cx, S - 34);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }
  function shareOrnament(maker, status) {
    var url = maker.getAttribute('data-share-url') || window.location.href;
    var text = maker.getAttribute('data-share-text') || "Who's your person?";
    function say(t) { if (status) status.textContent = t; }
    composeCanvas(maker).then(function (blob) {
      var file = new File([blob], 'my-person.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], text: text + ' ' + url });
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my-person.png';
      document.body.appendChild(a); a.click(); a.remove();
      say('Saved as an image. Send it wherever the group chat lives.');
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return;
      if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { say('Link copied. Paste it in the group chat.'); });
    });
  }

  /* ------------------------------------------------ sticky mobile buy bar */
  function initSticky(root) {
    var bar = document.querySelector('[data-hs-sticky]');
    if (!bar || bar.__hs || !('IntersectionObserver' in window)) return; bar.__hs = true;
    var hero = document.querySelector('[data-hs-hero]');
    var buy = document.querySelector('[data-hs-cta]');
    var foot = document.querySelector('footer, .shopify-section-group-footer-group');
    var seen = { hero: true, buy: false, foot: false };
    var link = bar.querySelector('a');
    function update() {
      var on = !seen.hero && !seen.buy && !seen.foot;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (link) link.tabIndex = on ? 0 : -1;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var key = e.target === hero ? 'hero' : e.target === buy ? 'buy' : 'foot';
        seen[key] = e.isIntersecting;
      });
      update();
    });
    if (hero) io.observe(hero); else seen.hero = false;
    if (buy) io.observe(buy);
    if (foot) io.observe(foot);
    update();
  }

  function init(root) {
    root = root || document;
    initCountdown(root); initReveal(root); initMaker(root); initSticky(root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
