import { authService } from './auth.js';
import { ApiError } from './api.js';
import { getButtonText, setButtonText } from '../shared/uiIcons.js';

export class AuthUI {
  constructor() {
    this.overlay = document.getElementById('auth-modal-overlay');
    this.modal = document.getElementById('auth-modal');
    this.title = document.getElementById('auth-modal-title');
    this.form = document.getElementById('auth-form');
    this.nameGroup = document.getElementById('auth-name-group');
    this.nameInput = document.getElementById('auth-name');
    this.emailInput = document.getElementById('auth-email');
    this.passwordInput = document.getElementById('auth-password');
    this.errorEl = document.getElementById('auth-error');
    this.submitBtn = document.getElementById('auth-submit-btn');
    this.toggleModeBtn = document.getElementById('auth-toggle-mode');
    this.closeBtn = document.getElementById('auth-modal-close');
    this.userMenu = document.getElementById('user-menu');
    this.loginBtn = document.getElementById('btn-login');
    this.profileTrigger = document.getElementById('profile-trigger');
    this.profileDropdown = document.getElementById('profile-dropdown');
    this.profileAvatar = document.getElementById('profile-avatar');
    this.logoutBtn = document.getElementById('btn-logout');
    this.billingBtn = document.getElementById('btn-my-billing');
    this.postsBtn = document.getElementById('btn-my-posts');
    this.adminBtn = document.getElementById('btn-admin');
    this.userNameEl = document.getElementById('user-name');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownUserEmail = document.getElementById('dropdown-user-email');
    this.dropdownSubBadge = document.getElementById('dropdown-sub-badge');

    this.mode = 'login';
    this._resolveOpen = null;
    this._dropdownOpen = false;
    this.onBillingClick = null;
    this.onPostsClick = null;
    this.onAdminClick = null;
    this.onLogout = null;

    this._bindEvents();
    authService.onChange((user) => this._renderHeader(user));
    this._renderHeader(authService.getUser());
  }

  _bindEvents() {
    this.loginBtn?.addEventListener('click', () => this.open('login'));
    this.logoutBtn?.addEventListener('click', async () => {
      this._closeDropdown();
      await authService.logout();
      this.onLogout?.();
    });
    this.billingBtn?.addEventListener('click', () => {
      this._closeDropdown();
      this.onBillingClick?.();
    });
    this.postsBtn?.addEventListener('click', () => {
      this._closeDropdown();
      this.onPostsClick?.();
    });
    this.adminBtn?.addEventListener('click', () => {
      this._closeDropdown();
      this.onAdminClick?.();
    });
    this.profileTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!this.userMenu?.contains(e.target)) {
        this._closeDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeDropdown();
    });

    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.toggleModeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._setMode(this.mode === 'login' ? 'register' : 'login');
    });

    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  _setMode(mode) {
    this.mode = mode;
    this.errorEl.textContent = '';
    this.errorEl.classList.add('hidden');

    if (mode === 'login') {
      this.title.textContent = 'Sign in';
      setButtonText(this.submitBtn, 'Sign in');
      this.toggleModeBtn.textContent = 'Create an account';
      this.nameGroup?.classList.add('hidden');
      this.nameInput.required = false;
    } else {
      this.title.textContent = 'Create account';
      setButtonText(this.submitBtn, 'Create account');
      this.toggleModeBtn.textContent = 'Already have an account? Sign in';
      this.nameGroup?.classList.remove('hidden');
      this.nameInput.required = true;
    }
  }

  open(mode = 'login') {
    this._setMode(mode);
    this.form.reset();
    this.overlay?.classList.remove('hidden');
    this.emailInput?.focus();

    return new Promise((resolve) => {
      this._resolveOpen = resolve;
    });
  }

  close(result = null) {
    this.overlay?.classList.add('hidden');
    if (this._resolveOpen) {
      this._resolveOpen(result);
      this._resolveOpen = null;
    }
  }

  async requireLogin() {
    if (authService.isLoggedIn()) return true;
    await this.open('login');
    return authService.isLoggedIn();
  }

  async _handleSubmit() {
    this.errorEl.classList.add('hidden');
    this.submitBtn.disabled = true;
    const originalText = getButtonText(this.submitBtn);
    setButtonText(this.submitBtn, 'Please wait…');

    try {
      if (this.mode === 'login') {
        await authService.login(this.emailInput.value, this.passwordInput.value);
      } else {
        await authService.register(
          this.emailInput.value,
          this.passwordInput.value,
          this.nameInput.value
        );
      }
      this.close(true);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Welcome!', type: 'success' } })
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      this.errorEl.textContent = message;
      this.errorEl.classList.remove('hidden');
    } finally {
      this.submitBtn.disabled = false;
      setButtonText(this.submitBtn, originalText);
    }
  }

  _toggleDropdown() {
    if (this._dropdownOpen) {
      this._closeDropdown();
    } else {
      this._openDropdown();
    }
  }

  _openDropdown() {
    this._dropdownOpen = true;
    this.profileDropdown?.classList.remove('hidden');
    this.profileTrigger?.setAttribute('aria-expanded', 'true');
    this.userMenu?.classList.add('open');
  }

  _closeDropdown() {
    this._dropdownOpen = false;
    this.profileDropdown?.classList.add('hidden');
    this.profileTrigger?.setAttribute('aria-expanded', 'false');
    this.userMenu?.classList.remove('open');
  }

  _getInitials(name) {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  _renderSubscription(user) {
    const sub = user.subscription;
    let planName = 'No subscription';
    let badgeClass = 'user-sub-badge inactive';

    if (user.hasActiveSubscription && sub) {
      planName = sub.planName || 'Pro';
      badgeClass = 'user-sub-badge active';
    } else if (user.subscriptionExpired) {
      planName = 'Expired';
      badgeClass = 'user-sub-badge expired';
    }

    if (this.dropdownSubBadge) {
      this.dropdownSubBadge.textContent = planName;
      this.dropdownSubBadge.className = badgeClass;
    }
  }

  _renderHeader(user) {
    if (user) {
      this.loginBtn?.classList.add('hidden');
      this.userMenu?.classList.remove('hidden');
      if (this.userNameEl) this.userNameEl.textContent = user.name;
      if (this.dropdownUserName) this.dropdownUserName.textContent = user.name;
      if (this.dropdownUserEmail) this.dropdownUserEmail.textContent = user.email;
      if (this.profileAvatar) this.profileAvatar.textContent = this._getInitials(user.name);
      this._renderSubscription(user);
      this.adminBtn?.classList.toggle('hidden', user.role !== 'admin');
    } else {
      this._closeDropdown();
      this.loginBtn?.classList.remove('hidden');
      this.userMenu?.classList.add('hidden');
      this.adminBtn?.classList.add('hidden');
    }
  }
}
