"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressRateLimit = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const defaultLimitOpt = {
    windowMs: 6000,
    legacyHeaders: false,
    standardHeaders: true,
};
const rateLimitOpt = new Map([
    ['basic', Object.assign(Object.assign({}, defaultLimitOpt), { limit: 100 })],
    ['auth', Object.assign(Object.assign({}, defaultLimitOpt), { limit: 10 })],
    ['passwordReset', Object.assign(Object.assign({}, defaultLimitOpt), { limit: 3 })],
]);
const expressRateLimit = (type) => {
    return (0, express_rate_limit_1.rateLimit)(rateLimitOpt.get(type));
};
exports.expressRateLimit = expressRateLimit;
