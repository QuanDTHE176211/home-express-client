import { type NextRequest, NextResponse } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(request: NextRequest) {
  try {
    // Extract query params
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get("isActive")
    
    // Build backend query - map isActive to activeOnly
    const backendParams = new URLSearchParams()
    if (isActive !== null) {
      backendParams.set("activeOnly", isActive)
    }

    // Fetch from backend
    const backendUrl = `/admin/categories?${backendParams.toString()}`
    const backendResponse = await proxyBackend(request, backendUrl)
    
    if (!backendResponse.ok) {
      return backendResponse
    }

    const categories = await backendResponse.json()
    
    // Transform List<Category> to { success, data: { categories } }
    return NextResponse.json({
      success: true,
      data: {
        categories: Array.isArray(categories) ? categories : []
      }
    })
  } catch (error) {
    console.error("Categories adapter error:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return proxyBackend(request, `/admin/categories`)
}
