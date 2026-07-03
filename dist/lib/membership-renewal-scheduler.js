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
exports.stopMembershipRenewalScheduler = exports.startMembershipRenewalScheduler = void 0;
const config_1 = __importDefault(require("../config"));
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
const winston_1 = require("../lib/winston");
const member_renewal_email_1 = require("../lib/member-renewal-email");
const MIN_INTERVAL_MS = 60000;
const MEMBERSHIP_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;
let membershipRenewalSchedulerTimer = null;
const resolveIntervalMs = () => {
    const rawInterval = Number(config_1.default.MEMBERSHIP_RENEWAL_SCHEDULER_INTERVAL_MS);
    if (!Number.isFinite(rawInterval) || rawInterval < MIN_INTERVAL_MS) {
        return MIN_INTERVAL_MS;
    }
    return rawInterval;
};
const runMembershipRenewalSchedulerTick = () => __awaiter(void 0, void 0, void 0, function* () {
    const renewalCutoff = new Date(Date.now() - MEMBERSHIP_VALIDITY_MS);
    try {
        const expiredMembers = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                createdAt: {
                    lte: renewalCutoff,
                },
                user: {
                    accountStatus: enums_1.UserAccountStatus.ACTIVE,
                },
            },
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
        if (expiredMembers.length === 0) {
            return;
        }
        yield prisma_1.prisma.member.updateMany({
            where: {
                id: {
                    in: expiredMembers.map((member) => member.id),
                },
            },
            data: {
                isActive: false,
            },
        });
        yield Promise.all(expiredMembers.map((member) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, member_renewal_email_1.sendMembershipRenewalEmail)(member);
            if (!result.success) {
                winston_1.logger.warn('Membership renewal email failed', {
                    memberId: member.id,
                    email: member.user.email,
                });
            }
        })));
        winston_1.logger.info('Membership renewal scheduler processed expired members', {
            count: expiredMembers.length,
            renewalCutoff,
        });
    }
    catch (error) {
        winston_1.logger.error('Membership renewal scheduler tick failed', { error });
    }
});
const startMembershipRenewalScheduler = () => {
    if (membershipRenewalSchedulerTimer) {
        return;
    }
    const intervalMs = resolveIntervalMs();
    void runMembershipRenewalSchedulerTick();
    membershipRenewalSchedulerTimer = setInterval(() => {
        void runMembershipRenewalSchedulerTick();
    }, intervalMs);
    winston_1.logger.info(`Membership renewal scheduler started with ${intervalMs}ms interval`);
};
exports.startMembershipRenewalScheduler = startMembershipRenewalScheduler;
const stopMembershipRenewalScheduler = () => {
    if (!membershipRenewalSchedulerTimer) {
        return;
    }
    clearInterval(membershipRenewalSchedulerTimer);
    membershipRenewalSchedulerTimer = null;
    winston_1.logger.info('Membership renewal scheduler stopped');
};
exports.stopMembershipRenewalScheduler = stopMembershipRenewalScheduler;
