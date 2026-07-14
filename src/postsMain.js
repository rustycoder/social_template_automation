/**
 * @file postsMain.js
 * @description Bootstrap for the standalone My Posts HTML page.
 */

import { authService } from './features/auth/auth.js';
import { AuthUI } from './features/auth/authUI.js';
import { PostsUI } from './features/auth/postsUI.js';

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

  const authUI = new AuthUI();
  const postsUI = new PostsUI(authUI, { standalone: true });

  authUI.onPostsClick = () => {};
  authUI.onAdminClick = () => {
    window.location.href = '/template.html';
  };
  authUI.onBillingClick = () => {
    window.location.href = '/';
  };
  authUI.onLogout = () => {
    window.location.href = '/';
  };

  await postsUI.show();
}

boot().catch((error) => {
  console.error('Posts page failed to start:', error);
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { message: 'Failed to start posts page', type: 'error' },
    })
  );
});
