import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { navItems } from "@/lib/customer-nav-config"

export default function CreateBookingLoading() {
  return (
    <DashboardLayout navItems={navItems} title="Create Booking">
      <div className="container max-w-4xl py-10 mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="border rounded-lg p-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-6">
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

