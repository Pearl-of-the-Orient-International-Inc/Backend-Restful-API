
import { z } from 'zod';

export const getAllUsersSchema = z.object({
  limit: z
    .string()
    .optional()
    .refine((val) => val === undefined || !/[^0-9-]/.test(val), {
        message: 'limit must be a number',  // for abc
    })
    .refine((val) => val === undefined || !val.startsWith('-'), {
        message: 'limit must not be negative', // for -1
    }),
  offset: z
    .string()
    .optional()
    .refine((val) => val === undefined || !/[^0-9-]/.test(val), {
        message: 'limit must be a number',  // for abc
    })
    .refine((val) => val === undefined || !val.startsWith('-'), {
        message: 'limit must not be negative', // for -1
    }),
});