import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ChaplainServiceBookingStatus,
  ChaplainServiceCommissionStatus,
  MemberStatus,
  MemberType,
} from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { chaplainServiceBookingStatusEmail } from '@/mailers/templates/chaplain-service-booking-status';
import type { UpdateChaplainServiceBookingStatusBody } from '@/validators/chaplain-service';
import type { UpdateChaplainServiceBookingFinancialsBody } from '@/validators/chaplain-service';

const bookingInclude = {
  service: { select: { id: true, name: true, commissionPercent: true } },
  providerMember: {
    select: {
      id: true,
      uniqueId: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      extensionName: true,
    },
  },
  requesterUser: { select: { id: true, name: true, email: true } },
  history: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ChaplainServiceBookingInclude;

type BookingRecord = Prisma.ChaplainServiceBookingGetPayload<{
  include: typeof bookingInclude;
}>;

const serializeBooking = (booking: BookingRecord) => ({
  ...booking,
  providerServiceFee:
    booking.providerServiceFee === null
      ? null
      : Number(booking.providerServiceFee),
  providerCommissionAmount:
    booking.providerCommissionAmount === null
      ? null
      : Number(booking.providerCommissionAmount),
  service: {
    ...booking.service,
    commissionPercent:
      booking.service.commissionPercent === null
        ? null
        : Number(booking.service.commissionPercent),
  },
});

const getProviderName = (booking: BookingRecord) =>
  [
    booking.providerMember.firstName,
    booking.providerMember.middleInitial,
    booking.providerMember.lastName,
    booking.providerMember.extensionName,
  ]
    .filter(Boolean)
    .join(' ');

const notifyRequester = async (booking: BookingRecord) => {
  const email = chaplainServiceBookingStatusEmail({
    requesterName: booking.requesterName,
    serviceName: booking.service.name,
    chaplainName: getProviderName(booking),
    preferredAt: booking.preferredAt,
    status: booking.status,
    reason: booking.statusReason,
  });
  const result = await sendMail({
    sendTo: booking.requesterEmail,
    ...email,
  });
  if (!result.success) {
    logger.warn('Booking status was updated but requester notification failed', {
      bookingId: booking.id,
      status: booking.status,
      requesterEmail: booking.requesterEmail,
    });
  }
};

const getBookingId = (req: Request) => {
  const id = req.params.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
};

const providerForUser = (userId?: string) => {
  if (!userId) return null;
  return prisma.member.findFirst({
    where: {
      userId,
      isActive: true,
      status: MemberStatus.APPROVED,
      memberType: MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
    },
    select: { id: true },
  });
};

export const getAdminChaplainServiceBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as ChaplainServiceBookingStatus)
        : undefined;
    const bookings = await prisma.chaplainServiceBooking.findMany({
      where: status ? { status } : undefined,
      include: bookingInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Chaplain service bookings retrieved successfully',
      data: bookings.map(serializeBooking),
    });
  } catch (err) {
    logger.error('Error while retrieving admin chaplain service bookings', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const getCurrentProviderChaplainServiceBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const provider = await providerForUser(req.userId);
    if (!provider) {
      res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only eligible service chaplains can review booking requests' });
      return;
    }
    const bookings = await prisma.chaplainServiceBooking.findMany({
      where: { providerMemberId: provider.id },
      include: bookingInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Your service bookings were retrieved successfully', data: bookings.map(serializeBooking) });
  } catch (err) {
    logger.error('Error while retrieving provider chaplain service bookings', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

const updateBookingStatus = async ({
  bookingId,
  actorUserId,
  providerMemberId,
  actor,
  body,
}: {
  bookingId: string;
  actorUserId?: string;
  providerMemberId?: string;
  actor: 'ADMIN' | 'PROVIDER';
  body: UpdateChaplainServiceBookingStatusBody;
}) =>
  prisma.$transaction(async (tx) => {
    const booking = await tx.chaplainServiceBooking.findFirst({
      where: {
        id: bookingId,
        ...(providerMemberId ? { providerMemberId } : {}),
      },
      include: { service: true },
    });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (!booking.service.isActive) throw new Error('SERVICE_UNAVAILABLE');

    const adminTransitions: Record<
      ChaplainServiceBookingStatus,
      ChaplainServiceBookingStatus[]
    > = {
      PENDING: [
        ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
        ChaplainServiceBookingStatus.RESCHEDULED,
        ChaplainServiceBookingStatus.REJECTED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      AWAITING_CHAPLAIN_APPROVAL: [
        ChaplainServiceBookingStatus.RESCHEDULED,
        ChaplainServiceBookingStatus.REJECTED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      RESCHEDULED: [
        ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
        ChaplainServiceBookingStatus.RESCHEDULED,
        ChaplainServiceBookingStatus.REJECTED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      CONFIRMED: [
        ChaplainServiceBookingStatus.RESCHEDULED,
        ChaplainServiceBookingStatus.COMPLETED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    const providerTransitions: Record<
      ChaplainServiceBookingStatus,
      ChaplainServiceBookingStatus[]
    > = {
      PENDING: [],
      AWAITING_CHAPLAIN_APPROVAL: [
        ChaplainServiceBookingStatus.CONFIRMED,
        ChaplainServiceBookingStatus.REJECTED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      RESCHEDULED: [
        ChaplainServiceBookingStatus.CONFIRMED,
        ChaplainServiceBookingStatus.REJECTED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      CONFIRMED: [
        ChaplainServiceBookingStatus.COMPLETED,
        ChaplainServiceBookingStatus.CANCELLED,
      ],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    const allowedTransitions =
      actor === 'ADMIN' ? adminTransitions : providerTransitions;
    if (!allowedTransitions[booking.status].includes(body.status)) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const preferredAt = body.preferredAt
      ? new Date(body.preferredAt)
      : booking.preferredAt;
    if (preferredAt <= new Date() && body.status !== 'COMPLETED') {
      throw new Error('SCHEDULE_IN_PAST');
    }

    if (
      body.status === ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL ||
      body.status === ChaplainServiceBookingStatus.CONFIRMED ||
      body.status === ChaplainServiceBookingStatus.RESCHEDULED
    ) {
      const [availability, conflict, serviceBookingCount, resourceBookingCount, resourceConfiguration] = await Promise.all([
        tx.chaplainServiceAvailability.findFirst({
          where: {
            memberId: booking.providerMemberId,
            startsAt: { lte: preferredAt },
            endsAt: { gt: preferredAt },
          },
          select: { id: true },
        }),
        tx.chaplainServiceBooking.findFirst({
          where: {
            id: { not: booking.id },
            providerMemberId: booking.providerMemberId,
            preferredAt,
            status: ChaplainServiceBookingStatus.CONFIRMED,
          },
          select: { id: true },
        }),
        tx.chaplainServiceBooking.count({
          where: {
            id: { not: booking.id },
            serviceId: booking.serviceId,
            preferredAt,
            status: ChaplainServiceBookingStatus.CONFIRMED,
          },
        }),
        booking.service.sharedResourceKey
          ? tx.chaplainServiceBooking.count({
              where: {
                id: { not: booking.id },
                preferredAt,
                status: ChaplainServiceBookingStatus.CONFIRMED,
                service: {
                  sharedResourceKey: booking.service.sharedResourceKey,
                },
              },
            })
          : Promise.resolve(0),
        booking.service.sharedResourceKey
          ? tx.chaplainService.aggregate({
              where: { sharedResourceKey: booking.service.sharedResourceKey },
              _min: { sharedResourceCapacity: true },
            })
          : Promise.resolve({ _min: { sharedResourceCapacity: null } }),
      ]);
      if (!availability) throw new Error('PROVIDER_UNAVAILABLE');
      if (conflict) throw new Error('BOOKING_CONFLICT');
      if (serviceBookingCount >= booking.service.maxConcurrentBookings) {
        throw new Error('SERVICE_CAPACITY_REACHED');
      }
      if (
        booking.service.sharedResourceKey &&
        resourceBookingCount >= (resourceConfiguration._min.sharedResourceCapacity ?? 1)
      ) {
        throw new Error('SHARED_RESOURCE_UNAVAILABLE');
      }
    }

    const fee = body.providerServiceFee ??
      (booking.providerServiceFee === null
        ? null
        : Number(booking.providerServiceFee));
    const commissionPercent =
      booking.service.commissionPercent === null
        ? null
        : Number(booking.service.commissionPercent);
    const commissionAmount =
      fee !== null && commissionPercent !== null
        ? Number(((fee * commissionPercent) / 100).toFixed(2))
        : null;

    return tx.chaplainServiceBooking.update({
      where: { id: booking.id },
      data: {
        status: body.status,
        statusReason: body.reason?.trim() || null,
        preferredAt,
        ...(typeof body.providerServiceFee === 'number'
          ? {
              providerServiceFee: body.providerServiceFee,
              providerCommissionAmount: commissionAmount,
              providerCommissionStatus:
                commissionAmount === null
                  ? ChaplainServiceCommissionStatus.NOT_APPLICABLE
                  : ChaplainServiceCommissionStatus.PENDING,
            }
          : {}),
        history: {
          create: {
            status: body.status,
            reason: body.reason?.trim() || null,
            changedByUserId: actorUserId ?? null,
          },
        },
      },
      include: bookingInclude,
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

const respondToStatusUpdate = async (
  req: Request,
  res: Response,
  actor: 'ADMIN' | 'PROVIDER',
  providerMemberId?: string,
) => {
  const bookingId = getBookingId(req);
  if (!bookingId) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Booking ID is required' });
    return;
  }
  try {
    const booking = await updateBookingStatus({
      bookingId,
      actorUserId: req.userId,
      providerMemberId,
      actor,
      body: req.body as UpdateChaplainServiceBookingStatusBody,
    });
    await notifyRequester(booking);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking status updated successfully', data: serializeBooking(booking) });
  } catch (err) {
    const known: Record<string, { status: number; message: string }> = {
      BOOKING_NOT_FOUND: { status: HTTPSTATUS.NOT_FOUND, message: 'Booking request not found' },
      SERVICE_UNAVAILABLE: { status: HTTPSTATUS.CONFLICT, message: 'This service is currently unavailable' },
      SCHEDULE_IN_PAST: { status: HTTPSTATUS.CONFLICT, message: 'A past appointment cannot be approved or rescheduled' },
      PROVIDER_UNAVAILABLE: { status: HTTPSTATUS.CONFLICT, message: 'The chaplain is not available at this schedule' },
      BOOKING_CONFLICT: { status: HTTPSTATUS.CONFLICT, message: 'The chaplain already has a confirmed booking at this schedule' },
      SERVICE_CAPACITY_REACHED: { status: HTTPSTATUS.CONFLICT, message: 'This service has reached its confirmed-booking capacity for the selected schedule' },
      SHARED_RESOURCE_UNAVAILABLE: { status: HTTPSTATUS.CONFLICT, message: 'The shared resource assigned to this service is unavailable for the selected schedule' },
      INVALID_STATUS_TRANSITION: { status: HTTPSTATUS.CONFLICT, message: 'This action is not permitted for the current booking status' },
      P2034: { status: HTTPSTATUS.CONFLICT, message: 'Another booking changed this schedule. Refresh and try again.' },
    };
    const errorCode = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.message : '';
    const match = known[errorCode];
    if (match) {
      res.status(match.status).json({ code: errorCode, message: match.message });
      return;
    }
    logger.error('Error while updating chaplain service booking status', { err, bookingId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const updateAdminChaplainServiceBookingStatus = async (req: Request, res: Response): Promise<void> =>
  respondToStatusUpdate(req, res, 'ADMIN');

export const updateCurrentProviderChaplainServiceBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const provider = await providerForUser(req.userId);
  if (!provider) {
    res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only eligible service chaplains can manage booking requests' });
    return;
  }
  await respondToStatusUpdate(req, res, 'PROVIDER', provider.id);
};

export const getCurrentRequesterChaplainServiceBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication is required' });
      return;
    }
    const bookings = await prisma.chaplainServiceBooking.findMany({
      where: { requesterUserId: req.userId },
      include: bookingInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Your bookings were retrieved successfully', data: bookings.map(serializeBooking) });
  } catch (err) {
    logger.error('Error while retrieving requester bookings', { err, userId: req.userId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const cancelCurrentRequesterChaplainServiceBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bookingId = getBookingId(req);
  if (!bookingId || !req.userId) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'A valid booking and authenticated user are required' });
    return;
  }
  try {
    const reason = String(req.body.reason).trim();
    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.chaplainServiceBooking.findFirst({
        where: { id: bookingId, requesterUserId: req.userId },
        select: { id: true, status: true },
      });
      if (!current) throw new Error('BOOKING_NOT_FOUND');
      const cancellableStatuses: ChaplainServiceBookingStatus[] = [
        ChaplainServiceBookingStatus.PENDING,
        ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
        ChaplainServiceBookingStatus.RESCHEDULED,
        ChaplainServiceBookingStatus.CONFIRMED,
      ];
      if (!cancellableStatuses.includes(current.status)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }
      return tx.chaplainServiceBooking.update({
        where: { id: current.id },
        data: {
          status: ChaplainServiceBookingStatus.CANCELLED,
          statusReason: reason,
          history: { create: { status: ChaplainServiceBookingStatus.CANCELLED, reason, changedByUserId: req.userId } },
        },
        include: bookingInclude,
      });
    });
    await notifyRequester(booking);
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking cancelled successfully', data: serializeBooking(booking) });
  } catch (err) {
    if (err instanceof Error && err.message === 'BOOKING_NOT_FOUND') {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Booking request not found' });
      return;
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
      res.status(HTTPSTATUS.CONFLICT).json({ code: 'INVALID_STATUS_TRANSITION', message: 'This booking can no longer be cancelled' });
      return;
    }
    logger.error('Error while cancelling requester booking', { err, bookingId, userId: req.userId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const updateAdminChaplainServiceBookingFinancials = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bookingId = getBookingId(req);
  if (!bookingId) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Booking ID is required' });
    return;
  }
  try {
    const body = req.body as UpdateChaplainServiceBookingFinancialsBody;
    const current = await prisma.chaplainServiceBooking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });
    if (!current) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Booking request not found' });
      return;
    }
    const fee = body.providerServiceFee === undefined
      ? (current.providerServiceFee === null ? null : Number(current.providerServiceFee))
      : body.providerServiceFee;
    const percentage = current.service.commissionPercent === null
      ? null
      : Number(current.service.commissionPercent);
    const commissionAmount = fee !== null && fee > 0 && percentage !== null
      ? Number(((fee * percentage) / 100).toFixed(2))
      : null;
    const booking = await prisma.chaplainServiceBooking.update({
      where: { id: bookingId },
      data: {
        ...(body.providerServiceFee !== undefined ? { providerServiceFee: body.providerServiceFee } : {}),
        providerCommissionAmount: commissionAmount,
        requesterPaymentStatus: body.requesterPaymentStatus ?? (fee !== null && fee > 0 ? current.requesterPaymentStatus === 'NOT_REQUIRED' ? 'PENDING' : current.requesterPaymentStatus : 'NOT_REQUIRED'),
        providerCommissionStatus: body.providerCommissionStatus ?? (commissionAmount !== null && commissionAmount > 0 ? current.providerCommissionStatus === 'NOT_APPLICABLE' ? 'PENDING' : current.providerCommissionStatus : 'NOT_APPLICABLE'),
      },
      include: bookingInclude,
    });
    if (body.providerServiceFee !== undefined || body.requesterPaymentStatus !== undefined) {
      const paymentLabel = booking.requesterPaymentStatus.replace(/_/g, ' ').toLowerCase();
      const feeLabel = booking.providerServiceFee === null
        ? 'No service fee is required.'
        : `The recorded service fee is PHP ${Number(booking.providerServiceFee).toFixed(2)}.`;
      await sendMail({
        sendTo: booking.requesterEmail,
        subject: `Booking payment updated - ${booking.service.name}`,
        text: `Hello ${booking.requesterName},\n\n${feeLabel} The payment status for your ${booking.service.name} booking is now ${paymentLabel}.\n\nPearl of the Orient International Auxiliary Chaplain Values Educators Inc.`,
      });
    }
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking financial status updated successfully', data: serializeBooking(booking) });
  } catch (err) {
    logger.error('Error while updating booking financials', { err, bookingId });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
