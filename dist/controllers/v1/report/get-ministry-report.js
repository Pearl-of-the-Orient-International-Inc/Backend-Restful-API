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
exports.getMinistryReport = void 0;
const date_fns_1 = require("date-fns");
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const eventCategoryLabels = {
    [enums_1.EventCategory.CONFERENCE]: 'Conference',
    [enums_1.EventCategory.OUTREACH]: 'Outreach',
    [enums_1.EventCategory.TRAINING]: 'Training',
    [enums_1.EventCategory.WORSHIP]: 'Worship',
    [enums_1.EventCategory.ORIENTATION]: 'Orientation',
    [enums_1.EventCategory.SEMINAR]: 'Seminar',
    [enums_1.EventCategory.FELLOWSHIP]: 'Fellowship',
    [enums_1.EventCategory.PRAYER]: 'Prayer',
    [enums_1.EventCategory.OTHER]: 'Other',
};
const eventCategoryColors = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#8b5cf6',
    '#0f766e',
    '#ea580c',
    '#ec4899',
    '#14b8a6',
    '#64748b',
];
const eventStatusColors = {
    [enums_1.EventStatus.SCHEDULED]: '#2563eb',
    [enums_1.EventStatus.ONGOING]: '#8b5cf6',
    [enums_1.EventStatus.COMPLETED]: '#16a34a',
    [enums_1.EventStatus.CANCELLED]: '#ef4444',
};
const leadershipLevelLabels = {
    [enums_1.OfficeTitleLevel.CHIEF_CHAPLAIN]: 'Chief Chaplain',
    [enums_1.OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR]: 'National Director',
    [enums_1.OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR]: 'Regional Director',
    [enums_1.OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR]: 'Regional Deputy',
    [enums_1.OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR]: 'Provincial Director',
    [enums_1.OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR]: 'Provincial Deputy',
    [enums_1.OfficeTitleLevel.CITY_CHAPLAIN]: 'City Chaplain',
    [enums_1.OfficeTitleLevel.MUNICIPAL_CHAPLAIN]: 'Municipal Chaplain',
    [enums_1.OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN]: 'City/Municipal Deputy',
    [enums_1.OfficeTitleLevel.BARANGAY_CHAPLAIN]: 'Barangay Chaplain',
    [enums_1.OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN]: 'Barangay Deputy',
};
const leadershipLevelColors = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#e11d48', '#0891b2'];
const getMinistryReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedMonths = parseInt(req.query.months, 10);
        const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;
        const [events, branchServices, officeTitles, officerAssignments, members] = yield Promise.all([
            prisma_1.prisma.event.findMany({
                select: {
                    id: true,
                    name: true,
                    category: true,
                    type: true,
                    location: true,
                    onlineLink: true,
                    startsAt: true,
                    status: true,
                },
            }),
            prisma_1.prisma.branchOfService.findMany({
                select: {
                    id: true,
                    title: true,
                    sections: true,
                },
            }),
            prisma_1.prisma.officeTitle.findMany({
                select: {
                    id: true,
                    level: true,
                    maxSlots: true,
                    isActive: true,
                },
            }),
            prisma_1.prisma.officerAssignment.findMany({
                select: {
                    officeTitleId: true,
                    isActive: true,
                },
            }),
            prisma_1.prisma.member.findMany({
                select: {
                    preferredBranchOther: true,
                    preferredBranches: {
                        select: {
                            title: true,
                        },
                    },
                },
            }),
        ]);
        const report = buildMinistryReportData({
            events,
            branchServices,
            officeTitles,
            officerAssignments,
            members,
            monthsToShow,
        });
        winston_1.logger.info('Ministry report retrieved', {
            totalEvents: report.summary.totalEvents,
            monthsToShow,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Ministry report retrieved successfully',
            data: report,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting ministry report', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getMinistryReport = getMinistryReport;
function buildMinistryReportData({ events, branchServices, officeTitles, officerAssignments, members, monthsToShow, }) {
    const now = new Date();
    const branchesWithCounts = branchServices.map((branchService) => {
        const normalizedTitle = branchService.title.trim().toLowerCase();
        const memberCount = members.filter((member) => {
            var _a;
            const preferredBranchMatch = member.preferredBranches.some((branch) => branch.title.trim().toLowerCase() === normalizedTitle);
            if (preferredBranchMatch) {
                return true;
            }
            return ((_a = member.preferredBranchOther) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) === normalizedTitle;
        }).length;
        return Object.assign(Object.assign({}, branchService), { memberCount });
    });
    const activeBranches = branchesWithCounts.filter((branch) => branch.memberCount > 0);
    const activeOfficeTitles = officeTitles.filter((office) => office.isActive);
    const activeAssignments = officerAssignments.filter((assignment) => assignment.isActive);
    const totalLeadershipSlots = activeOfficeTitles.reduce((sum, office) => { var _a; return sum + Math.max((_a = office.maxSlots) !== null && _a !== void 0 ? _a : 1, 1); }, 0);
    const filledLeadershipSlots = activeAssignments.length;
    const openLeadershipSlots = Math.max(totalLeadershipSlots - filledLeadershipSlots, 0);
    const leadershipCoverageRate = totalLeadershipSlots
        ? Math.round((filledLeadershipSlots / totalLeadershipSlots) * 100)
        : 0;
    const totalBranchMembers = branchesWithCounts.reduce((sum, branch) => sum + branch.memberCount, 0);
    const branchCoverageRate = branchesWithCounts.length
        ? Math.round((activeBranches.length / branchesWithCounts.length) * 100)
        : 0;
    const onlineEvents = events.filter((event) => event.type === enums_1.EventType.ONLINE).length;
    const upcomingEvents = events
        .filter((event) => {
        return ((0, date_fns_1.isAfter)(event.startsAt, now) &&
            (0, date_fns_1.isBefore)(event.startsAt, (0, date_fns_1.addDays)(now, 30)) &&
            event.status !== enums_1.EventStatus.CANCELLED);
    })
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
    const trendData = buildTrendData(events, monthsToShow, now);
    const categoryMap = new Map();
    events.forEach((event) => {
        var _a, _b;
        const label = (_a = eventCategoryLabels[event.category]) !== null && _a !== void 0 ? _a : sentenceCase(event.category.replace(/_/g, ' '));
        categoryMap.set(label, ((_b = categoryMap.get(label)) !== null && _b !== void 0 ? _b : 0) + 1);
    });
    const categoryBreakdown = buildBreakdown(Array.from(categoryMap.entries())
        .map(([label, value], index) => ({
        label,
        value,
        fill: eventCategoryColors[index % eventCategoryColors.length],
    }))
        .sort((left, right) => right.value - left.value), events.length);
    const statusMap = new Map();
    events.forEach((event) => {
        var _a;
        statusMap.set(event.status, ((_a = statusMap.get(event.status)) !== null && _a !== void 0 ? _a : 0) + 1);
    });
    const statusBreakdown = buildBreakdown([enums_1.EventStatus.SCHEDULED, enums_1.EventStatus.ONGOING, enums_1.EventStatus.COMPLETED, enums_1.EventStatus.CANCELLED].map((status) => {
        var _a;
        return ({
            label: sentenceCase(status.toLowerCase()),
            value: (_a = statusMap.get(status)) !== null && _a !== void 0 ? _a : 0,
            fill: eventStatusColors[status],
        });
    }), events.length);
    const branchBreakdown = buildBreakdown(branchesWithCounts
        .map((branch, index) => ({
        label: branch.title,
        value: branch.memberCount,
        fill: eventCategoryColors[index % eventCategoryColors.length],
        detail: `${getSectionCount(branch.sections)} section${getSectionCount(branch.sections) === 1 ? '' : 's'}`,
    }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6), totalBranchMembers);
    const assignmentsByOfficeId = new Map();
    activeAssignments.forEach((assignment) => {
        var _a;
        assignmentsByOfficeId.set(assignment.officeTitleId, ((_a = assignmentsByOfficeId.get(assignment.officeTitleId)) !== null && _a !== void 0 ? _a : 0) + 1);
    });
    const leadershipByLevel = new Map();
    activeOfficeTitles.forEach((office) => {
        var _a, _b;
        const filled = (_a = assignmentsByOfficeId.get(office.id)) !== null && _a !== void 0 ? _a : 0;
        leadershipByLevel.set(office.level, ((_b = leadershipByLevel.get(office.level)) !== null && _b !== void 0 ? _b : 0) + filled);
    });
    const leadershipBreakdown = buildBreakdown(Array.from(leadershipByLevel.entries())
        .map(([level, value], index) => {
        var _a;
        return ({
            label: (_a = leadershipLevelLabels[level]) !== null && _a !== void 0 ? _a : sentenceCase(level.replace(/_/g, ' ')),
            value,
            fill: leadershipLevelColors[index % leadershipLevelColors.length],
        });
    })
        .sort((left, right) => right.value - left.value)
        .slice(0, 6), filledLeadershipSlots);
    const formattedUpcomingEvents = upcomingEvents.slice(0, 5).map((event) => {
        var _a, _b, _c;
        const dayDiff = Math.max(Math.ceil((event.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
        return {
            id: event.id,
            title: event.name,
            category: (_a = eventCategoryLabels[event.category]) !== null && _a !== void 0 ? _a : sentenceCase(event.category.toLowerCase()),
            type: sentenceCase(event.type.toLowerCase()),
            location: (_c = (_b = event.location) !== null && _b !== void 0 ? _b : event.onlineLink) !== null && _c !== void 0 ? _c : 'TBA',
            startsAtLabel: (0, date_fns_1.format)(event.startsAt, 'MMM d, yyyy • h:mm a'),
            daysAwayLabel: dayDiff === 0 ? 'Today' : `In ${dayDiff} day${dayDiff === 1 ? '' : 's'}`,
        };
    });
    const busiestMonth = [...trendData].sort((left, right) => right.total - left.total)[0];
    const topCategory = categoryBreakdown[0];
    const topBranch = branchBreakdown[0];
    return {
        summary: {
            totalEvents: events.length,
            upcomingEvents: upcomingEvents.length,
            activeBranches: activeBranches.length,
            branchCoverageRate,
            leadershipCoverageRate,
            filledLeadershipSlots,
            openLeadershipSlots,
            onlineShare: events.length ? Math.round((onlineEvents / events.length) * 100) : 0,
        },
        trendData,
        categoryBreakdown,
        statusBreakdown,
        branchBreakdown,
        leadershipBreakdown,
        upcomingEvents: formattedUpcomingEvents,
        insights: [
            {
                title: 'Busiest month',
                value: busiestMonth ? `${busiestMonth.month} (${busiestMonth.total})` : 'No data',
                detail: 'Tracks total ministry events by scheduled start date across the selected reporting window.',
            },
            {
                title: 'Most active event category',
                value: topCategory ? topCategory.label : 'No category data',
                detail: topCategory
                    ? `${topCategory.value} events were scheduled under this ministry stream.`
                    : 'No event categories have been recorded yet.',
            },
            {
                title: 'Strongest branch demand',
                value: topBranch ? topBranch.label : 'No branch data',
                detail: topBranch
                    ? `${topBranch.value} members are currently aligned with this branch of service.`
                    : 'No branch member counts are available yet.',
            },
            {
                title: 'Leadership gap',
                value: `${openLeadershipSlots} open slot${openLeadershipSlots === 1 ? '' : 's'}`,
                detail: totalLeadershipSlots > 0
                    ? `${leadershipCoverageRate}% of configured ministry leadership capacity is currently filled.`
                    : 'No office title capacity has been configured yet.',
            },
        ],
    };
}
function buildTrendData(events, monthsToShow, now) {
    const monthStarts = (0, date_fns_1.eachMonthOfInterval)({
        start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, monthsToShow - 1)),
        end: (0, date_fns_1.startOfMonth)(now),
    });
    return monthStarts.map((monthStart) => {
        const total = events.filter((event) => (0, date_fns_1.isSameMonth)(event.startsAt, monthStart));
        return {
            month: (0, date_fns_1.format)(monthStart, 'MMM'),
            total: total.length,
            onsite: total.filter((event) => event.type === enums_1.EventType.ONSITE).length,
            online: total.filter((event) => event.type === enums_1.EventType.ONLINE).length,
            completed: total.filter((event) => event.status === enums_1.EventStatus.COMPLETED).length,
        };
    });
}
function buildBreakdown(items, total) {
    return items.map((item) => (Object.assign(Object.assign({}, item), { percentage: total ? Math.round((item.value / total) * 100) : 0 })));
}
function sentenceCase(value) {
    return value
        .replace(/\b\w/g, (character) => character.toUpperCase())
        .replace(/_/g, ' ');
}
function getSectionCount(value) {
    return Array.isArray(value) ? value.length : 0;
}
