import crypto from "crypto";
import { config } from "../config.js";
import { query } from "../db.js";
import { PaymentGateway, getCheckoutScriptUrl } from "../payment-gateway/index.js";
import { createSubscription, getPlanById } from "./subscriptionService.js";

let paymentGateway;

function getPaymentGateway() {
  if (!paymentGateway) {
    if (!config.mpgs.merchantId || !config.mpgs.apiPassword) {
      const error = new Error("Payment gateway is not configured. Set MPGS_MERCHANT_ID and MPGS_API_PASSWORD.");
      error.status = 503;
      throw error;
    }
    try {
      paymentGateway = new PaymentGateway({
        merchantId: config.mpgs.merchantId,
        apiPassword: config.mpgs.apiPassword,
        apiVersion: config.mpgs.apiVersion,
        region: config.mpgs.region,
      });
    } catch (error) {
      console.error("Error creating payment gateway", error);
      throw error;
    }
  }

  return paymentGateway;
}

function formatAmount(priceCents) {
  return (priceCents / 100).toFixed(2);
}

function generateOrderId(userId) {
  const suffix = crypto.randomBytes(4).toString("hex");
  return `sub-${userId}-${Date.now()}-${suffix}`;
}

async function getPaymentByOrderId(orderId) {
  const rows = await query(
    `SELECT id, user_id AS userId, plan_id AS planId, order_id AS orderId,
            amount_cents AS amountCents, currency, status,
            mpgs_session_id AS mpgsSessionId, success_indicator AS successIndicator,
            mpgs_transaction_id AS mpgsTransactionId, created_at AS createdAt,
            completed_at AS completedAt
     FROM payment_transactions
     WHERE order_id = ?
     LIMIT 1`,
    [orderId],
  );
  return rows[0] || null;
}

async function createPaymentRecord({ userId, planId, orderId, amountCents, currency, mpgsSessionId, successIndicator }) {
  const result = await query(
    `INSERT INTO payment_transactions
      (user_id, plan_id, order_id, amount_cents, currency, status, mpgs_session_id, success_indicator)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [userId, planId, orderId, amountCents, currency, mpgsSessionId, successIndicator],
  );

  return result.insertId;
}

async function markPaymentFailed(paymentId) {
  await query(`UPDATE payment_transactions SET status = 'failed' WHERE id = ?`, [paymentId]);
}

async function markPaymentCompleted(paymentId, mpgsTransactionId = null, subscriptionId = null) {
  await query(
    `UPDATE payment_transactions
     SET status = 'completed', mpgs_transaction_id = ?, subscription_id = COALESCE(?, subscription_id),
         completed_at = NOW()
     WHERE id = ?`,
    [mpgsTransactionId, subscriptionId, paymentId],
  );
}

function isSuccessfulOrder(orderData) {
  const result = orderData?.result || orderData?.status;
  return String(result).toUpperCase() === "SUCCESS";
}

/**
 * Create an MPGS Hosted Checkout session for a subscription plan.
 */
export async function createSubscriptionCheckout(userId, planId) {
  const plan = await getPlanById(planId);
  if (!plan) {
    const error = new Error("Invalid subscription plan");
    error.status = 400;
    throw error;
  }

  const orderId = generateOrderId(userId);
  const amount = formatAmount(plan.priceCents);
  const currency = config.mpgs.currency;
  const returnUrl = `${config.appUrl}/?checkout_return=1&orderId=${encodeURIComponent(orderId)}`;

  const sessionResponse = await getPaymentGateway().createCheckoutSession({
    apiOperation: "INITIATE_CHECKOUT",
    interaction: {
      operation: "PURCHASE",
      returnUrl,
      merchant: {
        name: config.mpgs.merchantName,
      },
    },
    order: {
      id: orderId,
      amount,
      currency,
      description: plan.name,
    },
  });

  const sessionId = sessionResponse?.session?.id;
  const successIndicator = sessionResponse?.successIndicator;

  if (!sessionId || !successIndicator) {
    const error = new Error("Invalid checkout session response from payment gateway");
    error.status = 502;
    throw error;
  }

  await createPaymentRecord({
    userId,
    planId,
    orderId,
    amountCents: plan.priceCents,
    currency,
    mpgsSessionId: sessionId,
    successIndicator,
  });

  return {
    sessionId,
    orderId,
    successIndicator,
    checkoutScriptUrl: getCheckoutScriptUrl(config.mpgs.region),
    plan: {
      id: plan.id,
      name: plan.name,
      priceLabel: `$${amount}`,
    },
  };
}

/**
 * Verify MPGS payment after redirect and activate subscription.
 */
export async function verifySubscriptionCheckout(userId, orderId, resultIndicator) {
  if (!orderId || !resultIndicator) {
    const error = new Error("orderId and resultIndicator are required");
    error.status = 400;
    throw error;
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    const error = new Error("Payment order not found");
    error.status = 404;
    throw error;
  }

  if (payment.userId !== userId) {
    const error = new Error("Payment order does not belong to this user");
    error.status = 403;
    throw error;
  }

  if (payment.status === "completed") {
    return {
      alreadyCompleted: true,
      message: "Payment already processed",
    };
  }

  if (resultIndicator !== payment.successIndicator) {
    await markPaymentFailed(payment.id);
    const error = new Error("Payment verification failed");
    error.status = 402;
    throw error;
  }

  const orderData = await getPaymentGateway().getOrder(orderId);
  if (!isSuccessfulOrder(orderData)) {
    await markPaymentFailed(payment.id);
    const error = new Error("Payment was not successful");
    error.status = 402;
    throw error;
  }

  const transactionId = orderData?.transaction?.id || orderData?.id || orderData?.authentication?.transactionId || null;

  const subscription = await createSubscription(userId, payment.planId, {
    paymentTransactionId: payment.id,
  });

  await markPaymentCompleted(payment.id, transactionId, subscription.id);

  return {
    message: "Payment successful. Subscription activated.",
    hasActiveSubscription: true,
    subscription,
    payment: {
      id: payment.id,
      orderId: payment.orderId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      transactionId,
      subscriptionId: subscription.id,
    },
  };
}
