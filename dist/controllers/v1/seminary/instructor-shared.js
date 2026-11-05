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
exports.toInstructorResponse = exports.normalizeInstructorProgram = exports.normalizeInstructorRank = exports.normalizeInstructorStatus = exports.instructorProgramLabels = exports.instructorRankLabels = exports.instructorStatusLabels = exports.getNextFacultyId = exports.calculateInstructorEvaluation = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const calculateInstructorEvaluation = ({ attendanceParticipation, leadershipCharacter, ministryCommunityEngagement, knowledgeSkillsAssessment, professionalConductEthics, }) => {
    const totalScore = Number((attendanceParticipation * 0.2 +
        leadershipCharacter * 0.2 +
        ministryCommunityEngagement * 0.25 +
        knowledgeSkillsAssessment * 0.2 +
        professionalConductEthics * 0.15).toFixed(2));
    const rating = totalScore >= 98
        ? 'Outstanding'
        : totalScore >= 95
            ? 'Excellent'
            : totalScore >= 90
                ? 'Very Satisfactory'
                : totalScore >= 85
                    ? 'Satisfactory'
                    : totalScore >= 80
                        ? 'Fair'
                        : totalScore >= 75
                            ? 'Passing'
                            : 'Needs Improvement';
    const rankingClassification = totalScore >= 95
        ? 'With Distinction'
        : totalScore >= 90
            ? 'With Honors'
            : totalScore >= 85
                ? 'Commendable Performance'
                : totalScore >= 75
                    ? 'Qualified Member'
                    : 'Needs Improvement';
    const award = totalScore >= 95
        ? 'Gold Award'
        : totalScore >= 90
            ? 'Silver Award'
            : totalScore >= 85
                ? 'Bronze Award'
                : 'No Award';
    return {
        award,
        rating,
        rankingClassification,
        totalScore,
    };
};
exports.calculateInstructorEvaluation = calculateInstructorEvaluation;
const getNextFacultyId = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    const year = String(new Date().getFullYear()).slice(-2);
    const prefix = `POTSCI-${year}-`;
    const instructors = yield tx.seminaryInstructor.findMany({
        where: { facultyId: { startsWith: prefix } },
        select: { facultyId: true },
    });
    const latestSeries = instructors.reduce((latest, instructor) => {
        var _a;
        const series = Number.parseInt((_a = instructor.facultyId.split('-')[2]) !== null && _a !== void 0 ? _a : '0', 10);
        return Number.isNaN(series) ? latest : Math.max(latest, series);
    }, 0);
    return `${prefix}${String(latestSeries + 1).padStart(4, '0')}-INS`;
});
exports.getNextFacultyId = getNextFacultyId;
exports.instructorStatusLabels = {
    [enums_1.SeminaryInstructorStatus.ACTIVE]: 'Active',
    [enums_1.SeminaryInstructorStatus.PART_TIME]: 'Part-time',
    [enums_1.SeminaryInstructorStatus.ON_LEAVE]: 'On Leave',
    [enums_1.SeminaryInstructorStatus.INACTIVE]: 'Inactive',
};
exports.instructorRankLabels = {
    [enums_1.SeminaryInstructorRank.ADJUNCT_INSTRUCTOR]: 'Adjunct Instructor',
    [enums_1.SeminaryInstructorRank.LECTURER]: 'Lecturer',
    [enums_1.SeminaryInstructorRank.ASSISTANT_PROFESSOR]: 'Assistant Professor',
    [enums_1.SeminaryInstructorRank.ASSOCIATE_PROFESSOR]: 'Associate Professor',
    [enums_1.SeminaryInstructorRank.PROFESSOR]: 'Professor',
};
exports.instructorProgramLabels = {
    [enums_1.SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
    [enums_1.SeminaryProgramLevel.BACHELOR]: 'Bachelor',
    [enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
    [enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};
const normalizeInstructorStatus = (status) => {
    var _a;
    return ((_a = {
        Active: enums_1.SeminaryInstructorStatus.ACTIVE,
        ACTIVE: enums_1.SeminaryInstructorStatus.ACTIVE,
        Inactive: enums_1.SeminaryInstructorStatus.INACTIVE,
        INACTIVE: enums_1.SeminaryInstructorStatus.INACTIVE,
        'On Leave': enums_1.SeminaryInstructorStatus.ON_LEAVE,
        ON_LEAVE: enums_1.SeminaryInstructorStatus.ON_LEAVE,
        'Part-time': enums_1.SeminaryInstructorStatus.PART_TIME,
        'Part Time': enums_1.SeminaryInstructorStatus.PART_TIME,
        PART_TIME: enums_1.SeminaryInstructorStatus.PART_TIME,
    }[status]) !== null && _a !== void 0 ? _a : enums_1.SeminaryInstructorStatus.ACTIVE);
};
exports.normalizeInstructorStatus = normalizeInstructorStatus;
const normalizeInstructorRank = (rank) => {
    var _a;
    return ((_a = {
        'Adjunct Instructor': enums_1.SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
        ADJUNCT_INSTRUCTOR: enums_1.SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
        Lecturer: enums_1.SeminaryInstructorRank.LECTURER,
        LECTURER: enums_1.SeminaryInstructorRank.LECTURER,
        'Assistant Professor': enums_1.SeminaryInstructorRank.ASSISTANT_PROFESSOR,
        ASSISTANT_PROFESSOR: enums_1.SeminaryInstructorRank.ASSISTANT_PROFESSOR,
        'Associate Professor': enums_1.SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
        ASSOCIATE_PROFESSOR: enums_1.SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
        Professor: enums_1.SeminaryInstructorRank.PROFESSOR,
        PROFESSOR: enums_1.SeminaryInstructorRank.PROFESSOR,
    }[rank]) !== null && _a !== void 0 ? _a : enums_1.SeminaryInstructorRank.LECTURER);
};
exports.normalizeInstructorRank = normalizeInstructorRank;
const normalizeInstructorProgram = (program) => {
    var _a;
    return ((_a = {
        Certificate: enums_1.SeminaryProgramLevel.CERTIFICATE,
        CERTIFICATE: enums_1.SeminaryProgramLevel.CERTIFICATE,
        Bachelor: enums_1.SeminaryProgramLevel.BACHELOR,
        BACHELOR: enums_1.SeminaryProgramLevel.BACHELOR,
        Masteral: enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
        'Master with Thesis': enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
        MASTER_WITH_THESIS: enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
        Doctorate: enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
        'Doctorate with Dissertation': enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
        DOCTORATE_WITH_DISSERTATION: enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
    }[program]) !== null && _a !== void 0 ? _a : enums_1.SeminaryProgramLevel.CERTIFICATE);
};
exports.normalizeInstructorProgram = normalizeInstructorProgram;
const toInstructorResponse = (instructor) => (Object.assign(Object.assign({}, instructor), { evaluation: {
        attendanceParticipation: instructor.attendanceParticipation,
        award: instructor.award,
        knowledgeSkillsAssessment: instructor.knowledgeSkillsAssessment,
        leadershipCharacter: instructor.leadershipCharacter,
        ministryCommunityEngagement: instructor.ministryCommunityEngagement,
        professionalConductEthics: instructor.professionalConductEthics,
        rankingClassification: instructor.rankingClassification,
        rating: instructor.rating,
        totalScore: instructor.totalScore,
    }, rankLabel: exports.instructorRankLabels[instructor.rank], statusLabel: exports.instructorStatusLabels[instructor.status], teachingProgramLabels: instructor.teachingPrograms.map((program) => exports.instructorProgramLabels[program]) }));
exports.toInstructorResponse = toInstructorResponse;
