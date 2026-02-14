/**
 * Node Modules
 */
import dotenv from 'dotenv';
import type ms from 'ms';

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
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as ms.StringValue,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as ms.StringValue,
};

export default config;
