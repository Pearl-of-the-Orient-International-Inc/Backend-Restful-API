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
exports.getMembershipReport = void 0;
const date_fns_1 = require("date-fns");
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const winston_1 = require("@/lib/winston");
const prisma_1 = require("@/lib/prisma");
const memberTypeLabels = {
    [enums_1.MemberType.ASSOCIATE_CHAPLAIN]: 'Associate Chaplain',
    [enums_1.MemberType.PROFESSIONAL_CHAPLAIN]: 'Professional Chaplain',
    [enums_1.MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER]: 'Ordained & Commissioned Practitioner',
    [enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR]: 'Certified Specialist Training Officer/Instructor',
};
const onboardingStepLabels = {
    [enums_1.MemberOnboardingStep.REQUIREMENTS]: 'Requirements',
    [enums_1.MemberOnboardingStep.PRE_ORIENTATION]: 'Pre-orientation',
    [enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT]: 'Payment checkout',
    [enums_1.MemberOnboardingStep.ONLINE_INTERVIEW]: 'Online interview',
    [enums_1.MemberOnboardingStep.ID_GENERATION]: 'ID generation',
    [enums_1.MemberOnboardingStep.CHAPLAINCY_101]: 'Chaplaincy 101',
    [enums_1.MemberOnboardingStep.OATH_TAKING]: 'Oath taking',
};
const onboardingStepOrder = [
    enums_1.MemberOnboardingStep.REQUIREMENTS,
    enums_1.MemberOnboardingStep.PRE_ORIENTATION,
    enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT,
    enums_1.MemberOnboardingStep.ONLINE_INTERVIEW,
    enums_1.MemberOnboardingStep.ID_GENERATION,
    enums_1.MemberOnboardingStep.CHAPLAINCY_101,
    enums_1.MemberOnboardingStep.OATH_TAKING,
];
const onboardingStepColors = {
    [enums_1.MemberOnboardingStep.REQUIREMENTS]: '#64748b',
    [enums_1.MemberOnboardingStep.PRE_ORIENTATION]: '#0ea5e9',
    [enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT]: '#f59e0b',
    [enums_1.MemberOnboardingStep.ONLINE_INTERVIEW]: '#8b5cf6',
    [enums_1.MemberOnboardingStep.ID_GENERATION]: '#14b8a6',
    [enums_1.MemberOnboardingStep.CHAPLAINCY_101]: '#ef4444',
    [enums_1.MemberOnboardingStep.OATH_TAKING]: '#22c55e',
};
const statusColors = {
    Approved: '#16a34a',
    Pending: '#f59e0b',
    Rejected: '#ef4444',
    Archived: '#64748b',
};
const typeColors = ['#2563eb', '#0d9488', '#9333ea', '#ea580c'];
const getMembershipReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsedMonths = parseInt(req.query.months, 10);
        const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;
        const members = yield prisma_1.prisma.member.findMany({
            select: {
                status: true,
                memberType: true,
                preferredBranchOther: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                onboardingProgress: {
                    select: {
                        currentStep: true,
                    },
                },
                preferredBranches: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        const report = buildMembershipReportData(members, monthsToShow);
        winston_1.logger.info('Membership report retrieved', {
            totalMembers: report.summary.totalMembers,
            monthsToShow,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Membership report retrieved successfully',
            data: report,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting membership report', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getMembershipReport = getMembershipReport;
function buildMembershipReportData(members, monthsToShow) {
    const now = new Date();
    const activeMembers = members.filter((member) => member.isActive);
    const totalMembers = members.length;
    const approvedMembers = members.filter((member) => member.isActive && member.status === enums_1.MemberStatus.APPROVED).length;
    const pendingMembers = members.filter((member) => member.isActive && member.status === enums_1.MemberStatus.PENDING).length;
    const rejectedMembers = members.filter((member) => member.isActive && member.status === enums_1.MemberStatus.REJECTED).length;
    const archivedMembers = members.filter((member) => !member.isActive).length;
    const approvalRate = totalMembers ? Math.round((approvedMembers / totalMembers) * 100) : 0;
    const thisMonthStart = (0, date_fns_1.startOfMonth)(now);
    const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
    const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
    const newThisMonth = members.filter((member) => isDateInInterval(member.createdAt, thisMonthStart, now)).length;
    const newLastMonth = members.filter((member) => isDateInInterval(member.createdAt, lastMonthStart, lastMonthEnd)).length;
    const monthOverMonthGrowth = newThisMonth - newLastMonth;
    const onboardingMembers = activeMembers.filter((member) => {
        const step = getOnboardingStep(member);
        return !(step === enums_1.MemberOnboardingStep.OATH_TAKING && member.status === enums_1.MemberStatus.APPROVED);
    }).length;
    const trendData = buildTrendData(members, now, monthsToShow);
    const statusBreakdown = buildBreakdown([
        { label: 'Approved', value: approvedMembers, fill: statusColors.Approved },
        { label: 'Pending', value: pendingMembers, fill: statusColors.Pending },
        { label: 'Rejected', value: rejectedMembers, fill: statusColors.Rejected },
        { label: 'Archived', value: archivedMembers, fill: statusColors.Archived },
    ], totalMembers);
    const typeCounts = new Map();
    activeMembers.forEach((member) => {
        var _a, _b;
        const label = (_a = memberTypeLabels[member.memberType]) !== null && _a !== void 0 ? _a : sentenceCase(member.memberType.replace(/_/g, ' '));
        typeCounts.set(label, ((_b = typeCounts.get(label)) !== null && _b !== void 0 ? _b : 0) + 1);
    });
    const typeBreakdown = buildBreakdown(Array.from(typeCounts.entries())
        .map(([label, value], index) => ({
        label,
        value,
        fill: typeColors[index % typeColors.length],
    }))
        .sort((left, right) => right.value - left.value), activeMembers.length);
    const onboardingCounts = new Map();
    activeMembers.forEach((member) => {
        var _a;
        const step = getOnboardingStep(member);
        onboardingCounts.set(step, ((_a = onboardingCounts.get(step)) !== null && _a !== void 0 ? _a : 0) + 1);
    });
    const onboardingBreakdown = buildBreakdown(onboardingStepOrder.map((step) => {
        var _a;
        return ({
            label: onboardingStepLabels[step],
            value: (_a = onboardingCounts.get(step)) !== null && _a !== void 0 ? _a : 0,
            fill: onboardingStepColors[step],
        });
    }), activeMembers.length);
    const branchCounts = new Map();
    activeMembers.forEach((member) => {
        var _a, _b, _c;
        const branches = [
            ...member.preferredBranches.map((branch) => branch.title.trim()),
            (_b = (_a = member.preferredBranchOther) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '',
        ].filter(Boolean);
        if (!branches.length) {
            branchCounts.set('Not specified', ((_c = branchCounts.get('Not specified')) !== null && _c !== void 0 ? _c : 0) + 1);
            return;
        }
        branches.forEach((branch) => {
            var _a;
            branchCounts.set(branch, ((_a = branchCounts.get(branch)) !== null && _a !== void 0 ? _a : 0) + 1);
        });
    });
    const branchBreakdown = buildBreakdown(Array.from(branchCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6), activeMembers.length);
    const strongestMonth = [...trendData].sort((left, right) => right.applications - left.applications)[0];
    const topBranch = branchBreakdown[0];
    const topStage = [...onboardingBreakdown].sort((left, right) => right.value - left.value)[0];
    const latestThirtyDays = activeMembers.filter((member) => isDateInInterval(member.createdAt, (0, date_fns_1.subDays)(now, 30), now)).length;
    return {
        summary: {
            totalMembers,
            activeMembers: activeMembers.length,
            pendingMembers,
            approvalRate,
            newThisMonth,
            monthOverMonthGrowth,
            onboardingMembers,
            archivedMembers,
        },
        trendData,
        statusBreakdown,
        typeBreakdown,
        onboardingBreakdown,
        branchBreakdown,
        insights: [
            {
                title: 'Strongest intake month',
                value: strongestMonth ? `${strongestMonth.month} (${strongestMonth.applications})` : 'No data',
                detail: 'Applications are grouped by record creation date in the selected window.',
            },
            {
                title: 'Most selected branch',
                value: topBranch ? `${topBranch.label}` : 'No branch data',
                detail: topBranch
                    ? `${topBranch.value} active members selected this service area.`
                    : 'Branch preferences have not been captured yet.',
            },
            {
                title: 'Largest onboarding queue',
                value: topStage ? topStage.label : 'No stage data',
                detail: topStage
                    ? `${topStage.value} active members currently cluster in this stage.`
                    : 'No onboarding progress is available yet.',
            },
            {
                title: 'Last 30 days',
                value: `${latestThirtyDays} active joins`,
                detail: 'Quick pulse on how much fresh membership activity reached the roster recently.',
            },
        ],
    };
}
function buildTrendData(members, now, monthsToShow) {
    const monthStarts = (0, date_fns_1.eachMonthOfInterval)({
        start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, monthsToShow - 1)),
        end: (0, date_fns_1.startOfMonth)(now),
    });
    return monthStarts.map((monthStart) => {
        const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
        const activeTotal = members.filter((member) => member.isActive && member.createdAt <= monthEnd).length;
        const approvals = members.filter((member) => member.isActive &&
            member.status === enums_1.MemberStatus.APPROVED &&
            isDateInInterval(member.updatedAt, monthStart, monthEnd)).length;
        const applications = members.filter((member) => isDateInInterval(member.createdAt, monthStart, monthEnd)).length;
        return {
            month: (0, date_fns_1.format)(monthStart, 'MMM'),
            applications,
            approvals,
            archived: members.filter((member) => !member.isActive && isDateInInterval(member.updatedAt, monthStart, monthEnd)).length,
            activeTotal,
            approvalRate: applications ? Math.round((approvals / applications) * 100) : 0,
        };
    });
}
function buildBreakdown(items, total) {
    return items.map((item) => (Object.assign(Object.assign({}, item), { percentage: total ? Math.round((item.value / total) * 100) : 0 })));
}
function getOnboardingStep(member) {
    var _a, _b;
    return (_b = (_a = member.onboardingProgress) === null || _a === void 0 ? void 0 : _a.currentStep) !== null && _b !== void 0 ? _b : enums_1.MemberOnboardingStep.REQUIREMENTS;
}
function isDateInInterval(value, start, end) {
    return (0, date_fns_1.isWithinInterval)(value, { start, end });
}
function sentenceCase(value) {
    return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
