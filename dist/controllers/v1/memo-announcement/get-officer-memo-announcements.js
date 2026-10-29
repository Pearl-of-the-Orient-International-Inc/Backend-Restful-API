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
exports.getOfficerMemoAnnouncements = void 0;
const http_codes_1 = require("@/common/http-codes");
const officer_scope_1 = require("@/lib/officer-scope");
const prisma_1 = require("@/lib/prisma");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const getOfficerMemoAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, officer_scope_1.requireOfficerScope)(req.userId);
        const memos = yield prisma_1.prisma.memoAnnouncement.findMany({ where: { authorUserId: req.userId }, orderBy: { updatedAt: 'desc' }, include: memo_announcement_shared_1.memoInclude });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Officer memo drafts retrieved successfully', data: memos.map(memo_announcement_shared_1.serializeMemoAnnouncement) });
    }
    catch (error) {
        const status = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ code: status === http_codes_1.HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Internal server error' });
    }
});
exports.getOfficerMemoAnnouncements = getOfficerMemoAnnouncements;
