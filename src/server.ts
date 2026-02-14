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
import limiter from '@/lib/express-rate-limiter';
import { logger } from '@/lib/winston';

/**
 * Router
 */
import v1Routes from '@/routes/v1';

/**
 * App Initial
 */
const app = express();

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
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Enable JSON request body parsing
app.use(express.json());

// Enable URL-encoded request body parsing with extended mode
// `extended: true` allows rich objects and arrays via querystring library
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Enable response compression to reduce payload size and improve performance
app.use(
  compression({
    threshold: 1024, // Only compress responses larger than 1kb
  }),
);

// Use helmet to enhance security by setting various HTTP headers
app.use(helmet());

// Apply rate limiting middleware to prevent excessive requests and enhance security
app.use(limiter);

/**
 * Immediately Invoked Async Function Expression (IIEF) to start the server.
 *
 * - Tries to connect to the database before initializing the server.
 * - Defines the API route (`/api/v1`).
 * - Starts the server on the specified PORT and logs the running URL.
 * - If an error occurs during startup, it is logged, and the process exits with status 1.
 */

app.use('/api/v1', v1Routes);

(async () => {
  try {
    // await prisma.$connect();
    app.listen(config.PORT, () => {
      logger.info(
        `The server will start at http://localhost:${config.PORT} with hot-reloading enabled`,
      );
    });
  } catch (err) {
    logger.error('Failed to start server', err);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();
