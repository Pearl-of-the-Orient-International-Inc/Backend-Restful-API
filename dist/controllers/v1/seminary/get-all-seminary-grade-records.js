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
exports.getAllSeminaryGradeRecords = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const grade_record_shared_1 = require("./grade-record-shared");
const getAllSeminaryGradeRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const userWhere = yield (0, grade_record_shared_1.getGradeRecordWhereForUser)(req.userId);
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, userWhere), (query.program ? { program: query.program } : {})), (query.status ? { status: query.status } : {})), (query.term ? { term: query.term } : {})), (search
            ? {
                OR: [
                    { recordNumber: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                    { studentName: { contains: search, mode: 'insensitive' } },
                    { courseTitle: { contains: search, mode: 'insensitive' } },
                    { courseCode: { contains: search, mode: 'insensitive' } },
                    { instructorName: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [records, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryGradeRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.seminaryGradeRecord.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Grade records retrieved successfully',
            data: records.map(grade_record_shared_1.toGradeRecordResponse),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary grade records', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryGradeRecords = getAllSeminaryGradeRecords;
