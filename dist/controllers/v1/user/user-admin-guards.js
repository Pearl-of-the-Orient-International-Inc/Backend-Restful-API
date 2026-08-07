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
exports.ensureItAdmin = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const ensureItAdmin = (userId, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
        return false;
    }
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            position: true,
        },
    });
    if (!user) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'User not found',
        });
        return false;
    }
    if (user.role !== enums_1.UserType.ADMIN || user.position !== enums_1.UserPosition.IT) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
            code: 'FORBIDDEN',
            message: 'Only IT admins can perform this account action',
        });
        return false;
    }
    return true;
});
exports.ensureItAdmin = ensureItAdmin;
