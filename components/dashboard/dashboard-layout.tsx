"use client"

import type React from "react"
import { AdminErrorBoundary } from "@/components/admin/admin-error-boundary"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import {
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  FileText,
  Heart,
  Star,
  Plus,
  Truck,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface NavItem {
  label: string
  href: string
  icon: string
  variant?: "default" | "primary"
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  FileText,
  Heart,
  Star,
  Plus,
  Truck,
  DollarSign,
  TrendingUp,
  Settings,
}

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  title: string
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    const savedCollapsed = localStorage.getItem("sidebar-collapsed")
    return savedCollapsed === "true"
  })
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem("sidebar-collapsed", String(newCollapsed))
  }

  const handleLogout = async () => {
    await logout()
  }

  const getRolePath = (page: string) => {
    if (user?.role === "MANAGER") {
      return `/admin/${page}`
    }
    return `/${user?.role.toLowerCase()}/${page}`
  }

  const isNavItemActive = (itemHref: string) => {
    // Exact match for root paths
    if (itemHref === "/admin" || itemHref === "/customer" || itemHref === "/transport") {
      return pathname === itemHref
    }

    // For other paths, check if it's an exact match or direct child
    if (pathname === itemHref) {
      return true
    }

    // Check if current path is a child of this nav item
    // But make sure it's not matching a sibling path
    if (pathname.startsWith(itemHref + "/")) {
      // Find all nav items that could match
      const matchingItems = navItems.filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

      // Return true only if this is the most specific match
      if (matchingItems.length > 0) {
        const mostSpecific = matchingItems.reduce((prev, current) =>
          current.href.length > prev.href.length ? current : prev,
        )
        return itemHref === mostSpecific.href
      }
    }

    return false
  }

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 md:px-6">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex-1 flex items-center gap-4 md:gap-6">
              <Link href="/" className="font-bold text-xl">
                Home Express
              </Link>
              <span className="text-muted-foreground hidden md:inline">|</span>
              <span className="text-sm font-medium hidden md:inline">{title}</span>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt={user?.email} />
                      <AvatarFallback className="bg-accent-green text-white">
                        {user?.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role === "CUSTOMER" && "Khách hàng"}
                        {user?.role === "TRANSPORT" && "Vận chuyển"}
                        {user?.role === "MANAGER" && "Quản trị viên"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getRolePath("profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getRolePath("settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Cài đặt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-error">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 border-r bg-background transition-[width,transform] duration-300 ease-in-out will-change-[width,transform]",
              "md:sticky md:top-16 md:h-[calc(100vh-4rem)]",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
              collapsed ? "md:w-16" : "md:w-64",
              "w-64",
            )}
          >
            <div className="flex h-full px-3 mt-16 md:mt-0 items-stretch flex-col py-4 gap-2 justify-start overflow-y-auto">
              <div className="hidden md:flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapsed}
                  className="h-8 w-8"
                  title={collapsed ? "Mở rộng" : "Thu gọn"}
                >
                  {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = isNavItemActive(item.href)
                  const isPrimary = item.variant === "primary"

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "bg-accent-green text-white"
                          : isPrimary
                            ? "bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "md:justify-center md:px-2",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                      <span
                        className={cn(
                          "whitespace-nowrap transition-[width,opacity] duration-200",
                          collapsed && "md:w-0 md:opacity-0 md:overflow-hidden",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 md:p-8 text-left shadow-none">{children}</main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AdminErrorBoundary>
  )
}
