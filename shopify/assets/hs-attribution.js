/* Where a buyer came from, carried to the order (growth engine, 16 Nov 2026).
   Shopify keeps the visit's landing page with its utm_* as the order's landing site, but only for the visit
   that ends in the order: a buyer who taps a post, leaves, and comes back direct two days later reaches the
   order as direct. So when a page opens with utm_* in its address, this writes them to the cart's attributes,
   which Shopify copies to the order (Additional details, and note_attributes in the Admin API):
     utm_source, utm_medium, utm_campaign, utm_content, utm_term, hs_landing (the page and its ?hook=),
     hs_landed (the day, YYYY-MM-DD).
   The newest tagged visit wins, and a key it does not carry is cleared, so two campaigns never mix. Only
   campaign words travel: no click ids, no names, nothing typed. Nothing else in the theme writes cart
   attributes (checked 16 Nov), and the order workflows read line properties only (tools/qc/order_qc.py).
   Loaded by sections/hs-social.liquid, sections/hs-journey.liquid and sections/hs2-product.liquid. */
(function () {
  'use strict';
  if (window.__hsAttribution) return;
  window.__hsAttribution = true;
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  // campaign words only: letters, digits and a little punctuation, at most 100 characters each
  function clean(v) { return String(v == null ? '' : v).replace(/[^\w\-.~:/?=&%+ ]/g, '').slice(0, 100); }
  var q;
  try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
  var attrs = {}, any = false;
  KEYS.forEach(function (k) { var v = clean(q.get(k)).trim(); attrs[k] = v; if (v) any = true; });
  if (!any || !window.fetch) return;
  var landing = window.location.pathname;
  if (q.get('view')) landing += '?view=' + clean(q.get('view'));
  if (q.get('hook')) landing += (landing.indexOf('?') === -1 ? '?' : '&') + 'hook=' + clean(q.get('hook'));
  attrs.hs_landing = clean(landing);
  var d = new Date();
  attrs.hs_landed = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  /* once per campaign in this tab: a reload, Back, or the journey carrying the same utm_* on to the homepage and
     the gift page does not write again, so hs_landing stays the page the post opened */
  var sig = KEYS.map(function (k) { return attrs[k]; }).join('|');
  try { if (window.sessionStorage.getItem('hs-attribution') === sig) return; } catch (e) { /* private mode: write anyway */ }
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  window.fetch(root + 'cart/update.js', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ attributes: attrs })
  }).then(function (r) {
    if (r.ok) { try { window.sessionStorage.setItem('hs-attribution', sig); } catch (e) { /* nothing to remember it in */ } }
  }).catch(function () { /* the order still has Shopify's own landing site */ });
})();
