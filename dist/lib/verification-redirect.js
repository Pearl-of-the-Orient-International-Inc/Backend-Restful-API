"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstructorInvitationUrl = exports.buildPasswordResetUrl = exports.buildVerificationUrl = exports.getVerificationBaseUrlByRole = void 0;
const config_1 = __importDefault(require("@/config"));
const enums_1 = require("@/generated/prisma/enums");
const removeTrailingSlash = (url) => url.replace(/\/+$/, '');
const getVerificationBaseUrlByRole = (role) => {
    const isProduction = config_1.default.NODE_ENV === 'production';
    if (isProduction) {
        if (role === enums_1.UserType.ADMIN) {
            return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_ADMIN_PROD);
        }
        if (role === enums_1.UserType.OFFICER) {
            return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_OFFICER_PROD);
        }
        if (role === enums_1.UserType.INSTRUCTOR) {
            return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_INSTRUCTOR_PROD);
        }
        return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_MEMBER_PROD);
    }
    if (role === enums_1.UserType.ADMIN) {
        return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_ADMIN_DEV || config_1.default.VERIFY_REDIRECT_MEMBER_DEV);
    }
    if (role === enums_1.UserType.OFFICER) {
        return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_OFFICER_DEV || config_1.default.VERIFY_REDIRECT_MEMBER_DEV);
    }
    if (role === enums_1.UserType.INSTRUCTOR) {
        return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_INSTRUCTOR_DEV || config_1.default.VERIFY_REDIRECT_MEMBER_DEV);
    }
    return removeTrailingSlash(config_1.default.VERIFY_REDIRECT_MEMBER_DEV);
};
exports.getVerificationBaseUrlByRole = getVerificationBaseUrlByRole;
const buildVerificationUrl = (role, code) => {
    if (!code) {
        throw new Error('Verification code is missing.');
    }
    return `${(0, exports.getVerificationBaseUrlByRole)(role)}/confirm-account?token=${code}`;
};
exports.buildVerificationUrl = buildVerificationUrl;
const buildPasswordResetUrl = (role, code) => {
    if (!code) {
        throw new Error('Password reset code is missing.');
    }
    return `${(0, exports.getVerificationBaseUrlByRole)(role)}/reset-password?token=${code}`;
};
exports.buildPasswordResetUrl = buildPasswordResetUrl;
const buildInstructorInvitationUrl = (code) => {
    if (!code) {
        throw new Error('Invitation code is missing.');
    }
    return `${(0, exports.getVerificationBaseUrlByRole)(enums_1.UserType.INSTRUCTOR)}/auth/instructor?token=${code}`;
};
exports.buildInstructorInvitationUrl = buildInstructorInvitationUrl;
