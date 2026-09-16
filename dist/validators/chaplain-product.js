"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChaplainProductsSchema = exports.chaplainProductBodySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const assetUrl = zod_1.z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((value) => value.startsWith('/') || zod_1.z.url().safeParse(value).success, 'Image must be a valid URL or site-relative path');
exports.chaplainProductBodySchema = zod_1.z.object({
    slug: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens'),
    name: zod_1.z.string().trim().min(1).max(180),
    description: zod_1.z.string().trim().max(5000).nullable().optional(),
    category: zod_1.z.enum(enums_1.ChaplainProductCategory),
    price: zod_1.z.coerce.number().finite().min(0).max(10000000),
    stockQuantity: zod_1.z.coerce.number().int().min(0).max(1000000),
    lowStockThreshold: zod_1.z.coerce.number().int().min(0).max(1000000),
    imageUrl: assetUrl,
    imageFileName: zod_1.z.string().trim().max(255).nullable().optional(),
    isActive: zod_1.z.boolean(),
    sortOrder: zod_1.z.coerce.number().int().min(0).max(1000000),
});
exports.getChaplainProductsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
        search: zod_1.z.string().trim().max(180).optional(),
        category: zod_1.z.enum(enums_1.ChaplainProductCategory).optional(),
        isActive: zod_1.z
            .enum(['true', 'false'])
            .transform((value) => value === 'true')
            .optional(),
        sortBy: zod_1.z
            .enum([
            'name',
            'price',
            'stockQuantity',
            'sortOrder',
            'createdAt',
            'updatedAt',
        ])
            .optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
