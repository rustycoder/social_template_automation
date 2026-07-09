import { api } from './api.js';

const TOKEN_KEY = 'auth_token';

class AuthService {
  constructor() {
    this.user = null;
    this.listeners = new Set();
    this._ready = this._init();
  }

  async _init() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const { user } = await api.getMe();
      this.user = user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      this.user = null;
    }
  }

  async ready() {
    await this._ready;
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    for (const listener of this.listeners) {
      listener(this.user);
    }
  }

  isLoggedIn() {
    return !!this.user;
  }

  hasActiveSubscription() {
    return !!this.user?.hasActiveSubscription;
  }

  getUser() {
    return this.user;
  }

  async register(email, password, name) {
    const { token, user } = await api.register(email, password, name);
    localStorage.setItem(TOKEN_KEY, token);
    this.user = user;
    this._notify();
    return user;
  }

  async login(email, password) {
    const { token, user } = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    this.user = user;
    this._notify();
    return user;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.user = null;
    this._notify();
  }

  async refreshUser() {
    if (!localStorage.getItem(TOKEN_KEY)) {
      this.user = null;
      this._notify();
      return null;
    }

    const { user } = await api.getMe();
    this.user = user;
    this._notify();
    return user;
  }

  async subscribe(planId) {
    const result = await api.subscribe(planId);
    await this.refreshUser();
    return result;
  }
}

export const authService = new AuthService();
