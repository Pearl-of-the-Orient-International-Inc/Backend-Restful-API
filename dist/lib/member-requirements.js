"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementTypeToKey = void 0;
const enums_1 = require("@/generated/prisma/enums");
exports.requirementTypeToKey = {
    [enums_1.ApplicantRequirementType.PHOTO_2X2]: 'photo_2x2',
    [enums_1.ApplicantRequirementType.HS_BACCALAUREATE_DIPLOMA]: 'hs_baccalaureate_diploma',
    [enums_1.ApplicantRequirementType.TWO_THREE_YEAR_PROGRAM_DIPLOMA]: 'two_three_year_program_diploma',
    [enums_1.ApplicantRequirementType.MASTERS_DEGREE_DIPLOMA]: 'masters_degree_diploma',
    [enums_1.ApplicantRequirementType.DOCTORAL_DEGREE_DIPLOMA]: 'doctoral_degree_diploma',
    [enums_1.ApplicantRequirementType.ORDINATION_CERTIFICATE]: 'ordination_certificate',
    [enums_1.ApplicantRequirementType.PASTORS_RECOMMENDATION_LETTER]: 'pastors_recommendation_letter',
    [enums_1.ApplicantRequirementType.LETTER_OF_INTENT]: 'letter_of_intent',
    [enums_1.ApplicantRequirementType.ENDORSEMENT_LETTERS]: 'endorsement_letters',
    [enums_1.ApplicantRequirementType.MARRIAGE_CONTRACT]: 'marriage_contract',
    [enums_1.ApplicantRequirementType.CLEARANCE_BARANGAY]: 'clearance_barangay',
    [enums_1.ApplicantRequirementType.CLEARANCE_POLICE]: 'clearance_police',
    [enums_1.ApplicantRequirementType.CLEARANCE_NBI]: 'clearance_nbi',
};
