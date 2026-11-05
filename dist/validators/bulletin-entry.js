"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBulletinEntriesSchema = exports.updateBulletinEntrySchema = exports.createBulletinEntrySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalText = (max) => zod_1.z.string().trim().max(max).nullable().optional();
const bulletinEntryBodySchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).max(200),
    content: zod_1.z.string().trim().min(1).max(20000),
    type: zod_1.z.enum(enums_1.BulletinEntryType),
    status: zod_1.z.enum(enums_1.BulletinEntryStatus).optional(),
    publicationDate: zod_1.z.iso.datetime().nullable().optional(),
    scheduledAt: zod_1.z.iso.datetime().nullable().optional(),
    authorName: optionalText(150),
    issuingOffice: optionalText(150),
    featuredImageUrl: zod_1.z.url().nullable().optional(),
    featuredImageFileName: optionalText(255),
    attachmentUrl: zod_1.z.url().nullable().optional(),
    attachmentFileName: optionalText(255),
    attachmentMimeType: optionalText(150),
})
    .superRefine((value, context) => {
    var _a, _b;
    if (!((_a = value.authorName) === null || _a === void 0 ? void 0 : _a.trim()) && !((_b = value.issuingOffice) === null || _b === void 0 ? void 0 : _b.trim())) {
        context.addIssue({
            code: 'custom',
            path: ['authorName'],
            message: 'Author or issuing office is required',
        });
    }
    if (value.status === enums_1.BulletinEntryStatus.SCHEDULED && !value.scheduledAt) {
        context.addIssue({
            code: 'custom',
            path: ['scheduledAt'],
            message: 'Scheduled publication date is required',
        });
    }
});
exports.createBulletinEntrySchema = bulletinEntryBodySchema;
exports.updateBulletinEntrySchema = bulletinEntryBodySchema;
exports.getBulletinEntriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
        search: zod_1.z.string().trim().max(150).optional(),
        type: zod_1.z.enum(enums_1.BulletinEntryType).optional(),
        status: zod_1.z.enum(enums_1.BulletinEntryStatus).optional(),
        sortBy: zod_1.z
            .enum(['createdAt', 'updatedAt', 'publicationDate', 'scheduledAt', 'title'])
            .optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
