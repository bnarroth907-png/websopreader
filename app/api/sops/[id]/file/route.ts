import { ApiCode } from "@/lib/api/codes";
import { jsonError } from "@/lib/api/envelope";
import { findSop, getSopContentType, readSopFileBuffer } from "@/lib/sops/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function contentDisposition(filename: string): string {
  const safe = filename.replace(/[\r\n]/g, "");
  const ascii = safe.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") || "document";
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meta = await findSop(id);
    if (!meta) {
      return jsonError(ApiCode.NOT_FOUND, "That procedure could not be found.", 404);
    }
    const bytes = await readSopFileBuffer(meta);
    const payload = new Uint8Array(bytes.byteLength);
    payload.set(bytes);
    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": getSopContentType(meta),
        "Content-Disposition": contentDisposition(meta.originalFilename),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return jsonError(ApiCode.INTERNAL, "Unable to load that file.", 500);
  }
}
