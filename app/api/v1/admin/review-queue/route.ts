import { type NextRequest, NextResponse } from "next/server"

/**
 * Review Queue endpoint - stub implementation
 * This feature will track AI scan sessions that need manual review
 * TODO: Implement full backend support for scan sessions
 */
export async function GET(request: NextRequest) {
  // Return empty result set for now
  // When backend is ready, this will proxy to /admin/review-queue
  
  return NextResponse.json({
    sessions: [],
    stats: {
      total: 0,
      avgConfidence: 0,
      oldestWaitTime: 0
    }
  })
}
