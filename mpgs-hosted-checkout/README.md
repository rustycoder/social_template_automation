# mpgs-hosted-checkout

A small, reusable Node.js client for [Mastercard Payment Gateway Services (MPGS)](https://developer.mastercard.com/) Hosted Checkout REST APIs.

The module is intentionally generic: it does not hardcode currency, amounts, return URLs, or order details. Your application supplies the full MPGS request payload.

## Installation

```bash
npm install
```

For local development inside a monorepo or sibling project:

```bash
npm install ../mpgs-hosted-checkout
```

## Quick start

```javascript
const { MpgsClient } = require('mpgs-hosted-checkout');

const mpgs = new MpgsClient({
  merchantId: process.env.MPGS_MERCHANT_ID,
  apiPassword: process.env.MPGS_API_PASSWORD,
  apiVersion: '74', // optional, default: '74'
  region: 'TEST',   // optional: TEST | NA | AP | EU
});

const session = await mpgs.createCheckoutSession({
  apiOperation: 'INITIATE_CHECKOUT',
  interaction: {
    operation: 'PURCHASE',
    returnUrl: 'https://your-app.example/checkout/return',
    merchant: {
      name: 'Your Merchant Name',
    },
  },
  order: {
    id: 'order-123',
    amount: '10.00',
    currency: 'USD',
  },
});

// session.session.id is used with Checkout.configure() on the frontend
```

## API

### `new MpgsClient(config)`

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `merchantId` | Yes | — | MPGS merchant identifier |
| `apiPassword` | Yes | — | API password from the Merchant Administration portal |
| `apiVersion` | No | `'74'` | MPGS REST API version |
| `region` | No | `'TEST'` | Gateway region: `TEST`, `NA`, `AP`, or `EU` |

Authentication uses HTTP Basic Auth with username `merchant.{merchantId}` and the configured API password.

### `createCheckoutSession(payloadData)`

`POST /session`

Accepts the full MPGS session body (for example `INITIATE_CHECKOUT` or `CREATE_CHECKOUT_SESSION`) and returns the gateway response.

### `getTransaction(orderId, transactionId)`

`GET /order/{orderId}/transaction/{transactionId}`

Use after redirect to verify payment status server-side.

## Error handling

API failures throw an `MpgsApiError` with:

- `message` — human-readable summary
- `status` — HTTP status code (when available)
- `responseData` — raw MPGS error payload from `error.response.data`

```javascript
try {
  await mpgs.createCheckoutSession(payload);
} catch (error) {
  if (error.isMpgsError) {
    console.error(error.status, error.responseData);
  }
  throw error;
}
```

## Environment variables

Copy the template and add your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MPGS_MERCHANT_ID` | Yes | — | Merchant ID from MPGS portal |
| `MPGS_API_PASSWORD` | Yes | — | API password from MPGS portal |
| `MPGS_API_VERSION` | No | `74` | REST API version |
| `MPGS_REGION` | No | `TEST` | `TEST`, `NA`, `AP`, or `EU` |
| `PORT` | No | `3000` | Example server port |

`.env` is gitignored. Commit `.env.example` only.

## Example Express server

```bash
npm run example
```

See [`example/server.js`](./example/server.js) for a complete local integration example.

## Regional endpoints

| Region | Base URL |
|--------|----------|
| TEST | `https://test-gateway.mastercard.com` |
| NA | `https://na-gateway.mastercard.com` |
| AP | `https://ap-gateway.mastercard.com` |
| EU | `https://eu-gateway.mastercard.com` |

Paths are resolved as:

`/api/rest/version/{apiVersion}/merchant/{merchantId}/...`
