/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';

const router = Router();

/**
 * Routes
 */

/**
 * Root route
 */
router.get('/', (req, res) => {
  res.status(HTTPSTATUS.OK).json({
    message: 'API is live',
    status: 'ok',
    version: '1.0.0',
    docs: 'https://docs-api.pearl-chaplaincy.com',
    developer: 'Kyle Andre Lim',
    timestamp: new Date().toISOString(),
  });
});

export default router;
