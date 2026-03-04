"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionIdPathSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.sessionIdPathSchema = zod_1.default.object({
    sessionId: zod_1.default.uuid({ error: 'Session ID must be a valid UUID' }),
});
