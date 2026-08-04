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
exports.getAllSeminaryFeeCollections = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const fee_collection_shared_1 = require("./fee-collection-shared");
const getAllSeminaryFeeCollections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const query = req.query;
        const page = query.page ? Number(query.page) : 1;
        const limit = query.limit ? Number(query.limit) : undefined;
        const skip = limit ? (page - 1) * limit : undefined;
        const search = (_a = query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const where = Object.assign(Object.assign(Object.assign({}, (query.programLevel ? { programLevel: query.programLevel } : {})), (query.status ? { status: (0, fee_collection_shared_1.normalizeFeeCollectionStatus)(query.status) } : {})), (search
            ? {
                OR: [
                    { studentName: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                    { referenceNumber: { contains: search, mode: 'insensitive' } },
                    { program: { contains: search, mode: 'insensitive' } },
                    { paymentMethod: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [accounts, total] = yield Promise.all([
            prisma_1.prisma.seminaryFeeCollectionAccount.findMany(Object.assign({ where, orderBy: [{ dueDate: 'asc' }, { studentName: 'asc' }] }, (limit ? { skip, take: limit } : {}))),
            prisma_1.prisma.seminaryFeeCollectionAccount.count({ where }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary fee collection accounts retrieved successfully',
            data: accounts.map(fee_collection_shared_1.toFeeCollectionResponse),
            meta: limit
                ? {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
                : undefined,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary fee collection accounts', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllSeminaryFeeCollections = getAllSeminaryFeeCollections;
