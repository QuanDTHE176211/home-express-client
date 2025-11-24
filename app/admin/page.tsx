/**
 * Admin Dashboard Home Page
 *
 * Displays platform statistics, user growth, and top transports
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCircle, Truck, ShieldCheck, TrendingUp, AlertCircle, ArrowUpRight, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { AdminDashboardStats } from "@/types"
import { adminNavItems } from "@/lib/admin-nav-config"
import { toast } from "sonner"

export default function AdminDashboard() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<AdminDashboardStats | null>(null)
    const [dataLoading, setDataLoading] = useState(true)

    useEffect(() => {
        if (!loading && (!user || user.role !== "MANAGER")) {
            router.push("/login")
        }
    }, [user, loading, router])

    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== "MANAGER") return

            try {
                setDataLoading(true)
                const statsData = await apiClient.getAdminDashboardStats()
                setStats(statsData)
            } catch (error) {
                console.error("Failed to load dashboard stats:", error)
                toast.error("Không thể tải thống kê dashboard")
            } finally {
                setDataLoading(false)
            }
        }

        fetchData()
    }, [user])

    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
            </div>
        )
    }

    if (!user || !stats) return null

    return (
        <DashboardLayout navItems={adminNavItems} title="Admin Dashboard">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Quản trị</h1>
                        <p className="text-muted-foreground mt-1">Tổng quan về nền tảng Home Express</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/users">
                                <Users className="w-4 h-4 mr-2" />
                                Quản lý Users
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/admin/transports/verification">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Xác minh
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Users Card */}
                    <Link href="/admin/users" className="group">
                        <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tổng Users</p>
                                        <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            {stats.activeUsers} đang hoạt động
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Growth Card */}
                    <Link href="/admin/users?period=today" className="group">
                        <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-teal-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tăng trưởng hôm nay</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-bold mt-2">{stats.newUsersToday}</p>
                                            <span className="text-sm text-muted-foreground">users mới</span>
                                        </div>
                                        {stats.userGrowthRate !== undefined && (
                                            <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />+{stats.userGrowthRate}% so với tháng trước
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                                        <TrendingUp className="w-6 h-6 text-teal-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Transports Card */}
                    <Link href="/admin/users?role=TRANSPORT" className="group">
                        <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-orange-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Đối tác Vận chuyển</p>
                                        <p className="text-3xl font-bold mt-2">{stats.totalTransports}</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            {stats.verifiedTransports} đã xác minh
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                        <Truck className="w-6 h-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Pending Verifications Card - Action Item */}
                    <Link href="/admin/transports/verification" className="group">
                        <Card className={`h-full transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 ${
                            stats.pendingTransportVerifications > 0 ? "border-l-amber-500 bg-amber-50/30" : "border-l-gray-300"
                        }`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Cần duyệt gấp</p>
                                        <p className="text-3xl font-bold mt-2">{stats.pendingTransportVerifications}</p>
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                                            stats.pendingTransportVerifications > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"
                                        }`}>
                                            <AlertCircle className="w-3 h-3" />
                                            {stats.pendingTransportVerifications > 0 ? "Yêu cầu chờ xử lý" : "Không có yêu cầu mới"}
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                        stats.pendingTransportVerifications > 0 ? "bg-amber-100 group-hover:bg-amber-200" : "bg-gray-100 group-hover:bg-gray-200"
                                    }`}>
                                        <ShieldCheck className={`w-6 h-6 ${
                                            stats.pendingTransportVerifications > 0 ? "text-amber-600" : "text-gray-500"
                                        }`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Growth Stats - Takes 2 columns */}
                    <Card className="lg:col-span-2 transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">Chi tiết tăng trưởng</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users">
                                    Quản lý Users
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* New Users Breakdown */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <p className="text-xs text-muted-foreground mb-1">Hôm nay</p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-2xl font-bold">{stats.newUsersToday}</p>
                                            <Activity className="w-4 h-4 text-teal-500 mb-1" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <p className="text-xs text-muted-foreground mb-1">Tuần này</p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-2xl font-bold">{stats.newUsersThisWeek}</p>
                                            <Activity className="w-4 h-4 text-blue-500 mb-1" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <p className="text-xs text-muted-foreground mb-1">Tháng này</p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-2xl font-bold">{stats.newUsersThisMonth}</p>
                                            <Activity className="w-4 h-4 text-purple-500 mb-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* System Health / Active Ratio */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Tỷ lệ hoạt động hệ thống</h4>
                                        <span className="text-sm font-bold text-green-600">
                                            {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% Active
                                        </span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div 
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
                                            title="Active Users"
                                        />
                                        <div 
                                            className="h-full bg-gray-300 transition-all duration-500"
                                            style={{ width: `${(stats.inactiveUsers / stats.totalUsers) * 100}%` }}
                                            title="Inactive Users"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                        <span>{stats.activeUsers} người dùng hoạt động</span>
                                        <span>{stats.inactiveUsers} vô hiệu hóa / chưa kích hoạt</span>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-sm text-muted-foreground">Khách hàng</p>
                                        <p className="text-xl font-semibold">{stats.totalCustomers}</p>
                                     </div>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Quản lý</p>
                                        <p className="text-xl font-semibold">{stats.totalManagers}</p>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Transports Leaderboard */}
                    <Card className="transition-shadow hover:shadow-lg flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">Top Vận chuyển</CardTitle>
                            <Link href="/admin/users?role=TRANSPORT&sort=rating" className="text-xs text-muted-foreground hover:text-primary flex items-center">
                                Xem tất cả <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-4">
                                {stats.topTransports.length > 0 ? (
                                    stats.topTransports.map((transport, index) => (
                                        <Link
                                            key={transport.transportId}
                                            href={`/admin/users/${transport.transportId}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                        >
                                            <div
                                                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${index === 0
                                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                        : index === 1
                                                            ? "bg-gray-100 text-gray-700 border border-gray-200"
                                                            : index === 2
                                                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                                                : "bg-slate-100 text-slate-700 border border-slate-200"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                                    {transport.companyName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center text-amber-500">
                                                        ⭐ {transport.averageRating}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{transport.completedBookings} chuyến</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Chưa có dữ liệu xếp hạng
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
