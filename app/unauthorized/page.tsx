"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <ShieldAlert className="h-8 w-8 text-error" />
          </div>
          <CardTitle className="text-2xl">Truy cập bị từ chối</CardTitle>
          <CardDescription>Bạn không có quyền truy cập trang này</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Trang này chỉ dành cho quản trị viên. Vui lòng đăng nhập bằng tài khoản có quyền truy cập.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/login")} className="w-full">
              Đăng nhập lại
            </Button>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
