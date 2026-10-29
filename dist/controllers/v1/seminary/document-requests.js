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
exports.updateSeminaryDocumentRequestStatus = exports.createSeminaryDocumentRequest = exports.getSeminaryDocumentRequests = exports.updateSeminaryDocumentRequestType = exports.createSeminaryDocumentRequestType = exports.getSeminaryDocumentRequestTypes = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const requestInclude = {
    documentType: true,
    studentApplication: {
        select: {
            id: true,
            studentId: true,
            givenName: true,
            middleName: true,
            surname: true,
            emailAddress: true,
            mobilePhone: true,
            programLevel: true,
            programCourse: true,
        },
    },
    reviewedByUser: { select: { id: true, name: true } },
    releasedByUser: { select: { id: true, name: true } },
};
const fullName = (student) => [student.givenName, student.middleName, student.surname].filter(Boolean).join(' ') || 'Student';
const allowedTransitions = {
    [enums_1.SeminaryDocumentRequestStatus.PENDING]: [
        enums_1.SeminaryDocumentRequestStatus.APPROVED,
        enums_1.SeminaryDocumentRequestStatus.REJECTED,
    ],
    [enums_1.SeminaryDocumentRequestStatus.APPROVED]: [enums_1.SeminaryDocumentRequestStatus.PROCESSING],
    [enums_1.SeminaryDocumentRequestStatus.PROCESSING]: [enums_1.SeminaryDocumentRequestStatus.READY_FOR_RELEASE],
    [enums_1.SeminaryDocumentRequestStatus.READY_FOR_RELEASE]: [enums_1.SeminaryDocumentRequestStatus.RELEASED],
};
const getStudentApplicationForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.seminaryApplication.findFirst({
        where: {
            studentId: { not: null },
            OR: [{ portalUserId: userId }, { member: { userId } }],
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
    });
});
const getSeminaryDocumentRequestTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
        const includeInactive = (user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.ADMIN && req.query.includeInactive === 'true';
        const data = yield prisma_1.prisma.seminaryDocumentRequestType.findMany({
            where: includeInactive ? undefined : { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Document request types retrieved successfully', data });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving Seminary document request types', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve document request types' });
    }
});
exports.getSeminaryDocumentRequestTypes = getSeminaryDocumentRequestTypes;
const createSeminaryDocumentRequestType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const type = yield prisma_1.prisma.seminaryDocumentRequestType.create({ data: req.body });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Document request type created successfully', data: type });
    }
    catch (err) {
        winston_1.logger.error('Error while creating Seminary document request type', { err });
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'DOCUMENT_TYPE_CREATE_FAILED', message: 'Unable to create the document type. Its name may already be in use.' });
    }
});
exports.createSeminaryDocumentRequestType = createSeminaryDocumentRequestType;
const updateSeminaryDocumentRequestType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const type = yield prisma_1.prisma.seminaryDocumentRequestType.update({ where: { id }, data: req.body });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Document request type updated successfully', data: type });
    }
    catch (err) {
        winston_1.logger.error('Error while updating Seminary document request type', { err });
        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'DOCUMENT_TYPE_UPDATE_FAILED', message: 'Unable to update the document type.' });
    }
});
exports.updateSeminaryDocumentRequestType = updateSeminaryDocumentRequestType;
const getSeminaryDocumentRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = req.query.status;
        const documentTypeId = req.query.documentTypeId;
        const where = Object.assign(Object.assign({}, (status ? { status } : {})), (documentTypeId ? { documentTypeId } : {}));
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
        if ((user === null || user === void 0 ? void 0 : user.role) === enums_1.UserType.MEMBER) {
            const student = yield getStudentApplicationForUser(req.userId);
            if (!student) {
                res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'No student document requests found', data: [] });
                return;
            }
            const data = yield prisma_1.prisma.seminaryDocumentRequest.findMany({
                where: Object.assign(Object.assign({}, where), { studentApplicationId: student.id }),
                include: requestInclude,
                orderBy: { createdAt: 'desc' },
            });
            res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Document requests retrieved successfully', data });
            return;
        }
        const data = yield prisma_1.prisma.seminaryDocumentRequest.findMany({
            where,
            include: requestInclude,
            orderBy: { createdAt: 'desc' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Document requests retrieved successfully', data });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving Seminary document requests', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve document requests' });
    }
});
exports.getSeminaryDocumentRequests = getSeminaryDocumentRequests;
const createSeminaryDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const student = yield getStudentApplicationForUser(req.userId);
        if (!student) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'STUDENT_NOT_FOUND', message: 'An active Seminary student record is required before requesting a document.' });
            return;
        }
        const body = req.body;
        const documentType = yield prisma_1.prisma.seminaryDocumentRequestType.findFirst({
            where: { id: body.documentTypeId, isActive: true },
        });
        if (!documentType) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'DOCUMENT_TYPE_NOT_FOUND', message: 'The selected document type is no longer available.' });
            return;
        }
        if (documentType.requiresSupportingDetails && !((_a = body.supportingDetails) === null || _a === void 0 ? void 0 : _a.trim())) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'SUPPORTING_DETAILS_REQUIRED', message: `Supporting details are required for ${documentType.name}.` });
            return;
        }
        const requestCount = yield prisma_1.prisma.seminaryDocumentRequest.count();
        const referenceNumber = `POTSC-DOC-${new Date().getFullYear()}-${String(requestCount + 1).padStart(5, '0')}`;
        const request = yield prisma_1.prisma.seminaryDocumentRequest.create({
            data: {
                referenceNumber,
                documentTypeId: documentType.id,
                studentApplicationId: student.id,
                purpose: body.purpose,
                deliveryMethod: body.deliveryMethod,
                supportingDetails: body.supportingDetails,
                fee: documentType.fee,
                paymentStatus: documentType.fee ? enums_1.SeminaryDocumentPaymentStatus.PENDING : enums_1.SeminaryDocumentPaymentStatus.NOT_APPLICABLE,
            },
            include: requestInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: `Document request ${referenceNumber} submitted successfully`, data: request });
    }
    catch (err) {
        winston_1.logger.error('Error while creating Seminary document request', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DOCUMENT_REQUEST_CREATE_FAILED', message: 'Unable to submit the document request.' });
    }
});
exports.createSeminaryDocumentRequest = createSeminaryDocumentRequest;
const updateSeminaryDocumentRequestStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const existing = yield prisma_1.prisma.seminaryDocumentRequest.findUnique({ where: { id } });
        if (!existing) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Document request not found.' });
            return;
        }
        const body = req.body;
        const canMove = body.status === existing.status || ((_a = allowedTransitions[existing.status]) === null || _a === void 0 ? void 0 : _a.includes(body.status));
        if (!canMove) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'INVALID_STATUS_TRANSITION', message: `This request cannot move directly from ${existing.status.replace(/_/g, ' ')} to ${body.status.replace(/_/g, ' ')}.` });
            return;
        }
        const now = new Date();
        const request = yield prisma_1.prisma.seminaryDocumentRequest.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign({ status: body.status, paymentStatus: (_b = body.paymentStatus) !== null && _b !== void 0 ? _b : existing.paymentStatus, reviewRemarks: body.reviewRemarks }, (body.status === enums_1.SeminaryDocumentRequestStatus.APPROVED || body.status === enums_1.SeminaryDocumentRequestStatus.REJECTED
                ? { reviewedAt: now, reviewedByUserId: req.userId }
                : {})), (body.status === enums_1.SeminaryDocumentRequestStatus.PROCESSING ? { processedAt: now } : {})), (body.status === enums_1.SeminaryDocumentRequestStatus.READY_FOR_RELEASE ? { readyAt: now } : {})), (body.status === enums_1.SeminaryDocumentRequestStatus.RELEASED
                ? {
                    releasedAt: now,
                    releasedByUserId: req.userId,
                    releaseReference: body.releaseReference,
                    receivedBy: body.receivedBy,
                }
                : {})),
            include: requestInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: `${request.documentType.name} request for ${fullName(request.studentApplication)} updated successfully`,
            data: request,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating Seminary document request', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'DOCUMENT_REQUEST_UPDATE_FAILED', message: 'Unable to update the document request.' });
    }
});
exports.updateSeminaryDocumentRequestStatus = updateSeminaryDocumentRequestStatus;
