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
exports.updateAdminChaplainServiceBookingFinancials = exports.cancelCurrentRequesterChaplainServiceBooking = exports.getCurrentRequesterChaplainServiceBookings = exports.updateCurrentProviderChaplainServiceBookingStatus = exports.updateAdminChaplainServiceBookingStatus = exports.getCurrentProviderChaplainServiceBookings = exports.getAdminChaplainServiceBookings = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const mailers_1 = require("../../../mailers");
const chaplain_service_booking_status_1 = require("../../../mailers/templates/chaplain-service-booking-status");
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
    history: { orderBy: { createdAt: 'asc' } },
};
const serializeBooking = (booking) => (Object.assign(Object.assign({}, booking), { providerServiceFee: booking.providerServiceFee === null
        ? null
        : Number(booking.providerServiceFee), providerCommissionAmount: booking.providerCommissionAmount === null
        ? null
        : Number(booking.providerCommissionAmount), service: Object.assign(Object.assign({}, booking.service), { commissionPercent: booking.service.commissionPercent === null
            ? null
            : Number(booking.service.commissionPercent) }) }));
const getProviderName = (booking) => [
    booking.providerMember.firstName,
    booking.providerMember.middleInitial,
    booking.providerMember.lastName,
    booking.providerMember.extensionName,
]
    .filter(Boolean)
    .join(' ');
const notifyRequester = (booking) => __awaiter(void 0, void 0, void 0, function* () {
    const email = (0, chaplain_service_booking_status_1.chaplainServiceBookingStatusEmail)({
        requesterName: booking.requesterName,
        serviceName: booking.service.name,
        chaplainName: getProviderName(booking),
        preferredAt: booking.preferredAt,
        status: booking.status,
        reason: booking.statusReason,
    });
    const result = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: booking.requesterEmail }, email));
    if (!result.success) {
        winston_1.logger.warn('Booking status was updated but requester notification failed', {
            bookingId: booking.id,
            status: booking.status,
            requesterEmail: booking.requesterEmail,
        });
    }
});
const getBookingId = (req) => {
    const id = req.params.id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
};
const providerForUser = (userId) => {
    if (!userId)
        return null;
    return prisma_1.prisma.member.findFirst({
        where: {
            userId,
            isActive: true,
            status: enums_1.MemberStatus.APPROVED,
            memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
        },
        select: { id: true },
    });
};
const getAdminChaplainServiceBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = typeof req.query.status === 'string'
            ? req.query.status
            : undefined;
        const bookings = yield prisma_1.prisma.chaplainServiceBooking.findMany({
            where: status ? { status } : undefined,
            include: bookingInclude,
            orderBy: [{ createdAt: 'desc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Chaplain service bookings retrieved successfully',
            data: bookings.map(serializeBooking),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving admin chaplain service bookings', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAdminChaplainServiceBookings = getAdminChaplainServiceBookings;
const getCurrentProviderChaplainServiceBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const provider = yield providerForUser(req.userId);
        if (!provider) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only eligible service chaplains can review booking requests' });
            return;
        }
        const bookings = yield prisma_1.prisma.chaplainServiceBooking.findMany({
            where: { providerMemberId: provider.id },
            include: bookingInclude,
            orderBy: [{ createdAt: 'desc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Your service bookings were retrieved successfully', data: bookings.map(serializeBooking) });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving provider chaplain service bookings', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getCurrentProviderChaplainServiceBookings = getCurrentProviderChaplainServiceBookings;
const updateBookingStatus = (_a) => __awaiter(void 0, [_a], void 0, function* ({ bookingId, actorUserId, providerMemberId, actor, body, }) {
    return prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const booking = yield tx.chaplainServiceBooking.findFirst({
            where: Object.assign({ id: bookingId }, (providerMemberId ? { providerMemberId } : {})),
            include: { service: true },
        });
        if (!booking)
            throw new Error('BOOKING_NOT_FOUND');
        if (!booking.service.isActive)
            throw new Error('SERVICE_UNAVAILABLE');
        const adminTransitions = {
            PENDING: [
                enums_1.ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
                enums_1.ChaplainServiceBookingStatus.RESCHEDULED,
                enums_1.ChaplainServiceBookingStatus.REJECTED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            AWAITING_CHAPLAIN_APPROVAL: [
                enums_1.ChaplainServiceBookingStatus.RESCHEDULED,
                enums_1.ChaplainServiceBookingStatus.REJECTED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            RESCHEDULED: [
                enums_1.ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
                enums_1.ChaplainServiceBookingStatus.RESCHEDULED,
                enums_1.ChaplainServiceBookingStatus.REJECTED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            CONFIRMED: [
                enums_1.ChaplainServiceBookingStatus.RESCHEDULED,
                enums_1.ChaplainServiceBookingStatus.COMPLETED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            REJECTED: [],
            COMPLETED: [],
            CANCELLED: [],
        };
        const providerTransitions = {
            PENDING: [],
            AWAITING_CHAPLAIN_APPROVAL: [
                enums_1.ChaplainServiceBookingStatus.CONFIRMED,
                enums_1.ChaplainServiceBookingStatus.REJECTED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            RESCHEDULED: [
                enums_1.ChaplainServiceBookingStatus.CONFIRMED,
                enums_1.ChaplainServiceBookingStatus.REJECTED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            CONFIRMED: [
                enums_1.ChaplainServiceBookingStatus.COMPLETED,
                enums_1.ChaplainServiceBookingStatus.CANCELLED,
            ],
            REJECTED: [],
            COMPLETED: [],
            CANCELLED: [],
        };
        const allowedTransitions = actor === 'ADMIN' ? adminTransitions : providerTransitions;
        if (!allowedTransitions[booking.status].includes(body.status)) {
            throw new Error('INVALID_STATUS_TRANSITION');
        }
        const preferredAt = body.preferredAt
            ? new Date(body.preferredAt)
            : booking.preferredAt;
        if (preferredAt <= new Date() && body.status !== 'COMPLETED') {
            throw new Error('SCHEDULE_IN_PAST');
        }
        if (body.status === enums_1.ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL ||
            body.status === enums_1.ChaplainServiceBookingStatus.CONFIRMED ||
            body.status === enums_1.ChaplainServiceBookingStatus.RESCHEDULED) {
            const [availability, conflict, serviceBookingCount, resourceBookingCount, resourceConfiguration] = yield Promise.all([
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
                        status: enums_1.ChaplainServiceBookingStatus.CONFIRMED,
                    },
                    select: { id: true },
                }),
                tx.chaplainServiceBooking.count({
                    where: {
                        id: { not: booking.id },
                        serviceId: booking.serviceId,
                        preferredAt,
                        status: enums_1.ChaplainServiceBookingStatus.CONFIRMED,
                    },
                }),
                booking.service.sharedResourceKey
                    ? tx.chaplainServiceBooking.count({
                        where: {
                            id: { not: booking.id },
                            preferredAt,
                            status: enums_1.ChaplainServiceBookingStatus.CONFIRMED,
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
            if (!availability)
                throw new Error('PROVIDER_UNAVAILABLE');
            if (conflict)
                throw new Error('BOOKING_CONFLICT');
            if (serviceBookingCount >= booking.service.maxConcurrentBookings) {
                throw new Error('SERVICE_CAPACITY_REACHED');
            }
            if (booking.service.sharedResourceKey &&
                resourceBookingCount >= ((_a = resourceConfiguration._min.sharedResourceCapacity) !== null && _a !== void 0 ? _a : 1)) {
                throw new Error('SHARED_RESOURCE_UNAVAILABLE');
            }
        }
        const fee = (_b = body.providerServiceFee) !== null && _b !== void 0 ? _b : (booking.providerServiceFee === null
            ? null
            : Number(booking.providerServiceFee));
        const commissionPercent = booking.service.commissionPercent === null
            ? null
            : Number(booking.service.commissionPercent);
        const commissionAmount = fee !== null && commissionPercent !== null
            ? Number(((fee * commissionPercent) / 100).toFixed(2))
            : null;
        return tx.chaplainServiceBooking.update({
            where: { id: booking.id },
            data: Object.assign(Object.assign({ status: body.status, statusReason: ((_c = body.reason) === null || _c === void 0 ? void 0 : _c.trim()) || null, preferredAt }, (typeof body.providerServiceFee === 'number'
                ? {
                    providerServiceFee: body.providerServiceFee,
                    providerCommissionAmount: commissionAmount,
                    providerCommissionStatus: commissionAmount === null
                        ? enums_1.ChaplainServiceCommissionStatus.NOT_APPLICABLE
                        : enums_1.ChaplainServiceCommissionStatus.PENDING,
                }
                : {})), { history: {
                    create: {
                        status: body.status,
                        reason: ((_d = body.reason) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                        changedByUserId: actorUserId !== null && actorUserId !== void 0 ? actorUserId : null,
                    },
                } }),
            include: bookingInclude,
        });
    }), { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
});
const respondToStatusUpdate = (req, res, actor, providerMemberId) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingId = getBookingId(req);
    if (!bookingId) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Booking ID is required' });
        return;
    }
    try {
        const booking = yield updateBookingStatus({
            bookingId,
            actorUserId: req.userId,
            providerMemberId,
            actor,
            body: req.body,
        });
        yield notifyRequester(booking);
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking status updated successfully', data: serializeBooking(booking) });
    }
    catch (err) {
        const known = {
            BOOKING_NOT_FOUND: { status: http_codes_1.HTTPSTATUS.NOT_FOUND, message: 'Booking request not found' },
            SERVICE_UNAVAILABLE: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'This service is currently unavailable' },
            SCHEDULE_IN_PAST: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'A past appointment cannot be approved or rescheduled' },
            PROVIDER_UNAVAILABLE: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'The chaplain is not available at this schedule' },
            BOOKING_CONFLICT: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'The chaplain already has a confirmed booking at this schedule' },
            SERVICE_CAPACITY_REACHED: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'This service has reached its confirmed-booking capacity for the selected schedule' },
            SHARED_RESOURCE_UNAVAILABLE: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'The shared resource assigned to this service is unavailable for the selected schedule' },
            INVALID_STATUS_TRANSITION: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'This action is not permitted for the current booking status' },
            P2034: { status: http_codes_1.HTTPSTATUS.CONFLICT, message: 'Another booking changed this schedule. Refresh and try again.' },
        };
        const errorCode = err instanceof client_1.Prisma.PrismaClientKnownRequestError ? err.code : err instanceof Error ? err.message : '';
        const match = known[errorCode];
        if (match) {
            res.status(match.status).json({ code: errorCode, message: match.message });
            return;
        }
        winston_1.logger.error('Error while updating chaplain service booking status', { err, bookingId });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
const updateAdminChaplainServiceBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () { return respondToStatusUpdate(req, res, 'ADMIN'); });
exports.updateAdminChaplainServiceBookingStatus = updateAdminChaplainServiceBookingStatus;
const updateCurrentProviderChaplainServiceBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = yield providerForUser(req.userId);
    if (!provider) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only eligible service chaplains can manage booking requests' });
        return;
    }
    yield respondToStatusUpdate(req, res, 'PROVIDER', provider.id);
});
exports.updateCurrentProviderChaplainServiceBookingStatus = updateCurrentProviderChaplainServiceBookingStatus;
const getCurrentRequesterChaplainServiceBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication is required' });
            return;
        }
        const bookings = yield prisma_1.prisma.chaplainServiceBooking.findMany({
            where: { requesterUserId: req.userId },
            include: bookingInclude,
            orderBy: [{ createdAt: 'desc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Your bookings were retrieved successfully', data: bookings.map(serializeBooking) });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving requester bookings', { err, userId: req.userId });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getCurrentRequesterChaplainServiceBookings = getCurrentRequesterChaplainServiceBookings;
const cancelCurrentRequesterChaplainServiceBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingId = getBookingId(req);
    if (!bookingId || !req.userId) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'A valid booking and authenticated user are required' });
        return;
    }
    try {
        const reason = String(req.body.reason).trim();
        const booking = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const current = yield tx.chaplainServiceBooking.findFirst({
                where: { id: bookingId, requesterUserId: req.userId },
                select: { id: true, status: true },
            });
            if (!current)
                throw new Error('BOOKING_NOT_FOUND');
            const cancellableStatuses = [
                enums_1.ChaplainServiceBookingStatus.PENDING,
                enums_1.ChaplainServiceBookingStatus.AWAITING_CHAPLAIN_APPROVAL,
                enums_1.ChaplainServiceBookingStatus.RESCHEDULED,
                enums_1.ChaplainServiceBookingStatus.CONFIRMED,
            ];
            if (!cancellableStatuses.includes(current.status)) {
                throw new Error('INVALID_STATUS_TRANSITION');
            }
            return tx.chaplainServiceBooking.update({
                where: { id: current.id },
                data: {
                    status: enums_1.ChaplainServiceBookingStatus.CANCELLED,
                    statusReason: reason,
                    history: { create: { status: enums_1.ChaplainServiceBookingStatus.CANCELLED, reason, changedByUserId: req.userId } },
                },
                include: bookingInclude,
            });
        }));
        yield notifyRequester(booking);
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking cancelled successfully', data: serializeBooking(booking) });
    }
    catch (err) {
        if (err instanceof Error && err.message === 'BOOKING_NOT_FOUND') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Booking request not found' });
            return;
        }
        if (err instanceof Error && err.message === 'INVALID_STATUS_TRANSITION') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'INVALID_STATUS_TRANSITION', message: 'This booking can no longer be cancelled' });
            return;
        }
        winston_1.logger.error('Error while cancelling requester booking', { err, bookingId, userId: req.userId });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.cancelCurrentRequesterChaplainServiceBooking = cancelCurrentRequesterChaplainServiceBooking;
const updateAdminChaplainServiceBookingFinancials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const bookingId = getBookingId(req);
    if (!bookingId) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Booking ID is required' });
        return;
    }
    try {
        const body = req.body;
        const current = yield prisma_1.prisma.chaplainServiceBooking.findUnique({
            where: { id: bookingId },
            include: { service: true },
        });
        if (!current) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Booking request not found' });
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
        const booking = yield prisma_1.prisma.chaplainServiceBooking.update({
            where: { id: bookingId },
            data: Object.assign(Object.assign({}, (body.providerServiceFee !== undefined ? { providerServiceFee: body.providerServiceFee } : {})), { providerCommissionAmount: commissionAmount, requesterPaymentStatus: (_a = body.requesterPaymentStatus) !== null && _a !== void 0 ? _a : (fee !== null && fee > 0 ? current.requesterPaymentStatus === 'NOT_REQUIRED' ? 'PENDING' : current.requesterPaymentStatus : 'NOT_REQUIRED'), providerCommissionStatus: (_b = body.providerCommissionStatus) !== null && _b !== void 0 ? _b : (commissionAmount !== null && commissionAmount > 0 ? current.providerCommissionStatus === 'NOT_APPLICABLE' ? 'PENDING' : current.providerCommissionStatus : 'NOT_APPLICABLE') }),
            include: bookingInclude,
        });
        if (body.providerServiceFee !== undefined || body.requesterPaymentStatus !== undefined) {
            const paymentLabel = booking.requesterPaymentStatus.replace(/_/g, ' ').toLowerCase();
            const feeLabel = booking.providerServiceFee === null
                ? 'No service fee is required.'
                : `The recorded service fee is PHP ${Number(booking.providerServiceFee).toFixed(2)}.`;
            yield (0, mailers_1.sendMail)({
                sendTo: booking.requesterEmail,
                subject: `Booking payment updated - ${booking.service.name}`,
                text: `Hello ${booking.requesterName},\n\n${feeLabel} The payment status for your ${booking.service.name} booking is now ${paymentLabel}.\n\nPearl of the Orient International Auxiliary Chaplain Values Educators Inc.`,
            });
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Booking financial status updated successfully', data: serializeBooking(booking) });
    }
    catch (err) {
        winston_1.logger.error('Error while updating booking financials', { err, bookingId });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.updateAdminChaplainServiceBookingFinancials = updateAdminChaplainServiceBookingFinancials;
