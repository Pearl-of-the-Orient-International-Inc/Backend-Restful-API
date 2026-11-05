"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserPasswordByAdminSchema = exports.updateUserByIdSchema = exports.createUserAccountSchema = void 0;
const enums_1 = require("../generated/prisma/enums");
const zod_1 = __importDefault(require("zod"));
const auth_1 = require("./auth");
exports.createUserAccountSchema = zod_1.default.object({
    name: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(100, { error: 'Name must not exceed 100 characters' }),
    email: auth_1.emailSchema,
    password: auth_1.passwordSchema,
    role: zod_1.default
        .enum(enums_1.UserType)
        .optional()
        .default(enums_1.UserType.ADMIN)
        .refine((value) => value === enums_1.UserType.ADMIN, {
        message: 'Account role must be ADMIN',
    }),
    position: zod_1.default.enum(enums_1.UserPosition, {
        message: 'Position is required',
    }),
    accountStatus: zod_1.default.enum(enums_1.UserAccountStatus).optional().default(enums_1.UserAccountStatus.ACTIVE),
    avatar: zod_1.default.string().trim().url().optional().or(zod_1.default.literal('')).or(zod_1.default.null()),
    isTwoFactorEnabled: zod_1.default.boolean().optional().default(false),
    notes: zod_1.default.string().trim().max(1000).optional(),
});
exports.updateUserByIdSchema = zod_1.default
    .object({
    name: zod_1.default
        .string()
        .trim()
        .min(1, { error: 'Name is required' })
        .max(100, { error: 'Name must not exceed 100 characters' })
        .optional(),
    email: auth_1.emailSchema.optional(),
    role: zod_1.default
        .enum(enums_1.UserType)
        .refine((value) => value === enums_1.UserType.ADMIN, {
        message: 'Account role must be ADMIN',
    })
        .optional(),
    position: zod_1.default.enum(enums_1.UserPosition).optional(),
    accountStatus: zod_1.default.enum(enums_1.UserAccountStatus).optional(),
    avatar: zod_1.default.string().trim().url().optional().or(zod_1.default.literal('')).or(zod_1.default.null()),
    isTwoFactorEnabled: zod_1.default.boolean().optional(),
    notes: zod_1.default.string().trim().max(1000).optional(),
})
    .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
});
exports.changeUserPasswordByAdminSchema = zod_1.default
    .object({
    password: auth_1.passwordSchema,
    confirmPassword: auth_1.passwordSchema,
})
    .refine((val) => val.password === val.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
});
