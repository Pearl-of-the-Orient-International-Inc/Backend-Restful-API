import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, OfficeTitleLevel } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type OfficeSeed = {
  name: string;
  level: OfficeTitleLevel;
  description: string;
  reportsTo?: string;
};

const offices: OfficeSeed[] = [
  {
    name: 'National Chaplain Director',
    level: OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR,
    description: 'Provides national leadership, direction, and coordination for the organization’s chaplaincy programs and offices.',
    reportsTo: 'Chief Chaplain',
  },
  {
    name: 'Regional Director',
    level: OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR,
    description: 'Leads and coordinates chaplaincy work, officers, and members within an assigned region.',
    reportsTo: 'National Chaplain Director',
  },
  {
    name: 'Regional Deputy Chaplain Director',
    level: OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR,
    description: 'Assists the Regional Director in overseeing and coordinating chaplaincy work within an assigned region.',
    reportsTo: 'Regional Director',
  },
  {
    name: 'Provincial Chaplain Director',
    level: OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR,
    description: 'Oversees chaplaincy programs, officers, and members within an assigned province.',
    reportsTo: 'Regional Director',
  },
  {
    name: 'Provincial Deputy Chaplain Director',
    level: OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR,
    description: 'Assists the Provincial Chaplain Director in coordinating chaplaincy work within an assigned province.',
    reportsTo: 'Provincial Chaplain Director',
  },
  {
    name: 'City Chaplain Director',
    level: OfficeTitleLevel.CITY_CHAPLAIN,
    description: 'Oversees and coordinates chaplaincy work and members within an assigned city.',
    reportsTo: 'Provincial Chaplain Director',
  },
  {
    name: 'Municipal Chaplain Director',
    level: OfficeTitleLevel.MUNICIPAL_CHAPLAIN,
    description: 'Implements and coordinates chaplaincy work and members within an assigned municipality.',
    reportsTo: 'Provincial Chaplain Director',
  },
  {
    name: 'City/Municipal Deputy Chaplain Director',
    level: OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN,
    description: 'Assists the City or Municipal Chaplain Director in serving members within an assigned city or municipality.',
    reportsTo: 'Provincial Chaplain Director',
  },
];

const sections = [
  {
    id: 'responsibilities',
    title: 'Responsibilities',
    type: 'list',
    items: [
      { id: 'coordinate', content: 'Coordinate chaplaincy activities within the authorized organizational scope.' },
      { id: 'communicate', content: 'Communicate official guidance and approved announcements to scoped members.' },
    ],
  },
  {
    id: 'authority',
    title: 'Authority and reporting',
    type: 'richtext',
    content: '<p>Authority is limited to the active assignment and its approved organizational scope. The office holder reports through the organization’s established leadership structure.</p>',
  },
];

async function main() {
  const officeIds = new Map<string, string>();
  const existingChief = await prisma.officeTitle.findUnique({
    where: { name: 'Chief Chaplain' },
    select: { id: true },
  });
  if (existingChief) officeIds.set('Chief Chaplain', existingChief.id);

  for (const [sortOrder, office] of offices.entries()) {
    const saved = await prisma.officeTitle.upsert({
      where: { name: office.name },
      create: {
        name: office.name,
        level: office.level,
        description: office.description,
        maxSlots: null,
        isActive: true,
        isPublic: false,
        sortOrder: sortOrder + 1,
        sections,
      },
      update: {},
      select: { id: true },
    });
    officeIds.set(office.name, saved.id);
  }

  for (const office of offices) {
    const reportsToId = office.reportsTo ? officeIds.get(office.reportsTo) ?? null : null;
    await prisma.officeTitle.update({
      where: { id: officeIds.get(office.name)! },
      data: { reportsToId },
    });
  }

  console.log(`Seeded ${offices.length} office titles. Existing records were preserved.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Office title seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
