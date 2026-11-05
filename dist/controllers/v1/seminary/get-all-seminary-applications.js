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
exports.getAllSeminaryApplications = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const seminary_shared_1 = require("./seminary-shared");
const getAllSeminaryApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const hasLimit = typeof query.limit === 'string';
        const limit = hasLimit
            ? Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100)
            : undefined;
        const skip = limit ? (page - 1) * limit : undefined;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign({ status: query.status }, (search
            ? {
                OR: [
                    { surname: { contains: search, mode: 'insensitive' } },
                    { givenName: { contains: search, mode: 'insensitive' } },
                    { emailAddress: { contains: search, mode: 'insensitive' } },
                    { programCourse: { contains: search, mode: 'insensitive' } },
                    {
                        member: {
                            user: {
                                email: { contains: search, mode: 'insensitive' },
                            },
                        },
                    },
                ],
            }
            : {}));
        const [applications, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryApplication.findMany({
                where,
                include: seminary_shared_1.seminaryApplicationInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.seminaryApplication.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary applications retrieved successfully',
            data: applications,
            meta: {
                page,
                limit: limit !== null && limit !== void 0 ? limit : total,
                total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary applications', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryApplications = getAllSeminaryApplications;
