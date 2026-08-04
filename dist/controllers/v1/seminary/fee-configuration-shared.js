"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFeeConfigurationUpdateData = exports.buildFeeConfigurationCreateData = exports.defaultFeeConfiguration = exports.defaultFeeBreakdowns = void 0;
exports.defaultFeeBreakdowns = {
    Certificate: [
        { label: 'Registration Fee', amount: 500 },
        { label: 'Tuition Fee', amount: 3000 },
        { label: 'School Uniform', amount: 900 },
        { label: 'Graduation Fee', amount: 5000 },
        { label: 'Google Meet Subscription', amount: 100 },
    ],
    Bachelor: [
        { label: 'Registration Fee', amount: 1000 },
        { label: 'Tuition Fee', amount: 30000 },
        { label: 'Miscellaneous Fee', amount: 2000 },
        { label: 'Graduation Fee', amount: 8000 },
    ],
    Masteral: [
        { label: 'Registration Fee', amount: 1000 },
        { label: 'Tuition Fee', amount: 30000 },
        { label: 'Miscellaneous Fee', amount: 2000 },
        { label: 'Graduation Fee', amount: 8000 },
    ],
    Doctorate: [
        { label: 'Registration Fee', amount: 1000 },
        { label: 'Tuition Fee', amount: 40000 },
        { label: 'Miscellaneous Fee', amount: 2000 },
        { label: 'Graduation Fee', amount: 8000 },
    ],
};
exports.defaultFeeConfiguration = {
    id: 'default',
    feeBreakdowns: exports.defaultFeeBreakdowns,
};
const buildFeeConfigurationCreateData = (body) => ({
    id: 'default',
    feeBreakdowns: body.feeBreakdowns,
});
exports.buildFeeConfigurationCreateData = buildFeeConfigurationCreateData;
const buildFeeConfigurationUpdateData = (body) => ({
    feeBreakdowns: body.feeBreakdowns,
});
exports.buildFeeConfigurationUpdateData = buildFeeConfigurationUpdateData;
