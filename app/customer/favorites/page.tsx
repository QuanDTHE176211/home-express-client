"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Heart, Star, MapPin, Truck, Phone, Mail, ExternalLink } from "lucide-react"
import { customerNavItems } from "@/lib/customer-nav-config"
import { useDebounce } from "@/lib/debounce"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: favorites, isLoading, mutate } = useSWR("/customer/favorites", () => apiClient.getFavoriteTransports())

  const filteredFavorites = (favorites || []).filter((fav) => {
    if (!debouncedSearch) return true
    const query = debouncedSearch.toLowerCase()
    return fav.companyName.toLowerCase().includes(query) || fav.city.toLowerCase().includes(query)
  })

  const handleRemoveFavorite = async (transportId: number) => {
    try {
      await apiClient.removeFavoriteTransport(transportId)
      mutate()
    } catch (error) {
      console.error("Failed to remove favorite:", error)
    }
  }

  return (
    <DashboardLayout navItems={customerNavItems} title="Yêu thích">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đơn vị vận chuyển yêu thích</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh sách các đơn vị vận chuyển bạn tin tưởng</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Tìm theo tên công ty hoặc địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="Tìm kiếm đơn vị vận chuyển"
          />
        </div>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Chưa có đơn vị yêu thích</p>
              <p className="text-sm text-muted-foreground mb-4">
                Thêm các đơn vị vận chuyển bạn tin tưởng vào danh sách yêu thích
              </p>
              <Button asChild className="bg-accent-green hover:bg-accent-green-dark">
                <Link href="/customer/bookings">Tìm đơn vị vận chuyển</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.transportId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={favorite.logoUrl || "/placeholder.svg"} alt={favorite.companyName} />
                        <AvatarFallback className="bg-accent-green text-white">
                          {favorite.companyName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{favorite.companyName}</CardTitle>
                        {favorite.isVerified && (
                          <Badge variant="secondary" className="mt-1">
                            Đã xác minh
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(favorite.transportId)}
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{favorite.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({favorite.totalReviews} đánh giá)</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y">
                    <div>
                      <p className="text-sm text-muted-foreground">Hoàn thành</p>
                      <p className="text-lg font-semibold">{favorite.completedBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tỷ lệ</p>
                      <p className="text-lg font-semibold text-accent-green">{favorite.completionRate}%</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{favorite.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{favorite.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{favorite.email}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1 bg-accent-green hover:bg-accent-green-dark">
                      <Link href={`/customer/bookings/create?transport=${favorite.transportId}`}>
                        <Truck className="mr-2 h-4 w-4" />
                        Đặt chuyến
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/transport/${favorite.transportId}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
