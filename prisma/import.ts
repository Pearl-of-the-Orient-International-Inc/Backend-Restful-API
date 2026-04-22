import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type SeedData = {
  tables: {
    users: Array<Record<string, unknown>>;
    passkeyCredentials: Array<Record<string, unknown>>;
    members: Array<Record<string, unknown>>;
    ministerialExperiences: Array<Record<string, unknown>>;
    characterReferences: Array<Record<string, unknown>>;
    applicantSignatures: Array<Record<string, unknown>>;
    applicantRequirements: Array<Record<string, unknown>>;
    memberOnboardingProgress: Array<Record<string, unknown>>;
    memberPaymentCheckouts: Array<Record<string, unknown>>;
    memberOnlineInterviewAppointments: Array<Record<string, unknown>>;
    memberIdGenerationAssets: Array<Record<string, unknown>>;
    memberChaplaincyTrainingProgress: Array<Record<string, unknown>>;
    branchOfServices: Array<Record<string, unknown>>;
    officeTitles: Array<Record<string, unknown>>;
    officerAssignments: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    eventAttendees: Array<Record<string, unknown>>;
  };
};

const seedPath = path.join(__dirname, "seed.json");
const raw = fs.readFileSync(seedPath, "utf-8");
const seedData = JSON.parse(raw) as SeedData;

type ExistingTableRow = {
  table_name: string;
};

async function getExistingTables() {
  const rows = await prisma.$queryRaw<ExistingTableRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;

  return new Set(rows.map((row) => row.table_name));
}

async function runIfTableExists(
  existingTables: Set<string>,
  tableName: string,
  label: string,
  action: () => Promise<void>,
) {
  if (!existingTables.has(tableName)) {
    console.log(`Skipping ${label}: table "${tableName}" does not exist.`);
    return;
  }

  await action();
}

async function resetDatabase(existingTables: Set<string>) {
  console.log("Resetting seeded tables...");

  await runIfTableExists(existingTables, "EventAttendee", "reset event attendees", () =>
    prisma.eventAttendee.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "OfficerAssignment", "reset officer assignments", () =>
    prisma.officerAssignment.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "ApplicantRequirement", "reset applicant requirements", () =>
    prisma.applicantRequirement.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "ApplicantSignature", "reset applicant signatures", () =>
    prisma.applicantSignature.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "CharacterReference", "reset character references", () =>
    prisma.characterReference.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MinisterialExperience",
    "reset ministerial experiences",
    () => prisma.ministerialExperience.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "PasskeyCredential", "reset passkey credentials", () =>
    prisma.passkeyCredential.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MemberOnboardingProgress",
    "reset onboarding progress",
    () => prisma.memberOnboardingProgress.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MemberPaymentCheckout",
    "reset payment checkouts",
    () => prisma.memberPaymentCheckout.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MemberOnlineInterviewAppointment",
    "reset interview appointments",
    () => prisma.memberOnlineInterviewAppointment.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MemberIdGenerationAsset",
    "reset ID generation assets",
    () => prisma.memberIdGenerationAsset.deleteMany().then(() => undefined),
  );
  await runIfTableExists(
    existingTables,
    "MemberChaplaincyTrainingProgress",
    "reset chaplaincy training progress",
    () => prisma.memberChaplaincyTrainingProgress.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "Event", "reset events", () =>
    prisma.event.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "OfficeTitle", "reset office titles", () =>
    prisma.officeTitle.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "BranchOfService", "reset branch of services", () =>
    prisma.branchOfService.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "Member", "reset members", () =>
    prisma.member.deleteMany().then(() => undefined),
  );
  await runIfTableExists(existingTables, "User", "reset users", () =>
    prisma.user.deleteMany().then(() => undefined),
  );
}

async function seedTables(existingTables: Set<string>) {
  const { tables } = seedData;

  console.log(`Seeding from ${seedPath}...`);

  await runIfTableExists(existingTables, "User", "seed users", async () => {
    await prisma.user.createMany({
      data: tables.users as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.users.length} users.`);
  });

  await runIfTableExists(existingTables, "PasskeyCredential", "seed passkey credentials", async () => {
    await prisma.passkeyCredential.createMany({
      data: tables.passkeyCredentials.map(({ publicKeyBase64, ...credential }) => ({
        ...credential,
        publicKey: Buffer.from(String(publicKeyBase64), "base64"),
      })) as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.passkeyCredentials.length} passkey credentials.`);
  });

  await runIfTableExists(existingTables, "Member", "seed members", async () => {
    await prisma.member.createMany({
      data: tables.members as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.members.length} members.`);
  });

  await runIfTableExists(
    existingTables,
    "MinisterialExperience",
    "seed ministerial experiences",
    async () => {
      await prisma.ministerialExperience.createMany({
        data: tables.ministerialExperiences as never[],
        skipDuplicates: true,
      });
      console.log(`Seeded ${tables.ministerialExperiences.length} ministerial experiences.`);
    },
  );

  await runIfTableExists(existingTables, "CharacterReference", "seed character references", async () => {
    await prisma.characterReference.createMany({
      data: tables.characterReferences as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.characterReferences.length} character references.`);
  });

  await runIfTableExists(existingTables, "ApplicantSignature", "seed applicant signatures", async () => {
    await prisma.applicantSignature.createMany({
      data: tables.applicantSignatures as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.applicantSignatures.length} applicant signatures.`);
  });

  await runIfTableExists(
    existingTables,
    "ApplicantRequirement",
    "seed applicant requirements",
    async () => {
      await prisma.applicantRequirement.createMany({
        data: tables.applicantRequirements as never[],
        skipDuplicates: true,
      });
      console.log(`Seeded ${tables.applicantRequirements.length} applicant requirements.`);
    },
  );

  await runIfTableExists(
    existingTables,
    "MemberOnboardingProgress",
    "seed onboarding progress",
    async () => {
      await prisma.memberOnboardingProgress.createMany({
        data: tables.memberOnboardingProgress as never[],
        skipDuplicates: true,
      });
      console.log(`Seeded ${tables.memberOnboardingProgress.length} onboarding progress rows.`);
    },
  );

  await runIfTableExists(
    existingTables,
    "MemberPaymentCheckout",
    "seed payment checkouts",
    async () => {
      await prisma.memberPaymentCheckout.createMany({
        data: tables.memberPaymentCheckouts as never[],
        skipDuplicates: true,
      });
      console.log(`Seeded ${tables.memberPaymentCheckouts.length} payment checkout rows.`);
    },
  );

  await runIfTableExists(
    existingTables,
    "MemberOnlineInterviewAppointment",
    "seed interview appointments",
    async () => {
      await prisma.memberOnlineInterviewAppointment.createMany({
        data: tables.memberOnlineInterviewAppointments as never[],
        skipDuplicates: true,
      });
      console.log(
        `Seeded ${tables.memberOnlineInterviewAppointments.length} online interview appointments.`,
      );
    },
  );

  await runIfTableExists(
    existingTables,
    "MemberIdGenerationAsset",
    "seed ID generation assets",
    async () => {
      await prisma.memberIdGenerationAsset.createMany({
        data: tables.memberIdGenerationAssets as never[],
        skipDuplicates: true,
      });
      console.log(`Seeded ${tables.memberIdGenerationAssets.length} ID generation assets.`);
    },
  );

  await runIfTableExists(
    existingTables,
    "MemberChaplaincyTrainingProgress",
    "seed chaplaincy training progress",
    async () => {
      await prisma.memberChaplaincyTrainingProgress.createMany({
        data: tables.memberChaplaincyTrainingProgress as never[],
        skipDuplicates: true,
      });
      console.log(
        `Seeded ${tables.memberChaplaincyTrainingProgress.length} chaplaincy training progress rows.`,
      );
    },
  );

  await runIfTableExists(existingTables, "BranchOfService", "seed branch of services", async () => {
    await prisma.branchOfService.createMany({
      data: tables.branchOfServices as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.branchOfServices.length} branch of service rows.`);
  });

  await runIfTableExists(existingTables, "OfficeTitle", "seed office titles", async () => {
    await prisma.officeTitle.createMany({
      data: tables.officeTitles as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.officeTitles.length} office titles.`);
  });

  await runIfTableExists(existingTables, "OfficerAssignment", "seed officer assignments", async () => {
    await prisma.officerAssignment.createMany({
      data: tables.officerAssignments as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.officerAssignments.length} officer assignments.`);
  });

  await runIfTableExists(existingTables, "Event", "seed events", async () => {
    await prisma.event.createMany({
      data: tables.events as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.events.length} events.`);
  });

  await runIfTableExists(existingTables, "EventAttendee", "seed event attendees", async () => {
    await prisma.eventAttendee.createMany({
      data: tables.eventAttendees as never[],
      skipDuplicates: true,
    });
    console.log(`Seeded ${tables.eventAttendees.length} event attendees.`);
  });
}

async function main() {
  const existingTables = await getExistingTables();

  await resetDatabase(existingTables);
  await seedTables(existingTables);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
