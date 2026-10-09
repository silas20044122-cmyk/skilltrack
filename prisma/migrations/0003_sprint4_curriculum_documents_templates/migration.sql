-- CreateEnum
CREATE TYPE "SourceDocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'EXTRACTED', 'REVIEW_REQUIRED', 'VALIDATED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExtractionRunStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TemplateVersionStatus" AS ENUM ('EXTRACTION_DRAFT', 'VALIDATED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvaluationCategory" AS ENUM ('KNOWLEDGE', 'SKILL', 'ATTITUDE', 'OTHER');

-- CreateEnum
CREATE TYPE "MappingStatus" AS ENUM ('UNMAPPED', 'MAPPED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CompetencyRuleType" AS ENUM ('MINIMUM_COUNT', 'MINIMUM_PERCENTAGE', 'REQUIRED_ITEMS', 'COMPOSITE', 'OTHER');

-- CreateTable
CREATE TABLE "curriculum_units" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileHash" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "status" "SourceDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction_runs" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" "ExtractionRunStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" TEXT,
    "structuredOutput" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraction_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentoring_templates" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentoring_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentoring_template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "TemplateVersionStatus" NOT NULL DEFAULT 'EXTRACTION_DRAFT',
    "sourceDocumentId" TEXT,
    "extractionRunId" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentoring_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_sections" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "parentSectionId" TEXT,
    "sectionNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sectionType" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "mappingStatus" "MappingStatus" NOT NULL DEFAULT 'UNMAPPED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_items" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "itemNumber" TEXT,
    "description" TEXT NOT NULL,
    "sourceWording" TEXT,
    "category" "EvaluationCategory" NOT NULL DEFAULT 'OTHER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_rules" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "ruleType" "CompetencyRuleType" NOT NULL,
    "minimumCorrect" INTEGER,
    "minimumPercentage" INTEGER,
    "requiredItemNumbers" JSONB,
    "conditions" JSONB,
    "sourceWording" TEXT NOT NULL,
    "notes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_section_curriculum_units" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "curriculumUnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_section_curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_version_warnings" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceReference" TEXT,
    "severity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_version_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curriculum_units_programmeId_idx" ON "curriculum_units"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_units_programmeId_code_key" ON "curriculum_units"("programmeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "source_documents_storageKey_key" ON "source_documents"("storageKey");

-- CreateIndex
CREATE INDEX "source_documents_programmeId_idx" ON "source_documents"("programmeId");

-- CreateIndex
CREATE INDEX "source_documents_status_idx" ON "source_documents"("status");

-- CreateIndex
CREATE INDEX "extraction_runs_sourceDocumentId_idx" ON "extraction_runs"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "extraction_runs_status_idx" ON "extraction_runs"("status");

-- CreateIndex
CREATE INDEX "mentoring_templates_programmeId_idx" ON "mentoring_templates"("programmeId");

-- CreateIndex
CREATE INDEX "mentoring_template_versions_templateId_idx" ON "mentoring_template_versions"("templateId");

-- CreateIndex
CREATE INDEX "mentoring_template_versions_status_idx" ON "mentoring_template_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentoring_template_versions_templateId_versionNumber_key" ON "mentoring_template_versions"("templateId", "versionNumber");

-- CreateIndex
CREATE INDEX "template_sections_versionId_idx" ON "template_sections"("versionId");

-- CreateIndex
CREATE INDEX "template_sections_parentSectionId_idx" ON "template_sections"("parentSectionId");

-- CreateIndex
CREATE INDEX "evaluation_items_sectionId_idx" ON "evaluation_items"("sectionId");

-- CreateIndex
CREATE INDEX "competency_rules_versionId_idx" ON "competency_rules"("versionId");

-- CreateIndex
CREATE INDEX "competency_rules_sectionId_idx" ON "competency_rules"("sectionId");

-- CreateIndex
CREATE INDEX "template_section_curriculum_units_sectionId_idx" ON "template_section_curriculum_units"("sectionId");

-- CreateIndex
CREATE INDEX "template_section_curriculum_units_curriculumUnitId_idx" ON "template_section_curriculum_units"("curriculumUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "template_section_curriculum_units_sectionId_curriculumUnitI_key" ON "template_section_curriculum_units"("sectionId", "curriculumUnitId");

-- CreateIndex
CREATE INDEX "template_version_warnings_versionId_idx" ON "template_version_warnings"("versionId");

-- AddForeignKey
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction_runs" ADD CONSTRAINT "extraction_runs_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_templates" ADD CONSTRAINT "mentoring_templates_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "mentoring_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "extraction_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_template_versions" ADD CONSTRAINT "mentoring_template_versions_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "mentoring_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_sections" ADD CONSTRAINT "template_sections_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "template_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_items" ADD CONSTRAINT "evaluation_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "template_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_rules" ADD CONSTRAINT "competency_rules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "mentoring_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_rules" ADD CONSTRAINT "competency_rules_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "template_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_section_curriculum_units" ADD CONSTRAINT "template_section_curriculum_units_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "template_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_section_curriculum_units" ADD CONSTRAINT "template_section_curriculum_units_curriculumUnitId_fkey" FOREIGN KEY ("curriculumUnitId") REFERENCES "curriculum_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version_warnings" ADD CONSTRAINT "template_version_warnings_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "mentoring_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
