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
exports.updateOnboardingStep = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const updateOnboardingStep = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const PRE_ORIENTATION_REQUIRED_LESSON_COUNT = 5;
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
        const existingProgress = yield prisma_1.prisma.memberOnboardingProgress.findUnique({
            where: { memberId: member.id },
            select: {
                preOrientationCompletedLessonIds: true,
                preOrientationCompletedAt: true,
            },
        });
        const stepsRequiringPreOrientationCompletion = new Set([
            enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT,
            enums_1.MemberOnboardingStep.ONLINE_INTERVIEW,
            enums_1.MemberOnboardingStep.ID_GENERATION,
            enums_1.MemberOnboardingStep.CHAPLAINCY_101,
            enums_1.MemberOnboardingStep.OATH_TAKING,
        ]);
        const requiresPreOrientationCompletion = stepsRequiringPreOrientationCompletion.has(body.currentStep);
        if (requiresPreOrientationCompletion) {
            const completedCount = (_a = existingProgress === null || existingProgress === void 0 ? void 0 : existingProgress.preOrientationCompletedLessonIds.length) !== null && _a !== void 0 ? _a : 0;
            const hasCompletedAt = Boolean(existingProgress === null || existingProgress === void 0 ? void 0 : existingProgress.preOrientationCompletedAt);
            if (completedCount < PRE_ORIENTATION_REQUIRED_LESSON_COUNT ||
                !hasCompletedAt) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Pre-orientation is not completed. Please finish all lessons first.',
                });
                return;
            }
        }
        const stepsRequiringPaymentCompletion = new Set([
            enums_1.MemberOnboardingStep.ONLINE_INTERVIEW,
            enums_1.MemberOnboardingStep.ID_GENERATION,
            enums_1.MemberOnboardingStep.CHAPLAINCY_101,
            enums_1.MemberOnboardingStep.OATH_TAKING,
        ]);
        const requiresPaymentCompletion = stepsRequiringPaymentCompletion.has(body.currentStep);
        if (requiresPaymentCompletion) {
            const paymentCheckout = yield prisma_1.prisma.memberPaymentCheckout.findUnique({
                where: { memberId: member.id },
                select: {
                    paymentMethod: true,
                    proofOfPaymentUrl: true,
                    isPromissoryNote: true,
                    promissoryNoteUrl: true,
                },
            });
            if (!paymentCheckout) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Payment checkout is not completed yet.',
                });
                return;
            }
            const hasProof = Boolean(paymentCheckout.proofOfPaymentUrl);
            const hasPromissory = Boolean(paymentCheckout.promissoryNoteUrl);
            if (paymentCheckout.isPromissoryNote && !hasPromissory) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Signed promissory note is required.',
                });
                return;
            }
            if (paymentCheckout.paymentMethod !== enums_1.MemberPaymentMethod.CASH &&
                !paymentCheckout.isPromissoryNote &&
                !hasProof) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Proof of payment is required for non-cash payment method.',
                });
                return;
            }
        }
        const stepsRequiringOnlineInterviewCompletion = new Set([
            enums_1.MemberOnboardingStep.ID_GENERATION,
            enums_1.MemberOnboardingStep.CHAPLAINCY_101,
            enums_1.MemberOnboardingStep.OATH_TAKING,
        ]);
        const requiresOnlineInterviewCompletion = stepsRequiringOnlineInterviewCompletion.has(body.currentStep);
        if (requiresOnlineInterviewCompletion) {
            const appointment = yield prisma_1.prisma.memberOnlineInterviewAppointment.findUnique({
                where: { memberId: member.id },
                select: {
                    interviewerId: true,
                    day: true,
                    timeSlot: true,
                    zoomLink: true,
                },
            });
            if (!appointment ||
                !appointment.interviewerId ||
                !appointment.day ||
                !appointment.timeSlot ||
                !appointment.zoomLink) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Online interview appointment is incomplete. Please confirm interviewer, day, time slot, and Zoom link.',
                });
                return;
            }
        }
        const stepsRequiringIdGenerationCompletion = new Set([
            enums_1.MemberOnboardingStep.CHAPLAINCY_101,
            enums_1.MemberOnboardingStep.OATH_TAKING,
        ]);
        const requiresIdGenerationCompletion = stepsRequiringIdGenerationCompletion.has(body.currentStep);
        if (requiresIdGenerationCompletion) {
            const idGenerationAsset = yield prisma_1.prisma.memberIdGenerationAsset.findUnique({
                where: { memberId: member.id },
                select: {
                    qrCodeUrl: true,
                    certificateUrl: true,
                },
            });
            if (!(idGenerationAsset === null || idGenerationAsset === void 0 ? void 0 : idGenerationAsset.qrCodeUrl) || !(idGenerationAsset === null || idGenerationAsset === void 0 ? void 0 : idGenerationAsset.certificateUrl)) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Member ID generation is incomplete. Please save QR code and certificate first.',
                });
                return;
            }
        }
        const requiresChaplaincyCompletion = body.currentStep === enums_1.MemberOnboardingStep.OATH_TAKING;
        if (requiresChaplaincyCompletion) {
            const LESSON_COUNT = 8;
            const ESSAY_COUNT = 10;
            const chaplaincyProgress = yield prisma_1.prisma.memberChaplaincyTrainingProgress.findUnique({
                where: { memberId: member.id },
                select: {
                    completedLessonIds: true,
                    essayAnswers: true,
                    completedAt: true,
                },
            });
            const completedLessonCount = (_b = chaplaincyProgress === null || chaplaincyProgress === void 0 ? void 0 : chaplaincyProgress.completedLessonIds.length) !== null && _b !== void 0 ? _b : 0;
            const answers = ((_c = chaplaincyProgress === null || chaplaincyProgress === void 0 ? void 0 : chaplaincyProgress.essayAnswers) !== null && _c !== void 0 ? _c : {});
            const answeredCount = Object.values(answers).filter((answer) => (answer === null || answer === void 0 ? void 0 : answer.trim().length) > 0).length;
            if (!chaplaincyProgress ||
                completedLessonCount < LESSON_COUNT ||
                answeredCount < ESSAY_COUNT ||
                !chaplaincyProgress.completedAt) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Chaplaincy 101 is incomplete. Please complete all lessons and assessment answers first.',
                });
                return;
            }
        }
        const progress = yield prisma_1.prisma.memberOnboardingProgress.upsert({
            where: { memberId: member.id },
            create: {
                memberId: member.id,
                currentStep: body.currentStep,
            },
            update: {
                currentStep: body.currentStep,
            },
            select: {
                currentStep: true,
                preOrientationCompletedLessonIds: true,
                preOrientationCompletedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Onboarding step updated successfully',
            data: progress,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating onboarding step', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateOnboardingStep = updateOnboardingStep;
