import path from "node:path";

function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  return value.trim();
}

export function getAppName(): string {
  return readEnv("NEXT_PUBLIC_APP_NAME", "SOP Reader");
}

export function getStorageRoot(): string {
  const configured = readEnv("SOP_STORAGE_DIR", "storage");
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function getMaxUploadBytes(): number {
  const mb = Number.parseInt(readEnv("MAX_UPLOAD_MB", "10"), 10);
  const safeMb = Number.isFinite(mb) && mb > 0 ? mb : 10;
  return safeMb * 1024 * 1024;
}

export const ALLOWED_UPLOAD_EXTENSIONS = ["md", "txt", "pdf"] as const;

export type AllowedUploadExtension = (typeof ALLOWED_UPLOAD_EXTENSIONS)[number];
