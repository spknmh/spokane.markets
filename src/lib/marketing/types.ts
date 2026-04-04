export type MarketingPlaceholderType = "text" | "textarea" | "url" | "image" | "html";

export type MarketingPlaceholderDefinition = {
  key: string;
  label: string;
  required?: boolean;
  type?: MarketingPlaceholderType;
  helpText?: string;
  entitySource?: "vendor" | "event" | "market" | "manual";
};

export type MarketingTemplateSchema = {
  placeholders: MarketingPlaceholderDefinition[];
  assetPlaceholders?: string[];
};

export type MarketingOutputFile = {
  name: string;
  url: string;
  width?: number;
  height?: number;
  contentType?: string;
};

export type MarketingTextOutputFile = {
  name: string;
  url: string;
};
