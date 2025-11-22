"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Truck, DollarSign, Settings, FileText, BarChart3, Star } from "lucide-react"

const navItems = [
  { href: "/transport", label: "Tổng quan", icon: "Package" },
  { href: "/transport/jobs", label: "Công việc", icon: "Truck" },
  { href: "/transport/quotations", label: "Báo giá", icon: "FileText" },
  { href: "/transport/vehicles", label: "Xe", icon: "Truck" },
  { href: "/transport/earnings", label: "Thu nhập", icon: "DollarSign" },
  { href: "/transport/analytics", label: "Phân tích", icon: "TrendingUp" },
  { href: "/transport/contracts", label: "Hợp đồng", icon: "FileText" },
  { href: "/transport/reviews", label: "Đánh giá", icon: "Star" },
  { href: "/transport/settings", label: "Cài đặt", icon: "Settings" },
]

export default function TransportReviewsLoading() {
  return (
    <DashboardLayout navItems={navItems} title="Đánh giá">
      <div className="container max-w-7xl py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </Card>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

