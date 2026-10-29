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
exports.rejectMemoAnnouncement = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const rejectMemoAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reviewNotes = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.reviewNotes) === 'string' ? req.body.reviewNotes.trim() : '';
    const memo = yield prisma_1.prisma.memoAnnouncement.findUnique({
        where: { id },
        select: { id: true, status: true, authorUserId: true },
    });
    if (!memo) {
        res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
            code: 'NOT_FOUND',
            message: 'Memo announcement not found',
        });
        return;
    }
    if (!memo.authorUserId) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
            code: 'BAD_REQUEST',
            message: 'Only officer-submitted memos can be rejected through review.',
        });
        return;
    }
    if (memo.status !== client_1.MemoStatus.DRAFT) {
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
            code: 'BAD_REQUEST',
            message: 'Only draft memos can be rejected.',
        });
        return;
    }
    const rejected = yield prisma_1.prisma.memoAnnouncement.update({
        where: { id: memo.id },
        data: {
            status: client_1.MemoStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedByUserId: (_b = req.userId) !== null && _b !== void 0 ? _b : null,
            reviewNotes: reviewNotes || null,
        },
        include: memo_announcement_shared_1.memoInclude,
    });
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Officer memo rejected',
        data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(rejected),
    });
});
exports.rejectMemoAnnouncement = rejectMemoAnnouncement;
