"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskSchema = exports.moveTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.deleteTaskBoardSchema = exports.updateTaskBoardSchema = exports.createTaskBoardSchema = exports.getTaskManagementSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const colorSchema = zod_1.z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex color');
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional().or(zod_1.z.literal(''));
const dateStringSchema = zod_1.z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'dueDate must be a valid date',
})
    .optional()
    .or(zod_1.z.literal(''));
exports.getTaskManagementSchema = zod_1.z.object({
    query: zod_1.z.object({
        search: optionalText(100),
        priority: zod_1.z.enum(enums_1.TaskPriority).optional(),
    }),
});
exports.createTaskBoardSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(1).max(80),
        color: colorSchema,
    }),
});
exports.updateTaskBoardSchema = zod_1.z.object({
    params: zod_1.z.object({ boardId: zod_1.z.uuid() }),
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(1).max(80),
        color: colorSchema,
    }),
});
exports.deleteTaskBoardSchema = zod_1.z.object({
    params: zod_1.z.object({ boardId: zod_1.z.uuid() }),
});
exports.createTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(1).max(255),
        boardId: zod_1.z.uuid(),
        priority: zod_1.z.enum(enums_1.TaskPriority).default(enums_1.TaskPriority.MEDIUM),
        dueDate: dateStringSchema,
        assigneeId: zod_1.z.uuid().optional().or(zod_1.z.literal('')),
    }),
});
exports.updateTaskSchema = zod_1.z.object({
    params: zod_1.z.object({ taskId: zod_1.z.uuid() }),
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(1).max(255),
        boardId: zod_1.z.uuid(),
        priority: zod_1.z.enum(enums_1.TaskPriority),
        dueDate: dateStringSchema,
        assigneeId: zod_1.z.uuid().optional().or(zod_1.z.literal('')),
        progress: zod_1.z.string().trim().min(1).max(30).optional(),
    }),
});
exports.moveTaskSchema = zod_1.z.object({
    params: zod_1.z.object({ taskId: zod_1.z.uuid() }),
    body: zod_1.z.object({
        boardId: zod_1.z.uuid(),
        sortOrder: zod_1.z.coerce.number().int().min(0).optional(),
    }),
});
exports.deleteTaskSchema = zod_1.z.object({
    params: zod_1.z.object({ taskId: zod_1.z.uuid() }),
});
