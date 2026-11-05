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
exports.deleteSeminaryStudyMaterial = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const deleteSeminaryStudyMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        if (!req.userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const [material, user] = yield Promise.all([
            prisma_1.prisma.seminaryStudyMaterial.findUnique({
                where: { id },
                select: { id: true, uploadedByUserId: true },
            }),
            prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: { role: true },
            }),
        ]);
        if (!material) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Study material not found',
            });
            return;
        }
        if (!user ||
            (user.role === enums_1.UserType.INSTRUCTOR && material.uploadedByUserId !== req.userId)) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'You can manage only study materials you uploaded',
            });
            return;
        }
        yield prisma_1.prisma.seminaryStudyMaterial.delete({ where: { id } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Study material deleted successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting seminary study material', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteSeminaryStudyMaterial = deleteSeminaryStudyMaterial;
