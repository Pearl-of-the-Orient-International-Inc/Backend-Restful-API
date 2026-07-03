import config from '@/config';
import { UserAccountStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMembershipRenewalEmail } from '@/lib/member-renewal-email';

const MIN_INTERVAL_MS = 60_000;
const MEMBERSHIP_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

let membershipRenewalSchedulerTimer: NodeJS.Timeout | null = null;

const resolveIntervalMs = () => {
  const rawInterval = Number(config.MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS);

  if (!Number.isFinite(rawInterval) || rawInterval < MIN_INTERVAL_MS) {
    return MIN_INTERVAL_MS;
  }

  return rawInterval;
};

const runMembershipRenewalSchedulerTick = async () => {
  const renewalCutoff = new Date(Date.now() - MEMBERSHIP_VALIDITY_MS);

  try {
    const expiredMembers = await prisma.member.findMany({
      where: {
        isActive: true,
        createdAt: {
          lte: renewalCutoff,
        },
        user: {
          accountStatus: UserAccountStatus.ACTIVE,
        },
      },
      select: {
        id: true,
        uniqueId: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        createdAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (expiredMembers.length === 0) {
      return;
    }

    await prisma.member.updateMany({
      where: {
        id: {
          in: expiredMembers.map((member) => member.id),
        },
      },
      data: {
        isActive: false,
      },
    });

    await Promise.all(
      expiredMembers.map(async (member) => {
        const result = await sendMembershipRenewalEmail(member);

        if (!result.success) {
          logger.warn('Membership renewal email failed', {
            memberId: member.id,
            email: member.user.email,
          });
        }
      }),
    );

    logger.info('Membership renewal scheduler processed expired members', {
      count: expiredMembers.length,
      renewalCutoff,
    });
  } catch (error) {
    logger.error('Membership renewal scheduler tick failed', { error });
  }
};

export const startMembershipRenewalScheduler = () => {
  if (membershipRenewalSchedulerTimer) {
    return;
  }

  const intervalMs = resolveIntervalMs();

  void runMembershipRenewalSchedulerTick();

  membershipRenewalSchedulerTimer = setInterval(() => {
    void runMembershipRenewalSchedulerTick();
  }, intervalMs);

  logger.info(`Membership renewal scheduler started with ${intervalMs}ms interval`);
};

export const stopMembershipRenewalScheduler = () => {
  if (!membershipRenewalSchedulerTimer) {
    return;
  }

  clearInterval(membershipRenewalSchedulerTimer);
  membershipRenewalSchedulerTimer = null;
  logger.info('Membership renewal scheduler stopped');
};
