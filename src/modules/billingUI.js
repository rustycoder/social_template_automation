import { api, ApiError } from './api.js';
import { authService } from './auth.js';

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

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export class BillingUI {
  constructor(authUI) {
    this.authUI = authUI;
    this.page = document.getElementById('billing-page');
    this.backBtn = document.getElementById('btn-billing-back');
    this.summaryEl = document.getElementById('billing-summary');
    this.tableBody = document.getElementById('billing-table-body');
    this.emptyEl = document.getElementById('billing-empty');
    this.errorEl = document.getElementById('billing-error');
    this.loadingEl = document.getElementById('billing-loading');
    this.tableWrapper = document.getElementById('billing-table-wrapper');
    this._previousStep = 1;
    this._visible = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.backBtn?.addEventListener('click', () => this.hide());
  }

  async show() {
    if (!authService.isLoggedIn()) {
      const loggedIn = await this.authUI.requireLogin();
      if (!loggedIn) return;
    }

    this.authUI._closeDropdown();
    this._previousStep = document.querySelector('.step-panel.active')?.id?.replace('step-', '') || '1';
    this._visible = true;

    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
    document.querySelector('.header-nav')?.classList.add('hidden');
    this.page?.classList.add('active');

    await authService.refreshSubscription();
    await this._load();
  }

  hide() {
    this._visible = false;
    this.page?.classList.remove('active');
    document.querySelector('.header-nav')?.classList.remove('hidden');

    const step = parseInt(this._previousStep, 10) || 1;
    document.getElementById(`step-${step}`)?.classList.add('active');

    document.querySelectorAll('.step-btn').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) btn.classList.add('active');
      else if (btnStep < step) btn.classList.add('completed');
    });
  }

  async _load() {
    this._setLoading(true);
    this.errorEl?.classList.add('hidden');

    try {
      const data = await api.getBilling();
      this._renderSummary(data.currentSubscription);
      this._renderHistory(data.history);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load billing history.';
      if (this.errorEl) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
      }
      this.summaryEl.innerHTML = '';
      this.tableBody.innerHTML = '';
      this.emptyEl?.classList.add('hidden');
      this.tableWrapper?.classList.add('hidden');
    } finally {
      this._setLoading(false);
    }
  }

  _setLoading(loading) {
    this.loadingEl?.classList.toggle('hidden', !loading);
    this.tableWrapper?.classList.toggle('hidden', loading);
    this.summaryEl?.classList.toggle('hidden', loading);
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
              ? 'Your plan has expired. Subscribe again to unlock template downloads.'
              : 'Subscribe to unlock template downloads and full library access.'
          }</p>
        </div>
      `;
      return;
    }

    const interval = subscription.billingInterval === 'year' ? 'year' : 'month';
    const price = `$${(subscription.priceCents / 100).toFixed(subscription.priceCents % 100 === 0 ? 0 : 2)}`;

    this.summaryEl.innerHTML = `
      <div class="billing-summary-card">
        <div class="billing-summary-top">
          <div>
            <span class="billing-summary-label">Current plan</span>
            <h3>${subscription.planName}</h3>
          </div>
          <span class="billing-status-badge active">${formatStatus(subscription.status)}</span>
        </div>
        <div class="billing-summary-meta">
          <div><span>Amount</span><strong>${price}/${interval}</strong></div>
          <div><span>Started</span><strong>${formatDate(subscription.startsAt)}</strong></div>
          <div><span>Renews</span><strong>${formatDate(subscription.expiresAt)}</strong></div>
        </div>
      </div>
    `;
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
            <td>${formatDate(item.startsAt)}</td>
            <td>${formatDate(item.expiresAt)}</td>
            <td><span class="billing-status-badge ${statusClass}">${formatStatus(item.status)}</span></td>
          </tr>
        `;
      })
      .join('');
  }
}
