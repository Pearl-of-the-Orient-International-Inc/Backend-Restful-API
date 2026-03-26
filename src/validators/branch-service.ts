import { z } from 'zod';

export const branchServiceIdParamSchema = z.object({
  id: z
    .string({ message: 'ID must be a string' })
    .trim()
    .min(1, { message: 'ID is required' })
    .uuid({ message: 'ID must be a valid UUID' }),
});

const sectionItemSchema = z.object({
  id: z.string().uuid().optional(),
  content: z
    .string()
    .trim()
    .min(1, { message: 'Item content cannot be empty' }),
});

const sectionSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, { message: 'Section title is required' })
      .max(100, { message: 'Section title must not exceed 100 characters' }),
    type: z.enum(['list', 'richtext']).default('list'),
    items: z
      .array(sectionItemSchema)
      .max(50, { message: 'Section cannot exceed 50 items' })
      .optional(),
    content: z
      .string()
      .max(20000, { message: 'Content must not exceed 20000 characters' })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'list') {
      if (!val.items || val.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items'],
          message: 'List sections must have at least one item',
        });
      }
    }

    if (val.type === 'richtext') {
      if (!val.content || val.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content'],
          message: 'Richtext sections must have content',
        });
      }
    }
  });

export const createBranchServiceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(100, { message: 'Title must not exceed 100 characters' }),
  description: z
    .string()
    .trim()
    .min(1, { message: 'Description is required' })
    .max(1000, { message: 'Description must not exceed 1000 characters' }),
  sections: z
    .array(sectionSchema)
    .min(1, { message: 'At least one section is required' })
    .max(20, { message: 'Cannot exceed 20 sections' }),
});

export const updateBranchServiceSchema = createBranchServiceSchema.partial();

export type CreateBranchServiceSchema = z.infer<typeof createBranchServiceSchema>;
export type UpdateBranchServiceSchema = z.infer<typeof updateBranchServiceSchema>;
export type BranchServiceIdParam = z.infer<typeof branchServiceIdParamSchema>;