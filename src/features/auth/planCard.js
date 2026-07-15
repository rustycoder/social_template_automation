/**
 * @file Unified monthly/yearly subscription plan card.
 */

import { buttonLabel } from '../shared/uiIcons.js';

/** List price for yearly equivalent of 12 × monthly ($50 × 12). */
export const YEARLY_LIST_CENTS = 60000;

/**
 * @param {number} cents
 * @returns {string}
 */
export function formatMoney(cents) {
  if (cents == null || Number.isNaN(cents)) return '—';
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * @param {number} offerCents
 * @param {number} [listCents=YEARLY_LIST_CENTS]
 * @returns {number}
 */
export function getYearlySavingsPercent(offerCents, listCents = YEARLY_LIST_CENTS) {
  if (!listCents || offerCents == null) return 0;
  return Math.max(0, Math.round(((listCents - offerCents) / listCents) * 100));
}

/**
 * @param {Array<{ id: string, billingInterval: string, priceCents: number, priceLabel?: string, name?: string, description?: string }>} plans
 * @returns {{ monthly: object | null, yearly: object | null }}
 */
export function splitPlansByInterval(plans = []) {
  return {
    monthly: plans.find((p) => p.billingInterval === 'month') || null,
    yearly: plans.find((p) => p.billingInterval === 'year') || null,
  };
}

/**
 * @param {object} options
 * @param {object | null} options.monthly
 * @param {object | null} options.yearly
 * @param {'month' | 'year'} options.interval
 * @param {object | null} [options.currentSubscription]
 * @param {(expiresAt: string, interval: string) => Date | null} [options.getExtendedExpiryDate]
 * @param {(date: Date | string) => string} [options.formatDate]
 * @returns {string} HTML
 */
export function renderUnifiedPlanCardHtml({
  monthly,
  yearly,
  interval,
  currentSubscription = null,
  getExtendedExpiryDate = null,
  formatDate = null,
}) {
  const plan = interval === 'year' ? yearly : monthly;
  if (!plan) {
    return '<p class="billing-plans-empty">No subscription plans are available right now.</p>';
  }

  const isYearly = interval === 'year';
  const periodSuffix = isYearly ? '/yr' : '/mo';
  const periodLabel = isYearly ? '1 year' : '1 month';
  const listCents = isYearly ? YEARLY_LIST_CENTS : null;
  const current = currentSubscription;
  const hasActive = !!current;

  let extendedExpiryLabel = null;
  if (hasActive && getExtendedExpiryDate && formatDate) {
    const extended = getExtendedExpiryDate(current.expiresAt, plan.billingInterval);
    extendedExpiryLabel = extended ? formatDate(extended) : null;
  }

  let ctaLabel = `Subscribe — ${plan.priceLabel || formatMoney(plan.priceCents)}`;
  let ctaIcon = 'check';
  let planDesc =
    plan.description ||
    'Full access to all templates and unlimited downloads.';

  if (hasActive) {
    ctaIcon = 'calendar';
    ctaLabel = extendedExpiryLabel
      ? `Extend ${periodLabel} → ${extendedExpiryLabel} — ${plan.priceLabel || formatMoney(plan.priceCents)}`
      : `Extend ${periodLabel} — ${plan.priceLabel || formatMoney(plan.priceCents)}`;
    planDesc = extendedExpiryLabel
      ? `Adds ${periodLabel} from your expiry: ${formatDate(current.expiresAt)} → ${extendedExpiryLabel}`
      : `Adds ${periodLabel} from your current expiry date.`;
  }

  const priceHtml = isYearly
    ? `<p class="plan-price">
         <span class="plan-price__was">${formatMoney(listCents)}</span>${formatMoney(plan.priceCents)}<span>${periodSuffix}</span>
       </p>`
    : `<p class="plan-price">${plan.priceLabel || formatMoney(plan.priceCents)}<span>${periodSuffix}</span></p>`;

  const yearlySavings =
    yearly != null ? getYearlySavingsPercent(yearly.priceCents) : 0;
  const yearlySaveBadge =
    yearlySavings > 0
      ? `<span class="plan-interval-switch__save">Save ${yearlySavings}%</span>`
      : '';

  return `
    <div class="subscribe-plan-unified">
      <article class="subscribe-plan-card subscribe-plan-card--unified featured" data-plan-id="${plan.id}">
        <div class="plan-interval-switch" role="tablist" aria-label="Billing interval">
          <button type="button" class="plan-interval-switch__btn${!isYearly ? ' is-active' : ''}" data-interval="month" role="tab" aria-selected="${!isYearly}" ${monthly ? '' : 'disabled'}>
            Monthly
          </button>
          <button type="button" class="plan-interval-switch__btn${isYearly ? ' is-active' : ''}" data-interval="year" role="tab" aria-selected="${isYearly}" ${yearly ? '' : 'disabled'}>
            Yearly
            ${yearlySaveBadge}
          </button>
        </div>

        <h3>${isYearly ? 'Pro Yearly' : 'Pro Monthly'}</h3>
        ${priceHtml}
        <p class="plan-desc">${planDesc}</p>
        <ul class="plan-features">
          <li>Full template library access</li>
          <li>Unlimited image &amp; video downloads</li>
          <li>All platform export formats</li>
        </ul>
        <button type="button" class="btn btn-primary btn-subscribe-plan" data-plan-id="${plan.id}">
          ${buttonLabel(ctaIcon, ctaLabel)}
        </button>
      </article>
    </div>
  `;
}

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {() => 'month' | 'year'} options.getInterval
 * @param {(interval: 'month' | 'year') => void} options.onIntervalChange
 * @param {(planId: string, button: HTMLButtonElement) => void} options.onSubscribe
 */
export function bindUnifiedPlanCard(container, { getInterval, onIntervalChange, onSubscribe }) {
  if (!container) return;

  container.querySelectorAll('.plan-interval-switch__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.interval === 'year' ? 'year' : 'month';
      if (next === getInterval()) return;
      onIntervalChange(next);
    });
  });

  container.querySelectorAll('.btn-subscribe-plan').forEach((btn) => {
    btn.addEventListener('click', () => onSubscribe(btn.dataset.planId, btn));
  });
}
