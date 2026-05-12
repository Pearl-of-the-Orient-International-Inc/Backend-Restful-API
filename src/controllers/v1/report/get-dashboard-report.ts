import {
  addDays,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';

import { HTTPSTATUS } from '@/common/http-codes';
import {
  EventCategory,
  EventStatus,
  EventType,
  MemberOnboardingStep,
  MemberStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

type DashboardSummary = {
  totalMembers: number;
  approvedMembers: number;
  pendingApplications: number;
  urgentPendingApplications: number;
  thisWeeksEvents: number;
  onlineEventsThisWeek: number;
};

type DashboardTrendPoint = {
  month: string;
  applications: number;
  approvals: number;
  events: number;
};

type DashboardOnboardingItem = {
  label: string;
  value: number;
  percentage: number;
  fill: string;
};

type DashboardCalendarEvent = {
  id: string;
  title: string;
  category: EventCategory;
  type: EventType;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
};

type DashboardUpcomingEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  type: EventType;
  category: EventCategory;
  attendees: number;
  location: string;
};

type DashboardReportData = {
  summary: DashboardSummary;
  membershipTrend: DashboardTrendPoint[];
  onboardingBreakdown: DashboardOnboardingItem[];
  calendarEvents: DashboardCalendarEvent[];
  upcomingEvents: DashboardUpcomingEvent[];
};

type DashboardMember = {
  status: MemberStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  onboardingProgress: {
    currentStep: MemberOnboardingStep;
  } | null;
};

type DashboardEvent = {
  id: string;
  name: string;
  category: EventCategory;
  type: EventType;
  status: EventStatus;
  description: string;
  location: string | null;
  onlineLink: string | null;
  organizer: string;
  startsAt: Date;
  endsAt: Date;
  _count: {
    attendees: number;
    taggedMembers: number;
  };
};

const onboardingStageConfig: Array<{
  step: MemberOnboardingStep;
  label: string;
  fill: string;
}> = [
  {
    step: MemberOnboardingStep.PRE_ORIENTATION,
    label: 'Pre-orientation',
    fill: '#0ea5e9',
  },
  {
    step: MemberOnboardingStep.PAYMENT_CHECKOUT,
    label: 'Payment checkout',
    fill: '#f59e0b',
  },
  {
    step: MemberOnboardingStep.ONLINE_INTERVIEW,
    label: 'Online interview',
    fill: '#8b5cf6',
  },
  {
    step: MemberOnboardingStep.ID_GENERATION,
    label: 'ID generation',
    fill: '#10b981',
  },
  {
    step: MemberOnboardingStep.CHAPLAINCY_101,
    label: 'Chaplaincy training',
    fill: '#ef4444',
  },
];

export const getDashboardReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedMonths = parseInt(req.query.months as string, 10);
    const monthsToShow = Number.isNaN(parsedMonths) ? 6 : parsedMonths;

    const [members, events] = await Promise.all([
      prisma.member.findMany({
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
      prisma.event.findMany({
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

    logger.info('Dashboard report retrieved', {
      approvedMembers: report.summary.totalMembers,
      pendingApplications: report.summary.pendingApplications,
      thisWeeksEvents: report.summary.thisWeeksEvents,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Dashboard report retrieved successfully',
      data: report,
    });
  } catch (err) {
    logger.error('Error while getting dashboard report', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

function buildDashboardReport({
  members,
  events,
  monthsToShow,
}: {
  members: DashboardMember[];
  events: DashboardEvent[];
  monthsToShow: number;
}): DashboardReportData {
  const now = new Date();
  const approvedMembers = members.filter(
    (member) => member.isActive && member.status === MemberStatus.APPROVED,
  );
  const pendingMembers = members.filter(
    (member) => member.isActive && member.status === MemberStatus.PENDING,
  );
  const urgentPendingApplications = pendingMembers.filter((member) =>
    member.createdAt <= subDays(now, 7),
  ).length;

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeeksEvents = events.filter(
    (event) =>
      event.status !== EventStatus.CANCELLED &&
      isWithinInterval(event.startsAt, { start: weekStart, end: weekEnd }),
  );

  return {
    summary: {
      totalMembers: approvedMembers.length,
      approvedMembers: approvedMembers.length,
      pendingApplications: pendingMembers.length,
      urgentPendingApplications,
      thisWeeksEvents: thisWeeksEvents.length,
      onlineEventsThisWeek: thisWeeksEvents.filter(
        (event) => event.type === EventType.ONLINE,
      ).length,
    },
    membershipTrend: buildMembershipTrend(members, events, monthsToShow, now),
    onboardingBreakdown: buildOnboardingBreakdown(members),
    calendarEvents: events.map((event) => ({
      id: event.id,
      title: event.name,
      category: event.category,
      type: event.type,
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      date: format(event.startsAt, 'yyyy-MM-dd'),
      time: `${format(event.startsAt, 'h:mm a')} - ${format(event.endsAt, 'h:mm a')}`,
      location: event.location ?? event.onlineLink ?? 'TBA',
      organizer: event.organizer,
    })),
    upcomingEvents: events
      .filter(
        (event) =>
          event.status !== EventStatus.CANCELLED &&
          event.startsAt >= now &&
          event.startsAt <= addDays(now, 45),
      )
      .slice(0, 5)
      .map((event) => ({
        id: event.id,
        title: event.name,
        description: event.description,
        startsAt: event.startsAt.toISOString(),
        type: event.type,
        category: event.category,
        attendees: Math.max(event._count.attendees, event._count.taggedMembers),
        location: event.location ?? event.onlineLink ?? 'TBA',
      })),
  };
}

function buildMembershipTrend(
  members: DashboardMember[],
  events: DashboardEvent[],
  monthsToShow: number,
  now: Date,
): DashboardTrendPoint[] {
  const monthStarts = eachMonthOfInterval({
    start: startOfMonth(subMonths(now, monthsToShow - 1)),
    end: startOfMonth(now),
  });

  return monthStarts.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);

    return {
      month: format(monthStart, 'MMM'),
      applications: members.filter((member) =>
        isWithinInterval(member.createdAt, { start: monthStart, end: monthEnd }),
      ).length,
      approvals: members.filter(
        (member) =>
          member.isActive &&
          member.status === MemberStatus.APPROVED &&
          isWithinInterval(member.updatedAt, { start: monthStart, end: monthEnd }),
      ).length,
      events: events.filter((event) =>
        isWithinInterval(event.startsAt, { start: monthStart, end: monthEnd }),
      ).length,
    };
  });
}

function buildOnboardingBreakdown(members: DashboardMember[]): DashboardOnboardingItem[] {
  const activeMembers = members.filter((member) => member.isActive);
  const total = activeMembers.length;

  return onboardingStageConfig.map((stage) => {
    const value = activeMembers.filter(
      (member) => member.onboardingProgress?.currentStep === stage.step,
    ).length;

    return {
      label: stage.label,
      value,
      percentage: total ? Math.round((value / total) * 100) : 0,
      fill: stage.fill,
    };
  });
}
