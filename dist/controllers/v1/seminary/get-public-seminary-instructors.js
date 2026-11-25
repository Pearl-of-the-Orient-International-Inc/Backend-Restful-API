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
exports.getPublicSeminaryInstructors = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getPublicSeminaryInstructors = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const instructors = yield prisma_1.prisma.seminaryInstructor.findMany({
            where: { status: { in: [enums_1.SeminaryInstructorStatus.ACTIVE, enums_1.SeminaryInstructorStatus.PART_TIME] } },
            orderBy: [{ rank: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                professionalTitle: true,
                rank: true,
                teachingPrograms: true,
                areasOfExpertise: true,
                biography: true,
                formalPhotoUrl: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public seminary instructors retrieved successfully',
            data: instructors,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting public seminary instructors', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getPublicSeminaryInstructors = getPublicSeminaryInstructors;
