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
exports.restoreBulletinEntry = exports.archiveBulletinEntry = exports.unpublishBulletinEntry = exports.publishBulletinEntry = exports.updateBulletinEntry = exports.createBulletinEntry = exports.getPublicBulletinEntry = exports.getPublicBulletinEntries = exports.getBulletinEntries = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const bulletinEntryInclude = {
    authorUser: {
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
        },
    },
};
const trimToNull = (value) => (value === null || value === void 0 ? void 0 : value.trim()) || null;
const promoteScheduledEntries = () => prisma_1.prisma.bulletinEntry.updateMany({
    where: {
        status: enums_1.BulletinEntryStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
    },
    data: {
        status: enums_1.BulletinEntryStatus.PUBLISHED,
        publicationDate: new Date(),
    },
});
const buildWriteData = (body) => {
    var _a;
    const status = (_a = body.status) !== null && _a !== void 0 ? _a : enums_1.BulletinEntryStatus.DRAFT;
    return {
        title: body.title.trim(),
        content: body.content.trim(),
        type: body.type,
        status,
        publicationDate: status === enums_1.BulletinEntryStatus.PUBLISHED
            ? body.publicationDate
                ? new Date(body.publicationDate)
                : new Date()
            : body.publicationDate
                ? new Date(body.publicationDate)
                : null,
        scheduledAt: status === enums_1.BulletinEntryStatus.SCHEDULED && body.scheduledAt
            ? new Date(body.scheduledAt)
            : null,
        authorName: trimToNull(body.authorName),
        issuingOffice: trimToNull(body.issuingOffice),
        featuredImageUrl: trimToNull(body.featuredImageUrl),
        featuredImageFileName: trimToNull(body.featuredImageFileName),
        attachmentUrl: trimToNull(body.attachmentUrl),
        attachmentFileName: trimToNull(body.attachmentFileName),
        attachmentMimeType: trimToNull(body.attachmentMimeType),
    };
};
const getId = (req) => {
    const id = req.params.id;
    return typeof id === 'string' ? id : null;
};
const getBulletinEntries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        yield promoteScheduledEntries();
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const type = req.query.type;
        const status = req.query.status;
        const sortBy = String((_b = req.query.sortBy) !== null && _b !== void 0 ? _b : 'updatedAt');
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const allowedSortFields = new Set([
            'createdAt',
            'updatedAt',
            'publicationDate',
            'scheduledAt',
            'title',
        ]);
        const orderField = allowedSortFields.has(sortBy) ? sortBy : 'updatedAt';
        const where = Object.assign(Object.assign(Object.assign({}, (search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                    {
                        issuingOffice: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ],
            }
            : {})), (type ? { type: type } : {})), (status ? { status } : {}));
        const [totalCount, entries] = yield Promise.all([
            prisma_1.prisma.bulletinEntry.count({ where }),
            prisma_1.prisma.bulletinEntry.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [orderField]: sortOrder },
                include: bulletinEntryInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Bulletin entries retrieved successfully',
            data: entries,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving bulletin entries', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getBulletinEntries = getBulletinEntries;
const getPublicBulletinEntries = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield promoteScheduledEntries();
        const entries = yield prisma_1.prisma.bulletinEntry.findMany({
            where: {
                status: enums_1.BulletinEntryStatus.PUBLISHED,
                publicationDate: { lte: new Date() },
            },
            orderBy: { publicationDate: 'desc' },
            include: bulletinEntryInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Published bulletin entries retrieved successfully',
            data: entries,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public bulletin entries', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicBulletinEntries = getPublicBulletinEntries;
const getPublicBulletinEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield promoteScheduledEntries();
        const id = getId(req);
        if (!id) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid bulletin entry ID is required',
            });
            return;
        }
        const entry = yield prisma_1.prisma.bulletinEntry.findFirst({
            where: {
                id,
                status: enums_1.BulletinEntryStatus.PUBLISHED,
                publicationDate: { lte: new Date() },
            },
            include: bulletinEntryInclude,
        });
        if (!entry) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Published bulletin entry not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Published bulletin entry retrieved successfully',
            data: entry,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public bulletin entry', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicBulletinEntry = getPublicBulletinEntry;
const createBulletinEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const entry = yield prisma_1.prisma.bulletinEntry.create({
            data: Object.assign(Object.assign({}, buildWriteData(body)), { authorUserId: req.userId }),
            include: bulletinEntryInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Bulletin entry created successfully',
            data: entry,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating bulletin entry', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createBulletinEntry = createBulletinEntry;
const updateBulletinEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getId(req);
        if (!id) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid bulletin entry ID is required',
            });
            return;
        }
        const body = req.body;
        const entry = yield prisma_1.prisma.bulletinEntry.update({
            where: { id },
            data: buildWriteData(body),
            include: bulletinEntryInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Bulletin entry updated successfully',
            data: entry,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Bulletin entry not found',
            });
            return;
        }
        winston_1.logger.error('Error while updating bulletin entry', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateBulletinEntry = updateBulletinEntry;
const updateStatus = (req, res, status, message) => __awaiter(void 0, void 0, void 0, function* () {
    const id = getId(req);
    if (!id) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
            code: 'BAD_REQUEST',
            message: 'Valid bulletin entry ID is required',
        });
        return;
    }
    try {
        const entry = yield prisma_1.prisma.bulletinEntry.update({
            where: { id },
            data: Object.assign(Object.assign({ status }, (status === enums_1.BulletinEntryStatus.PUBLISHED
                ? { publicationDate: new Date(), scheduledAt: null }
                : {})), (status === enums_1.BulletinEntryStatus.UNPUBLISHED ||
                status === enums_1.BulletinEntryStatus.ARCHIVED ||
                status === enums_1.BulletinEntryStatus.DRAFT
                ? { scheduledAt: null }
                : {})),
            include: bulletinEntryInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message, data: entry });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Bulletin entry not found',
            });
            return;
        }
        winston_1.logger.error(`Error while changing bulletin entry status to ${status}`, {
            err,
        });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
const publishBulletinEntry = (req, res) => updateStatus(req, res, enums_1.BulletinEntryStatus.PUBLISHED, 'Bulletin entry published successfully');
exports.publishBulletinEntry = publishBulletinEntry;
const unpublishBulletinEntry = (req, res) => updateStatus(req, res, enums_1.BulletinEntryStatus.UNPUBLISHED, 'Bulletin entry unpublished successfully');
exports.unpublishBulletinEntry = unpublishBulletinEntry;
const archiveBulletinEntry = (req, res) => updateStatus(req, res, enums_1.BulletinEntryStatus.ARCHIVED, 'Bulletin entry archived successfully');
exports.archiveBulletinEntry = archiveBulletinEntry;
const restoreBulletinEntry = (req, res) => updateStatus(req, res, enums_1.BulletinEntryStatus.DRAFT, 'Bulletin entry restored as a draft');
exports.restoreBulletinEntry = restoreBulletinEntry;
