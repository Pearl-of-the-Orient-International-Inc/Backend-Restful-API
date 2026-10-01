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
exports.getPublicEvents = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const event_shared_1 = require("./event-shared");
const getPublicEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const category = req.query.category;
        const type = req.query.type;
        const sortBy = req.query.sortBy || 'startsAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;
        const orderByFieldMap = {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
            startsAt: 'startsAt',
            name: 'name',
        };
        const orderByField = orderByFieldMap[sortBy] || 'startsAt';
        const where = Object.assign(Object.assign(Object.assign({ visibility: enums_1.EventVisibility.PUBLIC, status: {
                not: enums_1.EventStatus.CANCELLED,
            } }, (search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { organizer: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {})), (category ? { category } : {})), (type ? { type } : {}));
        const [totalCount, events] = yield Promise.all([
            prisma_1.prisma.event.count({ where }),
            prisma_1.prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [orderByField]: sortOrder,
                },
                include: event_shared_1.eventTaggedMemberInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        winston_1.logger.info('Public events retrieved successfully', {
            count: events.length,
            page,
            totalCount,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public events retrieved successfully',
            data: events.map(event_shared_1.serializeEvent),
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
        winston_1.logger.error('Error during public events retrieval', err);
    }
});
exports.getPublicEvents = getPublicEvents;
