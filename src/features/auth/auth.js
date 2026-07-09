import { api } from './api.js';
import { tokenStorage } from './tokenStorage.js';

class AuthService {
  constructor() {
    this.user = null;
    this.listeners = new Set();
    this._ready = this._init();

    window.addEventListener('auth:expired', () => {
      this.user = null;
      this._notify();
    });
  }

  async _init() {
    const token = tokenStorage.get();
    if (!token) return;

    try {
      const { user } = await api.getMe();
      this.user = user;
    } catch {
      tokenStorage.clear();
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
    return !!this.user && !!tokenStorage.get();
  }

  async ensureSession() {
    const token = tokenStorage.get();
    if (!token) {
      this.user = null;
      this._notify();
      return false;
    }

    try {
      await this.refreshUser();
      return this.isLoggedIn();
    } catch {
      this.logout();
      return false;
    }
  }

  hasActiveSubscription() {
    return !!this.user?.hasActiveSubscription;
  }

  isSubscriptionExpired() {
    return !!this.user?.subscriptionExpired;
  }

  getUser() {
    return this.user;
  }

  async register(email, password, name) {
    const { token, user } = await api.register(email, password, name);
    tokenStorage.save(token);
    this.user = user;
    this._notify();
    return user;
  }

  async login(email, password) {
    const { token, user } = await api.login(email, password);
    tokenStorage.save(token);
    this.user = user;
    this._notify();
    return user;
  }

  logout() {
    tokenStorage.clear();
    this.user = null;
    this._notify();
  }

  async refreshUser() {
    if (!tokenStorage.get()) {
      this.user = null;
      this._notify();
      return null;
    }

    try {
      const { user } = await api.getMe();
      this.user = user;
      this._notify();
      return user;
    } catch (error) {
      if (error?.status === 401) {
        this.logout();
      }
      throw error;
    }
  }

  async refreshSubscription() {
    return this.refreshUser();
  }

  async subscribe(planId) {
    const result = await api.subscribe(planId);
    await this.refreshUser();
    return result;
  }
}

export const authService = new AuthService();
