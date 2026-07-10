import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { validateSessionVersion } from '../services/sessionService.js';

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

    req.user = { id: userId, email: payload.email };
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
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}
