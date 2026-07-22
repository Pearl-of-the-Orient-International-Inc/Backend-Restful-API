"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeminaryPaymentData = exports.buildSeminaryRequirementsData = exports.buildSeminaryApplicationData = exports.parseDate = exports.parseAge = exports.trimToNull = exports.seminaryApplicationInclude = void 0;
const enums_1 = require("../../../generated/prisma/enums");
exports.seminaryApplicationInclude = {
    member: {
        select: {
            id: true,
            uniqueId: true,
            memberType: true,
            status: true,
            firstName: true,
            lastName: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    },
    requirements: true,
    payment: true,
    credentialDocuments: {
        orderBy: { issuedAt: 'desc' },
    },
};
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
exports.trimToNull = trimToNull;
const normalizeLabeledEnum = (value, labels) => {
    var _a;
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    if (!normalized)
        return null;
    return (_a = labels[normalized]) !== null && _a !== void 0 ? _a : normalized;
};
const normalizeRequiredLabeledEnum = (value, labels) => normalizeLabeledEnum(value, labels);
const genderLabels = {
    Male: enums_1.Gender.MALE,
    Female: enums_1.Gender.FEMALE,
    'Prefer not to say': enums_1.Gender.PREFER_NOT_TO_SAY,
};
const civilStatusLabels = {
    Single: enums_1.CivilStatus.SINGLE,
    Married: enums_1.CivilStatus.MARRIED,
    Widowed: enums_1.CivilStatus.WIDOWED,
    Separated: enums_1.CivilStatus.SEPARATED,
    Annulled: enums_1.CivilStatus.ANNULLED,
};
const programLevelLabels = {
    Certificate: enums_1.SeminaryProgramLevel.CERTIFICATE,
    Bachelor: enums_1.SeminaryProgramLevel.BACHELOR,
    'Master with Thesis': enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
    'Doctorate with Dissertation': enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
};
const paymentTypeLabels = {
    'Full Payment': enums_1.SeminaryPaymentType.FULL_PAYMENT,
    'Partial Payment': enums_1.SeminaryPaymentType.PARTIAL_PAYMENT,
};
const paymentMethodLabels = {
    'Bank Deposit / Bank Transfer': enums_1.SeminaryPaymentMethod.BANK_TRANSFER,
    'Bank Transfer': enums_1.SeminaryPaymentMethod.BANK_TRANSFER,
    GCash: enums_1.SeminaryPaymentMethod.GCASH,
    Maya: enums_1.SeminaryPaymentMethod.MAYA,
};
const parseAge = (value) => {
    if (value === null || value === undefined || value === '')
        return null;
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
};
exports.parseAge = parseAge;
const parseDate = (value) => {
    if (!value)
        return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
exports.parseDate = parseDate;
const parseMoney = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toFixed(2);
    }
    const normalized = typeof value === 'string' ? value.replace(/[^\d.]/g, '') : '';
    const parsed = Number.parseFloat(normalized !== null && normalized !== void 0 ? normalized : '');
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
};
const buildSeminaryApplicationData = (body) => ({
    academicYear: (0, exports.trimToNull)(body.personalInformation.academicYear),
    surname: (0, exports.trimToNull)(body.personalInformation.surname),
    givenName: (0, exports.trimToNull)(body.personalInformation.givenName),
    middleName: (0, exports.trimToNull)(body.personalInformation.middleName),
    emailAddress: (0, exports.trimToNull)(body.personalInformation.emailAddress),
    mobilePhone: (0, exports.trimToNull)(body.personalInformation.mobilePhone),
    homeAddress: (0, exports.trimToNull)(body.personalInformation.homeAddress),
    dateOfBirth: (0, exports.parseDate)(body.personalInformation.dateOfBirth),
    birthPlace: (0, exports.trimToNull)(body.personalInformation.birthPlace),
    age: (0, exports.parseAge)(body.personalInformation.age),
    gender: normalizeLabeledEnum(body.personalInformation.gender, genderLabels),
    height: (0, exports.trimToNull)(body.personalInformation.height),
    weight: (0, exports.trimToNull)(body.personalInformation.weight),
    civilStatus: normalizeLabeledEnum(body.personalInformation.civilStatus, civilStatusLabels),
    officePhone: (0, exports.trimToNull)(body.personalInformation.officePhone),
    churchAttended: (0, exports.trimToNull)(body.ministry.churchAttended),
    churchAddress: (0, exports.trimToNull)(body.ministry.churchAddress),
    pastorName: (0, exports.trimToNull)(body.ministry.pastorName),
    contactNumber: (0, exports.trimToNull)(body.ministry.contactNumber),
    ministryInvolved: (0, exports.trimToNull)(body.ministry.ministryInvolved),
    programLevel: normalizeLabeledEnum(body.curriculum.programLevel, programLevelLabels),
    programCourse: (0, exports.trimToNull)(body.curriculum.programCourse),
    highSchool: (0, exports.trimToNull)(body.educationalBackground.highSchool),
    highSchoolYearGraduated: (0, exports.trimToNull)(body.educationalBackground.highSchoolYearGraduated),
    collegeSchool: (0, exports.trimToNull)(body.educationalBackground.collegeSchool),
    collegeCourse: (0, exports.trimToNull)(body.educationalBackground.collegeCourse),
    collegeYearGraduated: (0, exports.trimToNull)(body.educationalBackground.collegeYearGraduated),
    vocationalSchool: (0, exports.trimToNull)(body.educationalBackground.vocationalSchool),
    vocationalCourse: (0, exports.trimToNull)(body.educationalBackground.vocationalCourse),
    vocationalYearGraduated: (0, exports.trimToNull)(body.educationalBackground.vocationalYearGraduated),
    othersSchool: (0, exports.trimToNull)(body.educationalBackground.othersSchool),
    othersCourse: (0, exports.trimToNull)(body.educationalBackground.othersCourse),
    othersYearGraduated: (0, exports.trimToNull)(body.educationalBackground.othersYearGraduated),
    status: 'SUBMITTED',
    targetMemberType: 'PROFESSIONAL_CHAPLAIN',
    submittedAt: new Date(),
});
exports.buildSeminaryApplicationData = buildSeminaryApplicationData;
const buildSeminaryRequirementsData = (body) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    return ({
        transcriptOfRecordsUrl: (0, exports.trimToNull)((_b = (_a = body.requirements.transcriptOfRecords) === null || _a === void 0 ? void 0 : _a.fileUrl) !== null && _b !== void 0 ? _b : body.requirements.transcriptOfRecordsUrl),
        transcriptOfRecordsFileName: (0, exports.trimToNull)((_d = (_c = body.requirements.transcriptOfRecords) === null || _c === void 0 ? void 0 : _c.fileName) !== null && _d !== void 0 ? _d : body.requirements.transcriptOfRecordsFileName),
        transcriptOfRecordsMimeType: (0, exports.trimToNull)((_f = (_e = body.requirements.transcriptOfRecords) === null || _e === void 0 ? void 0 : _e.mimeType) !== null && _f !== void 0 ? _f : body.requirements.transcriptOfRecordsMimeType),
        transcriptOfRecordsFileSize: (0, exports.trimToNull)((_h = (_g = body.requirements.transcriptOfRecords) === null || _g === void 0 ? void 0 : _g.fileSize) !== null && _h !== void 0 ? _h : body.requirements.transcriptOfRecordsFileSize),
        idPictureUrl: (0, exports.trimToNull)((_k = (_j = body.requirements.idPicture) === null || _j === void 0 ? void 0 : _j.fileUrl) !== null && _k !== void 0 ? _k : body.requirements.idPictureUrl),
        idPictureFileName: (0, exports.trimToNull)((_m = (_l = body.requirements.idPicture) === null || _l === void 0 ? void 0 : _l.fileName) !== null && _m !== void 0 ? _m : body.requirements.idPictureFileName),
        idPictureMimeType: (0, exports.trimToNull)((_p = (_o = body.requirements.idPicture) === null || _o === void 0 ? void 0 : _o.mimeType) !== null && _p !== void 0 ? _p : body.requirements.idPictureMimeType),
        idPictureFileSize: (0, exports.trimToNull)((_r = (_q = body.requirements.idPicture) === null || _q === void 0 ? void 0 : _q.fileSize) !== null && _r !== void 0 ? _r : body.requirements.idPictureFileSize),
        pastorRecommendationUrl: (0, exports.trimToNull)((_t = (_s = body.requirements.pastorRecommendation) === null || _s === void 0 ? void 0 : _s.fileUrl) !== null && _t !== void 0 ? _t : body.requirements.pastorRecommendationUrl),
        pastorRecommendationFileName: (0, exports.trimToNull)((_v = (_u = body.requirements.pastorRecommendation) === null || _u === void 0 ? void 0 : _u.fileName) !== null && _v !== void 0 ? _v : body.requirements.pastorRecommendationFileName),
        pastorRecommendationMimeType: (0, exports.trimToNull)((_x = (_w = body.requirements.pastorRecommendation) === null || _w === void 0 ? void 0 : _w.mimeType) !== null && _x !== void 0 ? _x : body.requirements.pastorRecommendationMimeType),
        pastorRecommendationFileSize: (0, exports.trimToNull)((_z = (_y = body.requirements.pastorRecommendation) === null || _y === void 0 ? void 0 : _y.fileSize) !== null && _z !== void 0 ? _z : body.requirements.pastorRecommendationFileSize),
        briefHistoryOfConversion: (0, exports.trimToNull)(body.requirements.briefHistoryOfConversion),
    });
};
exports.buildSeminaryRequirementsData = buildSeminaryRequirementsData;
const buildSeminaryPaymentData = (body) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return ({
        paymentType: normalizeRequiredLabeledEnum(body.payment.type, paymentTypeLabels),
        paymentMethod: normalizeRequiredLabeledEnum(body.payment.method, paymentMethodLabels),
        amountPaid: parseMoney(body.payment.amountPaid),
        totalAmountDue: parseMoney((_a = body.payment.totalAmountDue) !== null && _a !== void 0 ? _a : '4500'),
        proofOfReceiptUrl: (0, exports.trimToNull)((_c = (_b = body.payment.proofOfReceipt) === null || _b === void 0 ? void 0 : _b.fileUrl) !== null && _c !== void 0 ? _c : body.payment.proofOfReceiptUrl),
        proofOfReceiptFileName: (0, exports.trimToNull)((_e = (_d = body.payment.proofOfReceipt) === null || _d === void 0 ? void 0 : _d.fileName) !== null && _e !== void 0 ? _e : body.payment.proofOfReceiptFileName),
        proofOfReceiptMimeType: (0, exports.trimToNull)((_g = (_f = body.payment.proofOfReceipt) === null || _f === void 0 ? void 0 : _f.mimeType) !== null && _g !== void 0 ? _g : body.payment.proofOfReceiptMimeType),
        proofOfReceiptFileSize: (0, exports.trimToNull)((_j = (_h = body.payment.proofOfReceipt) === null || _h === void 0 ? void 0 : _h.fileSize) !== null && _j !== void 0 ? _j : body.payment.proofOfReceiptFileSize),
        submittedAt: new Date(),
    });
};
exports.buildSeminaryPaymentData = buildSeminaryPaymentData;
