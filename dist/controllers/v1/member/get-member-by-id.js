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
exports.getMemberById = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getMemberById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = req.params.id;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            include: {
                ministerialExperiences: {
                    orderBy: { order: 'asc' },
                },
                characterReferences: {
                    orderBy: { order: 'asc' },
                },
                applicantRequirements: {
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        type: true,
                        reviewStatus: true,
                        fileUrl: true,
                        fileName: true,
                        mimeType: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                onboardingProgress: {
                    select: {
                        currentStep: true,
                        preOrientationCompletedLessonIds: true,
                        preOrientationCompletedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                paymentCheckout: {
                    select: {
                        id: true,
                        paymentMethod: true,
                        proofOfPaymentUrl: true,
                        isPromissoryNote: true,
                        promissoryNoteUrl: true,
                        submittedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                onlineInterviewAppointment: {
                    select: {
                        id: true,
                        interviewerId: true,
                        interviewerName: true,
                        day: true,
                        timeSlot: true,
                        zoomLink: true,
                        meetingId: true,
                        passcode: true,
                        confirmedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                idGenerationAsset: {
                    select: {
                        id: true,
                        profileUrl: true,
                        qrCodeUrl: true,
                        generatedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                certificates: {
                    orderBy: [{ dateReceived: 'desc' }, { createdAt: 'desc' }],
                    select: {
                        id: true,
                        credentialId: true,
                        type: true,
                        title: true,
                        issuer: true,
                        referenceNumber: true,
                        certificateUrl: true,
                        dateReceived: true,
                        expiresAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                chaplaincyTrainingProgress: {
                    select: {
                        id: true,
                        completedLessonIds: true,
                        essayAnswers: true,
                        completedAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                preferredBranches: {
                    select: { id: true, title: true },
                },
                taggedEvents: {
                    orderBy: { taggedAt: 'desc' },
                    select: {
                        id: true,
                        taggedAt: true,
                        event: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                type: true,
                                location: true,
                                onlineLink: true,
                                startsAt: true,
                                endsAt: true,
                                visibility: true,
                                organizer: true,
                                thumbnailUrl: true,
                            },
                        },
                    },
                },
                signature: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                        isEmailVerified: true,
                    },
                },
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        winston_1.logger.info('Member retrieved by admin', { memberId });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member retrieved successfully',
            data: member,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting member by id', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getMemberById = getMemberById;
