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
exports.buildNextStudentId = exports.buildSeminaryStudentData = void 0;
const enums_1 = require("../../../generated/prisma/enums");
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const normalizeRequiredLabeledEnum = (value, labels) => {
    var _a;
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? ((_a = labels[normalized]) !== null && _a !== void 0 ? _a : normalized) : null;
};
const programLevelLabels = {
    Certificate: enums_1.SeminaryProgramLevel.CERTIFICATE,
    Bachelor: enums_1.SeminaryProgramLevel.BACHELOR,
    Masteral: enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
    Doctorate: enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
};
const enrollmentTypeLabels = {
    Regular: enums_1.SeminaryEnrollmentType.REGULAR,
    Transferee: enums_1.SeminaryEnrollmentType.TRANSFEREE,
    'Cross Enrollee': enums_1.SeminaryEnrollmentType.CROSS_ENROLLEE,
};
const studentStatusLabels = {
    Active: enums_1.SeminaryStudentStatus.ACTIVE,
    Graduating: enums_1.SeminaryStudentStatus.GRADUATING,
    'Leave of Absence': enums_1.SeminaryStudentStatus.LEAVE_OF_ABSENCE,
    Inactive: enums_1.SeminaryStudentStatus.INACTIVE,
};
const genderLabels = {
    M: enums_1.Gender.MALE,
    Male: enums_1.Gender.MALE,
    F: enums_1.Gender.FEMALE,
    Female: enums_1.Gender.FEMALE,
    'Prefer not to say': enums_1.Gender.PREFER_NOT_TO_SAY,
};
const buildSeminaryStudentData = (body) => {
    var _a, _b;
    return ({
        academicYear: trimToNull(body.academicYear),
        surname: trimToNull(body.surname),
        givenName: trimToNull(body.givenName),
        middleName: trimToNull(body.middleName),
        emailAddress: trimToNull(body.emailAddress),
        mobilePhone: trimToNull(body.mobilePhone),
        homeAddress: trimToNull(body.homeAddress),
        birthPlace: trimToNull(body.birthPlace),
        gender: normalizeRequiredLabeledEnum(body.gender, genderLabels),
        civilStatus: body.civilStatus ? body.civilStatus : null,
        churchAttended: trimToNull(body.churchAttended),
        churchAddress: trimToNull(body.churchAddress),
        pastorName: trimToNull(body.pastorName),
        contactNumber: trimToNull(body.contactNumber),
        ministryInvolved: trimToNull(body.ministryInvolved),
        programLevel: normalizeRequiredLabeledEnum(body.programLevel, programLevelLabels),
        programCourse: trimToNull(body.programCourse),
        enrollmentType: (_a = normalizeRequiredLabeledEnum(body.enrollmentType, enrollmentTypeLabels)) !== null && _a !== void 0 ? _a : enums_1.SeminaryEnrollmentType.REGULAR,
        yearLevel: trimToNull(body.yearLevel),
        studentStatus: (_b = normalizeRequiredLabeledEnum(body.studentStatus, studentStatusLabels)) !== null && _b !== void 0 ? _b : enums_1.SeminaryStudentStatus.ACTIVE,
        status: enums_1.SeminaryApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        submittedAt: new Date(),
    });
};
exports.buildSeminaryStudentData = buildSeminaryStudentData;
const buildNextStudentId = (tx_1, ...args_1) => __awaiter(void 0, [tx_1, ...args_1], void 0, function* (tx, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `POTSC-${yearSuffix}-`;
    const latestApplication = yield tx.seminaryApplication.findFirst({
        where: {
            studentId: {
                startsWith: prefix,
            },
        },
        orderBy: {
            studentId: 'desc',
        },
        select: {
            studentId: true,
        },
    });
    const latestSeries = (latestApplication === null || latestApplication === void 0 ? void 0 : latestApplication.studentId)
        ? Number.parseInt(latestApplication.studentId.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(4, '0')}`;
});
exports.buildNextStudentId = buildNextStudentId;
