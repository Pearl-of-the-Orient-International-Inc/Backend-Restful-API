import { z } from 'zod';

const sectionItemSchema = z.object({
  id: z.uuid().optional(),
  content: z
    .string()
    .trim()
    .min(1, { message: 'Item content cannot be empty' }),
});

const sectionSchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, { message: 'Section title is required' })
    .max(100, { message: 'Section title must not exceed 100 characters' }),
  type: z.enum(['list', 'richtext']).default('list'),
  items: z
    .array(sectionItemSchema)
    .min(0, { message: 'Items array required' })
    .max(50, { message: 'Section cannot exceed 50 items' })
    .optional(),
  content: z
    .string()
    .max(20000, { message: 'Content must not exceed 20000 characters' })
    .optional(),
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

export const updateBranchServiceSchema = createBranchServiceSchema.partial().refine(
  (data) =>
    data.title !== undefined ||
    data.description !== undefined ||
    data.sections !== undefined,
  {
    message: 'At least one field is required for update',
  },
);


export type CreateBranchServiceSchema = z.infer<typeof createBranchServiceSchema>;
export type UpdateBranchServiceSchema = z.infer<typeof updateBranchServiceSchema>;