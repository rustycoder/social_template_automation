import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { validateSessionVersion } from '../services/sessionService.js';
import { getActiveSubscription } from '../services/subscriptionService.js';

const SESSION_INVALID_MESSAGE = 'Session expired. You were logged in on another device.';

/**
 * @description Verifies JWT and ensures it matches the user's current session version.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const userId = payload.sub;
    const sessionValid = await validateSessionVersion(userId, payload.sessionVersion);

    if (!sessionValid) {
      return res.status(401).json({ error: SESSION_INVALID_MESSAGE });
    }

    req.user = {
      id: userId,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}

/**
 * @description Requires authenticate first. Restricts to admin role.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * @description Requires authenticate first. Requires an active subscription.
 */
export async function requireActiveSubscription(req, res, next) {
  try {
    const subscription = await getActiveSubscription(req.user.id);
    if (!subscription) {
      return res.status(403).json({ error: 'Active subscription required' });
    }
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
}
