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
exports.deleteSeminaryCourseSchedule = exports.updateSeminaryCourseSchedule = exports.createSeminaryCourseSchedule = exports.getSeminaryCourseSchedules = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const course_schedule_shared_1 = require("./course-schedule-shared");
const includeScheduleDetails = {
    course: { select: { id: true, courseCode: true, courseName: true, program: true } },
    instructor: { select: { id: true, name: true, userId: true } },
};
const formatConflictMessage = (schedule) => `Schedule conflicts with ${schedule.course.courseCode} assigned to ${schedule.instructor.name}.`;
const getSchedulePersistenceError = (err) => {
    var _a;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2021') {
            return 'The timetable database table is missing. Apply the seminary course schedule migration, then try again.';
        }
        if (err.code === 'P2022') {
            const column = typeof ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.column) === 'string' ? ` (${err.meta.column})` : '';
            return `The timetable database is missing a required column${column}. Apply the latest seminary course schedule migrations, then try again.`;
        }
        if (err.code === 'P2003') {
            return 'The selected course or instructor is no longer available. Refresh the page and choose it again.';
        }
        if (err.code === 'P2002') {
            return 'A schedule with the same unique details already exists.';
        }
        return `The database could not save this schedule (${err.code}): ${err.message}`;
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return 'The schedule details use an invalid format. Please check the date, time, course, and instructor, then try again.';
    }
    return err instanceof Error
        ? `The schedule could not be saved: ${err.message}`
        : 'The schedule could not be saved because of an unknown server error.';
};
const ensureReferencesExist = (courseId, instructorId) => __awaiter(void 0, void 0, void 0, function* () {
    const [course, instructor] = yield prisma_1.prisma.$transaction([
        prisma_1.prisma.seminaryCourse.findFirst({ where: { id: courseId, status: 'ACTIVE' }, select: { id: true } }),
        prisma_1.prisma.seminaryInstructor.findFirst({ where: { id: instructorId, status: { in: ['ACTIVE', 'PART_TIME'] } }, select: { id: true } }),
    ]);
    return { course, instructor };
});
const toScheduleDate = (value, fieldName) => {
    const date = value instanceof Date
        ? value
        : new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} must be a valid calendar date.`);
    }
    return date;
};
const getSeminaryCourseSchedules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'User not found' });
            return;
        }
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.academicYear ? { academicYear: query.academicYear } : {})), (query.period ? { period: query.period } : {})), (query.className ? { className: query.className } : {})), (query.status ? { status: query.status } : {}));
        if (user.role === enums_1.UserType.INSTRUCTOR) {
            where.instructor = { userId: req.userId };
        }
        else if (user.role === enums_1.UserType.MEMBER) {
            const enrollment = yield prisma_1.prisma.seminaryApplication.findFirst({
                where: { member: { userId: req.userId }, status: 'ENROLLED' },
                orderBy: { updatedAt: 'desc' },
                select: { academicYear: true, programLevel: true },
            });
            if (!(enrollment === null || enrollment === void 0 ? void 0 : enrollment.programLevel)) {
                res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'No enrolled course schedules found', data: [] });
                return;
            }
            where.course = { program: enrollment.programLevel };
            if (enrollment.academicYear)
                where.academicYear = enrollment.academicYear;
        }
        const schedules = yield prisma_1.prisma.seminaryCourseSchedule.findMany({
            where,
            include: includeScheduleDetails,
            orderBy: [{ scheduledDate: 'asc' }, { startTime: 'asc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedules retrieved successfully', data: schedules });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary course schedules', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getSeminaryCourseSchedules = getSeminaryCourseSchedules;
const persistSchedule = (body, id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { course, instructor } = yield ensureReferencesExist(body.courseId, body.instructorId);
    if (!course)
        return { error: 'The selected active course was not found' };
    if (!instructor)
        return { error: 'The selected active instructor was not found' };
    const scheduledDate = toScheduleDate(body.scheduledDate, 'Scheduled date');
    const recurrenceEndDate = body.recurrenceEndDate
        ? toScheduleDate(body.recurrenceEndDate, 'Recurrence end date')
        : undefined;
    const scheduleInput = Object.assign(Object.assign({}, body), { scheduledDate, recurrenceEndDate });
    const conflict = yield (0, course_schedule_shared_1.findSeminaryScheduleConflict)(scheduleInput, id);
    if (conflict)
        return { error: formatConflictMessage(conflict) };
    const data = {
        academicYear: body.academicYear,
        period: body.period,
        className: body.className,
        courseId: body.courseId,
        instructorId: body.instructorId,
        subjectName: body.subjectName,
        units: body.units,
        scheduledDate,
        recurrenceDays: (_a = body.recurrenceDays) !== null && _a !== void 0 ? _a : [],
        recurrenceEndDate,
        startTime: body.startTime,
        endTime: body.endTime,
        deliveryMode: body.deliveryMode,
        location: body.location,
        meetingLink: body.meetingLink,
        status: (_b = body.status) !== null && _b !== void 0 ? _b : 'SCHEDULED',
    };
    const schedule = id
        ? yield prisma_1.prisma.seminaryCourseSchedule.update({ where: { id }, data, include: includeScheduleDetails })
        : yield prisma_1.prisma.seminaryCourseSchedule.create({ data, include: includeScheduleDetails });
    return { schedule };
});
const createSeminaryCourseSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield persistSchedule(req.body);
        if (result.error) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: result.error });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Course schedule created successfully', data: result.schedule });
    }
    catch (err) {
        const message = getSchedulePersistenceError(err);
        winston_1.logger.error(`Error while creating seminary course schedule: ${message}`);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'SCHEDULE_CREATE_FAILED', message });
    }
});
exports.createSeminaryCourseSchedule = createSeminaryCourseSchedule;
const updateSeminaryCourseSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const found = yield prisma_1.prisma.seminaryCourseSchedule.findUnique({ where: { id }, select: { id: true } });
        if (!found) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Course schedule not found' });
            return;
        }
        const result = yield persistSchedule(req.body, id);
        if (result.error) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: result.error });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedule updated successfully', data: result.schedule });
    }
    catch (err) {
        const message = getSchedulePersistenceError(err);
        winston_1.logger.error(`Error while updating seminary course schedule: ${message}`);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'SCHEDULE_UPDATE_FAILED', message });
    }
});
exports.updateSeminaryCourseSchedule = updateSeminaryCourseSchedule;
const deleteSeminaryCourseSchedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        yield prisma_1.prisma.seminaryCourseSchedule.delete({ where: { id } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Course schedule deleted successfully' });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting seminary course schedule', { err });
        res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Course schedule not found' });
    }
});
exports.deleteSeminaryCourseSchedule = deleteSeminaryCourseSchedule;
