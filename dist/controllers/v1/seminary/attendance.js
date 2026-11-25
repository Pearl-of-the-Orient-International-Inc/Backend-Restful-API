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
exports.saveSeminaryAttendance = exports.getSeminaryAttendanceHistory = exports.getSeminaryAttendance = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const presentEntry = (application) => {
    var _a;
    return ({
        applicationId: application.id, rollNo: (_a = application.studentId) !== null && _a !== void 0 ? _a : '—', studentName: [application.givenName, application.middleName, application.surname].filter(Boolean).join(' ') || application.studentId || 'Seminary student', status: 'PRESENT', remarks: '',
    });
};
const getSeminaryAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { academicYear, program, courseId, date } = req.query;
    const students = yield prisma_1.prisma.seminaryApplication.findMany({ where: { studentId: { not: null } }, select: { id: true, studentId: true, givenName: true, middleName: true, surname: true }, orderBy: { studentId: 'asc' } });
    const session = academicYear && program && courseId && date ? yield prisma_1.prisma.seminaryAttendanceSession.findUnique({ where: { academicYear_program_courseId_attendanceDate: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`) } }, include: { entries: true } }) : null;
    const entryByApplication = new Map((_a = session === null || session === void 0 ? void 0 : session.entries.map((entry) => [entry.applicationId, entry])) !== null && _a !== void 0 ? _a : []);
    res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Attendance retrieved successfully', data: students.map((student) => { var _a; return (Object.assign(Object.assign({}, presentEntry(student)), (entryByApplication.get(student.id) ? { status: entryByApplication.get(student.id).status, remarks: (_a = entryByApplication.get(student.id).remarks) !== null && _a !== void 0 ? _a : '' } : {}))); }) });
});
exports.getSeminaryAttendance = getSeminaryAttendance;
const getSeminaryAttendanceHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const applicationId = String(req.params.applicationId);
    const month = String(req.query.month);
    const [year, monthIndex] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, 1));
    const sessions = yield prisma_1.prisma.seminaryAttendanceSession.findMany({
        where: { attendanceDate: { gte: startDate, lt: endDate } },
        select: {
            attendanceDate: true,
            entries: {
                where: { applicationId },
                select: { status: true, remarks: true },
            },
        },
        orderBy: { attendanceDate: 'asc' },
    });
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Attendance history retrieved successfully',
        data: sessions.flatMap((session) => session.entries.map((entry) => {
            var _a;
            return ({
                date: session.attendanceDate.toISOString().slice(0, 10),
                status: entry.status,
                remarks: (_a = entry.remarks) !== null && _a !== void 0 ? _a : '',
            });
        })),
    });
});
exports.getSeminaryAttendanceHistory = getSeminaryAttendanceHistory;
const saveSeminaryAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academicYear, program, courseId, date, entries } = req.body;
    const session = yield prisma_1.prisma.seminaryAttendanceSession.upsert({ where: { academicYear_program_courseId_attendanceDate: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`) } }, create: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`), createdByUserId: req.userId }, update: {} });
    yield prisma_1.prisma.$transaction(entries.map((entry) => { var _a, _b; return prisma_1.prisma.seminaryAttendanceEntry.upsert({ where: { sessionId_applicationId: { sessionId: session.id, applicationId: entry.applicationId } }, create: { sessionId: session.id, applicationId: entry.applicationId, status: enums_1.SeminaryAttendanceStatus[entry.status], remarks: ((_a = entry.remarks) === null || _a === void 0 ? void 0 : _a.trim()) || null }, update: { status: enums_1.SeminaryAttendanceStatus[entry.status], remarks: ((_b = entry.remarks) === null || _b === void 0 ? void 0 : _b.trim()) || null } }); }));
    res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Attendance saved successfully', data: { id: session.id } });
});
exports.saveSeminaryAttendance = saveSeminaryAttendance;
