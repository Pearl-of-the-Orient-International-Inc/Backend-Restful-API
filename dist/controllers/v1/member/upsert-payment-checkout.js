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
exports.upsertPaymentCheckout = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const upsertPaymentCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        const isPromissoryNote = body.isPromissoryNote === true;
        const proofOfPaymentUrl = (_a = body.proofOfPaymentUrl) !== null && _a !== void 0 ? _a : null;
        const promissoryNoteUrl = (_b = body.promissoryNoteUrl) !== null && _b !== void 0 ? _b : null;
        if (body.paymentMethod !== enums_1.MemberPaymentMethod.CASH &&
            !isPromissoryNote &&
            !proofOfPaymentUrl) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Proof of payment is required for non-cash payment method',
            });
            return;
        }
        if (isPromissoryNote && !promissoryNoteUrl) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Signed promissory note is required when promissory note is checked',
            });
            return;
        }
        const paymentCheckout = yield prisma_1.prisma.memberPaymentCheckout.upsert({
            where: { memberId: member.id },
            create: {
                memberId: member.id,
                paymentMethod: body.paymentMethod,
                proofOfPaymentUrl,
                isPromissoryNote,
                promissoryNoteUrl,
                submittedAt: new Date(),
            },
            update: {
                paymentMethod: body.paymentMethod,
                proofOfPaymentUrl,
                isPromissoryNote,
                promissoryNoteUrl,
                submittedAt: new Date(),
            },
            select: {
                paymentMethod: true,
                proofOfPaymentUrl: true,
                isPromissoryNote: true,
                promissoryNoteUrl: true,
                submittedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Payment checkout saved successfully',
            data: paymentCheckout,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving payment checkout', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.upsertPaymentCheckout = upsertPaymentCheckout;
