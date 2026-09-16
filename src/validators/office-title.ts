import { z } from 'zod';
import { OfficeTitleLevel } from '@/generated/prisma/enums';

const sectionItemSchema = z.object({
  id: z.uuid().optional(),
  content: z.string().trim().min(1, { message: 'Item content cannot be empty' }),
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
    .max(50, { message: 'Section cannot exceed 50 items' })
    .optional(),
  content: z
    .string()
    .max(20000, { message: 'Content must not exceed 20000 characters' })
    .optional(),
});

const officeNameField = z
  .string()
  .trim()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name must not exceed 100 characters' });

const officeTitleBodySchema = z.object({
  name: officeNameField.optional(),
  title: officeNameField.optional(),
  level: z.enum(OfficeTitleLevel),
  description: z
    .string()
    .trim()
    .min(1, { message: 'Description must not be empty' })
    .max(1000, { message: 'Description must not exceed 1000 characters' })
    .nullable()
    .optional(),
  maxSlots: z
    .number()
    .int({ message: 'maxSlots must be an integer' })
    .positive({ message: 'maxSlots must be greater than 0' })
    .nullable()
    .optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
  reportsToId: z.uuid().nullable().optional(),
  sections: z
    .array(sectionSchema)
    .max(20, { message: 'Cannot exceed 20 sections' })
    .optional(),
});

export const createOfficeTitleSchema = officeTitleBodySchema.refine(
  (data) => Boolean(data.name || data.title),
  {
    message: 'Either name or title is required',
    path: ['name'],
  },
);

export const updateOfficeTitleSchema = officeTitleBodySchema
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.title !== undefined ||
      data.level !== undefined ||
      data.description !== undefined ||
      data.maxSlots !== undefined ||
      data.isPublic !== undefined ||
      data.sortOrder !== undefined ||
      data.reportsToId !== undefined ||
      data.sections !== undefined,
    {
      message: 'At least one field is required for update',
    },
  );

export const getAllOfficeTitlesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'page must be a positive integer',
      })
      .refine((val) => !val || parseInt(val) >= 1, {
        message: 'page must be at least 1',
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'limit must be a positive integer',
      })
      .refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 100), {
        message: 'limit must be between 1 and 100',
      }),
    search: z.string().min(1).max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'title', 'level']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateOfficeTitleSchema = z.infer<typeof createOfficeTitleSchema>;
export type UpdateOfficeTitleSchema = z.infer<typeof updateOfficeTitleSchema>;
