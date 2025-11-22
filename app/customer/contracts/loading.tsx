"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { customerNavItems } from "@/lib/customer-nav-config"

export default function ContractsLoading() {
  return (
    <DashboardLayout navItems={customerNavItems} title="Hợp đồng">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div>
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>

        <Skeleton className="h-11 w-full max-w-md" />

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
