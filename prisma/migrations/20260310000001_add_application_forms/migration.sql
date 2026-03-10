-- CreateEnum
CREATE TYPE "ApplicationFormType" AS ENUM ('VENDOR', 'MARKET');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "application_forms" (
    "id" TEXT NOT NULL,
    "type" "ApplicationFormType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "answers" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_forms_type_key" ON "application_forms"("type");

-- CreateIndex
CREATE INDEX "applications_formId_status_idx" ON "applications"("formId", "status");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_formId_fkey" FOREIGN KEY ("formId") REFERENCES "application_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default forms
INSERT INTO "application_forms" ("id", "type", "title", "description", "fields", "active", "updatedAt")
VALUES
  ('default_vendor_form', 'VENDOR', 'Vendor Application',
   'Apply for a public vendor profile to share where you''ll be selling and connect with shoppers.',
   '[
     {"id":"business_name","label":"Business / Brand Name","type":"text","required":true,"placeholder":"e.g. Mountain Meadow Farm"},
     {"id":"description","label":"Tell us about your business","type":"textarea","required":true,"placeholder":"What do you sell? How long have you been at it?","helpText":"A few sentences is perfect."},
     {"id":"products","label":"Products you sell","type":"text","required":true,"placeholder":"e.g. Honey, candles, fresh produce"},
     {"id":"markets_attended","label":"Markets you attend or plan to attend","type":"textarea","required":false,"placeholder":"e.g. Spokane Farmers Market, Perry Street Fair"},
     {"id":"website","label":"Website or social media","type":"text","required":false,"placeholder":"https://"},
     {"id":"why","label":"Why do you want a vendor profile?","type":"textarea","required":false,"placeholder":"What are you hoping to get out of it?"}
   ]'::jsonb, true, CURRENT_TIMESTAMP),
  ('default_market_form', 'MARKET', 'Market / Organizer Application',
   'Apply to list your markets and events so visitors can discover them.',
   '[
     {"id":"market_name","label":"Market or Organization Name","type":"text","required":true,"placeholder":"e.g. Downtown Spokane Farmers Market"},
     {"id":"role_in_market","label":"Your role","type":"select","required":true,"options":["Owner","Manager","Organizer","Volunteer","Other"],"placeholder":"Select your role"},
     {"id":"description","label":"Tell us about your market","type":"textarea","required":true,"placeholder":"What kind of market? How often does it run?","helpText":"Include any details that help us understand your event."},
     {"id":"location","label":"Location or neighborhood","type":"text","required":true,"placeholder":"e.g. Downtown Spokane, Kendall Yards"},
     {"id":"frequency","label":"How often does it run?","type":"select","required":true,"options":["Weekly","Bi-weekly","Monthly","Seasonal","One-time","Other"]},
     {"id":"website","label":"Website or social media","type":"text","required":false,"placeholder":"https://"},
     {"id":"why","label":"What do you hope to get from listing here?","type":"textarea","required":false}
   ]'::jsonb, true, CURRENT_TIMESTAMP);
