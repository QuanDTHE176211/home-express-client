import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Middleware only handles role-based redirects if cookies are present
  // Client-side authentication (via Authorization header) is handled by AuthProvider
  // This allows cross-origin requests to work with localStorage tokens

  // Redirect deprecated routes (Phase 3: Navigation & Routing Updates)
  // Quote screen - redirect to Bids screen (preserves session ID)
  if (pathname === "/customer/quote") {
    const sid = searchParams.get("sid")
    const url = request.nextUrl.clone()
    url.pathname = "/customer/bids"
    if (sid) {
      url.searchParams.set("sid", sid)
    }
    return NextResponse.redirect(url, 301) // Permanent redirect
  }

  // Scan screen - redirect to Booking Creation (already handled by page component, but adding here for completeness)
  if (pathname === "/customer/scan") {
    const url = request.nextUrl.clone()
    url.pathname = "/customer/bookings/create"
    return NextResponse.redirect(url, 301) // Permanent redirect
  }

  // Protect admin routes - only redirect if we have role info
  if (pathname.startsWith("/admin")) {
    const userStr = request.cookies.get("user")?.value

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role !== "MANAGER") {
          // Redirect to appropriate dashboard based on role
          const roleRedirects: Record<string, string> = {
            CUSTOMER: "/customer",
            TRANSPORT: "/transport",
          }
          const redirectPath = roleRedirects[user.role] || "/unauthorized"
          return NextResponse.redirect(new URL(redirectPath, request.url))
        }
      } catch {
        // Invalid user cookie, but don't block - let client-side handle it
      }
    }
  }

  // Protect customer routes - only redirect if we have role info
  if (pathname.startsWith("/customer")) {
    const userStr = request.cookies.get("user")?.value

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role !== "CUSTOMER") {
          const roleRedirects: Record<string, string> = {
            MANAGER: "/admin",
            TRANSPORT: "/transport",
          }
          const redirectPath = roleRedirects[user.role] || "/unauthorized"
          return NextResponse.redirect(new URL(redirectPath, request.url))
        }
      } catch {
        // Invalid user cookie, but don't block - let client-side handle it
      }
    }
  }

  // Protect transport routes - only redirect if we have role info
  if (pathname.startsWith("/transport")) {
    const userStr = request.cookies.get("user")?.value

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role !== "TRANSPORT") {
          const roleRedirects: Record<string, string> = {
            MANAGER: "/admin",
            CUSTOMER: "/customer",
          }
          const redirectPath = roleRedirects[user.role] || "/unauthorized"
          return NextResponse.redirect(new URL(redirectPath, request.url))
        }
      } catch {
        // Invalid user cookie, but don't block - let client-side handle it
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/transport/:path*"],
}
