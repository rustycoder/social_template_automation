import { query } from '../db.js';

const PLAN_INTERVAL_MONTHS = {
  month: 1,
  year: 12,
};

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function getActivePlans() {
  return query(
    `SELECT id, name, price_cents AS priceCents, billing_interval AS billingInterval, description
     FROM subscription_plans
     WHERE is_active = 1
     ORDER BY price_cents ASC`
  );
}

export async function getPlanById(planId) {
  const rows = await query(
    `SELECT id, name, price_cents AS priceCents, billing_interval AS billingInterval, description
     FROM subscription_plans
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [planId]
  );
  return rows[0] || null;
}

export async function getActiveSubscription(userId) {
  const rows = await query(
    `SELECT s.id, s.plan_id AS planId, s.status, s.starts_at AS startsAt, s.expires_at AS expiresAt,
            p.name AS planName, p.price_cents AS priceCents, p.billing_interval AS billingInterval
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = ? AND s.status = 'active' AND s.expires_at > NOW()
     ORDER BY s.expires_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function createSubscription(userId, planId, { paymentTransactionId } = {}) {
  const plan = await getPlanById(planId);
  if (!plan) {
    const error = new Error('Invalid subscription plan');
    error.status = 400;
    throw error;
  }

  const months = PLAN_INTERVAL_MONTHS[plan.billingInterval];
  if (!months) {
    const error = new Error('Unsupported billing interval');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const expiresAt = addMonths(now, months);

  await query(
    `UPDATE subscriptions
     SET status = 'cancelled', updated_at = NOW()
     WHERE user_id = ? AND status = 'active'`,
    [userId]
  );

  const result = await query(
    `INSERT INTO subscriptions (user_id, plan_id, payment_transaction_id, status, starts_at, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
    [userId, planId, paymentTransactionId ?? null, now, expiresAt, now, now]
  );

  const subscriptionId = result.insertId;

  if (paymentTransactionId) {
    await query(
      `UPDATE payment_transactions SET subscription_id = ? WHERE id = ?`,
      [subscriptionId, paymentTransactionId]
    );
  }

  return {
    id: subscriptionId,
    planId: plan.id,
    planName: plan.name,
    priceCents: plan.priceCents,
    billingInterval: plan.billingInterval,
    status: 'active',
    paymentTransactionId: paymentTransactionId ?? null,
    startsAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getBillingHistory(userId) {
  return query(
    `SELECT s.id, s.plan_id AS planId, s.status, s.starts_at AS startsAt, s.expires_at AS expiresAt,
            s.created_at AS createdAt, s.payment_transaction_id AS paymentTransactionId,
            p.name AS planName, p.price_cents AS priceCents, p.billing_interval AS billingInterval,
            pt.id AS paymentId, pt.order_id AS paymentOrderId, pt.amount_cents AS paymentAmountCents,
            pt.currency AS paymentCurrency, pt.status AS paymentStatus,
            pt.mpgs_transaction_id AS mpgsTransactionId, pt.completed_at AS paymentCompletedAt
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     LEFT JOIN payment_transactions pt ON pt.id = s.payment_transaction_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [userId]
  );
}

/**
 * Mark subscriptions as expired when past their end date.
 * @returns {Promise<number>} Number of subscriptions updated
 */
export async function expireSubscriptions() {
  const result = await query(
    `UPDATE subscriptions
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'active' AND expires_at <= NOW()`
  );
  return result.affectedRows ?? 0;
}

/** Run expiry sync before subscription reads so status is always current. */
export async function syncExpiredSubscriptions() {
  return expireSubscriptions();
}

export async function getLatestSubscription(userId) {
  const rows = await query(
    `SELECT s.id, s.plan_id AS planId, s.status, s.starts_at AS startsAt, s.expires_at AS expiresAt,
            p.name AS planName, p.price_cents AS priceCents, p.billing_interval AS billingInterval
     FROM subscriptions s
     JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}
