import { prisma } from '@/lib/prisma';
import { createSeminaryStudentPortalAccount } from '@/controllers/v1/seminary/student-portal-account';

const run = async () => {
  const students = await prisma.seminaryApplication.findMany({
    where: { studentId: { not: null }, portalUserId: null },
    select: {
      id: true,
      studentId: true,
      givenName: true,
      middleName: true,
      surname: true,
    },
  });

  for (const student of students) {
    const studentId = student.studentId;
    if (!studentId) continue;

    await prisma.$transaction(async (tx) => {
      const portalAccount = await createSeminaryStudentPortalAccount(tx, {
        studentId,
        givenName: student.givenName,
        middleName: student.middleName,
        surname: student.surname,
      });

      await tx.seminaryApplication.update({
        where: { id: student.id },
        data: { portalUserId: portalAccount.id },
      });
    });
  }

  console.log(`Created Seminary portal accounts for ${students.length} existing student record(s).`);
};

run()
  .catch((error) => {
    console.error('Unable to backfill Seminary student portal accounts.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
