"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllNewsBlogsSchema = exports.updateNewsBlogSchema = exports.createNewsBlogSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const mediaItemSchema = zod_1.z.object({
    kind: zod_1.z.enum(enums_1.NewsBlogMediaKind),
    fileUrl: zod_1.z.url({ message: 'Media URL must be a valid URL' }),
    fileName: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Media file name is required' })
        .max(255, { message: 'Media file name must not exceed 255 characters' }),
});
const hashtagSchema = zod_1.z
    .string()
    .trim()
    .min(1, { message: 'Hashtag is required' })
    .max(100, { message: 'Hashtag must not exceed 100 characters' });
const newsBlogBodySchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Title is required' })
        .max(200, { message: 'Title must not exceed 200 characters' }),
    caption: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Caption is required' })
        .max(20000, { message: 'Caption must not exceed 20000 characters' }),
    status: zod_1.z.enum(enums_1.NewsBlogStatus).optional(),
    platform: zod_1.z.enum(enums_1.NewsBlogPlatform).optional(),
    media: zod_1.z.array(mediaItemSchema).max(10, { message: 'Media must not exceed 10 files' }),
    taggedMemberIds: zod_1.z.array(zod_1.z.uuid()).max(100).optional(),
    hashtags: zod_1.z.array(hashtagSchema).max(50, { message: 'Hashtags must not exceed 50 items' }),
    scheduledAt: zod_1.z.iso.datetime().nullable().optional(),
    publishedAt: zod_1.z.iso.datetime().nullable().optional(),
});
exports.createNewsBlogSchema = newsBlogBodySchema;
exports.updateNewsBlogSchema = newsBlogBodySchema;
exports.getAllNewsBlogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'page must be a positive integer',
        })
            .refine((val) => !val || parseInt(val, 10) >= 1, {
            message: 'page must be at least 1',
        }),
        limit: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'limit must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 100), {
            message: 'limit must be between 1 and 100',
        }),
        search: zod_1.z.string().trim().min(1).max(150).optional(),
        status: zod_1.z.enum(enums_1.NewsBlogStatus).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'scheduledAt', 'title']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
