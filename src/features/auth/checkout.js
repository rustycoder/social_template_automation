import { api, ApiError } from './api.js';
import { authService } from './auth.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment checkout script'));
    document.head.appendChild(script);
  });
}

export async function launchMpgsCheckout(planId) {
  const checkout = await api.createCheckout(planId);
  await loadScript(checkout.checkoutScriptUrl);

  if (typeof window.Checkout === 'undefined') {
    throw new Error('Payment checkout is unavailable');
  }

  window.Checkout.configure({
    session: { id: checkout.sessionId },
  });

  window.Checkout.showPaymentPage();
  return checkout;
}

export async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout_return') !== '1') {
    return false;
  }

  const orderId = params.get('orderId');
  const resultIndicator = params.get('resultIndicator');

  window.history.replaceState({}, '', window.location.pathname);

  if (!orderId || !resultIndicator) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { message: 'Payment was cancelled or incomplete.', type: 'error' },
      })
    );
    return false;
  }

  if (!authService.isLoggedIn()) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { message: 'Sign in to complete payment verification.', type: 'error' },
      })
    );
    return false;
  }

  try {
    const result = await api.verifyCheckout({ orderId, resultIndicator });
    await authService.refreshSubscription();

    const message = result.alreadyCompleted
      ? 'Subscription is already active.'
      : 'Payment successful! Your subscription is now active.';

    window.dispatchEvent(
      new CustomEvent('toast', { detail: { message, type: 'success' } })
    );
    window.dispatchEvent(new CustomEvent('subscription-activated'));
    return true;
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'Payment verification failed.';
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { message, type: 'error' } })
    );
    return false;
  }
}
