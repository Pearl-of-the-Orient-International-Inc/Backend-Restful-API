import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import config from '@/config';
import {
  AccountingLedgerTransactionStatus,
  AccountingPayableStatus,
  AccountingReceivableStatus,
  EventStatus,
  EventType,
  MemberOnboardingStep,
  MemberStatus,
  NewsBlogStatus,
} from '@/generated/prisma/enums';
import { compareValue, hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  clearOwnerSessionCookie,
  setOwnerSessionCookie,
} from '@/middlewares/owner-access';
import type {
  OwnerChangePinSchema,
  OwnerLoginSchema,
} from '@/validators/owner-access';

const OWNER_CREDENTIAL_ID = 'owner';

const toNumber = (value: unknown) => Number(value ?? 0);

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

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const defaultDateRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: endOfDay(now),
  };
};

const startOfWeek = (date: Date) => {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nextDate.setDate(nextDate.getDate() + diff);
  return nextDate;
};

const endOfWeek = (date: Date) => {
  const nextDate = startOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  return endOfDay(nextDate);
};

const monthKey = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short' });

const buildOwnerTrend = ({
  members,
  events,
  now,
}: {
  members: Array<{
    status: MemberStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  events: Array<{ startsAt: Date }>;
  now: Date;
}) => {
  const monthStarts = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return month;
  });

  return monthStarts.map((monthStart) => {
    const monthEnd = endOfDay(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
    );

    return {
      month: monthKey(monthStart),
      applications: members.filter(
        (member) =>
          member.createdAt >= monthStart && member.createdAt <= monthEnd,
      ).length,
      approvals: members.filter(
        (member) =>
          member.isActive &&
          member.status === MemberStatus.APPROVED &&
          member.updatedAt >= monthStart &&
          member.updatedAt <= monthEnd,
      ).length,
      events: events.filter(
        (event) => event.startsAt >= monthStart && event.startsAt <= monthEnd,
      ).length,
    };
  });
};

const buildOwnerOnboardingBreakdown = (
  members: Array<{
    isActive: boolean;
    onboardingProgress: { currentStep: MemberOnboardingStep } | null;
  }>,
) => {
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
};

const buildCountBreakdown = <TItem>({
  items,
  getKey,
}: {
  items: TItem[];
  getKey: (item: TItem) => string | null | undefined;
}) => {
  const countMap = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
};

const buildCashflowTrend = (
  transactions: Array<{
    transactionDate: Date;
    debit: unknown;
    credit: unknown;
  }>,
) => {
  const trendMap = new Map<
    string,
    { label: string; income: number; expense: number; net: number }
  >();

  transactions.forEach((transaction) => {
    const label = transaction.transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const existing = trendMap.get(label) ?? {
      label,
      income: 0,
      expense: 0,
      net: 0,
    };

    existing.income += toNumber(transaction.debit);
    existing.expense += toNumber(transaction.credit);
    existing.net = existing.income - existing.expense;
    trendMap.set(label, existing);
  });

  return Array.from(trendMap.values());
};

const parseDateRange = (req: Request) => {
  const fallback = defaultDateRange();
  const fromValue = typeof req.query.from === 'string' ? req.query.from : null;
  const toValue = typeof req.query.to === 'string' ? req.query.to : null;
  const from = fromValue ? startOfDay(new Date(fromValue)) : fallback.from;
  const to = toValue ? endOfDay(new Date(toValue)) : fallback.to;

  return Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())
    ? fallback
    : { from, to };
};

const ensureOwnerCredential = async () => {
  const existing = await prisma.ownerAccessCredential.findUnique({
    where: { id: OWNER_CREDENTIAL_ID },
  });

  if (existing) return existing;

  const defaultPin = config.OWNER_DEFAULT_PIN?.trim();

  if (!defaultPin || !/^\d{6}$/.test(defaultPin)) {
    return null;
  }

  return prisma.ownerAccessCredential.create({
    data: {
      id: OWNER_CREDENTIAL_ID,
      pinHash: await hashValue(defaultPin),
    },
  });
};

export const loginOwner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { pin } = req.body as OwnerLoginSchema;
    const credential = await ensureOwnerCredential();

    if (!credential) {
      res.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
        code: 'OWNER_PIN_NOT_CONFIGURED',
        message:
          'Owner PIN is not configured. Add OWNER_DEFAULT_PIN or create an owner PIN credential.',
      });
      return;
    }

    const isPinValid = await compareValue(pin, credential.pinHash);

    if (!isPinValid) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid owner PIN.',
      });
      return;
    }

    await prisma.ownerAccessCredential.update({
      where: { id: OWNER_CREDENTIAL_ID },
      data: { lastLoginAt: new Date() },
    });

    setOwnerSessionCookie(res);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Owner access granted.',
      data: { authenticated: true, expiresInSeconds: 600 },
    });
  } catch (err) {
    logger.error('Owner PIN login failed', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getOwnerSession = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Owner session active.',
    data: { authenticated: true, expiresInSeconds: 600 },
  });
};

export const touchOwnerSession = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  setOwnerSessionCookie(res);
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Owner session refreshed.',
    data: { authenticated: true, expiresInSeconds: 600 },
  });
};

export const logoutOwner = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  clearOwnerSessionCookie(res);
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Owner session cleared.',
  });
};

export const changeOwnerPin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { currentPin, newPin } = req.body as OwnerChangePinSchema;
    const credential = await ensureOwnerCredential();

    if (!credential) {
      res.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
        code: 'OWNER_PIN_NOT_CONFIGURED',
        message: 'Owner PIN is not configured.',
      });
      return;
    }

    const isPinValid = await compareValue(currentPin, credential.pinHash);

    if (!isPinValid) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Current owner PIN is invalid.',
      });
      return;
    }

    await prisma.ownerAccessCredential.update({
      where: { id: OWNER_CREDENTIAL_ID },
      data: { pinHash: await hashValue(newPin) },
    });

    setOwnerSessionCookie(res);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Owner PIN updated.',
    });
  } catch (err) {
    logger.error('Owner PIN update failed', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getOwnerReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { from, to } = parseDateRange(req);
    const dateWhere = { gte: from, lte: to };
    const now = new Date();

    const [
      totalMembers,
      approvedMembers,
      pendingMembers,
      newMembers,
      eventsInRange,
      upcomingEvents,
      newsBlogs,
      receipts,
      receivables,
      payables,
      ledgerTransactions,
      analyticsMembers,
      analyticsEvents,
    ] = await Promise.all([
      prisma.member.count({ where: { isActive: true } }),
      prisma.member.count({
        where: { isActive: true, status: MemberStatus.APPROVED },
      }),
      prisma.member.count({
        where: { isActive: true, status: MemberStatus.PENDING },
      }),
      prisma.member.count({ where: { isActive: true, createdAt: dateWhere } }),
      prisma.event.findMany({
        where: { startsAt: dateWhere },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          name: true,
          startsAt: true,
          location: true,
          onlineLink: true,
          status: true,
          _count: { select: { attendees: true, taggedMembers: true } },
        },
      }),
      prisma.event.findMany({
        where: {
          status: { not: EventStatus.CANCELLED },
          startsAt: { gte: now },
        },
        orderBy: { startsAt: 'asc' },
        take: 6,
        select: {
          id: true,
          name: true,
          startsAt: true,
          location: true,
          onlineLink: true,
          status: true,
          _count: { select: { attendees: true, taggedMembers: true } },
        },
      }),
      prisma.newsBlog.findMany({
        where: { createdAt: dateWhere, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          publishedAt: true,
        },
      }),
      prisma.accountingAcknowledgementReceipt.findMany({
        where: { receiptDate: dateWhere },
        orderBy: { receiptDate: 'desc' },
        take: 8,
        select: {
          id: true,
          receiptNo: true,
          name: true,
          receiptDate: true,
          totalAmount: true,
        },
      }),
      prisma.accountingReceivable.findMany({
        where: {
          invoiceDate: dateWhere,
          status: {
            notIn: [
              AccountingReceivableStatus.DRAFT,
              AccountingReceivableStatus.CANCELLED,
            ],
          },
        },
        select: {
          id: true,
          invoiceNo: true,
          customer: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
      }),
      prisma.accountingPayable.findMany({
        where: {
          billDate: dateWhere,
          status: {
            notIn: [
              AccountingPayableStatus.DRAFT,
              AccountingPayableStatus.CANCELLED,
            ],
          },
        },
        select: {
          id: true,
          billNo: true,
          supplier: true,
          billDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
      }),
      prisma.accountingLedgerTransaction.findMany({
        where: {
          transactionDate: dateWhere,
          status: { not: AccountingLedgerTransactionStatus.VOID },
        },
        orderBy: { transactionDate: 'desc' },
        take: 10,
        select: {
          id: true,
          transactionNo: true,
          transactionDate: true,
          type: true,
          party: true,
          category: true,
          debit: true,
          credit: true,
          status: true,
        },
      }),
      prisma.member.findMany({
        select: {
          status: true,
          memberType: true,
          isActive: true,
          province: true,
          region: true,
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
          startsAt: true,
          category: true,
          status: true,
          type: true,
        },
      }),
    ]);

    const receiptTotal = receipts.reduce(
      (sum, receipt) => sum + toNumber(receipt.totalAmount),
      0,
    );
    const receivableTotal = receivables.reduce(
      (sum, item) => sum + toNumber(item.totalAmount),
      0,
    );
    const receivableCollected = receivables.reduce(
      (sum, item) => sum + toNumber(item.paidAmount),
      0,
    );
    const payableTotal = payables.reduce(
      (sum, item) => sum + toNumber(item.totalAmount),
      0,
    );
    const payablePaid = payables.reduce(
      (sum, item) => sum + toNumber(item.paidAmount),
      0,
    );
    const ledgerDebit = ledgerTransactions.reduce(
      (sum, item) => sum + toNumber(item.debit),
      0,
    );
    const ledgerCredit = ledgerTransactions.reduce(
      (sum, item) => sum + toNumber(item.credit),
      0,
    );
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const pendingAnalyticsMembers = analyticsMembers.filter(
      (member) => member.isActive && member.status === MemberStatus.PENDING,
    );
    const thisWeeksEvents = analyticsEvents.filter(
      (event) =>
        event.status !== EventStatus.CANCELLED &&
        event.startsAt >= weekStart &&
        event.startsAt <= weekEnd,
    );

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Owner report retrieved successfully',
      data: {
        range: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        summary: {
          totalMembers,
          approvedMembers,
          pendingMembers,
          urgentPendingApplications: pendingAnalyticsMembers.filter(
            (member) =>
              member.createdAt <= new Date(now.getTime() - 7 * 86_400_000),
          ).length,
          newMembers,
          thisWeeksEvents: thisWeeksEvents.length,
          onlineEventsThisWeek: thisWeeksEvents.filter(
            (event) => event.type === EventType.ONLINE,
          ).length,
          eventsInRange: eventsInRange.length,
          completedEvents: eventsInRange.filter(
            (event) => event.status === EventStatus.COMPLETED,
          ).length,
          publishedPosts: newsBlogs.filter(
            (post) => post.status === NewsBlogStatus.PUBLISHED,
          ).length,
          draftPosts: newsBlogs.filter(
            (post) => post.status === NewsBlogStatus.DRAFT,
          ).length,
          receiptTotal,
          receivableTotal,
          receivableCollected,
          receivableBalance: Math.max(receivableTotal - receivableCollected, 0),
          payableTotal,
          payablePaid,
          payableBalance: Math.max(payableTotal - payablePaid, 0),
          ledgerDebit,
          ledgerCredit,
          netCashflow: ledgerDebit - ledgerCredit,
        },
        membershipTrend: buildOwnerTrend({
          members: analyticsMembers,
          events: analyticsEvents,
          now,
        }),
        onboardingBreakdown: buildOwnerOnboardingBreakdown(analyticsMembers),
        breakdowns: {
          membersByStatus: buildCountBreakdown({
            items: analyticsMembers.filter((member) => member.isActive),
            getKey: (member) => member.status,
          }),
          membersByType: buildCountBreakdown({
            items: analyticsMembers.filter((member) => member.isActive),
            getKey: (member) => member.memberType,
          }),
          topMemberLocations: buildCountBreakdown({
            items: analyticsMembers.filter((member) => member.isActive),
            getKey: (member) => member.province ?? member.region ?? 'Unknown',
          }).slice(0, 8),
          eventsByStatus: buildCountBreakdown({
            items: analyticsEvents,
            getKey: (event) => event.status,
          }),
          eventsByCategory: buildCountBreakdown({
            items: analyticsEvents,
            getKey: (event) => event.category,
          }),
          newsByStatus: buildCountBreakdown({
            items: newsBlogs,
            getKey: (post) => post.status,
          }),
        },
        cashflowTrend: buildCashflowTrend(ledgerTransactions),
        events: {
          inRange: eventsInRange.map((event) => ({
            ...event,
            startsAt: event.startsAt.toISOString(),
            attendeeCount: Math.max(
              event._count.attendees,
              event._count.taggedMembers,
            ),
            location: event.location ?? event.onlineLink ?? 'TBA',
          })),
          upcoming: upcomingEvents.map((event) => ({
            ...event,
            startsAt: event.startsAt.toISOString(),
            attendeeCount: Math.max(
              event._count.attendees,
              event._count.taggedMembers,
            ),
            location: event.location ?? event.onlineLink ?? 'TBA',
          })),
        },
        newsBlogs: newsBlogs.map((post) => ({
          ...post,
          createdAt: post.createdAt.toISOString(),
          publishedAt: post.publishedAt?.toISOString() ?? null,
        })),
        accounting: {
          receipts: receipts.map((receipt) => ({
            ...receipt,
            receiptDate: receipt.receiptDate.toISOString(),
            totalAmount: toNumber(receipt.totalAmount),
          })),
          receivables: receivables.slice(0, 8).map((item) => ({
            ...item,
            invoiceDate: item.invoiceDate.toISOString(),
            dueDate: item.dueDate.toISOString(),
            totalAmount: toNumber(item.totalAmount),
            paidAmount: toNumber(item.paidAmount),
            balance: Math.max(
              toNumber(item.totalAmount) - toNumber(item.paidAmount),
              0,
            ),
          })),
          payables: payables.slice(0, 8).map((item) => ({
            ...item,
            billDate: item.billDate.toISOString(),
            dueDate: item.dueDate.toISOString(),
            totalAmount: toNumber(item.totalAmount),
            paidAmount: toNumber(item.paidAmount),
            balance: Math.max(
              toNumber(item.totalAmount) - toNumber(item.paidAmount),
              0,
            ),
          })),
          ledgerTransactions: ledgerTransactions.map((item) => ({
            ...item,
            transactionDate: item.transactionDate.toISOString(),
            debit: toNumber(item.debit),
            credit: toNumber(item.credit),
          })),
        },
      },
    });
  } catch (err) {
    logger.error('Owner report retrieval failed', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
