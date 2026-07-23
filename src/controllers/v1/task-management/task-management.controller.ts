import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { TaskPriority } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';
import type {
  CreateTaskBody,
  GetTaskManagementQuery,
  MoveTaskBody,
  TaskBoardBody,
  UpdateTaskBody,
} from '@/validators/task-management';

const taskInclude = {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      position: true,
      accountStatus: true,
    },
  },
} satisfies Prisma.TaskItemInclude;

const boardInclude = {
  tasks: {
    include: taskInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.TaskBoardInclude;

const defaultBoards = [
  { title: 'To Do', color: '#475569' },
  { title: 'Drafting', color: '#1d4ed8' },
  { title: 'In Review', color: '#4338ca' },
  { title: 'Done', color: '#047857' },
];

const parseDateOrNull = (value?: string | null) => (value ? new Date(value) : null);
const trimToNull = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const ensureDefaultBoards = async () => {
  const count = await prisma.taskBoard.count();
  if (count > 0) return;
  await prisma.taskBoard.createMany({
    data: defaultBoards.map((board, index) => ({
      ...board,
      isDefault: true,
      sortOrder: index,
    })),
  });
};

const buildNextTaskCode = async (tx: Prisma.TransactionClient) => {
  const latest = await tx.taskItem.findFirst({
    where: { code: { startsWith: 'TBT-' } },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });
  const latestSeries = latest?.code ? Number.parseInt(latest.code.slice(4), 10) : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
  return `TBT-${nextSeries}`;
};

const findNextSortOrder = async (boardId: string) => {
  const latest = await prisma.taskItem.findFirst({
    where: { boardId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  return (latest?.sortOrder ?? -1) + 1;
};

export const getTaskManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultBoards();
    const query = req.query as GetTaskManagementQuery;
    const search = query.search?.trim();
    const taskWhere: Prisma.TaskItemWhereInput = {
      priority: query.priority,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { assignee: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const boards = await prisma.taskBoard.findMany({
      include: {
        tasks: {
          where: taskWhere,
          include: taskInclude,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Task board retrieved successfully',
      data: { boards },
    });
  } catch (err) {
    logger.error('Error while getting task board', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createTaskBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as TaskBoardBody;
    const latest = await prisma.taskBoard.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const board = await prisma.taskBoard.create({
      data: {
        title: body.title.trim(),
        color: body.color,
        sortOrder: (latest?.sortOrder ?? -1) + 1,
      },
      include: boardInclude,
    });
    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Board created successfully',
      data: board,
    });
  } catch (err) {
    logger.error('Error while creating task board', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateTaskBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as TaskBoardBody;
    const board = await prisma.taskBoard.update({
      where: { id: String(req.params.boardId) },
      data: { title: body.title.trim(), color: body.color },
      include: boardInclude,
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Board updated successfully',
      data: board,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Board not found' });
      return;
    }
    logger.error('Error while updating task board', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteTaskBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.taskBoard.delete({ where: { id: String(req.params.boardId) } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Board deleted successfully' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Board not found' });
      return;
    }
    logger.error('Error while deleting task board', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateTaskBody;
    const task = await prisma.$transaction(async (tx) => {
      const code = await buildNextTaskCode(tx);
      const latest = await tx.taskItem.findFirst({
        where: { boardId: body.boardId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      return tx.taskItem.create({
        data: {
          code,
          title: body.title.trim(),
          boardId: body.boardId,
          priority: body.priority ?? TaskPriority.MEDIUM,
          dueDate: parseDateOrNull(body.dueDate),
          assigneeId: trimToNull(body.assigneeId),
          sortOrder: (latest?.sortOrder ?? -1) + 1,
        },
        include: taskInclude,
      });
    });
    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Task created successfully',
      data: task,
    });
  } catch (err) {
    logger.error('Error while creating task', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as UpdateTaskBody;
    const task = await prisma.taskItem.update({
      where: { id: String(req.params.taskId) },
      data: {
        title: body.title.trim(),
        boardId: body.boardId,
        priority: body.priority,
        dueDate: parseDateOrNull(body.dueDate),
        assigneeId: trimToNull(body.assigneeId),
        progress: body.progress?.trim() ?? '0/1',
      },
      include: taskInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Task updated successfully', data: task });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
      return;
    }
    logger.error('Error while updating task', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const moveTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as MoveTaskBody;
    const task = await prisma.taskItem.update({
      where: { id: String(req.params.taskId) },
      data: {
        boardId: body.boardId,
        sortOrder: body.sortOrder ?? (await findNextSortOrder(body.boardId)),
      },
      include: taskInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Task moved successfully', data: task });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
      return;
    }
    logger.error('Error while moving task', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.taskItem.delete({ where: { id: String(req.params.taskId) } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Task deleted successfully' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
      return;
    }
    logger.error('Error while deleting task', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
