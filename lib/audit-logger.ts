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

interface AuditLogEntry {
  action: AuditAction
  target_type: "USER" | "TRANSPORT" | "CATEGORY" | "REVIEW" | "OUTBOX_EVENT"
  target_id?: number
  details?: Record<string, any>
}

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    // TODO: Implement proper audit logging
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Audit Log:", {
        timestamp: new Date().toISOString(),
        ...entry,
      })
    }

    // In production, send to backend
    // await apiClient.createAuditLog(entry)
  } catch (error) {
    console.error("[v0] Failed to log audit action:", error)
  }
}
