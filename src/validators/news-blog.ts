import { z } from 'zod';
import {
  NewsBlogMediaKind,
  NewsBlogPlatform,
  NewsBlogStatus,
} from '@/generated/prisma/enums';

const mediaItemSchema = z.object({
  kind: z.enum(NewsBlogMediaKind),
  fileUrl: z.url({ message: 'Media URL must be a valid URL' }),
  fileName: z
    .string()
    .trim()
    .min(1, { message: 'Media file name is required' })
    .max(255, { message: 'Media file name must not exceed 255 characters' }),
});

const hashtagSchema = z
  .string()
  .trim()
  .min(1, { message: 'Hashtag is required' })
  .max(100, { message: 'Hashtag must not exceed 100 characters' });

const newsBlogBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(200, { message: 'Title must not exceed 200 characters' }),
  caption: z
    .string()
    .trim()
    .min(1, { message: 'Caption is required' })
    .max(20000, { message: 'Caption must not exceed 20000 characters' }),
  status: z.enum(NewsBlogStatus).optional(),
  platform: z.enum(NewsBlogPlatform).optional(),
  media: z.array(mediaItemSchema).max(10, { message: 'Media must not exceed 10 files' }),
  taggedMemberIds: z.array(z.uuid()).max(100).optional(),
  hashtags: z.array(hashtagSchema).max(50, { message: 'Hashtags must not exceed 50 items' }),
  scheduledAt: z.iso.datetime().nullable().optional(),
  publishedAt: z.iso.datetime().nullable().optional(),
});

export const createNewsBlogSchema = newsBlogBodySchema;
export const updateNewsBlogSchema = newsBlogBodySchema;

export const getAllNewsBlogsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'page must be a positive integer',
      })
      .refine((val) => !val || parseInt(val, 10) >= 1, {
        message: 'page must be at least 1',
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'limit must be a positive integer',
      })
      .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
        message: 'limit must be between 1 and 100',
      }),
    search: z.string().trim().min(1).max(150).optional(),
    status: z.enum(NewsBlogStatus).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'scheduledAt', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateNewsBlogSchema = z.infer<typeof createNewsBlogSchema>;
export type UpdateNewsBlogSchema = z.infer<typeof updateNewsBlogSchema>;
