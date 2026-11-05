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
exports.bulkImportSeminaryStudents = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const student_shared_1 = require("./student-shared");
class DuplicateStudentsError extends Error {
}
const normalizeIdentityPart = (value) => { var _a; return (_a = value === null || value === void 0 ? void 0 : value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()) !== null && _a !== void 0 ? _a : ''; };
const getStudentNameKey = (student) => {
    const surname = normalizeIdentityPart(student.surname);
    const givenName = normalizeIdentityPart(student.givenName);
    if (!surname || !givenName)
        return null;
    return [surname, givenName, normalizeIdentityPart(student.middleName)].join('|');
};
const getStudentDisplayName = (student) => {
    var _a;
    return [student.givenName, student.middleName, student.surname]
        .map((part) => part === null || part === void 0 ? void 0 : part.trim())
        .filter(Boolean)
        .join(' ') || ((_a = student.studentId) === null || _a === void 0 ? void 0 : _a.trim()) || 'Unnamed student';
};
const findBatchDuplicates = (students) => {
    var _a;
    const seenStudentIds = new Set();
    const seenNames = new Set();
    const duplicates = new Set();
    for (const student of students) {
        const studentId = (_a = student.studentId) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
        const nameKey = getStudentNameKey(student);
        if (studentId) {
            if (seenStudentIds.has(studentId)) {
                duplicates.add(getStudentDisplayName(student));
            }
            seenStudentIds.add(studentId);
        }
        if (nameKey) {
            if (seenNames.has(nameKey)) {
                duplicates.add(getStudentDisplayName(student));
            }
            seenNames.add(nameKey);
        }
    }
    return [...duplicates];
};
const duplicateMessage = (names) => {
    const visibleNames = names.slice(0, 3).join(', ');
    const remaining = names.length - 3;
    return `Duplicate student${names.length === 1 ? '' : 's'} found: ${visibleNames}${remaining > 0 ? ` and ${remaining} more` : ''}`;
};
const bulkImportSeminaryStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const batchDuplicates = findBatchDuplicates(body.students);
        if (batchDuplicates.length) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: duplicateMessage(batchDuplicates),
            });
            return;
        }
        const students = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const rowsWithNames = body.students.filter((student) => getStudentNameKey(student) !== null);
            const existingStudents = rowsWithNames.length
                ? yield tx.seminaryApplication.findMany({
                    where: {
                        OR: rowsWithNames.map((student) => {
                            var _a, _b;
                            return ({
                                surname: {
                                    equals: (_a = student.surname) === null || _a === void 0 ? void 0 : _a.trim(),
                                    mode: 'insensitive',
                                },
                                givenName: {
                                    equals: (_b = student.givenName) === null || _b === void 0 ? void 0 : _b.trim(),
                                    mode: 'insensitive',
                                },
                            });
                        }),
                    },
                    select: {
                        studentId: true,
                        surname: true,
                        givenName: true,
                        middleName: true,
                    },
                })
                : [];
            const existingByName = new Map(existingStudents
                .map((student) => [getStudentNameKey(student), student])
                .filter((entry) => entry[0] !== null));
            const existingDuplicates = rowsWithNames.filter((student) => {
                var _a, _b, _c;
                const existing = existingByName.get((_a = getStudentNameKey(student)) !== null && _a !== void 0 ? _a : '');
                if (!existing)
                    return false;
                const requestedId = (_b = student.studentId) === null || _b === void 0 ? void 0 : _b.trim().toUpperCase();
                const existingId = (_c = existing.studentId) === null || _c === void 0 ? void 0 : _c.trim().toUpperCase();
                return !requestedId || requestedId !== existingId;
            });
            if (existingDuplicates.length) {
                throw new DuplicateStudentsError(duplicateMessage(existingDuplicates.map(getStudentDisplayName)));
            }
            const imported = [];
            for (const row of body.students) {
                const studentId = ((_a = row.studentId) === null || _a === void 0 ? void 0 : _a.trim()) || (yield (0, student_shared_1.buildNextStudentId)(tx));
                const data = (0, student_shared_1.buildSeminaryStudentData)(row);
                const student = ((_b = row.studentId) === null || _b === void 0 ? void 0 : _b.trim())
                    ? yield tx.seminaryApplication.upsert({
                        where: {
                            studentId,
                        },
                        create: Object.assign(Object.assign({}, data), { studentId }),
                        update: data,
                    })
                    : yield tx.seminaryApplication.create({
                        data: Object.assign(Object.assign({}, data), { studentId }),
                    });
                imported.push(student);
            }
            return imported;
        }), {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 30000,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: `${students.length} seminary students imported successfully`,
            data: students,
        });
    }
    catch (err) {
        if (err instanceof DuplicateStudentsError) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: err.message,
            });
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'A student with the same student number already exists',
            });
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2034') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Another student import was completed at the same time. No students were added; review the list and try again.',
            });
            return;
        }
        winston_1.logger.error('Error while bulk importing seminary students', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.bulkImportSeminaryStudents = bulkImportSeminaryStudents;
