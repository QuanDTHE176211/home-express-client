"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Plus, Search, Package, Sparkles, Download } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import { BookingCard } from "@/components/booking/booking-card"
import { BookingCardSkeleton } from "@/components/booking/booking-card-skeleton"
import { ExportBookingsDialog } from "@/components/booking/export-bookings-dialog"
import { useDebounce } from "@/lib/debounce"
import type { Booking } from "@/types"
import { navItems } from "@/lib/customer-nav-config"

const BookingPage = () => {
  type BookingStatus = Booking["status"]
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showExportDialog, setShowExportDialog] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const { bookings, isLoading, isError } = useBookings({
    status: activeTab === "all" ? undefined : activeTab,
    page: 1,
    limit: 20,
  })

  const filteredBookings = bookings.filter((booking) => {
    if (!debouncedSearch) return true
    const query = debouncedSearch.toLowerCase()
    return (
      booking.pickupLocation.toLowerCase().includes(query) || booking.deliveryLocation.toLowerCase().includes(query)
    )
  })

  const getTabCount = (status: BookingStatus | "all") => {
    if (status === "all") return bookings.length
    return bookings.filter((b) => b.status === status).length
  }

  return (
    <DashboardLayout navItems={navItems} title="Chuyến đi của tôi">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chuyến đi của tôi</h1>
            <p className="text-muted-foreground mt-1">Quản lý tất cả các chuyến đi của bạn</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setShowExportDialog(true)}>
              <Download className="mr-2 h-4 w-4" />
              Xuất dữ liệu
            </Button>
            <Button asChild size="lg" className="bg-accent-green hover:bg-accent-green-dark">
              <Link href="/customer/bookings/create">
                <Plus className="mr-2 h-4 w-4" />
                Tạo đơn mới
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo địa chỉ đón hoặc giao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="Tìm kiếm chuyến đi"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BookingStatus | "all")}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="all">
              Tất cả
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("all")})</span>}
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              Đang chờ
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("PENDING")})</span>}
            </TabsTrigger>
            <TabsTrigger value="QUOTED">
              Đã báo giá
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("QUOTED")})</span>}
            </TabsTrigger>
            <TabsTrigger value="CONFIRMED">
              Đã xác nhận
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("CONFIRMED")})</span>}
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">
              Đang vận chuyển
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("IN_PROGRESS")})</span>}
            </TabsTrigger>
            <TabsTrigger value="COMPLETED">
              Hoàn thành
              {!isLoading && <span className="ml-2 text-xs">({getTabCount("COMPLETED")})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <BookingCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Có lỗi xảy ra khi tải dữ liệu</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="max-w-md mx-auto">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery ? "Không tìm thấy chuyến đi nào" : "Chưa có chuyến đi nào"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Bắt đầu tạo chuyến đi đầu tiên của bạn với AI scan thông minh"}
                  </p>
                  {!searchQuery && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild size="lg" className="bg-accent-green hover:bg-accent-green-dark">
                        <Link href="/customer/bookings/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Tạo đơn mới
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBookings.map((booking) => (
                  <BookingCard key={booking.bookingId} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Dialog */}
      <ExportBookingsDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
    </DashboardLayout>
  )
}

export default BookingPage
