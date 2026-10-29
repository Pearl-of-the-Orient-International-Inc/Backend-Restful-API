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
exports.bulkEncodeSeminaryGrades = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const grade_record_shared_1 = require("./grade-record-shared");
const percentage = (earned, total) => Math.max(0, Math.min(100, (earned / total) * 100));
const rangeFor = (range) => {
    var _a, _b, _c, _d, _e, _f;
    const values = (_b = (_a = range.match(/\d+(?:\.\d+)?/g)) === null || _a === void 0 ? void 0 : _a.map(Number)) !== null && _b !== void 0 ? _b : [];
    return range.toLowerCase().includes('below')
        ? { min: 0, max: ((_c = values[0]) !== null && _c !== void 0 ? _c : 75) - 0.01 }
        : { min: (_d = values[0]) !== null && _d !== void 0 ? _d : 0, max: (_f = (_e = values[1]) !== null && _e !== void 0 ? _e : values[0]) !== null && _f !== void 0 ? _f : 100 };
};
const bulkEncodeSeminaryGrades = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const body = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
            return;
        }
        const [course, user, configuration, students] = yield Promise.all([
            prisma_1.prisma.seminaryCourse.findFirst({
                where: { status: enums_1.SeminaryCourseStatus.ACTIVE, subjects: { array_contains: [{ subjectName: body.subject }] } },
            }),
            prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, seminaryInstructor: { select: { name: true } } } }),
            prisma_1.prisma.seminaryGradeConfiguration.findUnique({ where: { id: 'default' } }),
            prisma_1.prisma.seminaryApplication.findMany({ where: { id: { in: body.entries.map((entry) => entry.studentApplicationId) } }, select: { id: true, studentId: true, givenName: true, middleName: true, surname: true, programLevel: true } }),
        ]);
        if (!course || !user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Subject or instructor not found' });
            return;
        }
        const studentById = new Map(students.filter((student) => student.studentId).map((student) => [student.id, student]));
        if (studentById.size !== body.entries.length) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'One or more students were not found' });
            return;
        }
        const weights = ((_a = configuration === null || configuration === void 0 ? void 0 : configuration.criteriaWeights) !== null && _a !== void 0 ? _a : { attendance: 20, coursework: 25, character: 30, exam: 25 });
        const scale = ((_b = configuration === null || configuration === void 0 ? void 0 : configuration.gradeScale) !== null && _b !== void 0 ? _b : []);
        const passingEquivalent = Number((_c = configuration === null || configuration === void 0 ? void 0 : configuration.passingEquivalent) !== null && _c !== void 0 ? _c : '2.50');
        const instructorName = (_e = (_d = user.seminaryInstructor) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : user.name;
        const records = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            return Promise.all(body.entries.map((entry) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                const student = studentById.get(entry.studentApplicationId);
                const weightedPercentage = (percentage(entry.attendanceEarned, entry.attendanceTotal) * weights.attendance + percentage(entry.courseworkEarned, entry.courseworkTotal) * weights.coursework + percentage(entry.characterEarned, entry.characterTotal) * weights.character + percentage(entry.examEarned, entry.examTotal) * weights.exam) / 100;
                const finalGrade = (_b = (_a = scale.find((row) => { const range = rangeFor(row.percentageRange); return weightedPercentage >= range.min && weightedPercentage <= range.max; })) === null || _a === void 0 ? void 0 : _a.equivalent) !== null && _b !== void 0 ? _b : (weightedPercentage >= 75 ? '3.00' : '5.00');
                const gradeNumber = Number(finalGrade);
                const remarks = gradeNumber <= passingEquivalent ? enums_1.SeminaryGradeRecordRemark.PASSED : gradeNumber < 5 ? enums_1.SeminaryGradeRecordRemark.CONDITIONAL : enums_1.SeminaryGradeRecordRemark.FAILED;
                const data = {
                    studentId: student.studentId, studentName: (0, grade_record_shared_1.getStudentName)(student) || student.studentId, program: (0, grade_record_shared_1.getProgramLabel)(student.programLevel), programLevel: student.programLevel,
                    subject: body.subject, courseId: course.id, courseTitle: body.subject, courseCode: course.courseCode, instructorUserId: user.id, instructorName, term: 'Final',
                    attendanceEarned: entry.attendanceEarned, attendanceTotal: entry.attendanceTotal, courseworkEarned: entry.courseworkEarned, courseworkTotal: entry.courseworkTotal, characterEarned: entry.characterEarned, characterTotal: entry.characterTotal, examEarned: entry.examEarned, examTotal: entry.examTotal, weightedPercentage,
                    finalGrade, remarks, status: enums_1.SeminaryGradeRecordStatus.PENDING_REVIEW, notes: `Encoded from raw points using the active grade configuration.`,
                };
                const existing = yield tx.seminaryGradeRecord.findFirst({ where: { studentApplicationId: student.id, subject: body.subject, term: 'Final' }, select: { id: true } });
                return existing ? tx.seminaryGradeRecord.update({ where: { id: existing.id }, data }) : tx.seminaryGradeRecord.create({ data: Object.assign(Object.assign({}, data), { recordNumber: yield (0, grade_record_shared_1.generateGradeRecordNumber)(), studentApplicationId: student.id }) });
            })));
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Grades encoded successfully', data: records });
    }
    catch (err) {
        winston_1.logger.error('Error while bulk encoding seminary grades', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to encode grades' });
    }
});
exports.bulkEncodeSeminaryGrades = bulkEncodeSeminaryGrades;
