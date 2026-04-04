import type { MarketingPlaceholderDefinition, MarketingTemplateSchema } from "@/lib/marketing/types";

const TOKEN_RE = /\{\{([A-Z0-9_]+)\}\}/g;

export function detectTemplateTokens(input: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null = TOKEN_RE.exec(input);
  while (match) {
    found.add(match[1]);
    match = TOKEN_RE.exec(input);
  }
  TOKEN_RE.lastIndex = 0;
  return [...found].sort();
}

export function detectTokensFromBundle(contents: string[]): string[] {
  const found = new Set<string>();
  for (const content of contents) {
    for (const token of detectTemplateTokens(content)) {
      found.add(token);
    }
  }
  return [...found].sort();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderTemplateString(
  template: string,
  variables: Record<string, string>,
  opts?: { rawHtmlPlaceholders?: string[] }
): string {
  const rawHtml = new Set((opts?.rawHtmlPlaceholders ?? []).map((k) => k.toUpperCase()));
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_full, rawToken: string) => {
    const token = rawToken.toUpperCase();
    const value = variables[token] ?? "";
    if (rawHtml.has(token)) return value;
    return escapeHtml(value);
  });
}

export function buildPlaceholderSchemaFromTokens(
  tokens: string[],
  existing?: MarketingTemplateSchema | null
): MarketingTemplateSchema {
  const prior = new Map<string, MarketingPlaceholderDefinition>();
  for (const item of existing?.placeholders ?? []) {
    prior.set(item.key.toUpperCase(), item);
  }
  return {
    placeholders: tokens.map((token) => {
      const key = token.toUpperCase();
      return (
        prior.get(key) ?? {
          key,
          label: key
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
          required: false,
          type: key.endsWith("_URL") ? "url" : "text",
          entitySource: "manual",
        }
      );
    }),
  };
}

export function getRequiredPlaceholderKeys(
  schema:
    | MarketingTemplateSchema
    | { placeholders?: Array<{ key: string; required?: boolean }> }
    | null
    | undefined
): string[] {
  if (!schema) return [];
  const placeholders = schema.placeholders ?? [];
  return placeholders.filter((p) => p.required).map((p) => p.key.toUpperCase());
}

export function validateRequiredPlaceholders(
  requiredTokens: string[],
  variables: Record<string, string>
): string[] {
  return requiredTokens.filter((token) => !(variables[token]?.trim().length));
}
