/**
 * Shangrilla Gardens & BBQ - Test Harness UI Controller
 * Manages tabs, automated test rendering, state scenarios, component sandboxes, and chaos simulation.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // State
  let activeTab = 'tab-runner';
  let activeSandboxComponent = 'sandbox-menu-card';
  let currentFilter = 'all';

  // Elements
  const tabButtons = document.querySelectorAll('.harness-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const runAllBtn = document.getElementById('runAllTestsBtn');
  const filterSelect = document.getElementById('filterStatusSelect');
  const exportMdBtn = document.getElementById('exportMarkdownReportBtn');
  const exportJsonBtn = document.getElementById('exportJsonReportBtn');
  const suitesContainer = document.getElementById('testSuitesContainer');
  const progressFill = document.getElementById('testRunnerProgressFill');

  // Metrics
  const metricTotal = document.getElementById('metricTotalTests');
  const metricPassed = document.getElementById('metricPassedTests');
  const metricFailed = document.getElementById('metricFailedTests');
  const metricRate = document.getElementById('metricPassRate');
  const metricCartCount = document.getElementById('metricCartCount');

  // State Inspector
  const cartJsonArea = document.getElementById('liveCartJsonTextarea');
  const orderHistoryJsonArea = document.getElementById('liveOrderHistoryJsonTextarea');
  const saveCartJsonBtn = document.getElementById('saveCartJsonBtn');
  const clearOrderHistoryBtn = document.getElementById('clearOrderHistoryBtn');
  const clearAllStateBtn = document.getElementById('clearAllStateBtn');

  // Sandbox
  const sandboxNavBtns = document.querySelectorAll('.sandbox-nav-btn');
  const sandboxStageTitle = document.getElementById('sandboxStageTitle');
  const sandboxStageControls = document.getElementById('sandboxStageControls');
  const sandboxStagePreview = document.getElementById('sandboxStagePreview');

  // Initialize
  setupTabs();
  renderSuitesList();
  updateMetricsRibbon();
  refreshStateInspector();
  setupSandbox();
  setupEventListeners();

  // Run tests automatically on initial load
  setTimeout(() => {
    runTests();
  }, 300);

  // -------------------------------------------------------------
  // Tabs Navigation
  // -------------------------------------------------------------
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        const targetPane = document.getElementById(activeTab);
        if (targetPane) {
          targetPane.classList.add('active');
        }

        if (activeTab === 'tab-scenarios') {
          refreshStateInspector();
        }
      });
    });
  }

  // -------------------------------------------------------------
  // Test Runner Rendering & Execution
  // -------------------------------------------------------------
  function renderSuitesList() {
    if (!suitesContainer || !window.harnessEngine) return;

    suitesContainer.innerHTML = window.harnessEngine.suites.map((suite, suiteIndex) => {
      return `
        <div class="suite-card" id="suite-card-${suiteIndex}">
          <div class="suite-header" onclick="window.toggleSuiteAccordion(${suiteIndex})">
            <div class="suite-title-group">
              <span class="suite-badge badge-idle" id="suite-badge-${suiteIndex}">IDLE</span>
              <span class="suite-title">${suite.name}</span>
            </div>
            <div style="display:flex; align-items:center; gap:1rem;">
              <span style="font-size:0.8rem; color:var(--h-text-dim);" id="suite-counts-${suiteIndex}">
                0 / ${suite.tests.length} passed
              </span>
              <button class="h-btn h-btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="event.stopPropagation(); window.runSingleSuite(${suiteIndex})">
                <i class="fa-solid fa-play"></i> Run Suite
              </button>
            </div>
          </div>
          <div class="test-list" id="suite-tests-${suiteIndex}">
            ${suite.tests.map((test, testIndex) => `
              <div class="test-item" id="test-item-${suiteIndex}-${testIndex}" data-status="${test.status}">
                <div class="test-item-left">
                  <div class="test-status-icon idle" id="test-icon-${suiteIndex}-${testIndex}">
                    <i class="fa-solid fa-circle-dot"></i>
                  </div>
                  <div>
                    <div>${test.name}</div>
                    <div class="test-error-box" id="test-err-${suiteIndex}-${testIndex}" style="display:none;"></div>
                  </div>
                </div>
                <div class="test-duration" id="test-dur-${suiteIndex}-${testIndex}">--</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  window.toggleSuiteAccordion = function (suiteIndex) {
    const list = document.getElementById(`suite-tests-${suiteIndex}`);
    if (list) {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    }
  };

  window.runSingleSuite = async function (suiteIndex) {
    if (!window.harnessEngine || window.harnessEngine.isRunning) return;
    const suite = window.harnessEngine.suites[suiteIndex];
    if (!suite) return;

    updateSuiteUIState(suite, suiteIndex, 'running');
    await window.harnessEngine.runSuite(suite);
    updateSuiteUIState(suite, suiteIndex, suite.status);
    updateMetricsRibbon();
    applyFilter();
  };

  async function runTests() {
    if (!window.harnessEngine || window.harnessEngine.isRunning) return;

    runAllBtn.disabled = true;
    runAllBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Tests...';
    progressFill.style.width = '0%';

    const totalTests = window.harnessEngine.suites.reduce((sum, s) => sum + s.tests.length, 0);
    let completedTests = 0;

    // Reset status icons
    window.harnessEngine.suites.forEach((suite, sIdx) => {
      updateSuiteUIState(suite, sIdx, 'running');
      suite.tests.forEach((test, tIdx) => {
        const icon = document.getElementById(`test-icon-${sIdx}-${tIdx}`);
        const err = document.getElementById(`test-err-${sIdx}-${tIdx}`);
        if (icon) icon.className = 'test-status-icon idle';
        if (err) err.style.display = 'none';
      });
    });

    window.harnessEngine.on('testComplete', ({ suite, test }) => {
      completedTests++;
      const pct = Math.round((completedTests / totalTests) * 100);
      progressFill.style.width = `${pct}%`;

      const sIdx = window.harnessEngine.suites.indexOf(suite);
      const tIdx = suite.tests.indexOf(test);

      const icon = document.getElementById(`test-icon-${sIdx}-${tIdx}`);
      const dur = document.getElementById(`test-dur-${sIdx}-${tIdx}`);
      const err = document.getElementById(`test-err-${sIdx}-${tIdx}`);
      const item = document.getElementById(`test-item-${sIdx}-${tIdx}`);

      if (item) item.dataset.status = test.status;

      if (test.status === 'pass') {
        if (icon) icon.className = 'test-status-icon pass';
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        if (err) err.style.display = 'none';
      } else {
        if (icon) icon.className = 'test-status-icon fail';
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        if (err) {
          err.style.display = 'block';
          err.textContent = test.error || 'Assertion failed';
        }
      }

      if (dur) dur.textContent = `${test.duration.toFixed(1)}ms`;
    });

    window.harnessEngine.on('suiteComplete', (suite) => {
      const sIdx = window.harnessEngine.suites.indexOf(suite);
      updateSuiteUIState(suite, sIdx, suite.status);
    });

    await window.harnessEngine.runAll();

    runAllBtn.disabled = false;
    runAllBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run All Tests';
    progressFill.style.width = '100%';

    updateMetricsRibbon();
    applyFilter();
    showToast('All test suites executed successfully', 'success');
  }

  function updateSuiteUIState(suite, sIdx, status) {
    const badge = document.getElementById(`suite-badge-${sIdx}`);
    const counts = document.getElementById(`suite-counts-${sIdx}`);

    if (counts) {
      counts.textContent = `${suite.passedCount} / ${suite.tests.length} passed`;
    }

    if (!badge) return;

    if (status === 'running') {
      badge.className = 'suite-badge badge-idle';
      badge.textContent = 'RUNNING';
    } else if (status === 'pass') {
      badge.className = 'suite-badge badge-pass';
      badge.textContent = 'PASS';
    } else if (status === 'fail') {
      badge.className = 'suite-badge badge-fail';
      badge.textContent = 'FAIL';
    } else {
      badge.className = 'suite-badge badge-idle';
      badge.textContent = 'IDLE';
    }
  }

  function updateMetricsRibbon() {
    if (!window.harnessEngine) return;
    const stats = window.harnessEngine.getStats();

    if (metricTotal) metricTotal.textContent = stats.totalTests;
    if (metricPassed) metricPassed.textContent = stats.totalPassed;
    if (metricFailed) metricFailed.textContent = stats.totalFailed;
    if (metricRate) metricRate.textContent = `${stats.passRate}%`;

    if (metricCartCount && window.cartManager) {
      metricCartCount.textContent = window.cartManager.getTotalCount();
    }
  }

  function applyFilter() {
    const status = filterSelect ? filterSelect.value : 'all';
    document.querySelectorAll('.test-item').forEach(item => {
      const itemStatus = item.dataset.status;
      if (status === 'all') {
        item.style.display = 'flex';
      } else if (status === 'pass') {
        item.style.display = (itemStatus === 'pass') ? 'flex' : 'none';
      } else if (status === 'fail') {
        item.style.display = (itemStatus === 'fail') ? 'flex' : 'none';
      }
    });
  }

  // -------------------------------------------------------------
  // State & Scenario Injector
  // -------------------------------------------------------------
  window.applyHarnessScenario = function (type) {
    if (!window.cartManager) return;

    if (type === 'empty') {
      window.cartManager.clearCart();
      window.cartManager.setCurrency('USD');
      showToast('Reset state: Cart is now empty', 'info');
    } else if (type === 'single-steak') {
      window.cartManager.clearCart();
      window.cartManager.addItem('truffle-mushroom-steak', 0, ['Extra Creamy Truffle Mushroom Sauce'], 'Normal', 'Medium rare sizzler', 1);
      showToast('Injected Single Truffle Mushroom Steak with extra sauce', 'success');
    } else if (type === 'near-threshold') {
      window.cartManager.clearCart();
      // Add Handi ($16.50) + Salsa Steak ($17.99) = $34.49 (51 cents away from $35.00)
      window.cartManager.addItem('handi-chicken-hari-mirch', 0, [], 'Mild', '', 1);
      window.cartManager.addItem('fire-glazed-mexican-steak', 0, [], 'Normal', '', 1);
      showToast('Configured cart near free shipping threshold ($34.49 / $35.00)', 'warning');
    } else if (type === 'vip-feast') {
      window.cartManager.clearCart();
      window.cartManager.addItem('truffle-mushroom-steak', 1, ['Extra Creamy Truffle Mushroom Sauce', 'Crispy Herb Potato Wedges'], 'Normal', '', 2);
      window.cartManager.addItem('bbq-malai-boti-platter', 0, [], 'Normal', '', 2);
      window.cartManager.addItem('special-artisan-nans-platter', 0, [], 'Normal', '', 3);
      window.cartManager.addItem('signature-shangrilla-mocktails', 0, [], 'Chilled', '', 4);
      showToast('Injected VIP Royal Feast (> $100, free shipping unlocked)', 'success');
    } else if (type === 'promo-percent') {
      window.cartManager.clearCart();
      window.cartManager.addItem('truffle-mushroom-steak', 0, [], 'Normal', '', 2);
      window.cartManager.applyCoupon('SHANGRILLA10');
      showToast('Applied 10% off promo coupon SHANGRILLA10', 'success');
    } else if (type === 'pkr') {
      window.cartManager.setCurrency('PKR');
      showToast('Switched currency to PKR (Rs. 285 / USD)', 'info');
    } else if (type === 'corrupt') {
      localStorage.setItem('shangrilla_cart_v1', '<<INVALID_MALFORMED_JSON>>');
      showToast('Injected corrupt JSON into localStorage', 'danger');
    }

    refreshStateInspector();
    updateMetricsRibbon();
  };

  function refreshStateInspector() {
    if (cartJsonArea) {
      const rawCart = localStorage.getItem('shangrilla_cart_v1') || '[]';
      try {
        cartJsonArea.value = JSON.stringify(JSON.parse(rawCart), null, 2);
      } catch (e) {
        cartJsonArea.value = rawCart;
      }
    }

    if (orderHistoryJsonArea) {
      const rawOrders = localStorage.getItem('shangrilla_orders_v1') || '[]';
      try {
        orderHistoryJsonArea.value = JSON.stringify(JSON.parse(rawOrders), null, 2);
      } catch (e) {
        orderHistoryJsonArea.value = rawOrders;
      }
    }
  }

  // -------------------------------------------------------------
  // Component Isolation Sandbox
  // -------------------------------------------------------------
  function setupSandbox() {
    sandboxNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sandboxNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSandboxComponent = btn.dataset.sandbox;
        renderSandboxComponent();
      });
    });

    renderSandboxComponent();
  }

  function renderSandboxComponent() {
    if (!sandboxStagePreview || !sandboxStageTitle || !sandboxStageControls) return;

    if (activeSandboxComponent === 'sandbox-menu-card') {
      sandboxStageTitle.textContent = 'Menu Card Component (Isolated)';
      sandboxStageControls.innerHTML = `
        <select class="h-select" id="sandboxDishSelect" onchange="window.selectSandboxDish(this.value)">
          ${RESTAURANT_DATA.items.map(i => `<option value="${i.id}">${i.title}</option>`).join('')}
        </select>
      `;
      renderMenuCardSandbox('truffle-mushroom-steak');
    } else if (activeSandboxComponent === 'sandbox-customizer') {
      sandboxStageTitle.textContent = 'Item Customizer Modal (Isolated)';
      sandboxStageControls.innerHTML = `
        <button class="h-btn h-btn-primary" onclick="window.renderCustomizerSandbox('truffle-mushroom-steak')">
          Reset Customizer
        </button>
      `;
      renderCustomizerSandbox('truffle-mushroom-steak');
    } else if (activeSandboxComponent === 'sandbox-receipt') {
      sandboxStageTitle.textContent = 'Thermal Printable Invoice Receipt';
      sandboxStageControls.innerHTML = `
        <button class="h-btn h-btn-secondary" onclick="window.printSandboxReceipt()">
          <i class="fa-solid fa-print"></i> Test Print
        </button>
      `;
      renderReceiptSandbox();
    } else if (activeSandboxComponent === 'sandbox-timeline') {
      sandboxStageTitle.textContent = 'Order Status Live Timeline';
      sandboxStageControls.innerHTML = `
        <div style="display:flex; gap:0.5rem;">
          <button class="h-btn h-btn-secondary" onclick="window.setTimelineStep(1)">Step 1</button>
          <button class="h-btn h-btn-secondary" onclick="window.setTimelineStep(2)">Step 2</button>
          <button class="h-btn h-btn-secondary" onclick="window.setTimelineStep(3)">Step 3</button>
          <button class="h-btn h-btn-secondary" onclick="window.setTimelineStep(4)">Step 4</button>
        </div>
      `;
      renderTimelineSandbox(2);
    } else if (activeSandboxComponent === 'sandbox-toasts') {
      sandboxStageTitle.textContent = 'Toast Notification Emitter';
      sandboxStageControls.innerHTML = '';
      renderToastsSandbox();
    }
  }

  window.selectSandboxDish = function (dishId) {
    renderMenuCardSandbox(dishId);
  };

  function renderMenuCardSandbox(dishId) {
    const item = RESTAURANT_DATA.items.find(i => i.id === dishId) || RESTAURANT_DATA.items[0];
    sandboxStagePreview.innerHTML = `
      <div class="menu-card" style="max-width:360px; width:100%;">
        <div class="menu-card-img-wrap">
          <img src="${item.image}" alt="${item.title}" class="menu-card-img">
          ${item.badge ? `<span class="menu-badge">${item.badge}</span>` : ''}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-header">
            <h3 class="menu-card-title">${item.title}</h3>
            <div class="menu-card-price">${window.cartManager.formatPrice(item.price)}</div>
          </div>
          <p class="menu-card-desc">${item.description.slice(0, 110)}...</p>
          <div class="menu-card-actions">
            <button class="btn-primary" style="width:100%; justify-content:center;" onclick="window.sandboxQuickAdd('${item.id}')">
              <i class="fa-solid fa-plus"></i> Add to Order
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.sandboxQuickAdd = function (dishId) {
    window.cartManager.addItem(dishId, 0, [], 'Normal', '', 1);
    updateMetricsRibbon();
    showToast('Added dish to cart from Sandbox!', 'success');
  };

  window.renderCustomizerSandbox = function (dishId) {
    const item = RESTAURANT_DATA.items.find(i => i.id === dishId) || RESTAURANT_DATA.items[0];
    sandboxStagePreview.innerHTML = `
      <div style="background:var(--h-surface-elevated); border:1px solid var(--h-border); border-radius:12px; padding:1.5rem; max-width:480px; width:100%;">
        <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
          <img src="${item.image}" style="width:70px; height:70px; border-radius:8px; object-fit:cover;">
          <div>
            <h4 style="font-size:1.1rem; font-weight:700;">${item.title}</h4>
            <div style="color:var(--h-gold); font-weight:700;" id="sbCustomizerPrice">${window.cartManager.formatPrice(item.price)}</div>
          </div>
        </div>
        <div style="font-size:0.85rem; font-weight:600; margin-bottom:0.5rem;">Select Portion:</div>
        <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1rem;">
          ${item.portions.map((p, idx) => `
            <label style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer;">
              <span><input type="radio" name="sbPortion" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="window.updateSandboxCustomizerPrice('${item.id}')"> ${p.name}</span>
              <span style="color:var(--h-gold); font-size:0.8rem;">+${window.cartManager.formatPrice(p.priceDelta)}</span>
            </label>
          `).join('')}
        </div>
        <div style="font-size:0.85rem; font-weight:600; margin-bottom:0.5rem;">Add-ons:</div>
        <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1.5rem;">
          ${item.addons.map((a, idx) => `
            <label style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer;">
              <span><input type="checkbox" name="sbAddon" value="${a.price}" onchange="window.updateSandboxCustomizerPrice('${item.id}')"> ${a.name}</span>
              <span style="color:var(--h-gold); font-size:0.8rem;">+${window.cartManager.formatPrice(a.price)}</span>
            </label>
          `).join('')}
        </div>
        <button class="h-btn h-btn-primary" style="width:100%; justify-content:center;" onclick="showToast('Customizer options confirmed!', 'success')">
          Confirm Customization
        </button>
      </div>
    `;
  };

  window.updateSandboxCustomizerPrice = function (dishId) {
    const item = RESTAURANT_DATA.items.find(i => i.id === dishId);
    if (!item) return;

    const selectedPortion = document.querySelector('input[name="sbPortion"]:checked');
    const pIndex = selectedPortion ? parseInt(selectedPortion.value) : 0;
    const pDelta = item.portions[pIndex] ? item.portions[pIndex].priceDelta : 0;

    let addonsSum = 0;
    document.querySelectorAll('input[name="sbAddon"]:checked').forEach(chk => {
      addonsSum += parseFloat(chk.value) || 0;
    });

    const total = item.price + pDelta + addonsSum;
    const el = document.getElementById('sbCustomizerPrice');
    if (el) el.textContent = window.cartManager.formatPrice(total);
  };

  function renderReceiptSandbox() {
    sandboxStagePreview.innerHTML = `
      <div class="receipt-paper" style="max-width:380px; width:100%;">
        <div class="receipt-header">
          <div>
            <strong style="color:var(--text-main); font-size:1rem;">Shangrilla Gardens &amp; BBQ</strong>
            <div style="font-size:0.75rem; color:var(--text-dim);">A little sophistication, served hot</div>
          </div>
          <div style="text-align:right;">
            <span class="ribbon" style="font-size:0.65rem;">PAID / COD</span>
          </div>
        </div>
        <div style="font-size:0.8rem; margin-bottom:12px;">
          <div>Guest: <strong>Taimoor Khan</strong></div>
          <div>Destination: <strong>Gulgasht Colony, Multan</strong></div>
          <div>Order ID: <strong>#SG-78912</strong></div>
        </div>
        <div style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:10px; font-size:0.82rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>1x Truffle Mushroom Steak</span>
            <span>$18.99</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>2x Roghani Naans</span>
            <span>$7.00</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:var(--h-success);">
            <span>Promo SHANGRILLA10 (10%)</span>
            <span>-$2.60</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Tax (5%)</span>
            <span>$1.17</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Delivery Fee</span>
            <span>$2.50</span>
          </div>
        </div>
        <div class="receipt-total" style="border-top:1px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:700;">
          <span>Total Billed:</span>
          <span>$27.06</span>
        </div>
      </div>
    `;
  }

  window.printSandboxReceipt = function () {
    window.print();
  };

  function renderTimelineSandbox(activeStep) {
    window.setTimelineStep = function (step) {
      renderTimelineSandbox(step);
    };

    sandboxStagePreview.innerHTML = `
      <div style="background:var(--h-surface-elevated); border:1px solid var(--h-border); border-radius:12px; padding:2rem; max-width:540px; width:100%;">
        <div style="text-align:center; margin-bottom:1.5rem;">
          <h4 style="font-size:1.2rem; font-weight:700;">Live Kitchen Timeline</h4>
          <p style="font-size:0.8rem; color:var(--h-text-dim);">Current Status: <strong>${['Order Received', 'In Kitchen Cooking', 'Driver On The Way', 'Delivered'][activeStep - 1]}</strong></p>
        </div>
        <div class="order-timeline">
          <div class="timeline-step ${activeStep >= 1 ? (activeStep === 1 ? 'active' : 'completed') : ''}">
            <div class="timeline-icon-circle"><i class="fa-solid fa-file-invoice"></i></div>
            <span class="timeline-label">Received</span>
          </div>
          <div class="timeline-step ${activeStep >= 2 ? (activeStep === 2 ? 'active' : 'completed') : ''}">
            <div class="timeline-icon-circle"><i class="fa-solid fa-fire"></i></div>
            <span class="timeline-label">In Kitchen</span>
          </div>
          <div class="timeline-step ${activeStep >= 3 ? (activeStep === 3 ? 'active' : 'completed') : ''}">
            <div class="timeline-icon-circle"><i class="fa-solid fa-motorcycle"></i></div>
            <span class="timeline-label">On the Way</span>
          </div>
          <div class="timeline-step ${activeStep >= 4 ? 'completed' : ''}">
            <div class="timeline-icon-circle"><i class="fa-solid fa-bell-concierge"></i></div>
            <span class="timeline-label">Delivered</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderToastsSandbox() {
    sandboxStagePreview.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:1rem; justify-content:center;">
        <button class="h-btn h-btn-success" onclick="showToast('Order confirmed successfully!', 'success')">
          <i class="fa-solid fa-check"></i> Trigger Success Toast
        </button>
        <button class="h-btn h-btn-danger" onclick="showToast('Payment processing failed. Card declined.', 'danger')">
          <i class="fa-solid fa-triangle-exclamation"></i> Trigger Error Toast
        </button>
        <button class="h-btn h-btn-secondary" style="color:var(--h-warning); border-color:var(--h-warning);" onclick="showToast('Add $1.50 more for FREE delivery!', 'warning')">
          <i class="fa-solid fa-truck"></i> Trigger Warning Toast
        </button>
        <button class="h-btn h-btn-secondary" style="color:var(--h-info); border-color:var(--h-info);" onclick="showToast('Promo code applied to your order', 'info')">
          <i class="fa-solid fa-circle-info"></i> Trigger Info Toast
        </button>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Chaos & Viewports
  // -------------------------------------------------------------
  window.setViewportWidth = function (width) {
    const frameWrap = document.getElementById('viewportFrameWrapper');
    if (frameWrap) {
      frameWrap.style.width = `${width}px`;
      showToast(`Viewport resized to ${width}px`, 'info');
    }
  };

  window.setSimulatedLatency = function (ms) {
    const latency = parseInt(ms);
    if (latency > 0) {
      showToast(`Injected ${latency}ms latency simulation`, 'warning');
    } else {
      showToast(`Latency simulation disabled (0ms)`, 'info');
    }
  };

  // -------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------
  function showToast(msg, type = 'info') {
    const container = document.getElementById('harnessToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'h-toast';

    let icon = 'fa-circle-info';
    let color = 'var(--h-info)';
    if (type === 'success') {
      icon = 'fa-circle-check';
      color = 'var(--h-success)';
    } else if (type === 'danger') {
      icon = 'fa-circle-exclamation';
      color = 'var(--h-danger)';
    } else if (type === 'warning') {
      icon = 'fa-triangle-exclamation';
      color = 'var(--h-warning)';
    }

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="color:${color};"></i>
      <span>${msg}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
  window.showToast = showToast;

  // -------------------------------------------------------------
  // Events & Setup
  // -------------------------------------------------------------
  function setupEventListeners() {
    if (runAllBtn) {
      runAllBtn.addEventListener('click', runTests);
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', applyFilter);
    }

    if (exportMdBtn && window.harnessEngine) {
      exportMdBtn.addEventListener('click', () => {
        const md = window.harnessEngine.generateMarkdownReport();
        downloadFile('shangrilla-test-report.md', md, 'text/markdown');
        showToast('Exported test report as Markdown', 'success');
      });
    }

    if (exportJsonBtn && window.harnessEngine) {
      exportJsonBtn.addEventListener('click', () => {
        const data = {
          date: new Date().toISOString(),
          stats: window.harnessEngine.getStats(),
          suites: window.harnessEngine.suites.map(s => ({
            name: s.name,
            status: s.status,
            passed: s.passedCount,
            failed: s.failedCount,
            tests: s.tests.map(t => ({
              name: t.name,
              status: t.status,
              durationMs: t.duration,
              error: t.error
            }))
          }))
        };
        downloadFile('shangrilla-test-report.json', JSON.stringify(data, null, 2), 'application/json');
        showToast('Exported test report as JSON', 'success');
      });
    }

    if (saveCartJsonBtn && cartJsonArea) {
      saveCartJsonBtn.addEventListener('click', () => {
        try {
          const parsed = JSON.parse(cartJsonArea.value);
          localStorage.setItem('shangrilla_cart_v1', JSON.stringify(parsed));
          if (window.cartManager) {
            window.cartManager.cart = parsed;
            window.cartManager.notify();
          }
          updateMetricsRibbon();
          showToast('Updated cart state in localStorage!', 'success');
        } catch (e) {
          showToast('Invalid JSON in cart editor: ' + e.message, 'danger');
        }
      });
    }

    if (clearOrderHistoryBtn) {
      clearOrderHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('shangrilla_orders_v1');
        refreshStateInspector();
        showToast('Cleared order history', 'info');
      });
    }

    if (clearAllStateBtn) {
      clearAllStateBtn.addEventListener('click', () => {
        localStorage.clear();
        if (window.cartManager) {
          window.cartManager.clearCart();
        }
        refreshStateInspector();
        updateMetricsRibbon();
        showToast('Cleared all localStorage state', 'warning');
      });
    }
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

});
