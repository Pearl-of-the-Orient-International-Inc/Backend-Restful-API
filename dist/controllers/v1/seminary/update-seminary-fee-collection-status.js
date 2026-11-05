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
exports.updateSeminaryFeeCollectionStatus = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const fee_collection_shared_1 = require("./fee-collection-shared");
const updateSeminaryFeeCollectionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const body = req.body;
        const existingAccount = yield prisma_1.prisma.seminaryFeeCollectionAccount.findUnique({
            where: { id },
            select: { amountPaid: true, balance: true, id: true },
        });
        if (!existingAccount) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary fee collection account not found',
            });
            return;
        }
        const status = (0, fee_collection_shared_1.normalizeFeeCollectionStatus)(body.status);
        if (status === enums_1.SeminaryFeeCollectionStatus.PAID &&
            Number(existingAccount.balance) > 0) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'UNSETTLED_ACCOUNT',
                message: 'An account cannot be marked paid while it still has a balance.',
            });
            return;
        }
        if (status === enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID &&
            Number(existingAccount.amountPaid) <= 0) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'NO_PAYMENT_RECORDED',
                message: 'Record a payment amount before marking an account partially paid.',
            });
            return;
        }
        const account = yield prisma_1.prisma.seminaryFeeCollectionAccount.update({
            where: { id },
            data: { status },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary fee collection status updated successfully',
            data: (0, fee_collection_shared_1.toFeeCollectionResponse)(account),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary fee collection status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryFeeCollectionStatus = updateSeminaryFeeCollectionStatus;
