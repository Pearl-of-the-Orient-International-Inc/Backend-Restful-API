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
exports.buildMemberCredentialVerificationToken = exports.buildNextMemberCredentialBarcodeNumber = exports.buildNextMemberCredentialDocumentNumber = exports.memberCredentialDocumentInclude = void 0;
const node_crypto_1 = require("node:crypto");
const enums_1 = require("@/generated/prisma/enums");
const documentPrefixMap = {
    [enums_1.MemberCredentialDocumentType.CERTIFICATE]: 'CHAP-CERT',
    [enums_1.MemberCredentialDocumentType.RECOGNITION]: 'CHAP-REC',
};
const barcodeTypeCodeMap = {
    [enums_1.MemberCredentialDocumentType.CERTIFICATE]: '4',
    [enums_1.MemberCredentialDocumentType.RECOGNITION]: '5',
};
exports.memberCredentialDocumentInclude = {
    member: {
        select: {
            id: true,
            uniqueId: true,
            firstName: true,
            lastName: true,
            user: {
                select: {
                    email: true,
                },
            },
        },
    },
};
const buildNextMemberCredentialDocumentNumber = (tx_1, type_1, ...args_1) => __awaiter(void 0, [tx_1, type_1, ...args_1], void 0, function* (tx, type, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `${documentPrefixMap[type]}-${yearSuffix}-`;
    const latestDocument = yield tx.memberCredentialDocument.findFirst({
        where: {
            documentNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            documentNumber: 'desc',
        },
        select: {
            documentNumber: true,
        },
    });
    const latestSeries = (latestDocument === null || latestDocument === void 0 ? void 0 : latestDocument.documentNumber)
        ? Number.parseInt(latestDocument.documentNumber.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(6, '0')}`;
});
exports.buildNextMemberCredentialDocumentNumber = buildNextMemberCredentialDocumentNumber;
const calculateEan13CheckDigit = (twelveDigits) => {
    const sum = twelveDigits
        .split('')
        .reduce((total, digit, index) => {
        const value = Number.parseInt(digit, 10);
        return total + value * (index % 2 === 0 ? 1 : 3);
    }, 0);
    return String((10 - (sum % 10)) % 10);
};
const buildNextMemberCredentialBarcodeNumber = (tx_1, type_1, ...args_1) => __awaiter(void 0, [tx_1, type_1, ...args_1], void 0, function* (tx, type, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `978${barcodeTypeCodeMap[type]}${yearSuffix}`;
    const latestDocument = yield tx.memberCredentialDocument.findFirst({
        where: {
            barcodeNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            barcodeNumber: 'desc',
        },
        select: {
            barcodeNumber: true,
        },
    });
    const latestSeries = (latestDocument === null || latestDocument === void 0 ? void 0 : latestDocument.barcodeNumber)
        ? Number.parseInt(latestDocument.barcodeNumber.slice(prefix.length, 12), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    const payload = `${prefix}${String(nextSeries).padStart(6, '0')}`;
    return `${payload}${calculateEan13CheckDigit(payload)}`;
});
exports.buildNextMemberCredentialBarcodeNumber = buildNextMemberCredentialBarcodeNumber;
const buildMemberCredentialVerificationToken = () => (0, node_crypto_1.randomBytes)(24).toString('hex');
exports.buildMemberCredentialVerificationToken = buildMemberCredentialVerificationToken;
