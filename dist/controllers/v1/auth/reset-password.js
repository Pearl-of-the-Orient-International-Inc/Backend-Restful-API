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
exports.resetPassword = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const mailers_1 = require("../../../mailers");
const password_hash_1 = require("../../../lib/password-hash");
const reset_password_1 = require("../../../mailers/templates/reset-password");
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.query;
    const { password } = req.body;
    try {
        if (!token || typeof token !== 'string') {
            winston_1.logger.warn('Missing or invalid token in query parameter');
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid or missing token',
            });
            return;
        }
        const now = new Date();
        const validCode = yield prisma_1.prisma.verificationCode.findFirst({
            where: {
                code: token,
                type: enums_1.VerificationType.PASSWORD_RESET,
                expiresAt: { gt: now },
            },
        });
        if (!validCode) {
            winston_1.logger.warn('Invalid or expired verification code');
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid or expired verification code',
            });
            return;
        }
        const hashedPassword = yield (0, password_hash_1.hashValue)(password);
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: validCode.userId },
            data: { password: hashedPassword },
        });
        yield prisma_1.prisma.verificationCode.delete({
            where: { id: validCode.id },
        });
        yield prisma_1.prisma.session.deleteMany({
            where: { userId: updatedUser.id },
        });
        yield (0, mailers_1.sendMail)(Object.assign({ sendTo: updatedUser.email }, (0, reset_password_1.resetPasswordSuccessTemplate)(updatedUser.name)));
        res.sendStatus(http_codes_1.HTTPSTATUS.NO_CONTENT);
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during user reset password', err);
    }
});
exports.resetPassword = resetPassword;
