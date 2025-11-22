/**
 * Distance calculation using Google Maps Distance Matrix API
 * Falls back to Haversine formula if API fails
 *
 * IMPORTANT: This file should only be used server-side to protect API keys
 */

interface DistanceResult {
  distanceKm: number
  durationMinutes: number
  method: "google" | "haversine"
}

interface Coordinates {
  lat: number
  lng: number
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 * SERVER-SIDE ONLY - Do not call from client components
 */
export async function calculateDistance(
  origin: string | Coordinates,
  destination: string | Coordinates,
): Promise<DistanceResult> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    // If we have API key, use Google Maps
    if (apiKey) {
      const originStr = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
      const destStr = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        originStr,
      )}&destinations=${encodeURIComponent(destStr)}&key=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
        const element = data.rows[0].elements[0]
        return {
          distanceKm: element.distance.value / 1000, // Convert meters to km
          durationMinutes: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
          method: "google",
        }
      }
    }

    // Fallback to Haversine formula
    if (typeof origin !== "string" && typeof destination !== "string") {
      const distanceKm = haversineDistance(origin, destination)
      return {
        distanceKm,
        durationMinutes: Math.ceil((distanceKm / 30) * 60), // Assume 30km/h average speed
        method: "haversine",
      }
    }

    throw new Error("Cannot calculate distance without coordinates")
  } catch (error) {
    throw new Error("Không thể tính khoảng cách")
  }
}

/**
 * Haversine formula to calculate distance between two coordinates
 */
function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Geocode an address to coordinates
 * SERVER-SIDE ONLY - Do not call from client components
 */
export async function geocodeAddress(address: string): Promise<Coordinates> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results[0]) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
      }
    }

    throw new Error("Không tìm thấy địa chỉ")
  } catch (error) {
    throw new Error("Không thể xác định vị trí")
  }
}
