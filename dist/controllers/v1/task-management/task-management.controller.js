"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.moveTask = exports.updateTask = exports.createTask = exports.deleteTaskBoard = exports.updateTaskBoard = exports.createTaskBoard = exports.getTaskManagement = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
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
};
const boardInclude = {
    tasks: {
        include: taskInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    },
};
const defaultBoards = [
    { title: 'To Do', color: '#475569' },
    { title: 'Drafting', color: '#1d4ed8' },
    { title: 'In Review', color: '#4338ca' },
    { title: 'Done', color: '#047857' },
];
const parseDateOrNull = (value) => (value ? new Date(value) : null);
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const ensureDefaultBoards = () => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield prisma_1.prisma.taskBoard.count();
    if (count > 0)
        return;
    yield prisma_1.prisma.taskBoard.createMany({
        data: defaultBoards.map((board, index) => (Object.assign(Object.assign({}, board), { isDefault: true, sortOrder: index }))),
    });
});
const buildNextTaskCode = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    const latest = yield tx.taskItem.findFirst({
        where: { code: { startsWith: 'TBT-' } },
        orderBy: { createdAt: 'desc' },
        select: { code: true },
    });
    const latestSeries = (latest === null || latest === void 0 ? void 0 : latest.code) ? Number.parseInt(latest.code.slice(4), 10) : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `TBT-${nextSeries}`;
});
const findNextSortOrder = (boardId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const latest = yield prisma_1.prisma.taskItem.findFirst({
        where: { boardId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
    });
    return ((_a = latest === null || latest === void 0 ? void 0 : latest.sortOrder) !== null && _a !== void 0 ? _a : -1) + 1;
});
const getTaskManagement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield ensureDefaultBoards();
        const query = req.query;
        const search = (_a = query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const taskWhere = Object.assign({ priority: query.priority }, (search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                    { assignee: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {}));
        const boards = yield prisma_1.prisma.taskBoard.findMany({
            include: {
                tasks: {
                    where: taskWhere,
                    include: taskInclude,
                    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Task board retrieved successfully',
            data: { boards },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting task board', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getTaskManagement = getTaskManagement;
const createTaskBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        const latest = yield prisma_1.prisma.taskBoard.findFirst({
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });
        const board = yield prisma_1.prisma.taskBoard.create({
            data: {
                title: body.title.trim(),
                color: body.color,
                sortOrder: ((_a = latest === null || latest === void 0 ? void 0 : latest.sortOrder) !== null && _a !== void 0 ? _a : -1) + 1,
            },
            include: boardInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Board created successfully',
            data: board,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating task board', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createTaskBoard = createTaskBoard;
const updateTaskBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const board = yield prisma_1.prisma.taskBoard.update({
            where: { id: String(req.params.boardId) },
            data: { title: body.title.trim(), color: body.color },
            include: boardInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Board updated successfully',
            data: board,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Board not found' });
            return;
        }
        winston_1.logger.error('Error while updating task board', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateTaskBoard = updateTaskBoard;
const deleteTaskBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.taskBoard.delete({ where: { id: String(req.params.boardId) } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Board deleted successfully' });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Board not found' });
            return;
        }
        winston_1.logger.error('Error while deleting task board', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteTaskBoard = deleteTaskBoard;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const task = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const code = yield buildNextTaskCode(tx);
            const latest = yield tx.taskItem.findFirst({
                where: { boardId: body.boardId },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            return tx.taskItem.create({
                data: {
                    code,
                    title: body.title.trim(),
                    boardId: body.boardId,
                    priority: (_a = body.priority) !== null && _a !== void 0 ? _a : enums_1.TaskPriority.MEDIUM,
                    dueDate: parseDateOrNull(body.dueDate),
                    assigneeId: trimToNull(body.assigneeId),
                    sortOrder: ((_b = latest === null || latest === void 0 ? void 0 : latest.sortOrder) !== null && _b !== void 0 ? _b : -1) + 1,
                },
                include: taskInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Task created successfully',
            data: task,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating task', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const body = req.body;
        const task = yield prisma_1.prisma.taskItem.update({
            where: { id: String(req.params.taskId) },
            data: {
                title: body.title.trim(),
                boardId: body.boardId,
                priority: body.priority,
                dueDate: parseDateOrNull(body.dueDate),
                assigneeId: trimToNull(body.assigneeId),
                progress: (_b = (_a = body.progress) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '0/1',
            },
            include: taskInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Task updated successfully', data: task });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
            return;
        }
        winston_1.logger.error('Error while updating task', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateTask = updateTask;
const moveTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        const task = yield prisma_1.prisma.taskItem.update({
            where: { id: String(req.params.taskId) },
            data: {
                boardId: body.boardId,
                sortOrder: (_a = body.sortOrder) !== null && _a !== void 0 ? _a : (yield findNextSortOrder(body.boardId)),
            },
            include: taskInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Task moved successfully', data: task });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
            return;
        }
        winston_1.logger.error('Error while moving task', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.moveTask = moveTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.taskItem.delete({ where: { id: String(req.params.taskId) } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Task deleted successfully' });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Task not found' });
            return;
        }
        winston_1.logger.error('Error while deleting task', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteTask = deleteTask;
