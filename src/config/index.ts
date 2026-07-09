/**
 * Node Modules
 */
import dotenv from 'dotenv';
import type ms from 'ms';

dotenv.config({
  override: true,
  quiet: true,
});

const parseCsv = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseTrustProxy = (value?: string): boolean | number | string => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) return numeric;

  return value.trim();
};

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV,
  BYPASS_SEMINARY_STUDENT_AUTH:
    process.env.BYPASS_SEMINARY_STUDENT_AUTH === 'true',
  BACKUP_SCHEDULER_INTERVAL_MS: Number(
    process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? 60_000,
  ),
  MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS: Number(
    process.env.MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS ?? 86_400_000,
  ),
  WHITELIST_ORIGINS: [
    ...new Set([
      ...parseCsv(process.env.WHITELIST_ORIGINS),

      'https://pearl-chaplaincy.com',
      'https://www.pearl-chaplaincy.com',

      'https://pearlchaplaincy.org',
      'https://www.pearlchaplaincy.org',

      'https://admin.pearlchaplaincy.org',
      'https://www.admin.pearlchaplaincy.org',

      'https://officer.pearlchaplaincy.org',
      'https://www.officer.pearlchaplaincy.org',

      'https://seminary.pearlchaplaincy.org',
      'https://www.seminary.pearlchaplaincy.org',

      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
      'http://127.0.0.1:3005',
    ]),
  ],
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN!,
  LOGTAIL_INGESTING_HOST: process.env.LOGTAIL_INGESTING_HOST!,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as ms.StringValue,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as ms.StringValue,
  SMTP_EMAIL: process.env.SMTP_EMAIL || process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,

  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  VERIFY_REDIRECT_MEMBER_PROD:
    process.env.VERIFY_REDIRECT_MEMBER_PROD || 'https://pearlchaplaincy.org',
  VERIFY_REDIRECT_ADMIN_PROD:
    process.env.VERIFY_REDIRECT_ADMIN_PROD ||
    'https://admin.pearlchaplaincy.org',
  VERIFY_REDIRECT_OFFICER_PROD:
    process.env.VERIFY_REDIRECT_OFFICER_PROD ||
    'https://officer.pearlchaplaincy.org',
  VERIFY_REDIRECT_MEMBER_DEV:
    process.env.VERIFY_REDIRECT_MEMBER_DEV || 'http://localhost:3000',
  VERIFY_REDIRECT_ADMIN_DEV:
    process.env.VERIFY_REDIRECT_ADMIN_DEV || 'http://localhost:3000',
  VERIFY_REDIRECT_OFFICER_DEV:
    process.env.VERIFY_REDIRECT_OFFICER_DEV || 'http://localhost:3000',
  PASSKEY_RP_NAME: process.env.PASSKEY_RP_NAME || 'Pearl of the Orient',
  PASSKEY_RP_ID: process.env.PASSKEY_RP_ID,
  PASSKEY_EXPECTED_ORIGINS: parseCsv(process.env.PASSKEY_EXPECTED_ORIGINS),
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
};

export default config;
