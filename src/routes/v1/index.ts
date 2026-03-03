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
import branchServiceRoutes from '@/routes/v1/branch-service';
import officeTitleRoutes from '@/routes/v1/office-title';

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
router.use('/branch-service', branchServiceRoutes);
router.use('/offices', officeTitleRoutes);

export default router;
