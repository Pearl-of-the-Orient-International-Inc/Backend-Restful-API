import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

import { HTTPSTATUS } from '@/common/http-codes';
import { MemberOnboardingStep, MemberStatus, MemberType } from '@/generated/prisma/enums';
import { logger } from '@/lib/winston';
import { prisma } from '@/lib/prisma';

import type { Request, Response } from 'express';

type TrendPoint = {
  month: string;
  applications: number;
  approvals: number;
  archived: number;
  activeTotal: number;
  approvalRate: number;
};

type BreakdownItem = {
  label: string;
  value: number;
  percentage: number;
  fill?: string;
};

type InsightItem = {
  title: string;
  value: string;
  detail: string;
};

type MembershipReportData = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    approvalRate: number;
    newThisMonth: number;
    monthOverMonthGrowth: number;
    onboardingMembers: number;
    archivedMembers: number;
  };
  trendData: TrendPoint[];
  statusBreakdown: BreakdownItem[];
  typeBreakdown: BreakdownItem[];
  onboardingBreakdown: BreakdownItem[];
  branchBreakdown: BreakdownItem[];
  insights: InsightItem[];
};

type ReportMember = {
  status: MemberStatus;
  memberType: MemberType;
  preferredBranchOther: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  onboardingProgress: {
    currentStep: MemberOnboardingStep;
  } | null;
  preferredBranches: Array<{
    title: string;
  }>;
};

const memberTypeLabels: Record<MemberType, string> = {
  [MemberType.ASSOCIATE_CHAPLAIN]: 'Associate Chaplain',
  [MemberType.PROFESSIONAL_CHAPLAIN]: 'Professional Chaplain',
  [MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER]:
    'Ordained & Commissioned Practitioner',
  [MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR]:
    'Certified Specialist Training Officer/Instructor',
};

const onboardingStepLabels: Record<MemberOnboardingStep, string> = {
  [MemberOnboardingStep.REQUIREMENTS]: 'Requirements',
  [MemberOnboardingStep.PRE_ORIENTATION]: 'Pre-orientation',
  [MemberOnboardingStep.PAYMENT_CHECKOUT]: 'Payment checkout',
  [MemberOnboardingStep.ONLINE_INTERVIEW]: 'Online interview',
  [MemberOnboardingStep.ID_GENERATION]: 'ID generation',
  [MemberOnboardingStep.CHAPLAINCY_101]: 'Chaplaincy 101',
  [MemberOnboardingStep.OATH_TAKING]: 'Oath taking',
};

const onboardingStepOrder = [
  MemberOnboardingStep.REQUIREMENTS,
  MemberOnboardingStep.PRE_ORIENTATION,
  MemberOnboardingStep.PAYMENT_CHECKOUT,
  MemberOnboardingStep.ONLINE_INTERVIEW,
  MemberOnboardingStep.ID_GENERATION,
  MemberOnboardingStep.CHAPLAINCY_101,
  MemberOnboardingStep.OATH_TAKING,
] as const;

const onboardingStepColors: Record<MemberOnboardingStep, string> = {
  [MemberOnboardingStep.REQUIREMENTS]: '#64748b',
  [MemberOnboardingStep.PRE_ORIENTATION]: '#0ea5e9',
  [MemberOnboardingStep.PAYMENT_CHECKOUT]: '#f59e0b',
  [MemberOnboardingStep.ONLINE_INTERVIEW]: '#8b5cf6',
  [MemberOnboardingStep.ID_GENERATION]: '#14b8a6',
  [MemberOnboardingStep.CHAPLAINCY_101]: '#ef4444',
  [MemberOnboardingStep.OATH_TAKING]: '#22c55e',
};

const statusColors: Record<'Approved' | 'Pending' | 'Rejected' | 'Archived', string> = {
  Approved: '#16a34a',
  Pending: '#f59e0b',
  Rejected: '#ef4444',
  Archived: '#64748b',
};

const typeColors = ['#2563eb', '#0d9488', '#9333ea', '#ea580c'];

export const getMembershipReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsedMonths = parseInt(req.query.months as string, 10);
    const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;

    const members = await prisma.member.findMany({
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

    logger.info('Membership report retrieved', {
      totalMembers: report.summary.totalMembers,
      monthsToShow,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Membership report retrieved successfully',
      data: report,
    });
  } catch (err) {
    logger.error('Error while getting membership report', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

function buildMembershipReportData(
  members: ReportMember[],
  monthsToShow: number,
): MembershipReportData {
  const now = new Date();
  const activeMembers = members.filter((member) => member.isActive);
  const totalMembers = members.length;
  const approvedMembers = members.filter(
    (member) => member.isActive && member.status === MemberStatus.APPROVED,
  ).length;
  const pendingMembers = members.filter(
    (member) => member.isActive && member.status === MemberStatus.PENDING,
  ).length;
  const rejectedMembers = members.filter(
    (member) => member.isActive && member.status === MemberStatus.REJECTED,
  ).length;
  const archivedMembers = members.filter((member) => !member.isActive).length;
  const approvalRate = totalMembers ? Math.round((approvedMembers / totalMembers) * 100) : 0;

  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const newThisMonth = members.filter((member) =>
    isDateInInterval(member.createdAt, thisMonthStart, now),
  ).length;
  const newLastMonth = members.filter((member) =>
    isDateInInterval(member.createdAt, lastMonthStart, lastMonthEnd),
  ).length;
  const monthOverMonthGrowth = newThisMonth - newLastMonth;

  const onboardingMembers = activeMembers.filter((member) => {
    const step = getOnboardingStep(member);

    return !(step === MemberOnboardingStep.OATH_TAKING && member.status === MemberStatus.APPROVED);
  }).length;

  const trendData = buildTrendData(members, now, monthsToShow);
  const statusBreakdown = buildBreakdown(
    [
      { label: 'Approved', value: approvedMembers, fill: statusColors.Approved },
      { label: 'Pending', value: pendingMembers, fill: statusColors.Pending },
      { label: 'Rejected', value: rejectedMembers, fill: statusColors.Rejected },
      { label: 'Archived', value: archivedMembers, fill: statusColors.Archived },
    ],
    totalMembers,
  );

  const typeCounts = new Map<string, number>();
  activeMembers.forEach((member) => {
    const label =
      memberTypeLabels[member.memberType] ?? sentenceCase(member.memberType.replace(/_/g, ' '));
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  });

  const typeBreakdown = buildBreakdown(
    Array.from(typeCounts.entries())
      .map(([label, value], index) => ({
        label,
        value,
        fill: typeColors[index % typeColors.length],
      }))
      .sort((left, right) => right.value - left.value),
    activeMembers.length,
  );

  const onboardingCounts = new Map<MemberOnboardingStep, number>();
  activeMembers.forEach((member) => {
    const step = getOnboardingStep(member);
    onboardingCounts.set(step, (onboardingCounts.get(step) ?? 0) + 1);
  });

  const onboardingBreakdown = buildBreakdown(
    onboardingStepOrder.map((step) => ({
      label: onboardingStepLabels[step],
      value: onboardingCounts.get(step) ?? 0,
      fill: onboardingStepColors[step],
    })),
    activeMembers.length,
  );

  const branchCounts = new Map<string, number>();
  activeMembers.forEach((member) => {
    const branches = [
      ...member.preferredBranches.map((branch) => branch.title.trim()),
      member.preferredBranchOther?.trim() ?? '',
    ].filter(Boolean);

    if (!branches.length) {
      branchCounts.set('Not specified', (branchCounts.get('Not specified') ?? 0) + 1);
      return;
    }

    branches.forEach((branch) => {
      branchCounts.set(branch, (branchCounts.get(branch) ?? 0) + 1);
    });
  });

  const branchBreakdown = buildBreakdown(
    Array.from(branchCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    activeMembers.length,
  );

  const strongestMonth = [...trendData].sort((left, right) => right.applications - left.applications)[0];
  const topBranch = branchBreakdown[0];
  const topStage = [...onboardingBreakdown].sort((left, right) => right.value - left.value)[0];
  const latestThirtyDays = activeMembers.filter((member) =>
    isDateInInterval(member.createdAt, subDays(now, 30), now),
  ).length;

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

function buildTrendData(
  members: ReportMember[],
  now: Date,
  monthsToShow: number,
): TrendPoint[] {
  const monthStarts = eachMonthOfInterval({
    start: startOfMonth(subMonths(now, monthsToShow - 1)),
    end: startOfMonth(now),
  });

  return monthStarts.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const activeTotal = members.filter(
      (member) => member.isActive && member.createdAt <= monthEnd,
    ).length;
    const approvals = members.filter(
      (member) =>
        member.isActive &&
        member.status === MemberStatus.APPROVED &&
        isDateInInterval(member.updatedAt, monthStart, monthEnd),
    ).length;
    const applications = members.filter((member) =>
      isDateInInterval(member.createdAt, monthStart, monthEnd),
    ).length;

    return {
      month: format(monthStart, 'MMM'),
      applications,
      approvals,
      archived: members.filter(
        (member) => !member.isActive && isDateInInterval(member.updatedAt, monthStart, monthEnd),
      ).length,
      activeTotal,
      approvalRate: applications ? Math.round((approvals / applications) * 100) : 0,
    };
  });
}

function buildBreakdown(
  items: Array<{ label: string; value: number; fill?: string }>,
  total: number,
): BreakdownItem[] {
  return items.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.value / total) * 100) : 0,
  }));
}

function getOnboardingStep(member: ReportMember) {
  return member.onboardingProgress?.currentStep ?? MemberOnboardingStep.REQUIREMENTS;
}

function isDateInInterval(value: Date, start: Date, end: Date) {
  return isWithinInterval(value, { start, end });
}

function sentenceCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
