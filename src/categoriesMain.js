/**
 * @file categoriesMain.js
 * @description Bootstrap for the standalone Categories HTML page.
 */

import { authService } from './features/auth/auth.js';
import { AuthUI } from './features/auth/authUI.js';
import { AdminUI } from './features/auth/adminUI.js';

function bindToasts() {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  window.addEventListener('toast', (e) => {
    const { message, type = 'info' } = e.detail || {};
    const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message ?? ''}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  });
}

async function boot() {
  bindToasts();
  await authService.ready();

  document.querySelectorAll('#step-indicators .step-node').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = '/';
    });
  });

  const authUI = new AuthUI();
  const adminUI = new AdminUI(authUI, { standalone: true });

  authUI.onAdminClick = () => {
    window.location.href = '/template.html';
  };
  authUI.onAdminCategoriesClick = () => {};
  authUI.onBillingClick = () => {
    window.location.href = '/billing.html';
  };
  authUI.onStudioClick = () => {
    window.location.href = '/';
  };
  authUI.onPostsClick = () => {
    window.location.href = '/post.html';
  };
  authUI.onLogout = () => {
    window.location.href = '/';
  };

  await adminUI.show({ tab: 'categories' });
}

boot().catch((error) => {
  console.error('Categories page failed to start:', error);
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { message: 'Failed to start categories page', type: 'error' },
    })
  );
});
