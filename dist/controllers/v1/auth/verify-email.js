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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = void 0;
const winston_1 = require("../../../lib/winston");
const prisma_1 = require("../../../lib/prisma");
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code } = req.body;
        if (!code) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Code is required',
            });
            return;
        }
        const now = new Date();
        const validCode = yield prisma_1.prisma.verificationCode.findFirst({
            where: {
                code,
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: { gt: now },
            },
        });
        if (!validCode) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Code is invalid',
            });
            return;
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: validCode.userId },
            data: { isEmailVerified: true },
        });
        yield prisma_1.prisma.verificationCode.delete({
            where: { id: validCode.id },
        });
        const { password: _password } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account verified successfully',
            user: userWithoutPassword,
        });
    }
    catch (err) {
        winston_1.logger.error('Error during account verification', { error: err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.verifyEmail = verifyEmail;
