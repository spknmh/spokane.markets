export const DEFAULT_ADMIN_LIMIT = 25;

export function parseAdminPagination(params: {
  page?: string;
  limit?: string;
}) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(params.limit ?? String(DEFAULT_ADMIN_LIMIT), 10))
  );
  return { page, limit };
}

export function parseFlag(value?: string) {
  return value === "1" || value === "true";
}

export function parseQuery(value?: string) {
  return (value ?? "").trim();
}

