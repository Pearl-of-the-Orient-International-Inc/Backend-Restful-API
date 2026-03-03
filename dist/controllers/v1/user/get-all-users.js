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
exports.getAllUsers = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = req.query.limit
            ? parseInt(req.query.limit)
            : undefined;
        const offset = req.query.offset
            ? parseInt(req.query.offset)
            : undefined;
        const total = yield prisma_1.prisma.user.count();
        const users = yield prisma_1.prisma.user.findMany(Object.assign(Object.assign(Object.assign({}, (limit && { take: limit })), (offset && { skip: offset })), { select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                role: true,
            }, orderBy: {
                createdAt: 'desc',
            } }));
        const response = {
            total,
            users,
        };
        if (limit) {
            response.limit = limit;
            response.offset = offset !== null && offset !== void 0 ? offset : 0;
            response.totalPages = Math.ceil(total / limit);
            response.currentPage = Math.floor((offset !== null && offset !== void 0 ? offset : 0) / limit) + 1;
            response.hasMore = (offset !== null && offset !== void 0 ? offset : 0) + limit < total;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json(response);
    }
    catch (err) {
        winston_1.logger.error('Error while getting all users', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            error: err,
        });
    }
});
exports.getAllUsers = getAllUsers;
