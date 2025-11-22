import { type NextRequest, NextResponse } from "next/server"
import { requestBackend } from "@/app/api/_lib/backend"

/**
 * GET /api/me
 * Returns current user profile information
 * Transforms nested backend response to flat structure expected by frontend
 */
export async function GET(request: NextRequest) {
  try {
    const backendResponse = await requestBackend(request, "/users/profile")
    
    if (!backendResponse.ok) {
      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: backendResponse.headers,
      })
    }

    const data = await backendResponse.json()
    
    // Transform nested response to flat structure for customer profile
    if (data.customer) {
      const flatProfile = {
        full_name: data.customer.full_name || "",
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        date_of_birth: data.customer.date_of_birth || "",
        avatar_url: data.customer.avatar_url || "",
      }
      
      return NextResponse.json(flatProfile)
    }
    
    // Return original response if not a customer profile
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Unable to fetch profile" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/me
 * Updates current user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const backendResponse = await requestBackend(request, "/users/profile")
    
    if (!backendResponse.ok) {
      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: backendResponse.headers,
      })
    }

    const data = await backendResponse.json()
    
    // Transform nested response to flat structure for customer profile
    if (data.customer) {
      const flatProfile = {
        full_name: data.customer.full_name || "",
        phone: data.customer.phone || "",
        address: data.customer.address || "",
        date_of_birth: data.customer.date_of_birth || "",
        avatar_url: data.customer.avatar_url || "",
      }
      
      return NextResponse.json(flatProfile)
    }
    
    // Return original response if not a customer profile
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Unable to update profile" },
      { status: 500 }
    )
  }
}

