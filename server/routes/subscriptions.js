import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createSubscription,
  getActivePlans,
  getActiveSubscription,
  getBillingHistory,
  syncExpiredSubscriptions,
} from '../services/subscriptionService.js';

const router = Router();

function resolveHistoryStatus(item) {
  if (item.status === 'active' && new Date(item.expiresAt) <= new Date()) {
    return 'expired';
  }
  return item.status;
}

router.get('/plans', async (_req, res) => {
  try {
    const plans = await getActivePlans();
    res.json({
      plans: plans.map((plan) => ({
        ...plan,
        price: plan.priceCents / 100,
        priceLabel: `$${(plan.priceCents / 100).toFixed(plan.priceCents % 100 === 0 ? 0 : 2)}`,
      })),
    });
  } catch (error) {
    console.error('Plans error:', error);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.get('/status', authenticate, async (req, res) => {
  try {
    await syncExpiredSubscriptions();
    const subscription = await getActiveSubscription(req.user.id);
    res.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription
        ? {
            planId: subscription.planId,
            planName: subscription.planName,
            priceCents: subscription.priceCents,
            billingInterval: subscription.billingInterval,
            status: subscription.status,
            startsAt: subscription.startsAt,
            expiresAt: subscription.expiresAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to load subscription status' });
  }
});

router.get('/billing', authenticate, async (req, res) => {
  try {
    await syncExpiredSubscriptions();
    const [subscription, history] = await Promise.all([
      getActiveSubscription(req.user.id),
      getBillingHistory(req.user.id),
    ]);

    res.json({
      currentSubscription: subscription
        ? {
            id: subscription.id,
            planId: subscription.planId,
            planName: subscription.planName,
            priceCents: subscription.priceCents,
            billingInterval: subscription.billingInterval,
            status: subscription.status,
            startsAt: subscription.startsAt,
            expiresAt: subscription.expiresAt,
          }
        : null,
      history: history.map((item) => ({
        id: item.id,
        planId: item.planId,
        planName: item.planName,
        priceCents: item.priceCents,
        price: item.priceCents / 100,
        priceLabel: `$${(item.priceCents / 100).toFixed(item.priceCents % 100 === 0 ? 0 : 2)}`,
        billingInterval: item.billingInterval,
        status: resolveHistoryStatus(item),
        startsAt: item.startsAt,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ error: 'Failed to load billing history' });
  }
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const subscription = await createSubscription(req.user.id, planId);

    res.status(201).json({
      message: 'Subscription activated successfully',
      hasActiveSubscription: true,
      subscription,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

export default router;
