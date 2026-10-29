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
exports.updateSeminaryExamination = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const assignment_shared_1 = require("./assignment-shared");
const examination_shared_1 = require("./examination-shared");
const updateSeminaryExamination = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = req.params.id;
        const body = req.body;
        if (!(yield (0, examination_shared_1.canManageExamination)({ examinationId: id, userId: req.userId, res })))
            return;
        const examinationContext = yield (0, assignment_shared_1.getAssignedCourseForSubject)({
            subject: body.subject,
            userId: req.userId,
            res,
        });
        if (!examinationContext)
            return;
        const { course, user, instructorName } = examinationContext;
        const examination = yield prisma_1.prisma.seminaryExamination.update({
            where: { id },
            data: {
                title: body.title,
                coverage: body.coverage,
                subject: body.subject,
                courseId: course.id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                instructorUserId: user.id,
                instructorName,
                examType: body.examType,
                scheduledAt: new Date(body.scheduledAt),
                durationMinutes: Number(body.durationMinutes),
                status: (_a = body.status) !== null && _a !== void 0 ? _a : 'DRAFT',
                totalPoints: Number(body.totalPoints),
                passingScore: Number(body.passingScore),
                instructions: body.instructions,
                randomizeQuestions: (_b = body.randomizeQuestions) !== null && _b !== void 0 ? _b : false,
                showResults: (_c = body.showResults) !== null && _c !== void 0 ? _c : true,
                questions: body.questions,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Examination updated successfully',
            data: (0, examination_shared_1.toExaminationResponse)(examination),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary examination', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryExamination = updateSeminaryExamination;
