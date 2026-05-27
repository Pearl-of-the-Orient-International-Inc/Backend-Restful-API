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
exports.createCurrentMemberPublicRecord = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const createCurrentMemberPublicRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            select: {
                id: true,
                uniqueId: true,
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const { title, shortDescription, type, eventAt, location, status, attachments = [], } = req.body;
        const record = yield prisma_1.prisma.memberPublicRecord.create({
            data: {
                memberId: member.id,
                title,
                shortDescription,
                type,
                eventAt: new Date(eventAt),
                location,
                status,
                attachments: attachments.length
                    ? {
                        create: attachments.map((attachment, index) => ({
                            fileUrl: attachment.fileUrl,
                            fileName: attachment.fileName,
                            mimeType: attachment.mimeType,
                            sortOrder: index,
                        })),
                    }
                    : undefined,
            },
            select: {
                id: true,
                title: true,
                shortDescription: true,
                type: true,
                eventAt: true,
                location: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                attachments: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        fileUrl: true,
                        fileName: true,
                        mimeType: true,
                        sortOrder: true,
                        createdAt: true,
                    },
                },
            },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Public record created successfully',
            data: record,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating current member public record', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createCurrentMemberPublicRecord = createCurrentMemberPublicRecord;
