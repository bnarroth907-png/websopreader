import { ApiCode } from "@/lib/api/codes";
import { jsonError, jsonOk } from "@/lib/api/envelope";
import {
  listAllMetas,
  matchesQuery,
  saveUpload,
  sortMetas,
  StorageError,
  toListItem,
} from "@/lib/sops/storage";
import type { PaginatedSops, SopSortField } from "@/lib/sops/types";

function parseSort(value: string | null): SopSortField {
  if (value === "category" || value === "createdAt" || value === "title") {
    return value;
  }
  return "title";
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get("page"), 1, 10_000);
    const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 20, 100);
    const sort = parseSort(url.searchParams.get("sort"));
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const metas = sortMetas(await listAllMetas(), sort);
    const matched: typeof metas = [];
    for (const meta of metas) {
      if (await matchesQuery(meta, q)) {
        matched.push(meta);
      }
    }

    const total = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = matched.slice(start, start + pageSize).map(toListItem);

    const data: PaginatedSops = {
      items,
      page: safePage,
      pageSize,
      total,
      totalPages,
      sort,
    };
    return jsonOk(data);
  } catch {
    return jsonError(ApiCode.INTERNAL, "Unable to load procedures right now.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonError(ApiCode.BAD_REQUEST, "Please choose a file to upload.", 400);
    }
    const meta = await saveUpload(file);
    return jsonOk(toListItem(meta), "Procedure uploaded.");
  } catch (error) {
    if (error instanceof StorageError) {
      if (error.kind === "unsupported_type") {
        return jsonError(ApiCode.UNSUPPORTED_TYPE, error.message, 415);
      }
      if (error.kind === "too_large") {
        return jsonError(ApiCode.PAYLOAD_TOO_LARGE, error.message, 413);
      }
    }
    return jsonError(ApiCode.INTERNAL, "Unable to upload that file.", 500);
  }
}
