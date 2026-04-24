import { z } from 'zod';

export const getMinistryReportSchema = z.object({
  query: z.object({
    months: z
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
