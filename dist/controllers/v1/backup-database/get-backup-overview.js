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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackupOverview = void 0;
const http_codes_1 = require("../../../common/http-codes");
const winston_1 = require("../../../lib/winston");
const backup_database_shared_1 = require("./backup-database-shared");
const getBackupOverview = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, backup_database_shared_1.buildBackupOverviewResponse)();
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Backup overview retrieved successfully',
            data,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving backup overview', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getBackupOverview = getBackupOverview;
