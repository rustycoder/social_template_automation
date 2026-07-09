-- 002_update_yearly_plan_price.sql
-- Update yearly plan from $600 to $499.

UPDATE subscription_plans
SET price_cents = 49900
WHERE id = 'yearly';
