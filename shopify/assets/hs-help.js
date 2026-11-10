/* Heartside help: a friendly help assistant in the bottom-right corner, on every page (Krish, 10 Nov 2026:
   "super friendly, reassuring", with a regular guy in a call-center headset as its face, assets/hs-help-agent.svg).
   It says plainly that it is an automated assistant, and a real person is always one tap away.
   One-tap chips answer the common questions at once, from the answers below (no AI, no wait).
   Anything typed goes to the help workflow (n8n/HELP-CHAT.md), which answers only about Heartside.
   When the buyer asks for a person, or the chat runs long, the assistant asks for an email and the whole
   chat goes to the team, who reply by email within 6 hours.
   The workflow address comes from the memo strip's "Help chat address" setting; blank keeps this off.
   Copy rules: no exclamation marks, no em dashes, US spelling (tools/preview/copy-lint.mjs). */
(function () {
  'use strict';
  var root = document.querySelector('[data-hs-help]');
  if (!root || root.__hsHelp) return;
  root.__hsHelp = true;
  var URL_ = root.getAttribute('data-url') || '';
  if (!/^https:\/\//.test(URL_)) return;
  // the memo strip sits in the header, which can be sticky or transformed: fixed must mean the screen
  document.body.appendChild(root);

  var KEY = 'hs-help-v1';
  var LONG = 8;            // user messages before the assistant offers a person
  var MAX_LEN = 600;       // characters in one message
  var PERSON = /\b(human|person|someone|somebody|real|agent|support|staff|team|owner|talk to|speak to|speak with|call me|phone|contact|get in touch|reach (you|out)|email me)\b/i;

  // Answers for the chips, from the live shipping and refund policies and llms.txt (10 Nov 2026).
  var A = {
    how: {
      q: 'How does it work?',
      a: "You add one clear photo of your dog and answer a few taps about them. Our painter turns the photo into artwork in the look and feel you pick, and you see the painting before you buy. A person checks every order before it prints. In the box there is a short note in your dog's own voice, and you also get it as a free digital card.",
      chips: ['prices', 'xmas', 'start']
    },
    prices: {
      q: 'What do the gifts cost?',
      a: "Illustrated mug, $45. Portrait (12 x 18 in), $59 unframed or $119 framed in black, white or red oak. Sherpa blanket (50 x 60 in), $129. Two gifts save 15% and three or more save 20%, applied automatically. Shipping is free on every US order.",
      chips: ['xmas', 'how', 'start']
    },
    xmas: {
      q: 'Will it arrive by Christmas?',
      a: "Good news: order by December 4 for Christmas delivery to a US address. Even at the slowest times, an order placed on December 4 arrives by December 22. Orders placed later may arrive after December 25.",
      chips: ['ship', 'prices', 'start']
    },
    ship: {
      q: 'How does shipping work?',
      a: "Shipping is free on every US order, and we ship to US addresses only. Printing usually takes 2 to 5 business days, then delivery another 3 to 7. You get a tracking email when each parcel ships, and different gifts can arrive separately.",
      chips: ['order', 'returns', 'person']
    },
    returns: {
      q: 'What if something is wrong?',
      a: "Don't worry, we've got you. If your gift arrives misprinted, damaged or not what you ordered, tell us within 30 days of delivery with a photo, and we refund you in full or remake it free. You do not need to send anything back. Because every piece is made for your dog, we cannot take returns for a change of mind once it has gone to print. You can cancel for a full refund until then.",
      chips: ['person', 'ship', 'how']
    },
    order: {
      q: 'Where is my order?',
      a: "Happy to help. Every order is printed just for you, which usually takes 2 to 5 business days, then 3 to 7 more to arrive. The tracking link is in the email we send when it ships. If it has not moved for 5 business days, or you want to change your address before it prints, the team can help.",
      chips: ['person', 'ship']
    },
    photo: {
      q: 'What photo works best?',
      a: "One dog, facing the camera, in good daylight, with their face sharp and filling a good part of the picture. A phone photo is fine. If a photo won't work, you'll be told why before anything is made, so there's no risk.",
      chips: ['how', 'start']
    }
  };
  var CHIP_LABEL = { how: 'How it works', prices: 'Prices', xmas: 'Christmas delivery', ship: 'Shipping', returns: 'Returns and refunds', order: 'Where is my order?', photo: 'Best photo', person: 'Talk to a person', start: 'Start a gift' };
  var FIRST = ['how', 'prices', 'xmas', 'order', 'returns', 'person'];

  // ---- state, kept for this visit across pages (never relied on)
  var st = { sid: '', open: false, msgs: [], chips: FIRST.slice(), form: false, sent: '', users: 0, offered: false };
  try { var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (saved && Array.isArray(saved.msgs)) st = Object.assign(st, saved); } catch (e) {}
  if (!st.sid) st.sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  // ---- the parts
  var avatarSrc = root.getAttribute('data-avatar') || '';
  var face = avatarSrc ? '<img src="' + avatarSrc.replace(/"/g, '') + '" alt="" width="44" height="44" decoding="async">' : '';
  root.innerHTML =
    '<button type="button" class="hs-help__launch" aria-expanded="false" aria-controls="hs-help-panel">' +
      '<span class="hs-help__face" aria-hidden="true">' + face + '<span class="hs-help__dot"></span></span>' +
      '<span class="hs-help__launch-label">Questions? We\'re here to help</span>' +
    '</button>' +
    '<section class="hs-help__panel" id="hs-help-panel" role="dialog" aria-modal="false" aria-labelledby="hs-help-title" hidden>' +
      '<header class="hs-help__head">' +
        '<span class="hs-help__grab" aria-hidden="true"></span>' +
        '<span class="hs-help__face hs-help__face--head" aria-hidden="true">' + face + '<span class="hs-help__dot"></span></span>' +
        '<div class="hs-help__titles"><h2 class="hs-help__title" id="hs-help-title">Heartside Help</h2>' +
        '<p class="hs-help__sub">Instant answers from our help assistant. Real people are one tap away.</p></div>' +
        '<button type="button" class="hs-help__close" aria-label="Close help">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="hs-help__log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="hs-help__chips" role="group" aria-label="Quick questions"></div>' +
      '<form class="hs-help__handoff" hidden novalidate>' +
        '<p class="hs-help__handoff-lead">Leave your email and someone from Heartside will write back within 6 hours. We send them this chat, so you do not need to repeat yourself.</p>' +
        '<label class="hs-help__field"><span>Your email</span><input type="email" name="email" autocomplete="email" inputmode="email" required maxlength="120"></label>' +
        '<label class="hs-help__field"><span>Your name <em>(optional)</em></span><input type="text" name="name" autocomplete="name" maxlength="80"></label>' +
        '<p class="hs-help__error" role="alert" hidden></p>' +
        '<div class="hs-help__handoff-actions"><button type="submit" class="hs-help__primary">Send to the team</button>' +
        '<button type="button" class="hs-help__ghost" data-hs-help-cancel>Not now</button></div>' +
      '</form>' +
      '<form class="hs-help__compose">' +
        '<label class="hs-help__sr" for="hs-help-input">Ask a question</label>' +
        '<textarea id="hs-help-input" rows="1" maxlength="' + MAX_LEN + '" placeholder="Type your question" enterkeyhint="send"></textarea>' +
        '<button type="submit" class="hs-help__send" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</form>' +
    '</section>';

  var launch = root.querySelector('.hs-help__launch');
  var panel = root.querySelector('.hs-help__panel');
  var log = root.querySelector('.hs-help__log');
  var chipsEl = root.querySelector('.hs-help__chips');
  var handoff = root.querySelector('.hs-help__handoff');
  var compose = root.querySelector('.hs-help__compose');
  var input = compose.querySelector('textarea');
  var errEl = handoff.querySelector('.hs-help__error');
  var busy = false;
  // phones and tablets: focusing a field opens the keyboard over the chat, so nothing is focused by itself
  // there; the buyer taps the field when they want to type (Krish, 10 Nov)
  var touchy = !!(window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches);
  var titleEl = panel.querySelector('.hs-help__title'); titleEl.setAttribute('tabindex', '-1');
  function focusSoon(el) { setTimeout(function () { (touchy ? titleEl : el).focus({ preventScroll: true }); }, 30); }

  var GREETING = "Hi there, welcome to Heartside. I'm the help assistant, and I'm happy to help with anything: your photo, the gifts, delivery or an order.\n\nTap a question below or type your own. And if you'd rather talk to a real person, that's one tap away.";

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function bubble(m) {
    var b = el('div', 'hs-help__msg hs-help__msg--' + (m.role === 'user' ? 'me' : 'buddy'));
    String(m.text).split(/\n{2,}/).forEach(function (p) { b.appendChild(el('p', null, p)); });
    return b;
  }
  function drawAll() {
    log.textContent = '';
    log.appendChild(bubble({ role: 'assistant', text: GREETING }));
    st.msgs.forEach(function (m) { log.appendChild(bubble(m)); });
    drawChips();
    handoff.hidden = !st.form || !!st.sent;
    panel.classList.toggle('has-form', !!st.form && !st.sent);
    compose.hidden = !!st.form && !st.sent;
    scroll();
  }
  function scroll() { requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; }); }
  function add(role, text) {
    var m = { role: role, text: String(text).slice(0, 2000) };
    st.msgs.push(m); if (st.msgs.length > 40) st.msgs = st.msgs.slice(-40);
    var n = bubble(m); n.classList.add('is-new'); log.appendChild(n); save(); scroll();
  }
  function drawChips() {
    chipsEl.textContent = '';
    (st.form || st.sent ? [] : st.chips).forEach(function (k) {
      if (!CHIP_LABEL[k]) return;
      var c = el('button', 'hs-help__chip' + (k === 'person' ? ' hs-help__chip--person' : ''), CHIP_LABEL[k]);
      c.type = 'button'; c.setAttribute('data-k', k);
      chipsEl.appendChild(c);
    });
    chipsEl.hidden = !chipsEl.children.length;
  }
  function typing(on) {
    var t = log.querySelector('.hs-help__typing');
    if (on && !t) { t = el('div', 'hs-help__msg hs-help__msg--buddy hs-help__typing'); t.setAttribute('aria-label', 'Typing'); t.innerHTML = '<span></span><span></span><span></span>'; log.appendChild(t); scroll(); }
    if (!on && t) t.remove();
  }

  // ---- open and close
  function setOpen(open) {
    st.open = open; save();
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
    launch.setAttribute('aria-expanded', String(open));
    if (open) { drawAll(); focusSoon(st.form && !st.sent ? handoff.querySelector('input') : input); fit(); }
    else launch.focus({ preventScroll: true });
  }
  launch.addEventListener('click', function () { setOpen(!st.open); });

  // phones: drag the sheet down by its header to close it; a short drag springs back
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  (function () {
    var head = panel.querySelector('.hs-help__head'), y0 = 0, t0 = 0, dy = 0, dragging = false;
    function phone() { return window.innerWidth < 600; }
    head.addEventListener('pointerdown', function (e) {
      if (!phone() || e.button > 0 || e.target.closest('button')) return;
      dragging = true; y0 = e.clientY; t0 = Date.now(); dy = 0;
      panel.classList.add('is-dragging');
      try { head.setPointerCapture(e.pointerId); } catch (x) {}
    });
    head.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - y0);
      panel.style.transform = 'translateY(' + dy + 'px)';
    });
    function end() {
      if (!dragging) return;
      dragging = false; panel.classList.remove('is-dragging');
      var fast = dy > 40 && dy / Math.max(1, Date.now() - t0) > 0.5;
      if (dy > 110 || fast) {
        panel.style.transform = 'translateY(100%)';
        setTimeout(function () { panel.style.transform = ''; setOpen(false); }, reduceMotion ? 0 : 180);
      } else panel.style.transform = '';
    }
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
    head.addEventListener('lostpointercapture', end);
  })();
  root.querySelector('.hs-help__close').addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.open) setOpen(false); });

  // ---- a person
  function offerPerson(lead) {
    if (st.sent) { add('assistant', 'The team already has this chat and will email you at ' + st.sent + ' within 6 hours. Anything you add here, they will see too if you send it again.'); return; }
    if (lead) add('assistant', lead);
    st.form = true; st.offered = true; save(); drawAll();
    focusSoon(handoff.querySelector('input'));
    if (touchy) requestAnimationFrame(function () { handoff.scrollIntoView({ block: 'end' }); });
  }
  handoff.querySelector('[data-hs-help-cancel]').addEventListener('click', function () {
    st.form = false; save(); drawAll(); focusSoon(input);
  });
  handoff.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = handoff.email.value.trim(), name = handoff.name.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errEl.textContent = 'That email does not look right. Could you check it?'; errEl.hidden = false; handoff.email.focus(); return; }
    errEl.hidden = true;
    var btn = handoff.querySelector('.hs-help__primary'); btn.disabled = true; btn.classList.add('is-sending'); btn.classList.remove('is-retry'); btn.innerHTML = '<span class="hs-help__spin" aria-hidden="true"></span>Sending';
    post({ action: 'handoff', email: email, name: name, messages: st.msgs, page: location.pathname }).then(function (r) {
      if (!r || !r.ok) throw new Error('not sent');
      btn.classList.remove('is-sending'); btn.classList.add('is-sent'); btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Sent';
      return new Promise(function (ok) { setTimeout(ok, reduceMotion ? 0 : 650); }).then(function () {
      st.sent = email; st.form = false; save();
      add('assistant', 'Thank you' + (name ? ', ' + name.split(' ')[0] : '') + '. You are all set. Someone from the Heartside team has this chat and will email you at ' + email + ' within the next 6 hours. You are in good hands.');
      drawAll();
      btn.classList.remove('is-sent'); btn.disabled = false; btn.textContent = 'Send to the team';
      });
    }).catch(function () {
      errEl.textContent = "That didn't go through, sorry. Tap Try again, or email krish@heartside.io."; errEl.hidden = false;
      btn.classList.remove('is-sending'); btn.classList.add('is-retry'); btn.disabled = false; btn.textContent = 'Try again';
    });
  });

  // ---- asking
  function post(body) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 25000);
    return fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ sid: st.sid }, body)), mode: 'cors', signal: ctl ? ctl.signal : undefined, credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function afterUser() {
    st.users += 1; save();
    if (st.users >= LONG && !st.offered && !st.sent) {
      offerPerson("We've covered a lot, and I want to make sure you're fully looked after. Let me bring in someone from the team to help you personally.");
      return true;
    }
    return false;
  }
  function ask(text) {
    text = String(text || '').trim().slice(0, MAX_LEN);
    if (!text || busy) return;
    add('user', text);
    if (PERSON.test(text)) { st.users += 1; offerPerson("Of course, happy to get you to a real person. They'll pick this up personally."); return; }
    if (afterUser()) return;
    busy = true; typing(true); st.chips = []; drawChips();
    post({ action: 'ask', messages: st.msgs.slice(-16), page: location.pathname }).then(function (r) {
      typing(false);
      if (!r || !r.reply) throw new Error('no reply');
      add('assistant', r.reply);
      st.chips = (r.chips || []).filter(function (k) { return CHIP_LABEL[k]; }).slice(0, 3);
      if (st.chips.indexOf('person') < 0) st.chips.push('person');
      save(); drawChips();
      if (r.handoff) offerPerson('');
    }).catch(function () {
      typing(false);
      add('assistant', "Sorry, I couldn't answer that one just now. Don't worry, a real person from the team can, and it only takes a tap.");
      st.chips = ['person', 'how', 'ship']; save(); drawChips();
    }).then(function () { busy = false; });
  }
  compose.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; grow(); ask(v); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); compose.requestSubmit ? compose.requestSubmit() : compose.dispatchEvent(new Event('submit')); } });
  function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
  input.addEventListener('input', grow);

  chipsEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-k]'); if (!c || busy) return;
    var k = c.getAttribute('data-k');
    if (k === 'person') { add('user', CHIP_LABEL.person); offerPerson("Of course, happy to get you to a real person. They'll pick this up personally."); return; }
    if (k === 'start') { location.href = (window.Shopify && Shopify.routes && Shopify.routes.root || '/'); return; }
    var x = A[k]; if (!x) return;
    add('user', x.q);
    if (afterUser()) return;
    add('assistant', x.a);
    st.chips = x.chips.concat(x.chips.indexOf('person') < 0 ? ['person'] : []).slice(0, 4); save(); drawChips();
  });

  // ---- stay clear of bars pinned to the bottom (the journey dock, the sticky button, the next-gift bar)
  var PINNED = '.hsj-dock--pin, .hs2-sticky > *, .hs2-next, [data-hs-pinned-bottom]';
  function lift() {
    var h = 0, vh = window.innerHeight;
    document.querySelectorAll(PINNED).forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.height && r.width && r.bottom >= vh - 40 && r.top < vh && getComputedStyle(n).visibility !== 'hidden') h = Math.max(h, vh - r.top);
    });
    root.style.setProperty('--hs-help-lift', Math.round(h) + 'px');
  }
  var queued = false;
  function soon() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; lift(); }); }
  window.addEventListener('resize', soon, { passive: true });
  window.addEventListener('scroll', soon, { passive: true });
  if ('MutationObserver' in window) new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
  lift();

  // phones: when the keyboard opens, the sheet shrinks to the space above it, the header gets compact,
  // and while the email form is up the chat log steps aside, so the field being typed in is always in view
  function fit() {
    var vv = window.visualViewport;
    if (!vv || window.innerWidth >= 600 || panel.hidden) { panel.style.top = panel.style.height = ''; root.classList.remove('is-kb'); return; }
    var kb = vv.height < window.innerHeight * 0.8;
    root.classList.toggle('is-kb', kb);
    if (kb) { panel.style.top = Math.round(vv.offsetTop) + 'px'; panel.style.height = Math.round(vv.height) + 'px'; }
    else { panel.style.top = panel.style.height = ''; }
    var a = document.activeElement;
    if (kb && a && panel.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) requestAnimationFrame(function () { a.scrollIntoView({ block: 'nearest' }); });
  }
  if (window.visualViewport) { visualViewport.addEventListener('resize', fit); visualViewport.addEventListener('scroll', fit); }
  panel.addEventListener('focusin', function () { setTimeout(fit, 250); });

  // test hook
  window.__hsHelp = { ask: ask, open: function () { setOpen(true); }, state: function () { return st; }, answers: A, lift: lift };

  root.hidden = false;
  if (st.open) setOpen(true);
})();
