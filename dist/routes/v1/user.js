"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const get_current_user_1 = require("../../controllers/v1/user/get-current-user");
const update_current_user_1 = require("../../controllers/v1/user/update-current-user");
const delete_current_user_1 = require("../../controllers/v1/user/delete-current-user");
const get_all_users_1 = require("../../controllers/v1/user/get-all-users");
const get_user_by_id_1 = require("../../controllers/v1/user/get-user-by-id");
const delete_user_by_id_1 = require("../../controllers/v1/user/delete-user-by-id");
const create_user_account_1 = require("../../controllers/v1/user/create-user-account");
const update_user_by_id_1 = require("../../controllers/v1/user/update-user-by-id");
const get_user_sessions_1 = require("../../controllers/v1/user/get-user-sessions");
const revoke_user_session_1 = require("../../controllers/v1/user/revoke-user-session");
const revoke_other_user_sessions_1 = require("../../controllers/v1/user/revoke-other-user-sessions");
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const authentication_1 = require("../../middlewares/authentication");
const enums_1 = require("../../generated/prisma/enums");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const uploadthing_1 = require("../../lib/uploadthing");
const get_session_from_cookie_1 = require("../../middlewares/get-session-from-cookie");
const sanitation_1 = require("../../common/sanitation");
const session_1 = require("../../validators/session");
const user_1 = require("../../validators/user");
const router = (0, express_1.Router)();
const authenticatedUserRoles = [enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN];
router.get('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)(authenticatedUserRoles), get_current_user_1.getCurrentUser);
router.put('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)(authenticatedUserRoles), update_current_user_1.updateCurrentUser);
router.delete('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)(authenticatedUserRoles), delete_current_user_1.deleteCurrentUser);
router.use('/avatar/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '4MB',
    maxFileCount: 1,
}));
router.get('/sessions', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, get_session_from_cookie_1.getSessionFromCookie, (0, authorization_1.default)(authenticatedUserRoles), get_user_sessions_1.getUserSessions);
router.delete('/sessions/others', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, get_session_from_cookie_1.getSessionFromCookie, (0, authorization_1.default)(authenticatedUserRoles), revoke_other_user_sessions_1.revokeOtherUserSessions);
router.delete('/sessions/:sessionId', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, get_session_from_cookie_1.getSessionFromCookie, (0, authorization_1.default)(authenticatedUserRoles), (0, sanitation_1.validate)(session_1.sessionIdPathSchema), revoke_user_session_1.revokeUserSession);
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_all_users_1.getAllUsers);
router.post('/', (0, express_rate_limiter_1.expressRateLimit)('auth'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(user_1.createUserAccountSchema), create_user_account_1.createUserAccount);
router.get('/:userId', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_user_by_id_1.getUserById);
router.put('/:userId', (0, express_rate_limiter_1.expressRateLimit)('auth'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(user_1.updateUserByIdSchema), update_user_by_id_1.updateUserById);
router.delete('/:userId', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), delete_user_by_id_1.deleteUserById);
exports.default = router;
