"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerReportSchema = exports.ownerChangePinSchema = exports.ownerLoginSchema = void 0;
const zod_1 = require("zod");
const pinSchema = zod_1.z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' });
exports.ownerLoginSchema = zod_1.z.object({
    pin: pinSchema,
});
exports.ownerChangePinSchema = zod_1.z.object({
    currentPin: pinSchema,
    newPin: pinSchema,
});
exports.ownerReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        from: zod_1.z.iso.datetime().or(zod_1.z.iso.date()).optional(),
        to: zod_1.z.iso.datetime().or(zod_1.z.iso.date()).optional(),
    }),
});
