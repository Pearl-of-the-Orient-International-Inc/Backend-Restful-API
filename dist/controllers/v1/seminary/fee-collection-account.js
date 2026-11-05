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
exports.ensureSeminaryFeeCollectionAccount = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const fee_configuration_shared_1 = require("./fee-configuration-shared");
const programKeys = {
    [enums_1.SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
    [enums_1.SeminaryProgramLevel.BACHELOR]: 'Bachelor',
    [enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
    [enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};
const programLabels = {
    [enums_1.SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
    [enums_1.SeminaryProgramLevel.BACHELOR]: 'Bachelor',
    [enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
    [enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};
const getBreakdowns = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fee_configuration_shared_1.defaultFeeBreakdowns;
    }
    return value;
};
const getTotal = (items) => (items !== null && items !== void 0 ? items : []).reduce((total, item) => total + (Number.isFinite(item.amount) ? item.amount : 0), 0);
const getStudentName = ({ givenName, middleName, surname, }) => [givenName, middleName, surname].filter(Boolean).join(' ').trim() || 'Student';
const ensureSeminaryFeeCollectionAccount = (tx, student) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const configuration = yield tx.seminaryFeeConfiguration.findUnique({
        where: { id: 'default' },
        select: { feeBreakdowns: true },
    });
    const breakdowns = getBreakdowns((_a = configuration === null || configuration === void 0 ? void 0 : configuration.feeBreakdowns) !== null && _a !== void 0 ? _a : fee_configuration_shared_1.defaultFeeBreakdowns);
    const totalCharges = getTotal(breakdowns[programKeys[student.programLevel]]);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return tx.seminaryFeeCollectionAccount.upsert({
        where: { studentId: student.studentId },
        create: {
            referenceNumber: `POTSC-FEE-${student.studentId}`,
            studentId: student.studentId,
            studentName: getStudentName(student),
            program: ((_b = student.programCourse) === null || _b === void 0 ? void 0 : _b.trim()) || programLabels[student.programLevel],
            programLevel: student.programLevel,
            totalCharges,
            amountPaid: 0,
            balance: totalCharges,
            dueDate,
            paymentMethod: 'Cash',
        },
        update: {},
    });
});
exports.ensureSeminaryFeeCollectionAccount = ensureSeminaryFeeCollectionAccount;
