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
exports.getAllSeminaryAcademicYears = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getAllSeminaryAcademicYears = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign(Object.assign(Object.assign({}, (query.session ? { session: query.session } : {})), (query.status ? { status: query.status } : {})), (search
            ? { academicYear: { contains: search, mode: 'insensitive' } }
            : {}));
        const [academicYears, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryAcademicYear.findMany({
                where,
                orderBy: [{ startDate: 'desc' }, { sortOrder: 'asc' }],
                skip,
                take: limit,
            }),
            prisma_1.prisma.seminaryAcademicYear.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary academic years retrieved successfully',
            data: academicYears,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary academic years', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryAcademicYears = getAllSeminaryAcademicYears;
