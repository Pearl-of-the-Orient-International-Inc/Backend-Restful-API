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
exports.getSeminaryReports = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const PROGRAM_LEVELS = [
    enums_1.SeminaryProgramLevel.CERTIFICATE,
    enums_1.SeminaryProgramLevel.BACHELOR,
    enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
    enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
];
const toNumber = (value) => typeof value === 'number' ? value : value.toNumber();
const dayStart = (value) => new Date(`${value}T00:00:00.000Z`);
const dayEnd = (value) => new Date(`${value}T23:59:59.999Z`);
const monthKey = (date) => date.toISOString().slice(0, 7);
const getSeminaryReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const start = typeof req.query.startDate === 'string'
            ? dayStart(req.query.startDate)
            : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        const end = typeof req.query.endDate === 'string' ? dayEnd(req.query.endDate) : now;
        const requestedProgram = typeof req.query.programLevel === 'string'
            ? req.query.programLevel
            : undefined;
        const scope = typeof req.query.scope === 'string' ? req.query.scope : 'INSTITUTIONAL';
        const programLevels = requestedProgram ? [requestedProgram] : PROGRAM_LEVELS;
        const createdDuringPeriod = { gte: start, lte: end };
        const inPrograms = { in: programLevels };
        const [students, accounts, gradeRecords, documentRequests, applications] = yield Promise.all([
            prisma_1.prisma.seminaryApplication.findMany({
                where: { studentId: { not: null }, programLevel: inPrograms, createdAt: createdDuringPeriod },
                select: { id: true, programLevel: true, createdAt: true },
            }),
            prisma_1.prisma.seminaryFeeCollectionAccount.findMany({
                where: { programLevel: inPrograms, createdAt: createdDuringPeriod },
                select: { programLevel: true, totalCharges: true, amountPaid: true, balance: true, status: true, createdAt: true },
            }),
            prisma_1.prisma.seminaryGradeRecord.findMany({
                where: { programLevel: inPrograms, createdAt: createdDuringPeriod },
                select: { programLevel: true, status: true, remarks: true, createdAt: true },
            }),
            prisma_1.prisma.seminaryDocumentRequest.findMany({
                where: { studentApplication: { programLevel: inPrograms }, createdAt: createdDuringPeriod },
                select: { status: true, createdAt: true, studentApplication: { select: { programLevel: true } } },
            }),
            prisma_1.prisma.seminaryApplication.findMany({
                where: { programLevel: inPrograms, createdAt: createdDuringPeriod },
                select: { status: true, createdAt: true },
            }),
        ]);
        const programs = programLevels.map((program) => {
            const enrolled = students.filter((item) => item.programLevel === program).length;
            const programAccounts = accounts.filter((item) => item.programLevel === program);
            const paid = programAccounts.reduce((sum, item) => sum + toNumber(item.amountPaid), 0);
            const charged = programAccounts.reduce((sum, item) => sum + toNumber(item.totalCharges), 0);
            const programGrades = gradeRecords.filter((item) => item.programLevel === program);
            const complete = programGrades.filter((item) => item.status === 'COMPLETE').length;
            const passing = programGrades.filter((item) => item.remarks === 'PASSED').length;
            return {
                name: program,
                enrollees: enrolled,
                collection: paid,
                collectionRate: charged ? Math.round((paid / charged) * 100) : 0,
                completionRate: programGrades.length ? Math.round((complete / programGrades.length) * 100) : 0,
                retentionRate: programGrades.length ? Math.round((passing / programGrades.length) * 100) : 0,
                gradeRecords: programGrades.length,
            };
        });
        const monthly = new Map();
        for (let offset = 5; offset >= 0; offset -= 1) {
            const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
            monthly.set(monthKey(date), { enrollment: 0, collection: 0, completionRate: 0, gradeCount: 0, completed: 0 });
        }
        applications.forEach((item) => {
            const bucket = monthly.get(monthKey(item.createdAt));
            if (bucket && item.status === 'ENROLLED')
                bucket.enrollment += 1;
        });
        accounts.forEach((item) => {
            const bucket = monthly.get(monthKey(item.createdAt));
            if (bucket)
                bucket.collection += toNumber(item.amountPaid);
        });
        gradeRecords.forEach((item) => {
            const bucket = monthly.get(monthKey(item.createdAt));
            if (!bucket)
                return;
            bucket.gradeCount += 1;
            if (item.status === 'COMPLETE')
                bucket.completed += 1;
        });
        const monthlyPerformance = [...monthly.entries()].map(([period, value]) => ({
            month: new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${period}-01T00:00:00.000Z`)),
            enrollment: value.enrollment,
            collection: value.collection,
            completionRate: value.gradeCount ? Math.round((value.completed / value.gradeCount) * 100) : 0,
        }));
        const reportRows = [
            {
                reportId: 'STUDENTS', reportName: 'Student Enrollment', program: requestedProgram !== null && requestedProgram !== void 0 ? requestedProgram : 'All Programs',
                pendingItems: applications.filter((item) => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(item.status)).length,
                collectionRate: 0,
                status: applications.some((item) => ['SUBMITTED', 'UNDER_REVIEW'].includes(item.status)) ? 'Watchlist' : 'Healthy',
            },
            {
                reportId: 'COLLECTIONS', reportName: 'Fee Collection', program: requestedProgram !== null && requestedProgram !== void 0 ? requestedProgram : 'All Programs',
                pendingItems: accounts.filter((item) => item.status !== 'PAID').length,
                collectionRate: (() => { const charges = accounts.reduce((sum, item) => sum + toNumber(item.totalCharges), 0); const paid = accounts.reduce((sum, item) => sum + toNumber(item.amountPaid), 0); return charges ? Math.round((paid / charges) * 100) : 0; })(),
                status: accounts.some((item) => item.status === 'OVERDUE') ? 'Critical' : 'Healthy',
            },
            {
                reportId: 'GRADES', reportName: 'Academic Progress', program: requestedProgram !== null && requestedProgram !== void 0 ? requestedProgram : 'All Programs',
                pendingItems: gradeRecords.filter((item) => item.status !== 'COMPLETE').length,
                collectionRate: gradeRecords.length ? Math.round((gradeRecords.filter((item) => item.status === 'COMPLETE').length / gradeRecords.length) * 100) : 0,
                status: gradeRecords.some((item) => item.remarks === 'FAILED') ? 'Watchlist' : 'Healthy',
            },
            {
                reportId: 'DOCUMENTS', reportName: 'Document Requests', program: requestedProgram !== null && requestedProgram !== void 0 ? requestedProgram : 'All Programs',
                pendingItems: documentRequests.filter((item) => item.status !== 'RELEASED' && item.status !== 'REJECTED').length,
                collectionRate: documentRequests.length ? Math.round((documentRequests.filter((item) => item.status === 'RELEASED').length / documentRequests.length) * 100) : 0,
                status: documentRequests.some((item) => item.status === 'PENDING') ? 'Watchlist' : 'Healthy',
            },
        ].filter((item) => scope === 'INSTITUTIONAL' || (scope === 'ACADEMIC' && ['STUDENTS', 'GRADES'].includes(item.reportId)) || (scope === 'FINANCE' && item.reportId === 'COLLECTIONS') || (scope === 'REGISTRAR' && ['STUDENTS', 'DOCUMENTS'].includes(item.reportId))).map((item) => (Object.assign(Object.assign({}, item), { generatedOn: now.toISOString().slice(0, 10) })));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary reports retrieved successfully',
            data: {
                period: { startDate: start.toISOString(), endDate: end.toISOString() },
                scope,
                summary: {
                    totalEnrollees: programs.reduce((sum, item) => sum + item.enrollees, 0),
                    totalCollections: programs.reduce((sum, item) => sum + item.collection, 0),
                    completionRate: programs.length ? Math.round(programs.reduce((sum, item) => sum + item.completionRate, 0) / programs.length) : 0,
                    retentionRate: programs.length ? Math.round(programs.reduce((sum, item) => sum + item.retentionRate, 0) / programs.length) : 0,
                },
                monthlyPerformance,
                programs,
                operationalReports: reportRows,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting Seminary reports', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'REPORTS_READ_FAILED', message: 'The Seminary reports could not be loaded. Please try again.' });
    }
});
exports.getSeminaryReports = getSeminaryReports;
