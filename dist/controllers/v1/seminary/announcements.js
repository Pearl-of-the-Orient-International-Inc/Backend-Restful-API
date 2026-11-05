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
exports.deleteSeminaryAnnouncement = exports.updateSeminaryAnnouncement = exports.createSeminaryAnnouncement = exports.getSeminaryAnnouncements = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const includeCreator = {
    createdByUser: { select: { id: true, name: true } },
};
const audiencesForRole = (role) => {
    if (role === enums_1.UserType.INSTRUCTOR) {
        return ['ALL', 'INSTRUCTORS', 'STUDENTS_AND_INSTRUCTORS'];
    }
    return ['ALL', 'STUDENTS', 'STUDENTS_AND_INSTRUCTORS'];
};
const getRouteId = (value) => Array.isArray(value) ? value[0] : value;
const persistenceMessage = (err) => {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
        return 'The announcement calendar database table is missing. Apply the latest Seminary database migration, then try again.';
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return 'The announcement contains an invalid date or value. Please check the form and try again.';
    }
    return err instanceof Error
        ? `The announcement could not be saved: ${err.message}`
        : 'The announcement could not be saved because of an unknown server error.';
};
const getSeminaryAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'User not found' });
            return;
        }
        const where = user.role === enums_1.UserType.ADMIN
            ? {}
            : {
                status: 'PUBLISHED',
                audience: { in: audiencesForRole(user.role) },
            };
        const announcements = yield prisma_1.prisma.seminaryAnnouncement.findMany({
            where,
            include: includeCreator,
            orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Announcements retrieved successfully',
            data: announcements,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting Seminary announcements', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'ANNOUNCEMENTS_READ_FAILED',
            message: 'The announcement calendar could not be loaded. Please refresh and try again.',
        });
    }
});
exports.getSeminaryAnnouncements = getSeminaryAnnouncements;
const createSeminaryAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const announcement = yield prisma_1.prisma.seminaryAnnouncement.create({
            data: Object.assign(Object.assign({}, req.body), { createdByUserId: req.userId }),
            include: includeCreator,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Announcement created successfully',
            data: announcement,
        });
    }
    catch (err) {
        const message = persistenceMessage(err);
        winston_1.logger.error(`Error while creating Seminary announcement: ${message}`);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'ANNOUNCEMENT_CREATE_FAILED', message });
    }
});
exports.createSeminaryAnnouncement = createSeminaryAnnouncement;
const updateSeminaryAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getRouteId(req.params.id);
        const announcement = yield prisma_1.prisma.seminaryAnnouncement.update({
            where: { id },
            data: req.body,
            include: includeCreator,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Announcement updated successfully',
            data: announcement,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Announcement not found' });
            return;
        }
        const message = persistenceMessage(err);
        winston_1.logger.error(`Error while updating Seminary announcement: ${message}`);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'ANNOUNCEMENT_UPDATE_FAILED', message });
    }
});
exports.updateSeminaryAnnouncement = updateSeminaryAnnouncement;
const deleteSeminaryAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getRouteId(req.params.id);
        yield prisma_1.prisma.seminaryAnnouncement.delete({ where: { id } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Announcement deleted successfully' });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Announcement not found' });
            return;
        }
        winston_1.logger.error('Error while deleting Seminary announcement', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'ANNOUNCEMENT_DELETE_FAILED',
            message: 'The announcement could not be deleted. Please try again.',
        });
    }
});
exports.deleteSeminaryAnnouncement = deleteSeminaryAnnouncement;
