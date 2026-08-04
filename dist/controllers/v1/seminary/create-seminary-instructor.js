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
exports.createSeminaryInstructor = void 0;
const crypto_1 = require("crypto");
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const password_hash_1 = require("../../../lib/password-hash");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const mailers_1 = require("../../../mailers");
const seminary_instructor_account_1 = require("../../../mailers/templates/seminary-instructor-account");
const config_1 = __importDefault(require("../../../config"));
const instructor_shared_1 = require("./instructor-shared");
const generateTemporaryPassword = () => `Potsci!${(0, crypto_1.randomBytes)(5).toString('hex').toUpperCase()}9`;
const createSeminaryInstructor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const evaluation = (0, instructor_shared_1.calculateInstructorEvaluation)(body.evaluation);
        const rank = (0, instructor_shared_1.normalizeInstructorRank)(body.rank);
        const status = body.status
            ? (0, instructor_shared_1.normalizeInstructorStatus)(body.status)
            : enums_1.SeminaryInstructorStatus.ACTIVE;
        const teachingPrograms = body.teachingPrograms.map(instructor_shared_1.normalizeInstructorProgram);
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = yield (0, password_hash_1.hashValue)(temporaryPassword);
        const instructor = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const instructorId = yield (0, instructor_shared_1.getNextFacultyId)(tx);
            const user = yield tx.user.create({
                data: {
                    accountStatus: enums_1.UserAccountStatus.ACTIVE,
                    email: instructorId,
                    isEmailVerified: true,
                    name: body.name,
                    password: hashedPassword,
                    role: enums_1.UserType.INSTRUCTOR,
                },
                select: { id: true },
            });
            return tx.seminaryInstructor.create({
                data: {
                    areasOfExpertise: body.areasOfExpertise,
                    attendanceParticipation: body.evaluation.attendanceParticipation,
                    award: evaluation.award,
                    biography: body.biography,
                    contactNumber: body.contactNumber,
                    credentials: body.credentials,
                    educationalBackground: body.educationalBackground,
                    email: body.email,
                    facultyId: instructorId,
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
                    userId: user.id,
                },
            });
        }));
        const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: body.email }, (0, seminary_instructor_account_1.seminaryInstructorAccountTemplate)({
            instructorId: instructor.facultyId,
            name: instructor.name,
            temporaryPassword,
        })));
        if (!emailResult.success) {
            winston_1.logger.warn('Instructor account created but credentials email failed', {
                email: body.email,
                instructorId: instructor.facultyId,
            });
        }
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: emailResult.success
                ? 'Seminary instructor created successfully'
                : 'Seminary instructor created successfully, but credentials email failed to send',
            data: (0, instructor_shared_1.toInstructorResponse)(instructor),
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Instructor ID or email already exists',
            });
            return;
        }
        const message = err instanceof Error ? err.message : 'Internal server error';
        winston_1.logger.error('Error while creating seminary instructor', {
            err,
            message,
        });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: config_1.default.NODE_ENV === 'production'
                ? 'Internal server error'
                : message,
        });
    }
});
exports.createSeminaryInstructor = createSeminaryInstructor;
