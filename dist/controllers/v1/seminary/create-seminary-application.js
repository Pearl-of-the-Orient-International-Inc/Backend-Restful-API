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
exports.createSeminaryApplication = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const seminary_shared_1 = require("./seminary-shared");
const ADMISSION_NUMBER_PREFIX = 'POTSC';
const buildAdmissionNumber = (year, sequence) => `${ADMISSION_NUMBER_PREFIX}-${String(year).slice(-2)}-${String(sequence).padStart(4, '0')}`;
const getNextAdmissionNumber = (year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const prefix = `${ADMISSION_NUMBER_PREFIX}-${String(year).slice(-2)}-`;
    const latestApplication = yield prisma_1.prisma.seminaryApplication.findFirst({
        where: {
            admissionNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            admissionNumber: 'desc',
        },
        select: {
            admissionNumber: true,
        },
    });
    const latestNumberParts = (_b = (_a = latestApplication === null || latestApplication === void 0 ? void 0 : latestApplication.admissionNumber) === null || _a === void 0 ? void 0 : _a.split('-')) !== null && _b !== void 0 ? _b : [];
    const latestSequence = latestNumberParts.length
        ? Number.parseInt((_c = latestNumberParts[latestNumberParts.length - 1]) !== null && _c !== void 0 ? _c : '0', 10)
        : 0;
    return buildAdmissionNumber(year, Number.isFinite(latestSequence) ? latestSequence + 1 : 1);
});
const createSeminaryApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const body = req.body;
        const submittedAt = (_a = (0, seminary_shared_1.parseDate)(body.admissionDate)) !== null && _a !== void 0 ? _a : new Date();
        const admissionNumber = yield getNextAdmissionNumber(submittedAt.getFullYear());
        const application = yield prisma_1.prisma.seminaryApplication.create({
            data: {
                admissionNumber,
                academicYear: (0, seminary_shared_1.trimToNull)(body.academicYear),
                surname: (0, seminary_shared_1.trimToNull)(body.surname),
                givenName: (0, seminary_shared_1.trimToNull)(body.givenName),
                middleName: (0, seminary_shared_1.trimToNull)(body.middleName),
                emailAddress: (0, seminary_shared_1.trimToNull)(body.emailAddress),
                mobilePhone: (0, seminary_shared_1.trimToNull)(body.mobilePhone),
                mailingAddress: (0, seminary_shared_1.trimToNull)(body.mailingAddress),
                homeAddress: (0, seminary_shared_1.trimToNull)(body.homeAddress),
                dateOfBirth: (0, seminary_shared_1.parseDate)(body.dateOfBirth),
                birthPlace: (0, seminary_shared_1.trimToNull)(body.birthPlace),
                age: (0, seminary_shared_1.parseAge)(body.age),
                gender: body.gender || null,
                height: (0, seminary_shared_1.trimToNull)(body.height),
                weight: (0, seminary_shared_1.trimToNull)(body.weight),
                civilStatus: body.civilStatus || null,
                officePhone: (0, seminary_shared_1.trimToNull)(body.officePhone),
                churchAttended: (0, seminary_shared_1.trimToNull)(body.churchAttended),
                churchAddress: (0, seminary_shared_1.trimToNull)(body.churchAddress),
                pastorName: (0, seminary_shared_1.trimToNull)(body.pastorName),
                contactNumber: (0, seminary_shared_1.trimToNull)(body.contactNumber),
                ministryInvolved: (0, seminary_shared_1.trimToNull)(body.ministryInvolved),
                programLevel: body.programLevel || null,
                programCourse: (0, seminary_shared_1.trimToNull)(body.programCourse),
                highSchool: (0, seminary_shared_1.trimToNull)(body.highSchool),
                highSchoolYearGraduated: (0, seminary_shared_1.trimToNull)(body.highSchoolYearGraduated),
                collegeSchool: (0, seminary_shared_1.trimToNull)(body.collegeSchool),
                collegeCourse: (0, seminary_shared_1.trimToNull)(body.collegeCourse),
                collegeYearGraduated: (0, seminary_shared_1.trimToNull)(body.collegeYearGraduated),
                vocationalSchool: (0, seminary_shared_1.trimToNull)(body.vocationalSchool),
                vocationalCourse: (0, seminary_shared_1.trimToNull)(body.vocationalCourse),
                vocationalYearGraduated: (0, seminary_shared_1.trimToNull)(body.vocationalYearGraduated),
                othersSchool: (0, seminary_shared_1.trimToNull)(body.othersSchool),
                othersCourse: (0, seminary_shared_1.trimToNull)(body.othersCourse),
                othersYearGraduated: (0, seminary_shared_1.trimToNull)(body.othersYearGraduated),
                enrollmentType: enums_1.SeminaryEnrollmentType.REGULAR,
                schoolAffiliation: enums_1.SeminarySchoolAffiliation.IN_HOUSE,
                status: enums_1.SeminaryApplicationStatus.SUBMITTED,
                studentStatus: enums_1.SeminaryStudentStatus.ACTIVE,
                submittedAt,
            },
            include: seminary_shared_1.seminaryApplicationInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Seminary application created successfully',
            data: application,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating seminary application', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createSeminaryApplication = createSeminaryApplication;
