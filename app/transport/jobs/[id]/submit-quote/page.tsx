import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { QuotationForm } from "@/components/quotation/quotation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MapPin, Package } from "lucide-react"
import { buildApiUrl } from "@/lib/api-url"

interface AddressSummary {
  street: string
  ward: string
  district: string
  province: string
  contact_name: string
  contact_phone: string
  floor: number | null
  has_elevator: boolean
  distance_km?: number | null
}

interface BookingItemSummary {
  id: string
  name: string
  quantity: number
  weight?: number
  volume?: number
  is_fragile?: boolean
  category_id?: number
  requires_disassembly?: boolean
}

type BookingForQuote = {
  id: number
  booking_id: number
  customer_id: number
  transport_id: number | null
  status: string
  pickup_address: AddressSummary
  delivery_address: AddressSummary
  pickup_floor: number
  has_elevator: boolean
  distance_km: number | null
  preferred_date: string
  items: BookingItemSummary[]
  estimated_price: number | null
  final_price: number | null
  created_at: string
  updated_at: string
}

function mapAddress(address: any): AddressSummary {
  return {
    street: address?.addressLine ?? "",
    ward: address?.wardCode ?? "",
    district: address?.districtCode ?? "",
    province: address?.provinceCode ?? "",
    contact_name: "",
    contact_phone: "",
    floor: typeof address?.floor === "number" ? address.floor : null,
    has_elevator: Boolean(address?.hasElevator),
  }
}

async function getBooking(id: string, cookieHeader: string): Promise<BookingForQuote | null> {
  const response = await fetch(buildApiUrl(`/bookings/${id}`), {
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to load booking ${id} (${response.status})`)
  }

  const data = await response.json()
  const pickupAddress = mapAddress(data.pickupAddress)
  const deliveryAddress = mapAddress(data.deliveryAddress)

  return {
    id: Number(data.bookingId),
    booking_id: Number(data.bookingId),
    customer_id: Number(data.customerId),
    transport_id: data.transportId ?? null,
    status: data.status ?? "PENDING",
    pickup_address: pickupAddress,
    delivery_address: deliveryAddress,
    pickup_floor: pickupAddress.floor ?? 0,
    has_elevator: pickupAddress.has_elevator ?? false,
    distance_km: data.distanceKm ?? data.distance_km ?? null,
    preferred_date: data.preferredDate ?? "",
    items: [],
    estimated_price: data.estimatedPrice ?? null,
    final_price: data.finalPrice ?? null,
    created_at: data.createdAt ?? "",
    updated_at: data.updatedAt ?? "",
  }
}

async function getBookingItems(id: string, cookieHeader: string): Promise<BookingItemSummary[]> {
  const response = await fetch(buildApiUrl(`/bookings/${id}/items`), {
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  })

  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    throw new Error(`Failed to load booking ${id} items (${response.status})`)
  }

  const payload = await response.json()
  const rawItems = Array.isArray(payload?.data) ? payload.data : payload?.items ?? []

  return rawItems.map((item: any) => {
    const weight =
      item.weightKg !== undefined
        ? Number(item.weightKg)
        : item.weight !== undefined
          ? Number(item.weight)
          : item.weight_kg !== undefined
            ? Number(item.weight_kg)
            : undefined

    const height = item.heightCm ?? item.height_cm
    const width = item.widthCm ?? item.width_cm
    const depth = item.depthCm ?? item.depth_cm

    const volume =
      item.volume !== undefined
        ? Number(item.volume)
        : height && width && depth
          ? (Number(height) * Number(width) * Number(depth)) / 1000000
          : undefined

    return {
      id: item.itemId?.toString() ?? `${item.name}-${item.categoryId ?? item.category_id ?? "unknown"}`,
      name: item.name ?? "Item",
      quantity: item.quantity ?? 1,
      weight,
      volume,
      is_fragile: Boolean(item.fragile ?? item.isFragile ?? item.is_fragile),
      requires_disassembly: Boolean(item.requiresDisassembly ?? item.requires_disassembly),
      category_id: item.categoryId ?? item.category_id ?? undefined,
    }
  })
}

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "home" },
  { label: "Công việc", href: "/transport/jobs", icon: "briefcase" },
  { label: "Báo giá", href: "/transport/quotations", icon: "file-text" },
  { label: "Hợp đồng", href: "/transport/contracts", icon: "file-text" },
  { label: "Xe", href: "/transport/vehicles", icon: "truck" },
  { label: "Thu nhập", href: "/transport/earnings", icon: "dollar-sign" },
  { label: "Đánh giá", href: "/transport/reviews", icon: "star" },
  { label: "Cài đặt", href: "/transport/settings", icon: "settings" },
]

export default async function SubmitQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieHeader = cookies().toString()
  const [booking, items] = await Promise.all([getBooking(id, cookieHeader), getBookingItems(id, cookieHeader)])

  if (!booking) {
    notFound()
  }

  const bookingWithItems: BookingForQuote = {
    ...booking,
    items,
  }

  return (
    <DashboardLayout navItems={navItems} title="Gởi báo giá">
      <div className="container max-w-7xl py-10 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/transport/jobs/${id}`}>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gửi báo giá</h1>
            <p className="text-muted-foreground">Tạo báo giá chi tiết cho booking #{bookingWithItems.id}</p>
          </div>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Thông tin booking</CardTitle>
            <CardDescription>Xem lại chi tiết trước khi gửi báo giá</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Điểm đón
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{bookingWithItems.pickup_address.street}</p>
                  <p>
                    {bookingWithItems.pickup_address.ward}, {bookingWithItems.pickup_address.district}
                  </p>
                  <p>{bookingWithItems.pickup_address.province}</p>
                  <p className="mt-1">
                    Tầng {bookingWithItems.pickup_address.floor ?? "?"}
                    {bookingWithItems.pickup_address.has_elevator ? " (Có thang máy)" : " (Không có thang máy)"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Điểm trả
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{bookingWithItems.delivery_address.street}</p>
                  <p>
                    {bookingWithItems.delivery_address.ward}, {bookingWithItems.delivery_address.district}
                  </p>
                  <p>{bookingWithItems.delivery_address.province}</p>
                  <p className="mt-1">
                    Tầng {bookingWithItems.delivery_address.floor ?? "?"}
                    {bookingWithItems.delivery_address.has_elevator ? " (Có thang máy)" : " (Không có thang máy)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="w-4 h-4" />
                Hàng hóa ({bookingWithItems.items.length} mặt hàng)
              </div>
              <div className="space-y-2">
                {bookingWithItems.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có hàng hóa được khai báo.</p>
                ) : (
                  bookingWithItems.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted rounded-lg">
                      <span>
                        {item.name} x{item.quantity}
                        {item.is_fragile && " (Dễ vỡ)"}
                        {item.requires_disassembly && " (Cần tháo lắp)"}
                      </span>
                      {item.weight ? <span className="text-muted-foreground">{item.weight}kg</span> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <QuotationForm booking={bookingWithItems} />
      </div>
    </DashboardLayout>
  )
}
