import { z } from 'zod';
import { MemoTemplateType } from '@/generated/prisma/enums';

const recipientSchema = z.object({
  type: z.enum(['USER', 'MEMBER']),
  id: z.uuid(),
});

const recipientScopeSchema = z.enum(['SPECIFIC', 'ALL', 'OFFICERS']).default('SPECIFIC');

const baseMemoBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(MemoTemplateType),
  customCategory: z.string().trim().max(120).optional().nullable(),
  summary: z.string().trim().max(1000).optional().nullable(),
  documentName: z.string().trim().min(1).max(255),
  docxBase64: z.string().trim().min(1).optional(),
  recipientScope: recipientScopeSchema,
  recipientTargets: z.array(recipientSchema).max(500).default([]),
});

export const createMemoAnnouncementSchema = baseMemoBodySchema;
export const createOfficerMemoAnnouncementSchema = baseMemoBodySchema.omit({
  recipientScope: true,
  recipientTargets: true,
}).extend({
  content: z.string().trim().max(20_000).optional(),
  documentName: z.string().trim().min(1).max(255).optional(),
  docxBase64: z.string().trim().min(1).optional(),
}).refine((value) => Boolean(value.content || (value.documentName && value.docxBase64)), {
  message: 'Write memo content or save a memo document before submitting.',
});
export const updateMemoAnnouncementSchema = baseMemoBodySchema.partial().extend({
  recipientTargets: z.array(recipientSchema).max(500).optional(),
});

export const publishMemoAnnouncementSchema = z.object({
  docxBase64: z.string().trim().min(1).optional(),
  documentName: z.string().trim().min(1).max(255).optional(),
});

export const getMemoAnnouncementsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().trim().min(1).max(150).optional(),
    category: z.enum(MemoTemplateType).optional(),
    status: z.enum(['DRAFT', 'REJECTED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'ARCHIVED']).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'referenceNumber', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const searchMemoRecipientsSchema = z.object({
  query: z.object({
    search: z.string().trim().min(1).max(150).optional(),
    limit: z.string().optional(),
  }),
});

export type CreateMemoAnnouncementSchema = z.infer<typeof createMemoAnnouncementSchema>;
export type UpdateMemoAnnouncementSchema = z.infer<typeof updateMemoAnnouncementSchema>;
export type PublishMemoAnnouncementSchema = z.infer<typeof publishMemoAnnouncementSchema>;
