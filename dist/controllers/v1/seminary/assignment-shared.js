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
exports.defaultAssignmentStatus = exports.getAssignmentWhereForUser = exports.createAssignmentStudentNotifications = exports.getAssignedCourseForSubject = exports.toAssignmentResponse = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const toAssignmentResponse = (assignment) => (Object.assign(Object.assign({}, assignment), { totalMarks: String(assignment.totalMarks) }));
exports.toAssignmentResponse = toAssignmentResponse;
const toCourseSubjects = (value) => Array.isArray(value) ? value : [];
const getAssignedCourseForSubject = (_a) => __awaiter(void 0, [_a], void 0, function* ({ subject, userId, res, }) {
    var _b, _c;
    if (!userId) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
        return null;
    }
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            role: true,
            seminaryInstructor: {
                select: { name: true },
            },
        },
    });
    if (!user) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'User not found',
        });
        return null;
    }
    const courses = yield prisma_1.prisma.seminaryCourse.findMany({
        where: { status: enums_1.SeminaryCourseStatus.ACTIVE },
    });
    const instructorName = (_c = (_b = user.seminaryInstructor) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : user.name;
    const course = courses.find((candidate) => toCourseSubjects(candidate.subjects).some((courseSubject) => {
        var _a;
        return courseSubject.subjectName === subject &&
            (user.role !== enums_1.UserType.INSTRUCTOR ||
                ((_a = courseSubject.professor) === null || _a === void 0 ? void 0 : _a.toLowerCase()) ===
                    instructorName.toLowerCase());
    }));
    if (!course) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
            code: 'FORBIDDEN',
            message: 'Subject is not assigned to this instructor',
        });
        return null;
    }
    return { course, user, instructorName };
});
exports.getAssignedCourseForSubject = getAssignedCourseForSubject;
const createAssignmentStudentNotifications = (_a) => __awaiter(void 0, [_a], void 0, function* ({ assignmentId, course, title, subject, }) {
    const students = yield prisma_1.prisma.seminaryApplication.findMany({
        where: {
            studentId: { not: null },
            studentStatus: enums_1.SeminaryStudentStatus.ACTIVE,
            programLevel: course.program,
            OR: [
                { programCourse: null },
                { programCourse: course.courseName },
                { programCourse: course.courseCode },
            ],
        },
        select: {
            id: true,
            studentId: true,
            surname: true,
            givenName: true,
            emailAddress: true,
        },
    });
    if (students.length === 0)
        return;
    yield prisma_1.prisma.seminaryStudentNotification.createMany({
        data: students.map((student) => ({
            assignmentId,
            studentApplicationId: student.id,
            studentId: student.studentId,
            studentName: [student.givenName, student.surname].filter(Boolean).join(' ') ||
                student.studentId ||
                'Student',
            studentEmail: student.emailAddress,
            title: `New assignment: ${title}`,
            message: `A new assignment for ${subject} has been posted.`,
            type: enums_1.SeminaryStudentNotificationType.ASSIGNMENT,
        })),
    });
});
exports.createAssignmentStudentNotifications = createAssignmentStudentNotifications;
const getAssignmentWhereForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return {};
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if ((user === null || user === void 0 ? void 0 : user.role) !== enums_1.UserType.INSTRUCTOR)
        return {};
    return { instructorUserId: userId };
});
exports.getAssignmentWhereForUser = getAssignmentWhereForUser;
exports.defaultAssignmentStatus = enums_1.SeminaryAssignmentStatus.DRAFT;
