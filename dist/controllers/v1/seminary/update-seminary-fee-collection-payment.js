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
exports.updateSeminaryFeeCollectionPayment = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const fee_collection_shared_1 = require("./fee-collection-shared");
const getAutoStatus = ({ amountPaid, balance, }) => {
    if (balance <= 0)
        return enums_1.SeminaryFeeCollectionStatus.PAID;
    if (amountPaid > 0)
        return enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID;
    return enums_1.SeminaryFeeCollectionStatus.PENDING;
};
const updateSeminaryFeeCollectionPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const body = req.body;
        const existingAccount = yield prisma_1.prisma.seminaryFeeCollectionAccount.findUnique({
            where: { id },
            select: { id: true, totalCharges: true },
        });
        if (!existingAccount) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary fee collection account not found',
            });
            return;
        }
        const amountPaid = body.amountPaid;
        const totalCharges = Number(existingAccount.totalCharges);
        if (amountPaid > totalCharges) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'INVALID_PAYMENT_AMOUNT',
                message: `Amount paid cannot exceed the total charge of ${totalCharges.toFixed(2)}.`,
            });
            return;
        }
        const balance = Math.max(totalCharges - amountPaid, 0);
        const status = getAutoStatus({ amountPaid, balance });
        const account = yield prisma_1.prisma.seminaryFeeCollectionAccount.update({
            where: { id },
            data: {
                amountPaid,
                balance,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                paymentMethod: body.paymentMethod,
                status,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary fee collection payment updated successfully',
            data: (0, fee_collection_shared_1.toFeeCollectionResponse)(account),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary fee collection payment', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryFeeCollectionPayment = updateSeminaryFeeCollectionPayment;
