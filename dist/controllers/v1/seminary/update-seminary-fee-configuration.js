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
exports.updateSeminaryFeeConfiguration = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const fee_configuration_shared_1 = require("./fee-configuration-shared");
const getBreakdownTotal = (items) => items.reduce((sum, item) => sum + item.amount, 0);
const updateSeminaryFeeConfiguration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const configuration = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const savedConfiguration = yield tx.seminaryFeeConfiguration.upsert({
                where: { id: 'default' },
                create: (0, fee_configuration_shared_1.buildFeeConfigurationCreateData)(body),
                update: (0, fee_configuration_shared_1.buildFeeConfigurationUpdateData)(body),
            });
            const programTotals = {
                [enums_1.SeminaryProgramLevel.CERTIFICATE]: getBreakdownTotal(body.feeBreakdowns.Certificate),
                [enums_1.SeminaryProgramLevel.BACHELOR]: getBreakdownTotal(body.feeBreakdowns.Bachelor),
                [enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS]: getBreakdownTotal(body.feeBreakdowns.Masteral),
                [enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: getBreakdownTotal(body.feeBreakdowns.Doctorate),
            };
            yield Promise.all(Object.entries(programTotals).map(([programLevel, totalCharges]) => tx.seminaryFeeCollectionAccount.updateMany({
                where: { programLevel: programLevel },
                data: {
                    totalCharges,
                },
            })));
            const accounts = yield tx.seminaryFeeCollectionAccount.findMany({
                select: { amountPaid: true, id: true, totalCharges: true },
            });
            yield Promise.all(accounts.map((account) => tx.seminaryFeeCollectionAccount.update({
                where: { id: account.id },
                data: {
                    balance: Math.max(Number(account.totalCharges) - Number(account.amountPaid), 0),
                },
            })));
            return savedConfiguration;
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary fee configuration updated successfully',
            data: configuration,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary fee configuration', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryFeeConfiguration = updateSeminaryFeeConfiguration;
