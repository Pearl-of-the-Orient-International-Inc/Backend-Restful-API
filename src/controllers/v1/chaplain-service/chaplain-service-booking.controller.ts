import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ChaplainServiceBookingStatus,
  MemberStatus,
  MemberType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { chaplainServiceBookingStatusEmail } from '@/mailers/templates/chaplain-service-booking-status';
import type { CreateChaplainServiceBookingBody } from '@/validators/chaplain-service';

export const createPublicChaplainServiceBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateChaplainServiceBookingBody;
    const requestedAt = new Date(body.preferredAt);

    const booking = await prisma.$transaction(async (tx) => {
      const [service, provider, availability] = await Promise.all([
        tx.chaplainService.findFirst({
          where: { id: body.serviceId, isActive: true },
          select: { id: true, name: true },
        }),
        tx.member.findFirst({
          where: {
            id: body.providerMemberId,
            isActive: true,
            status: MemberStatus.APPROVED,
            memberType:
              MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
          },
          select: { id: true },
        }),
        tx.chaplainServiceAvailability.findFirst({
          where: {
            id: body.availabilitySlotId,
            memberId: body.providerMemberId,
            startsAt: { gt: new Date() },
          },
          select: { id: true, startsAt: true, endsAt: true },
        }),
      ]);

      if (!service) throw new Error('SERVICE_UNAVAILABLE');
      if (!provider) throw new Error('PROVIDER_UNAVAILABLE');
      if (!availability) throw new Error('AVAILABILITY_UNAVAILABLE');
      if (availability.startsAt.getTime() !== requestedAt.getTime()) {
        throw new Error('AVAILABILITY_MISMATCH');
      }

      return tx.chaplainServiceBooking.create({
        data: {
          serviceId: service.id,
          providerMemberId: provider.id,
          requesterUserId: req.userId ?? null,
          requesterName: body.requesterName.trim(),
          requesterEmail: body.requesterEmail.trim().toLowerCase(),
          requesterPhone: body.requesterPhone.trim(),
          preferredAt: availability.startsAt,
          deliveryMethod: body.deliveryMethod,
          locationDetails: body.locationDetails.trim(),
          notes: body.notes?.trim() || null,
          history: {
            create: {
              status: ChaplainServiceBookingStatus.PENDING,
              reason: 'Booking request submitted',
              changedByUserId: req.userId ?? null,
            },
          },
        },
        select: {
          id: true,
          preferredAt: true,
          status: true,
          deliveryMethod: true,
          locationDetails: true,
          createdAt: true,
          service: { select: { id: true, name: true } },
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
          requesterName: true,
          requesterEmail: true,
        },
      });
    });

    const chaplainName = [
      booking.providerMember.firstName,
      booking.providerMember.middleInitial,
      booking.providerMember.lastName,
      booking.providerMember.extensionName,
    ]
      .filter(Boolean)
      .join(' ');
    const email = chaplainServiceBookingStatusEmail({
      requesterName: booking.requesterName,
      serviceName: booking.service.name,
      chaplainName,
      preferredAt: booking.preferredAt,
      status: booking.status,
    });
    await sendMail({ sendTo: booking.requesterEmail, ...email });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Appointment request submitted successfully',
      data: booking,
    });
  } catch (err) {
    if (err instanceof Error) {
      const errors: Record<string, { status: number; message: string }> = {
        SERVICE_UNAVAILABLE: {
          status: HTTPSTATUS.CONFLICT,
          message: 'The selected service is no longer available',
        },
        PROVIDER_UNAVAILABLE: {
          status: HTTPSTATUS.CONFLICT,
          message: 'The selected chaplain is no longer eligible for bookings',
        },
        AVAILABILITY_UNAVAILABLE: {
          status: HTTPSTATUS.CONFLICT,
          message: 'The selected availability is no longer available',
        },
        AVAILABILITY_MISMATCH: {
          status: HTTPSTATUS.BAD_REQUEST,
          message: 'The selected date and time do not match the availability',
        },
      };
      const known = errors[err.message];
      if (known) {
        res.status(known.status).json({ code: err.message, message: known.message });
        return;
      }
    }

    logger.error('Error while creating chaplain service booking', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
