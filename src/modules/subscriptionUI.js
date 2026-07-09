import { api } from './api.js';
import { authService } from './auth.js';
import { ApiError } from './api.js';

export class SubscriptionUI {
  constructor(authUI) {
    this.authUI = authUI;
    this.overlay = document.getElementById('subscribe-modal-overlay');
    this.closeBtn = document.getElementById('subscribe-modal-close');
    this.plansContainer = document.getElementById('subscribe-plans');
    this.errorEl = document.getElementById('subscribe-error');
    this.titleEl = document.getElementById('subscribe-modal-title');
    this.descEl = document.getElementById('subscribe-modal-desc');
    this.plans = [];
    this._resolveOpen = null;

    this._bindEvents();
    this._loadPlans();
  }

  _bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close(false));
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close(false);
    });
  }

  async _loadPlans() {
    try {
      const { plans } = await api.getPlans();
      this.plans = plans;
      this._renderPlans();
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }

  _renderPlans() {
    if (!this.plansContainer) return;

    this.plansContainer.innerHTML = this.plans
      .map((plan) => {
        const intervalLabel = plan.billingInterval === 'year' ? 'per year' : 'per month';
        const savings =
          plan.billingInterval === 'year'
            ? '<span class="plan-savings">Billed once per year</span>'
            : '';
        const featured = plan.billingInterval === 'year' ? ' featured' : '';

        return `
          <article class="subscribe-plan-card${featured}" data-plan-id="${plan.id}">
            ${plan.billingInterval === 'year' ? '<span class="plan-badge">Best value</span>' : ''}
            <h3>${plan.name}</h3>
            <p class="plan-price">${plan.priceLabel}<span>/${plan.billingInterval === 'year' ? 'yr' : 'mo'}</span></p>
            <p class="plan-interval">${intervalLabel}</p>
            <p class="plan-desc">${plan.description}</p>
            ${savings}
            <ul class="plan-features">
              <li>Full template library access</li>
              <li>Unlimited image &amp; video downloads</li>
              <li>All platform export formats</li>
            </ul>
            <button type="button" class="btn btn-primary btn-subscribe-plan" data-plan-id="${plan.id}">
              Subscribe — ${plan.priceLabel}
            </button>
          </article>
        `;
      })
      .join('');

    this.plansContainer.querySelectorAll('.btn-subscribe-plan').forEach((btn) => {
      btn.addEventListener('click', () => this._handleSubscribe(btn.dataset.planId, btn));
    });
  }

  open({ expired = false } = {}) {
    this.errorEl?.classList.add('hidden');

    if (this.titleEl) {
      this.titleEl.textContent = expired ? 'Subscription expired' : 'Subscribe to download';
    }
    if (this.descEl) {
      this.descEl.textContent = expired
        ? 'Your plan has expired. Renew to continue downloading templates.'
        : 'Get unlimited access to the full template library and all export downloads.';
    }

    this.overlay?.classList.remove('hidden');

    return new Promise((resolve) => {
      this._resolveOpen = resolve;
    });
  }

  close(subscribed = false) {
    this.overlay?.classList.add('hidden');
    if (this._resolveOpen) {
      this._resolveOpen(subscribed);
      this._resolveOpen = null;
    }
  }

  async requireSubscription() {
    if (!authService.isLoggedIn()) {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return false;
    }

    await authService.refreshSubscription();

    if (authService.hasActiveSubscription()) return true;

    const expired = authService.isSubscriptionExpired();
    return this.open({ expired });
  }

  async _handleSubscribe(planId, button) {
    if (!authService.isLoggedIn()) {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return;
    }

    this.errorEl?.classList.add('hidden');
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Processing…';

    try {
      await authService.subscribe(planId);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Subscription activated! You can now download.', type: 'success' },
        })
      );
      this.close(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Subscription failed. Please try again.';
      if (this.errorEl) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
      }
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}
