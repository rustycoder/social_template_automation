import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { testConnection } from './db.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await testConnection();
    console.log('MySQL connected');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    console.error('Ensure MySQL is running and run: mysql -u root -p < server/schema.sql');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`API server running at http://localhost:${config.port}`);
  });
}

start();
