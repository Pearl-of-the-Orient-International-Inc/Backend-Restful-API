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
exports.createPublicChaplainServiceBooking = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const mailers_1 = require("@/mailers");
const chaplain_service_booking_status_1 = require("@/mailers/templates/chaplain-service-booking-status");
const createPublicChaplainServiceBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const requestedAt = new Date(body.preferredAt);
        const booking = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const [service, provider, availability] = yield Promise.all([
                tx.chaplainService.findFirst({
                    where: { id: body.serviceId, isActive: true },
                    select: { id: true, name: true },
                }),
                tx.member.findFirst({
                    where: {
                        id: body.providerMemberId,
                        isActive: true,
                        status: enums_1.MemberStatus.APPROVED,
                        memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
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
            if (!service)
                throw new Error('SERVICE_UNAVAILABLE');
            if (!provider)
                throw new Error('PROVIDER_UNAVAILABLE');
            if (!availability)
                throw new Error('AVAILABILITY_UNAVAILABLE');
            if (availability.startsAt.getTime() !== requestedAt.getTime()) {
                throw new Error('AVAILABILITY_MISMATCH');
            }
            return tx.chaplainServiceBooking.create({
                data: {
                    serviceId: service.id,
                    providerMemberId: provider.id,
                    requesterUserId: (_a = req.userId) !== null && _a !== void 0 ? _a : null,
                    requesterName: body.requesterName.trim(),
                    requesterEmail: body.requesterEmail.trim().toLowerCase(),
                    requesterPhone: body.requesterPhone.trim(),
                    preferredAt: availability.startsAt,
                    deliveryMethod: body.deliveryMethod,
                    locationDetails: body.locationDetails.trim(),
                    notes: ((_b = body.notes) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                    history: {
                        create: {
                            status: enums_1.ChaplainServiceBookingStatus.PENDING,
                            reason: 'Booking request submitted',
                            changedByUserId: (_c = req.userId) !== null && _c !== void 0 ? _c : null,
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
        }));
        const chaplainName = [
            booking.providerMember.firstName,
            booking.providerMember.middleInitial,
            booking.providerMember.lastName,
            booking.providerMember.extensionName,
        ]
            .filter(Boolean)
            .join(' ');
        const email = (0, chaplain_service_booking_status_1.chaplainServiceBookingStatusEmail)({
            requesterName: booking.requesterName,
            serviceName: booking.service.name,
            chaplainName,
            preferredAt: booking.preferredAt,
            status: booking.status,
        });
        yield (0, mailers_1.sendMail)(Object.assign({ sendTo: booking.requesterEmail }, email));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Appointment request submitted successfully',
            data: booking,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            const errors = {
                SERVICE_UNAVAILABLE: {
                    status: http_codes_1.HTTPSTATUS.CONFLICT,
                    message: 'The selected service is no longer available',
                },
                PROVIDER_UNAVAILABLE: {
                    status: http_codes_1.HTTPSTATUS.CONFLICT,
                    message: 'The selected chaplain is no longer eligible for bookings',
                },
                AVAILABILITY_UNAVAILABLE: {
                    status: http_codes_1.HTTPSTATUS.CONFLICT,
                    message: 'The selected availability is no longer available',
                },
                AVAILABILITY_MISMATCH: {
                    status: http_codes_1.HTTPSTATUS.BAD_REQUEST,
                    message: 'The selected date and time do not match the availability',
                },
            };
            const known = errors[err.message];
            if (known) {
                res.status(known.status).json({ code: err.message, message: known.message });
                return;
            }
        }
        winston_1.logger.error('Error while creating chaplain service booking', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createPublicChaplainServiceBooking = createPublicChaplainServiceBooking;
