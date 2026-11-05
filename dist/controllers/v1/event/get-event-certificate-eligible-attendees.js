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
exports.getEventCertificateEligibleAttendees = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getEventCertificateEligibleAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!eventId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'A valid event ID is required',
            });
            return;
        }
        const event = yield prisma_1.prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, endsAt: true },
        });
        if (!event) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Event not found',
            });
            return;
        }
        if (event.endsAt > new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Certificates can be prepared only after the event has ended',
            });
            return;
        }
        const attendees = yield prisma_1.prisma.eventAttendee.findMany({
            where: { eventId, inviteStatus: enums_1.EventAttendeeInviteStatus.ATTENDED },
            select: { id: true, memberId: true },
            orderBy: { updatedAt: 'asc' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: `${attendees.length} attended member${attendees.length === 1 ? '' : 's'} are eligible for certificates`,
            data: attendees,
        });
    }
    catch (err) {
        winston_1.logger.error('Error retrieving certificate-eligible event attendees', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to retrieve certificate-eligible attendees',
        });
    }
});
exports.getEventCertificateEligibleAttendees = getEventCertificateEligibleAttendees;
