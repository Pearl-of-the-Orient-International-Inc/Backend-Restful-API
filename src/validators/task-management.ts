import { z } from 'zod';
import { TaskPriority } from '@/generated/prisma/enums';

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex color');
const optionalText = (max = 255) => z.string().trim().max(max).optional().or(z.literal(''));
const dateStringSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'dueDate must be a valid date',
  })
  .optional()
  .or(z.literal(''));

export const getTaskManagementSchema = z.object({
  query: z.object({
    search: optionalText(100),
    priority: z.enum(TaskPriority).optional(),
  }),
});

export const createTaskBoardSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(80),
    color: colorSchema,
  }),
});

export const updateTaskBoardSchema = z.object({
  params: z.object({ boardId: z.uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(80),
    color: colorSchema,
  }),
});

export const deleteTaskBoardSchema = z.object({
  params: z.object({ boardId: z.uuid() }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    boardId: z.uuid(),
    priority: z.enum(TaskPriority).default(TaskPriority.MEDIUM),
    dueDate: dateStringSchema,
    assigneeId: z.uuid().optional().or(z.literal('')),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ taskId: z.uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(255),
    boardId: z.uuid(),
    priority: z.enum(TaskPriority),
    dueDate: dateStringSchema,
    assigneeId: z.uuid().optional().or(z.literal('')),
    progress: z.string().trim().min(1).max(30).optional(),
  }),
});

export const moveTaskSchema = z.object({
  params: z.object({ taskId: z.uuid() }),
  body: z.object({
    boardId: z.uuid(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  }),
});

export const deleteTaskSchema = z.object({
  params: z.object({ taskId: z.uuid() }),
});

export type GetTaskManagementQuery = z.infer<typeof getTaskManagementSchema>['query'];
export type TaskBoardBody = z.infer<typeof createTaskBoardSchema>['body'];
export type CreateTaskBody = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>['body'];
export type MoveTaskBody = z.infer<typeof moveTaskSchema>['body'];
