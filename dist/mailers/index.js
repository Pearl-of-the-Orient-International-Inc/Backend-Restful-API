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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const winston_1 = require("../lib/winston");
const userEmail = config_1.default.SMTP_EMAIL;
const appPassword = config_1.default.SMTP_PASSWORD;
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: userEmail,
        pass: appPassword,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
function sendMail(_a) {
    return __awaiter(this, arguments, void 0, function* ({ sendTo, subject, text, html, }) {
        try {
            yield transporter.verify();
            const info = yield transporter.sendMail({
                from: userEmail,
                to: sendTo,
                subject: subject,
                text: text,
                html: html ? html : '',
            });
            winston_1.logger.info('Email sent successfully', {
                messageId: info.messageId,
                to: sendTo,
            });
            return { success: true, messageId: info.messageId };
        }
        catch (error) {
            winston_1.logger.error('Failed to send email', {
                to: sendTo,
                subject,
                error,
            });
            return { success: false, error };
        }
    });
}
