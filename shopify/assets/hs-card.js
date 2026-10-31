/* The card from the dog (sections/hs-card.liquid): draws the card from d, base64url JSON
   {img, note, dog, to}. Only Teeinblue's or Shopify's CDN may supply the picture. With ?panel= it draws
   that one print panel and sets data-hsc-ready once the picture and fonts are in, for the renderer. */
(function () {
  'use strict';
  var root = document.documentElement, body = document.body;
  var q = new URLSearchParams(location.search);
  var data = null;
  try {
    var raw = (q.get('d') || '').replace(/-/g, '+').replace(/_/g, '/');
    data = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch (e) { data = null; }
  var okImg = data && /^https:\/\/(cdn\.teeinblue\.com|cdn\.shopify\.com)\//.test(String(data.img || ''));
  var note = data && String(data.note || '').slice(0, 500).trim();
  if (!okImg || !note) {
    document.querySelector('[data-hsc]').hidden = true;
    document.querySelector('[data-hsc-missing]').hidden = false;
    return;
  }
  var dog = String(data.dog || '').slice(0, 40).trim();
  var to = String(data.to || '').slice(0, 40).trim();
  var img = document.querySelector('[data-hsc-img]');
  img.alt = dog ? 'A painting of ' + dog : 'A painting of the dog';
  // a mug's wrap is a wide strip: it shows in a wide window above the greeting; a portrait fills the front
  img.addEventListener('load', function () { if (img.naturalWidth / img.naturalHeight > 1.25) document.querySelector('.hsc-front').classList.add('is-wide'); });
  img.src = data.img;
  document.querySelector('[data-hsc-note]').textContent = note;
  document.querySelector('[data-hsc-to]').textContent = to ? to + ',' : '';
  document.querySelector('[data-hsc-sign]').textContent = dog ? 'Love, ' + dog : 'Love';
  document.querySelector('[data-hsc-from]').textContent = dog ? 'From ' + dog : '';
  var panel = q.get('panel');
  if (panel) {
    root.classList.add('hsc--print'); body.classList.add('hsc--print');
    var el = document.querySelector('[data-panel="' + panel + '"]');
    if (el) el.classList.add('is-on');
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    var pic = panel === 'front' ? (img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; })) : Promise.resolve();
    Promise.all([fonts, pic]).then(function () { root.setAttribute('data-hsc-ready', '1'); });
    return;
  }
  body.classList.add('is-front');
  var actions = document.querySelector('[data-hsc-actions]');
  actions.hidden = false;
  var open = document.querySelector('[data-hsc-open]');
  open.addEventListener('click', function () {
    var isOpen = body.classList.toggle('is-open');
    body.classList.toggle('is-front', !isOpen);
    open.textContent = isOpen ? 'See the front' : 'Open the card';
  });
  document.querySelector('[data-hsc-print]').addEventListener('click', function () {
    body.classList.add('is-front', 'is-open');
    window.print();
  });
})();
