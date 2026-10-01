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
exports.getUserSessions = void 0;
const http_codes_1 = require("@/common/http-codes");
const helpers_1 = require("@/lib/helpers");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getUserSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = req.userId;
        const currentSessionId = req.sessionId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const sessions = yield prisma_1.prisma.session.findMany({
            where: {
                userId,
                expiredAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                expiredAt: true,
            },
        });
        const ipCache = new Map();
        const mappedSessions = yield Promise.all(sessions.map((session) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const ipKey = (_a = session.ipAddress) !== null && _a !== void 0 ? _a : 'local';
            const cached = ipCache.get(ipKey);
            const locationDetails = cached !== null && cached !== void 0 ? cached : (yield (0, helpers_1.getLocationDetailsFromIP)((_b = session.ipAddress) !== null && _b !== void 0 ? _b : null));
            if (!cached) {
                ipCache.set(ipKey, locationDetails);
            }
            return {
                id: session.id,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                createdAt: session.createdAt,
                expiredAt: session.expiredAt,
                isCurrent: Boolean(currentSessionId && session.id === currentSessionId),
                location: {
                    city: locationDetails.city,
                    region: locationDetails.region,
                    country: locationDetails.country,
                    label: locationDetails.label,
                    coordinates: locationDetails.lat !== null && locationDetails.lon !== null
                        ? {
                            lat: locationDetails.lat,
                            lng: locationDetails.lon,
                        }
                        : null,
                },
            };
        })));
        const currentSession = (_a = mappedSessions.find((session) => session.isCurrent)) !== null && _a !== void 0 ? _a : null;
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'User sessions retrieved successfully',
            data: {
                currentSession,
                sessions: mappedSessions,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while getting user sessions', err);
    }
});
exports.getUserSessions = getUserSessions;
