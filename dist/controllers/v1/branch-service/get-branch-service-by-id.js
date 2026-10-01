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
exports.getBranchServiceById = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getBranchServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid Branch Service ID is required',
            });
            return;
        }
        const branchService = yield prisma_1.prisma.branchOfService.findUnique({
            where: { id },
        });
        if (!branchService) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Branch service not found',
            });
            return;
        }
        winston_1.logger.info('Branch service retrieved successfully', {
            branchServiceId: branchService.id,
            title: branchService.title,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Branch service retrieved successfully',
            data: branchService,
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during retrieval of branch service', err);
    }
});
exports.getBranchServiceById = getBranchServiceById;
