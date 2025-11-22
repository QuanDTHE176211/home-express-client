import { type NextRequest, NextResponse } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

interface OutboxMessage {
  id: number
  aggregateType: string
  aggregateId: string
  eventType: string
  payload: string
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED"
  retryCount: number
  maxRetries: number
  lastError: string | null
  createdAt: string
  processedAt: string | null
  nextRetryAt: string | null
}

interface OutboxEvent {
  event_id: number
  type: string
  payload: any
  status: "NEW" | "PROCESSING" | "SENT" | "FAILED"
  retry_count: number
  max_retries: number
  last_error: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
}

export async function GET(request: NextRequest) {
  try {
    // Extract query params
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get("status")
    const typeParam = searchParams.get("type")
    
    // Build backend query
    const backendParams = new URLSearchParams()
    if (statusParam && statusParam !== "ALL") {
      // Map frontend status to backend status
      const statusMap: Record<string, string> = {
        "NEW": "PENDING",
        "PROCESSING": "PROCESSING",
        "SENT": "SENT",
        "FAILED": "FAILED"
      }
      backendParams.set("status", statusMap[statusParam] || statusParam)
    }
    backendParams.set("page", "0")
    backendParams.set("size", "1000")

    // Fetch from backend
    const backendUrl = `/admin/outbox?${backendParams.toString()}`
    const backendResponse = await proxyBackend(request, backendUrl)
    
    if (!backendResponse.ok) {
      return backendResponse
    }

    const data = await backendResponse.json()
    
    // Transform Spring Page<OutboxMessage> to { events: OutboxEvent[] }
    const messages: OutboxMessage[] = data.content || []
    
    const events: OutboxEvent[] = messages
      .filter(msg => {
        // Filter by type if specified
        if (typeParam && typeParam !== "ALL") {
          return msg.eventType === typeParam
        }
        return true
      })
      .map(msg => {
        // Parse payload JSON string
        let parsedPayload: any
        try {
          parsedPayload = JSON.parse(msg.payload)
        } catch {
          parsedPayload = msg.payload
        }

        // Map status: PENDING -> NEW
        const statusMap: Record<string, "NEW" | "PROCESSING" | "SENT" | "FAILED"> = {
          "PENDING": "NEW",
          "PROCESSING": "PROCESSING",
          "SENT": "SENT",
          "FAILED": "FAILED"
        }

        return {
          event_id: msg.id,
          type: msg.eventType,
          payload: parsedPayload,
          status: statusMap[msg.status] || "NEW",
          retry_count: msg.retryCount,
          max_retries: msg.maxRetries,
          last_error: msg.lastError,
          created_at: msg.createdAt,
          updated_at: msg.processedAt || msg.createdAt,
          sent_at: msg.status === "SENT" ? msg.processedAt : null
        }
      })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Outbox adapter error:", error)
    return NextResponse.json(
      { error: "Failed to fetch outbox events" },
      { status: 500 }
    )
  }
}

