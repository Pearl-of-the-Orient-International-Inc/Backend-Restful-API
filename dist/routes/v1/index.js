"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_codes_1 = require("@/common/http-codes");
const auth_1 = __importDefault(require("@/routes/v1/auth"));
const user_1 = __importDefault(require("@/routes/v1/user"));
const member_1 = __importDefault(require("@/routes/v1/member"));
const branch_service_1 = __importDefault(require("@/routes/v1/branch-service"));
const office_title_1 = __importDefault(require("@/routes/v1/office-title"));
const event_1 = __importDefault(require("@/routes/v1/event"));
const news_blog_1 = __importDefault(require("@/routes/v1/news-blog"));
const memo_announcement_1 = __importDefault(require("@/routes/v1/memo-announcement"));
const seminary_1 = __importDefault(require("@/routes/v1/seminary"));
const report_1 = __importDefault(require("@/routes/v1/report"));
const activity_log_1 = __importDefault(require("@/routes/v1/activity-log"));
const backup_database_1 = __importDefault(require("@/routes/v1/backup-database"));
const accounting_payable_1 = __importDefault(require("@/routes/v1/accounting-payable"));
const accounting_receivable_1 = __importDefault(require("@/routes/v1/accounting-receivable"));
const accounting_ledger_1 = __importDefault(require("@/routes/v1/accounting-ledger"));
const accounting_invoice_1 = __importDefault(require("@/routes/v1/accounting-invoice"));
const accounting_acknowledgement_receipt_1 = __importDefault(require("@/routes/v1/accounting-acknowledgement-receipt"));
const task_management_1 = __importDefault(require("@/routes/v1/task-management"));
const owner_access_1 = __importDefault(require("@/routes/v1/owner-access"));
const bulletin_entry_1 = __importDefault(require("@/routes/v1/bulletin-entry"));
const chaplain_product_1 = __importDefault(require("@/routes/v1/chaplain-product"));
const chaplain_product_order_1 = __importDefault(require("@/routes/v1/chaplain-product-order"));
const chaplain_service_1 = __importDefault(require("@/routes/v1/chaplain-service"));
const payment_1 = __importDefault(require("@/routes/v1/payment"));
const ordination_application_1 = __importDefault(require("@/routes/v1/ordination-application"));
const crasm_application_1 = __importDefault(require("@/routes/v1/crasm-application"));
const survey_feedback_1 = __importDefault(require("@/routes/v1/survey-feedback"));
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
router.use('/memo-announcements', memo_announcement_1.default);
router.use('/seminary', seminary_1.default);
router.use('/reports', report_1.default);
router.use('/activity-logs', activity_log_1.default);
router.use('/backups', backup_database_1.default);
router.use('/accounting/accounts-payable', accounting_payable_1.default);
router.use('/accounting/accounts-receivable', accounting_receivable_1.default);
router.use('/accounting/cashflow-ledger', accounting_ledger_1.default);
router.use('/accounting/invoices', accounting_invoice_1.default);
router.use('/accounting/acknowledgement-receipts', accounting_acknowledgement_receipt_1.default);
router.use('/task-management', task_management_1.default);
router.use('/owner', owner_access_1.default);
router.use('/bulletins', bulletin_entry_1.default);
router.use('/chaplain-products', chaplain_product_1.default);
router.use('/chaplain-product-orders', chaplain_product_order_1.default);
router.use('/chaplain-services', chaplain_service_1.default);
router.use('/payments', payment_1.default);
router.use('/ordination-applications', ordination_application_1.default);
router.use('/crasm-applications', crasm_application_1.default);
router.use('/survey-feedback', survey_feedback_1.default);
exports.default = router;
