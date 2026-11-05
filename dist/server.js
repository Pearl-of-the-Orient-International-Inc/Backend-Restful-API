"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const winston_1 = require("./lib/winston");
const prisma_1 = require("./lib/prisma");
const backup_database_scheduler_1 = require("./lib/backup-database-scheduler");
const membership_renewal_scheduler_1 = require("./lib/membership-renewal-scheduler");
const activity_log_1 = require("./middlewares/activity-log");
const uploadthing_1 = require("./lib/uploadthing");
const v1_1 = __importDefault(require("./routes/v1"));
const app = (0, express_1.default)();
if (config_1.default.TRUST_PROXY !== false) {
    app.set('trust proxy', config_1.default.TRUST_PROXY);
}
const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (config_1.default.NODE_ENV === 'development') {
            return callback(null, true);
        }
        if (config_1.default.WHITELIST_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        winston_1.logger.warn(`CORS error: ${origin} is not allowed by CORS`);
        callback(new Error(`CORS error: ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '8mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '8mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)({
    threshold: 1024,
}));
app.use((0, helmet_1.default)());
app.use('/api/uploadthing', (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 10,
}));
app.use('/api/v1', activity_log_1.activityLogMiddleware, v1_1.default);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.$connect();
        const server = app.listen(config_1.default.PORT, () => {
            (0, backup_database_scheduler_1.startBackupDatabaseScheduler)();
            (0, membership_renewal_scheduler_1.startMembershipRenewalScheduler)();
            winston_1.logger.info(`The server will start at http://localhost:${config_1.default.PORT} with hot-reloading enabled`);
        });
        server.on('error', (error) => {
            winston_1.logger.error(error.code === 'EADDRINUSE'
                ? `Port ${config_1.default.PORT} is already in use. Stop the existing backend process before restarting.`
                : 'Backend HTTP server failed', { error });
            void prisma_1.prisma.$disconnect().finally(() => process.exit(1));
        });
    }
    catch (err) {
        winston_1.logger.error('Failed to start server', err);
        if (config_1.default.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}))();
const serverTermination = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, backup_database_scheduler_1.stopBackupDatabaseScheduler)();
        (0, membership_renewal_scheduler_1.stopMembershipRenewalScheduler)();
        yield prisma_1.prisma.$disconnect();
        winston_1.logger.info('Server SHUTDOWN', signal);
        winston_1.logtail.flush();
        process.exit(0);
    }
    catch (err) {
        winston_1.logger.error('Error during server shutdown', err);
    }
});
process.on('SIGTERM', serverTermination);
process.on('SIGINT', serverTermination);
