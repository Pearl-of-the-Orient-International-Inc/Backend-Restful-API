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
exports.createUserAccount = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const password_hash_1 = require("../../../lib/password-hash");
const mailers_1 = require("../../../mailers");
const welcome_user_1 = require("../../../mailers/templates/welcome-user");
const createUserAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, position, accountStatus, avatar, isTwoFactorEnabled, } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
        });
        if (existingUser) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'An account with this email already exists',
            });
            return;
        }
        const hashedPassword = yield (0, password_hash_1.hashValue)(password);
        const user = yield prisma_1.prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: role !== null && role !== void 0 ? role : enums_1.UserType.ADMIN,
                position,
                accountStatus,
                avatar: avatar || null,
                isTwoFactorEnabled,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                position: true,
                accountStatus: true,
                isEmailVerified: true,
                isTwoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, welcome_user_1.welcomeUserTemplate)(user.name, user.email, password)));
        if (!emailResult.success) {
            winston_1.logger.warn('Account created but welcome email failed to send', {
                userId: user.id,
                email: user.email,
            });
        }
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Account created successfully',
            user,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating user account', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createUserAccount = createUserAccount;
