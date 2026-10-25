import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getStorageRoot } from "@/lib/config";

export type AuditAction = "create" | "delete";

export interface AuditEntry {
  actor: "anonymous";
  action: AuditAction;
  targetId: string;
  at: string;
}

export async function writeAuditLog(action: AuditAction, targetId: string): Promise<void> {
  const logsDir = path.join(getStorageRoot(), "logs");
  await mkdir(logsDir, { recursive: true });
  const entry: AuditEntry = {
    actor: "anonymous",
    action,
    targetId,
    at: new Date().toISOString(),
  };
  await appendFile(path.join(logsDir, "audit.jsonl"), `${JSON.stringify(entry)}\n`, "utf8");
}
