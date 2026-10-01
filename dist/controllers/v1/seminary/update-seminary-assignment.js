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
exports.updateSeminaryAssignment = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const assignment_shared_1 = require("./assignment-shared");
const updateSeminaryAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = req.params.id;
        const body = req.body;
        const existingAssignment = yield prisma_1.prisma.seminaryAssignment.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingAssignment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Assignment not found',
            });
            return;
        }
        const assignmentContext = yield (0, assignment_shared_1.getAssignedCourseForSubject)({
            subject: body.subject,
            userId: req.userId,
            res,
        });
        if (!assignmentContext)
            return;
        const { course, user, instructorName } = assignmentContext;
        const allowLateSubmission = (_a = body.allowLateSubmission) !== null && _a !== void 0 ? _a : true;
        const assignment = yield prisma_1.prisma.seminaryAssignment.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                subject: body.subject,
                courseId: course.id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                instructorUserId: user.id,
                instructorName,
                assignmentType: body.assignmentType,
                dueAt: new Date(body.dueAt),
                status: (_b = body.status) !== null && _b !== void 0 ? _b : assignment_shared_1.defaultAssignmentStatus,
                totalMarks: Number(body.totalMarks),
                additionalInstructions: body.additionalInstructions,
                allowLateSubmission,
                lateSubmissionDeadline: allowLateSubmission && body.lateSubmissionDeadline
                    ? new Date(body.lateSubmissionDeadline)
                    : null,
                notifyStudents: (_c = body.notifyStudents) !== null && _c !== void 0 ? _c : true,
                attachmentLabel: body.attachmentLabel,
            },
        });
        if (assignment.notifyStudents) {
            try {
                yield (0, assignment_shared_1.createAssignmentStudentNotifications)({
                    assignmentId: assignment.id,
                    course,
                    title: assignment.title,
                    subject: assignment.subject,
                });
            }
            catch (err) {
                winston_1.logger.warn('Assignment notification creation failed', {
                    assignmentId: assignment.id,
                    err,
                });
            }
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Assignment updated successfully',
            data: (0, assignment_shared_1.toAssignmentResponse)(assignment),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary assignment', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryAssignment = updateSeminaryAssignment;
