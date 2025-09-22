/**
 * Configuration file for the Ministry Platform
 * @copyright 2025 Syrian Ministry of Communications and Information Technology
 */

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ministry_platform',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
  },
  analytics: {
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '5000'),
  },
};
