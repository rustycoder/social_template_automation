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

export async function userHasActiveSubscription(userId) {
  const sub = await getActiveSubscription(userId);
  return !!sub;
}

export async function createSubscription(userId, planId) {
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
    `INSERT INTO subscriptions (user_id, plan_id, status, starts_at, expires_at)
     VALUES (?, ?, 'active', ?, ?)`,
    [userId, planId, now, expiresAt]
  );

  return {
    id: result.insertId,
    planId: plan.id,
    planName: plan.name,
    priceCents: plan.priceCents,
    billingInterval: plan.billingInterval,
    status: 'active',
    startsAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
