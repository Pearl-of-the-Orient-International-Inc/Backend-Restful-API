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
exports.updateSeminaryInstructor = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const instructor_shared_1 = require("./instructor-shared");
const updateSeminaryInstructor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.params.id;
        const body = req.body;
        const evaluation = (0, instructor_shared_1.calculateInstructorEvaluation)(body.evaluation);
        const rank = (0, instructor_shared_1.normalizeInstructorRank)(body.rank);
        const status = body.status
            ? (0, instructor_shared_1.normalizeInstructorStatus)(body.status)
            : enums_1.SeminaryInstructorStatus.ACTIVE;
        const teachingPrograms = body.teachingPrograms.map(instructor_shared_1.normalizeInstructorProgram);
        const existingInstructor = yield prisma_1.prisma.seminaryInstructor.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingInstructor) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Seminary instructor not found',
            });
            return;
        }
        const instructor = yield prisma_1.prisma.seminaryInstructor.update({
            where: { id },
            data: {
                areasOfExpertise: body.areasOfExpertise,
                attendanceParticipation: body.evaluation.attendanceParticipation,
                award: evaluation.award,
                biography: body.biography,
                contactNumber: body.contactNumber,
                credentials: body.credentials,
                educationalBackground: body.educationalBackground,
                email: body.email,
                formalPhotoUrl: body.formalPhotoUrl,
                highSchoolGraduateOrEquivalent: body.highSchoolGraduateOrEquivalent,
                isFilipinoCitizen: body.isFilipinoCitizen,
                knowledgeSkillsAssessment: body.evaluation.knowledgeSkillsAssessment,
                leadershipCharacter: body.evaluation.leadershipCharacter,
                loadUnits: body.loadUnits,
                ministerialExperienceYears: body.ministerialExperienceYears,
                ministryCommunityEngagement: body.evaluation.ministryCommunityEngagement,
                name: body.name,
                professionalConductEthics: body.evaluation.professionalConductEthics,
                professionalTitle: body.professionalTitle,
                rank,
                rankingClassification: evaluation.rankingClassification,
                rating: evaluation.rating,
                status,
                submissionDeadline: new Date((_a = body.submissionDeadline) !== null && _a !== void 0 ? _a : '2026-08-01'),
                teachingPrograms,
                totalScore: evaluation.totalScore,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Seminary instructor updated successfully',
            data: (0, instructor_shared_1.toInstructorResponse)(instructor),
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Email already exists',
            });
            return;
        }
        winston_1.logger.error('Error while updating seminary instructor', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateSeminaryInstructor = updateSeminaryInstructor;
