import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Gender,
  MemberStatus,
  MemberType,
  OfficeTitleLevel,
  PrismaClient,
  UserType,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type ChurchRole = 'Church Worker' | 'Rev.' | 'Bishop' | 'Others';
type PreviewAssignment = {
  level: OfficeTitleLevel;
  jurisdiction: string;
  name: string;
  role: ChurchRole;
};

const national = (items: readonly (readonly [string, string, ChurchRole])[]): PreviewAssignment[] =>
  items.map(([jurisdiction, name, role]) => ({
    level: OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR,
    jurisdiction,
    name,
    role,
  }));

const regional = (level: OfficeTitleLevel, items: readonly (readonly [string, string, ChurchRole])[]): PreviewAssignment[] =>
  items.map(([jurisdiction, name, role]) => ({ level, jurisdiction, name, role }));

const previewAssignments: PreviewAssignment[] = [
  ...national([
    ['Education', 'Lelanie D. Perido', 'Others'],
    ['Humanitarian', 'Bobby M. Brimon', 'Others'],
    ['Political Affairs', 'Analyn M. Tibio', 'Others'],
    ['Training & Development', 'Romel A. Abaca', 'Others'],
    ['Membership & Recruitment', 'Leilani C. Junio', 'Others'],
    ['Operations', 'Ronaldo P. Manalo', 'Bishop'],
    ['Security Group / NCR', 'Henry S. Bertumen', 'Rev.'],
    ['Community Development', 'Emer Jason R. Gregorio', 'Others'],
    ['Senate', 'Lauro S. Lamento Jr.', 'Rev.'],
    ['NAPOLCOM', 'Abner P. Tuballes', 'Rev.'],
    ['Sports', 'Rhenald L. Lagrimas', 'Rev.'],
    ['Hospital', 'Jun Roselio D. Pongco', 'Rev.'],
    ['Ordaining Council / CCFI', 'Benedicto S. Corpuz', 'Bishop'],
  ]),
  ...regional(OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR, [
    ['Region I', 'Jonathan L. Balintay', 'Rev.'],
    ['Region II', 'Nestor R. Tangunan', 'Rev.'],
    ['Region III', 'Miller B. Tadeo', 'Rev.'],
    ['Region IV-A', 'Conrado C. Perez', 'Rev.'],
    ['Region IV-B', 'Fortunato T. Almasco Jr.', 'Bishop'],
    ['Region VI', 'John Rey T. Valera', 'Rev.'],
    ['Central Visayas Region VII', 'Bethel James C. Mascardo Sr.', 'Bishop'],
    ['Negros Island Region', 'Faulkner Faith C. Mascardo', 'Bishop'],
    ['Region XIII', 'Carlito B. Gascon', 'Bishop'],
  ]),
  ...regional(OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR, [
    ['NCR', 'Emilio R. Biag', 'Rev.'],
    ['Region I', 'Virlyn C. Balintay', 'Church Worker'],
    ['Region II - Political Affairs', 'Rabenson C. Tandoy', 'Rev.'],
    ['Region III - External Operations', 'Egmedio B. Equia', 'Rev.'],
  ]),
  ...regional(OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR, [
    ['Isabela', 'Armando F. Junio', 'Rev.'],
    ['Nueva Ecija', 'Rommey Rodriguez', 'Rev.'],
    ['Tarlac', 'Francisco A. Dela Paz', 'Rev.'],
    ['Rizal', 'Abner P. Tuballes', 'Rev.'],
    ['Cavite', 'Edsel R. Alcantara', 'Rev.'],
    ['Batangas', 'Christopher M. Llego', 'Rev.'],
    ['Laguna', 'Elnor B. Bendana', 'Bishop'],
    ['Palawan North', 'Teddy S. Martinez', 'Rev.'],
    ['Palawan South', 'Danilo T. Sabico', 'Rev.'],
    ['Romblon', 'Andrew Ramon Tianga', 'Church Worker'],
    ['Cebu', 'John Mantanlan', 'Church Worker'],
    ['Camiguin', 'Samuel E. Buatas', 'Rev.'],
    ['Davao Oriental', 'Juvanny A. Yap', 'Rev.'],
    ['Agusan del Sur', 'Jerom O. Amoguis', 'Church Worker'],
    ['Agusan del Norte', 'Encelito M. Galendez', 'Church Worker'],
    ['Mindoro', 'Romel G. Manes', 'Rev.'],
    ['Bulacan', 'Sonny T. San Pedro', 'Rev.'],
    ['Aurora', 'Derlio C. Gonzales Jr.', 'Rev.'],
    ['Ilocos Norte', 'Roger D. Salvador', 'Rev.'],
    ['Pampanga', 'Willie O. Tolentino', 'Rev.'],
    ['Zambales', 'Hilario C. Caron', 'Church Worker'],
  ]),
  ...regional(OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR, [
    ['Tarlac', 'Nemesio Q. Bajana', 'Church Worker'],
    ['Tarlac - Political Affairs', 'Emmanuel M. Macabali', 'Church Worker'],
    ['Cabanatuan', 'Romel Arnel V. Roque', 'Rev.'],
    ['Bulacan', 'Rodrigo C. Teresi', 'Rev.'],
    ['Cavite Wide', 'Ricardo G. Gacutan', 'Rev.'],
    ['Cavite Lowland', 'Dantyne B. Nolasco', 'Church Worker'],
    ['Pampanga', 'Eller G. Valencia', 'Church Worker'],
    ['Zambales', 'Perfecto H. Segismundo Jr.', 'Church Worker'],
  ]),
  ...regional(OfficeTitleLevel.CITY_CHAPLAIN, [
    ['Trece Martires, Cavite', 'Alejandro A. Salamangca', 'Church Worker'],
    ['General Trias, Cavite', 'Norman S. Endozo', 'Church Worker'],
    ['Dasmariñas, Cavite', 'George L. Junio', 'Church Worker'],
    ['Las Piñas', 'Ronald C. Castillo', 'Church Worker'],
    ['Santa Rosa, Laguna', 'Ellery S. Garvida', 'Rev.'],
    ['Cabuyao City, Laguna', 'Edgar J. Amarante', 'Rev.'],
    ['San Pedro City, Laguna', 'Noe M. Roldan', 'Church Worker'],
    ['Parañaque', 'Nodel M. Manzo', 'Rev.'],
    ['Quezon City', 'Enrique G. Ancheta', 'Church Worker'],
    ['Angeles, Pampanga', 'Leslie D. Cunanan', 'Church Worker'],
    ['San Fernando, Pampanga', 'Eller G. Valencia', 'Rev.'],
    ['Tarlac City', 'Valeriano T. Ramos Jr.', 'Church Worker'],
    ['Cavite City', 'Rufino F. De Guzman', 'Bishop'],
  ]),
  ...regional(OfficeTitleLevel.MUNICIPAL_CHAPLAIN, [
    ['Silang, Cavite', 'Roberto D. Malana', 'Rev.'],
    ['Kawit, Cavite', 'James Wayne P. Tuballes', 'Rev.'],
    ['Naic, Cavite', 'Godofredo G. Javier Jr.', 'Rev.'],
    ['Alfonso, Cavite', 'Chetto O. Consagra', 'Rev.'],
    ['Gerona, Tarlac', 'Rodrigo S. Fontanilla Jr.', 'Rev.'],
    ['Concepcion, Tarlac', 'Jessie D. Bunag', 'Church Worker'],
    ['Santiago, Isabela', 'Alfredo G. Casco', 'Church Worker'],
    ['Labrador, Pangasinan', 'Menard Aries Q. Narvas', 'Church Worker'],
    ['Capas, Tarlac', 'Elmer C. Victoria', 'Rev.'],
    ['La Paz, Tarlac', 'Junel V. Vivez', 'Rev.'],
    ['Victoria, Tarlac', 'Zosimo Valdez Jr.', 'Rev.'],
    ['Sta. Ignacia, Tarlac', 'Rodel E. Banaga', 'Rev.'],
    ['Camiling, Tarlac', 'Roel Eugenio', 'Rev.'],
    ['San Jose, Tarlac', 'Analiza T. Concepcion', 'Rev.'],
    ['Moncada, Tarlac', 'Joel Gamas', 'Rev.'],
    ['Camiguin', 'Evijon A. Labador', 'Church Worker'],
    ['Narra, Palawan', 'Francisco P. Pedregosa', 'Church Worker'],
    ['Quezon, Palawan', 'Rodrigo A. Faliva', 'Church Worker'],
    ['Roxas, Palawan', 'Ramon S. Bañes', 'Church Worker'],
    ['Dumaran, Palawan', 'Eliezer M. Gomez', 'Church Worker'],
    ['Angono, Rizal', 'Jemolet M. Reyes', 'Church Worker'],
    ['Rosario, Cavite', 'Dantyne B. Nolasco', 'Church Worker'],
    ['Malabon, Manila', 'Jefferson F. Balleste', 'Church Worker'],
    ['Guiguinto, Bulacan', 'Henry L. Vicente', 'Church Worker'],
    ['Hagonoy, Bulacan', 'Glenn M. Mendoza', 'Church Worker'],
    ['Sta. Maria, Bulacan', 'Vincent S. Dela Cerna', 'Church Worker'],
    ['General Tinio, Nueva Ecija', 'Rolly B. Milles', 'Church Worker'],
  ]),
  ...regional(OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN, [
    ['NCR', 'John R. Santos', 'Church Worker'],
    ['Makati', 'Lorna E. Senting', 'Church Worker'],
    ['Muntinlupa City', 'Jondie M. Buat', 'Rev.'],
    ['San Jose', 'Myrie E. Ramil', 'Rev.'],
    ['La Paz', 'Rico L. Razon', 'Rev.'],
    ['Victoria', 'Marlo V. Dela Cruz', 'Rev.'],
    ['Capas', 'Romuel D. Pimentel', 'Rev.'],
    ['Sta. Ignacia', 'Rowena I. Gabriel', 'Rev.'],
    ['Taguig', 'Ramil R. Ibarra', 'Church Worker'],
    ['Angono, Rizal', 'Rose Marie R. Perez', 'Church Worker'],
    ['Santa Rosa, Laguna', 'Jelmar G. Fain', 'Church Worker'],
    ['Hagonoy, Bulacan', 'Balbino C. Alminiana', 'Rev.'],
    ['Pura, Tarlac', 'Dale C. Aguilar', 'Church Worker'],
    ['Northern District', 'Roberto G. Parcasio', 'Rev.'],
  ]),
];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const extensionName = /^(Jr\.?|Sr\.?|II|III|IV)$/i.test(parts[parts.length - 1] ?? '') ? parts.pop() : undefined;
  return {
    firstName: parts.shift() ?? 'Preview',
    lastName: parts.pop() ?? 'Officer',
    middleInitial: parts.join(' ') || undefined,
    extensionName,
  };
}

function slug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function jurisdictionData(level: OfficeTitleLevel, jurisdiction: string) {
  if (level === OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR) return { department: jurisdiction };
  if (level === OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR || level === OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR) return { region: jurisdiction };
  if (level === OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR || level === OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR) return { province: jurisdiction };
  return { cityMunicipality: jurisdiction };
}

async function main() {
  const password = await bcrypt.hash('Preview123@', 12);
  const officeTitles = await prisma.officeTitle.findMany({ select: { id: true, level: true } });
  const officeByLevel = new Map(officeTitles.map((office) => [office.level, office.id]));
  const missingLevels = [...new Set(previewAssignments.map((assignment) => assignment.level))]
    .filter((level) => !officeByLevel.has(level));
  if (missingLevels.length) throw new Error(`Missing office title(s): ${missingLevels.join(', ')}`);

  let createdMembers = 0;
  let createdAssignments = 0;

  for (const [index, assignment] of previewAssignments.entries()) {
    const email = `org-chart-preview-${slug(assignment.name)}@example.test`;
    const name = splitName(assignment.name);
    const user = await prisma.user.upsert({
      where: { email },
      create: { name: assignment.name, email, password, role: UserType.OFFICER, isEmailVerified: true },
      update: { name: assignment.name, role: UserType.OFFICER, accountStatus: 'ACTIVE' },
      select: { id: true },
    });

    const existingMember = await prisma.member.findUnique({ where: { userId: user.id }, select: { id: true } });
    const member = await prisma.member.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        uniqueId: `ORG-PREVIEW-${String(index + 1).padStart(3, '0')}`,
        status: MemberStatus.APPROVED,
        memberType: MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER,
        isActive: true,
        gender: Gender.PREFER_NOT_TO_SAY,
        dateOfBirth: new Date('1980-01-01T00:00:00.000Z'),
        nationality: 'Filipino',
        currentPositionRole: assignment.role,
        homeAddress: `Preview assignment: ${assignment.jurisdiction}`,
        ...name,
      },
      update: {
        status: MemberStatus.APPROVED,
        memberType: MemberType.ORDAINED_AND_COMMISSIONED_PRACTITIONER,
        isActive: true,
        currentPositionRole: assignment.role,
      },
      select: { id: true },
    });
    if (!existingMember) createdMembers += 1;

    const officeTitleId = officeByLevel.get(assignment.level)!;
    const jurisdiction = jurisdictionData(assignment.level, assignment.jurisdiction);
    const existingAssignment = await prisma.officerAssignment.findFirst({
      where: { memberId: member.id, officeTitleId, ...jurisdiction },
      select: { id: true },
    });

    if (existingAssignment) {
      await prisma.officerAssignment.update({
        where: { id: existingAssignment.id },
        data: { isActive: true, isPublic: true, endDate: null },
      });
    } else {
      await prisma.officerAssignment.create({
        data: {
          memberId: member.id,
          officeTitleId,
          ...jurisdiction,
          isActive: true,
          isPublic: true,
          startDate: new Date('2026-11-03T00:00:00.000Z'),
        },
      });
      createdAssignments += 1;
    }
  }

  console.log(`Organizational-chart preview complete: ${createdMembers} members and ${createdAssignments} office assignments created or restored.`);
  console.log('Preview accounts use the password Preview123@ and the @example.test email domain.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Organizational-chart preview seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
