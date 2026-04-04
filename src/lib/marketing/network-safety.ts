import { isIP } from "node:net";

function isPrivateIp(host: string): boolean {
  if (isIP(host) !== 4) return false;
  const [a, b] = host.split(".").map((part) => Number(part));
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function hostAllowedBySuffix(host: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function isAllowedRemoteUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost") return false;
    if (isPrivateIp(host)) return false;

    const allowlist = (process.env.MARKETING_REMOTE_IMAGE_ALLOWLIST ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    if (!allowlist.length) {
      // Default-deny remote fetches unless explicitly allowlisted.
      return false;
    }
    return hostAllowedBySuffix(host, allowlist);
  } catch {
    return false;
  }
}
