import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  getMaxUploadBytes,
  getStorageRoot,
  type AllowedUploadExtension,
} from "@/lib/config";
import { writeAuditLog } from "@/lib/sops/audit";
import type { SopDocumentType, SopMeta, SopSortField, SopSource } from "@/lib/sops/types";

const META_FILE = "meta.json";

function sourceDir(source: SopSource): string {
  return path.join(getStorageRoot(), "sops", source);
}

function sopDir(source: SopSource, id: string): string {
  return path.join(sourceDir(source), id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMeta(raw: unknown, source: SopSource, id: string): SopMeta | null {
  if (!isRecord(raw)) {
    return null;
  }
  const title = raw.title;
  const category = raw.category;
  const description = raw.description;
  const type = raw.type;
  const originalFilename = raw.originalFilename;
  const createdAt = raw.createdAt;
  if (
    typeof title !== "string" ||
    typeof category !== "string" ||
    typeof description !== "string" ||
    (type !== "markdown" && type !== "pdf") ||
    typeof originalFilename !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  return {
    id,
    title,
    category,
    description,
    type,
    source,
    originalFilename,
    createdAt,
  };
}

async function readMeta(source: SopSource, id: string): Promise<SopMeta | null> {
  try {
    const text = await readFile(path.join(sopDir(source, id), META_FILE), "utf8");
    return parseMeta(JSON.parse(text) as unknown, source, id);
  } catch {
    return null;
  }
}

async function listSourceIds(source: SopSource): Promise<string[]> {
  try {
    const entries = await readdir(sourceDir(source), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

export async function listAllMetas(): Promise<SopMeta[]> {
  const sources: SopSource[] = ["library", "uploads"];
  const metas: SopMeta[] = [];
  for (const source of sources) {
    const ids = await listSourceIds(source);
    for (const id of ids) {
      const meta = await readMeta(source, id);
      if (meta) {
        metas.push(meta);
      }
    }
  }
  return metas;
}

export async function findSop(id: string): Promise<SopMeta | null> {
  const library = await readMeta("library", id);
  if (library) {
    return library;
  }
  return readMeta("uploads", id);
}

function documentPath(meta: SopMeta): string {
  const filename = meta.type === "pdf" ? "original.pdf" : "document.md";
  if (meta.source === "uploads") {
    const ext = path.extname(meta.originalFilename).toLowerCase();
    if (meta.type === "pdf") {
      return path.join(sopDir(meta.source, meta.id), "original.pdf");
    }
    if (ext === ".txt") {
      return path.join(sopDir(meta.source, meta.id), "original.txt");
    }
    return path.join(sopDir(meta.source, meta.id), "original.md");
  }
  return path.join(sopDir(meta.source, meta.id), filename);
}

export async function readSopContent(meta: SopMeta): Promise<string> {
  if (meta.type === "pdf") {
    return "";
  }
  return readFile(documentPath(meta), "utf8");
}

export async function readSopFileBuffer(meta: SopMeta): Promise<Buffer> {
  return readFile(documentPath(meta));
}

export function getSopContentType(meta: SopMeta): string {
  if (meta.type === "pdf") {
    return "application/pdf";
  }
  if (meta.originalFilename.toLowerCase().endsWith(".txt")) {
    return "text/plain; charset=utf-8";
  }
  return "text/markdown; charset=utf-8";
}

export function sortMetas(items: SopMeta[], sort: SopSortField): SopMeta[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "createdAt") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return a[sort].localeCompare(b[sort], undefined, { sensitivity: "base" });
  });
  return copy;
}

export async function matchesQuery(meta: SopMeta, query: string): Promise<boolean> {
  if (!query) {
    return true;
  }
  const haystack = `${meta.title} ${meta.category} ${meta.description}`.toLowerCase();
  if (haystack.includes(query)) {
    return true;
  }
  if (meta.type === "markdown") {
    const content = await readSopContent(meta);
    return content.toLowerCase().includes(query);
  }
  return false;
}

export function parseUploadExtension(filename: string): AllowedUploadExtension | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) {
    return null;
  }
  return (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as AllowedUploadExtension)
    : null;
}

export class StorageError extends Error {
  constructor(
    public readonly kind: "unsupported_type" | "too_large" | "not_found" | "forbidden",
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export async function saveUpload(file: File): Promise<SopMeta> {
  const ext = parseUploadExtension(file.name);
  if (!ext) {
    throw new StorageError("unsupported_type", "Please upload a Markdown, text, or PDF file.");
  }
  if (file.size > getMaxUploadBytes()) {
    throw new StorageError("too_large", "The file is too large to upload.");
  }

  const id = randomUUID();
  const type: SopDocumentType = ext === "pdf" ? "pdf" : "markdown";
  const title = file.name.replace(/\.[^/.]+$/, "") || "Untitled SOP";
  const meta: SopMeta = {
    id,
    title,
    category: "Uploaded",
    description: `Uploaded ${ext.toUpperCase()} • ${file.name}`,
    type,
    source: "uploads",
    originalFilename: file.name,
    createdAt: new Date().toISOString(),
  };

  const dir = sopDir("uploads", id);
  await mkdir(dir, { recursive: true });
  const storedName = ext === "pdf" ? "original.pdf" : ext === "txt" ? "original.txt" : "original.md";
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), bytes);
  await writeFile(path.join(dir, META_FILE), JSON.stringify(meta, null, 2), "utf8");
  await writeAuditLog("create", id);
  return meta;
}

export async function deleteUpload(id: string): Promise<void> {
  const library = await readMeta("library", id);
  if (library) {
    throw new StorageError("forbidden", "Built-in procedures cannot be removed.");
  }
  const uploaded = await readMeta("uploads", id);
  if (!uploaded) {
    throw new StorageError("not_found", "That procedure could not be found.");
  }
  await rm(sopDir("uploads", id), { recursive: true, force: true });
  await writeAuditLog("delete", id);
}

export function toListItem(meta: SopMeta) {
  return {
    ...meta,
    isUploaded: meta.source === "uploads",
  };
}
