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
exports.getAllSeminaryStudyMaterials = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const toCourseSubjects = (value) => Array.isArray(value) ? value : [];
const getAllSeminaryStudyMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const user = req.userId
            ? yield prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: {
                    name: true,
                    role: true,
                    seminaryInstructor: {
                        select: {
                            name: true,
                        },
                    },
                },
            })
            : null;
        const instructorSubjects = (user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.INSTRUCTOR
            ? (yield prisma_1.prisma.seminaryCourse.findMany({
                where: { status: enums_1.SeminaryCourseStatus.ACTIVE },
                select: { subjects: true },
            }))
                .flatMap((course) => toCourseSubjects(course.subjects))
                .filter((subject) => {
                var _a, _b, _c;
                return ((_a = subject.professor) === null || _a === void 0 ? void 0 : _a.toLowerCase()) ===
                    ((_c = (_b = user.seminaryInstructor) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : user.name).toLowerCase();
            })
                .map((subject) => subject.subjectName)
                .filter((subject) => Boolean(subject))
            : null;
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (instructorSubjects
            ? { subject: { in: instructorSubjects } }
            : query.subject
                ? { subject: query.subject }
                : {})), (instructorSubjects && query.subject
            ? { AND: [{ subject: query.subject }] }
            : {})), (query.type ? { type: query.type } : {})), (query.status ? { status: query.status } : {})), (search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { subtitle: { contains: search, mode: 'insensitive' } },
                    { subject: { contains: search, mode: 'insensitive' } },
                    { fileName: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [materials, total] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.seminaryStudyMaterial.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.seminaryStudyMaterial.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Study materials retrieved successfully',
            data: materials,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary study materials', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryStudyMaterials = getAllSeminaryStudyMaterials;
