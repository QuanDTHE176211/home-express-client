import { type NextRequest, NextResponse } from "next/server"
import { calculateDistance, geocodeAddress } from "@/lib/distance-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination } = body

    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required" }, { status: 400 })
    }

    // If addresses are provided, geocode them first
    let originCoords = origin
    let destCoords = destination

    if (typeof origin === "string") {
      originCoords = await geocodeAddress(origin)
    }

    if (typeof destination === "string") {
      destCoords = await geocodeAddress(destination)
    }

    const result = await calculateDistance(originCoords, destCoords)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Distance API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate distance" },
      { status: 500 },
    )
  }
}
