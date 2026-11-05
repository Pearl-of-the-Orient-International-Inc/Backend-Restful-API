"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFeeCollectionResponse = exports.normalizeFeeCollectionStatus = exports.feeCollectionProgramLabels = exports.feeCollectionStatusLabels = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const decimalToNumber = (value) => Number(value.toString());
exports.feeCollectionStatusLabels = {
    [enums_1.SeminaryFeeCollectionStatus.PENDING]: 'Pending',
    [enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID]: 'Partially Paid',
    [enums_1.SeminaryFeeCollectionStatus.PAID]: 'Paid',
    [enums_1.SeminaryFeeCollectionStatus.OVERDUE]: 'Overdue',
};
exports.feeCollectionProgramLabels = {
    [enums_1.SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
    [enums_1.SeminaryProgramLevel.BACHELOR]: 'Bachelor',
    [enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
    [enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};
const normalizeFeeCollectionStatus = (status) => {
    var _a;
    return ((_a = {
        Pending: enums_1.SeminaryFeeCollectionStatus.PENDING,
        PENDING: enums_1.SeminaryFeeCollectionStatus.PENDING,
        'Partially Paid': enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID,
        PARTIALLY_PAID: enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID,
        Paid: enums_1.SeminaryFeeCollectionStatus.PAID,
        PAID: enums_1.SeminaryFeeCollectionStatus.PAID,
        Overdue: enums_1.SeminaryFeeCollectionStatus.OVERDUE,
        OVERDUE: enums_1.SeminaryFeeCollectionStatus.OVERDUE,
    }[status]) !== null && _a !== void 0 ? _a : enums_1.SeminaryFeeCollectionStatus.PENDING);
};
exports.normalizeFeeCollectionStatus = normalizeFeeCollectionStatus;
const toFeeCollectionResponse = (account) => (Object.assign(Object.assign({}, account), { amountPaid: decimalToNumber(account.amountPaid), balance: decimalToNumber(account.balance), programLevelLabel: exports.feeCollectionProgramLabels[account.programLevel], statusLabel: exports.feeCollectionStatusLabels[account.status], totalCharges: decimalToNumber(account.totalCharges) }));
exports.toFeeCollectionResponse = toFeeCollectionResponse;
