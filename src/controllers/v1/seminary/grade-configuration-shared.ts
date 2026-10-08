import type { Prisma } from '@/generated/prisma/client';
import type { UpdateSeminaryGradeConfigurationBody } from './types';

export const defaultGradeScale = [
  { equivalent: '1.00', percentageRange: '98-100', remarks: 'Excellent' },
  { equivalent: '1.25', percentageRange: '95-97', remarks: 'Superior' },
  { equivalent: '1.50', percentageRange: '92-94', remarks: 'Very Good' },
  { equivalent: '1.75', percentageRange: '89-91', remarks: 'Good' },
  { equivalent: '2.00', percentageRange: '86-88', remarks: 'Satisfactory' },
  { equivalent: '2.25', percentageRange: '83-85', remarks: 'Fair' },
  { equivalent: '2.50', percentageRange: '80-82', remarks: 'Passing' },
  { equivalent: '2.75', percentageRange: '77-79', remarks: 'Conditional' },
  { equivalent: '3.00', percentageRange: '75-76', remarks: 'Barely Passed' },
  { equivalent: '5.00', percentageRange: 'Below 75', remarks: 'Failed' },
];

export const defaultCriteriaWeights = {
  attendance: 20,
  coursework: 25,
  character: 30,
  exam: 25,
};

export const defaultGradeConfiguration = {
  id: 'default',
  passingEquivalent: '2.50',
  releaseWindow: 'After dean confirmation',
  weightProfile: 'Standard Coursework',
  completionWindowDays: 30,
  approvalWorkflow: true,
  allowFacultyOverride: true,
  autoPublishApproved: false,
  showConditionalRemark: true,
  gradeScale: defaultGradeScale,
  criteriaWeights: defaultCriteriaWeights,
} satisfies Prisma.SeminaryGradeConfigurationUncheckedCreateInput;

export const buildGradeConfigurationUpdateData = (
  body: UpdateSeminaryGradeConfigurationBody,
): Prisma.SeminaryGradeConfigurationUncheckedUpdateInput => ({
  ...(body.passingEquivalent === undefined
    ? {}
    : { passingEquivalent: body.passingEquivalent }),
  ...(body.releaseWindow === undefined
    ? {}
    : { releaseWindow: body.releaseWindow }),
  ...(body.weightProfile === undefined ? {} : { weightProfile: body.weightProfile }),
  ...(body.completionWindowDays === undefined
    ? {}
    : { completionWindowDays: body.completionWindowDays }),
  ...(body.approvalWorkflow === undefined
    ? {}
    : { approvalWorkflow: body.approvalWorkflow }),
  ...(body.allowFacultyOverride === undefined
    ? {}
    : { allowFacultyOverride: body.allowFacultyOverride }),
  ...(body.autoPublishApproved === undefined
    ? {}
    : { autoPublishApproved: body.autoPublishApproved }),
  ...(body.showConditionalRemark === undefined
    ? {}
    : { showConditionalRemark: body.showConditionalRemark }),
  ...(body.gradeScale === undefined ? {} : { gradeScale: body.gradeScale }),
  ...(body.criteriaWeights === undefined
    ? {}
    : { criteriaWeights: body.criteriaWeights }),
});

export const buildGradeConfigurationCreateData = (
  body: UpdateSeminaryGradeConfigurationBody,
): Prisma.SeminaryGradeConfigurationUncheckedCreateInput => ({
  ...defaultGradeConfiguration,
  ...(body.passingEquivalent === undefined
    ? {}
    : { passingEquivalent: body.passingEquivalent }),
  ...(body.releaseWindow === undefined
    ? {}
    : { releaseWindow: body.releaseWindow }),
  ...(body.weightProfile === undefined ? {} : { weightProfile: body.weightProfile }),
  ...(body.completionWindowDays === undefined
    ? {}
    : { completionWindowDays: body.completionWindowDays }),
  ...(body.approvalWorkflow === undefined
    ? {}
    : { approvalWorkflow: body.approvalWorkflow }),
  ...(body.allowFacultyOverride === undefined
    ? {}
    : { allowFacultyOverride: body.allowFacultyOverride }),
  ...(body.autoPublishApproved === undefined
    ? {}
    : { autoPublishApproved: body.autoPublishApproved }),
  ...(body.showConditionalRemark === undefined
    ? {}
    : { showConditionalRemark: body.showConditionalRemark }),
  ...(body.gradeScale === undefined ? {} : { gradeScale: body.gradeScale }),
  ...(body.criteriaWeights === undefined
    ? {}
    : { criteriaWeights: body.criteriaWeights }),
});
