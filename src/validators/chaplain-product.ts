import { z } from 'zod';
import { ChaplainProductCategory } from '@/generated/prisma/enums';

const assetUrl = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (value) => value.startsWith('/') || z.url().safeParse(value).success,
    'Image must be a valid URL or site-relative path',
  );

export const chaplainProductBodySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must use lowercase letters, numbers, and hyphens',
    ),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  category: z.enum(ChaplainProductCategory),
  price: z.coerce.number().finite().min(0).max(10_000_000),
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000),
  imageUrl: assetUrl,
  imageFileName: z.string().trim().max(255).nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1_000_000),
});

export const getChaplainProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    search: z.string().trim().max(180).optional(),
    category: z.enum(ChaplainProductCategory).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sortBy: z
      .enum([
        'name',
        'price',
        'stockQuantity',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type ChaplainProductBody = z.infer<typeof chaplainProductBodySchema>;
