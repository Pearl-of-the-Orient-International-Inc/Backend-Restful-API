import z from 'zod';

export const usersQuerySchema = z.object({
  query: z.object({
    limit: z.string().regex(/^-?\d+$/, { message: 'Limit must be a numeric value' })
      .transform(Number)
      .refine((val) => val > 0, { message: 'Limit must be greater than 0' })
      .optional(),
    offset: z.string().regex(/^-?\d+$/, { message: 'Offset must be a numeric value' })
      .transform(Number)
      .refine((val) => val >= 0, { message: 'Offset must be 0 or greater' })
      .optional(),
  }),
})



export type UsersQuerySchema = z.infer<typeof usersQuerySchema>;