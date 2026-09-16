import { z } from 'zod';
import {
  BulletinEntryStatus,
  BulletinEntryType,
} from '@/generated/prisma/enums';

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const bulletinEntryBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(20_000),
    type: z.enum(BulletinEntryType),
    status: z.enum(BulletinEntryStatus).optional(),
    publicationDate: z.iso.datetime().nullable().optional(),
    scheduledAt: z.iso.datetime().nullable().optional(),
    authorName: optionalText(150),
    issuingOffice: optionalText(150),
    featuredImageUrl: z.url().nullable().optional(),
    featuredImageFileName: optionalText(255),
    attachmentUrl: z.url().nullable().optional(),
    attachmentFileName: optionalText(255),
    attachmentMimeType: optionalText(150),
  })
  .superRefine((value, context) => {
    if (!value.authorName?.trim() && !value.issuingOffice?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['authorName'],
        message: 'Author or issuing office is required',
      });
    }

    if (value.status === BulletinEntryStatus.SCHEDULED && !value.scheduledAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Scheduled publication date is required',
      });
    }
  });

export const createBulletinEntrySchema = bulletinEntryBodySchema;
export const updateBulletinEntrySchema = bulletinEntryBodySchema;

export const getBulletinEntriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(150).optional(),
    type: z.enum(BulletinEntryType).optional(),
    status: z.enum(BulletinEntryStatus).optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'publicationDate', 'scheduledAt', 'title'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type BulletinEntryBody = z.infer<typeof bulletinEntryBodySchema>;
