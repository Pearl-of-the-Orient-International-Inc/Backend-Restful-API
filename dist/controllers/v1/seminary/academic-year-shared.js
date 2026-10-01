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
exports.ensureSingleCurrentAcademicYear = exports.buildSeminaryAcademicYearData = void 0;
const enums_1 = require("@/generated/prisma/enums");
const buildSeminaryAcademicYearData = (body) => {
    var _a;
    return ({
        academicYear: body.academicYear,
        session: body.session,
        status: body.status,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        sortOrder: (_a = body.sortOrder) !== null && _a !== void 0 ? _a : 0,
    });
};
exports.buildSeminaryAcademicYearData = buildSeminaryAcademicYearData;
const ensureSingleCurrentAcademicYear = (tx, id, session) => __awaiter(void 0, void 0, void 0, function* () {
    if (session !== enums_1.SeminaryAcademicYearSession.CURRENT)
        return;
    yield tx.seminaryAcademicYear.updateMany({
        where: {
            id: { not: id },
            session: enums_1.SeminaryAcademicYearSession.CURRENT,
        },
        data: {
            session: enums_1.SeminaryAcademicYearSession.PREVIOUS,
        },
    });
});
exports.ensureSingleCurrentAcademicYear = ensureSingleCurrentAcademicYear;
