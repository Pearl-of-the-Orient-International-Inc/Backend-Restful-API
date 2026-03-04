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
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const authentication_1 = require("../../middlewares/authentication");
const enums_1 = require("../../generated/prisma/enums");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const uploadthing_1 = require("../../lib/uploadthing");
const router = (0, express_1.Router)();
router.get('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.ADMIN]), get_current_user_1.getCurrentUser);
router.put('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.ADMIN]), update_current_user_1.updateCurrentUser);
router.delete('/current', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.ADMIN]), delete_current_user_1.deleteCurrentUser);
router.use('/avatar/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '4MB',
    maxFileCount: 1,
}));
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_all_users_1.getAllUsers);
router.get('/:userId', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_user_by_id_1.getUserById);
router.delete('/:userId', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), delete_user_by_id_1.deleteUserById);
exports.default = router;
