import { z } from 'zod';

export const updateBackupSettingsSchema = z.object({
  automaticBackupEnabled: z.boolean(),
  frequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY']),
  retentionDays: z
    .number()
    .int()
    .min(1, { message: 'Retention must be at least 1 day' })
    .max(365, { message: 'Retention must not exceed 365 days' }),
});

export const backupIdParamSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export type UpdateBackupSettingsSchema = z.infer<
  typeof updateBackupSettingsSchema
>;
