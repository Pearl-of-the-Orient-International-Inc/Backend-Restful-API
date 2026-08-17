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
exports.getExaminationWhereForUser = exports.toExaminationResponse = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const toExaminationResponse = (examination) => (Object.assign(Object.assign({}, examination), { durationMinutes: String(examination.durationMinutes), passingScore: String(examination.passingScore), questions: Array.isArray(examination.questions) ? examination.questions : [], totalPoints: String(examination.totalPoints) }));
exports.toExaminationResponse = toExaminationResponse;
const getExaminationWhereForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        return {};
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if ((user === null || user === void 0 ? void 0 : user.role) !== enums_1.UserType.INSTRUCTOR)
        return {};
    return { instructorUserId: userId };
});
exports.getExaminationWhereForUser = getExaminationWhereForUser;
