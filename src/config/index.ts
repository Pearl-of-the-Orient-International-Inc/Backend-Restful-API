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
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN!,
  LOGTAIL_INGESTING_HOST: process.env.LOGTAIL_INGESTING_HOST!,
  DATABASE_URL: process.env.DATABASE_URL,
};

export default config;
