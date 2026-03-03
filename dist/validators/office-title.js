"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOfficeTitlesSchema = exports.updateOfficeTitleSchema = exports.createOfficeTitleSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const sectionItemSchema = zod_1.z.object({
    id: zod_1.z.uuid().optional(),
    content: zod_1.z.string().trim().min(1, { message: 'Item content cannot be empty' }),
});
const sectionSchema = zod_1.z.object({
    id: zod_1.z.uuid().optional(),
    title: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Section title is required' })
        .max(100, { message: 'Section title must not exceed 100 characters' }),
    type: zod_1.z.enum(['list', 'richtext']).default('list'),
    items: zod_1.z
        .array(sectionItemSchema)
        .max(50, { message: 'Section cannot exceed 50 items' })
        .optional(),
    content: zod_1.z
        .string()
        .max(20000, { message: 'Content must not exceed 20000 characters' })
        .optional(),
});
const officeNameField = zod_1.z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must not exceed 100 characters' });
const officeTitleBodySchema = zod_1.z.object({
    name: officeNameField.optional(),
    title: officeNameField.optional(),
    level: zod_1.z.enum(enums_1.OfficeTitleLevel),
    description: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Description must not be empty' })
        .max(1000, { message: 'Description must not exceed 1000 characters' })
        .nullable()
        .optional(),
    maxSlots: zod_1.z
        .number()
        .int({ message: 'maxSlots must be an integer' })
        .positive({ message: 'maxSlots must be greater than 0' })
        .nullable()
        .optional(),
    sections: zod_1.z
        .array(sectionSchema)
        .max(20, { message: 'Cannot exceed 20 sections' })
        .optional(),
});
exports.createOfficeTitleSchema = officeTitleBodySchema.refine((data) => Boolean(data.name || data.title), {
    message: 'Either name or title is required',
    path: ['name'],
});
exports.updateOfficeTitleSchema = officeTitleBodySchema
    .partial()
    .refine((data) => data.name !== undefined ||
    data.title !== undefined ||
    data.level !== undefined ||
    data.description !== undefined ||
    data.maxSlots !== undefined ||
    data.sections !== undefined, {
    message: 'At least one field is required for update',
});
exports.getAllOfficeTitlesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'page must be a positive integer',
        })
            .refine((val) => !val || parseInt(val) >= 1, {
            message: 'page must be at least 1',
        }),
        limit: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'limit must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 100), {
            message: 'limit must be between 1 and 100',
        }),
        search: zod_1.z.string().min(1).max(100).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'name', 'title', 'level']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
