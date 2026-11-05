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
exports.findSeminaryScheduleConflict = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const timeToMinutes = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
};
const rangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) => timeToMinutes(leftStart) < timeToMinutes(rightEnd) &&
    timeToMinutes(rightStart) < timeToMinutes(leftEnd);
const datesMatch = (left, right) => Boolean(left && right && left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10));
const recurringDaysOverlap = (left, right) => left.some((day) => right.includes(day));
const findSeminaryScheduleConflict = (input, excludeId) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.prisma.seminaryCourseSchedule.findMany({
        where: Object.assign(Object.assign({ academicYear: input.academicYear, status: { in: [enums_1.SeminaryCourseScheduleStatus.DRAFT, enums_1.SeminaryCourseScheduleStatus.SCHEDULED] } }, (excludeId ? { id: { not: excludeId } } : {})), { OR: [{ instructorId: input.instructorId }, { courseId: input.courseId }] }),
        include: {
            course: { select: { courseCode: true } },
            instructor: { select: { name: true } },
        },
    });
    return existing.find((schedule) => {
        var _a;
        if (!rangesOverlap(input.startTime, input.endTime, schedule.startTime, schedule.endTime)) {
            return false;
        }
        const sameDate = datesMatch(input.scheduledDate, schedule.scheduledDate);
        const sameRecurringDay = recurringDaysOverlap((_a = input.recurrenceDays) !== null && _a !== void 0 ? _a : [], schedule.recurrenceDays);
        return sameDate || sameRecurringDay;
    });
});
exports.findSeminaryScheduleConflict = findSeminaryScheduleConflict;
