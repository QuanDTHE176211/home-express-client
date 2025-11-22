import { NextResponse } from "next/server"

/**
 * GET /api/auth/me
 * Returns current user info if authenticated via HTTP-only cookie
 * This endpoint is used by auth-context to check authentication status
 */
export async function GET(request: Request) {
  // Backend will verify the HTTP-only access_token cookie and return user data
  // For now, return 401 to indicate not authenticated
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
