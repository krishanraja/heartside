// A presentation bundle cannot edit its native child in place. Preserve the
// original item before replacing its parent, and never retry an uncertain add.
export function createHeartsideCartQuantity({ actions, readCart, storage, digest, pendingChanged = () => {} }) {
  const storageKey = 'heartside.quantity.pending.v1';
  let busy = false;
  const fail = (message) => { throw new Error(message); };
  const attrs = (value) => JSON.stringify((value || []).map(({ key, value }) => [key, value]).sort((a,b) => a[0].localeCompare(b[0])));
  const nativeLines = (line) => line.lineComponents?.length ? line.lineComponents : [line];
  const identity = (line) => JSON.stringify([line.merchandise.id, attrs(line.attributes)]);
  const fingerprint = (lines) => JSON.stringify(lines.map(line => nativeLines(line).map(child => [identity(child), child.quantity]).sort()).sort());
  const load = () => { try { const raw = storage.getItem(storageKey); return raw ? JSON.parse(raw) : null; } catch { return { phase: 'unreadable' }; } };
  const save = (record) => { storage.setItem(storageKey, JSON.stringify(record)); pendingChanged(record); };
  const clear = () => { storage.removeItem(storageKey); pendingChanged(null); };
  function locate(cart, original) {
    const wanted = identity(original), found = [];
    for (const parent of cart.lines.nodes) for (const child of nativeLines(parent)) {
      if (identity(child) === wanted) found.push({ parent, child });
    }
    return found;
  }
  async function inspect(cartId, record) {
    if (await digest(cartId) !== record.cartHash) fail('Open the original cart to recover this saved change.');
    const cart = await readCart(cartId), matches = locate(cart, record.original);
    if (matches.length > 1) fail('Multiple matching designs found. No further change was made.');
    const others = cart.lines.nodes.filter(line => !matches.some(match => match.parent === line));
    if (await digest(fingerprint(others)) !== record.othersHash) fail('Other cart items changed. No further change was made.');
    return { cart, match: matches[0] || null };
  }
  async function addOnce(cartId, record, quantity) {
    const before = await inspect(cartId, record);
    if (before.match) fail('The saved design is already in the cart. Check its quantity before continuing.');
    record.phase = 'adding'; record.attemptQuantity = quantity; save(record);
    let response, uncertain = false;
    try {
      response = await actions.updateCart({ cartId, lines: [{ merchandiseId: record.original.merchandise.id, quantity, attributes: record.original.attributes }] });
    } catch { uncertain = true; }
    let after;
    try { after = await inspect(cartId, record); } catch {
      record.phase = 'uncertain_add'; save(record);
      fail('The result could not be confirmed. Check the saved change; do not add this design again.');
    }
    if (after.match?.child.quantity === quantity) { clear(); return after.cart; }
    if (!after.match && !uncertain && response?.userErrors?.length) {
      record.phase = 'removed'; save(record);
      fail('Shopify rejected the new quantity. The saved design can be restored or the quantity retried.');
    }
    // A timeout or unexpected result might have committed. Repeating add could
    // double the quantity, so only readback is allowed until resolved.
    record.phase = 'uncertain_add'; save(record);
    fail('The new quantity was not confirmed. Check the saved change before continuing.');
  }
  async function change(cartId, componentKey, quantity) {
    if (busy || load()) fail('Finish the saved quantity change before starting another.');
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 2000) fail('Choose a valid whole-number quantity.');
    busy = true;
    try {
      const cart = await readCart(cartId);
      const candidates = cart.lines.nodes.flatMap(parent => nativeLines(parent).filter(child => child.viewKey === componentKey || child.id === componentKey).map(child => ({ parent, child })));
      if (candidates.length !== 1) fail('The cart changed. Refresh it before trying again.');
      const { parent, child } = candidates[0];
      const properties = Object.fromEntries((child.attributes || []).map(entry => [entry.key, entry.value]));
      if (parent.quantity !== 1 || parent.lineComponents?.length !== 1 || parent.merchandise.id !== child.merchandise.id || !properties._customization_id || !properties._tib_design_link_1 || !properties._hs_checkout_image) fail('This line cannot use the personalized quantity repair.');
      if (child.quantity === quantity) return { cart, componentKey: child.viewKey };
      const record = { version: 1, phase: 'prepared', cartHash: await digest(cartId), othersHash: await digest(fingerprint(cart.lines.nodes.filter(line => line !== parent))), original: { merchandise: child.merchandise, attributes: child.attributes, quantity: child.quantity }, desiredQuantity: quantity };
      save(record); // If browser storage is unavailable, nothing is removed.
      let response, uncertain = false;
      try { response = await actions.updateCart({ cartId, lines: [{ id: parent.id, quantity: 0 }] }); } catch { uncertain = true; }
      let after;
      try { after = await inspect(cartId, record); } catch {
        record.phase = 'uncertain_remove'; save(record);
        fail('The removal result could not be confirmed. Your design is saved; check the saved change.');
      }
      if (after.match) {
        if (!uncertain && after.match.child.quantity === child.quantity) { clear(); fail('Shopify did not remove the original bundle. Its design and quantity are unchanged.'); }
        record.phase = 'uncertain_remove'; save(record);
        fail('The removal result is uncertain. Check the saved change before continuing.');
      }
      record.phase = 'removed'; save(record);
      if (quantity === 0) { clear(); return { cart: after.cart, componentKey }; }
      const result = await addOnce(cartId, record, quantity);
      // Re-adding can assign a different view key. The refreshed theme must
      // verify the exact new component established by authoritative readback.
      return { cart: result, componentKey: locate(result, record.original)[0]?.child.viewKey };
    } finally { busy = false; }
  }
  async function recover(cartId, mode = 'check') {
    if (busy) fail('A quantity change is still running.');
    const record = load(); if (!record) return readCart(cartId);
    busy = true;
    try {
      const state = await inspect(cartId, record);
      if (state.match) {
        if (record.phase === 'adding' || record.phase === 'uncertain_add') {
          if (state.match.child.quantity === record.attemptQuantity) { clear(); return state.cart; }
        } else if (record.phase === 'prepared' && state.match.child.quantity === record.original.quantity) { clear(); return state.cart; }
        fail('The cart needs review before another change. No automatic retry was made.');
      }
      if (record.phase === 'prepared' || record.phase === 'uncertain_remove') { record.phase = 'removed'; save(record); }
      if (record.phase !== 'removed') fail('An add may still have completed. Only a status check is safe; no retry was made.');
      if (mode === 'check') return state.cart;
      if (mode === 'discard') { clear(); return state.cart; }
      if (mode !== 'restore' && mode !== 'retry') fail('Unknown recovery action.');
      const quantity = mode === 'restore' ? record.original.quantity : record.desiredQuantity;
      if (quantity === 0) { clear(); return state.cart; }
      return await addOnce(cartId, record, quantity);
    } finally { busy = false; }
  }
  return { change, recover, pending: load };
}

const nativeQuery = 'query HeartsideQuantity($id:ID!){cart(id:$id){id lines(first:100){pageInfo{hasNextPage}nodes{id quantity attributes{key value} merchandise{...on ProductVariant{id}} ...on CartLine{viewKey} ...on ComponentizableCartLine{viewKey lineComponents{id viewKey quantity attributes{key value} merchandise{...on ProductVariant{id}}}}}}}}';
export async function readHeartsideNativeCart(cartId) {
  const response = await fetch('/api/2026-07/graphql.json', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: nativeQuery, variables: { id: cartId } }) });
  if (!response.ok) throw new Error('The cart could not be read.');
  const result = await response.json(), cart = result.data?.cart;
  if (result.errors?.length || !cart || !Array.isArray(cart.lines?.nodes) || cart.lines.pageInfo.hasNextPage) throw new Error('The full cart could not be verified.');
  return cart;
}

let lastCartId = '';
function renderPending(record) {
  const blocked = !!record;
  document.querySelectorAll('[name="checkout"], shopify-accelerated-checkout-cart').forEach(element => {
    if (blocked && !element.hasAttribute('data-hs-quantity-disabled')) {
      element.setAttribute('data-hs-quantity-disabled', element.disabled ? 'already' : 'ours');
      if ('disabled' in element) element.disabled = true;
      element.inert = true;
    } else if (!blocked && element.hasAttribute('data-hs-quantity-disabled')) {
      if ('disabled' in element && element.getAttribute('data-hs-quantity-disabled') === 'ours') element.disabled = false;
      element.inert = false; element.removeAttribute('data-hs-quantity-disabled');
    }
  });
  let banner = document.getElementById('hs-quantity-recovery');
  if (!blocked) { banner?.remove(); return; }
  if (!banner) {
    banner = document.createElement('section'); banner.id = 'hs-quantity-recovery'; banner.setAttribute('role','status');
    banner.style.cssText = 'padding:1rem;margin:1rem;border:2px solid currentColor;background:var(--color-background,#fff);color:var(--color-foreground,#111)';
    const message = document.createElement('p'); message.textContent = 'Your design is saved while its quantity change is checked. Checkout is paused until the cart is confirmed.'; banner.append(message);
    for (const [mode, label] of [['check','Check saved change'],['retry','Retry requested quantity'],['restore','Restore original quantity'],['discard','Remove this saved item']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.recoveryMode = mode;
      button.addEventListener('click', async () => {
        button.disabled = true;
        try { const id = lastCartId || (await window.Shopify.actions.getCart()).cart?.id; if (!id) throw new Error('Open the original cart to recover the saved change.'); await HeartsideCartQuantity.recover(id, mode); if (!HeartsideCartQuantity.pending()) location.reload(); else renderPending(HeartsideCartQuantity.pending()); }
        catch (error) { message.textContent = error.message; renderPending(HeartsideCartQuantity.pending()); }
      }); banner.append(button);
    }
    (document.querySelector('cart-items-component') || document.querySelector('main') || document.body).prepend(banner);
  }
  banner.querySelectorAll('button').forEach(button => { button.disabled = button.dataset.recoveryMode !== 'check' && record.phase !== 'removed'; });
}

const existingRuntime = typeof window !== 'undefined' && window.HSCartQuantity;
const runtime = typeof window !== 'undefined' && !existingRuntime ? createHeartsideCartQuantity({
  actions: { updateCart: (...args) => window.Shopify.actions.updateCart(...args) },
  readCart: readHeartsideNativeCart,
  storage: { getItem: key => window.sessionStorage.getItem(key), setItem: (key,value) => window.sessionStorage.setItem(key,value), removeItem: key => window.sessionStorage.removeItem(key) },
  digest: async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2,'0')).join(''),
  pendingChanged: renderPending,
}) : null;
export const HeartsideCartQuantity = existingRuntime || (runtime && {
  pending: runtime.pending,
  useCart(cartId) { lastCartId = cartId; },
  refreshRecovery() { renderPending(runtime.pending()); },
  async change(cartId, key, quantity) { lastCartId = cartId; return runtime.change(cartId,key,quantity); },
  async recover(cartId, mode) { lastCartId = cartId; return runtime.recover(cartId,mode); },
});
if (runtime) {
  window.HSCartQuantity = HeartsideCartQuantity;
  const blockCheckout = event => {
    if (!runtime.pending()) return;
    if (event.target.closest?.('[name="checkout"],a[href*="/checkout"],shopify-accelerated-checkout-cart') || event.submitter?.name === 'checkout' || event.target.action?.includes('/checkout')) { event.preventDefault(); event.stopImmediatePropagation(); renderPending(runtime.pending()); }
  };
  document.addEventListener('click',blockCheckout,true); document.addEventListener('submit',blockCheckout,true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>renderPending(runtime.pending()),{once:true}); else renderPending(runtime.pending());
}
