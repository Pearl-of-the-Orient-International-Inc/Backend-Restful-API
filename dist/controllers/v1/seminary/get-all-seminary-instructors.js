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
exports.getAllSeminaryInstructors = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const instructor_shared_1 = require("./instructor-shared");
const getAllSeminaryInstructors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = query.limit
            ? Math.min(Math.max(Number.parseInt(query.limit, 10), 1), 500)
            : undefined;
        const skip = limit ? (page - 1) * limit : undefined;
        const search = (_b = query.search) === null || _b === void 0 ? void 0 : _b.trim();
        const where = Object.assign(Object.assign(Object.assign({}, (query.status ? { status: query.status } : {})), (query.teachingProgram
            ? { teachingPrograms: { has: query.teachingProgram } }
            : {})), (search
            ? {
                OR: [
                    { facultyId: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { professionalTitle: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [instructors, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryInstructor.findMany(Object.assign(Object.assign({ where, orderBy: [{ createdAt: 'desc' }, { name: 'asc' }] }, (skip === undefined ? {} : { skip })), (limit === undefined ? {} : { take: limit }))),
            prisma_1.prisma.seminaryInstructor.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary instructors retrieved successfully',
            data: instructors.map(instructor_shared_1.toInstructorResponse),
            meta: {
                page,
                limit: limit !== null && limit !== void 0 ? limit : total,
                total,
                totalPages: limit ? Math.ceil(total / limit) : 1,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary instructors', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryInstructors = getAllSeminaryInstructors;
