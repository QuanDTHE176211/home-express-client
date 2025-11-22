import useSWR from "swr"
import type { CategoryWithSizes } from "@/types"
import { apiClient } from "@/lib/api-client"

/**
 * SWR hook for fetching all categories (admin)
 */
export function useCategories(params?: { isActive?: boolean; page?: number; size?: number }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["/admin/categories", params],
    () => apiClient.getAllCategories(params),
    {
      refreshInterval: 0,
      dedupingInterval: 60000, // Cache for 1 minute
    },
  )

  return {
    categories: (data?.data?.categories as CategoryWithSizes[] | undefined) || [],
    isLoading,
    isError: error,
    mutate,
  }
}

