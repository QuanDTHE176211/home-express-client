import useSWR from "swr"
import { apiClient } from "@/lib/api-client"

/**
 * SWR hook for fetching transport's vehicles
 */
export function useVehicles(params?: { status?: string; page?: number; size?: number }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/transport/vehicles", params],
    () => apiClient.getVehicles(params),
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
    },
  )

  return {
    vehicles: data?.data?.vehicles || [],
    pagination: data?.data?.pagination,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching single vehicle
 */
export function useVehicle(vehicleId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    vehicleId ? `/transport/vehicles/${vehicleId}` : null,
    () => (vehicleId ? apiClient.getVehicle(vehicleId) : null),
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
    },
  )

  return {
    vehicle: data?.data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching vehicle pricing
 */
export function useVehiclePricing(transportId?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/transport/pricing/vehicles", transportId],
    () => apiClient.getVehiclePricing(transportId)
  )

  return {
    pricingRules: data?.data?.pricingRules || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching category pricing
 */
export function useCategoryPricing(transportId?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/transport/pricing/categories", transportId],
    () => apiClient.getCategoryPricing(transportId),
  )

  return {
    pricingRules: data?.data?.pricingRules || [],
    isLoading,
    isError: error,
    mutate,
  }
}
