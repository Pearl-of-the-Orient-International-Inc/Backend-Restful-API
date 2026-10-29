"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passkeyAuthenticationVerifySchema = exports.passkeyAuthenticationOptionsSchema = exports.passkeyRegistrationVerifySchema = exports.passkeyRegistrationOptionsSchema = exports.verifyTwoFactorSchema = exports.twoFactorEnableSchema = exports.changePasswordSchema = exports.verifyPasswordSchema = exports.verificationEmailSchema = exports.resendVerificationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = exports.loginIdentifierSchema = exports.passwordSchema = exports.emailSchema = void 0;
const enums_1 = require("@/generated/prisma/enums");
const zod_1 = __importDefault(require("zod"));
exports.emailSchema = zod_1.default
    .email({ error: 'Enter a valid email address from any email provider' })
    .trim()
    .min(1, { error: 'Email is required' })
    .max(255, { error: 'Email must not exceed 255 characters' });
exports.passwordSchema = zod_1.default
    .string()
    .trim()
    .min(8, { error: 'Password must be at least 8 characters long' })
    .max(255, { error: 'Password must not exceed 255 characters' })
    .regex(/[A-Z]/, {
    error: 'Password must contain at least 1 uppercase letter',
})
    .regex(/[0-9]/, { error: 'Password must contain at least 1 number' })
    .regex(/[^A-Za-z0-9]/, {
    error: 'Password must contain at least 1 special character',
});
exports.loginIdentifierSchema = zod_1.default
    .string()
    .trim()
    .min(1, { error: 'Email, student number, or instructor ID is required' })
    .max(255, { error: 'Email, student number, or instructor ID must not exceed 255 characters' })
    .refine((value) => zod_1.default.email().safeParse(value).success ||
    /^POTSCI-\d{2}-\d{4}-INS$/i.test(value) ||
    /^POTSC-\d{2}-\d{4}$/i.test(value) ||
    /^POTSCI-\d{2}-\d{4}-(?!INS$)[A-Z0-9]+$/i.test(value), {
    error: 'Enter a valid email address, student number (for example, POTSC-26-0001), or instructor ID',
})
    .transform((value) => /^POTSCI-\d{2}-\d{4}-INS$/i.test(value) ||
    /^POTSC-\d{2}-\d{4}$/i.test(value) ||
    /^POTSCI-\d{2}-\d{4}-(?!INS$)[A-Z0-9]+$/i.test(value)
    ? value.toUpperCase()
    : value.toLowerCase());
exports.registerSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(100, { error: 'Name must not exceed 100 characters' }),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    role: zod_1.default.enum(enums_1.UserType, {
        message: 'Role must be one of MEMBER, OFFICER, or ADMIN',
    }),
});
exports.loginSchema = zod_1.default.object({
    email: exports.loginIdentifierSchema,
    password: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Password is required' })
        .max(255, { error: 'Password must not exceed 255 characters' }),
    userAgent: zod_1.default.string().optional(),
});
exports.forgotPasswordSchema = zod_1.default.object({
    email: exports.emailSchema,
});
exports.resetPasswordSchema = zod_1.default
    .object({
    password: exports.passwordSchema,
    confirmPassword: exports.passwordSchema,
})
    .refine((val) => val.password === val.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
});
exports.resendVerificationSchema = zod_1.default.object({
    email: exports.emailSchema,
});
exports.verificationEmailSchema = zod_1.default.object({
    code: zod_1.default.string().min(1, { error: 'Verification code is required' }),
});
exports.verifyPasswordSchema = zod_1.default.object({
    oldPassword: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Current password is required' })
        .max(255, { error: 'Current password must not exceed 255 characters' }),
});
exports.changePasswordSchema = zod_1.default
    .object({
    oldPassword: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Current password is required' })
        .max(255, { error: 'Current password must not exceed 255 characters' }),
    password: exports.passwordSchema,
    confirmPassword: exports.passwordSchema,
})
    .refine((val) => val.password === val.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
})
    .refine((val) => val.oldPassword !== val.password, {
    message: 'New password must be different from current password',
    path: ['password'],
});
exports.twoFactorEnableSchema = zod_1.default.object({
    token: zod_1.default
        .string()
        .trim()
        .regex(/^\d{6}$/, { error: 'Token must be a 6-digit code' }),
});
exports.verifyTwoFactorSchema = zod_1.default.object({
    mfaToken: zod_1.default.string().trim().min(1, { error: 'MFA token is required' }),
    token: zod_1.default
        .string()
        .trim()
        .regex(/^\d{6}$/, { error: 'Token must be a 6-digit code' }),
    userAgent: zod_1.default.string().optional(),
});
exports.passkeyRegistrationOptionsSchema = zod_1.default.object({
    label: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Passkey label must not be empty' })
        .max(100, { error: 'Passkey label must not exceed 100 characters' })
        .optional(),
});
exports.passkeyRegistrationVerifySchema = zod_1.default.object({
    response: zod_1.default.object({}).passthrough(),
});
exports.passkeyAuthenticationOptionsSchema = zod_1.default.object({
    email: exports.emailSchema,
});
exports.passkeyAuthenticationVerifySchema = zod_1.default.object({
    email: exports.emailSchema,
    response: zod_1.default.object({}).passthrough(),
    userAgent: zod_1.default.string().optional(),
});
