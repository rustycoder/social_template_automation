import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { getActiveSubscription, syncExpiredSubscriptions, getLatestSubscription } from '../services/subscriptionService.js';

const router = Router();

function signToken(user) {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    subject: String(user.id),
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function buildUserResponse(userId) {
  const users = await query(
    'SELECT id, email, name, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const user = users[0];
  if (!user) return null;

  await syncExpiredSubscriptions();

  const subscription = await getActiveSubscription(userId);
  let subscriptionExpired = false;

  if (!subscription) {
    const latest = await getLatestSubscription(userId);
    subscriptionExpired =
      !!latest &&
      (latest.status === 'expired' ||
        latest.status === 'cancelled' ||
        new Date(latest.expiresAt) <= new Date());
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    hasActiveSubscription: !!subscription,
    subscriptionExpired,
    subscription: subscription
      ? {
          planId: subscription.planId,
          planName: subscription.planName,
          priceCents: subscription.priceCents,
          billingInterval: subscription.billingInterval,
          status: subscription.status,
          expiresAt: subscription.expiresAt,
        }
      : null,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [normalizedEmail, passwordHash, name.trim()]
    );

    const token = signToken({ id: result.insertId, email: normalizedEmail });
    const user = await buildUserResponse(result.insertId);

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rows = await query(
      'SELECT id, email, password_hash, name FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    const userResponse = await buildUserResponse(user.id);

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await buildUserResponse(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

export default router;
