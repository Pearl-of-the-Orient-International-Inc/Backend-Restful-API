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
exports.getSeminaryStudentLmsScope = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const toCourseSubjects = (value) => Array.isArray(value) ? value : [];
const getSeminaryStudentLmsScope = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield prisma_1.prisma.seminaryApplication.findFirst({
        where: {
            studentId: { not: null },
            studentStatus: enums_1.SeminaryStudentStatus.ACTIVE,
            OR: [{ portalUserId: userId }, { member: { userId } }],
        },
        orderBy: { updatedAt: 'desc' },
        select: { programLevel: true, programCourse: true },
    });
    if (!(student === null || student === void 0 ? void 0 : student.programLevel)) {
        return { courseIds: [], subjectNames: [] };
    }
    const courses = yield prisma_1.prisma.seminaryCourse.findMany({
        where: Object.assign({ status: enums_1.SeminaryCourseStatus.ACTIVE, program: student.programLevel }, (student.programCourse
            ? {
                OR: [
                    { courseName: student.programCourse },
                    { courseCode: student.programCourse },
                ],
            }
            : {})),
        select: { id: true, subjects: true },
    });
    return {
        courseIds: courses.map((course) => course.id),
        subjectNames: Array.from(new Set(courses
            .flatMap((course) => toCourseSubjects(course.subjects))
            .map((subject) => subject.subjectName)
            .filter((subject) => Boolean(subject)))),
    };
});
exports.getSeminaryStudentLmsScope = getSeminaryStudentLmsScope;
