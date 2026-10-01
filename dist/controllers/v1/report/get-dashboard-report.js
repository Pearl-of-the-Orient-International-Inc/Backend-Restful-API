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
exports.getDashboardReport = void 0;
const date_fns_1 = require("date-fns");
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const onboardingStageConfig = [
    {
        step: enums_1.MemberOnboardingStep.PRE_ORIENTATION,
        label: 'Pre-orientation',
        fill: '#0ea5e9',
    },
    {
        step: enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT,
        label: 'Payment checkout',
        fill: '#f59e0b',
    },
    {
        step: enums_1.MemberOnboardingStep.ONLINE_INTERVIEW,
        label: 'Online interview',
        fill: '#8b5cf6',
    },
    {
        step: enums_1.MemberOnboardingStep.ID_GENERATION,
        label: 'ID generation',
        fill: '#10b981',
    },
    {
        step: enums_1.MemberOnboardingStep.CHAPLAINCY_101,
        label: 'Chaplaincy training',
        fill: '#ef4444',
    },
];
const getDashboardReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedMonths = parseInt(req.query.months, 10);
        const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;
        const [members, events] = yield Promise.all([
            prisma_1.prisma.member.findMany({
                select: {
                    status: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    onboardingProgress: {
                        select: {
                            currentStep: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.event.findMany({
                select: {
                    id: true,
                    name: true,
                    category: true,
                    type: true,
                    status: true,
                    description: true,
                    location: true,
                    onlineLink: true,
                    organizer: true,
                    startsAt: true,
                    endsAt: true,
                    _count: {
                        select: {
                            attendees: true,
                            taggedMembers: true,
                        },
                    },
                },
                orderBy: {
                    startsAt: 'asc',
                },
            }),
        ]);
        const report = buildDashboardReport({ members, events, monthsToShow });
        winston_1.logger.info('Dashboard report retrieved', {
            approvedMembers: report.summary.totalMembers,
            pendingApplications: report.summary.pendingApplications,
            thisWeeksEvents: report.summary.thisWeeksEvents,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Dashboard report retrieved successfully',
            data: report,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting dashboard report', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getDashboardReport = getDashboardReport;
function buildDashboardReport({ members, events, monthsToShow, }) {
    const now = new Date();
    const approvedMembers = members.filter((member) => member.isActive && member.status === enums_1.MemberStatus.APPROVED);
    const pendingMembers = members.filter((member) => member.isActive && member.status === enums_1.MemberStatus.PENDING);
    const urgentPendingApplications = pendingMembers.filter((member) => member.createdAt <= (0, date_fns_1.subDays)(now, 7)).length;
    const weekStart = (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 });
    const weekEnd = (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 });
    const thisWeeksEvents = events.filter((event) => event.status !== enums_1.EventStatus.CANCELLED &&
        (0, date_fns_1.isWithinInterval)(event.startsAt, { start: weekStart, end: weekEnd }));
    return {
        summary: {
            totalMembers: approvedMembers.length,
            approvedMembers: approvedMembers.length,
            pendingApplications: pendingMembers.length,
            urgentPendingApplications,
            thisWeeksEvents: thisWeeksEvents.length,
            onlineEventsThisWeek: thisWeeksEvents.filter((event) => event.type === enums_1.EventType.ONLINE).length,
        },
        membershipTrend: buildMembershipTrend(members, events, monthsToShow, now),
        onboardingBreakdown: buildOnboardingBreakdown(members),
        calendarEvents: events.map((event) => {
            var _a, _b;
            return ({
                id: event.id,
                title: event.name,
                category: event.category,
                type: event.type,
                status: event.status,
                startsAt: event.startsAt.toISOString(),
                endsAt: event.endsAt.toISOString(),
                date: (0, date_fns_1.format)(event.startsAt, 'yyyy-MM-dd'),
                time: `${(0, date_fns_1.format)(event.startsAt, 'h:mm a')} - ${(0, date_fns_1.format)(event.endsAt, 'h:mm a')}`,
                location: (_b = (_a = event.location) !== null && _a !== void 0 ? _a : event.onlineLink) !== null && _b !== void 0 ? _b : 'TBA',
                organizer: event.organizer,
            });
        }),
        upcomingEvents: events
            .filter((event) => event.status !== enums_1.EventStatus.CANCELLED &&
            event.startsAt >= now &&
            event.startsAt <= (0, date_fns_1.addDays)(now, 45))
            .slice(0, 5)
            .map((event) => {
            var _a, _b;
            return ({
                id: event.id,
                title: event.name,
                description: event.description,
                startsAt: event.startsAt.toISOString(),
                type: event.type,
                category: event.category,
                attendees: Math.max(event._count.attendees, event._count.taggedMembers),
                location: (_b = (_a = event.location) !== null && _a !== void 0 ? _a : event.onlineLink) !== null && _b !== void 0 ? _b : 'TBA',
            });
        }),
    };
}
function buildMembershipTrend(members, events, monthsToShow, now) {
    const monthStarts = (0, date_fns_1.eachMonthOfInterval)({
        start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, monthsToShow - 1)),
        end: (0, date_fns_1.startOfMonth)(now),
    });
    return monthStarts.map((monthStart) => {
        const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
        return {
            month: (0, date_fns_1.format)(monthStart, 'MMM'),
            applications: members.filter((member) => (0, date_fns_1.isWithinInterval)(member.createdAt, { start: monthStart, end: monthEnd })).length,
            approvals: members.filter((member) => member.isActive &&
                member.status === enums_1.MemberStatus.APPROVED &&
                (0, date_fns_1.isWithinInterval)(member.updatedAt, { start: monthStart, end: monthEnd })).length,
            events: events.filter((event) => (0, date_fns_1.isWithinInterval)(event.startsAt, { start: monthStart, end: monthEnd })).length,
        };
    });
}
function buildOnboardingBreakdown(members) {
    const activeMembers = members.filter((member) => member.isActive);
    const total = activeMembers.length;
    return onboardingStageConfig.map((stage) => {
        const value = activeMembers.filter((member) => { var _a; return ((_a = member.onboardingProgress) === null || _a === void 0 ? void 0 : _a.currentStep) === stage.step; }).length;
        return {
            label: stage.label,
            value,
            percentage: total ? Math.round((value / total) * 100) : 0,
            fill: stage.fill,
        };
    });
}
