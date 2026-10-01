/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';

/**
 * Routes
 */
import authRoutes from '@/routes/v1/auth';
import userRoutes from '@/routes/v1/user';
import memberRoutes from '@/routes/v1/member';
import branchServiceRoutes from '@/routes/v1/branch-service';
import officeTitleRoutes from '@/routes/v1/office-title';
import eventRoutes from '@/routes/v1/event';
import newsBlogRoutes from '@/routes/v1/news-blog';
import memoAnnouncementRoutes from '@/routes/v1/memo-announcement';
import seminaryRoutes from '@/routes/v1/seminary';
import reportRoutes from '@/routes/v1/report';
import activityLogRoutes from '@/routes/v1/activity-log';
import backupDatabaseRoutes from '@/routes/v1/backup-database';
import accountingPayableRoutes from '@/routes/v1/accounting-payable';
import accountingReceivableRoutes from '@/routes/v1/accounting-receivable';
import accountingLedgerRoutes from '@/routes/v1/accounting-ledger';
import accountingInvoiceRoutes from '@/routes/v1/accounting-invoice';
import accountingAcknowledgementReceiptRoutes from '@/routes/v1/accounting-acknowledgement-receipt';
import taskManagementRoutes from '@/routes/v1/task-management';
import ownerAccessRoutes from '@/routes/v1/owner-access';
import bulletinEntryRoutes from '@/routes/v1/bulletin-entry';
import chaplainProductRoutes from '@/routes/v1/chaplain-product';
import chaplainProductOrderRoutes from '@/routes/v1/chaplain-product-order';
import chaplainServiceRoutes from '@/routes/v1/chaplain-service';
import paymentRoutes from '@/routes/v1/payment';
import ordinationApplicationRoutes from '@/routes/v1/ordination-application';
import crasmApplicationRoutes from '@/routes/v1/crasm-application';
import surveyFeedbackRoutes from '@/routes/v1/survey-feedback';

const router = Router();

/**
 * Root route
 */
router.get('/', (req, res) => {
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'API is live',
    status: 'ok',
    version: '1.0.0',
    docs: 'https://docs-api.pearl-chaplaincy.com',
    developer: 'Kyle Andre Lim',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/members', memberRoutes);
router.use('/branch-service', branchServiceRoutes);
router.use('/offices', officeTitleRoutes);
router.use('/events', eventRoutes);
router.use('/news-blogs', newsBlogRoutes);
router.use('/memo-announcements', memoAnnouncementRoutes);
router.use('/seminary', seminaryRoutes);
router.use('/reports', reportRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/backups', backupDatabaseRoutes);
router.use('/accounting/accounts-payable', accountingPayableRoutes);
router.use('/accounting/accounts-receivable', accountingReceivableRoutes);
router.use('/accounting/cashflow-ledger', accountingLedgerRoutes);
router.use('/accounting/invoices', accountingInvoiceRoutes);
router.use(
  '/accounting/acknowledgement-receipts',
  accountingAcknowledgementReceiptRoutes,
);
router.use('/task-management', taskManagementRoutes);
router.use('/owner', ownerAccessRoutes);
router.use('/bulletins', bulletinEntryRoutes);
router.use('/chaplain-products', chaplainProductRoutes);
router.use('/chaplain-product-orders', chaplainProductOrderRoutes);
router.use('/chaplain-services', chaplainServiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/ordination-applications', ordinationApplicationRoutes);
router.use('/crasm-applications', crasmApplicationRoutes);
router.use('/survey-feedback', surveyFeedbackRoutes);

export default router;
