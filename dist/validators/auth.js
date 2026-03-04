"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorEnableSchema = exports.changePasswordSchema = exports.verifyPasswordSchema = exports.verificationEmailSchema = exports.resendVerificationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = exports.passwordSchema = exports.emailSchema = void 0;
const enums_1 = require("../generated/prisma/enums");
const zod_1 = __importDefault(require("zod"));
exports.emailSchema = zod_1.default
    .email()
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
exports.registerSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(100, { error: 'Name must not exceed 100 characters' }),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    role: zod_1.default.enum(enums_1.UserType, {
        message: 'Role must be either MEMBER or ADMIN',
    }),
});
exports.loginSchema = zod_1.default.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
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
