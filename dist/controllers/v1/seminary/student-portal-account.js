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
exports.createSeminaryStudentPortalAccount = exports.getSeminaryStudentName = exports.getSeminaryStudentPortalEmail = exports.DEFAULT_SEMINARY_STUDENT_PASSWORD = void 0;
const enums_1 = require("@/generated/prisma/enums");
const password_hash_1 = require("@/lib/password-hash");
exports.DEFAULT_SEMINARY_STUDENT_PASSWORD = 'Student123@';
const getSeminaryStudentPortalEmail = (studentId) => `${studentId.trim().toLowerCase()}@students.pearlchaplaincy.local`;
exports.getSeminaryStudentPortalEmail = getSeminaryStudentPortalEmail;
const getSeminaryStudentName = (student) => [student.givenName, student.middleName, student.surname]
    .filter(Boolean)
    .join(' ')
    .trim() || student.studentId;
exports.getSeminaryStudentName = getSeminaryStudentName;
const createSeminaryStudentPortalAccount = (tx_1, student_1, ...args_1) => __awaiter(void 0, [tx_1, student_1, ...args_1], void 0, function* (tx, student, password = exports.DEFAULT_SEMINARY_STUDENT_PASSWORD) {
    return tx.user.create({
        data: {
            name: (0, exports.getSeminaryStudentName)(student),
            email: (0, exports.getSeminaryStudentPortalEmail)(student.studentId),
            password: yield (0, password_hash_1.hashValue)(password),
            role: enums_1.UserType.MEMBER,
            isEmailVerified: true,
        },
        select: { id: true },
    });
});
exports.createSeminaryStudentPortalAccount = createSeminaryStudentPortalAccount;
