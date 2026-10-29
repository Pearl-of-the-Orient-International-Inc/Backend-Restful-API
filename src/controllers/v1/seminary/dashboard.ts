import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryApplicationStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

const dayStart = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dayEnd = (value: string) => new Date(`${value}T23:59:59.999Z`);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const monthKey = (date: Date) => date.toISOString().slice(0, 7);

export const getSeminaryDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);
    const start = typeof req.query.startDate === 'string' ? dayStart(req.query.startDate) : defaultStart;
    const end = typeof req.query.endDate === 'string' ? dayEnd(req.query.endDate) : now;
    const activeAcademicYear = await prisma.seminaryAcademicYear.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
      select: { academicYear: true },
    });
    const pendingStatuses: SeminaryApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
    const [totalStudents, pendingEnrollments, pendingPayments, submittedDocuments, applications, allApplications, payments, programs, events] = await Promise.all([
      prisma.seminaryApplication.count({ where: { studentId: { not: null } } }),
      prisma.seminaryApplication.count({ where: { status: { in: pendingStatuses } } }),
      prisma.seminaryPayment.count({ where: { status: 'PENDING' } }),
      prisma.seminaryRequirements.count({ where: { OR: [{ transcriptOfRecordsUrl: { not: null } }, { idPictureUrl: { not: null } }, { pastorRecommendationUrl: { not: null } }] } }),
      prisma.seminaryApplication.findMany({
        where: { submittedAt: { gte: start, lte: end } },
        select: { id: true, studentId: true, surname: true, givenName: true, middleName: true, programCourse: true, programLevel: true, enrollmentType: true, status: true, submittedAt: true, payment: { select: { status: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 50,
      }),
      prisma.seminaryApplication.findMany({ select: { submittedAt: true, status: true } }),
      prisma.seminaryPayment.findMany({ select: { submittedAt: true, status: true } }),
      prisma.seminaryApplication.groupBy({ by: ['programLevel'], where: { studentId: { not: null }, programLevel: { not: null } }, _count: { _all: true } }),
      prisma.seminaryAnnouncement.findMany({
        where: { kind: 'EVENT', status: 'PUBLISHED', startsAt: { gte: start, lte: end } },
        select: { id: true, title: true, category: true, startsAt: true, endsAt: true, allDay: true, location: true },
        orderBy: { startsAt: 'asc' },
        take: 20,
      }),
    ]);

    const weekly = new Map<string, { enrolled: number; pending: number }>();
    for (let offset = 11; offset >= 0; offset -= 1) {
      const week = new Date(now);
      week.setUTCDate(week.getUTCDate() - offset * 7);
      weekly.set(dateKey(week), { enrolled: 0, pending: 0 });
    }
    allApplications.forEach((application) => {
      const matchingWeek = [...weekly.keys()].reverse().find((key) => application.submittedAt >= dayStart(key));
      if (!matchingWeek) return;
      const bucket = weekly.get(matchingWeek)!;
      if (application.status === 'ENROLLED') bucket.enrolled += 1;
      if (pendingStatuses.includes(application.status)) bucket.pending += 1;
    });
    let enrolledRunning = 0;
    let pendingRunning = 0;
    const enrollmentTrend = [...weekly.entries()].map(([date, value]) => {
      enrolledRunning += value.enrolled;
      pendingRunning += value.pending;
      return { date, enrolled: enrolledRunning, pending: pendingRunning };
    });

    const monthly = new Map<string, { verified: number; pending: number; rejected: number }>();
    for (let offset = 4; offset >= 0; offset -= 1) {
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      monthly.set(monthKey(month), { verified: 0, pending: 0, rejected: 0 });
    }
    payments.forEach((payment) => {
      const bucket = monthly.get(monthKey(payment.submittedAt));
      if (!bucket) return;
      if (payment.status === 'VERIFIED') bucket.verified += 1;
      else if (payment.status === 'REJECTED') bucket.rejected += 1;
      else bucket.pending += 1;
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary dashboard retrieved successfully',
      data: {
        academicYear: activeAcademicYear?.academicYear ?? 'No active academic period configured',
        kpis: { totalStudents, pendingEnrollments, pendingPayments, submittedDocuments },
        enrollmentTrend,
        paymentStatusTrend: [...monthly.entries()].map(([period, value]) => ({ period, ...value })),
        programDistribution: programs.map((item) => ({ name: item.programLevel, value: item._count._all })),
        recentApplications: applications.map((item) => ({
          id: item.id,
          student: [item.givenName, item.middleName, item.surname].filter(Boolean).join(' ') || 'Unnamed applicant',
          studentId: item.studentId,
          program: item.programCourse ?? 'Not selected',
          programLevel: item.programLevel,
          applicationType: item.enrollmentType,
          enrollmentStatus: item.status,
          paymentStatus: item.payment?.status ?? 'NOT_SUBMITTED',
          submittedAt: item.submittedAt,
        })),
        events: events.map((item) => ({ ...item, startsAt: item.startsAt, endsAt: item.endsAt })),
      },
    });
  } catch (err) {
    logger.error('Error while getting Seminary dashboard', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DASHBOARD_READ_FAILED', message: 'The Seminary dashboard could not be loaded. Please try again.' });
  }
};
