const express = require('express');
const { MpgsClient } = require('../src');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const mpgs = new MpgsClient({
  merchantId: process.env.MPGS_MERCHANT_ID,
  apiPassword: process.env.MPGS_API_PASSWORD,
  apiVersion: process.env.MPGS_API_VERSION || '74',
  region: process.env.MPGS_REGION || 'TEST',
});

/**
 * POST /checkout/session
 *
 * Body is forwarded to MPGS /session unchanged so callers control
 * order, interaction, currency, amount, and return URLs.
 */
app.post('/checkout/session', async (req, res) => {
  try {
    const sessionResponse = await mpgs.createCheckoutSession(req.body);
    res.status(200).json(sessionResponse);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message,
      details: error.responseData || null,
    });
  }
});

/**
 * GET /checkout/transaction/:orderId/:transactionId
 *
 * Server-side verification after Hosted Checkout redirect.
 */
app.get('/checkout/transaction/:orderId/:transactionId', async (req, res) => {
  const { orderId, transactionId } = req.params;

  try {
    const transaction = await mpgs.getTransaction(orderId, transactionId);
    res.status(200).json(transaction);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message,
      details: error.responseData || null,
    });
  }
});

app.listen(port, () => {
  console.log(`MPGS example server listening on http://localhost:${port}`);
  console.log('POST /checkout/session');
  console.log('GET  /checkout/transaction/:orderId/:transactionId');
});
