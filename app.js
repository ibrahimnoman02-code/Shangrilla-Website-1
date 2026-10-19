// Application Logic for Shangrilla Gardens & BBQ
document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'featured';
  let activeProductForModal = null;
  let simulatedTrackingInterval = null;

  // DOM Elements
  const categoryTabsContainer = document.getElementById('categoryTabs');
  const menuGrid = document.getElementById('menuGrid');
  const searchInput = document.getElementById('menuSearchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const sortSelect = document.getElementById('sortSelect');
  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartDiscountEl = document.getElementById('cartDiscount');
  const cartDiscountRow = document.getElementById('cartDiscountRow');
  const cartDeliveryEl = document.getElementById('cartDelivery');
  const cartTaxEl = document.getElementById('cartTax');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const appliedCouponContainer = document.getElementById('appliedCouponContainer');
  const freeShippingBar = document.getElementById('freeShippingBar');
  const freeShippingText = document.getElementById('freeShippingText');
  const freeShippingFill = document.getElementById('freeShippingFill');

  // Modals
  const customizerModal = document.getElementById('customizerModal');
  const closeCustomizerBtn = document.getElementById('closeCustomizerBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  const orderTrackerModal = document.getElementById('orderTrackerModal');
  const closeTrackerBtn = document.getElementById('closeTrackerBtn');

  // Currency buttons
  const currencyBtns = document.querySelectorAll('.currency-btn');

  function syncCurrencyUI() {
    const activeCurr = window.cartManager.getCurrency();
    currencyBtns.forEach(btn => {
      if (btn.dataset.currency === activeCurr) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const heroPriceEl = document.querySelector('.poster-price .amount');
    if (heroPriceEl) {
      const steak = RESTAURANT_DATA.items.find(i => i.id === 'truffle-mushroom-steak');
      if (steak) heroPriceEl.textContent = window.cartManager.formatPrice(steak.price);
    }

    const freeDeliveryBannerThreshold = document.getElementById('freeDeliveryBannerThreshold');
    if (freeDeliveryBannerThreshold) {
      freeDeliveryBannerThreshold.textContent = window.cartManager.formatPrice(RESTAURANT_DATA.freeDeliveryThreshold);
    }
  }

  // Initialize
  initCategories();
  syncCurrencyUI();
  renderMenu();
  updateCartUI();
  setupEventListeners();

  // -------------------------------------------------------------
  // Categories & Filtering
  // -------------------------------------------------------------
  function initCategories() {
    if (!categoryTabsContainer) return;
    categoryTabsContainer.innerHTML = RESTAURANT_DATA.categories.map(cat => `
      <button class="category-tab-btn ${cat.id === currentCategory ? 'active' : ''}" data-category="${cat.id}">
        <i class="fa-solid ${cat.icon}"></i>
        <span>${cat.name}</span>
      </button>
    `).join('');

    categoryTabsContainer.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryTabsContainer.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderMenu();
      });
    });
  }

  function getFilteredItems() {
    return RESTAURANT_DATA.items.filter(item => {
      const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (currentSort === 'price-low') return a.price - b.price;
      if (currentSort === 'price-high') return b.price - a.price;
      if (currentSort === 'rating') return b.rating - a.rating;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); // Featured default
    });
  }

  function renderMenu() {
    if (!menuGrid) return;
    const items = getFilteredItems();

    if (items.length === 0) {
      menuGrid.innerHTML = `
        <div class="menu-empty">
          <i class="fa-solid fa-plate-wheat"></i>
          <h3>No culinary delights found</h3>
          <p>Try refining your search term or selecting another category.</p>
        </div>
      `;
      return;
    }

    menuGrid.innerHTML = items.map(item => `
      <article class="food-card" data-id="${item.id}">
        <div class="card-media" onclick="window.openCustomizer('${item.id}')">
          <img src="${item.image}" alt="${item.title}" loading="lazy" />
          ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
          <div class="card-rating-pill">
            <i class="fa-solid fa-star"></i>
            <span>${item.rating}</span>
          </div>
        </div>
        <div class="card-body">
          <span class="card-subtitle">${item.subtitle}</span>
          <h3 class="card-title" onclick="window.openCustomizer('${item.id}')">${item.title}</h3>
          <p class="card-desc">${item.description}</p>
          <div class="card-dietary-tags">
            ${item.dietary.map(d => `<span class="dietary-tag">${d}</span>`).join('')}
            <span class="dietary-tag"><i class="fa-solid fa-pepper-hot"></i> ${item.spiceLevel}</span>
          </div>
          <div class="card-footer">
            <div class="card-price">
              <span class="price-val">${window.cartManager.formatPrice(item.price)}</span>
            </div>
            <div class="card-actions">
              <button class="btn-card-view" title="Custom Options" onclick="window.openCustomizer('${item.id}')">
                <i class="fa-solid fa-sliders"></i>
              </button>
              <button class="btn-card-order" onclick="window.quickAddToCart('${item.id}')">
                <i class="fa-solid fa-plus"></i>
                <span>Order</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  // -------------------------------------------------------------
  // Quick Add & Customizer Modal
  // -------------------------------------------------------------
  window.quickAddToCart = function(productId) {
    const product = RESTAURANT_DATA.items.find(i => i.id === productId);
    if (!product) return;

    window.cartManager.addItem(productId, 0, [], "Normal", "", 1);
    showToast(`Added "${product.title}" to your feast!`, 'success');
  };

  window.openCustomizer = function(productId) {
    const product = RESTAURANT_DATA.items.find(i => i.id === productId);
    if (!product) return;
    activeProductForModal = product;

    document.getElementById('modalProductImg').src = product.image;
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductSubtitle').textContent = product.subtitle;
    document.getElementById('modalProductDesc').textContent = product.description;

    // Portion options
    const portionsContainer = document.getElementById('modalPortions');
    portionsContainer.innerHTML = product.portions.map((portion, idx) => `
      <label class="option-label-card ${idx === 0 ? 'selected' : ''}">
        <div>
          <input type="radio" name="portionOption" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="window.recalcModalPrice()" />
          <strong>${portion.name}</strong>
        </div>
        <span>${portion.priceDelta > 0 ? `+${window.cartManager.formatPrice(portion.priceDelta)}` : 'Standard'}</span>
      </label>
    `).join('');

    // Addons
    const addonsContainer = document.getElementById('modalAddons');
    if (product.addons && product.addons.length > 0) {
      document.getElementById('addonsGroup').style.display = 'block';
      addonsContainer.innerHTML = product.addons.map(addon => `
        <label class="option-label-card">
          <div>
            <input type="checkbox" name="addonOption" value="${addon.name}" data-price="${addon.price}" onchange="window.recalcModalPrice()" />
            <span>${addon.name}</span>
          </div>
          <span class="price">+${window.cartManager.formatPrice(addon.price)}</span>
        </label>
      `).join('');
    } else {
      document.getElementById('addonsGroup').style.display = 'none';
      addonsContainer.innerHTML = '';
    }

    // Reset qty & notes
    document.getElementById('modalQty').textContent = "1";
    document.getElementById('modalInstructions').value = "";

    window.recalcModalPrice();
    customizerModal.classList.add('open');
  };

  window.recalcModalPrice = function() {
    if (!activeProductForModal) return;

    const portionIdx = parseInt(document.querySelector('input[name="portionOption"]:checked')?.value || 0);
    const portion = activeProductForModal.portions[portionIdx] || activeProductForModal.portions[0];
    let basePrice = activeProductForModal.price + (portion.priceDelta || 0);

    // Selected addons
    let addonsTotal = 0;
    document.querySelectorAll('input[name="addonOption"]:checked').forEach(cb => {
      addonsTotal += parseFloat(cb.dataset.price || 0);
    });

    const qty = parseInt(document.getElementById('modalQty').textContent || 1);
    const total = (basePrice + addonsTotal) * qty;

    document.getElementById('modalFinalPrice').textContent = window.cartManager.formatPrice(total);

    // Style selections
    document.querySelectorAll('.option-label-card').forEach(card => {
      const input = card.querySelector('input');
      if (input && input.checked) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  };

  window.adjustModalQty = function(delta) {
    const qtyEl = document.getElementById('modalQty');
    let cur = parseInt(qtyEl.textContent || 1);
    cur = Math.max(1, cur + delta);
    qtyEl.textContent = cur;
    window.recalcModalPrice();
  };

  window.confirmAddToCartFromModal = function() {
    if (!activeProductForModal) return;

    const portionIdx = parseInt(document.querySelector('input[name="portionOption"]:checked')?.value || 0);
    const selectedAddons = [];
    document.querySelectorAll('input[name="addonOption"]:checked').forEach(cb => {
      selectedAddons.push(cb.value);
    });
    const spiceLevel = document.querySelector('input[name="spiceOption"]:checked')?.value || "Medium Spice";
    const instructions = document.getElementById('modalInstructions').value;
    const qty = parseInt(document.getElementById('modalQty').textContent || 1);

    window.cartManager.addItem(
      activeProductForModal.id,
      portionIdx,
      selectedAddons,
      spiceLevel,
      instructions,
      qty
    );

    customizerModal.classList.remove('open');
    showToast(`Added ${qty}x "${activeProductForModal.title}" to cart!`, 'success');
  };

  // -------------------------------------------------------------
  // Cart Drawer & Calculations
  // -------------------------------------------------------------
  function updateCartUI() {
    const count = window.cartManager.getTotalCount();
    if (cartBadge) {
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    const cart = window.cartManager.getCart ? window.cartManager.cart : [];
    const totals = window.cartManager.calculateTotals();

    // Render items
    if (cartItemsList) {
      if (cart.length === 0) {
        cartItemsList.innerHTML = `
          <div class="cart-empty-state">
            <i class="fa-solid fa-bag-shopping"></i>
            <h4>Your Feast Bag is Empty</h4>
            <p style="font-size:0.85rem; color: var(--text-dim);">Explore our royal sizzlers, handis, and freshly baked naans to begin.</p>
          </div>
        `;
        if (checkoutBtn) checkoutBtn.disabled = true;
      } else {
        if (checkoutBtn) checkoutBtn.disabled = false;
        cartItemsList.innerHTML = cart.map(item => `
          <div class="cart-item-row" data-id="${item.id}">
            <div class="cart-item-img">
              <img src="${item.image}" alt="${item.title}" />
            </div>
            <div class="cart-item-info">
              <h4 class="cart-item-name">${item.title}</h4>
              <span class="cart-item-variation">${item.portionName} • ${item.spiceLevel}</span>
              ${item.addons && item.addons.length > 0 ? `
                <span class="cart-item-addons">+ ${item.addons.map(a => a.name).join(', ')}</span>
              ` : ''}
              ${item.instructions ? `<span style="font-size:0.7rem; color:var(--text-dim); italic">Note: ${item.instructions}</span>` : ''}
              <div class="cart-item-ctrls">
                <button class="qty-btn" onclick="window.cartManager.updateQuantity('${item.id}', -1)">-</button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="window.cartManager.updateQuantity('${item.id}', 1)">+</button>
              </div>
            </div>
            <div class="cart-item-price-side">
              <span class="cart-item-total">${window.cartManager.formatPrice(item.unitPrice * item.quantity)}</span>
              <button class="cart-item-remove" onclick="window.cartManager.removeItem('${item.id}')" title="Remove item">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // Bill totals
    if (cartSubtotalEl) cartSubtotalEl.textContent = window.cartManager.formatPrice(totals.subtotal);
    if (cartDeliveryEl) cartDeliveryEl.textContent = totals.deliveryFee === 0 ? "FREE" : window.cartManager.formatPrice(totals.deliveryFee);
    if (cartTaxEl) cartTaxEl.textContent = window.cartManager.formatPrice(totals.tax);
    if (cartTotalEl) cartTotalEl.textContent = window.cartManager.formatPrice(totals.grandTotal);

    // Discount row
    if (cartDiscountRow && cartDiscountEl) {
      if (totals.discount > 0) {
        cartDiscountRow.style.display = 'flex';
        cartDiscountEl.textContent = `-${window.cartManager.formatPrice(totals.discount)}`;
      } else {
        cartDiscountRow.style.display = 'none';
      }
    }

    // Free shipping progress bar
    if (freeShippingBar && freeShippingFill && freeShippingText) {
      const threshold = RESTAURANT_DATA.freeDeliveryThreshold;
      const progressPercent = Math.min(100, Math.round((totals.subtotal / threshold) * 100));
      freeShippingFill.style.width = `${progressPercent}%`;

      if (totals.subtotal >= threshold) {
        freeShippingText.innerHTML = `<span><strong>🎉 Congratulations!</strong> You unlocked FREE Delivery!</span><span>100%</span>`;
      } else {
        const remaining = window.cartManager.formatPrice(threshold - totals.subtotal);
        freeShippingText.innerHTML = `<span>Add <strong>${remaining}</strong> more for <strong>FREE Delivery</strong></span><span>${progressPercent}%</span>`;
      }
    }

    // Applied coupon pill
    if (appliedCouponContainer) {
      if (window.cartManager.appliedCoupon) {
        appliedCouponContainer.innerHTML = `
          <div class="applied-coupon-pill">
            <span><i class="fa-solid fa-tag"></i> <strong>${window.cartManager.appliedCoupon.code}</strong> applied (${window.cartManager.appliedCoupon.desc})</span>
            <button onclick="window.cartManager.removeCoupon()" style="color:var(--spicy); font-weight:700;">×</button>
          </div>
        `;
      } else {
        appliedCouponContainer.innerHTML = '';
      }
    }
  }

  // -------------------------------------------------------------
  // Checkout & Order Tracking
  // -------------------------------------------------------------
  window.openCheckout = function() {
    if (window.cartManager.getTotalCount() === 0) {
      showToast("Your cart is empty!", "error");
      return;
    }
    cartOverlay.classList.remove('open');
    renderCheckoutSummary();
    checkoutModal.classList.add('open');
  };

  function renderCheckoutSummary() {
    const totals = window.cartManager.calculateTotals();
    document.getElementById('checkoutSubtotal').textContent = window.cartManager.formatPrice(totals.subtotal);
    document.getElementById('checkoutDelivery').textContent = totals.deliveryFee === 0 ? "FREE" : window.cartManager.formatPrice(totals.deliveryFee);
    document.getElementById('checkoutTotal').textContent = window.cartManager.formatPrice(totals.grandTotal);
  }

  window.setCheckoutOrderType = function(type) {
    document.querySelectorAll('.checkout-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    const addressGroup = document.getElementById('checkoutAddressGroup');
    const tableGroup = document.getElementById('checkoutTableGroup');

    if (type === 'dinein') {
      addressGroup.style.display = 'none';
      tableGroup.style.display = 'block';
    } else if (type === 'pickup') {
      addressGroup.style.display = 'none';
      tableGroup.style.display = 'none';
    } else {
      addressGroup.style.display = 'block';
      tableGroup.style.display = 'none';
    }

    const totals = window.cartManager.calculateTotals(type);
    document.getElementById('checkoutDelivery').textContent = totals.deliveryFee === 0 ? "FREE" : window.cartManager.formatPrice(totals.deliveryFee);
    document.getElementById('checkoutTotal').textContent = window.cartManager.formatPrice(totals.grandTotal);
  };

  window.selectPaymentMethod = function(cardEl, method) {
    document.querySelectorAll('.payment-card-opt').forEach(el => el.classList.remove('selected'));
    cardEl.classList.add('selected');
    document.getElementById('selectedPaymentMethod').value = method;
  };

  window.submitOrder = function(event) {
    event.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const activeTypeBtn = document.querySelector('.checkout-tab-btn.active');
    const orderType = activeTypeBtn ? activeTypeBtn.dataset.type : 'delivery';
    const address = document.getElementById('custAddress').value.trim();
    const tableNum = document.getElementById('custTable').value.trim();
    const payment = document.getElementById('selectedPaymentMethod').value;
    const notes = document.getElementById('custNotes').value.trim();

    if (!name || !phone) {
      showToast("Please fill in your name and contact phone number.", "error");
      return;
    }

    if (orderType === 'delivery' && !address) {
      showToast("Please provide your delivery address.", "error");
      return;
    }

    const totals = window.cartManager.calculateTotals(orderType);
    const orderId = "SG-" + Math.floor(100000 + Math.random() * 900000);
    const orderItems = [...window.cartManager.cart];

    const orderData = {
      orderId,
      date: new Date().toLocaleString(),
      orderType,
      customer: { name, phone, address: orderType === 'delivery' ? address : (orderType === 'dinein' ? `Table: ${tableNum || 'Host Seating'}` : 'Self Pickup at Shangrilla Counter') },
      payment,
      notes,
      items: orderItems,
      totals
    };

    window.cartManager.saveOrder(orderData);
    window.cartManager.clearCart();

    checkoutModal.classList.remove('open');
    showOrderTracker(orderData);
  };

  function showOrderTracker(order) {
    document.getElementById('trackerOrderId').textContent = order.orderId;
    document.getElementById('receiptCustomerName').textContent = order.customer.name;
    document.getElementById('receiptCustomerContact').textContent = `${order.customer.phone} (${order.customer.address})`;
    document.getElementById('receiptPaymentMethod').textContent = order.payment.toUpperCase();

    // Render receipt items
    const receiptItemsContainer = document.getElementById('receiptItemsList');
    receiptItemsContainer.innerHTML = order.items.map(item => `
      <div class="receipt-row">
        <span>${item.quantity}x ${item.title} (${item.portionName})</span>
        <span>${window.cartManager.formatPrice(item.unitPrice * item.quantity)}</span>
      </div>
    `).join('');

    document.getElementById('receiptGrandTotal').textContent = window.cartManager.formatPrice(order.totals.grandTotal);

    // Reset timeline steps
    const steps = [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3'),
      document.getElementById('step4')
    ];

    steps.forEach(s => {
      s.classList.remove('active', 'completed');
    });
    steps[0].classList.add('completed');
    steps[1].classList.add('active');

    // Simulate real-time order progression
    if (simulatedTrackingInterval) clearInterval(simulatedTrackingInterval);
    let stepIndex = 1;
    simulatedTrackingInterval = setInterval(() => {
      if (stepIndex < 3) {
        steps[stepIndex].classList.remove('active');
        steps[stepIndex].classList.add('completed');
        stepIndex++;
        steps[stepIndex].classList.add('active');
        if (stepIndex === 2) {
          showToast("Update: Sizzling hot Chicken Steak is on its way with the delivery valet!", "success");
        }
      } else {
        steps[3].classList.remove('active');
        steps[3].classList.add('completed');
        clearInterval(simulatedTrackingInterval);
        showToast("Your feast has safely arrived! Enjoy from the Kitchen of Shangrilla Garden.", "success");
      }
    }, 6000);

    orderTrackerModal.classList.add('open');
  }

  // -------------------------------------------------------------
  // Table Reservation
  // -------------------------------------------------------------
  window.submitReservation = function(event) {
    event.preventDefault();
    const guestName = document.getElementById('resName').value;
    const guests = document.getElementById('resGuests').value;
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;
    const area = document.getElementById('resArea').value;

    const isMarquee = area === 'marquee' || parseInt(guests) >= 50;
    const bookingType = isMarquee ? 'Royal Marquee & Banquet' : 'Table';

    showToast(`${bookingType} booking received for ${guestName} (${guests} guests) on ${date}! Our manager will confirm via 0307-8882936 shortly.`, 'success');
    event.target.reset();
  };

  // -------------------------------------------------------------
  // Toast Notification System
  // -------------------------------------------------------------
  window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // -------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------
  function setupEventListeners() {
    // Search
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('visible', searchQuery.length > 0);
        }
        renderMenu();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.classList.remove('visible');
        renderMenu();
      });
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderMenu();
      });
    }

    // Cart Drawer Toggle
    if (cartBtn) cartBtn.addEventListener('click', () => cartOverlay.classList.add('open'));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('open'));
    if (cartOverlay) {
      cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cartOverlay.classList.remove('open');
      });
    }

    // Modal Closers
    if (closeCustomizerBtn) closeCustomizerBtn.addEventListener('click', () => customizerModal.classList.remove('open'));
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
    if (closeTrackerBtn) closeTrackerBtn.addEventListener('click', () => orderTrackerModal.classList.remove('open'));

    [customizerModal, checkoutModal, orderTrackerModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
    });

    // Coupon Apply
    if (applyCouponBtn && couponInput) {
      applyCouponBtn.addEventListener('click', () => {
        const code = couponInput.value;
        const res = window.cartManager.applyCoupon(code);
        if (res.success) {
          showToast(res.message, 'success');
          couponInput.value = '';
        } else {
          showToast(res.message, 'error');
        }
      });
    }

    // Currency Switcher
    currencyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.cartManager.setCurrency(btn.dataset.currency);
        syncCurrencyUI();
        renderMenu();
      });
    });

    // React to cart manager updates
    window.addEventListener('cart:updated', () => {
      syncCurrencyUI();
      updateCartUI();
      if (customizerModal.classList.contains('open')) {
        window.recalcModalPrice();
      }
    });
  }

  // -------------------------------------------------------------
  // Copy Link for Social Sharing
  // -------------------------------------------------------------
  window.copyPageShareLink = function() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Website link copied to clipboard! Share it with friends & family.", "success");
      }).catch(() => {
        showToast("Link: " + url, "success");
      });
    } else {
      showToast("Link: " + url, "success");
    }
  };
});

