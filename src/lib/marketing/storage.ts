import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import crypto from "node:crypto";

const MARKETING_UPLOAD_BASE = join(process.cwd(), "uploads", "marketing");

function normalizeKey(input: string): string {
  return input.replaceAll("\\", "/").replace(/^\/+/, "");
}

function ensureSafeKey(input: string): string {
  const key = normalizeKey(input);
  if (key.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return key;
}

export async function writeMarketingFile(opts: {
  relativeKey: string;
  content: Buffer | string;
}): Promise<{ storageKey: string; publicUrl: string }> {
  const key = ensureSafeKey(opts.relativeKey);
  const outputPath = join(MARKETING_UPLOAD_BASE, key);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, opts.content);
  return {
    storageKey: key,
    publicUrl: `/uploads/marketing/${key}`,
  };
}

export async function writeMarketingPng(buffer: Buffer, filename: string): Promise<{ storageKey: string; publicUrl: string }> {
  const randomPrefix = crypto.randomUUID().slice(0, 8);
  return writeMarketingFile({
    relativeKey: `renders/${randomPrefix}-${filename}`,
    content: buffer,
  });
}

export async function writeMarketingText(content: string, filename: string): Promise<{ storageKey: string; publicUrl: string }> {
  const randomPrefix = crypto.randomUUID().slice(0, 8);
  return writeMarketingFile({
    relativeKey: `renders/${randomPrefix}-${filename}`,
    content,
  });
}

export async function readMarketingTextByKey(storageKey: string): Promise<string> {
  const key = ensureSafeKey(storageKey);
  const filePath = join(MARKETING_UPLOAD_BASE, key);
  const content = await readFile(filePath, "utf8");
  return content;
}
