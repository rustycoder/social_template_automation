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
    this.studioBtn = document.getElementById('btn-content-studio');
    this.postsBtn = document.getElementById('btn-my-posts');
    this.adminBtn = document.getElementById('btn-admin');
    this.adminCategoriesBtn = document.getElementById('btn-admin-categories');
    this.userNameEl = document.getElementById('user-name');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownUserEmail = document.getElementById('dropdown-user-email');
    this.dropdownSubBadge = document.getElementById('dropdown-sub-badge');
    this.dropdownSubExpires = document.getElementById('dropdown-sub-expires');

    this.mode = 'login';
    this._resolveOpen = null;
    this._dropdownOpen = false;
    /** @type {Comment | null} */
    this._formPlaceholder = null;
    /** @type {DocumentFragment | null} */
    this._formHolder = null;
    this._formParked = false;
    this.onBillingClick = null;
    this.onStudioClick = null;
    this.onPostsClick = null;
    this.onAdminClick = null;
    this.onAdminCategoriesClick = null;
    this.onLogout = null;

    this._bindEvents();
    // Remove credential fields from the live DOM until Sign in is opened.
    this._parkAuthForm();
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
      this._navigateAway(() => this.onBillingClick?.());
    });
    this.studioBtn?.addEventListener('click', () => {
      this._navigateAway(() => this.onStudioClick?.());
    });
    this.postsBtn?.addEventListener('click', () => {
      this._navigateAway(() => this.onPostsClick?.());
    });
    this.adminBtn?.addEventListener('click', () => {
      this._navigateAway(() => this.onAdminClick?.());
    });
    this.adminCategoriesBtn?.addEventListener('click', () => {
      this._navigateAway(() => this.onAdminCategoriesClick?.());
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

    // Prefer button click over form submit so browsers are less likely to
    // treat auth as a native password-manager login completion.
    this.submitBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  /**
   * Clears any leftover credential values from auth inputs.
   * @returns {void}
   * @private
   */
  _scrubCredentials() {
    if (this.passwordInput) {
      this.passwordInput.value = '';
      this.passwordInput.removeAttribute('value');
    }
    if (this.emailInput) {
      this.emailInput.value = '';
      this.emailInput.removeAttribute('value');
    }
    if (this.nameInput) {
      this.nameInput.value = '';
      this.nameInput.removeAttribute('value');
    }
    try {
      this.form?.reset();
    } catch {
      /* detached form */
    }
  }

  /**
   * Neutralizes password fields and removes the auth form from the document
   * so Safari/Chrome stop treating later navigations as "remember password".
   * @returns {void}
   * @private
   */
  _parkAuthForm() {
    if (!this.form || this._formParked) {
      this._scrubCredentials();
      return;
    }

    this._scrubCredentials();

    if (this.passwordInput) {
      this.passwordInput.type = 'text';
      this.passwordInput.autocomplete = 'off';
      this.passwordInput.removeAttribute('name');
      this.passwordInput.setAttribute('data-lpignore', 'true');
      this.passwordInput.setAttribute('data-1p-ignore', 'true');
      this.passwordInput.setAttribute('data-form-type', 'other');
    }
    if (this.emailInput) {
      this.emailInput.autocomplete = 'off';
      this.emailInput.removeAttribute('name');
      this.emailInput.setAttribute('data-lpignore', 'true');
      this.emailInput.setAttribute('data-1p-ignore', 'true');
      this.emailInput.setAttribute('data-form-type', 'other');
    }

    this.form.setAttribute('autocomplete', 'off');
    this.form.setAttribute('data-lpignore', 'true');
    this.form.setAttribute('data-1p-ignore', 'true');

    const parent = this.form.parentNode;
    if (parent) {
      this._formPlaceholder = document.createComment('auth-form-parked');
      parent.insertBefore(this._formPlaceholder, this.form);
      this._formHolder = document.createDocumentFragment();
      this._formHolder.appendChild(this.form);
      this._formParked = true;
    }
  }

  /**
   * Restores the auth form into the modal when Sign in opens.
   * @returns {void}
   * @private
   */
  _unparkAuthForm() {
    if (!this._formParked || !this.form || !this._formPlaceholder?.parentNode) return;

    this._formPlaceholder.parentNode.insertBefore(this.form, this._formPlaceholder);
    this._formPlaceholder.remove();
    this._formPlaceholder = null;
    this._formHolder = null;
    this._formParked = false;

    if (this.passwordInput) {
      this.passwordInput.type = 'password';
      this.passwordInput.name = 'password';
      this.passwordInput.autocomplete =
        this.mode === 'register' ? 'new-password' : 'current-password';
      this.passwordInput.removeAttribute('data-form-type');
    }
    if (this.emailInput) {
      this.emailInput.name = 'email';
      this.emailInput.autocomplete = 'email';
      this.emailInput.removeAttribute('data-form-type');
    }
    if (this.nameInput) {
      this.nameInput.name = 'name';
      this.nameInput.autocomplete = 'name';
    }
  }

  /**
   * Parks credentials, then runs navigation on the next frames so Safari
   * sees no password field before changing pages.
   * @param {() => void} navigate
   * @returns {void}
   * @private
   */
  _navigateAway(navigate) {
    this._closeDropdown();
    this._parkAuthForm();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        navigate?.();
      });
    });
  }

  _setMode(mode) {
    this.mode = mode;
    if (this.errorEl) {
      this.errorEl.textContent = '';
      this.errorEl.classList.add('hidden');
    }

    if (mode === 'login') {
      if (this.title) this.title.textContent = 'Sign in';
      setButtonText(this.submitBtn, 'Sign in');
      if (this.toggleModeBtn) this.toggleModeBtn.textContent = 'Create an account';
      this.nameGroup?.classList.add('hidden');
      if (this.nameInput) this.nameInput.required = false;
      this.passwordInput?.setAttribute('autocomplete', 'current-password');
    } else {
      if (this.title) this.title.textContent = 'Create account';
      setButtonText(this.submitBtn, 'Create account');
      if (this.toggleModeBtn) {
        this.toggleModeBtn.textContent = 'Already have an account? Sign in';
      }
      this.nameGroup?.classList.remove('hidden');
      if (this.nameInput) this.nameInput.required = true;
      this.passwordInput?.setAttribute('autocomplete', 'new-password');
    }
  }

  open(mode = 'login') {
    this._unparkAuthForm();
    this._setMode(mode);
    this._scrubCredentials();
    this.overlay?.classList.remove('hidden');
    this.emailInput?.focus();

    return new Promise((resolve) => {
      this._resolveOpen = resolve;
    });
  }

  close(result = null) {
    this.overlay?.classList.add('hidden');
    this._parkAuthForm();
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
    if (this._formParked || this.submitBtn?.disabled) return;

    this.errorEl?.classList.add('hidden');
    if (this.submitBtn) this.submitBtn.disabled = true;
    const originalText = getButtonText(this.submitBtn);
    setButtonText(this.submitBtn, 'Please wait…');

    const email = this.emailInput?.value ?? '';
    const password = this.passwordInput?.value ?? '';
    const name = this.nameInput?.value ?? '';

    try {
      if (this.mode === 'login') {
        await authService.login(email, password);
      } else {
        await authService.register(email, password, name);
      }
      // Park immediately after success — before toast/navigation can race.
      this._scrubCredentials();
      this.close(true);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Welcome!', type: 'success' } })
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      if (this.errorEl) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
      }
    } finally {
      if (this.submitBtn) this.submitBtn.disabled = false;
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
    this._syncCurrentPageSelection();
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

  /**
   * Resolves which profile-menu navigation targets the current document.
   * @returns {'studio'|'posts'|'templates'|'categories'|'billing'|null}
   * @private
   */
  _currentNavKey() {
    const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    const file = path.split('/').pop() || '';
    if (!file || file === 'index.html') return 'studio';
    if (file === 'post.html') return 'posts';
    if (file === 'template.html') return 'templates';
    if (file === 'categories.html') return 'categories';
    if (file === 'billing.html') return 'billing';
    return null;
  }

  /**
   * Marks the active profile-menu item for the current page.
   * @returns {void}
   * @private
   */
  _syncCurrentPageSelection() {
    /** @type {Array<{ key: string, el: HTMLElement|null }>} */
    const items = [
      { key: 'studio', el: this.studioBtn },
      { key: 'posts', el: this.postsBtn },
      { key: 'templates', el: this.adminBtn },
      { key: 'categories', el: this.adminCategoriesBtn },
      { key: 'billing', el: this.billingBtn },
    ];
    const current = this._currentNavKey();

    for (const { key, el } of items) {
      if (!el) continue;
      const isCurrent = key === current;
      el.classList.toggle('active', isCurrent);
      if (isCurrent) {
        el.setAttribute('aria-current', 'page');
      } else {
        el.removeAttribute('aria-current');
      }
    }
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
    let expiresLabel = '';

    if (user.hasActiveSubscription && sub) {
      planName = sub.planName || 'Pro';
      badgeClass = 'user-sub-badge active';
      expiresLabel = this._formatExpiresIn(sub.expiresAt);
    } else if (user.subscriptionExpired) {
      planName = 'Expired';
      badgeClass = 'user-sub-badge expired';
    }

    if (this.dropdownSubBadge) {
      this.dropdownSubBadge.textContent = planName;
      this.dropdownSubBadge.className = badgeClass;
    }

    if (!this.dropdownSubExpires) {
      this.dropdownSubExpires = document.getElementById('dropdown-sub-expires');
    }
    if (this.dropdownSubExpires) {
      if (expiresLabel) {
        this.dropdownSubExpires.textContent = expiresLabel;
        this.dropdownSubExpires.classList.remove('hidden');
      } else {
        this.dropdownSubExpires.textContent = '';
        this.dropdownSubExpires.classList.add('hidden');
      }
    }
  }

  /**
   * @param {string | null | undefined} expiresAt
   * @returns {string}
   * @private
   */
  _formatExpiresIn(expiresAt) {
    if (!expiresAt) return '';
    const end = new Date(expiresAt);
    if (Number.isNaN(end.getTime())) return '';
    const days = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days > 1) return `Expires in ${days} days`;
    if (days === 1) return 'Expires in 1 day';
    if (days === 0) return 'Expires today';
    return '';
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
      const isAdmin = user.role === 'admin';
      this.studioBtn?.classList.remove('hidden');
      this.postsBtn?.classList.toggle('hidden', isAdmin);
      this.adminBtn?.classList.toggle('hidden', !isAdmin);
      this.adminCategoriesBtn?.classList.toggle('hidden', !isAdmin);
      this._syncCurrentPageSelection();
    } else {
      this._closeDropdown();
      this.loginBtn?.classList.remove('hidden');
      this.userMenu?.classList.add('hidden');
      this.studioBtn?.classList.add('hidden');
      this.postsBtn?.classList.add('hidden');
      this.adminBtn?.classList.add('hidden');
      this.adminCategoriesBtn?.classList.add('hidden');
    }
  }
}
