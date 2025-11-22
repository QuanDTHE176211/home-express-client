import useSWR from "swr"
import { apiClient } from "@/lib/api-client"

/**
 * SWR hook for calculating distance between two addresses
 */
export function useDistance(origin: string | null, destination: string | null) {
  const shouldFetch = origin && destination

  const { data, error, isLoading } = useSWR(
    shouldFetch ? ["/distance/calculate", origin, destination] : null,
    () =>
      origin && destination
        ? apiClient.calculateDistance({
            originAddress: origin,
            destinationAddress: destination,
          })
        : null,
    {
      refreshInterval: 0,
      dedupingInterval: 300000, // Cache for 5 minutes
    },
  )

  return {
    distance: data?.data?.distanceKm,
    duration: data?.data?.durationMinutes,
    cached: data?.data?.cached,
    isLoading,
    isError: error,
  }
}
