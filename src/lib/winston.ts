/**
 * Node Modules
 */
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

/**
 * Custom Modules
 */
import config from '@/config';

// Define the transport array to hold different logging transports
const transports: winston.transport[] = [];

// Throw error when source token or ingesting host is missing
if (!config.LOGTAIL_SOURCE_TOKEN || !config.LOGTAIL_INGESTING_HOST) {
  throw new Error('Logtail source token or ingesting host is missing');
}

// Create a logtail instance for sending structured logs to a remote logging service
const logtail = new Logtail(config.LOGTAIL_SOURCE_TOKEN, {
  endpoint: config.LOGTAIL_INGESTING_HOST,
});

// In production environment, push LogtailTransport to winston transport
if (config.NODE_ENV === 'production') {
  transports.push(new LogtailTransport(logtail));
}

// Destructure logging format utilities for winston
const { combine, timestamp, printf, colorize } = winston.format;

// In development environment, add a console transport for real-time feedback
if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // Add colors to log levels
        timestamp({ format: 'DD MMMM hh:mm:ss A' }), // Add timestamp to logs
        printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }),
      ),
    }),
  );
}

// Create a logger instance using Winston
const logger = winston.createLogger({
  transports,
});

export { logger, logtail };
