"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  ArrowDown,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  RefreshCw,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  LayoutDashboard,
  Truck,
  Star,
  DollarSign,
  ArrowRight,
  Info,
  XCircle,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAvailableBookings } from "@/hooks/use-bookings"
import { formatVND, formatDate } from "@/lib/format"
import { http } from "@/lib/http"
import type { TimeSlot } from "@/types"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "Sáng",
  AFTERNOON: "Chiều",
  EVENING: "Tối",
  FLEXIBLE: "Linh hoạt",
}

export default function TransportJobsPage() {
  const [maxDistance, setMaxDistance] = useState<number>(50)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [vehicleEligibility, setVehicleEligibility] = useState<Record<number, boolean>>({})
  const [loadingEligibility, setLoadingEligibility] = useState(false)

  const { bookings, isLoading, isError, mutate } = useAvailableBookings({
    page: 1,
    limit: 20,
    maxDistance,
    preferredDate: selectedDate || undefined,
  })

  useEffect(() => {
    const checkEligibility = async () => {
      if (bookings.length === 0) return

      setLoadingEligibility(true)
      const eligibilityMap: Record<number, boolean> = {}

      try {
        await Promise.all(
          bookings.map(async (booking) => {
            try {
              const response = await http("/api/v1/transport/vehicles/eligible", {
                method: "POST",
                body: JSON.stringify({
                  totalWeight: booking.totalWeight,
                  totalVolume: 0,
                  requiresTailLift: false,
                  requiresTools: booking.hasFragileItems || false,
                }),
              })
              const vehicles = await response.json()
              eligibilityMap[booking.bookingId] = vehicles.length > 0
            } catch (err) {
              console.error(`[v0] Failed to check eligibility for booking ${booking.bookingId}:`, err)
              eligibilityMap[booking.bookingId] = true // Assume eligible on error
            }
          }),
        )

        setVehicleEligibility(eligibilityMap)
      } catch (err) {
        console.error("[v0] Failed to check vehicle eligibility:", err)
      } finally {
        setLoadingEligibility(false)
      }
    }

    checkEligibility()
  }, [bookings])

  const handleRetry = () => {
    mutate()
  }

  const stats = {
    total: bookings.length,
    quoted: bookings.filter((b) => b.hasQuoted).length,
    new: bookings.filter((b) => !b.hasQuoted).length,
    avgPrice:
      bookings.length > 0 ? Math.round(bookings.reduce((sum, b) => sum + b.estimatedPrice, 0) / bookings.length) : 0,
  }

  return (
    <DashboardLayout navItems={navItems} title="Công việc khả dụng">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Công việc khả dụng</h1>
          <p className="text-lg text-muted-foreground">Tìm kiếm và báo giá cho các chuyến đi mới</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng công việc</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "..." : stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Trong phạm vi {maxDistance}km</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chưa báo giá</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{isLoading ? "..." : stats.new}</div>
              <p className="text-xs text-muted-foreground mt-1">Cơ hội mới</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Đã báo giá</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{isLoading ? "..." : stats.quoted}</div>
              <p className="text-xs text-muted-foreground mt-1">Đang chờ phản hồi</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Giá TB ước tính</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{isLoading ? "..." : formatVND(stats.avgPrice)}</div>
              <p className="text-xs text-muted-foreground mt-1">Trung bình mỗi chuyến</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bộ lọc tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="max-distance" className="text-base font-medium">
                  Khoảng cách tối đa
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="max-distance"
                    type="number"
                    min="10"
                    max="500"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    aria-label="Khoảng cách tối đa tính bằng km"
                    className="text-lg"
                  />
                  <span className="text-muted-foreground font-medium">km</span>
                </div>
                <p className="text-xs text-muted-foreground">Từ 10km đến 500km</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-date" className="text-base font-medium">
                  Ngày đón hàng
                </Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Chọn ngày đón hàng"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">Lọc theo ngày cụ thể</p>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setMaxDistance(50)
                    setSelectedDate("")
                  }}
                  aria-label="Xóa tất cả bộ lọc"
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isError && (
          <Alert variant="destructive" className="border-l-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">Có lỗi xảy ra khi tải dữ liệu</p>
                <p className="text-sm mt-1">Vui lòng kiểm tra kết nối mạng và thử lại</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="bg-muted/20">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !isError && bookings.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-6">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Không có công việc nào</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Hiện tại không có công việc nào phù hợp với bộ lọc của bạn
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMaxDistance(50)
                    setSelectedDate("")
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Đặt lại bộ lọc
                </Button>
                <Button onClick={() => setMaxDistance(maxDistance + 50)}>Tăng phạm vi tìm kiếm</Button>
              </div>
            </CardContent>
          </Card>
        ) : !isError ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  Tìm thấy <span className="text-primary font-bold">{bookings.length}</span> công việc
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.new > 0 && `${stats.new} công việc mới chưa báo giá`}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => {
                const isEligible = vehicleEligibility[booking.bookingId] !== false
                const checkingEligibility = loadingEligibility && vehicleEligibility[booking.bookingId] === undefined

                return (
                  <Card
                    key={booking.bookingId}
                    className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group ${
                      !isEligible ? "opacity-75" : ""
                    }`}
                  >
                    <CardHeader className="bg-gradient-to-br from-muted/50 to-muted/30 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">#{booking.bookingId}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(booking.notifiedAt, true)}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant={booking.hasQuoted ? "secondary" : "default"} className="text-xs px-3 py-1">
                            {booking.hasQuoted ? "Đã báo giá" : "Mới"}
                          </Badge>
                          {checkingEligibility ? (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              Đang kiểm tra...
                            </Badge>
                          ) : !isEligible ? (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 gap-1">
                              <XCircle className="h-3 w-3" />
                              Không phù hợp
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                            <MapPin className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Điểm đón</p>
                            <p className="text-sm font-medium leading-tight">{booking.pickupLocation}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-red-100 p-1.5 mt-0.5">
                            <MapPin className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Điểm trả</p>
                            <p className="text-sm font-medium leading-tight">{booking.deliveryLocation}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Quãng đường</p>
                          <p className="text-lg font-bold text-blue-600">{booking.distanceKm} km</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Từ vị trí bạn</p>
                          <p className="text-lg font-bold text-purple-600">{booking.distanceFromMe} km</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{formatDate(booking.preferredDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{TIME_SLOT_LABELS[booking.preferredTimeSlot as TimeSlot] || booking.preferredTimeSlot}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Package className="h-3 w-3" />
                          {booking.itemsCount} món
                        </Badge>
                        {booking.totalWeight > 0 && <Badge variant="outline">{booking.totalWeight} kg</Badge>}
                        {booking.hasFragileItems && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Dễ vỡ
                          </Badge>
                        )}
                      </div>

                      {!isEligible && !checkingEligibility && (
                        <Alert variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3" />
                          <AlertDescription>
                            <p className="font-medium mb-1">Không có xe phù hợp</p>
                            <p className="text-xs">
                              Công việc này yêu cầu xe có khả năng chở {booking.totalWeight}kg. Vui lòng cập
                              nhật đội xe để nhận công việc này.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                              Giá tham chiếu
                            </p>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {formatVND(booking.estimatedPrice)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                          Giá tham chiếu dựa trên khoảng cách và khối lượng. Bạn có thể báo giá cao hơn nếu có lý do hợp
                          lý.
                        </p>
                      </div>

                      {booking.quotationsCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">
                            {booking.quotationsCount} đơn vị đã báo giá
                            {booking.hasQuoted && " (bao gồm bạn)"}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="bg-gradient-to-br from-muted/30 to-muted/50 border-t p-4">
                      {booking.hasQuoted ? (
                        <Button variant="outline" className="w-full bg-transparent" size="lg" asChild>
                          <Link href={`/transport/jobs/${booking.bookingId}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Xem báo giá của bạn
                          </Link>
                        </Button>
                      ) : !isEligible ? (
                        <Button variant="outline" className="w-full bg-transparent" size="lg" disabled>
                          <XCircle className="mr-2 h-4 w-4" />
                          Không có xe phù hợp
                        </Button>
                      ) : (
                        <Button
                          className="w-full group-hover:shadow-lg transition-all text-base font-semibold"
                          size="lg"
                          asChild
                        >
                          <Link href={`/transport/jobs/${booking.bookingId}`}>
                            Báo giá ngay
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}

