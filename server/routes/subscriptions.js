import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createSubscription,
  getActivePlans,
  getActiveSubscription,
} from '../services/subscriptionService.js';

const router = Router();

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
