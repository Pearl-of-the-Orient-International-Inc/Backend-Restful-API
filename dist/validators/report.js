"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberLocationReportSchema = exports.getDashboardReportSchema = exports.getMinistryReportSchema = void 0;
const zod_1 = require("zod");
exports.getMinistryReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        months: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'months must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 24), {
            message: 'months must be between 1 and 24',
        }),
    }),
});
exports.getDashboardReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        months: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'months must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 24), {
            message: 'months must be between 1 and 24',
        }),
    }),
});
exports.getMemberLocationReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        months: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'months must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 24), {
            message: 'months must be between 1 and 24',
        }),
        granularity: zod_1.z.enum(['province', 'municipality', 'barangay']).optional(),
        region: zod_1.z.string().trim().max(120).optional(),
        province: zod_1.z.string().trim().max(120).optional(),
        municipalityCity: zod_1.z.string().trim().max(160).optional(),
    }),
});
