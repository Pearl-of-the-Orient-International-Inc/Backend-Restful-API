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
exports.reviewEventAttendee = exports.getCurrentMemberEventRegistration = exports.registerCurrentMemberForEvent = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const attendeeInclude = {
    member: {
        select: {
            id: true,
            firstName: true,
            middleInitial: true,
            lastName: true,
            extensionName: true,
            uniqueId: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
        },
    },
};
const serializeAttendee = (attendee) => ({
    id: attendee.id,
    memberId: attendee.memberId,
    accessLevel: attendee.accessLevel,
    inviteStatus: attendee.inviteStatus,
    invitedAt: attendee.invitedAt,
    updatedAt: attendee.updatedAt,
    member: {
        id: attendee.member.id,
        fullName: [
            attendee.member.firstName,
            attendee.member.middleInitial
                ? `${attendee.member.middleInitial.replace(/\.$/, '')}.`
                : null,
            attendee.member.lastName,
            attendee.member.extensionName,
        ]
            .filter(Boolean)
            .join(' ') || attendee.member.user.name,
        memberNumber: attendee.member.uniqueId,
        email: attendee.member.user.email,
        avatar: attendee.member.user.avatar,
        userId: attendee.member.user.id,
    },
});
const registerCurrentMemberForEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!eventId || !req.userId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and member session are required' });
            return;
        }
        const [event, member] = yield Promise.all([
            prisma_1.prisma.event.findFirst({
                where: {
                    id: eventId,
                    visibility: enums_1.EventVisibility.PUBLIC,
                    status: { not: enums_1.EventStatus.CANCELLED },
                },
                select: { id: true, name: true, endsAt: true },
            }),
            prisma_1.prisma.member.findFirst({
                where: { userId: req.userId, isActive: true, status: enums_1.MemberStatus.APPROVED },
                select: { id: true },
            }),
        ]);
        if (!event) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'This public event is no longer available for registration' });
            return;
        }
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only active approved members can join an event' });
            return;
        }
        if (event.endsAt <= new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Registration is closed because this event has already ended' });
            return;
        }
        const attendee = yield prisma_1.prisma.eventAttendee.upsert({
            where: { eventId_memberId: { eventId, memberId: member.id } },
            create: {
                eventId,
                memberId: member.id,
                inviteStatus: enums_1.EventAttendeeInviteStatus.PENDING_APPROVAL,
            },
            update: {
                inviteStatus: enums_1.EventAttendeeInviteStatus.PENDING_APPROVAL,
                invitedAt: new Date(),
            },
            include: attendeeInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: `Your registration for ${event.name} is awaiting administrator approval`,
            data: serializeAttendee(attendee),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while registering a member for an event', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to submit the event registration' });
    }
});
exports.registerCurrentMemberForEvent = registerCurrentMemberForEvent;
const getCurrentMemberEventRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!eventId || !req.userId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and member session are required' });
            return;
        }
        const member = yield prisma_1.prisma.member.findFirst({
            where: { userId: req.userId, isActive: true, status: enums_1.MemberStatus.APPROVED },
            select: { id: true },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only active approved members can view their event registration',
            });
            return;
        }
        const attendee = yield prisma_1.prisma.eventAttendee.findUnique({
            where: { eventId_memberId: { eventId, memberId: member.id } },
            include: {
                event: {
                    select: {
                        id: true,
                        type: true,
                        location: true,
                        onlineLink: true,
                        meetingPlatform: true,
                        meetingId: true,
                        meetingPassword: true,
                    },
                },
            },
        });
        if (!attendee) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'You have not registered for this event',
            });
            return;
        }
        const approved = attendee.inviteStatus === enums_1.EventAttendeeInviteStatus.APPROVED ||
            attendee.inviteStatus === enums_1.EventAttendeeInviteStatus.ATTENDED;
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: approved
                ? 'Your event access details are available'
                : 'Your registration is awaiting administrator approval',
            data: {
                registrationStatus: attendee.inviteStatus,
                accessDetails: approved
                    ? {
                        type: attendee.event.type,
                        location: attendee.event.location,
                        onlineLink: attendee.event.onlineLink,
                        meetingPlatform: attendee.event.meetingPlatform,
                        meetingId: attendee.event.meetingId,
                        meetingPassword: attendee.event.meetingPassword,
                    }
                    : null,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error retrieving a member event registration', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to retrieve your event registration',
        });
    }
});
exports.getCurrentMemberEventRegistration = getCurrentMemberEventRegistration;
const reviewEventAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const attendeeId = Array.isArray(req.params.attendeeId)
            ? req.params.attendeeId[0]
            : req.params.attendeeId;
        const { status } = req.body;
        if (!eventId || !attendeeId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and attendee IDs are required' });
            return;
        }
        const attendee = yield prisma_1.prisma.eventAttendee.findFirst({
            where: { id: attendeeId, eventId },
            include: { event: { select: { id: true, name: true, endsAt: true } } },
        });
        if (!attendee) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Event registration not found' });
            return;
        }
        if (status === enums_1.EventAttendeeInviteStatus.ATTENDED && attendee.event.endsAt > new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Attendance can only be confirmed after the event end date' });
            return;
        }
        if (status === enums_1.EventAttendeeInviteStatus.ATTENDED && attendee.inviteStatus !== enums_1.EventAttendeeInviteStatus.APPROVED) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Approve this registration before marking attendance' });
            return;
        }
        const updated = yield prisma_1.prisma.eventAttendee.update({
            where: { id: attendee.id },
            data: { inviteStatus: status },
            include: attendeeInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: `Registration status updated to ${status.toLowerCase().replace(/_/g, ' ')}`,
            data: serializeAttendee(updated),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while reviewing an event attendee', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update the event registration' });
    }
});
exports.reviewEventAttendee = reviewEventAttendee;
