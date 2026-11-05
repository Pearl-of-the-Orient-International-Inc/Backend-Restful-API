"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logtail = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const node_1 = require("@logtail/node");
const winston_2 = require("@logtail/winston");
const config_1 = __importDefault(require("../config"));
const transports = [];
if (!config_1.default.LOGTAIL_SOURCE_TOKEN || !config_1.default.LOGTAIL_INGESTING_HOST) {
    throw new Error('Logtail source token or ingesting host is missing');
}
const logtail = new node_1.Logtail(config_1.default.LOGTAIL_SOURCE_TOKEN, {
    endpoint: config_1.default.LOGTAIL_INGESTING_HOST,
});
exports.logtail = logtail;
if (config_1.default.NODE_ENV === 'production') {
    transports.push(new winston_2.LogtailTransport(logtail));
}
const { combine, timestamp, printf, colorize } = winston_1.default.format;
if (config_1.default.NODE_ENV === 'development') {
    transports.push(new winston_1.default.transports.Console({
        format: combine(colorize({ all: true }), timestamp({ format: 'DD MMMM hh:mm:ss A' }), printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })),
    }));
}
const logger = winston_1.default.createLogger({
    transports,
});
exports.logger = logger;
