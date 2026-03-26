import { z } from 'zod';

const limitSchema = z
  .string()
  .optional()
  .refine((val) => !val || /^\d+$/.test(val), {
    message: 'limit must be a positive integer',
  })
  .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 500), {
    message: 'limit must be between 1 and 500',
  });

export const getAllActivityLogsSchema = z.object({
  query: z.object({
    limit: limitSchema,
  }),
});

export const getUserActivityLogsSchema = z.object({
  params: z.object({
    userId: z.uuid(),
  }),
  query: z.object({
    limit: limitSchema,
  }),
});

export const deleteActivityLogSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});
