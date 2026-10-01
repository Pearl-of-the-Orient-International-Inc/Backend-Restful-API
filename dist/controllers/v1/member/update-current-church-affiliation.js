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
exports.updateCurrentChurchAffiliation = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const updateCurrentChurchAffiliation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { userId },
            select: {
                id: true,
                uniqueId: true,
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const { churchAffiliation, churchAddress, currentPositionRole, currentPositionRoleOther, } = req.body;
        const normalizeOptional = (value) => {
            const trimmed = value === null || value === void 0 ? void 0 : value.trim();
            return trimmed ? trimmed : null;
        };
        const updatedMember = yield prisma_1.prisma.member.update({
            where: { id: member.id },
            data: {
                churchAffiliation: normalizeOptional(churchAffiliation),
                churchAddress: normalizeOptional(churchAddress),
                currentPositionRole: normalizeOptional(currentPositionRole),
                currentPositionRoleOther: normalizeOptional(currentPositionRoleOther),
            },
            select: {
                id: true,
                uniqueId: true,
                churchAffiliation: true,
                churchAddress: true,
                currentPositionRole: true,
                currentPositionRoleOther: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Church affiliation updated successfully',
            data: updatedMember,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating current church affiliation', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateCurrentChurchAffiliation = updateCurrentChurchAffiliation;
