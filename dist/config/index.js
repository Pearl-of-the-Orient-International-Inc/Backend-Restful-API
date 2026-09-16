"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    override: true,
    quiet: true,
});
const parseCsv = (value) => (value !== null && value !== void 0 ? value : '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const parseTrustProxy = (value) => {
    if (!value)
        return false;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true')
        return true;
    if (normalized === 'false')
        return false;
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric))
        return numeric;
    return value.trim();
};
const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV,
    BYPASS_SEMINARY_STUDENT_AUTH: process.env.BYPASS_SEMINARY_STUDENT_AUTH === 'true',
    BACKUP_SCHEDULER_INTERVAL_MS: Number((_a = process.env.BACKUP_SCHEDULER_INTERVAL_MS) !== null && _a !== void 0 ? _a : 60000),
    MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS: Number((_b = process.env.MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS) !== null && _b !== void 0 ? _b : 86400000),
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
    LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN,
    LOGTAIL_INGESTING_HOST: process.env.LOGTAIL_INGESTING_HOST,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    OWNER_DEFAULT_PIN: process.env.OWNER_DEFAULT_PIN,
    OWNER_SESSION_COOKIE_NAME: process.env.OWNER_SESSION_COOKIE_NAME || 'ownerAccessSession',
    SMTP_EMAIL: process.env.SMTP_EMAIL || process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    VERIFY_REDIRECT_MEMBER_PROD: process.env.VERIFY_REDIRECT_MEMBER_PROD || 'https://pearlchaplaincy.org',
    VERIFY_REDIRECT_ADMIN_PROD: process.env.VERIFY_REDIRECT_ADMIN_PROD ||
        'https://admin.pearlchaplaincy.org',
    VERIFY_REDIRECT_OFFICER_PROD: process.env.VERIFY_REDIRECT_OFFICER_PROD ||
        'https://officer.pearlchaplaincy.org',
    VERIFY_REDIRECT_INSTRUCTOR_PROD: process.env.VERIFY_REDIRECT_INSTRUCTOR_PROD ||
        'https://seminary.pearlchaplaincy.org',
    VERIFY_REDIRECT_MEMBER_DEV: process.env.VERIFY_REDIRECT_MEMBER_DEV || 'http://localhost:3000',
    VERIFY_REDIRECT_ADMIN_DEV: process.env.VERIFY_REDIRECT_ADMIN_DEV || 'http://localhost:3000',
    VERIFY_REDIRECT_OFFICER_DEV: process.env.VERIFY_REDIRECT_OFFICER_DEV || 'http://localhost:3000',
    VERIFY_REDIRECT_INSTRUCTOR_DEV: process.env.VERIFY_REDIRECT_INSTRUCTOR_DEV || 'http://localhost:3000',
    PASSKEY_RP_NAME: process.env.PASSKEY_RP_NAME || 'Pearl of the Orient',
    PASSKEY_RP_ID: process.env.PASSKEY_RP_ID,
    PASSKEY_EXPECTED_ORIGINS: parseCsv(process.env.PASSKEY_EXPECTED_ORIGINS),
    TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
    XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY,
    XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
    PAYPAL_API_BASE: process.env.PAYPAL_ENVIRONMENT === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
    XENDIT_PLATFORM_FEE_PERCENT: Number((_c = process.env.XENDIT_PLATFORM_FEE_PERCENT) !== null && _c !== void 0 ? _c : 3.5),
    XENDIT_PLATFORM_FEE_FIXED: Number((_d = process.env.XENDIT_PLATFORM_FEE_FIXED) !== null && _d !== void 0 ? _d : 11),
    PAYPAL_PLATFORM_FEE_PERCENT: Number((_e = process.env.PAYPAL_PLATFORM_FEE_PERCENT) !== null && _e !== void 0 ? _e : 4.4),
    PAYPAL_PLATFORM_FEE_FIXED: Number((_f = process.env.PAYPAL_PLATFORM_FEE_FIXED) !== null && _f !== void 0 ? _f : 15),
};
exports.default = config;
