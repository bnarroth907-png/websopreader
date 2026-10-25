import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ApiCode, type ApiCodeValue } from "@/lib/api/codes";

export interface ApiEnvelope<T> {
  code: ApiCodeValue;
  message: string;
  data: T | null;
  traceId: string;
}

export function createTraceId(): string {
  return randomUUID();
}

export function jsonOk<T>(data: T, message = "OK", traceId = createTraceId()): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    { code: ApiCode.SUCCESS, message, data, traceId },
    { status: 200, headers: { "x-trace-id": traceId } },
  );
}

export function jsonError(
  code: ApiCodeValue,
  message: string,
  httpStatus: number,
  traceId = createTraceId(),
): NextResponse<ApiEnvelope<null>> {
  return NextResponse.json(
    { code, message, data: null, traceId },
    { status: httpStatus, headers: { "x-trace-id": traceId } },
  );
}
