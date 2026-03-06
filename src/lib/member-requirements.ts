import { ApplicantRequirementType } from '@/generated/prisma/enums';

export const requirementTypeToKey: Record<ApplicantRequirementType, string> = {
  [ApplicantRequirementType.PHOTO_2X2]: 'photo_2x2',
  [ApplicantRequirementType.HS_BACCALAUREATE_DIPLOMA]: 'hs_baccalaureate_diploma',
  [ApplicantRequirementType.TWO_THREE_YEAR_PROGRAM_DIPLOMA]: 'two_three_year_program_diploma',
  [ApplicantRequirementType.MASTERS_DEGREE_DIPLOMA]: 'masters_degree_diploma',
  [ApplicantRequirementType.DOCTORAL_DEGREE_DIPLOMA]: 'doctoral_degree_diploma',
  [ApplicantRequirementType.ORDINATION_CERTIFICATE]: 'ordination_certificate',
  [ApplicantRequirementType.PASTORS_RECOMMENDATION_LETTER]: 'pastors_recommendation_letter',
  [ApplicantRequirementType.LETTER_OF_INTENT]: 'letter_of_intent',
  [ApplicantRequirementType.ENDORSEMENT_LETTERS]: 'endorsement_letters',
  [ApplicantRequirementType.MARRIAGE_CONTRACT]: 'marriage_contract',
  [ApplicantRequirementType.CLEARANCE_BARANGAY]: 'clearance_barangay',
  [ApplicantRequirementType.CLEARANCE_POLICE]: 'clearance_police',
  [ApplicantRequirementType.CLEARANCE_NBI]: 'clearance_nbi',
};
