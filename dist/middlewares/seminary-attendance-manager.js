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
exports.authorizeSeminaryAttendanceManager = void 0;
const http_codes_1 = require("../common/http-codes");
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
const winston_1 = require("../lib/winston");
const authorizeSeminaryAttendanceManager = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.userId) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        return;
    }
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true, position: true },
        });
        const canManage = (user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.INSTRUCTOR || ((user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.ADMIN && user.position === enums_1.UserPosition.REGISTRAR);
        if (!canManage) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only instructors and the Registrar can manage attendance',
            });
            return;
        }
        next();
    }
    catch (err) {
        winston_1.logger.error('Error authorizing seminary attendance manager', { err, userId: req.userId });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.authorizeSeminaryAttendanceManager = authorizeSeminaryAttendanceManager;
