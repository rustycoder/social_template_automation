import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { config } from './config.js';
import { testConnection } from './database/db.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import templateRoutes from './routes/templates.js';
import adminRoutes from './routes/admin.js';
import postRoutes from './routes/posts.js';
import { ensureUploadsDir, getUploadsRoot } from './services/postService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

ensureUploadsDir();
app.use('/uploads', express.static(getUploadsRoot()));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await testConnection();
    console.log('MariaDB/MySQL connected');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Ensure the database is running and run: npm run db:migrate');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`API server running at http://localhost:${config.port}`);
    console.log(`Uploads served from ${path.resolve(getUploadsRoot() || path.join(__dirname, 'uploads'))}`);
  });
}

start();
