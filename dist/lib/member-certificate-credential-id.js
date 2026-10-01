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
exports.generateNextMemberCertificateCredentialId = generateNextMemberCertificateCredentialId;
const prisma_1 = require("@/lib/prisma");
const SERIES_WIDTH = 5;
const buildInitials = (firstName, middleInitial, lastName) => {
    const first = firstName.trim().charAt(0) || 'X';
    const middle = (middleInitial === null || middleInitial === void 0 ? void 0 : middleInitial.trim().charAt(0)) || 'X';
    const last = lastName.trim().charAt(0) || 'X';
    return `${first}${middle}${last}`.toUpperCase();
};
function generateNextMemberCertificateCredentialId(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const initials = buildInitials(input.firstName, input.middleInitial, input.lastName);
        const prefix = `CERT-${initials}-`;
        const latestCertificate = yield prisma_1.prisma.memberCertificate.findFirst({
            where: {
                credentialId: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                credentialId: 'desc',
            },
            select: {
                credentialId: true,
            },
        });
        const currentSeries = (latestCertificate === null || latestCertificate === void 0 ? void 0 : latestCertificate.credentialId)
            ? Number.parseInt(latestCertificate.credentialId.slice(prefix.length), 10) || 0
            : 0;
        const nextSeries = (currentSeries + 1).toString().padStart(SERIES_WIDTH, '0');
        return `${prefix}${nextSeries}`;
    });
}
