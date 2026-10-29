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
exports.canManageExamination = exports.getExaminationWhereForUser = exports.toExaminationResponse = void 0;
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const http_codes_1 = require("@/common/http-codes");
const lms_student_scope_1 = require("./lms-student-scope");
const toExaminationResponse = (examination) => (Object.assign(Object.assign({}, examination), { durationMinutes: String(examination.durationMinutes), passingScore: String(examination.passingScore), questions: Array.isArray(examination.questions) ? examination.questions : [], totalPoints: String(examination.totalPoints) }));
exports.toExaminationResponse = toExaminationResponse;
const getExaminationWhereForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return {};
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if ((user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.MEMBER) {
        const scope = yield (0, lms_student_scope_1.getSeminaryStudentLmsScope)(userId);
        return {
            status: {
                in: [
                    enums_1.SeminaryExaminationStatus.SCHEDULED,
                    enums_1.SeminaryExaminationStatus.ONGOING,
                    enums_1.SeminaryExaminationStatus.COMPLETED,
                ],
            },
            courseId: { in: scope.courseIds },
        };
    }
    if ((user === null || user === void 0 ? void 0 : user.role) !== enums_1.UserType.INSTRUCTOR)
        return {};
    return { instructorUserId: userId };
});
exports.getExaminationWhereForUser = getExaminationWhereForUser;
const canManageExamination = (_a) => __awaiter(void 0, [_a], void 0, function* ({ examinationId, userId, res, }) {
    if (!userId) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
        return false;
    }
    const [user, examination] = yield prisma_1.prisma.$transaction([
        prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
        prisma_1.prisma.seminaryExamination.findUnique({
            where: { id: examinationId },
            select: { instructorUserId: true },
        }),
    ]);
    if (!examination) {
        res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
            code: 'NOT_FOUND',
            message: 'Examination not found',
        });
        return false;
    }
    if (!user || (user.role === enums_1.UserType.INSTRUCTOR && examination.instructorUserId !== userId)) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
            code: 'FORBIDDEN',
            message: 'You can manage only examinations assigned to you',
        });
        return false;
    }
    return true;
});
exports.canManageExamination = canManageExamination;
