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
exports.getSeminaryGradeRecord = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const grade_record_shared_1 = require("./grade-record-shared");
const getSeminaryGradeRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userWhere = yield (0, grade_record_shared_1.getGradeRecordWhereForUser)(req.userId);
        const record = yield prisma_1.prisma.seminaryGradeRecord.findFirst({
            where: Object.assign({ id }, userWhere),
        });
        if (!record) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Grade record not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Grade record retrieved successfully',
            data: (0, grade_record_shared_1.toGradeRecordResponse)(record),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary grade record', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getSeminaryGradeRecord = getSeminaryGradeRecord;
