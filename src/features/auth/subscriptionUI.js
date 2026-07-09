import { api } from './api.js';
import { authService } from './auth.js';
import { ApiError } from './api.js';
import { launchMpgsCheckout } from './checkout.js';

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

    window.addEventListener('subscription-activated', () => this.close(true));
  }

  _bindEvents() {
    this.closeBtn?.addEventListener('click', () => this.close(false));
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close(false);
    });
  }

  _showPlansLoading() {
    if (!this.plansContainer) return;
    this.plansContainer.innerHTML = '<p class="modal-desc plans-loading">Loading plans…</p>';
  }

  async _loadPlans() {
    this._showPlansLoading();
    this.errorEl?.classList.add('hidden');

    try {
      const { plans } = await api.getPlans();
      this.plans = plans;

      if (!plans?.length) {
        if (this.plansContainer) {
          this.plansContainer.innerHTML =
            '<p class="modal-desc plans-loading">No subscription plans are available right now.</p>';
        }
        return;
      }

      this._renderPlans();
    } catch (error) {
      console.error('Failed to load plans:', error);
      if (this.plansContainer) {
        this.plansContainer.innerHTML =
          '<p class="modal-desc plans-loading">Could not load plans. Make sure the API server is running.</p>';
      }
      if (this.errorEl) {
        this.errorEl.textContent =
          'Failed to load subscription plans. Run npm run dev:all or start the API on port 3001.';
        this.errorEl.classList.remove('hidden');
      }
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

  async open({ expired = false } = {}) {
    if (this.titleEl) {
      this.titleEl.textContent = expired ? 'Subscription expired' : 'Subscribe to download';
    }
    if (this.descEl) {
      this.descEl.textContent = expired
        ? 'Your plan has expired. Renew to continue downloading templates.'
        : 'Get unlimited access to the full template library and all export downloads.';
    }

    this.overlay?.classList.remove('hidden');
    await this._loadPlans();

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
    const hasSession = await authService.ensureSession();
    if (!hasSession) {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return false;
    }

    try {
      await authService.refreshSubscription();
    } catch {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return false;
      await authService.refreshSubscription();
    }

    if (authService.hasActiveSubscription()) return true;

    const expired = authService.isSubscriptionExpired();
    return this.open({ expired });
  }

  async _handleSubscribe(planId, button) {
    const hasSession = await authService.ensureSession();
    if (!hasSession) {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return;
    }

    this.errorEl?.classList.add('hidden');
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Redirecting to payment…';

    try {
      await this._startCheckout(planId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        authService.logout();
        const loggedIn = await this.authUI.requireLogin();
        if (loggedIn) {
          try {
            await this._startCheckout(planId);
            return;
          } catch (retryError) {
            error = retryError;
          }
        } else {
          return;
        }
      }

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

  async _startCheckout(planId) {
    await launchMpgsCheckout(planId);
  }
}
