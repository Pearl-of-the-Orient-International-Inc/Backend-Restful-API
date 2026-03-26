import { z } from "zod";


const sectionItemSchema = z.object({
    id: z.uuid().optional(),
    content: z.string().trim().min(1, { message: 'Item content cannot be empty' }),
})


const sectionSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {


    if (data.type === 'list') {
      if (!data.items || data.items.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: 'items is required and must not be empty for list sections',
          path: ['items'],
        });
      }
      if (data.content !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: 'content is not allowed for list sections',
          path: ['content'],
        });
      }
    }

    if (data.type === 'richtext') {
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: 'content is required and must not be empty for richtext sections',
          path: ['content'],
        });
      }
      if (data.items !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: 'items is not allowed for richtext sections',
          path: ['items'],
        });
      }
    }
  });

export type SectionSchema = z.infer<typeof sectionSchema>;
export type SectionItemSchema = z.infer<typeof sectionItemSchema>;
export { sectionSchema, sectionItemSchema };