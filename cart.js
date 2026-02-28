// ═══════════════════════════════════════════════════════
//  TTBC CART ENGINE
//  Handles: cart state, coupons, gift wrapping, checkout
// ═══════════════════════════════════════════════════════

const CART = (() => {

  // ── State ──────────────────────────────────────────
  let items     = JSON.parse(localStorage.getItem('ttbc_cart') || '[]');
  let coupon    = JSON.parse(localStorage.getItem('ttbc_coupon') || 'null');
  let giftWrap  = JSON.parse(localStorage.getItem('ttbc_gift') || 'null');

  // ── Valid coupon codes ──────────────────────────────
  const COUPONS = {
    'AISHWARYA10': { type: 'percent',  value: 10,  label: '10% off — founder\'s code 🌻' },
    'FIRSTBAG':    { type: 'percent',  value: 15,  label: '15% off your first bag!' },
    'BENGALURU':   { type: 'fixed',    value: 100, label: '₹100 off — Namma city love ✦' },
    'TTBCLOVE':    { type: 'percent',  value: 20,  label: '20% off — thank you for the love!' },
    'METRO':       { type: 'fixed',    value: 80,  label: '₹80 off — Metro Gang 🚇' },
    'GIFTNOW':     { type: 'freegift', value: 0,   label: 'Free gift wrapping included! 🎁' },
  };

  const GIFT_WRAP_PRICE = 49;
  const SHIPPING_FREE_ABOVE = 999;
  const SHIPPING_CHARGE = 80;

  // ── Persist ─────────────────────────────────────────
  function save() {
    localStorage.setItem('ttbc_cart', JSON.stringify(items));
    localStorage.setItem('ttbc_coupon', JSON.stringify(coupon));
    localStorage.setItem('ttbc_gift', JSON.stringify(giftWrap));
  }

  // ── Add ─────────────────────────────────────────────
  function add(productId, qty = 1) {
    const product = (typeof TTBC_PRODUCTS !== 'undefined')
      ? TTBC_PRODUCTS.find(p => p.id === productId)
      : null;
    if (!product || !product.inStock) return false;

    const existing = items.find(i => i.id === productId);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.quantity);
    } else {
      items.push({
        id:        product.id,
        name:      product.name,
        shortName: product.shortName,
        price:     product.price,
        canvasColor:  product.canvasColor,
        threadColor:  product.threadColor,
        canvasLabel:  product.canvasLabel,
        qty:       qty,
        maxQty:    product.quantity,
        line1:     product.line1,
        line2:     product.line2,
        line3:     product.line3,
        line3Color: product.line3Color,
      });
    }
    save();
    return true;
  }

  // ── Remove ───────────────────────────────────────────
  function remove(productId) {
    items = items.filter(i => i.id !== productId);
    save();
  }

  // ── Update qty ───────────────────────────────────────
  function updateQty(productId, qty) {
    const item = items.find(i => i.id === productId);
    if (!item) return;
    if (qty <= 0) { remove(productId); return; }
    item.qty = Math.min(qty, item.maxQty || 99);
    save();
  }

  // ── Totals ───────────────────────────────────────────
  function subtotal() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function discount() {
    if (!coupon) return 0;
    const sub = subtotal();
    if (coupon.type === 'percent') return Math.round(sub * coupon.value / 100);
    if (coupon.type === 'fixed')   return Math.min(coupon.value, sub);
    return 0;
  }

  function giftWrapCost() {
    if (!giftWrap) return 0;
    if (coupon && coupon.type === 'freegift') return 0;
    return GIFT_WRAP_PRICE;
  }

  function shipping() {
    const after = subtotal() - discount();
    return after >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_CHARGE;
  }

  function total() {
    return subtotal() - discount() + giftWrapCost() + shipping();
  }

  function itemCount() {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }

  // ── Coupon ───────────────────────────────────────────
  function applyCoupon(code) {
    const c = COUPONS[code.toUpperCase().trim()];
    if (!c) return { ok: false, msg: 'Invalid code. Try AISHWARYA10 for 10% off 😊' };
    coupon = { code: code.toUpperCase(), ...c };
    save();
    return { ok: true, msg: c.label };
  }

  function removeCoupon() {
    coupon = null;
    save();
  }

  // ── Gift wrap ────────────────────────────────────────
  function setGiftWrap(data) {  // data = { to, from, message } or null
    giftWrap = data;
    save();
  }

  // ── Clear ────────────────────────────────────────────
  function clear() {
    items = []; coupon = null; giftWrap = null;
    localStorage.removeItem('ttbc_cart');
    localStorage.removeItem('ttbc_coupon');
    localStorage.removeItem('ttbc_gift');
  }

  // ── Public API ───────────────────────────────────────
  return {
    get items()       { return items; },
    get coupon()      { return coupon; },
    get giftWrap()    { return giftWrap; },
    get COUPONS()     { return COUPONS; },
    add, remove, updateQty,
    subtotal, discount, giftWrapCost, shipping, total, itemCount,
    applyCoupon, removeCoupon, setGiftWrap, clear,
    GIFT_WRAP_PRICE, SHIPPING_FREE_ABOVE, SHIPPING_CHARGE,
  };
})();
