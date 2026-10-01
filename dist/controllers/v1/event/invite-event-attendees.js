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
exports.inviteEventAttendees = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const attendeeInclude = {
    member: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
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
        fullName: `${attendee.member.firstName} ${attendee.member.lastName}`.trim() ||
            attendee.member.user.name,
        email: attendee.member.user.email,
        avatar: attendee.member.user.avatar,
        userId: attendee.member.user.id,
    },
});
const inviteEventAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid Event ID is required',
            });
            return;
        }
        const event = yield prisma_1.prisma.event.findUnique({
            where: { id },
            select: { id: true, name: true },
        });
        if (!event) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Event not found',
            });
            return;
        }
        const { memberIds } = req.body;
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                id: { in: memberIds },
                isActive: true,
            },
            select: { id: true },
        });
        if (!members.length) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'No active members were selected for invitation',
            });
            return;
        }
        yield prisma_1.prisma.eventAttendee.createMany({
            data: members.map((member) => ({
                eventId: id,
                memberId: member.id,
                accessLevel: client_1.EventAttendeeAccessLevel.FULL_ACCESS,
                inviteStatus: client_1.EventAttendeeInviteStatus.INVITED,
            })),
            skipDuplicates: true,
        });
        const attendees = yield prisma_1.prisma.eventAttendee.findMany({
            where: { eventId: id },
            orderBy: { invitedAt: 'asc' },
            include: attendeeInclude,
        });
        winston_1.logger.info('Event attendees invited successfully', {
            eventId: event.id,
            invitedCount: members.length,
            totalAttendees: attendees.length,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Event attendees invited successfully',
            data: attendees.map(serializeAttendee),
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during event attendee invitation', err);
    }
});
exports.inviteEventAttendees = inviteEventAttendees;
