"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Clock, Bell, MapPin, Calendar, ArrowRight, Sparkles, Package } from "lucide-react"
import { useBooking } from "@/hooks/use-bookings"
import { Skeleton } from "@/components/ui/skeleton"
import { navItems } from "@/lib/customer-nav-config"


export default function BookingSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = Number.parseInt(params.id as string)
  const { booking, isLoading } = useBooking(bookingId)
  const [notificationsSent, setNotificationsSent] = useState(0)
  const [isNotifying, setIsNotifying] = useState(true)

  // Simulate transporter notification process
  useEffect(() => {
    let count = 0
    const interval = setInterval(() => {
      count++
      setNotificationsSent(count)
      if (count >= 5) {
        clearInterval(interval)
        setIsNotifying(false)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout navItems={navItems} title="Dang tai booking">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!booking) {
    return (
      <DashboardLayout navItems={navItems} title="Booking khong ton tai">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Alert variant="destructive">
            <AlertDescription>KhÃ´ng tÃ¬m tháº¥y booking</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const bookingItems = (booking.items || []) as Array<any>
  const pickupAddress =
    (booking as any).pickupAddress ||
    booking.pickup_address_line ||
    [booking.pickup_contact_name, booking.pickup_address_line].filter(Boolean).join(", ")
  const deliveryAddress =
    (booking as any).deliveryAddress ||
    booking.delivery_address_line ||
    [booking.delivery_contact_name, booking.delivery_address_line].filter(Boolean).join(", ")
  const preferredDate = (booking as any).preferredDate || booking.preferred_date || ""
  const preferredTimeSlot = (booking as any).preferredTimeSlot || booking.preferred_time_slot || ""

  return (
    <DashboardLayout navItems={navItems} title={`Booking #${bookingId}`}>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Táº¡o booking thÃ nh cÃ´ng!</h1>
          <p className="text-lg text-muted-foreground">
            Booking #{bookingId} Ä‘Ã£ Ä‘Æ°á»£c táº¡o vÃ  gá»­i Ä‘áº¿n cÃ¡c Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn
          </p>
        </div>

        {/* Notification Status */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              ThÃ´ng bÃ¡o Ä‘áº¿n Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn
            </CardTitle>
            <CardDescription>Há»‡ thá»‘ng Ä‘ang tá»± Ä‘á»™ng gá»­i thÃ´ng bÃ¡o Ä‘áº¿n cÃ¡c Ä‘Æ¡n vá»‹ phÃ¹ há»£p</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isNotifying ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Äang gá»­i thÃ´ng bÃ¡o...</span>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    {notificationsSent}/5
                  </Badge>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        i <= notificationsSent ? "bg-success/10" : "bg-muted/50"
                      }`}
                    >
                      {i <= notificationsSent ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className="text-sm">ÄÆ¡n vá»‹ váº­n chuyá»ƒn #{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert className="bg-success/10 border-success">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success-foreground">
                  ÄÃ£ gá»­i thÃ´ng bÃ¡o thÃ nh cÃ´ng Ä‘áº¿n {notificationsSent} Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn phÃ¹ há»£p!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle>ThÃ´ng tin booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Addresses */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Äá»‹a chá»‰ Ä‘Ã³n</p>
                  <p className="text-sm text-muted-foreground">{pickupAddress}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Äá»‹a chá»‰ giao</p>
                  <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Thá»i gian Ä‘Ã³n</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(preferredDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <Badge variant="outline" className="mt-2">
                  {preferredTimeSlot === "MORNING" && "Buá»•i sÃ¡ng (7h-12h)"}
                  {preferredTimeSlot === "AFTERNOON" && "Buá»•i chiá»u (12h-17h)"}
                  {preferredTimeSlot === "EVENING" && "Buá»•i tá»‘i (17h-21h)"}
                  {preferredTimeSlot === "FLEXIBLE" && "Linh hoáº¡t"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="flex gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-2">Do vat ({bookingItems.length} mon)</p>
                <div className="space-y-2">
                  {bookingItems.map((item, index) => {
                    const itemName = item.name ?? item.item_name ?? `Item ${index + 1}`
                    const quantity = item.quantity ?? 0
                    const weight = item.weight ?? item.weight_kg ?? null

                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {itemName} x{quantity}
                        </span>
                        {weight && <span className="font-medium">{weight}kg</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>BÆ°á»›c tiáº¿p theo</CardTitle>
            <CardDescription>Nhá»¯ng gÃ¬ sáº½ xáº£y ra sau Ä‘Ã¢y</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Chá» bÃ¡o giÃ¡</h4>
                <p className="text-sm text-muted-foreground">
                  CÃ¡c Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn sáº½ xem thÃ´ng tin vÃ  gá»­i bÃ¡o giÃ¡ trong vÃ²ng 1-2 giá»
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">So sÃ¡nh vÃ  chá»n</h4>
                <p className="text-sm text-muted-foreground">
                  Báº¡n sáº½ nháº­n Ä‘Æ°á»£c thÃ´ng bÃ¡o khi cÃ³ bÃ¡o giÃ¡ má»›i. So sÃ¡nh giÃ¡ vÃ  dá»‹ch vá»¥ Ä‘á»ƒ chá»n Ä‘Æ¡n vá»‹ phÃ¹ há»£p
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">XÃ¡c nháº­n vÃ  thanh toÃ¡n</h4>
                <p className="text-sm text-muted-foreground">
                  Sau khi cháº¥p nháº­n bÃ¡o giÃ¡, há»£p Ä‘á»“ng sáº½ Ä‘Æ°á»£c táº¡o vÃ  báº¡n cÃ³ thá»ƒ thanh toÃ¡n Ä‘áº·t cá»c
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/customer/bookings")}>
            Xem táº¥t cáº£ booking
          </Button>
          <Button className="flex-1" onClick={() => router.push(`/customer/bookings/${bookingId}`)}>
            Xem chi tiáº¿t booking
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* AI Badge */}
        {bookingItems.some((item) => {
          const images = item.imageUrls ?? item.image_urls ?? []
          return Array.isArray(images) ? images.length > 0 : typeof images === "string" && images.length > 0
        }) && (
          <Alert className="bg-primary/5 border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription>
              Booking nÃ y Ä‘Æ°á»£c táº¡o vá»›i sá»± há»— trá»£ cá»§a AI Image Scanning, giÃºp tiáº¿t kiá»‡m thá»i gian vÃ  tÄƒng Ä‘á»™ chÃ­nh xÃ¡c
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}











