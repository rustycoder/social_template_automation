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
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

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
    if (response.status === 401 && token) {
      tokenStorage.clear();
      window.dispatchEvent(
        new CustomEvent('auth:expired', {
          detail: { message: data?.error || 'Session expired. Please log in again.' },
        })
      );
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

  logout() {
    return request('/auth/logout', { method: 'POST' });
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

  getCategories() {
    return request('/categories');
  },

  getTemplates() {
    return request('/templates');
  },

  getTemplate(id) {
    return request(`/templates/${encodeURIComponent(id)}`);
  },

  getPosts() {
    return request('/posts');
  },

  /**
   * @param {FormData} formData
   */
  createPost(formData) {
    return request('/posts', {
      method: 'POST',
      body: formData,
    });
  },

  deletePost(id) {
    return request(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

export { ApiError };
