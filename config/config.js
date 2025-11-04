// api/config/config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'coletor-patrimonial-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    trustProxy: true, // Enable trust proxy to handle X-Forwarded-For headers
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  },
  
  // Database Configuration (for future SQLite integration)
  database: {
    type: 'sqlite',
    path: process.env.DB_PATH || './data/database.sqlite'
  }
};