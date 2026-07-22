CREATE TYPE "SeminaryCourseModality" AS ENUM ('FACE_TO_FACE', 'ONLINE');

CREATE TYPE "SeminaryCourseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "SeminaryCourse" (
  "id" TEXT NOT NULL,
  "courseName" TEXT NOT NULL,
  "courseCode" TEXT NOT NULL,
  "program" "SeminaryProgramLevel" NOT NULL,
  "units" INTEGER NOT NULL,
  "modality" "SeminaryCourseModality" NOT NULL,
  "status" "SeminaryCourseStatus" NOT NULL DEFAULT 'ACTIVE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeminaryCourse_courseCode_key" ON "SeminaryCourse"("courseCode");
CREATE INDEX "SeminaryCourse_program_idx" ON "SeminaryCourse"("program");
CREATE INDEX "SeminaryCourse_modality_idx" ON "SeminaryCourse"("modality");
CREATE INDEX "SeminaryCourse_status_idx" ON "SeminaryCourse"("status");
CREATE INDEX "SeminaryCourse_sortOrder_idx" ON "SeminaryCourse"("sortOrder");

INSERT INTO "SeminaryCourse" ("id", "courseName", "courseCode", "program", "units", "modality", "status", "sortOrder", "updatedAt") VALUES
('01k11d0m000000000000000001', 'Certificate in Christian Evangelism', 'CERT-CE', 'CERTIFICATE', 2, 'ONLINE', 'ACTIVE', 1, CURRENT_TIMESTAMP),
('01k11d0m000000000000000002', 'Certificate in Christian Ministry', 'CERT-CM', 'CERTIFICATE', 2, 'ONLINE', 'ACTIVE', 2, CURRENT_TIMESTAMP),
('01k11d0m000000000000000003', 'Certificate in ECE & SPED Management', 'CERT-ESM', 'CERTIFICATE', 2, 'ONLINE', 'ACTIVE', 3, CURRENT_TIMESTAMP),
('01k11d0m000000000000000004', 'Certificate in Advanced Ministerial', 'CERT-AM', 'CERTIFICATE', 2, 'ONLINE', 'ACTIVE', 4, CURRENT_TIMESTAMP),
('01k11d0m000000000000000005', 'Certificate in Advanced Theology', 'CERT-AT', 'CERTIFICATE', 2, 'ONLINE', 'ACTIVE', 5, CURRENT_TIMESTAMP),
('01k11d0m000000000000000006', 'Bachelor of Theology', 'BTH', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 6, CURRENT_TIMESTAMP),
('01k11d0m000000000000000007', 'Bachelor of Theology (Major in Pastoral Ministry)', 'BTH-PM', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 7, CURRENT_TIMESTAMP),
('01k11d0m000000000000000008', 'Bachelor of Theology (Major in Chaplaincy)', 'BTH-CH', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 8, CURRENT_TIMESTAMP),
('01k11d0m000000000000000009', 'Bachelor of Religious Education', 'BRE', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 9, CURRENT_TIMESTAMP),
('01k11d0m000000000000000010', 'Bachelor of Christian Ministry (Major in Human Resources & Community Development)', 'BCM-HRCD', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 10, CURRENT_TIMESTAMP),
('01k11d0m000000000000000011', 'Bachelor of Christian Ministry (Major in Christian Leadership)', 'BCM-CL', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 11, CURRENT_TIMESTAMP),
('01k11d0m000000000000000012', 'Bachelor in Mission (Major in Cross-Culture)', 'BM-CC', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 12, CURRENT_TIMESTAMP),
('01k11d0m000000000000000013', 'Bachelor in Christian Counseling', 'BCC', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 13, CURRENT_TIMESTAMP),
('01k11d0m000000000000000014', 'Bachelor of Christian Ministry in Naturopathic Medicine', 'BCM-NM', 'BACHELOR', 3, 'FACE_TO_FACE', 'ACTIVE', 14, CURRENT_TIMESTAMP),
('01k11d0m000000000000000015', 'Master in Theology', 'MTH', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 15, CURRENT_TIMESTAMP),
('01k11d0m000000000000000016', 'Master in Divinity', 'MDIV', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 16, CURRENT_TIMESTAMP),
('01k11d0m000000000000000017', 'Master of Religious Education', 'MRE', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 17, CURRENT_TIMESTAMP),
('01k11d0m000000000000000018', 'Master of Christian Ministry in Complementary and Alternative Medicine (Major in Naturopathy)', 'MCM-CAMN', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 18, CURRENT_TIMESTAMP),
('01k11d0m000000000000000019', 'Master of Christian Ministry (Major in Christian Leadership)', 'MCM-CL', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 19, CURRENT_TIMESTAMP),
('01k11d0m000000000000000020', 'Master of Arts & Mission', 'MAM', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 20, CURRENT_TIMESTAMP),
('01k11d0m000000000000000021', 'Master in Christian Counseling', 'MCC', 'MASTER_WITH_THESIS', 3, 'ONLINE', 'ACTIVE', 21, CURRENT_TIMESTAMP),
('01k11d0m000000000000000022', 'Doctor of Christian Ministry', 'DCM', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 22, CURRENT_TIMESTAMP),
('01k11d0m000000000000000023', 'Doctor of Ministry Alternative Medicine', 'DM-AM', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 23, CURRENT_TIMESTAMP),
('01k11d0m000000000000000024', 'Doctor of Theology', 'DTH', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 24, CURRENT_TIMESTAMP),
('01k11d0m000000000000000025', 'Doctor of Religious Education', 'DRE', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 25, CURRENT_TIMESTAMP),
('01k11d0m000000000000000026', 'Doctor of Philosophy (Major in Christian Leadership & Management)', 'PHD-CLM', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 26, CURRENT_TIMESTAMP),
('01k11d0m000000000000000027', 'Doctor of Philosophy (Major in Biblical Studies)', 'PHD-BS', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 27, CURRENT_TIMESTAMP),
('01k11d0m000000000000000028', 'Doctor of Philosophy in Theology', 'PHD-TH', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 28, CURRENT_TIMESTAMP),
('01k11d0m000000000000000029', 'Doctor of Philosophy in Christian Apologetics', 'PHD-CA', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 29, CURRENT_TIMESTAMP),
('01k11d0m000000000000000030', 'Doctor of Philosophy in Religion', 'PHD-R', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 30, CURRENT_TIMESTAMP),
('01k11d0m000000000000000031', 'Doctor of Philosophy (Major in Pastoral Ministry)', 'PHD-PM', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 31, CURRENT_TIMESTAMP),
('01k11d0m000000000000000032', 'Doctor of Philosophy (Major in Pastoral Guidance & Counseling)', 'PHD-PGC', 'DOCTORATE_WITH_DISSERTATION', 4, 'ONLINE', 'ACTIVE', 32, CURRENT_TIMESTAMP);
