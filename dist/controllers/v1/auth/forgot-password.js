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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const helpers_1 = require("../../../lib/helpers");
const enums_1 = require("../../../generated/prisma/enums");
const config_1 = __importDefault(require("../../../config"));
const mailers_1 = require("../../../mailers");
const forgot_password_1 = require("../../../mailers/templates/forgot-password");
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            winston_1.logger.warn('No user found with this email');
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'No user found with this email',
            });
            return;
        }
        if (user.role !== 'ADMIN') {
            winston_1.logger.warn('Non-admin user attempted forgot password', {
                userId: user.id,
                role: user.role,
            });
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Access denied. Admin privileges required.',
            });
            return;
        }
        const uniqueCode = (0, helpers_1.generateUniqueCode)();
        const verificationCode = yield prisma_1.prisma.verificationCode.create({
            data: {
                userId: user.id,
                type: enums_1.VerificationType.PASSWORD_RESET,
                expiresAt: (0, helpers_1.calculateExpirationDate)('1h'),
                code: uniqueCode,
            },
        });
        const baseUrl = config_1.default.APP_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/reset-password?token=${verificationCode.code}`;
        yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, forgot_password_1.forgotPasswordTemplate)(verificationUrl, user.name)));
        res.sendStatus(http_codes_1.HTTPSTATUS.NO_CONTENT);
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during user forgot password', err);
    }
});
exports.forgotPassword = forgotPassword;
