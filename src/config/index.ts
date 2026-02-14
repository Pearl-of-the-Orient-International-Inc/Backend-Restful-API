/**
 * Node Modules
 */
import dotenv from 'dotenv';

dotenv.config({
  override: true,
  quiet: true,
});

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV,
  WHITELIST_ORIGINS: ['https://pearl-chaplaincy.com', 'http://localhost:3000'],
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default config;
