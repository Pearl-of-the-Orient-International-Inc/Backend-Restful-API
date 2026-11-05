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
exports.getCurrentOfficerMembers = void 0;
const http_codes_1 = require("../../../common/http-codes");
const officer_scope_1 = require("../../../lib/officer-scope");
const prisma_1 = require("../../../lib/prisma");
const getCurrentOfficerMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const scope = yield (0, officer_scope_1.requireOfficerScope)(req.userId);
        const page = Math.max(1, Number.parseInt(String((_a = req.query.page) !== null && _a !== void 0 ? _a : '1'), 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(String((_b = req.query.limit) !== null && _b !== void 0 ? _b : '20'), 10) || 20));
        const search = String((_c = req.query.search) !== null && _c !== void 0 ? _c : '').trim();
        const where = Object.assign(Object.assign({}, scope.memberWhere), (search ? { OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { uniqueId: { contains: search, mode: 'insensitive' } },
            ] } : {}));
        const [totalCount, members] = yield Promise.all([
            prisma_1.prisma.member.count({ where }),
            prisma_1.prisma.member.findMany({
                where, skip: (page - 1) * limit, take: limit,
                orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
                select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, memberType: true, region: true, province: true, municipalityCity: true, barangay: true, user: { select: { avatar: true } } },
            }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Scoped members retrieved successfully', data: members, pagination: { currentPage: page, totalPages: Math.ceil(totalCount / limit), totalCount, limit } });
    }
    catch (error) {
        const status = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ code: status === http_codes_1.HTTPSTATUS.FORBIDDEN ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Internal server error' });
    }
});
exports.getCurrentOfficerMembers = getCurrentOfficerMembers;
