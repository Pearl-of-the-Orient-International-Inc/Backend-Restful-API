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
exports.resendUserEmailVerificationByAdmin = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const helpers_1 = require("@/lib/helpers");
const prisma_1 = require("@/lib/prisma");
const verification_redirect_1 = require("@/lib/verification-redirect");
const winston_1 = require("@/lib/winston");
const mailers_1 = require("@/mailers");
const verify_email_1 = require("@/mailers/templates/verify-email");
const user_admin_guards_1 = require("./user-admin-guards");
const resendUserEmailVerificationByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const canAccess = yield (0, user_admin_guards_1.ensureItAdmin)(req.userId, res);
        if (!canAccess)
            return;
        const userId = req.params.userId;
        if (!userId || Array.isArray(userId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid user ID',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId, role: enums_1.UserType.ADMIN },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isEmailVerified: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Admin account not found',
            });
            return;
        }
        if (user.isEmailVerified) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Email address is already verified',
            });
            return;
        }
        const uniqueCode = (0, helpers_1.generateUniqueCode)();
        const verificationCode = yield prisma_1.prisma.verificationCode.upsert({
            where: { userId: user.id },
            update: {
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.calculateExpirationDate)('36500d'),
                code: uniqueCode,
            },
            create: {
                userId: user.id,
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.calculateExpirationDate)('36500d'),
                code: uniqueCode,
            },
        });
        const verificationUrl = (0, verification_redirect_1.buildVerificationUrl)(user.role, verificationCode.code);
        const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, verify_email_1.verifyEmailTemplate)(verificationUrl, user.name)));
        if (!emailResult.success) {
            res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Verification email failed to send',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Verification email sent successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while resending account verification by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.resendUserEmailVerificationByAdmin = resendUserEmailVerificationByAdmin;
