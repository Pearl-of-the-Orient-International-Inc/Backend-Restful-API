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
exports.getCurrentStudentPortal = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const lms_student_scope_1 = require("./lms-student-scope");
const getCurrentStudentPortal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const student = yield prisma_1.prisma.seminaryApplication.findFirst({
            where: {
                studentId: { not: null },
                OR: [
                    { portalUserId: req.userId },
                    { member: { userId: req.userId } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'No active student record is linked to this account',
            });
            return;
        }
        const lmsScope = yield (0, lms_student_scope_1.getSeminaryStudentLmsScope)(req.userId);
        const [grades, materials, assignments, examinations] = yield Promise.all([
            prisma_1.prisma.seminaryGradeRecord.findMany({
                where: { studentApplicationId: student.id },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma_1.prisma.seminaryStudyMaterial.findMany({
                where: {
                    status: enums_1.SeminaryStudyMaterialStatus.PUBLISHED,
                    subject: { in: lmsScope.subjectNames },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.seminaryAssignment.findMany({
                where: {
                    status: enums_1.SeminaryAssignmentStatus.PUBLISHED,
                    courseId: { in: lmsScope.courseIds },
                },
                orderBy: { dueAt: 'asc' },
            }),
            prisma_1.prisma.seminaryExamination.findMany({
                where: {
                    status: {
                        in: [
                            enums_1.SeminaryExaminationStatus.SCHEDULED,
                            enums_1.SeminaryExaminationStatus.ONGOING,
                            enums_1.SeminaryExaminationStatus.COMPLETED,
                        ],
                    },
                    courseId: { in: lmsScope.courseIds },
                },
                orderBy: { scheduledAt: 'asc' },
            }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Student portal retrieved successfully',
            data: { student, grades, materials, assignments, examinations },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving current student portal', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to retrieve student portal',
        });
    }
});
exports.getCurrentStudentPortal = getCurrentStudentPortal;
