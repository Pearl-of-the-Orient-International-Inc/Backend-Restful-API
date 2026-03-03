"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBranchServicesSchema = exports.updateBranchServiceSchema = exports.createBranchServiceSchema = void 0;
const zod_1 = require("zod");
const sectionItemSchema = zod_1.z.object({
    id: zod_1.z.uuid().optional(),
    content: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Item content cannot be empty' }),
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
        .min(0, { message: 'Items array required' })
        .max(50, { message: 'Section cannot exceed 50 items' })
        .optional(),
    content: zod_1.z
        .string()
        .max(20000, { message: 'Content must not exceed 20000 characters' })
        .optional(),
});
exports.createBranchServiceSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Title is required' })
        .max(100, { message: 'Title must not exceed 100 characters' }),
    description: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'Description is required' })
        .max(1000, { message: 'Description must not exceed 1000 characters' }),
    sections: zod_1.z
        .array(sectionSchema)
        .min(1, { message: 'At least one section is required' })
        .max(20, { message: 'Cannot exceed 20 sections' }),
});
exports.updateBranchServiceSchema = exports.createBranchServiceSchema.partial();
exports.getAllBranchServicesSchema = zod_1.z.object({
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
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'title']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
