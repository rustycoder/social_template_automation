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
};
