"use client"

import { useEffect, useRef, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Offline Detector Component
 *
 * Displays a banner when the user loses internet connection
 * and automatically hides when connection is restored.
 */
export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true))
  const [showReconnected, setShowReconnected] = useState(false)
  const [showOffline, setShowOffline] = useState(false)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const confirmOffline = () => {
      // Debounce offline signal to avoid transient false negatives on navigation
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
      offlineTimerRef.current = setTimeout(() => {
        if (navigator.onLine === false) {
          setIsOnline(false)
          setShowOffline(true)
          setShowReconnected(false)
        }
      }, 1500)
    }

    const handleOnline = () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
      setIsOnline(true)
      setShowOffline(false)
      setShowReconnected(true)

      // Hide reconnected message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false)
      }, 3000)
    }

    const handleOffline = () => {
      confirmOffline()
    }

    // Initial check (debounced)
    if (navigator.onLine === false) confirmOffline()

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      offlineTimerRef.current = null
    }
  }, [])

  if ((isOnline && !showReconnected) || (!showOffline && !showReconnected)) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      {!isOnline && showOffline ? (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>Không có kết nối internet. Vui lòng kiểm tra kết nối của bạn.</AlertDescription>
        </Alert>
      ) : (
        <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 text-green-900 border-green-200">
          <Wifi className="h-4 w-4" />
          <AlertDescription>Đã kết nối lại internet</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
