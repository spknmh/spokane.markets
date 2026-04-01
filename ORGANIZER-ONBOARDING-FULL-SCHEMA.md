# Organizer Onboarding Full Schema (Draft)

This is a concrete, Prisma-first schema draft for implementing `docs/product/organizer-onboarding-spec.md` end-to-end.

## 1) New Enums

```prisma
enum ListingKind {
  MARKET_BRAND
  EVENT_OCCURRENCE
  BOTH
}

enum OrganizerEventType {
  FARMERS_MARKET
  CRAFT_FAIR
  NIGHT_MARKET
  POP_UP
  HOLIDAY_MARKET
  OTHER
}

enum OccurrenceModel {
  ONE_TIME
  RECURRING
  SEASONAL_SERIES
}

enum IndoorOutdoorMode {
  INDOOR
  OUTDOOR
  HYBRID
}

enum VendorApplicationState {
  NOT_ACCEPTING
  OPEN
  WAITLIST
  CLOSED
}

enum SpecialEventPermitStatus {
  NOT_APPLICABLE
  NOT_REQUIRED
  PENDING
  APPROVED
  UNKNOWN
}

enum RestroomAccess {
  YES
  NO
  NEARBY
  UNKNOWN
}

enum PetPolicy {
  ALLOWED
  RESTRICTED
  PROHIBITED
  UNKNOWN
}

enum ListingEvidenceType {
  SPECIAL_EVENT_PERMIT
  INSURANCE_COI
  HEALTH_PERMIT
  NONPROFIT_DETERMINATION
  OTHER
}

enum ListingEvidenceVisibility {
  ADMIN_ONLY
  ORGANIZER_AND_ADMIN
}

enum ListingModerationNoteVisibility {
  ADMIN_ONLY
  ORGANIZER_VISIBLE
}
```

## 2) `Market` Additions

```prisma
listingKind                ListingKind @default(MARKET_BRAND)
organizerDisplayName       String?
organizerPublicContact     Boolean @default(false)
eventType                  OrganizerEventType?
occurrenceModel            OccurrenceModel?
timezone                   String?
indoorOutdoor              IndoorOutdoorMode?
shortDescription           String?
vendorCategoryPolicy       Json?
vendorApplicationState     VendorApplicationState @default(NOT_ACCEPTING)
vendorApplicationDeadline  DateTime?
termsAttested              Boolean @default(false)
termsAttestedAt            DateTime?
specialEventPermitStatus   SpecialEventPermitStatus @default(UNKNOWN)
expectedAttendance         Int?
streetClosureImpact        Boolean @default(false)
streetClosureNarrative     String? @db.Text
insuranceSummary           String? @db.Text
safetyPlanSummary          String? @db.Text
sanitationPlan             String? @db.Text
cancellationPolicy         String? @db.Text
accessibilitySummary       String? @db.Text
parkingSummary             String? @db.Text
restroomAccess             RestroomAccess?
petPolicy                  PetPolicy?
paymentMethodsPublic       Json?
productHighlights          Json?
typicalVendorCount         String?
feeModelVendor             String? @db.Text
boothLogistics             String? @db.Text
communicationChannels      String? @db.Text
equityInclusionNotes       String? @db.Text
verificationChecklist      Json?
verificationReviewedAt     DateTime?
verificationReviewedBy     String?
complianceFlagged          Boolean @default(false)
complianceNotes            String? @db.Text
```

## 3) `Event` Additions (Override Model)

```prisma
listingKind                ListingKind?
organizerDisplayName       String?
organizerPublicContact     Boolean @default(false)
eventType                  OrganizerEventType?
occurrenceModel            OccurrenceModel?
timezone                   String?
indoorOutdoor              IndoorOutdoorMode?
shortDescription           String?
vendorCategoryPolicy       Json?
vendorApplicationState     VendorApplicationState?
vendorApplicationDeadline  DateTime?
termsAttested              Boolean @default(false)
termsAttestedAt            DateTime?
specialEventPermitStatus   SpecialEventPermitStatus?
expectedAttendance         Int?
streetClosureImpact        Boolean?
streetClosureNarrative     String? @db.Text
insuranceSummary           String? @db.Text
safetyPlanSummary          String? @db.Text
sanitationPlan             String? @db.Text
cancellationPolicy         String? @db.Text
accessibilitySummary       String? @db.Text
parkingSummary             String? @db.Text
restroomAccess             RestroomAccess?
petPolicy                  PetPolicy?
paymentMethodsPublic       Json?
productHighlights          Json?
typicalVendorCount         String?
feeModelVendor             String? @db.Text
boothLogistics             String? @db.Text
communicationChannels      String? @db.Text
equityInclusionNotes       String? @db.Text
verificationChecklist      Json?
verificationReviewedAt     DateTime?
verificationReviewedBy     String?
complianceFlagged          Boolean @default(false)
complianceNotes            String? @db.Text
```

## 4) New Models

```prisma
model ListingEvidence {
  id            String                    @id @default(cuid())
  marketId      String?
  eventId       String?
  type          ListingEvidenceType
  title         String?
  fileUrl       String
  visibility    ListingEvidenceVisibility @default(ADMIN_ONLY)
  uploadedById  String?
  notes         String?                   @db.Text
  reviewedAt    DateTime?
  reviewedBy    String?

  market Market? @relation("MarketEvidence", fields: [marketId], references: [id], onDelete: Cascade)
  event  Event?  @relation("EventEvidence", fields: [eventId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([marketId])
  @@index([eventId])
  @@index([type])
  @@index([visibility])
  @@map("listing_evidences")
}

model ListingModerationNote {
  id         String                          @id @default(cuid())
  marketId   String?
  eventId    String?
  authorId   String
  note       String                          @db.Text
  visibility ListingModerationNoteVisibility @default(ADMIN_ONLY)

  market Market? @relation("MarketModerationNotes", fields: [marketId], references: [id], onDelete: Cascade)
  event  Event?  @relation("EventModerationNotes", fields: [eventId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([marketId])
  @@index([eventId])
  @@index([authorId])
  @@index([visibility])
  @@map("listing_moderation_notes")
}
```

And relation arrays:

```prisma
// Market
evidences       ListingEvidence[]       @relation("MarketEvidence")
moderationNotes ListingModerationNote[] @relation("MarketModerationNotes")

// Event
evidences       ListingEvidence[]       @relation("EventEvidence")
moderationNotes ListingModerationNote[] @relation("EventModerationNotes")
```

## 5) Migration Draft (SQL Checklist)

1. `CREATE TYPE` for all new enums.
2. `ALTER TABLE markets ADD COLUMN ...`.
3. `ALTER TABLE events ADD COLUMN ...`.
4. `CREATE TABLE listing_evidences`.
5. `CREATE TABLE listing_moderation_notes`.
6. Add FKs + indexes for query paths:
   - moderation queues
   - vendor application state/deadline
   - compliance and verification filters

## 6) Surface Impact

- **Organizer:** market/event create/edit validations and forms expand.
- **Admin:** verification changes from single status toggle to checklist + evidence review.
- **Vendor:** event/market vendor-only sections expand (fees, logistics, docs, timeline).
- **Shopper:** card/detail hierarchy gains amenities/policy summaries from structured fields.

## 7) Rollout Recommendation

1. Schema + migration.
2. API read/write support.
3. Organizer forms (Draft/Publish/Verified gates).
4. Shopper displays.
5. Vendor-only displays + CTA state machine.
6. Admin verification workflow hardening.

