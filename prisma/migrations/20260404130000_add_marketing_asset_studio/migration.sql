-- CreateEnum
CREATE TYPE "MarketingTemplateProfile" AS ENUM ('SQUARE', 'IG_STORY');

-- CreateEnum
CREATE TYPE "MarketingTemplateAssetKind" AS ENUM ('HTML', 'TEXT', 'IMAGE');

-- CreateEnum
CREATE TYPE "MarketingRenderStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "profile" "MarketingTemplateProfile" NOT NULL,
    "placeholderSchemaJson" JSONB,
    "safeHtmlPlaceholders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companionTextKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "friendlyFilenameStem" TEXT,
    "defaultScale" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_template_assets" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "kind" "MarketingTemplateAssetKind" NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT,
    "inlineContent" TEXT,
    "mimeType" TEXT,
    "checksum" TEXT,
    "sizeBytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_template_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_renders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "vendorId" TEXT,
    "eventId" TEXT,
    "marketId" TEXT,
    "variablesJson" JSONB NOT NULL,
    "scale" INTEGER NOT NULL,
    "status" "MarketingRenderStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "pngOutputsJson" JSONB,
    "textOutputsJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_renders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_render_folders" (
    "renderId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_render_folders_pkey" PRIMARY KEY ("renderId","folderId")
);

-- CreateTable
CREATE TABLE "marketing_render_tags" (
    "renderId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_render_tags_pkey" PRIMARY KEY ("renderId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaigns_slug_key" ON "marketing_campaigns"("slug");

-- CreateIndex
CREATE INDEX "marketing_campaigns_active_idx" ON "marketing_campaigns"("active");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_templates_slug_key" ON "marketing_templates"("slug");

-- CreateIndex
CREATE INDEX "marketing_templates_category_active_idx" ON "marketing_templates"("category", "active");

-- CreateIndex
CREATE INDEX "marketing_templates_campaignId_idx" ON "marketing_templates"("campaignId");

-- CreateIndex
CREATE INDEX "marketing_template_assets_templateId_kind_idx" ON "marketing_template_assets"("templateId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_template_assets_templateId_kind_name_key" ON "marketing_template_assets"("templateId", "kind", "name");

-- CreateIndex
CREATE INDEX "marketing_renders_userId_createdAt_idx" ON "marketing_renders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_renders_templateId_createdAt_idx" ON "marketing_renders"("templateId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_renders_status_createdAt_idx" ON "marketing_renders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_renders_deletedAt_idx" ON "marketing_renders"("deletedAt");

-- CreateIndex
CREATE INDEX "marketing_folders_createdById_createdAt_idx" ON "marketing_folders"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_folders_deletedAt_idx" ON "marketing_folders"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_tags_name_key" ON "marketing_tags"("name");

-- CreateIndex
CREATE INDEX "marketing_render_folders_folderId_createdAt_idx" ON "marketing_render_folders"("folderId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_render_tags_tagId_createdAt_idx" ON "marketing_render_tags"("tagId", "createdAt");

-- AddForeignKey
ALTER TABLE "marketing_templates" ADD CONSTRAINT "marketing_templates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_template_assets" ADD CONSTRAINT "marketing_template_assets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "marketing_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_renders" ADD CONSTRAINT "marketing_renders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_renders" ADD CONSTRAINT "marketing_renders_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "marketing_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_renders" ADD CONSTRAINT "marketing_renders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_renders" ADD CONSTRAINT "marketing_renders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_renders" ADD CONSTRAINT "marketing_renders_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_folders" ADD CONSTRAINT "marketing_folders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_render_folders" ADD CONSTRAINT "marketing_render_folders_renderId_fkey" FOREIGN KEY ("renderId") REFERENCES "marketing_renders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_render_folders" ADD CONSTRAINT "marketing_render_folders_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "marketing_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_render_tags" ADD CONSTRAINT "marketing_render_tags_renderId_fkey" FOREIGN KEY ("renderId") REFERENCES "marketing_renders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_render_tags" ADD CONSTRAINT "marketing_render_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "marketing_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
