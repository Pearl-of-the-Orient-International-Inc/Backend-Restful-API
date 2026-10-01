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
exports.createSeminaryGradeRecord = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const assignment_shared_1 = require("./assignment-shared");
const grade_record_shared_1 = require("./grade-record-shared");
const createSeminaryGradeRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const body = req.body;
        const gradeContext = yield (0, assignment_shared_1.getAssignedCourseForSubject)({
            subject: body.subject,
            userId: req.userId,
            res,
        });
        if (!gradeContext)
            return;
        const student = yield prisma_1.prisma.seminaryApplication.findUnique({
            where: { id: body.studentApplicationId },
            select: {
                id: true,
                givenName: true,
                middleName: true,
                programCourse: true,
                programLevel: true,
                studentId: true,
                surname: true,
            },
        });
        if (!(student === null || student === void 0 ? void 0 : student.studentId)) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Student not found',
            });
            return;
        }
        const { course, instructorName, user } = gradeContext;
        const record = yield prisma_1.prisma.seminaryGradeRecord.create({
            data: {
                recordNumber: yield (0, grade_record_shared_1.generateGradeRecordNumber)(),
                studentApplicationId: student.id,
                studentId: student.studentId,
                studentName: (0, grade_record_shared_1.getStudentName)(student) || student.studentId,
                program: (0, grade_record_shared_1.getProgramLabel)(student.programLevel),
                programLevel: student.programLevel,
                subject: body.subject,
                courseId: course.id,
                courseTitle: body.subject,
                courseCode: course.courseCode,
                instructorUserId: user.id,
                instructorName,
                term: body.term,
                finalGrade: body.finalGrade,
                remarks: (_a = body.remarks) !== null && _a !== void 0 ? _a : (0, grade_record_shared_1.buildGradeRemark)(body.finalGrade),
                status: (_b = body.status) !== null && _b !== void 0 ? _b : grade_record_shared_1.defaultGradeStatus,
                notes: body.notes,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Grade record created successfully',
            data: (0, grade_record_shared_1.toGradeRecordResponse)(record),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating seminary grade record', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createSeminaryGradeRecord = createSeminaryGradeRecord;
