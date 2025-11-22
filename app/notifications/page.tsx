"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { NotificationItem } from "@/components/notifications/notification-item"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"
import { CheckCheck, Trash2, Search, Filter, Bell, Package, FileText, DollarSign, Star, Truck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { notifications, loading, error, markAllAsRead, deleteNotification, fetchNotifications, pagination } =
    useNotifications()

  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const filters: any = {}
    if (activeTab === "unread") filters.isRead = false
    if (typeFilter !== "all") filters.type = typeFilter

    fetchNotifications(currentPage, filters)
  }, [activeTab, typeFilter, currentPage, fetchNotifications])

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setSelectedIds([])
  }

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await deleteNotification(id)
    }
    setSelectedIds([])
    setShowDeleteDialog(false)
    fetchNotifications(currentPage)
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.notification_id))
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      searchQuery === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getNavItems = () => {
    if (user?.role === "MANAGER") {
      return [
        { label: "Tá»•ng quan", href: "/admin", icon: "home" },
        { label: "Quáº£n lÃ½ Users", href: "/admin/users", icon: "users" },
        { label: "ThÃ´ng bÃ¡o", href: "/notifications", icon: "bell", active: true },
        { label: "CÃ i Ä‘áº·t", href: "/admin/settings", icon: "settings" },
      ]
    } else if (user?.role === "TRANSPORT") {
      return [
        { label: "Tá»•ng quan", href: "/transport", icon: "home" },
        { label: "CÃ´ng viá»‡c", href: "/transport/jobs", icon: "briefcase" },
        { label: "ThÃ´ng bÃ¡o", href: "/notifications", icon: "bell", active: true },
        { label: "CÃ i Ä‘áº·t", href: "/transport/settings", icon: "settings" },
      ]
    } else {
      return [
        { label: "Tá»•ng quan", href: "/customer", icon: "home" },
        { label: "ÄÆ¡n hÃ ng", href: "/customer/bookings", icon: "package" },
        { label: "ThÃ´ng bÃ¡o", href: "/notifications", icon: "bell", active: true },
        { label: "CÃ i Ä‘áº·t", href: "/customer/settings", icon: "settings" },
      ]
    }
  }

  const notificationTypes = [
    { value: "all", label: "Táº¥t cáº£", icon: Bell },
    { value: "BOOKING_CREATED", label: "ÄÆ¡n hÃ ng má»›i", icon: Package },
    { value: "QUOTATION_RECEIVED", label: "BÃ¡o giÃ¡", icon: FileText },
    { value: "PAYMENT_RECEIVED", label: "Thanh toÃ¡n", icon: DollarSign },
    { value: "REVIEW_RECEIVED", label: "ÄÃ¡nh giÃ¡", icon: Star },
    { value: "JOB_STARTED", label: "CÃ´ng viá»‡c", icon: Truck },
  ]

  return (
    <DashboardLayout navItems={getNavItems()} title="ThÃ´ng bÃ¡o">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">ThÃ´ng bÃ¡o</h1>
            <p className="text-muted-foreground">Quáº£n lÃ½ táº¥t cáº£ thÃ´ng bÃ¡o cá»§a báº¡n</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  XÃ³a ({selectedIds.length})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              ÄÃ¡nh dáº¥u táº¥t cáº£ Ä‘Ã£ Ä‘á»c
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="TÃ¬m kiáº¿m thÃ´ng bÃ¡o..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Loáº¡i thÃ´ng bÃ¡o" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Táº¥t cáº£
              {notifications.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{notifications.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              ChÆ°a Ä‘á»c
              {notifications.filter((n) => !n.is_read).length > 0 && (
                <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                  {notifications.filter((n) => !n.is_read).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeTab === "all" ? "Táº¥t cáº£ thÃ´ng bÃ¡o" : "ThÃ´ng bÃ¡o chÆ°a Ä‘á»c"}</CardTitle>
                    <CardDescription>{filteredNotifications.length} thÃ´ng bÃ¡o</CardDescription>
                  </div>

                  {filteredNotifications.length > 0 && (
                    <Checkbox
                      checked={selectedIds.length === filteredNotifications.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Chá»n táº¥t cáº£"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading && notifications.length === 0 ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {activeTab === "unread" ? "KhÃ´ng cÃ³ thÃ´ng bÃ¡o chÆ°a Ä‘á»c" : "ChÆ°a cÃ³ thÃ´ng bÃ¡o nÃ o"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "unread"
                        ? "Táº¥t cáº£ thÃ´ng bÃ¡o Ä‘Ã£ Ä‘Æ°á»£c Ä‘á»c"
                        : "ThÃ´ng bÃ¡o sáº½ xuáº¥t hiá»‡n á»Ÿ Ä‘Ã¢y khi cÃ³ hoáº¡t Ä‘á»™ng má»›i"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.notification_id}
                        notification={notification}
                        isSelected={selectedIds.includes(notification.notification_id)}
                        onSelect={handleSelectOne}
                        onDelete={() => {
                          setSelectedIds([notification.notification_id])
                          setShowDeleteDialog(true)
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        TrÆ°á»›c
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>XÃ¡c nháº­n xÃ³a</AlertDialogTitle>
            <AlertDialogDescription>
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a {selectedIds.length} thÃ´ng bÃ¡o Ä‘Ã£ chá»n? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Há»§y</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600">
              XÃ³a
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

