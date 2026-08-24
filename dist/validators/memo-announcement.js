"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMemoRecipientsSchema = exports.getMemoAnnouncementsSchema = exports.publishMemoAnnouncementSchema = exports.updateMemoAnnouncementSchema = exports.createMemoAnnouncementSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const recipientSchema = zod_1.z.object({
    type: zod_1.z.enum(['USER', 'MEMBER']),
    id: zod_1.z.uuid(),
});
const recipientScopeSchema = zod_1.z.enum(['SPECIFIC', 'ALL', 'OFFICERS']).default('SPECIFIC');
const baseMemoBodySchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(200),
    category: zod_1.z.enum(enums_1.MemoTemplateType),
    customCategory: zod_1.z.string().trim().max(120).optional().nullable(),
    summary: zod_1.z.string().trim().max(1000).optional().nullable(),
    documentName: zod_1.z.string().trim().min(1).max(255),
    docxBase64: zod_1.z.string().trim().min(1).optional(),
    recipientScope: recipientScopeSchema,
    recipientTargets: zod_1.z.array(recipientSchema).max(500).default([]),
});
exports.createMemoAnnouncementSchema = baseMemoBodySchema;
exports.updateMemoAnnouncementSchema = baseMemoBodySchema.partial().extend({
    recipientTargets: zod_1.z.array(recipientSchema).max(500).optional(),
});
exports.publishMemoAnnouncementSchema = zod_1.z.object({
    docxBase64: zod_1.z.string().trim().min(1).optional(),
    documentName: zod_1.z.string().trim().min(1).max(255).optional(),
});
exports.getMemoAnnouncementsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        search: zod_1.z.string().trim().min(1).max(150).optional(),
        category: zod_1.z.enum(enums_1.MemoTemplateType).optional(),
        status: zod_1.z.enum(['DRAFT', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'ARCHIVED']).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'publishedAt', 'referenceNumber', 'title']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
exports.searchMemoRecipientsSchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().trim().min(1).max(150).optional(),
        limit: zod_1.z.string().optional(),
    }),
});
