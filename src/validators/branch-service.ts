import { z } from 'zod';

export const branchServiceIdParamSchema = z.object({
  id: z
    .string({ message: 'ID must be a string' })
    .trim()
    .min(1, { message: 'ID is required' })
    .uuid({ message: 'ID must be a valid UUID' }),
});

export type BranchServiceIdParam = z.infer<typeof branchServiceIdParamSchema>;