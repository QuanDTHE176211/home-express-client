import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import type { BookingStatus } from "@/types"

/**
 * SWR hook for fetching bookings list
 */
export function useBookings(params?: {
  page?: number
  limit?: number
  status?: BookingStatus
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
}) {
  const { data, error, isLoading, mutate } = useSWR(["/bookings", params], () => apiClient.getBookings(params), {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true,
  })

  return {
    bookings: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching booking detail
 */
export function useBooking(bookingId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    bookingId ? `/bookings/${bookingId}` : null,
    () => apiClient.getBookingDetail(bookingId),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  return {
    booking: data?.booking,
    statusHistory: data?.statusHistory,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching quotations
 */
export function useQuotations(bookingId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    bookingId ? `/quotations?bookingId=${bookingId}` : null,
    () => apiClient.getBookingQuotations(bookingId),
    {
      refreshInterval: 15000, // Refresh every 15s for real-time updates
      revalidateOnFocus: true,
    },
  )

  return {
    quotations: data?.quotations || [],
    summary: data?.summary,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching categories
 */
export function useCategories() {
  const { data, error, isLoading } = useSWR("/categories", () => apiClient.getCategories(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  return {
    categories: data || [],
    isLoading,
    isError: error,
  }
}

/**
 * SWR hook for fetching available bookings (Transport view)
 */
export function useAvailableBookings(params?: {
  page?: number
  limit?: number
  maxDistance?: number
  preferredDate?: string
}) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/transport/bookings/available", params],
    () => apiClient.getAvailableBookings(params),
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    },
  )

  return {
    bookings: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching transport's quotations
 */
export function useMyQuotations(params?: { page?: number; limit?: number; status?: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/transport/quotations", params],
    () => apiClient.getMyQuotations(params as any),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  )

  return {
    quotations: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * SWR hook for fetching contract
 */
export function useContract(contractId: number | null) {
  const { data, error, isLoading } = useSWR(
    contractId ? `/contracts/${contractId}` : null,
    () => apiClient.getContract(contractId!),
    {
      revalidateOnFocus: false,
    },
  )

  return {
    contract: data,
    isLoading,
    isError: error,
  }
}
