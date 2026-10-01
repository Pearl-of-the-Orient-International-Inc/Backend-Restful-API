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
exports.getMemoAnnouncementById = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const getMemoAnnouncementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const memo = yield prisma_1.prisma.memoAnnouncement.findUnique({
            where: { id },
            include: memo_announcement_shared_1.memoInclude,
        });
        if (!memo) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Memo announcement not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Memo announcement retrieved successfully',
            data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(memo),
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during memo announcement retrieval', err);
    }
});
exports.getMemoAnnouncementById = getMemoAnnouncementById;
