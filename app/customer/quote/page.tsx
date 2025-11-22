"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Info } from "lucide-react"

function QuoteRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sid")

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      if (sessionId) {
        router.push(`/customer/bids?sid=${sessionId}`)
      } else {
        router.push('/customer/bookings')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, sessionId])

  const handleRedirect = () => {
    if (sessionId) {
      router.push(`/customer/bids?sid=${sessionId}`)
    } else {
      router.push('/customer/bookings')
    }
  }

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Tính năng đã được tích hợp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tính năng báo giá đã được tích hợp vào trang chọn xe vận chuyển.
            Bạn sẽ được chuyển hướng tự động sau 3 giây...
          </p>
          <Button onClick={handleRedirect} className="w-full">
            Chuyển ngay <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <QuoteRedirectContent />
    </Suspense>
  )
}
