import { ApiCode, type ApiCodeValue } from "@/lib/api/codes";
import type { ApiEnvelope } from "@/lib/api/envelope";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: ApiCodeValue,
    public readonly traceId: string,
    public readonly isNetwork: boolean = false,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const traceHeader = response.headers.get("x-trace-id") ?? "";
  try {
    const body = (await response.json()) as ApiEnvelope<T>;
    if (
      typeof body.code !== "number" ||
      typeof body.message !== "string" ||
      typeof body.traceId !== "string" ||
      !("data" in body)
    ) {
      throw new ApiRequestError("The server returned an unexpected response.", ApiCode.INTERNAL, traceHeader || "unknown");
    }
    return body;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError("The server returned an unexpected response.", ApiCode.INTERNAL, traceHeader || "unknown");
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiRequestError("Unable to reach the server. Please try again.", ApiCode.INTERNAL, "offline", true);
  }

  const envelope = await parseEnvelope<T>(response);
  if (envelope.code !== ApiCode.SUCCESS || envelope.data === null) {
    throw new ApiRequestError(envelope.message, envelope.code, envelope.traceId);
  }
  return envelope;
}

export async function requestBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch {
    throw new ApiRequestError("Unable to reach the server. Please try again.", ApiCode.INTERNAL, "offline", true);
  }
  if (!response.ok) {
    const envelope = await parseEnvelope<null>(response).catch(
      () => null,
    );
    throw new ApiRequestError(
      envelope?.message ?? "The file could not be loaded.",
      envelope?.code ?? ApiCode.INTERNAL,
      envelope?.traceId ?? response.headers.get("x-trace-id") ?? "unknown",
    );
  }
  return response.blob();
}
