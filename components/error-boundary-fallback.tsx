"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface ErrorBoundaryFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundaryFallback({ error, reset }: ErrorBoundaryFallbackProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Error Boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-destructive/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Có lỗi xảy ra</h1>
          <p className="text-muted-foreground">
            Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-muted p-4 rounded-lg text-left">
            <p className="font-mono text-sm text-destructive break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Trang chủ
            </Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  )
}

