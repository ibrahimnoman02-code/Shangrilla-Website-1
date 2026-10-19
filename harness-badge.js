/**
 * Shangrilla Gardens & BBQ - Developer Quick-Access HUD & Badge
 * Provides an unobtrusive floating dev widget on the live site to quickly jump to the test harness,
 * inspect cart items, and test common scenario states.
 */

(function () {
  'use strict';

  function initDevHUD() {
    // Avoid double injection
    if (document.getElementById('shangrillaDevHUD')) return;

    // Inject styles
    const style = document.createElement('style');
    style.id = 'shangrillaDevHUDStyles';
    style.textContent = `
      .dev-hud-widget {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 99999;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .dev-hud-pill {
        background: rgba(19, 27, 38, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(212, 163, 89, 0.4);
        border-radius: 999px;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .dev-hud-pill:hover {
        transform: translateY(-2px);
        border-color: #d4a359;
        box-shadow: 0 10px 28px rgba(212, 163, 89, 0.25);
      }
      .dev-hud-badge {
        background: linear-gradient(135deg, #d4a359, #ff5722);
        color: #0b0f17;
        font-size: 11px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .dev-hud-label {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dev-hud-panel {
        display: none;
        position: absolute;
        bottom: calc(100% + 12px);
        left: 0;
        width: 290px;
        background: #131b26;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
        flex-direction: column;
        gap: 10px;
        animation: devHudFadeIn 0.2s ease-out;
      }
      .dev-hud-panel.open {
        display: flex;
      }
      @keyframes devHudFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .dev-hud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 8px;
      }
      .dev-hud-header strong {
        font-size: 13px;
        color: #d4a359;
      }
      .dev-hud-stats {
        font-size: 12px;
        color: #94a3b8;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .dev-hud-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        transition: background 0.15s;
      }
      .dev-hud-btn:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .dev-hud-btn-primary {
        background: linear-gradient(135deg, #d4a359, #b3843e);
        color: #0b0f17;
        font-weight: 700;
        border: none;
        justify-content: center;
      }
      .dev-hud-btn-primary:hover {
        filter: brightness(1.1);
      }
    `;
    document.head.appendChild(style);

    // Build markup
    const hud = document.createElement('aside');
    hud.className = 'dev-hud-widget';
    hud.id = 'shangrillaDevHUD';
    hud.setAttribute('aria-label', 'Developer Harness HUD');

    hud.innerHTML = `
      <div class="dev-hud-panel" id="devHudPanel">
        <div class="dev-hud-header">
          <strong>Quality &amp; Test HUD</strong>
          <button style="background:none; border:none; color:#64748b; cursor:pointer;" id="devHudCloseBtn" aria-label="Close HUD">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="dev-hud-stats" id="devHudStats">
          <div>Cart Items: <strong id="hudCartCount" style="color:#f1f5f9;">0</strong></div>
          <div>Currency: <strong id="hudCurrency" style="color:#d4a359;">USD ($)</strong></div>
        </div>
        <a href="harness.html" class="dev-hud-btn dev-hud-btn-primary" target="_blank">
          <i class="fa-solid fa-flask-vial"></i> Open Test Harness
        </a>
        <button class="dev-hud-btn" id="hudClearCartBtn">
          <i class="fa-solid fa-trash-can"></i> Clear Cart State
        </button>
        <button class="dev-hud-btn" id="hudLoadFeastBtn">
          <i class="fa-solid fa-crown" style="color:#d4a359;"></i> Load VIP Feast (> $100)
        </button>
      </div>

      <div class="dev-hud-pill" id="devHudToggle" title="Click to open Developer Quality HUD">
        <span class="dev-hud-badge">QA</span>
        <span class="dev-hud-label">
          <i class="fa-solid fa-microchip" style="color:#d4a359;"></i>
          <span>Dev Harness</span>
        </span>
      </div>
    `;

    document.body.appendChild(hud);

    // Event handlers
    const pill = document.getElementById('devHudToggle');
    const panel = document.getElementById('devHudPanel');
    const closeBtn = document.getElementById('devHudCloseBtn');
    const clearBtn = document.getElementById('hudClearCartBtn');
    const feastBtn = document.getElementById('hudLoadFeastBtn');

    function updateHudMetrics() {
      if (!window.cartManager) return;
      const countEl = document.getElementById('hudCartCount');
      const currEl = document.getElementById('hudCurrency');
      if (countEl) countEl.textContent = window.cartManager.getTotalCount();
      if (currEl) currEl.textContent = window.cartManager.getCurrency();
    }

    if (pill && panel) {
      pill.addEventListener('click', () => {
        panel.classList.toggle('open');
        updateHudMetrics();
      });
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('open');
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.cartManager) {
          window.cartManager.clearCart();
          updateHudMetrics();
        }
      });
    }

    if (feastBtn) {
      feastBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.cartManager) {
          window.cartManager.clearCart();
          window.cartManager.addItem('truffle-mushroom-steak', 1, ['Extra Creamy Truffle Mushroom Sauce'], 'Normal', '', 2);
          window.cartManager.addItem('bbq-malai-boti-platter', 0, [], 'Normal', '', 2);
          window.cartManager.addItem('special-artisan-nans-platter', 0, [], 'Normal', '', 3);
          updateHudMetrics();
        }
      });
    }

    window.addEventListener('cart:updated', updateHudMetrics);
    updateHudMetrics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevHUD);
  } else {
    initDevHUD();
  }
})();
