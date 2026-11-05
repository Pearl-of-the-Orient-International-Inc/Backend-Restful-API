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
exports.upsertOnlineInterview = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const upsertOnlineInterview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const body = req.body;
        const appointment = yield prisma_1.prisma.memberOnlineInterviewAppointment.upsert({
            where: { memberId: member.id },
            create: {
                memberId: member.id,
                interviewerId: body.interviewerId,
                interviewerName: body.interviewerName,
                day: body.day,
                timeSlot: body.timeSlot,
                zoomLink: body.zoomLink,
                meetingId: (_a = body.meetingId) !== null && _a !== void 0 ? _a : null,
                passcode: (_b = body.passcode) !== null && _b !== void 0 ? _b : null,
                confirmedAt: new Date(),
            },
            update: {
                interviewerId: body.interviewerId,
                interviewerName: body.interviewerName,
                day: body.day,
                timeSlot: body.timeSlot,
                zoomLink: body.zoomLink,
                meetingId: (_c = body.meetingId) !== null && _c !== void 0 ? _c : null,
                passcode: (_d = body.passcode) !== null && _d !== void 0 ? _d : null,
                confirmedAt: new Date(),
            },
            select: {
                interviewerId: true,
                interviewerName: true,
                day: true,
                timeSlot: true,
                zoomLink: true,
                meetingId: true,
                passcode: true,
                confirmedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Online interview appointment saved successfully',
            data: appointment,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving online interview appointment', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.upsertOnlineInterview = upsertOnlineInterview;
