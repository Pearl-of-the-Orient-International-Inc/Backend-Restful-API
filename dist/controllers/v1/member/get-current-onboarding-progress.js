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
exports.getCurrentOnboardingProgress = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getCurrentOnboardingProgress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
        const progress = yield prisma_1.prisma.memberOnboardingProgress.findUnique({
            where: { memberId: member.id },
            select: {
                currentStep: true,
                preOrientationCompletedLessonIds: true,
                preOrientationCompletedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Onboarding progress retrieved successfully',
            data: {
                currentStep: (_a = progress === null || progress === void 0 ? void 0 : progress.currentStep) !== null && _a !== void 0 ? _a : enums_1.MemberOnboardingStep.REQUIREMENTS,
                preOrientationCompletedLessonIds: (_b = progress === null || progress === void 0 ? void 0 : progress.preOrientationCompletedLessonIds) !== null && _b !== void 0 ? _b : [],
                preOrientationCompletedAt: (_c = progress === null || progress === void 0 ? void 0 : progress.preOrientationCompletedAt) !== null && _c !== void 0 ? _c : null,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting onboarding progress', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getCurrentOnboardingProgress = getCurrentOnboardingProgress;
