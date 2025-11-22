"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface UrgentException {
  exception_id: number
  title: string
  priority: string
  type: string
}

export function ExceptionAlert() {
  const { user } = useAuth()
  const router = useRouter()
  const [urgentExceptions, setUrgentExceptions] = useState<UrgentException[]>([])
  const [dismissed, setDismissed] = useState<number[]>([])

  useEffect(() => {
    if (!user || user.role !== "MANAGER") return

    const fetchUrgentExceptions = async () => {
      try {
        const response = await apiClient.getExceptions({
          priority: "URGENT",
          status: "PENDING",
          limit: 5,
        })

        setUrgentExceptions(response.data.exceptions)
      } catch (error) {
        console.error("Failed to fetch urgent exceptions:", error)
      }
    }

    fetchUrgentExceptions()

    // Poll every 30 seconds for new urgent exceptions
    const interval = setInterval(fetchUrgentExceptions, 30000)

    return () => clearInterval(interval)
  }, [user])

  const visibleExceptions = urgentExceptions.filter((ex) => !dismissed.includes(ex.exception_id))

  if (visibleExceptions.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {visibleExceptions.map((exception) => (
        <Alert key={exception.exception_id} variant="destructive" className="relative pr-12">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ngoại lệ khẩn cấp</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">{exception.title}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/exceptions/${exception.exception_id}`)}
                className="bg-background"
              >
                Xem chi tiết
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed([...dismissed, exception.exception_id])}
                className="bg-background"
              >
                Bỏ qua
              </Button>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setDismissed([...dismissed, exception.exception_id])}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
