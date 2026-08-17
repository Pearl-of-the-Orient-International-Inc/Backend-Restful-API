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
exports.generateGradeRecordNumber = exports.defaultGradeStatus = exports.buildGradeRemark = exports.getProgramLabel = exports.getStudentName = exports.toGradeRecordResponse = exports.getGradeRecordWhereForUser = void 0;
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const programLabels = {
    BACHELOR: 'Bachelor',
    CERTIFICATE: 'Certificate',
    DOCTORATE_WITH_DISSERTATION: 'Doctorate',
    MASTER_WITH_THESIS: 'Masteral',
};
const getGradeRecordWhereForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.getGradeRecordWhereForUser = getGradeRecordWhereForUser;
const toGradeRecordResponse = (record) => record;
exports.toGradeRecordResponse = toGradeRecordResponse;
const getStudentName = (student) => [student.givenName, student.middleName, student.surname]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
exports.getStudentName = getStudentName;
const getProgramLabel = (program) => { var _a; return program ? (_a = programLabels[program]) !== null && _a !== void 0 ? _a : program : 'Certificate'; };
exports.getProgramLabel = getProgramLabel;
const buildGradeRemark = (finalGrade) => {
    const grade = Number(finalGrade);
    if (!Number.isFinite(grade))
        return enums_1.SeminaryGradeRecordRemark.ONGOING;
    if (grade <= 2.5)
        return enums_1.SeminaryGradeRecordRemark.PASSED;
    if (grade < 5)
        return enums_1.SeminaryGradeRecordRemark.CONDITIONAL;
    return enums_1.SeminaryGradeRecordRemark.FAILED;
};
exports.buildGradeRemark = buildGradeRemark;
exports.defaultGradeStatus = enums_1.SeminaryGradeRecordStatus.PENDING_REVIEW;
const generateGradeRecordNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = (0, node_crypto_1.randomBytes)(2).toString('hex').toUpperCase();
    return `POTSC-GR-${year}-${timestamp}-${suffix}`;
});
exports.generateGradeRecordNumber = generateGradeRecordNumber;
