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

export const getDashboardReportSchema = z.object({
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

export const getMemberLocationReportSchema = z.object({
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
    granularity: z.enum(['province', 'municipality', 'barangay']).optional(),
    region: z.string().trim().max(120).optional(),
    province: z.string().trim().max(120).optional(),
    municipalityCity: z.string().trim().max(160).optional(),
  }),
});
