"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePlatformFee = exports.paymentFeePolicies = void 0;
const config_1 = __importDefault(require("../config"));
exports.paymentFeePolicies = {
    XENDIT: {
        percent: config_1.default.XENDIT_PLATFORM_FEE_PERCENT,
        fixed: config_1.default.XENDIT_PLATFORM_FEE_FIXED,
    },
    PAYPAL: {
        percent: config_1.default.PAYPAL_PLATFORM_FEE_PERCENT,
        fixed: config_1.default.PAYPAL_PLATFORM_FEE_FIXED,
    },
};
const calculatePlatformFee = (amount, gateway) => {
    if (!gateway)
        return 0;
    const policy = exports.paymentFeePolicies[gateway];
    return Number((amount * (policy.percent / 100) + policy.fixed).toFixed(2));
};
exports.calculatePlatformFee = calculatePlatformFee;
