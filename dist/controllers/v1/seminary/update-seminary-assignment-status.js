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
exports.updateSeminaryAssignmentStatus = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const assignment_shared_1 = require("./assignment-shared");
const updateSeminaryAssignmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const body = req.body;
        if (!(yield (0, assignment_shared_1.canManageAssignment)({ assignmentId: id, userId: req.userId, res })))
            return;
        const assignment = yield prisma_1.prisma.seminaryAssignment.update({
            where: { id },
            data: { status: body.status },
        });
        if (assignment.status === enums_1.SeminaryAssignmentStatus.PUBLISHED &&
            assignment.notifyStudents &&
            assignment.courseId) {
            const course = yield prisma_1.prisma.seminaryCourse.findUnique({
                where: { id: assignment.courseId },
                select: { courseName: true, courseCode: true, program: true },
            });
            if (course) {
                yield (0, assignment_shared_1.createAssignmentStudentNotifications)({
                    assignmentId: assignment.id,
                    course,
                    title: assignment.title,
                    subject: assignment.subject,
                });
            }
        }
        else {
            yield (0, assignment_shared_1.removeAssignmentStudentNotifications)(assignment.id);
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Assignment status updated successfully',
            data: (0, assignment_shared_1.toAssignmentResponse)(assignment),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary assignment status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryAssignmentStatus = updateSeminaryAssignmentStatus;
