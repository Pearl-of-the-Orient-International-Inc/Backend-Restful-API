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
exports.updatePreOrientationProgress = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const updatePreOrientationProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const completedLessonIds = [...new Set(body.completedLessonIds)].sort((a, b) => a - b);
        const completedAt = body.isCompleted ? new Date() : null;
        const progress = yield prisma_1.prisma.memberOnboardingProgress.upsert({
            where: { memberId: member.id },
            create: {
                memberId: member.id,
                currentStep: body.isCompleted
                    ? enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT
                    : enums_1.MemberOnboardingStep.PRE_ORIENTATION,
                preOrientationCompletedLessonIds: completedLessonIds,
                preOrientationCompletedAt: completedAt,
            },
            update: {
                currentStep: body.isCompleted
                    ? enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT
                    : enums_1.MemberOnboardingStep.PRE_ORIENTATION,
                preOrientationCompletedLessonIds: completedLessonIds,
                preOrientationCompletedAt: completedAt,
            },
            select: {
                currentStep: true,
                preOrientationCompletedLessonIds: true,
                preOrientationCompletedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Pre-orientation progress saved successfully',
            data: progress,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving pre-orientation progress', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updatePreOrientationProgress = updatePreOrientationProgress;
