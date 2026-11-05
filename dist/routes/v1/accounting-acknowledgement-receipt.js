"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sanitation_1 = require("../../common/sanitation");
const accounting_acknowledgement_receipt_controller_1 = require("../../controllers/v1/accounting-acknowledgement-receipt/accounting-acknowledgement-receipt.controller");
const enums_1 = require("../../generated/prisma/enums");
const authentication_1 = require("../../middlewares/authentication");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const accounting_acknowledgement_receipt_1 = require("../../validators/accounting-acknowledgement-receipt");
const router = (0, express_1.Router)();
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_acknowledgement_receipt_1.getAcknowledgementReceiptsSchema), accounting_acknowledgement_receipt_controller_1.getAcknowledgementReceipts);
router.post('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_acknowledgement_receipt_1.createAcknowledgementReceiptSchema), accounting_acknowledgement_receipt_controller_1.createAcknowledgementReceipt);
router.get('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_acknowledgement_receipt_1.getAcknowledgementReceiptByIdSchema), accounting_acknowledgement_receipt_controller_1.getAcknowledgementReceiptById);
router.delete('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_acknowledgement_receipt_1.deleteAcknowledgementReceiptSchema), accounting_acknowledgement_receipt_controller_1.deleteAcknowledgementReceipt);
exports.default = router;
