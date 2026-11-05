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
exports.updateEvent = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const event_shared_1 = require("./event-shared");
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid Event ID is required',
            });
            return;
        }
        const existingEvent = yield prisma_1.prisma.event.findUnique({
            where: { id },
        });
        if (!existingEvent) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Event not found',
            });
            return;
        }
        const payload = req.body;
        const taggedMemberIds = [...new Set((_a = payload.taggedMemberIds) !== null && _a !== void 0 ? _a : [])];
        if (taggedMemberIds.length) {
            const members = yield prisma_1.prisma.member.findMany({
                where: {
                    id: { in: taggedMemberIds },
                    isActive: true,
                    status: enums_1.MemberStatus.APPROVED,
                },
                select: { id: true },
            });
            if (members.length !== taggedMemberIds.length) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Tagged members must be active approved members',
                });
                return;
            }
        }
        const event = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.event.update({
                where: { id },
                data: (0, event_shared_1.buildEventWriteInput)(payload),
            });
            yield tx.eventTaggedMember.deleteMany({
                where: { eventId: id },
            });
            if (taggedMemberIds.length) {
                yield tx.eventTaggedMember.createMany({
                    data: taggedMemberIds.map((memberId) => ({
                        eventId: id,
                        memberId,
                    })),
                    skipDuplicates: true,
                });
            }
            return tx.event.findUniqueOrThrow({
                where: { id },
                include: event_shared_1.eventTaggedMemberInclude,
            });
        }));
        winston_1.logger.info('Event updated successfully', {
            eventId: event.id,
            eventName: event.name,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Event updated successfully',
            data: (0, event_shared_1.serializeEvent)(event),
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during event update', err);
    }
});
exports.updateEvent = updateEvent;
