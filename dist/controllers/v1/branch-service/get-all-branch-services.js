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
exports.getAllBranchServices = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getAllBranchServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const orderByFieldMap = {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
            title: 'title',
        };
        const orderByField = orderByFieldMap[sortBy] || 'createdAt';
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ],
            }
            : {};
        const totalCount = yield prisma_1.prisma.branchOfService.count({ where });
        const branchServices = yield prisma_1.prisma.branchOfService.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [orderByField]: sortOrder,
            },
        });
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        winston_1.logger.info('Branch services retrieved successfully', {
            count: branchServices.length,
            page,
            totalCount,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Branch services retrieved successfully',
            data: branchServices,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage,
                hasPreviousPage,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during retrieval of branch services', err);
    }
});
exports.getAllBranchServices = getAllBranchServices;
