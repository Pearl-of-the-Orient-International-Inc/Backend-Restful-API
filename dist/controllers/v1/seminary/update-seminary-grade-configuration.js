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
exports.updateSeminaryGradeConfiguration = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const grade_configuration_shared_1 = require("./grade-configuration-shared");
const updateSeminaryGradeConfiguration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const configuration = yield prisma_1.prisma.seminaryGradeConfiguration.upsert({
            where: { id: 'default' },
            create: (0, grade_configuration_shared_1.buildGradeConfigurationCreateData)(body),
            update: (0, grade_configuration_shared_1.buildGradeConfigurationUpdateData)(body),
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary grade configuration updated successfully',
            data: configuration,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating seminary grade configuration', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryGradeConfiguration = updateSeminaryGradeConfiguration;
