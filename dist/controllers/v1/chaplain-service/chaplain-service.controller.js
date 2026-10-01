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
exports.updateChaplainService = exports.createChaplainService = exports.getEligibleServiceChaplains = exports.getPublicChaplainServices = exports.getChaplainServices = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const enums_1 = require("@/generated/prisma/enums");
const serialize = (service) => (Object.assign(Object.assign({}, service), { commissionPercent: service.commissionPercent === null ? null : Number(service.commissionPercent) }));
const toWriteData = (body) => {
    var _a, _b, _c, _d, _e, _f;
    return ({
        name: body.name.trim(),
        description: body.description.trim(),
        availability: ((_a = body.availability) === null || _a === void 0 ? void 0 : _a.trim()) || null,
        commissionPercent: (_b = body.commissionPercent) !== null && _b !== void 0 ? _b : null,
        maxConcurrentBookings: body.maxConcurrentBookings,
        sharedResourceName: ((_c = body.sharedResourceName) === null || _c === void 0 ? void 0 : _c.trim()) || null,
        sharedResourceKey: ((_d = body.sharedResourceName) === null || _d === void 0 ? void 0 : _d.trim().replace(/\s+/g, ' ').toLowerCase()) || null,
        sharedResourceCapacity: ((_e = body.sharedResourceName) === null || _e === void 0 ? void 0 : _e.trim())
            ? ((_f = body.sharedResourceCapacity) !== null && _f !== void 0 ? _f : 1)
            : null,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
    });
};
const getId = (req) => {
    const id = req.params.id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
};
const getChaplainServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
        const services = yield prisma_1.prisma.chaplainService.findMany({
            where: typeof isActive === 'boolean' ? { isActive } : undefined,
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Chaplain services retrieved successfully', data: services.map(serialize) });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving chaplain services', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getChaplainServices = getChaplainServices;
const getPublicChaplainServices = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield prisma_1.prisma.chaplainService.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Public chaplain services retrieved successfully', data: services.map(serialize) });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public chaplain services', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getPublicChaplainServices = getPublicChaplainServices;
const getEligibleServiceChaplains = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = yield prisma_1.prisma.member.findMany({
            where: { isActive: true, status: enums_1.MemberStatus.APPROVED, memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            select: { id: true, uniqueId: true, firstName: true, middleInitial: true, lastName: true, extensionName: true, region: true, province: true, municipalityCity: true, user: { select: { avatar: true } }, officerAssignments: { where: { isActive: true }, select: { officeTitle: { select: { name: true } } }, take: 1 } },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Eligible service chaplains retrieved successfully', data: members });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving eligible service chaplains', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getEligibleServiceChaplains = getEligibleServiceChaplains;
const createChaplainService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = yield prisma_1.prisma.chaplainService.create({ data: toWriteData(req.body) });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Chaplain service created successfully', data: serialize(service) });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'A service with this name already exists' });
            return;
        }
        winston_1.logger.error('Error while creating chaplain service', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.createChaplainService = createChaplainService;
const updateChaplainService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getId(req);
        if (!id) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Service ID is required' });
            return;
        }
        const service = yield prisma_1.prisma.chaplainService.update({ where: { id }, data: toWriteData(req.body) });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Chaplain service updated successfully', data: serialize(service) });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({ code: 'CONFLICT', message: 'A service with this name already exists' });
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Chaplain service not found' });
            return;
        }
        winston_1.logger.error('Error while updating chaplain service', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.updateChaplainService = updateChaplainService;
