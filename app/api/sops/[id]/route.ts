import { ApiCode } from "@/lib/api/codes";
import { jsonError, jsonOk } from "@/lib/api/envelope";
import { deleteUpload, findSop, readSopContent, StorageError, toListItem } from "@/lib/sops/storage";
import type { SopDetail } from "@/lib/sops/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meta = await findSop(id);
    if (!meta) {
      return jsonError(ApiCode.NOT_FOUND, "That procedure could not be found.", 404);
    }
    const content = await readSopContent(meta);
    const detail: SopDetail = {
      ...toListItem(meta),
      content,
      fileUrl: meta.type === "pdf" ? `/api/sops/${meta.id}/file` : null,
    };
    return jsonOk(detail);
  } catch {
    return jsonError(ApiCode.INTERNAL, "Unable to load that procedure.", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteUpload(id);
    return jsonOk({ id }, "Procedure removed.");
  } catch (error) {
    if (error instanceof StorageError) {
      if (error.kind === "forbidden") {
        return jsonError(ApiCode.FORBIDDEN, error.message, 403);
      }
      if (error.kind === "not_found") {
        return jsonError(ApiCode.NOT_FOUND, error.message, 404);
      }
    }
    return jsonError(ApiCode.INTERNAL, "Unable to remove that procedure.", 500);
  }
}
