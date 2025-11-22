"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Info } from "lucide-react"

export default function ScanPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push("/customer/bookings/create")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="container max-w-2xl">
        <Card>
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
                <Info className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Tính năng đã được tích hợp</h1>
              <p className="text-muted-foreground">
                Thu thập thông tin đồ đạc giờ là <strong>Bước 2</strong> của quy trình tạo booking
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm text-left space-y-2">
              <p className="font-medium">✨ Quy trình mới gọn gàng hơn:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Bước 1: Nhập địa chỉ đón/giao</li>
                <li>Bước 2: Thu thập đồ đạc (nhập tay, chụp ảnh, OCR...)</li>
                <li>Bước 3: Chọn thời gian</li>
                <li>Bước 4: Xác nhận và nhận báo giá</li>
              </ul>
            </div>

            <Button 
              size="lg"
              onClick={() => router.push("/customer/bookings/create")}
              className="w-full bg-accent-green hover:bg-accent-green-dark"
            >
              Đi đến tạo booking
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground">
              Tự động chuyển hướng sau 3 giây...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
