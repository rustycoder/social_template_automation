import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'social_template_automation',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  appUrl: process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  mpgs: {
    merchantId: process.env.MPGS_MERCHANT_ID || '',
    apiPassword: process.env.MPGS_API_PASSWORD || '',
    apiVersion: process.env.MPGS_API_VERSION || '74',
    region: process.env.MPGS_REGION || 'TEST',
    currency: process.env.MPGS_CURRENCY || 'USD',
    merchantName: process.env.MPGS_MERCHANT_NAME || 'Social Media Template Automation',
  },
  cron: {
    // Default: every hour at minute 0
    expireSubscriptions: process.env.CRON_EXPIRE_SCHEDULE || '0 * * * *',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  uploadsDir: process.env.UPLOADS_DIR || '',
};
