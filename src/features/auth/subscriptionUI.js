import { api } from './api.js';
import { authService } from './auth.js';
import { ApiError } from './api.js';
import { launchMpgsCheckout } from './checkout.js';
import { getButtonText, setButtonText } from '../shared/uiIcons.js';
import {
  bindUnifiedPlanCard,
  renderUnifiedPlanCardHtml,
  splitPlansByInterval,
} from './planCard.js';

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
    /** @type {'month' | 'year'} */
    this._planInterval = 'year';
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

      this._planInterval = 'year';
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

    const { monthly, yearly } = splitPlansByInterval(this.plans);
    if (!monthly && !yearly) {
      this.plansContainer.innerHTML =
        '<p class="modal-desc plans-loading">No subscription plans are available right now.</p>';
      return;
    }

    if (this._planInterval === 'year' && !yearly) this._planInterval = 'month';
    if (this._planInterval === 'month' && !monthly) this._planInterval = 'year';

    this.plansContainer.classList.add('subscribe-plans--unified');
    this.plansContainer.innerHTML = renderUnifiedPlanCardHtml({
      monthly,
      yearly,
      interval: this._planInterval,
      currentSubscription: null,
    });

    bindUnifiedPlanCard(this.plansContainer, {
      getInterval: () => this._planInterval,
      onIntervalChange: (interval) => {
        this._planInterval = interval;
        this._renderPlans();
      },
      onSubscribe: (planId, button) => this._handleSubscribe(planId, button),
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
    if (!planId) return;

    this.errorEl?.classList.add('hidden');
    button.disabled = true;
    const originalText = getButtonText(button);
    setButtonText(button, 'Redirecting to payment…');

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
      setButtonText(button, originalText);
    }
  }

  async _startCheckout(planId) {
    await launchMpgsCheckout(planId);
  }
}
