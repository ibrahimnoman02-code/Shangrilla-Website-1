// Cart State & Calculations for Shangrilla Gardens & BBQ
class CartManager {
  constructor() {
    this.storageKey = 'shangrilla_cart_v1';
    this.couponKey = 'shangrilla_coupon_v1';
    this.currencyKey = 'shangrilla_currency_v2';
    this.orderHistoryKey = 'shangrilla_orders_v1';

    this.cart = this.loadCart();
    this.appliedCoupon = this.loadCoupon();
    this.activeCurrency = localStorage.getItem(this.currencyKey) || 'PKR';
  }

  loadCart() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading cart', e);
      return [];
    }
  }

  saveCart() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    this.notify();
  }

  loadCoupon() {
    try {
      const data = localStorage.getItem(this.couponKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon(coupon) {
    this.appliedCoupon = coupon;
    if (coupon) {
      localStorage.setItem(this.couponKey, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(this.couponKey);
    }
    this.notify();
  }

  setCurrency(code) {
    this.activeCurrency = code;
    localStorage.setItem(this.currencyKey, code);
    this.notify();
  }

  getCurrency() {
    return this.activeCurrency;
  }

  formatPrice(usdAmount) {
    const num = parseFloat(usdAmount) || 0;
    if (this.activeCurrency === 'PKR') {
      const pkrVal = Math.round(num * RESTAURANT_DATA.currency.altRate);
      return `Rs. ${pkrVal.toLocaleString()}`;
    }
    return `$${num.toFixed(2)}`;
  }

  addItem(productId, portionIndex = 0, selectedAddons = [], spiceLevel = "Normal", instructions = "", quantity = 1) {
    const product = RESTAURANT_DATA.items.find(i => i.id === productId);
    if (!product) return false;

    const portion = product.portions[portionIndex] || product.portions[0];
    const unitPrice = product.price + (portion.priceDelta || 0);

    // Calculate addons cost
    let addonsTotal = 0;
    const resolvedAddons = [];
    selectedAddons.forEach(addonName => {
      const match = product.addons.find(a => a.name === addonName);
      if (match) {
        resolvedAddons.push(match);
        addonsTotal += match.price;
      }
    });

    const itemUnitPrice = unitPrice + addonsTotal;

    // Create unique key based on variations
    const variationKey = `${product.id}|${portion.name}|${spiceLevel}|${resolvedAddons.map(a => a.name).sort().join(',')}|${instructions.trim()}`;

    const existingIndex = this.cart.findIndex(item => item.variationKey === variationKey);

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: 'ci_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        variationKey,
        productId: product.id,
        title: product.title,
        image: product.image,
        category: product.category,
        portionName: portion.name,
        portionPriceDelta: portion.priceDelta,
        spiceLevel,
        addons: resolvedAddons,
        instructions: instructions.trim(),
        unitPrice: itemUnitPrice,
        quantity: Math.max(1, quantity)
      });
    }

    this.saveCart();
    return true;
  }

  updateQuantity(cartItemId, delta) {
    const itemIndex = this.cart.findIndex(i => i.id === cartItemId);
    if (itemIndex === -1) return;

    this.cart[itemIndex].quantity += delta;
    if (this.cart[itemIndex].quantity <= 0) {
      this.cart.splice(itemIndex, 1);
    }
    this.saveCart();
  }

  removeItem(cartItemId) {
    this.cart = this.cart.filter(i => i.id !== cartItemId);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.appliedCoupon = null;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.couponKey);
    this.notify();
  }

  getTotalCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const coupon = RESTAURANT_DATA.coupons.find(c => c.code === cleanCode);
    if (!coupon) {
      return { success: false, message: "Invalid promo code" };
    }

    const subtotal = this.getSubtotal();
    if (subtotal < coupon.minOrder) {
      return {
        success: false,
        message: `Order subtotal must be at least ${this.formatPrice(coupon.minOrder)} for this coupon`
      };
    }

    this.saveCoupon(coupon);
    return { success: true, message: `Promo coupon '${coupon.code}' applied successfully!`, coupon };
  }

  removeCoupon() {
    this.saveCoupon(null);
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  calculateTotals(orderType = 'delivery') {
    const subtotal = this.getSubtotal();
    let discount = 0;
    let deliveryFee = (orderType === 'delivery') ? RESTAURANT_DATA.deliveryFee : 0;

    // Apply coupon
    if (this.appliedCoupon && subtotal >= this.appliedCoupon.minOrder) {
      if (this.appliedCoupon.type === 'percent') {
        discount = (subtotal * this.appliedCoupon.value) / 100;
      } else if (this.appliedCoupon.type === 'fixed') {
        discount = Math.min(subtotal, this.appliedCoupon.value);
      } else if (this.appliedCoupon.type === 'shipping') {
        deliveryFee = 0;
      }
    }

    // Free delivery threshold
    if (subtotal >= RESTAURANT_DATA.freeDeliveryThreshold && orderType === 'delivery') {
      deliveryFee = 0;
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * RESTAURANT_DATA.taxRate;
    const grandTotal = taxableAmount + deliveryFee + tax;

    return {
      subtotal,
      discount,
      deliveryFee,
      tax,
      grandTotal,
      freeDeliveryRemaining: Math.max(0, RESTAURANT_DATA.freeDeliveryThreshold - subtotal)
    };
  }

  saveOrder(order) {
    try {
      const orders = this.getOrderHistory();
      orders.unshift(order);
      localStorage.setItem(this.orderHistoryKey, JSON.stringify(orders.slice(0, 20)));
    } catch (e) {
      console.error(e);
    }
  }

  getOrderHistory() {
    try {
      const data = localStorage.getItem(this.orderHistoryKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  notify() {
    window.dispatchEvent(new CustomEvent('cart:updated', {
      detail: {
        cart: this.cart,
        count: this.getTotalCount(),
        totals: this.calculateTotals(),
        currency: this.activeCurrency
      }
    }));
  }
}

// Global instance
window.cartManager = new CartManager();
