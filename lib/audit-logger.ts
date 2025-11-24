import { apiClient } from "@/lib/api-client"

export type AuditAction =
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "BULK_USER_DEACTIVATED"
  | "TRANSPORT_APPROVED"
  | "TRANSPORT_REJECTED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "REVIEW_FLAGGED"
  | "OUTBOX_EVENT_RETRIED"
  | "OUTBOX_EVENT_DELETED"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "EXCEPTION_UPDATED"
  | "DATA_EXPORTED"

interface AuditLogEntry {
  action: AuditAction
  target_type: "USER" | "TRANSPORT" | "CATEGORY" | "REVIEW" | "OUTBOX_EVENT" | "BID" | "EXCEPTION"
  target_id?: number
  details?: Record<string, any>
}

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Audit Log:", {
        timestamp: new Date().toISOString(),
        ...entry,
      })
    }

    // Send to backend
    await apiClient.createAuditLog({
      action: entry.action,
      targetType: entry.target_type,
      targetId: entry.target_id,
      details: entry.details,
    })
  } catch (error) {
    console.error("[v0] Failed to log audit action:", error)
  }
}
