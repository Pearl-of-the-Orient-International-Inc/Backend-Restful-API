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
exports.getCurrentSeminaryStudentNotifications = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getCurrentSeminaryStudentNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const student = yield prisma_1.prisma.seminaryApplication.findFirst({
            where: {
                studentId: { not: null },
                OR: [{ portalUserId: userId }, { member: { userId } }],
            },
            select: { id: true },
        });
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.OK).json({
                code: 'OK',
                message: 'Student notifications retrieved successfully',
                data: [],
            });
            return;
        }
        const notifications = yield prisma_1.prisma.seminaryStudentNotification.findMany({
            where: { studentApplicationId: student.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Student notifications retrieved successfully',
            data: notifications,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting seminary student notifications', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getCurrentSeminaryStudentNotifications = getCurrentSeminaryStudentNotifications;
