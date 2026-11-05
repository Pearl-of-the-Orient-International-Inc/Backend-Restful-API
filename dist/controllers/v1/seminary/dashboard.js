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
exports.getSeminaryDashboard = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const dayStart = (value) => new Date(`${value}T00:00:00.000Z`);
const dayEnd = (value) => new Date(`${value}T23:59:59.999Z`);
const dateKey = (date) => date.toISOString().slice(0, 10);
const monthKey = (date) => date.toISOString().slice(0, 7);
const getSeminaryDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const now = new Date();
        const defaultStart = new Date(now);
        defaultStart.setUTCDate(defaultStart.getUTCDate() - 30);
        const start = typeof req.query.startDate === 'string' ? dayStart(req.query.startDate) : defaultStart;
        const end = typeof req.query.endDate === 'string' ? dayEnd(req.query.endDate) : now;
        const activeAcademicYear = yield prisma_1.prisma.seminaryAcademicYear.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            select: { academicYear: true },
        });
        const pendingStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
        const [totalStudents, pendingEnrollments, pendingPayments, submittedDocuments, applications, allApplications, payments, programs, events] = yield Promise.all([
            prisma_1.prisma.seminaryApplication.count({ where: { studentId: { not: null } } }),
            prisma_1.prisma.seminaryApplication.count({ where: { status: { in: pendingStatuses } } }),
            prisma_1.prisma.seminaryPayment.count({ where: { status: 'PENDING' } }),
            prisma_1.prisma.seminaryRequirements.count({ where: { OR: [{ transcriptOfRecordsUrl: { not: null } }, { idPictureUrl: { not: null } }, { pastorRecommendationUrl: { not: null } }] } }),
            prisma_1.prisma.seminaryApplication.findMany({
                where: { submittedAt: { gte: start, lte: end } },
                select: { id: true, studentId: true, surname: true, givenName: true, middleName: true, programCourse: true, programLevel: true, enrollmentType: true, status: true, submittedAt: true, payment: { select: { status: true } } },
                orderBy: { submittedAt: 'desc' },
                take: 50,
            }),
            prisma_1.prisma.seminaryApplication.findMany({ select: { submittedAt: true, status: true } }),
            prisma_1.prisma.seminaryPayment.findMany({ select: { submittedAt: true, status: true } }),
            prisma_1.prisma.seminaryApplication.groupBy({ by: ['programLevel'], where: { studentId: { not: null }, programLevel: { not: null } }, _count: { _all: true } }),
            prisma_1.prisma.seminaryAnnouncement.findMany({
                where: { kind: 'EVENT', status: 'PUBLISHED', startsAt: { gte: start, lte: end } },
                select: { id: true, title: true, category: true, startsAt: true, endsAt: true, allDay: true, location: true },
                orderBy: { startsAt: 'asc' },
                take: 20,
            }),
        ]);
        const weekly = new Map();
        for (let offset = 11; offset >= 0; offset -= 1) {
            const week = new Date(now);
            week.setUTCDate(week.getUTCDate() - offset * 7);
            weekly.set(dateKey(week), { enrolled: 0, pending: 0 });
        }
        allApplications.forEach((application) => {
            const matchingWeek = [...weekly.keys()].reverse().find((key) => application.submittedAt >= dayStart(key));
            if (!matchingWeek)
                return;
            const bucket = weekly.get(matchingWeek);
            if (application.status === 'ENROLLED')
                bucket.enrolled += 1;
            if (pendingStatuses.includes(application.status))
                bucket.pending += 1;
        });
        let enrolledRunning = 0;
        let pendingRunning = 0;
        const enrollmentTrend = [...weekly.entries()].map(([date, value]) => {
            enrolledRunning += value.enrolled;
            pendingRunning += value.pending;
            return { date, enrolled: enrolledRunning, pending: pendingRunning };
        });
        const monthly = new Map();
        for (let offset = 4; offset >= 0; offset -= 1) {
            const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
            monthly.set(monthKey(month), { verified: 0, pending: 0, rejected: 0 });
        }
        payments.forEach((payment) => {
            const bucket = monthly.get(monthKey(payment.submittedAt));
            if (!bucket)
                return;
            if (payment.status === 'VERIFIED')
                bucket.verified += 1;
            else if (payment.status === 'REJECTED')
                bucket.rejected += 1;
            else
                bucket.pending += 1;
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary dashboard retrieved successfully',
            data: {
                academicYear: (_a = activeAcademicYear === null || activeAcademicYear === void 0 ? void 0 : activeAcademicYear.academicYear) !== null && _a !== void 0 ? _a : 'No active academic period configured',
                kpis: { totalStudents, pendingEnrollments, pendingPayments, submittedDocuments },
                enrollmentTrend,
                paymentStatusTrend: [...monthly.entries()].map(([period, value]) => (Object.assign({ period }, value))),
                programDistribution: programs.map((item) => ({ name: item.programLevel, value: item._count._all })),
                recentApplications: applications.map((item) => {
                    var _a, _b, _c;
                    return ({
                        id: item.id,
                        student: [item.givenName, item.middleName, item.surname].filter(Boolean).join(' ') || 'Unnamed applicant',
                        studentId: item.studentId,
                        program: (_a = item.programCourse) !== null && _a !== void 0 ? _a : 'Not selected',
                        programLevel: item.programLevel,
                        applicationType: item.enrollmentType,
                        enrollmentStatus: item.status,
                        paymentStatus: (_c = (_b = item.payment) === null || _b === void 0 ? void 0 : _b.status) !== null && _c !== void 0 ? _c : 'NOT_SUBMITTED',
                        submittedAt: item.submittedAt,
                    });
                }),
                events: events.map((item) => (Object.assign(Object.assign({}, item), { startsAt: item.startsAt, endsAt: item.endsAt }))),
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting Seminary dashboard', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DASHBOARD_READ_FAILED', message: 'The Seminary dashboard could not be loaded. Please try again.' });
    }
});
exports.getSeminaryDashboard = getSeminaryDashboard;
