import { Prisma } from '@/generated/prisma/client';
import {
  SeminaryInstructorRank,
  SeminaryInstructorStatus,
  SeminaryProgramLevel,
} from '@/generated/prisma/enums';

type InstructorScoreInput = {
  attendanceParticipation: number;
  leadershipCharacter: number;
  ministryCommunityEngagement: number;
  knowledgeSkillsAssessment: number;
  professionalConductEthics: number;
};

export const calculateInstructorEvaluation = ({
  attendanceParticipation,
  leadershipCharacter,
  ministryCommunityEngagement,
  knowledgeSkillsAssessment,
  professionalConductEthics,
}: InstructorScoreInput) => {
  const totalScore = Number(
    (
      attendanceParticipation * 0.2 +
      leadershipCharacter * 0.2 +
      ministryCommunityEngagement * 0.25 +
      knowledgeSkillsAssessment * 0.2 +
      professionalConductEthics * 0.15
    ).toFixed(2),
  );

  const rating =
    totalScore >= 98
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

  const rankingClassification =
    totalScore >= 95
      ? 'With Distinction'
      : totalScore >= 90
        ? 'With Honors'
        : totalScore >= 85
          ? 'Commendable Performance'
          : totalScore >= 75
            ? 'Qualified Member'
            : 'Needs Improvement';

  const award =
    totalScore >= 95
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

export const getNextFacultyId = async (
  tx: Pick<Prisma.TransactionClient, 'seminaryInstructor'>,
) => {
  const year = String(new Date().getFullYear()).slice(-2);
  const prefix = `POTSCI-${year}-`;
  const instructors = await tx.seminaryInstructor.findMany({
    where: { facultyId: { startsWith: prefix } },
    select: { facultyId: true },
  });
  const latestSeries = instructors.reduce((latest, instructor) => {
    const series = Number.parseInt(instructor.facultyId.split('-')[2] ?? '0', 10);
    return Number.isNaN(series) ? latest : Math.max(latest, series);
  }, 0);

  return `${prefix}${String(latestSeries + 1).padStart(4, '0')}-INS`;
};

export const instructorStatusLabels = {
  [SeminaryInstructorStatus.ACTIVE]: 'Active',
  [SeminaryInstructorStatus.PART_TIME]: 'Part-time',
  [SeminaryInstructorStatus.ON_LEAVE]: 'On Leave',
  [SeminaryInstructorStatus.INACTIVE]: 'Inactive',
} as const;

export const instructorRankLabels = {
  [SeminaryInstructorRank.ADJUNCT_INSTRUCTOR]: 'Adjunct Instructor',
  [SeminaryInstructorRank.LECTURER]: 'Lecturer',
  [SeminaryInstructorRank.ASSISTANT_PROFESSOR]: 'Assistant Professor',
  [SeminaryInstructorRank.ASSOCIATE_PROFESSOR]: 'Associate Professor',
  [SeminaryInstructorRank.PROFESSOR]: 'Professor',
} as const;

export const instructorProgramLabels = {
  [SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
  [SeminaryProgramLevel.BACHELOR]: 'Bachelor',
  [SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
  [SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
} as const;

export const normalizeInstructorStatus = (
  status: string,
): SeminaryInstructorStatus =>
  (
    {
      Active: SeminaryInstructorStatus.ACTIVE,
      ACTIVE: SeminaryInstructorStatus.ACTIVE,
      Inactive: SeminaryInstructorStatus.INACTIVE,
      INACTIVE: SeminaryInstructorStatus.INACTIVE,
      'On Leave': SeminaryInstructorStatus.ON_LEAVE,
      ON_LEAVE: SeminaryInstructorStatus.ON_LEAVE,
      'Part-time': SeminaryInstructorStatus.PART_TIME,
      'Part Time': SeminaryInstructorStatus.PART_TIME,
      PART_TIME: SeminaryInstructorStatus.PART_TIME,
    } as Record<string, SeminaryInstructorStatus>
  )[status] ?? SeminaryInstructorStatus.ACTIVE;

export const normalizeInstructorRank = (
  rank: string,
): SeminaryInstructorRank =>
  (
    {
      'Adjunct Instructor': SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
      ADJUNCT_INSTRUCTOR: SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
      Lecturer: SeminaryInstructorRank.LECTURER,
      LECTURER: SeminaryInstructorRank.LECTURER,
      'Assistant Professor': SeminaryInstructorRank.ASSISTANT_PROFESSOR,
      ASSISTANT_PROFESSOR: SeminaryInstructorRank.ASSISTANT_PROFESSOR,
      'Associate Professor': SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
      ASSOCIATE_PROFESSOR: SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
      Professor: SeminaryInstructorRank.PROFESSOR,
      PROFESSOR: SeminaryInstructorRank.PROFESSOR,
    } as Record<string, SeminaryInstructorRank>
  )[rank] ?? SeminaryInstructorRank.LECTURER;

export const normalizeInstructorProgram = (
  program: string,
): SeminaryProgramLevel =>
  (
    {
      Certificate: SeminaryProgramLevel.CERTIFICATE,
      CERTIFICATE: SeminaryProgramLevel.CERTIFICATE,
      Bachelor: SeminaryProgramLevel.BACHELOR,
      BACHELOR: SeminaryProgramLevel.BACHELOR,
      Masteral: SeminaryProgramLevel.MASTER_WITH_THESIS,
      'Master with Thesis': SeminaryProgramLevel.MASTER_WITH_THESIS,
      MASTER_WITH_THESIS: SeminaryProgramLevel.MASTER_WITH_THESIS,
      Doctorate: SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
      'Doctorate with Dissertation':
        SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
      DOCTORATE_WITH_DISSERTATION:
        SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
    } as Record<string, SeminaryProgramLevel>
  )[program] ?? SeminaryProgramLevel.CERTIFICATE;

export const toInstructorResponse = (
  instructor: Prisma.SeminaryInstructorGetPayload<object>,
) => ({
  ...instructor,
  evaluation: {
    attendanceParticipation: instructor.attendanceParticipation,
    award: instructor.award,
    knowledgeSkillsAssessment: instructor.knowledgeSkillsAssessment,
    leadershipCharacter: instructor.leadershipCharacter,
    ministryCommunityEngagement: instructor.ministryCommunityEngagement,
    professionalConductEthics: instructor.professionalConductEthics,
    rankingClassification: instructor.rankingClassification,
    rating: instructor.rating,
    totalScore: instructor.totalScore,
  },
  rankLabel: instructorRankLabels[instructor.rank],
  statusLabel: instructorStatusLabels[instructor.status],
  teachingProgramLabels: instructor.teachingPrograms.map(
    (program) => instructorProgramLabels[program],
  ),
});
