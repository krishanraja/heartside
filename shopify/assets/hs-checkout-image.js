/* Register the existing native artwork for checkout. This never uploads a photo or generates art. */
(function (root) {
  'use strict';
  if (root.HSCheckoutImage) return;
  function fail() { return new Error('Checkout artwork is not ready. Please try Add to cart again. Your saved artwork does not need another upload.'); }
  function endpoint(value) {
    var u = new URL(value, root.location.href);
    if (!value || u.protocol !== 'https:' || u.origin !== new URL(root.location.href).origin || !/^\/apps\/[^/]+/.test(u.pathname) || u.username || u.password || u.hash) throw fail();
    return u.href;
  }
  function ownImage(value, prefix) {
    if (!/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/(?:\d+\/){3}files\/$/.test(prefix || '')) return false;
    try {
      var u = new URL(value), p = new URL(prefix);
      return u.origin === p.origin && !u.username && !u.password && !u.hash && (!u.search || /^\?v=\d+$/.test(u.search)) && u.pathname.indexOf(p.pathname) === 0 && u.pathname.length > p.pathname.length && !/%2f|%5c/i.test(u.pathname);
    } catch (e) { return false; }
  }
  function prepare(body, options) {
    var parsed, items, target;
    try {
      target = endpoint(options.endpoint);
      if (!ownImage(options.cdnPrefix + 'validation.jpg', options.cdnPrefix)) throw fail();
      parsed = JSON.parse(body);
      items = Array.isArray(parsed.items) ? parsed.items : [parsed];
      if (!items.length || items.length > 10) throw fail();
      items.forEach(function (item) {
        if (!item || !/^\d+$/.test(String(item.id)) || !item.properties || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(item.properties._customization_id || '')) throw fail();
      });
    } catch (e) { return Promise.reject(fail()); }
    var fetcher = options.fetch || root.fetch.bind(root), deadline = Date.now() + 90000;
    function register(item, attempt) {
      var id = item.properties._customization_id, variant = String(item.id), timer;
      if (Date.now() >= deadline || attempt >= 12) return Promise.reject(fail());
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      // Shopify signs app-proxy query parameters, not the JSON body. Bind both copies.
      var requestUrl = new URL(target);
      requestUrl.searchParams.set('customizationId', id);
      requestUrl.searchParams.set('variantId', variant);
      var request = Promise.resolve().then(function () {
        return fetcher(requestUrl.href, {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'same-origin', cache: 'no-store', signal: controller ? controller.signal : undefined, body: JSON.stringify({customizationId: id, variantId: variant})});
      }).then(function (response) {
        if (!response || (response.status !== 200 && response.status !== 202 && response.status !== 503)) { if (root.console) root.console.warn('Checkout registration HTTP status', response ? response.status : 0); throw fail(); }
        return response.json().then(function (data) { return {status: response.status, data: data}; });
      });
      var timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () { if (controller) controller.abort(); if (root.console) root.console.warn('Checkout registration request timed out'); reject(fail()); }, Math.min(20000, Math.max(1, deadline - Date.now())));
      });
      return Promise.race([request, timeout]).then(function (response) {
          clearTimeout(timer);
          var data = response.data || {};
          // Teeinblue serves its copy of a design a moment after painting it, and until then the
          // server answers 503 preview_unavailable (28 Oct, Recording 4: the redo's add failed on
          // it). That is a wait inside the same budget: registration is asked again, nothing uploads.
          // A transient lookup, create or readback failure must restart the same idempotent
          // registration. A valid ready response is still required before the cart can change.
          var transient = /^(preview_unavailable|image_lookup_failed|image_creation_failed|image_readback_failed)$/.test(data.code || '');
          var wait = response.status === 202 && data.state === 'pending' && (data.retryAfterSeconds === 3 || data.retryAfterSeconds === 5) ? data.retryAfterSeconds
            : response.status === 503 && transient ? (data.retryAfterSeconds === 3 ? 3 : 5) : 0;
          if (response.status === 503 && !wait) { if (root.console) root.console.warn('Checkout registration rejected', /^[a-z_]{1,48}$/.test(data.code || '') ? data.code : 'unknown'); throw fail(); }
          if (wait) {
            if (Date.now() + wait * 1000 >= deadline) throw fail();
            if (typeof options.onPending === 'function') { try { options.onPending(attempt + 1); } catch (e) { /* words only */ } }
            return new Promise(function (resolve) { setTimeout(resolve, wait * 1000); }).then(function () { return register(item, attempt + 1); });
          }
          var props = data.properties, bundle = id + '-' + variant;
          if (response.status !== 200 || data.state !== 'ready' || data.customizationId !== id || data.variantId !== variant || !/^gid:\/\/shopify\/MediaImage\/\d+$/.test(data.fileId || '') || !ownImage(data.imageUrl, options.cdnPrefix) || !props || props._hs_checkout_image !== data.imageUrl || props._hs_checkout_parent !== 'true' || props._hs_checkout_bundle_id !== bundle) throw fail();
          item.properties._hs_checkout_image = data.imageUrl;
          item.properties._hs_checkout_parent = 'true';
          item.properties._hs_checkout_bundle_id = bundle;
      }).then(function (result) { clearTimeout(timer); return result; }, function () { clearTimeout(timer); throw fail(); });
    }
    // One registration at a time keeps request volume bounded for a multi-item add.
    return items.reduce(function (chain, item) { return chain.then(function () { return register(item, 0); }); }, Promise.resolve()).then(function () { return JSON.stringify(parsed); });
  }
  root.HSCheckoutImage = {prepare: prepare};
})(window);
