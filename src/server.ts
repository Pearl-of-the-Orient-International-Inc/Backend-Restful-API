/**
 * Node Modules
 */
import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

/**
 * Custom Modules
 */
import config from '@/config';
import { logger, logtail } from '@/lib/winston';
import { prisma } from '@/lib/prisma';
import {
  startBackupDatabaseScheduler,
  stopBackupDatabaseScheduler,
} from '@/lib/backup-database-scheduler';
import {
  startMembershipRenewalScheduler,
  stopMembershipRenewalScheduler,
} from '@/lib/membership-renewal-scheduler';
import { activityLogMiddleware } from '@/middlewares/activity-log';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';

/**
 * Router
 */
import v1Routes from '@/routes/v1';

/**
 * App Initial
 */
const app = express();

// Required behind Nginx/Cloudflare so req.ip and rate-limit work with X-Forwarded-For
if (config.TRUST_PROXY !== false) {
  app.set('trust proxy', config.TRUST_PROXY);
}

// Apply CORS middleware
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Allow all origins in development
    if (config.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (config.WHITELIST_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Reject non-whitelisted origins
    logger.warn(`CORS error: ${origin} is not allowed by CORS`);
    callback(new Error(`CORS error: ${origin} is not allowed by CORS`), false);
  },
  credentials: true, // Add this to allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'traceparent',
    'tracestate',
    'b3',
    'baggage',
    'sentry-trace',
    'x-uploadthing-package',
    'x-uploadthing-version',
    'x-uploadthing-fe-package',
    'x-uploadthing-be-adapter',
    'x-uploadthing-signature',
    'x-uploadthing-api-key',
  ],
};
app.use(cors(corsOptions));

// Allow base64-encoded signature payloads from membership forms.
app.use(express.json({ limit: '8mb' }));

// Enable URL-encoded request body parsing with extended mode
// `extended: true` allows rich objects and arrays via querystring library
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

app.use(cookieParser());

// Enable response compression to reduce payload size and improve performance
app.use(
  compression({
    threshold: 1024, // Only compress responses larger than 1kb
  }),
);

// Use helmet to enhance security by setting various HTTP headers
app.use(helmet());

app.use(
  '/api/uploadthing',
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 10,
  }),
);

/**
 * Immediately Invoked Async Function Expression (IIEF) to start the server.
 *
 * - Tries to connect to the database before initializing the server.
 * - Defines the API route (`/api/v1`).
 * - Starts the server on the specified PORT and logs the running URL.
 * - If an error occurs during startup, it is logged, and the process exits with status 1.
 */

app.use('/api/v1', activityLogMiddleware, v1Routes);

(async (): Promise<void> => {
  try {
    await prisma.$connect();
    const server = app.listen(config.PORT, () => {
      startBackupDatabaseScheduler();
      startMembershipRenewalScheduler();
      logger.info(
        `The server will start at http://localhost:${config.PORT} with hot-reloading enabled`,
      );
    });
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error(
        error.code === 'EADDRINUSE'
          ? `Port ${config.PORT} is already in use. Stop the existing backend process before restarting.`
          : 'Backend HTTP server failed',
        { error },
      );
      void prisma.$disconnect().finally(() => process.exit(1));
    });
  } catch (err) {
    logger.error('Failed to start server', err);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

/**
 * Handles server shutdown gracefully by disconnecting from the database.
 *
 * - Attempts to disconnect from the database before shutting down the server.
 * - Logs a success message if the disconnection is successful.
 * - If an error occurs during disconnection, it is logged to the console.
 * - Exits the process with status code `0` (indicating a successful shutdown).
 */
const serverTermination = async (signal: NodeJS.Signals): Promise<void> => {
  try {
    stopBackupDatabaseScheduler();
    stopMembershipRenewalScheduler();
    await prisma.$disconnect();
    logger.info('Server SHUTDOWN', signal);

    // flush any remaining logs to logtail before exiting
    logtail.flush();

    // exit the process cleanly
    process.exit(0);
  } catch (err) {
    logger.error('Error during server shutdown', err);
  }
};

/**
 * Listens for termination signals (`SIGTERM` and `SIGINT`).
 *
 * - `SIGTERM` is typically sent when stopping a process (e.g., `kill` command or container shutdown).
 * - `SIGINT` is triggered when the user interrupts the process (e.g., pressing `Ctrl + C`).
 * - When either signal is received, `serverTermination` is executed to ensure proper cleanup.
 */
process.on('SIGTERM', serverTermination);
process.on('SIGINT', serverTermination);
