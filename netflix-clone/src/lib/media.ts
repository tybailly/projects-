/**
 * Resolves a stored S3 object key into a URL the browser can fetch.
 * Seed data uses absolute demo URLs directly; real uploads store bare S3
 * keys that get joined onto S3_PUBLIC_URL (a CDN URL in production).
 */
export function resolveMediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;

  const base = process.env.S3_PUBLIC_URL ?? "";
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
