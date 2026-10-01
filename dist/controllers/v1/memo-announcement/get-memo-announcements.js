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
exports.getMemoAnnouncements = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const getMemoAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 1000);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const category = req.query.category;
        const status = req.query.status;
        const sortBy = req.query.sortBy || 'updatedAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;
        const orderByFieldMap = {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
            publishedAt: 'publishedAt',
            referenceNumber: 'referenceNumber',
            title: 'title',
        };
        const where = Object.assign(Object.assign(Object.assign({}, (search
            ? {
                OR: [
                    { referenceNumber: { contains: search, mode: 'insensitive' } },
                    { title: { contains: search, mode: 'insensitive' } },
                    { summary: { contains: search, mode: 'insensitive' } },
                    { recipients: { some: { name: { contains: search, mode: 'insensitive' } } } },
                    { recipients: { some: { email: { contains: search, mode: 'insensitive' } } } },
                ],
            }
            : {})), (category ? { category } : {})), (status ? { status } : {}));
        const [totalCount, memos] = yield Promise.all([
            prisma_1.prisma.memoAnnouncement.count({ where }),
            prisma_1.prisma.memoAnnouncement.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [orderByFieldMap[sortBy] || 'updatedAt']: sortOrder,
                },
                include: memo_announcement_shared_1.memoInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Memo announcements retrieved successfully',
            data: memos.map(memo_announcement_shared_1.serializeMemoAnnouncement),
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
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during memo announcements retrieval', err);
    }
});
exports.getMemoAnnouncements = getMemoAnnouncements;
