import {
  addDays,
  eachMonthOfInterval,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';

import { HTTPSTATUS } from '@/common/http-codes';
import { EventCategory, EventStatus, EventType, OfficeTitleLevel } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

type TrendPoint = {
  month: string;
  total: number;
  onsite: number;
  online: number;
  completed: number;
};

type BreakdownItem = {
  label: string;
  value: number;
  percentage: number;
  fill?: string;
  detail?: string;
};

type InsightItem = {
  title: string;
  value: string;
  detail: string;
};

type UpcomingItem = {
  id: string;
  title: string;
  category: string;
  type: string;
  location: string;
  startsAtLabel: string;
  daysAwayLabel: string;
};

type MinistryReportData = {
  summary: {
    totalEvents: number;
    upcomingEvents: number;
    activeBranches: number;
    branchCoverageRate: number;
    leadershipCoverageRate: number;
    filledLeadershipSlots: number;
    openLeadershipSlots: number;
    onlineShare: number;
  };
  trendData: TrendPoint[];
  categoryBreakdown: BreakdownItem[];
  statusBreakdown: BreakdownItem[];
  branchBreakdown: BreakdownItem[];
  leadershipBreakdown: BreakdownItem[];
  upcomingEvents: UpcomingItem[];
  insights: InsightItem[];
};

type ReportEvent = {
  id: string;
  name: string;
  category: EventCategory;
  type: EventType;
  location: string | null;
  onlineLink: string | null;
  startsAt: Date;
  status: EventStatus;
};

type ReportBranchService = {
  id: string;
  title: string;
  sections: unknown;
};

type ReportOfficeTitle = {
  id: string;
  level: OfficeTitleLevel;
  maxSlots: number | null;
  isActive: boolean;
};

type ReportOfficerAssignment = {
  officeTitleId: string;
  isActive: boolean;
};

type ReportMember = {
  preferredBranchOther: string | null;
  preferredBranches: Array<{
    title: string;
  }>;
};

const eventCategoryLabels: Record<EventCategory, string> = {
  [EventCategory.CONFERENCE]: 'Conference',
  [EventCategory.OUTREACH]: 'Outreach',
  [EventCategory.TRAINING]: 'Training',
  [EventCategory.WORSHIP]: 'Worship',
  [EventCategory.ORIENTATION]: 'Orientation',
  [EventCategory.SEMINAR]: 'Seminar',
  [EventCategory.FELLOWSHIP]: 'Fellowship',
  [EventCategory.PRAYER]: 'Prayer',
  [EventCategory.OTHER]: 'Other',
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

const eventStatusColors: Record<EventStatus, string> = {
  [EventStatus.SCHEDULED]: '#2563eb',
  [EventStatus.ONGOING]: '#8b5cf6',
  [EventStatus.COMPLETED]: '#16a34a',
  [EventStatus.CANCELLED]: '#ef4444',
};

const leadershipLevelLabels: Record<OfficeTitleLevel, string> = {
  [OfficeTitleLevel.CHIEF_CHAPLAIN]: 'Chief Chaplain',
  [OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR]: 'National Director',
  [OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR]: 'Regional Director',
  [OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR]: 'Regional Deputy',
  [OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR]: 'Provincial Director',
  [OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR]: 'Provincial Deputy',
  [OfficeTitleLevel.CITY_CHAPLAIN]: 'City Chaplain',
  [OfficeTitleLevel.MUNICIPAL_CHAPLAIN]: 'Municipal Chaplain',
  [OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN]: 'City/Municipal Deputy',
  [OfficeTitleLevel.BARANGAY_CHAPLAIN]: 'Barangay Chaplain',
  [OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN]: 'Barangay Deputy',
};

const leadershipLevelColors = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#e11d48', '#0891b2'];

export const getMinistryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedMonths = parseInt(req.query.months as string, 10);
    const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;

    const [events, branchServices, officeTitles, officerAssignments, members] = await Promise.all([
      prisma.event.findMany({
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
      prisma.branchOfService.findMany({
        select: {
          id: true,
          title: true,
          sections: true,
        },
      }),
      prisma.officeTitle.findMany({
        select: {
          id: true,
          level: true,
          maxSlots: true,
          isActive: true,
        },
      }),
      prisma.officerAssignment.findMany({
        select: {
          officeTitleId: true,
          isActive: true,
        },
      }),
      prisma.member.findMany({
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

    logger.info('Ministry report retrieved', {
      totalEvents: report.summary.totalEvents,
      monthsToShow,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Ministry report retrieved successfully',
      data: report,
    });
  } catch (err) {
    logger.error('Error while getting ministry report', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

function buildMinistryReportData({
  events,
  branchServices,
  officeTitles,
  officerAssignments,
  members,
  monthsToShow,
}: {
  events: ReportEvent[];
  branchServices: ReportBranchService[];
  officeTitles: ReportOfficeTitle[];
  officerAssignments: ReportOfficerAssignment[];
  members: ReportMember[];
  monthsToShow: number;
}): MinistryReportData {
  const now = new Date();

  const branchesWithCounts = branchServices.map((branchService) => {
    const normalizedTitle = branchService.title.trim().toLowerCase();

    const memberCount = members.filter((member) => {
      const preferredBranchMatch =
        member.preferredBranches.some(
          (branch) => branch.title.trim().toLowerCase() === normalizedTitle,
        );

      if (preferredBranchMatch) {
        return true;
      }

      return member.preferredBranchOther?.trim().toLowerCase() === normalizedTitle;
    }).length;

    return {
      ...branchService,
      memberCount,
    };
  });

  const activeBranches = branchesWithCounts.filter((branch) => branch.memberCount > 0);
  const activeOfficeTitles = officeTitles.filter((office) => office.isActive);
  const activeAssignments = officerAssignments.filter((assignment) => assignment.isActive);

  const totalLeadershipSlots = activeOfficeTitles.reduce(
    (sum, office) => sum + Math.max(office.maxSlots ?? 1, 1),
    0,
  );
  const filledLeadershipSlots = activeAssignments.length;
  const openLeadershipSlots = Math.max(totalLeadershipSlots - filledLeadershipSlots, 0);
  const leadershipCoverageRate = totalLeadershipSlots
    ? Math.round((filledLeadershipSlots / totalLeadershipSlots) * 100)
    : 0;

  const totalBranchMembers = branchesWithCounts.reduce(
    (sum, branch) => sum + branch.memberCount,
    0,
  );
  const branchCoverageRate = branchesWithCounts.length
    ? Math.round((activeBranches.length / branchesWithCounts.length) * 100)
    : 0;

  const onlineEvents = events.filter((event) => event.type === EventType.ONLINE).length;
  const upcomingEvents = events
    .filter((event) => {
      return (
        isAfter(event.startsAt, now) &&
        isBefore(event.startsAt, addDays(now, 30)) &&
        event.status !== EventStatus.CANCELLED
      );
    })
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());

  const trendData = buildTrendData(events, monthsToShow, now);

  const categoryMap = new Map<string, number>();
  events.forEach((event) => {
    const label = eventCategoryLabels[event.category] ?? sentenceCase(event.category.replace(/_/g, ' '));
    categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1);
  });

  const categoryBreakdown = buildBreakdown(
    Array.from(categoryMap.entries())
      .map(([label, value], index) => ({
        label,
        value,
        fill: eventCategoryColors[index % eventCategoryColors.length],
      }))
      .sort((left, right) => right.value - left.value),
    events.length,
  );

  const statusMap = new Map<EventStatus, number>();
  events.forEach((event) => {
    statusMap.set(event.status, (statusMap.get(event.status) ?? 0) + 1);
  });

  const statusBreakdown = buildBreakdown(
    [EventStatus.SCHEDULED, EventStatus.ONGOING, EventStatus.COMPLETED, EventStatus.CANCELLED].map(
      (status) => ({
        label: sentenceCase(status.toLowerCase()),
        value: statusMap.get(status) ?? 0,
        fill: eventStatusColors[status],
      }),
    ),
    events.length,
  );

  const branchBreakdown = buildBreakdown(
    branchesWithCounts
      .map((branch, index) => ({
        label: branch.title,
        value: branch.memberCount,
        fill: eventCategoryColors[index % eventCategoryColors.length],
        detail: `${getSectionCount(branch.sections)} section${getSectionCount(branch.sections) === 1 ? '' : 's'}`,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    totalBranchMembers,
  );

  const assignmentsByOfficeId = new Map<string, number>();
  activeAssignments.forEach((assignment) => {
    assignmentsByOfficeId.set(
      assignment.officeTitleId,
      (assignmentsByOfficeId.get(assignment.officeTitleId) ?? 0) + 1,
    );
  });

  const leadershipByLevel = new Map<string, number>();
  activeOfficeTitles.forEach((office) => {
    const filled = assignmentsByOfficeId.get(office.id) ?? 0;
    leadershipByLevel.set(
      office.level,
      (leadershipByLevel.get(office.level) ?? 0) + filled,
    );
  });

  const leadershipBreakdown = buildBreakdown(
    Array.from(leadershipByLevel.entries())
      .map(([level, value], index) => ({
        label:
          leadershipLevelLabels[level as OfficeTitleLevel] ??
          sentenceCase(level.replace(/_/g, ' ')),
        value,
        fill: leadershipLevelColors[index % leadershipLevelColors.length],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    filledLeadershipSlots,
  );

  const formattedUpcomingEvents = upcomingEvents.slice(0, 5).map((event) => {
    const dayDiff = Math.max(
      Math.ceil((event.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    return {
      id: event.id,
      title: event.name,
      category: eventCategoryLabels[event.category] ?? sentenceCase(event.category.toLowerCase()),
      type: sentenceCase(event.type.toLowerCase()),
      location: event.location ?? event.onlineLink ?? 'TBA',
      startsAtLabel: format(event.startsAt, 'MMM d, yyyy • h:mm a'),
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
        detail:
          'Tracks total ministry events by scheduled start date across the selected reporting window.',
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
        detail:
          totalLeadershipSlots > 0
            ? `${leadershipCoverageRate}% of configured ministry leadership capacity is currently filled.`
            : 'No office title capacity has been configured yet.',
      },
    ],
  };
}

function buildTrendData(events: ReportEvent[], monthsToShow: number, now: Date): TrendPoint[] {
  const monthStarts = eachMonthOfInterval({
    start: startOfMonth(subMonths(now, monthsToShow - 1)),
    end: startOfMonth(now),
  });

  return monthStarts.map((monthStart) => {
    const total = events.filter((event) => isSameMonth(event.startsAt, monthStart));

    return {
      month: format(monthStart, 'MMM'),
      total: total.length,
      onsite: total.filter((event) => event.type === EventType.ONSITE).length,
      online: total.filter((event) => event.type === EventType.ONLINE).length,
      completed: total.filter((event) => event.status === EventStatus.COMPLETED).length,
    };
  });
}

function buildBreakdown(
  items: Array<{ label: string; value: number; fill?: string; detail?: string }>,
  total: number,
): BreakdownItem[] {
  return items.map((item) => ({
    ...item,
    percentage: total ? Math.round((item.value / total) * 100) : 0,
  }));
}

function sentenceCase(value: string) {
  return value
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/_/g, ' ');
}

function getSectionCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}
