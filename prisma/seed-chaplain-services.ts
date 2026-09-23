import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const availability =
  'Subject to the assigned chaplain’s availability, service area, and confirmation of the booking request.';

const services = [
  ['Pastoral Care', 'Compassionate spiritual care, prayer, encouragement, and guidance for individuals or families facing personal, emotional, or faith-related concerns.'],
  ['Follow-up Visitation', 'A scheduled follow-up visit to provide continued pastoral support, prayer, encouragement, and connection after a prior concern, event, or referral.'],
  ['Solemnize Marriage', 'Chaplain support for a marriage solemnization, including coordination of the ceremony and pastoral guidance subject to legal and organizational requirements.'],
  ['Pastoral Counseling', 'Confidential, faith-informed counseling and guidance for individuals, couples, or families seeking support with life challenges and decision-making.'],
  ['Devotion and Bible Study', 'Facilitation of a devotional gathering or Bible study focused on scripture, prayer, reflection, and spiritual growth.'],
  ['Spiritual Enhancement', 'A guided spiritual enrichment session that supports reflection, resilience, values formation, and personal faith development.'],
  ['Funeral / Necrological Services', 'Pastoral support for funeral, memorial, or necrological services, including prayer, scripture reading, tribute support, and family care.'],
  ['House / Company Blessing / Dedication', 'Prayer and dedication service for a home, office, company, or facility, seeking guidance, protection, and blessing for its occupants and work.'],
  ['Values / Life Coaching (for Law Enforcers)', 'Values formation and life-coaching support tailored for law-enforcement personnel, promoting ethical service, resilience, and personal well-being.'],
  ['Spiritual and Moral Upliftment Lectures', 'A lecture or group session on spiritual growth, moral values, character formation, and responsible community engagement.'],
  ['Community Spiritual Adviser', 'Chaplain advisory support for communities, organizations, or groups seeking pastoral perspective, values guidance, and spiritual care initiatives.'],
  ['Drug Awareness Training / Seminar', 'An educational training or seminar that promotes drug awareness, prevention, community responsibility, and values-based support.'],
  ['Chaplain Support Service for Police and Military', 'Pastoral, spiritual, and moral support for police and military personnel, units, and their families in service-related settings.'],
] as const;

async function main() {
  for (const [sortOrder, [name, description]] of services.entries()) {
    await prisma.chaplainService.upsert({
      where: { name },
      create: {
        name,
        description,
        availability,
        commissionPercent: 10,
        isActive: true,
        sortOrder,
      },
      // Preserve an administrator's edits when this seed is re-run.
      update: {},
    });
  }

  console.log(`Seeded ${services.length} chaplain services.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Chaplain service seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
