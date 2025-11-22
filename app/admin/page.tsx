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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Total Users Card */}
                    <Link href="/admin/users" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tổng Users</p>
                                        <p className="text-3xl font-bold mt-2">{stats.total_users}</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            {stats.active_users} đang hoạt động
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Customers Card */}
                    <Link href="/admin/users?role=CUSTOMER" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-purple-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Khách hàng</p>
                                        <p className="text-3xl font-bold mt-2">{stats.total_customers}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {((stats.total_customers / stats.total_users) * 100).toFixed(0)}% tổng users
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <UserCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Transports Card */}
                    <Link href="/admin/users?role=TRANSPORT" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-orange-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Vận chuyển</p>
                                        <p className="text-3xl font-bold mt-2">{stats.total_transports}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{stats.verified_users} đã xác minh</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                        <Truck className="w-6 h-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Verified Users Card */}
                    <Link href="/admin/users?verified=true" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-green-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Đã xác thực</p>
                                        <p className="text-3xl font-bold mt-2">{stats.verified_users}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {((stats.verified_users / stats.total_users) * 100).toFixed(0)}% tổng users
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <ShieldCheck className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* New Today Card */}
                    <Link href="/admin/users?period=today" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-teal-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Mới hôm nay</p>
                                        <p className="text-3xl font-bold mt-2">{stats.new_users_today}</p>
                                        {stats.user_growth_rate && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />+{stats.user_growth_rate}%
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

                    {/* Pending Verifications Card */}
                    <Link href="/admin/transports/verification" className="group">
                        <Card className="transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-amber-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Chờ duyệt</p>
                                        <p className="text-3xl font-bold mt-2">{stats.pending_transport_verifications}</p>
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Cần xử lý
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                        <AlertCircle className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Growth Stats - Takes 2 columns */}
                    <Card className="lg:col-span-2 transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Thống kê người dùng</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/users">
                                    Xem tất cả
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Active vs Inactive */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                        <p className="text-sm font-medium text-green-700 mb-1">Người dùng hoạt động</p>
                                        <p className="text-4xl font-bold text-green-900">{stats.active_users}</p>
                                        <p className="text-xs text-green-600 mt-2">
                                            {((stats.active_users / stats.total_users) * 100).toFixed(1)}% tổng users
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Vô hiệu hóa</p>
                                        <p className="text-4xl font-bold text-gray-900">{stats.inactive_users}</p>
                                        <p className="text-xs text-gray-600 mt-2">
                                            {((stats.inactive_users / stats.total_users) * 100).toFixed(1)}% tổng users
                                        </p>
                                    </div>
                                </div>

                                {/* Time-based stats */}
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-3">Người dùng mới</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                            <p className="text-xs text-muted-foreground mb-1">Hôm nay</p>
                                            <p className="text-2xl font-bold">{stats.new_users_today}</p>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                            <p className="text-xs text-muted-foreground mb-1">Tuần này</p>
                                            <p className="text-2xl font-bold">{stats.new_users_this_week}</p>
                                        </div>
                                        <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                            <p className="text-xs text-muted-foreground mb-1">Tháng này</p>
                                            <p className="text-2xl font-bold">{stats.new_users_this_month}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Transports Leaderboard */}
                    <Card className="transition-shadow hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Top Vận chuyển</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/users?role=TRANSPORT&sort=rating">
                                    Xem tất cả
                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.top_transports.map((transport, index) => (
                                    <Link
                                        key={transport.transport_id}
                                        // transport_id is the same as user_id due to shared primary key relationship
                                        href={`/admin/users/${transport.transport_id}`}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                    >
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${index === 0
                                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md"
                                                    : index === 1
                                                        ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md"
                                                        : "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate group-hover:text-accent-green transition-colors">
                                                {transport.company_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    ⭐ {transport.average_rating}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{transport.completed_bookings} chuyến</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {stats.pending_transport_verifications > 0 && (
                    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">
                                            Có {stats.pending_transport_verifications} yêu cầu xác minh đang chờ
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Vui lòng xem xét và phê duyệt để duy trì chất lượng dịch vụ
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="bg-amber-600 hover:bg-amber-700 shadow-md">
                                    <Link href="/admin/transports/verification">
                                        Xem ngay
                                        <ArrowUpRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
