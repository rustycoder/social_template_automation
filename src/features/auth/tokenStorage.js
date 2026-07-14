const TOKEN_KEY = 'auth_token';

/**
 * @param {string} segment Base64url JWT segment
 * @returns {string}
 */
function decodeBase64Url(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return atob(padded);
}

function decodeJwtPayload(token) {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    return JSON.parse(decodeBase64Url(segment));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  // If we cannot read exp, keep the token and let the server decide.
  if (!payload || payload.exp == null) return false;
  return Date.now() >= Number(payload.exp) * 1000;
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
