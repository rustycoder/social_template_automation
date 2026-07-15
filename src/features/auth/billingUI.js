import { api, ApiError } from './api.js';
import { authService } from './auth.js';
import { launchMpgsCheckout } from './checkout.js';
import { getButtonText, setButtonText, buttonLabel } from '../shared/uiIcons.js';
import {
  bindUnifiedPlanCard,
  renderUnifiedPlanCardHtml,
  splitPlansByInterval,
} from './planCard.js';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Expiry date after extending by one billing period (matches server stacking).
 * @param {string | Date} expiresAt
 * @param {'month' | 'year' | string} billingInterval
 * @returns {Date | null}
 */
function getExtendedExpiryDate(expiresAt, billingInterval) {
  const currentExpiry = new Date(expiresAt);
  if (Number.isNaN(currentExpiry.getTime())) return null;
  const now = new Date();
  const base = currentExpiry > now ? new Date(currentExpiry) : now;
  const months = billingInterval === 'year' ? 12 : 1;
  base.setMonth(base.getMonth() + months);
  return base;
}

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Whole days until expiry (ceil). Negative when already expired.
 * @param {string | null | undefined} dateStr
 * @returns {number | null}
 */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDaysLeft(days) {
  if (days == null) return null;
  if (days > 1) return `${days} days left`;
  if (days === 1) return '1 day left';
  if (days === 0) return 'Expires today';
  if (days === -1) return 'Expired 1 day ago';
  return `Expired ${Math.abs(days)} days ago`;
}

export class BillingUI {
  /**
   * @param {import('./authUI.js').AuthUI} authUI
   * @param {{ standalone?: boolean }} [deps]
   */
  constructor(authUI, deps = {}) {
    this.authUI = authUI;
    this.standalone = !!deps.standalone;
    this.page = document.getElementById('billing-page');
    this.backBtn = document.getElementById('btn-billing-back');
    this.plansRow = document.getElementById('billing-plans-row');
    this.summaryEl = document.getElementById('billing-summary');
    this.plansEl = document.getElementById('billing-plans');
    this.plansDescEl = document.getElementById('billing-plans-desc');
    this.plansSection = document.getElementById('billing-plans-section');
    this.tableBody = document.getElementById('billing-table-body');
    this.emptyEl = document.getElementById('billing-empty');
    this.errorEl = document.getElementById('billing-error');
    this.loadingEl = document.getElementById('billing-loading');
    this.tableWrapper = document.getElementById('billing-table-wrapper');
    this._previousStep = 1;
    this._visible = false;
    this._loadId = 0;
    /** @type {object | null} */
    this._currentSubscription = null;
    /** @type {object[]} */
    this._plans = [];
    /** @type {'month' | 'year'} */
    this._planInterval = 'year';

    this._bindEvents();
    window.addEventListener('subscription-activated', () => {
      if (this._visible) this.show();
    });
  }

  _bindEvents() {
    this.backBtn?.addEventListener('click', () => this.hide());
  }

  _syncFooterPanel(activeStep) {
    document.getElementById('app-footer')?.querySelectorAll('.footer-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.footerStep === activeStep);
    });
  }

  _beginLoad() {
    if (this.summaryEl) this.summaryEl.innerHTML = '';
    if (this.plansEl) this.plansEl.innerHTML = '';
    if (this.tableBody) this.tableBody.innerHTML = '';
    this.emptyEl?.classList.add('hidden');
    this.tableWrapper?.classList.add('hidden');
    this.errorEl?.classList.add('hidden');
    this._setLoading(true);
  }

  async show() {
    if (!authService.isLoggedIn()) {
      const hasSession = await authService.ensureSession();
      if (!hasSession) {
        const loggedIn = await this.authUI.requireLogin();
        if (!loggedIn) {
          if (this.standalone) {
            window.location.href = '/';
          }
          return;
        }
      }
    }

    this.authUI._closeDropdown();
    this._visible = true;
    this._beginLoad();

    if (this.standalone) {
      this.page?.classList.add('active');
    } else {
      this._previousStep =
        document.querySelector('.step-panel.active')?.id?.replace('step-', '') || '1';

      const main = document.getElementById('main-content');
      if (main) main.dataset.layoutMode = 'billing';

      const app = document.getElementById('app');
      if (app) app.dataset.billing = 'true';

      document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
      this.page?.classList.add('active');
      this._syncFooterPanel('billing');
    }

    const loadId = ++this._loadId;
    try {
      await this._load(loadId);
      if (loadId === this._loadId) {
        await authService.refreshSubscription();
      }
    } catch {
      /* _load handles error UI */
    }
  }

  hide() {
    if (this.standalone) {
      window.location.href = '/';
      return;
    }

    this._visible = false;
    this._loadId += 1;
    this.page?.classList.remove('active');

    const step = parseInt(this._previousStep, 10) || 1;
    const app = document.getElementById('app');
    const main = document.getElementById('main-content');
    if (main) main.dataset.layoutMode = step === 2 ? 'split' : 'default';
    if (app) {
      delete app.dataset.billing;
      app.dataset.activeStep = String(step);
    }

    document.getElementById(`step-${step}`)?.classList.add('active');

    document.querySelectorAll('.step-node').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) btn.classList.add('active');
      else if (btnStep < step) btn.classList.add('completed');
    });

    this._syncFooterPanel(String(step));
  }

  async _load(loadId) {
    try {
      const [billing, plansRes] = await Promise.all([api.getBilling(), api.getPlans()]);
      if (loadId !== this._loadId || !this._visible) return;

      this._currentSubscription = billing.currentSubscription;
      this._plans = plansRes.plans || [];
      if (this._currentSubscription?.billingInterval === 'month') {
        this._planInterval = 'month';
      } else {
        this._planInterval = 'year';
      }

      this._renderSummary(this._currentSubscription);
      this._renderPlans();
      this._renderHistory(billing.history);
    } catch (error) {
      if (loadId !== this._loadId || !this._visible) return;

      const message =
        error instanceof ApiError ? error.message : 'Failed to load billing history.';
      if (this.errorEl) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
      }
      if (this.summaryEl) this.summaryEl.innerHTML = '';
      if (this.plansEl) this.plansEl.innerHTML = '';
      if (this.tableBody) this.tableBody.innerHTML = '';
      this.emptyEl?.classList.add('hidden');
      this.tableWrapper?.classList.add('hidden');
    } finally {
      if (loadId === this._loadId && this._visible) {
        this._setLoading(false);
      }
    }
  }

  _setLoading(loading) {
    this.loadingEl?.classList.toggle('hidden', !loading);
    if (loading) {
      this.tableWrapper?.classList.add('hidden');
      this.plansRow?.classList.add('hidden');
      this.summaryEl?.classList.add('hidden');
      this.plansSection?.classList.add('hidden');
      return;
    }

    this.plansRow?.classList.remove('hidden');
    this.summaryEl?.classList.remove('hidden');
    this.plansSection?.classList.remove('hidden');
  }

  _renderSummary(subscription) {
    if (!this.summaryEl) return;

    if (!subscription) {
      const expired = authService.isSubscriptionExpired();
      this.summaryEl.innerHTML = `
        <div class="billing-summary-card billing-summary-empty${expired ? ' billing-summary-expired' : ''}">
          <h3>${expired ? 'Subscription expired' : 'No active subscription'}</h3>
          <p>${
            expired
              ? 'Your plan has expired. Choose a plan below to renew and unlock template downloads.'
              : 'Choose an available plan to unlock template downloads and full library access.'
          }</p>
        </div>
      `;
      if (this.plansDescEl) {
        this.plansDescEl.textContent = expired
          ? 'Renew with a monthly or yearly plan.'
          : 'Subscribe to unlock downloads and full library access.';
      }
      return;
    }

    const interval = subscription.billingInterval === 'year' ? 'year' : 'month';
    const price = `$${(subscription.priceCents / 100).toFixed(subscription.priceCents % 100 === 0 ? 0 : 2)}`;
    const days = daysUntil(subscription.expiresAt);
    const daysLabel = formatDaysLeft(days);
    const daysTone =
      days == null ? '' : days < 0 ? ' is-expired' : days <= 7 ? ' is-soon' : ' is-ok';
    const periodLabel = subscription.billingInterval === 'year' ? '1 year' : '1 month';
    const extendedExpiry = getExtendedExpiryDate(
      subscription.expiresAt,
      subscription.billingInterval
    );
    const extendedExpiryLabel = extendedExpiry ? formatDate(extendedExpiry) : null;
    const extendLabel = extendedExpiryLabel
      ? `Renew ${periodLabel} → ${extendedExpiryLabel}`
      : `Renew ${periodLabel}`;

    this.summaryEl.innerHTML = `
      <div class="billing-summary-card">
        <div class="billing-summary-top">
          <div>
            <h3>${subscription.planName}</h3>
          </div>
          <div class="billing-summary-badges">
            ${
              daysLabel
                ? `<span class="billing-days-left${daysTone}">${daysLabel}</span>`
                : ''
            }
            <span class="billing-status-badge active">${formatStatus(subscription.status)}</span>
          </div>
        </div>
        <div class="billing-summary-meta">
          <div><span>Amount</span><strong>${price}/${interval}</strong></div>
          <div><span>Started</span><strong>${formatDate(subscription.startsAt)}</strong></div>
          <div><span>Expires</span><strong>${formatDate(subscription.expiresAt)}</strong></div>
        </div>
        ${
          extendedExpiryLabel
            ? `<p class="billing-summary-renew-note">
                 Adds ${periodLabel}:
                 <strong>${formatDate(subscription.expiresAt)}</strong>
                 <span class="billing-summary-extend-arrow" aria-hidden="true">→</span>
                 <strong>${extendedExpiryLabel}</strong>
               </p>`
            : ''
        }
        <ul class="plan-features billing-summary-features">
          <li>Full template library access</li>
          <li>Unlimited image &amp; video downloads</li>
          <li>All platform export formats</li>
        </ul>
        <div class="billing-summary-extend">
          <button type="button" class="btn btn-primary" id="btn-extend-current-plan" data-plan-id="${subscription.planId}">
            ${buttonLabel('calendar', `${extendLabel} — ${price}`)}
          </button>
        </div>
      </div>
    `;

    this.summaryEl.querySelector('#btn-extend-current-plan')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      this._handleSubscribe(btn.dataset.planId, btn);
    });

    if (this.plansDescEl) {
      this.plansDescEl.textContent =
        'Switch between monthly and yearly to extend from your expiry without losing remaining time.';
    }
  }

  _renderPlans() {
    if (!this.plansEl) return;

    if (!this._plans.length) {
      this.plansEl.innerHTML =
        '<p class="billing-plans-empty">No subscription plans are available right now.</p>';
      return;
    }

    const { monthly, yearly } = splitPlansByInterval(this._plans);
    if (!monthly && !yearly) {
      this.plansEl.innerHTML =
        '<p class="billing-plans-empty">No subscription plans are available right now.</p>';
      return;
    }

    if (this._planInterval === 'year' && !yearly) this._planInterval = 'month';
    if (this._planInterval === 'month' && !monthly) this._planInterval = 'year';

    this.plansEl.classList.add('subscribe-plans--unified');
    this.plansEl.innerHTML = renderUnifiedPlanCardHtml({
      monthly,
      yearly,
      interval: this._planInterval,
      currentSubscription: this._currentSubscription,
      getExtendedExpiryDate,
      formatDate,
    });

    bindUnifiedPlanCard(this.plansEl, {
      getInterval: () => this._planInterval,
      onIntervalChange: (interval) => {
        this._planInterval = interval;
        this._renderPlans();
      },
      onSubscribe: (planId, button) => this._handleSubscribe(planId, button),
    });
  }

  async _handleSubscribe(planId, button) {
    if (!planId) return;

    this.errorEl?.classList.add('hidden');
    button.disabled = true;
    const originalText = getButtonText(button);
    setButtonText(button, 'Redirecting to payment…');

    try {
      await launchMpgsCheckout(planId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        authService.logout();
        const loggedIn = await this.authUI.requireLogin();
        if (loggedIn) {
          try {
            await launchMpgsCheckout(planId);
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

  _renderHistory(history) {
    if (!this.tableBody) return;

    if (!history?.length) {
      this.tableBody.innerHTML = '';
      this.emptyEl?.classList.remove('hidden');
      this.tableWrapper?.classList.add('hidden');
      return;
    }

    this.emptyEl?.classList.add('hidden');
    this.tableWrapper?.classList.remove('hidden');

    this.tableBody.innerHTML = history
      .map((item) => {
        const interval = item.billingInterval === 'year' ? 'year' : 'month';
        const statusClass = item.status === 'active' ? 'active' : item.status;

        return `
          <tr>
            <td>${formatDate(item.createdAt)}</td>
            <td>${item.planName}</td>
            <td>${item.priceLabel}/${interval}</td>
            <td class="billing-table__col--hide-sm">${item.payment?.orderId || '—'}</td>
            <td class="billing-table__col--hide-sm">${formatDate(item.startsAt)}</td>
            <td>${formatDate(item.expiresAt)}</td>
            <td><span class="billing-status-badge ${statusClass}">${formatStatus(item.status)}</span></td>
          </tr>
        `;
      })
      .join('');
  }
}
