import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryAttendanceStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type { Request, Response } from 'express';

const presentEntry = (application: { id: string; studentId: string | null; givenName: string | null; middleName: string | null; surname: string | null }) => ({
  applicationId: application.id, rollNo: application.studentId ?? '—', studentName: [application.givenName, application.middleName, application.surname].filter(Boolean).join(' ') || application.studentId || 'Seminary student', status: 'PRESENT', remarks: '',
});

export const getSeminaryAttendance = async (req: Request, res: Response) => {
  const { academicYear, program, courseId, date } = req.query as Record<string, string>;
  // Academic year identifies an attendance session. Do not use it to hide
  // imported students that have not yet been assigned an academic-year value.
  const students = await prisma.seminaryApplication.findMany({ where: { studentId: { not: null } }, select: { id: true, studentId: true, givenName: true, middleName: true, surname: true }, orderBy: { studentId: 'asc' } });
  const session = academicYear && program && courseId && date ? await prisma.seminaryAttendanceSession.findUnique({ where: { academicYear_program_courseId_attendanceDate: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`) } }, include: { entries: true } }) : null;
  const entryByApplication = new Map(session?.entries.map((entry) => [entry.applicationId, entry]) ?? []);
  res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Attendance retrieved successfully', data: students.map((student) => ({ ...presentEntry(student), ...(entryByApplication.get(student.id) ? { status: entryByApplication.get(student.id)!.status, remarks: entryByApplication.get(student.id)!.remarks ?? '' } : {}) })) });
};

export const getSeminaryAttendanceHistory = async (req: Request, res: Response) => {
  const applicationId = String(req.params.applicationId);
  const month = String(req.query.month);
  const [year, monthIndex] = month.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const endDate = new Date(Date.UTC(year, monthIndex, 1));
  const sessions = await prisma.seminaryAttendanceSession.findMany({
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
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Attendance history retrieved successfully',
    data: sessions.flatMap((session) => session.entries.map((entry) => ({
      date: session.attendanceDate.toISOString().slice(0, 10),
      status: entry.status,
      remarks: entry.remarks ?? '',
    }))),
  });
};

export const saveSeminaryAttendance = async (req: Request, res: Response) => {
  const { academicYear, program, courseId, date, entries } = req.body as { academicYear: string; program: string; courseId: string; date: string; entries: Array<{ applicationId: string; status: keyof typeof SeminaryAttendanceStatus; remarks?: string }> };
  const session = await prisma.seminaryAttendanceSession.upsert({ where: { academicYear_program_courseId_attendanceDate: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`) } }, create: { academicYear, program, courseId, attendanceDate: new Date(`${date}T00:00:00.000Z`), createdByUserId: req.userId }, update: {} });
  await prisma.$transaction(entries.map((entry) => prisma.seminaryAttendanceEntry.upsert({ where: { sessionId_applicationId: { sessionId: session.id, applicationId: entry.applicationId } }, create: { sessionId: session.id, applicationId: entry.applicationId, status: SeminaryAttendanceStatus[entry.status], remarks: entry.remarks?.trim() || null }, update: { status: SeminaryAttendanceStatus[entry.status], remarks: entry.remarks?.trim() || null } })));
  res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Attendance saved successfully', data: { id: session.id } });
};
