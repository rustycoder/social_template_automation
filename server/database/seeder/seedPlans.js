import { query } from '../db.js';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Pro',
    priceCents: 5000,
    billingInterval: 'month',
    description: 'Full access to all templates and unlimited downloads — billed monthly.',
  },
  {
    id: 'yearly',
    name: 'Yearly Pro',
    priceCents: 49900,
    billingInterval: 'year',
    description: 'Full access to all templates and unlimited downloads — billed yearly.',
  },
];

export async function seedPlans() {
  for (const plan of PLANS) {
    await query(
      `INSERT INTO subscription_plans (id, name, price_cents, billing_interval, description, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         price_cents = VALUES(price_cents),
         billing_interval = VALUES(billing_interval),
         description = VALUES(description)`,
      [plan.id, plan.name, plan.priceCents, plan.billingInterval, plan.description]
    );
    console.log(`  plan: ${plan.id} (${plan.name})`);
  }

  return { ok: PLANS.length };
}
