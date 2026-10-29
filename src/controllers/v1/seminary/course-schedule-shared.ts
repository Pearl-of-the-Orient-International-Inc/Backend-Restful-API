import { SeminaryCourseScheduleStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

type ScheduleInput = {
  academicYear: string;
  courseId: string;
  instructorId: string;
  scheduledDate?: Date;
  recurrenceDays?: string[];
  recurrenceEndDate?: Date;
  startTime: string;
  endTime: string;
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const rangesOverlap = (leftStart: string, leftEnd: string, rightStart: string, rightEnd: string) =>
  timeToMinutes(leftStart) < timeToMinutes(rightEnd) &&
  timeToMinutes(rightStart) < timeToMinutes(leftEnd);

const datesMatch = (left?: Date | null, right?: Date | null) =>
  Boolean(left && right && left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10));

const recurringDaysOverlap = (left: string[], right: string[]) =>
  left.some((day) => right.includes(day));

/** Returns the first obvious instructor/course collision, if one exists. */
export const findSeminaryScheduleConflict = async (
  input: ScheduleInput,
  excludeId?: string,
) => {
  const existing = await prisma.seminaryCourseSchedule.findMany({
    where: {
      academicYear: input.academicYear,
      status: { in: [SeminaryCourseScheduleStatus.DRAFT, SeminaryCourseScheduleStatus.SCHEDULED] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ instructorId: input.instructorId }, { courseId: input.courseId }],
    },
    include: {
      course: { select: { courseCode: true } },
      instructor: { select: { name: true } },
    },
  });

  return existing.find((schedule) => {
    if (!rangesOverlap(input.startTime, input.endTime, schedule.startTime, schedule.endTime)) {
      return false;
    }

    const sameDate = datesMatch(input.scheduledDate, schedule.scheduledDate);
    const sameRecurringDay = recurringDaysOverlap(
      input.recurrenceDays ?? [],
      schedule.recurrenceDays,
    );
    return sameDate || sameRecurringDay;
  });
};
