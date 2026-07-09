/**
 * @file features/auth/api.js
 * @description HTTP client for backend auth, subscription, and billing endpoints.
 * @dependencies features/auth/tokenStorage.js
 * @state None — attaches JWT from tokenStorage on each request.
 */

import { tokenStorage } from './tokenStorage.js';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new ApiError(data?.error || 'Request failed', response.status);
  }

  return data;
}

export const api = {
  register(email, password, name) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe() {
    return request('/auth/me');
  },

  getPlans() {
    return request('/subscriptions/plans');
  },

  getSubscriptionStatus() {
    return request('/subscriptions/status');
  },

  subscribe(planId) {
    return request('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  createCheckout(planId) {
    return request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  verifyCheckout({ orderId, resultIndicator }) {
    return request('/subscriptions/checkout/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, resultIndicator }),
    });
  },

  getBilling() {
    return request('/subscriptions/billing');
  },
};

export { ApiError };
