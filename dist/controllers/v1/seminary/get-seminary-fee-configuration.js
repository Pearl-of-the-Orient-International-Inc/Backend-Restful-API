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
exports.getSeminaryFeeConfiguration = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const fee_configuration_shared_1 = require("./fee-configuration-shared");
const getSeminaryFeeConfiguration = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const configuration = yield prisma_1.prisma.seminaryFeeConfiguration.upsert({
            where: { id: 'default' },
            create: fee_configuration_shared_1.defaultFeeConfiguration,
            update: {},
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary fee configuration retrieved successfully',
            data: configuration,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary fee configuration', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getSeminaryFeeConfiguration = getSeminaryFeeConfiguration;
