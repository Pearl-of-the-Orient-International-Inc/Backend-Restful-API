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
exports.createOfficerMemoAnnouncement = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const officer_scope_1 = require("@/lib/officer-scope");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const memo_announcement_shared_1 = require("./memo-announcement-shared");
const createOfficerMemoAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const scope = yield (0, officer_scope_1.requireOfficerScope)(req.userId);
        const body = req.body;
        const recipients = yield (0, memo_announcement_shared_1.resolveMemoRecipientsByMemberWhere)(scope.memberWhere);
        if (!recipients.length)
            throw new Error('There are no active approved members in your current scope');
        let memo;
        for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
                const referenceNumber = yield (0, memo_announcement_shared_1.generateReferenceNumber)();
                memo = yield prisma_1.prisma.memoAnnouncement.create({
                    data: { referenceNumber, title: body.title.trim(), category: body.category, customCategory: ((_a = body.customCategory) === null || _a === void 0 ? void 0 : _a.trim()) || null, summary: ((_b = body.summary) === null || _b === void 0 ? void 0 : _b.trim()) || null, documentName: ((_c = body.documentName) === null || _c === void 0 ? void 0 : _c.trim()) || `${referenceNumber}.docx`, authorUserId: req.userId, recipients: { create: recipients } },
                    include: memo_announcement_shared_1.memoInclude,
                });
                break;
            }
            catch (error) {
                if (!(error instanceof client_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002' || attempt === 4)
                    throw error;
            }
        }
        if (!memo)
            throw new Error('Unable to generate a unique memo reference number');
        const docx = body.docxBase64
            ? yield (0, memo_announcement_shared_1.writeMemoDocx)({ memoId: memo.id, documentName: memo.documentName, docxBase64: body.docxBase64 })
            : yield (0, memo_announcement_shared_1.writeOfficerMemoDocument)({
                memoId: memo.id,
                documentName: memo.documentName,
                title: body.title.trim(),
                content: (_d = body.content) !== null && _d !== void 0 ? _d : '',
            });
        yield (0, memo_announcement_shared_1.upsertMemoAttachments)({ memoId: memo.id, docx });
        yield prisma_1.prisma.memoAnnouncement.update({ where: { id: memo.id }, data: { docxFilePath: docx.filePath } });
        const savedMemo = yield prisma_1.prisma.memoAnnouncement.findUniqueOrThrow({ where: { id: memo.id }, include: memo_announcement_shared_1.memoInclude });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Memo draft created and submitted for administrator review', data: (0, memo_announcement_shared_1.serializeMemoAnnouncement)(savedMemo) });
    }
    catch (error) {
        const status = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : http_codes_1.HTTPSTATUS.BAD_REQUEST;
        res.status(status).json({ code: status === http_codes_1.HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Unable to create memo draft' });
        winston_1.logger.error('Error creating officer memo announcement', { error, userId: req.userId });
    }
});
exports.createOfficerMemoAnnouncement = createOfficerMemoAnnouncement;
