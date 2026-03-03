import { z } from 'zod';
import { OfficeTitleLevel } from '@/generated/prisma/enums';

// Schema for individual items within a section (can be rich text HTML)
const sectionItemSchema = z.object({
  id: z.uuid().optional(), // For drag-and-drop ordering
  content: z
    .string()
    .trim()
    .min(1, { message: 'Item content cannot be empty' }),
});

// Schema for a section (e.g., "Duties and Responsibilities", "Community Outreach", "Qualifications")
const sectionSchema = z.object({
  id: z.uuid().optional(), // For drag-and-drop ordering
  title: z
    .string()
    .trim()
    .min(1, { message: 'Section title is required' })
    .max(100, { message: 'Section title must not exceed 100 characters' }),
  type: z.enum(['list', 'richtext']).default('list'),
  items: z
    .array(sectionItemSchema)
    .min(0, { message: 'Items array required' }) // Allow empty for richtext type
    .max(50, { message: 'Section cannot exceed 50 items' })
    .optional(), // Optional for richtext sections
  content: z
    .string()
    .max(20000, { message: 'Content must not exceed 20000 characters' })
    .optional(), // NEW: For richtext type
});

// Main office creation schema
export const createOfficeSchema = z.object({
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
  level: z.nativeEnum(OfficeTitleLevel).optional(),
  maxSlots: z
    .number()
    .int({ message: 'maxSlots must be an integer' })
    .positive({ message: 'maxSlots must be greater than 0' })
    .nullable()
    .optional(),
});

export const getAllOfficesSchema = z.object({
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

    sortBy: z
      .enum(['createdAt', 'updatedAt', 'title'])
      .optional(),

    sortOrder: z
      .enum(['asc', 'desc'])
      .optional(),
  }),
});

export const updateOfficeSchema = createOfficeSchema.partial();

export type CreateOfficeSchema = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeSchema = z.infer<typeof updateOfficeSchema>;
export type SectionSchema = z.infer<typeof sectionSchema>;
export type SectionItemSchema = z.infer<typeof sectionItemSchema>;
