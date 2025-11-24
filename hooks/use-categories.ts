import useSWR from "swr"
import type { CategoryWithSizes } from "@/types"
import { apiClient } from "@/lib/api-client"

/**
 * SWR hook for fetching all categories (admin)
 */
export function useCategories(params?: { isActive?: boolean; page?: number; size?: number }) {
  const swrKey = params
    ? ["/categories", params.isActive ?? "all", params.page ?? "page", params.size ?? "size"]
    : "/categories"

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => apiClient.getAllCategories(params),
    {
      refreshInterval: 0,
      dedupingInterval: 60000, // Cache for 1 minute
    },
  )

  const categoriesData =
    data?.data?.categories ||
    data?.categories ||
    (Array.isArray(data?.data) ? data?.data : Array.isArray(data) ? data : [])

  return {
    categories: (categoriesData as CategoryWithSizes[] | undefined) || [],
    isLoading,
    isError: error,
    mutate,
  }
}

