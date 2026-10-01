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
exports.revokeUserSession = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const revokeUserSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const currentSessionId = req.sessionId;
        const sessionId = req.params.sessionId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        if (!sessionId || Array.isArray(sessionId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid session ID',
            });
            return;
        }
        if (currentSessionId && sessionId === currentSessionId) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Cannot revoke the current session from this endpoint',
            });
            return;
        }
        const session = yield prisma_1.prisma.session.findFirst({
            where: {
                id: sessionId,
                userId,
            },
            select: {
                id: true,
            },
        });
        if (!session) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Session not found',
            });
            return;
        }
        yield prisma_1.prisma.session.delete({
            where: {
                id: sessionId,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.NO_CONTENT).send();
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while revoking user session', err);
    }
});
exports.revokeUserSession = revokeUserSession;
