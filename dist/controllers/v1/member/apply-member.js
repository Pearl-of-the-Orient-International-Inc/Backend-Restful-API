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
exports.applyMember = void 0;
const crypto_1 = require("crypto");
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const password_hash_1 = require("../../../lib/password-hash");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const getOptional = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const buildFullName = (firstName, lastName) => [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
const generateTemporaryPassword = () => `Pearl!${(0, crypto_1.randomBytes)(5).toString('hex').toUpperCase()}9`;
const applyMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    try {
        const body = req.body;
        const normalizedEmail = (_a = body.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
        if (!normalizedEmail) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Email is required',
            });
            return;
        }
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                role: true,
                memberProfile: { select: { id: true } },
            },
        });
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.memberProfile) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'A member application already exists for this email address',
            });
            return;
        }
        if (existingUser && existingUser.role !== enums_1.UserType.MEMBER) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'This email is already assigned to a non-member account',
            });
            return;
        }
        const preferredBranchIds = (_b = body.preferredBranchIds) !== null && _b !== void 0 ? _b : [];
        if (preferredBranchIds.length > 0) {
            const branchCount = yield prisma_1.prisma.branchOfService.count({
                where: { id: { in: preferredBranchIds } },
            });
            if (branchCount !== preferredBranchIds.length) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'One or more preferredBranchIds are invalid',
                });
                return;
            }
        }
        const userId = existingUser
            ? existingUser.id
            : (yield prisma_1.prisma.user.create({
                data: {
                    name: buildFullName(body.firstName, body.lastName),
                    email: normalizedEmail,
                    password: yield (0, password_hash_1.hashValue)(generateTemporaryPassword()),
                    role: enums_1.UserType.MEMBER,
                    accountStatus: enums_1.UserAccountStatus.PENDING,
                    isEmailVerified: false,
                },
                select: { id: true },
            })).id;
        const createData = {
            user: { connect: { id: userId } },
            firstName: body.firstName,
            extensionName: getOptional(body.extensionName),
            middleInitial: (_c = body.middleInitial) !== null && _c !== void 0 ? _c : null,
            lastName: body.lastName,
            mobilePhoneNumber: getOptional(body.mobilePhoneNumber),
            homeAddress: getOptional(body.homeAddress),
            civilStatus: (_d = body.civilStatus) !== null && _d !== void 0 ? _d : null,
            gender: body.gender,
            nationality: getOptional(body.nationality),
            dateOfBirth: new Date(body.dateOfBirth),
            region: getOptional(body.region),
            province: getOptional(body.province),
            municipalityCity: getOptional(body.municipalityCity),
            barangay: getOptional(body.barangay),
            emergencyContactName: getOptional(body.emergencyContactName),
            emergencyContactMobile: getOptional(body.emergencyContactMobile),
            churchAffiliation: getOptional(body.churchAffiliation),
            churchAddress: getOptional(body.churchAddress),
            currentPositionRole: getOptional(body.currentPositionRole),
            currentPositionRoleOther: getOptional(body.currentPositionRoleOther),
            height: (_e = body.height) !== null && _e !== void 0 ? _e : null,
            weight: (_f = body.weight) !== null && _f !== void 0 ? _f : null,
            bloodType: (_g = body.bloodType) !== null && _g !== void 0 ? _g : null,
            colorOfEyes: (_h = body.colorOfEyes) !== null && _h !== void 0 ? _h : null,
            colorOfSkin: (_j = body.colorOfSkin) !== null && _j !== void 0 ? _j : null,
            sssNumber: (_k = body.sssNumber) !== null && _k !== void 0 ? _k : null,
            tinNumber: (_l = body.tinNumber) !== null && _l !== void 0 ? _l : null,
            skillsTalents: (_m = body.skillsTalents) !== null && _m !== void 0 ? _m : null,
            preferredBranchOther: (_o = body.preferredBranchOther) !== null && _o !== void 0 ? _o : null,
            elementarySchool: (_p = body.elementarySchool) !== null && _p !== void 0 ? _p : null,
            secondarySchool: (_q = body.secondarySchool) !== null && _q !== void 0 ? _q : null,
            tertiaryCollege: (_r = body.tertiaryCollege) !== null && _r !== void 0 ? _r : null,
            postGraduateStudies: (_s = body.postGraduateStudies) !== null && _s !== void 0 ? _s : null,
            ministerialExperiences: {
                create: (_u = (_t = body.ministerialExperiences) === null || _t === void 0 ? void 0 : _t.map((item, index) => ({
                    roleDescription: item.roleDescription,
                    yearsApprox: item.yearsApprox,
                    order: index + 1,
                }))) !== null && _u !== void 0 ? _u : [],
            },
            characterReferences: {
                create: (_w = (_v = body.characterReferences) === null || _v === void 0 ? void 0 : _v.map((item, index) => ({
                    name: item.name,
                    positionRelationship: item.positionRelationship,
                    contactNumber: item.contactNumber,
                    order: index + 1,
                }))) !== null && _w !== void 0 ? _w : [],
            },
        };
        if (preferredBranchIds.length > 0) {
            createData.preferredBranches = {
                connect: preferredBranchIds.map((id) => ({ id })),
            };
        }
        if (body.signature) {
            createData.signature = {
                create: {
                    type: body.signature.type,
                    signatureData: body.signature.signatureData,
                },
            };
        }
        const createdMember = yield prisma_1.prisma.member.create({
            data: createData,
            include: {
                ministerialExperiences: true,
                characterReferences: true,
                signature: true,
                preferredBranches: {
                    select: { id: true, title: true },
                },
            },
        });
        winston_1.logger.info('Member application submitted', {
            memberId: createdMember.id,
            userId,
            email: normalizedEmail,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Member application submitted successfully',
            data: createdMember,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while applying as member', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.applyMember = applyMember;
