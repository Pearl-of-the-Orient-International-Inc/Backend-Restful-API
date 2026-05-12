import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

type RegionLocationItem = {
  region: string;
  memberCount: number;
  provinceCount: number;
  municipalityCount: number;
  barangayCount: number;
  provinces: Array<{
    province: string;
    memberCount: number;
    municipalityCount: number;
    barangayCount: number;
    municipalities: Array<{
      municipalityCity: string;
      memberCount: number;
      barangayCount: number;
      barangays: Array<{
        barangay: string;
        memberCount: number;
      }>;
    }>;
  }>;
};

export const getPublicDirectoryLocations = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        status: MemberStatus.APPROVED,
      },
      select: {
        region: true,
        province: true,
        municipalityCity: true,
        barangay: true,
      },
    });

    const regionMap = new Map<
      string,
      {
        memberCount: number;
        provinces: Map<
          string,
          {
            memberCount: number;
            municipalities: Map<
              string,
              {
                memberCount: number;
                barangays: Map<string, number>;
              }
            >;
          }
        >;
      }
    >();

    members.forEach((member) => {
      const region = member.region?.trim();
      const province = member.province?.trim();
      const municipalityCity = member.municipalityCity?.trim();
      const barangay = member.barangay?.trim();

      if (!region) {
        return;
      }

      const currentRegion = regionMap.get(region) ?? {
        memberCount: 0,
        provinces: new Map(),
      };

      currentRegion.memberCount += 1;

      if (province) {
        const currentProvince = currentRegion.provinces.get(province) ?? {
          memberCount: 0,
          municipalities: new Map(),
        };

        currentProvince.memberCount += 1;

        if (municipalityCity) {
          const currentMunicipality =
            currentProvince.municipalities.get(municipalityCity) ?? {
              memberCount: 0,
              barangays: new Map<string, number>(),
            };

          currentMunicipality.memberCount += 1;

          if (barangay) {
            currentMunicipality.barangays.set(
              barangay,
              (currentMunicipality.barangays.get(barangay) ?? 0) + 1,
            );
          }

          currentProvince.municipalities.set(
            municipalityCity,
            currentMunicipality,
          );
        }

        currentRegion.provinces.set(province, currentProvince);
      }

      regionMap.set(region, currentRegion);
    });

    const regionLocations: RegionLocationItem[] = Array.from(regionMap.entries())
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

            const barangayCount = municipalities.reduce(
              (total, municipality) => total + municipality.barangayCount,
              0,
            );

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

        const municipalityCount = provinces.reduce(
          (total, province) => total + province.municipalityCount,
          0,
        );
        const barangayCount = provinces.reduce(
          (total, province) => total + province.barangayCount,
          0,
        );

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

    const provinceCount = regionLocations.reduce(
      (total, item) => total + item.provinceCount,
      0,
    );
    const municipalityCount = regionLocations.reduce(
      (total, item) => total + item.municipalityCount,
      0,
    );
    const barangayCount = regionLocations.reduce(
      (total, item) => total + item.barangayCount,
      0,
    );

    logger.info('Public directory locations retrieved', {
      totalMembers: members.length,
      mappedRegions: regionLocations.length,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public directory locations retrieved successfully',
      data: {
        summary: {
          totalMembers: members.length,
          membersWithRegion: regionLocations.reduce(
            (total, item) => total + item.memberCount,
            0,
          ),
          regionsRepresented: regionLocations.length,
          provincesRepresented: provinceCount,
          municipalitiesRepresented: municipalityCount,
          barangaysRepresented: barangayCount,
        },
        headquarters: {
          name: 'Pearl of the Orient Headquarter',
          address:
            'Blk 151 Lot 14-20 Phase 1, Mabuhay City, Dasmarinas City, Cavite, Philippines',
          latitude: 14.3298,
          longitude: 120.9367,
        },
        regionLocations,
      },
    });
  } catch (err) {
    logger.error('Error while getting public directory locations', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
