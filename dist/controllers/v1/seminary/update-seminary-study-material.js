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
exports.updateSeminaryStudyMaterial = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const toCourseSubjects = (value) => Array.isArray(value) ? value : [];
const updateSeminaryStudyMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = req.params.id;
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const body = req.body;
        const [user, existingMaterial] = yield Promise.all([
            prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    role: true,
                    seminaryInstructor: {
                        select: { name: true },
                    },
                },
            }),
            prisma_1.prisma.seminaryStudyMaterial.findUnique({
                where: { id },
                select: { id: true },
            }),
        ]);
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        if (!existingMaterial) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Study material not found',
            });
            return;
        }
        if (user.role === enums_1.UserType.INSTRUCTOR) {
            const instructorName = (_b = (_a = user.seminaryInstructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : user.name;
            const courses = yield prisma_1.prisma.seminaryCourse.findMany({
                where: { status: enums_1.SeminaryCourseStatus.ACTIVE },
                select: { subjects: true },
            });
            const hasAssignedSubject = courses
                .flatMap((course) => toCourseSubjects(course.subjects))
                .some((subject) => {
                var _a;
                return subject.subjectName === body.subject &&
                    ((_a = subject.professor) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === instructorName.toLowerCase();
            });
            if (!hasAssignedSubject) {
                res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                    code: 'FORBIDDEN',
                    message: 'Subject is not assigned to this instructor',
                });
                return;
            }
        }
        const material = yield prisma_1.prisma.seminaryStudyMaterial.update({
            where: { id },
            data: {
                title: body.title,
                subtitle: body.subtitle,
                subject: body.subject,
                type: body.type,
                status: (_c = body.status) !== null && _c !== void 0 ? _c : enums_1.SeminaryStudyMaterialStatus.DRAFT,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Study material updated successfully',
            data: material,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary study material', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryStudyMaterial = updateSeminaryStudyMaterial;
