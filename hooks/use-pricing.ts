import useSWR from "swr"
import { apiClient } from "@/lib/api-client"

export function useRateCards(transportId?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    transportId ? ["/transport/pricing/rate-cards", transportId] : null,
    () => apiClient.getRateCards(transportId!)
  )

  return {
    rateCards: data?.data || [],
    isLoading,
    isError: error,
    mutate
  }
}
