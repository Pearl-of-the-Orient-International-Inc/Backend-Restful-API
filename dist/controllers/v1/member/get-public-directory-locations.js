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
exports.getPublicDirectoryLocations = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getPublicDirectoryLocations = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                status: enums_1.MemberStatus.APPROVED,
            },
            select: {
                region: true,
                province: true,
                municipalityCity: true,
                barangay: true,
            },
        });
        const regionMap = new Map();
        members.forEach((member) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const region = (_a = member.region) === null || _a === void 0 ? void 0 : _a.trim();
            const province = (_b = member.province) === null || _b === void 0 ? void 0 : _b.trim();
            const municipalityCity = (_c = member.municipalityCity) === null || _c === void 0 ? void 0 : _c.trim();
            const barangay = (_d = member.barangay) === null || _d === void 0 ? void 0 : _d.trim();
            if (!region) {
                return;
            }
            const currentRegion = (_e = regionMap.get(region)) !== null && _e !== void 0 ? _e : {
                memberCount: 0,
                provinces: new Map(),
            };
            currentRegion.memberCount += 1;
            if (province) {
                const currentProvince = (_f = currentRegion.provinces.get(province)) !== null && _f !== void 0 ? _f : {
                    memberCount: 0,
                    municipalities: new Map(),
                };
                currentProvince.memberCount += 1;
                if (municipalityCity) {
                    const currentMunicipality = (_g = currentProvince.municipalities.get(municipalityCity)) !== null && _g !== void 0 ? _g : {
                        memberCount: 0,
                        barangays: new Map(),
                    };
                    currentMunicipality.memberCount += 1;
                    if (barangay) {
                        currentMunicipality.barangays.set(barangay, ((_h = currentMunicipality.barangays.get(barangay)) !== null && _h !== void 0 ? _h : 0) + 1);
                    }
                    currentProvince.municipalities.set(municipalityCity, currentMunicipality);
                }
                currentRegion.provinces.set(province, currentProvince);
            }
            regionMap.set(region, currentRegion);
        });
        const regionLocations = Array.from(regionMap.entries())
            .map(([region, value]) => {
            const provinces = Array.from(value.provinces.entries())
                .map(([province, provinceValue]) => {
                const municipalities = Array.from(provinceValue.municipalities.entries())
                    .map(([municipalityCity, municipalityValue]) => ({
                    municipalityCity,
                    memberCount: municipalityValue.memberCount,
                    barangayCount: municipalityValue.barangays.size,
                    barangays: Array.from(municipalityValue.barangays.entries())
                        .map(([barangay, memberCount]) => ({
                        barangay,
                        memberCount,
                    }))
                        .sort((left, right) => {
                        if (right.memberCount !== left.memberCount) {
                            return right.memberCount - left.memberCount;
                        }
                        return left.barangay.localeCompare(right.barangay);
                    }),
                }))
                    .sort((left, right) => {
                    if (right.memberCount !== left.memberCount) {
                        return right.memberCount - left.memberCount;
                    }
                    return left.municipalityCity.localeCompare(right.municipalityCity);
                });
                const barangayCount = municipalities.reduce((total, municipality) => total + municipality.barangayCount, 0);
                return {
                    province,
                    memberCount: provinceValue.memberCount,
                    municipalityCount: municipalities.length,
                    barangayCount,
                    municipalities,
                };
            })
                .sort((left, right) => {
                if (right.memberCount !== left.memberCount) {
                    return right.memberCount - left.memberCount;
                }
                return left.province.localeCompare(right.province);
            });
            const municipalityCount = provinces.reduce((total, province) => total + province.municipalityCount, 0);
            const barangayCount = provinces.reduce((total, province) => total + province.barangayCount, 0);
            return {
                region,
                memberCount: value.memberCount,
                provinceCount: value.provinces.size,
                municipalityCount,
                barangayCount,
                provinces,
            };
        })
            .sort((left, right) => {
            if (right.memberCount !== left.memberCount) {
                return right.memberCount - left.memberCount;
            }
            return left.region.localeCompare(right.region);
        });
        const provinceCount = regionLocations.reduce((total, item) => total + item.provinceCount, 0);
        const municipalityCount = regionLocations.reduce((total, item) => total + item.municipalityCount, 0);
        const barangayCount = regionLocations.reduce((total, item) => total + item.barangayCount, 0);
        winston_1.logger.info('Public directory locations retrieved', {
            totalMembers: members.length,
            mappedRegions: regionLocations.length,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public directory locations retrieved successfully',
            data: {
                summary: {
                    totalMembers: members.length,
                    membersWithRegion: regionLocations.reduce((total, item) => total + item.memberCount, 0),
                    regionsRepresented: regionLocations.length,
                    provincesRepresented: provinceCount,
                    municipalitiesRepresented: municipalityCount,
                    barangaysRepresented: barangayCount,
                },
                headquarters: {
                    name: 'Pearl of the Orient Headquarter',
                    address: 'Blk 151 Lot 14-20 Phase 1, Mabuhay City, Dasmarinas City, Cavite, Philippines',
                    latitude: 14.3298,
                    longitude: 120.9367,
                },
                regionLocations,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting public directory locations', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicDirectoryLocations = getPublicDirectoryLocations;
