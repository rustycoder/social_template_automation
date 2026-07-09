const TOKEN_KEY = 'auth_token';

function decodeJwtPayload(token) {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const json = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export const tokenStorage = {
  key: TOKEN_KEY,

  save(token) {
    if (!token) {
      this.clear();
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
  },

  get() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    if (isTokenExpired(token)) {
      this.clear();
      return null;
    }

    return token;
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isExpired() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;
    return isTokenExpired(token);
  },
};
