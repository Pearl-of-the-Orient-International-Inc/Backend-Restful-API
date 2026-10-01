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
exports.sendMembershipRenewalEmail = exports.getRenewalEmailMemberById = exports.getRenewalProfileUrl = exports.formatRenewalApplicationDate = exports.buildRenewalMemberFullName = void 0;
const config_1 = __importDefault(require("@/config"));
const prisma_1 = require("@/lib/prisma");
const mailers_1 = require("@/mailers");
const membership_renewal_reminder_1 = require("@/mailers/templates/membership-renewal-reminder");
const buildRenewalMemberFullName = (member) => [
    member.firstName,
    member.middleInitial,
    member.lastName,
    member.extensionName,
]
    .filter(Boolean)
    .join(' ');
exports.buildRenewalMemberFullName = buildRenewalMemberFullName;
const formatRenewalApplicationDate = (date) => date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});
exports.formatRenewalApplicationDate = formatRenewalApplicationDate;
const getRenewalProfileUrl = (member) => {
    var _a;
    const appUrl = config_1.default.APP_URL.replace(/\/$/, '');
    return `${appUrl}/profile/${encodeURIComponent((_a = member.uniqueId) !== null && _a !== void 0 ? _a : member.id)}`;
};
exports.getRenewalProfileUrl = getRenewalProfileUrl;
const getRenewalEmailMemberById = (memberId) => prisma_1.prisma.member.findUnique({
    where: { id: memberId },
    select: {
        id: true,
        uniqueId: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        createdAt: true,
        user: {
            select: {
                email: true,
            },
        },
    },
});
exports.getRenewalEmailMemberById = getRenewalEmailMemberById;
const sendMembershipRenewalEmail = (member) => __awaiter(void 0, void 0, void 0, function* () {
    const memberName = (0, exports.buildRenewalMemberFullName)(member);
    const template = (0, membership_renewal_reminder_1.membershipRenewalReminderTemplate)({
        applicationDate: (0, exports.formatRenewalApplicationDate)(member.createdAt),
        memberName,
        profileUrl: (0, exports.getRenewalProfileUrl)(member),
    });
    return (0, mailers_1.sendMail)({
        sendTo: member.user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
    });
});
exports.sendMembershipRenewalEmail = sendMembershipRenewalEmail;
