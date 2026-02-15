import { z } from 'zod';

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
});

export const updateOfficeSchema = createOfficeSchema.partial();

export type CreateOfficeSchema = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeSchema = z.infer<typeof updateOfficeSchema>;
export type SectionSchema = z.infer<typeof sectionSchema>;
export type SectionItemSchema = z.infer<typeof sectionItemSchema>;
