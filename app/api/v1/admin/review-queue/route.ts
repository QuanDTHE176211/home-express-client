import { type NextRequest, NextResponse } from "next/server"
import { requestBackend } from "@/app/api/_lib/backend"

/**
 * Review Queue endpoint
 * Fetches sessions needing review and statistics from the backend
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Forward query params to backend
  const queryString = searchParams.toString()
  
  try {
    // Run requests in parallel
    const status = searchParams.get("status") || "NEEDS_REVIEW"
    
    const [sessionsRes, statsRes] = await Promise.all([
      requestBackend(request, `/admin/sessions?${queryString}`),
      requestBackend(request, `/admin/sessions/stats?status=${status}`)
    ])

    if (!sessionsRes.ok) {
      const error = await sessionsRes.text().catch(() => "Unknown error")
      console.error("Failed to fetch sessions:", sessionsRes.status, error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: sessionsRes.status })
    }

    const sessionsData = await sessionsRes.json()
    const statsData = statsRes.ok ? await statsRes.json() : { total: 0, avgConfidence: 0, oldestWaitTimeSeconds: 0 }

    // Map backend response (camelCase) to frontend expectation (snake_case)
    const mappedSessions = (sessionsData.sessions || []).map((session: any) => ({
      session_id: session.sessionId,
      customer_name: session.customer?.customerName || "Unknown",
      customer_email: session.customer?.customerEmail || "",
      customer_avatar: session.customer?.customerAvatar,
      image_count: session.imageCount || 0,
      average_confidence: session.averageConfidence,
      items: session.items || [],
      created_at: session.createdAt,
      status: session.status,
      forced_quote_price: session.forcedQuotePrice,
      estimated_price: session.estimatedPrice,
      image_urls: session.imageUrls || []
    }))

    return NextResponse.json({
      sessions: mappedSessions,
      stats: {
        total: statsData.total || 0,
        avgConfidence: statsData.avgConfidence || 0,
        oldestWaitTime: statsData.oldestWaitTimeSeconds || 0
      }
    })

  } catch (error) {
    console.error("Error in review queue handler:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

