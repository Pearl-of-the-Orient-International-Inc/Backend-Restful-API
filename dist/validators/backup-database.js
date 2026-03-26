"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupIdParamSchema = exports.updateBackupSettingsSchema = void 0;
const zod_1 = require("zod");
exports.updateBackupSettingsSchema = zod_1.z.object({
    automaticBackupEnabled: zod_1.z.boolean(),
    frequency: zod_1.z.enum(['HOURLY', 'DAILY', 'WEEKLY']),
    retentionDays: zod_1.z
        .number()
        .int()
        .min(1, { message: 'Retention must be at least 1 day' })
        .max(365, { message: 'Retention must not exceed 365 days' }),
});
exports.backupIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
