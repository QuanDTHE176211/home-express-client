import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export function useSavedItemsCount() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCount()
  }, [])

  const loadCount = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getSavedItemsCount()
      setCount(response.count)
    } catch (error) {
      console.error("Failed to load saved items count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = () => {
    loadCount()
  }

  return { count, isLoading, refresh }
}
