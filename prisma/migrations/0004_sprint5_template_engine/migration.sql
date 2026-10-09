-- Sprint 5 — Mentoring template engine.
--
-- The template version lifecycle is renamed in place (Postgres RENAME VALUE) so
-- that existing rows are preserved:
--   EXTRACTION_DRAFT -> DRAFT
--   VALIDATED        -> READY_FOR_PUBLISH
-- IN_REVIEW is inserted before READY_FOR_PUBLISH. Column defaults follow the
-- rename automatically; no data rewrite is required.

-- CreateEnum
CREATE TYPE "ValidationRunStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationIssueSeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- AlterEnum (rename in place, preserve rows)
ALTER TYPE "TemplateVersionStatus" RENAME VALUE 'EXTRACTION_DRAFT' TO 'DRAFT';
ALTER TYPE "TemplateVersionStatus" RENAME VALUE 'VALIDATED' TO 'READY_FOR_PUBLISH';
ALTER TYPE "TemplateVersionStatus" ADD VALUE 'IN_REVIEW' BEFORE 'READY_FOR_PUBLISH';

-- DropForeignKey
ALTER TABLE "mentoring_templates" DROP CONSTRAINT "mentoring_templates_programmeId_fkey";

-- AlterTable
ALTER TABLE "mentoring_template_versions" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "basedOnVersionId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedById" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "mentoring_templates" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sourceDocumentId" TEXT;

-- CreateTable
CREATE TABLE "template_validation_runs" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "status" "ValidationRunStatus" NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_validation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_validation_issues" (
    "id" TEXT NOT NULL,
    "validationRunId" TEXT NOT NULL,
    "severity" "ValidationIssueSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "field" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_validation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_validation_runs_versionId_idx" ON "template_validation_runs"("versionId");

-- CreateIndex
CREATE INDEX "template_validation_runs_status_idx" ON "template_validation_runs"("status");

-- CreateIndex
CREATE INDEX "template_validation_issues_validationRunId_idx" ON "template_validation_issues"("validationRunId");

-- CreateIndex
CREATE INDEX "mentoring_templates_sourceDocumentId_idx" ON "mentoring_templates"("sourceDocumentId");

-- AddForeignKey
ALTER TABLE "mentoring_templates" ADD CONSTRAINT "mentoring_templates_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_templates" ADD CONSTRAINT "mentoring_templates_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_basedOnVersionId_fkey" FOREIGN KEY ("basedOnVersionId") REFERENCES "mentoring_template_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_validation_runs" ADD CONSTRAINT "template_validation_runs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "mentoring_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_validation_runs" ADD CONSTRAINT "template_validation_runs_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_validation_issues" ADD CONSTRAINT "template_validation_issues_validationRunId_fkey" FOREIGN KEY ("validationRunId") REFERENCES "template_validation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
