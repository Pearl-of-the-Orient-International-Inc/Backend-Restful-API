"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_codes_1 = require("../../common/http-codes");
const auth_1 = __importDefault(require("../../routes/v1/auth"));
const user_1 = __importDefault(require("../../routes/v1/user"));
const member_1 = __importDefault(require("../../routes/v1/member"));
const branch_service_1 = __importDefault(require("../../routes/v1/branch-service"));
const office_title_1 = __importDefault(require("../../routes/v1/office-title"));
const event_1 = __importDefault(require("../../routes/v1/event"));
const news_blog_1 = __importDefault(require("../../routes/v1/news-blog"));
const report_1 = __importDefault(require("../../routes/v1/report"));
const activity_log_1 = __importDefault(require("../../routes/v1/activity-log"));
const backup_database_1 = __importDefault(require("../../routes/v1/backup-database"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'API is live',
        status: 'ok',
        version: '1.0.0',
        docs: 'https://docs-api.pearl-chaplaincy.com',
        developer: 'Kyle Andre Lim',
        timestamp: new Date().toISOString(),
    });
});
router.use('/auth', auth_1.default);
router.use('/users', user_1.default);
router.use('/members', member_1.default);
router.use('/branch-service', branch_service_1.default);
router.use('/offices', office_title_1.default);
router.use('/events', event_1.default);
router.use('/news-blogs', news_blog_1.default);
router.use('/reports', report_1.default);
router.use('/activity-logs', activity_log_1.default);
router.use('/backups', backup_database_1.default);
exports.default = router;
