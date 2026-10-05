// Heartside funnel pixel: a Shopify custom pixel (Settings > Customer events > Add custom pixel).
// Paste this whole file into the code box. shopify/README.md, "Funnel pixel", has the steps.
//
// The theme publishes its funnel steps with Shopify.analytics.publish('hs2_<name>', data)
// (shopify/assets/hs2.js, function track). This pixel forwards them to Meta and TikTok as
// custom events, so ads can be judged on the steps before checkout: who typed a name, how
// far they got through the review, who approved it.
//
// Page views, add to cart, checkout and purchase are NOT sent here. Shopify's Facebook &
// Instagram channel (and TikTok's channel, if installed) send those with their server-side
// APIs. Sending them twice would double-count.
//
// Privacy: only the fields in SAFE below leave the store. The dog's name and the shopper's
// name never do. In Shopify, set this pixel's permission to "Required: marketing", so it
// only runs for shoppers who allow marketing cookies.

// ---- Pixel IDs. Leave empty to switch a platform off; with both empty this does nothing. ----
const META_PIXEL_ID = ''; // Meta Events Manager > Data sources > your pixel > Dataset ID (digits)
const TIKTOK_PIXEL_ID = ''; // TikTok Events Manager > Web events > your pixel > Pixel ID

// The events the theme publishes, as hs2_<name>
const EVENTS = [
  'hs2_name_entered',     // typed the dog's name in the hero
  'hs2_review_step',      // moved to a step of the 5-step review ({ step })
  'hs2_names_needed',     // pressed Approve with a name missing ({ missing })
  'hs2_approve_clicked',  // approved the review and went to the poster
  'hs2_photo_attached',   // attached the dog's headshot
  'hs2_story_card',       // saved a free story card ({ card })
  'hs2_caption_copied',   // copied the story caption ({ card })
  'hs2_link_shared',      // shared the review link ({ card })
  'hs2_faq_open',         // opened an FAQ ticket ({ question })
];

// Fields that may be forwarded. Anything else in the event data is dropped.
const SAFE = ['step', 'card', 'question', 'missing'];

// Approving the review is the shopper customizing the product, which both platforms have a
// standard event for. Standard events can be optimized for without setting up a custom
// conversion first, so this one is sent as both.
const STANDARD = { hs2_approve_clicked: 'CustomizeProduct' };

function clean(data) {
  const out = {};
  if (data && typeof data === 'object') {
    for (const k of SAFE) {
      if (data[k] !== undefined && data[k] !== null && data[k] !== '') out[k] = String(data[k]).slice(0, 100);
    }
  }
  return out;
}

if (META_PIXEL_ID) {
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('set', 'autoConfig', false, META_PIXEL_ID); // no automatic events from inside the sandbox
  window.fbq('init', META_PIXEL_ID);
}

if (TIKTOK_PIXEL_ID) {
  /* eslint-disable */
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e, n) {
      var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      var s = d.createElement('script'); s.type = 'text/javascript'; s.async = !0; s.src = r + '?sdkid=' + e + '&lib=' + t;
      var f = d.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f);
    };
    ttq.load(TIKTOK_PIXEL_ID); // no ttq.page(): the TikTok channel sends page views
  }(window, document, 'ttq');
  /* eslint-enable */
}

if (META_PIXEL_ID || TIKTOK_PIXEL_ID) {
  EVENTS.forEach((name) => {
    analytics.subscribe(name, (event) => {
      const data = clean(event.customData);
      if (META_PIXEL_ID && window.fbq) {
        window.fbq('trackCustom', name, data);
        if (STANDARD[name]) window.fbq('track', STANDARD[name], data);
      }
      if (TIKTOK_PIXEL_ID && window.ttq) {
        window.ttq.track(name, data);
        if (STANDARD[name]) window.ttq.track(STANDARD[name], data);
      }
    });
  });
}
