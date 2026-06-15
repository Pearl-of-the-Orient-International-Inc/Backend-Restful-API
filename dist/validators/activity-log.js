"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteActivityLogSchema = exports.getCurrentUserActivityLogsSchema = exports.getUserActivityLogsSchema = exports.getAllActivityLogsSchema = void 0;
const zod_1 = require("zod");
const limitSchema = zod_1.z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
    message: 'limit must be a positive integer',
})
    .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 500), {
    message: 'limit must be between 1 and 500',
});
exports.getAllActivityLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: limitSchema,
    }),
});
exports.getUserActivityLogsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.uuid(),
    }),
    query: zod_1.z.object({
        limit: limitSchema,
    }),
});
exports.getCurrentUserActivityLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: limitSchema,
    }),
});
exports.deleteActivityLogSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
