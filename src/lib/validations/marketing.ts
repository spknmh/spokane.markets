import { z } from "zod";
import { MarketingTemplateAssetKind, MarketingTemplateProfile } from "@prisma/client";

const tokenKeySchema = z
  .string()
  .min(1)
  .regex(/^[A-Z0-9_]+$/, "Placeholder keys must be upper snake case");

export const marketingPlaceholderSchema = z.object({
  key: tokenKeySchema,
  label: z.string().min(1),
  required: z.boolean().optional(),
  type: z.enum(["text", "textarea", "url", "image", "html"]).optional(),
  helpText: z.string().optional(),
  entitySource: z.enum(["vendor", "event", "market", "manual"]).optional(),
});

export const marketingTemplateCreateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: z.string().min(1),
  profile: z.nativeEnum(MarketingTemplateProfile),
  friendlyFilenameStem: z.string().optional().or(z.literal("")),
  defaultScale: z.coerce.number().int().min(1).max(4).default(2),
  safeHtmlPlaceholders: z.array(tokenKeySchema).default([]),
  companionTextKeys: z.array(z.string().min(1)).default([]),
  placeholderSchemaJson: z.array(marketingPlaceholderSchema).default([]),
  campaignId: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  assets: z
    .array(
      z.object({
        kind: z.nativeEnum(MarketingTemplateAssetKind),
        name: z.string().min(1),
        storageKey: z.string().optional().or(z.literal("")),
        inlineContent: z.string().optional(),
        mimeType: z.string().optional(),
      })
    )
    .min(1),
});

export const marketingTemplateUpdateSchema = marketingTemplateCreateSchema.extend({
  id: z.string().min(1),
  versionBump: z.boolean().optional().default(true),
});

export const marketingRenderCreateSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(tokenKeySchema, z.string()),
  entityRefs: z
    .object({
      vendorId: z.string().optional(),
      eventId: z.string().optional(),
      marketId: z.string().optional(),
    })
    .optional(),
  scale: z.coerce.number().int().min(1).max(3).default(2),
  folderIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const marketingFolderSchema = z.object({
  name: z.string().min(1).max(120),
});

export const marketingTagSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().max(20).optional().or(z.literal("")),
});
