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
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const applyMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, memberProfile: { select: { id: true } } },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'User not found',
            });
            return;
        }
        if (user.role !== enums_1.UserType.MEMBER) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only MEMBER accounts can apply',
            });
            return;
        }
        if (user.memberProfile) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Member application already exists for this user',
            });
            return;
        }
        const body = req.body;
        const preferredBranchIds = (_a = body.preferredBranchIds) !== null && _a !== void 0 ? _a : [];
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
        const createData = {
            user: { connect: { id: userId } },
            firstName: body.firstName,
            lastName: body.lastName,
            mobilePhoneNumber: body.mobilePhoneNumber,
            homeAddress: body.homeAddress,
            civilStatus: body.civilStatus,
            gender: body.gender,
            nationality: body.nationality,
            dateOfBirth: new Date(body.dateOfBirth),
            region: body.region,
            province: body.province,
            municipalityCity: body.municipalityCity,
            barangay: body.barangay,
            emergencyContactName: body.emergencyContactName,
            emergencyContactMobile: body.emergencyContactMobile,
            churchAffiliation: body.churchAffiliation,
            churchAddress: body.churchAddress,
            currentPositionRole: body.currentPositionRole,
            currentPositionRoleOther: (_b = body.currentPositionRoleOther) !== null && _b !== void 0 ? _b : null,
            height: (_c = body.height) !== null && _c !== void 0 ? _c : null,
            weight: (_d = body.weight) !== null && _d !== void 0 ? _d : null,
            bloodType: (_e = body.bloodType) !== null && _e !== void 0 ? _e : null,
            colorOfEyes: (_f = body.colorOfEyes) !== null && _f !== void 0 ? _f : null,
            colorOfSkin: (_g = body.colorOfSkin) !== null && _g !== void 0 ? _g : null,
            sssNumber: (_h = body.sssNumber) !== null && _h !== void 0 ? _h : null,
            tinNumber: (_j = body.tinNumber) !== null && _j !== void 0 ? _j : null,
            skillsTalents: (_k = body.skillsTalents) !== null && _k !== void 0 ? _k : null,
            preferredBranchOther: (_l = body.preferredBranchOther) !== null && _l !== void 0 ? _l : null,
            elementarySchool: (_m = body.elementarySchool) !== null && _m !== void 0 ? _m : null,
            secondarySchool: (_o = body.secondarySchool) !== null && _o !== void 0 ? _o : null,
            tertiaryCollege: (_p = body.tertiaryCollege) !== null && _p !== void 0 ? _p : null,
            postGraduateStudies: (_q = body.postGraduateStudies) !== null && _q !== void 0 ? _q : null,
            ministerialExperiences: {
                create: (_s = (_r = body.ministerialExperiences) === null || _r === void 0 ? void 0 : _r.map((item, index) => ({
                    roleDescription: item.roleDescription,
                    yearsApprox: item.yearsApprox,
                    order: index + 1,
                }))) !== null && _s !== void 0 ? _s : [],
            },
            characterReferences: {
                create: (_u = (_t = body.characterReferences) === null || _t === void 0 ? void 0 : _t.map((item, index) => ({
                    name: item.name,
                    positionRelationship: item.positionRelationship,
                    contactNumber: item.contactNumber,
                    order: index + 1,
                }))) !== null && _u !== void 0 ? _u : [],
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
