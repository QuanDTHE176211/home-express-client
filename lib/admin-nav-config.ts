import { LayoutDashboard, Users, Package, ShieldCheck, Flag, AlertCircle, Send } from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: any
  description?: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Dashboard và thống kê tổng quan",
  },
  {
    label: "Review Queue",
    href: "/admin/review-queue",
    icon: AlertCircle,
    description: "Xử lý phiên scan cần review",
  },
  {
    label: "Outbox Events",
    href: "/admin/outbox",
    icon: Send,
    description: "Quản lý hàng đợi sự kiện",
  },
  {
    label: "Quản lý Users",
    href: "/admin/users",
    icon: Users,
    description: "Quản lý tất cả người dùng",
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: Package,
    description: "Quản lý danh mục sản phẩm",
  },
  {
    label: "Xác minh Vận chuyển",
    href: "/admin/transports/verification",
    icon: ShieldCheck,
    description: "Phê duyệt công ty vận chuyển",
  },
  {
    label: "Kiểm duyệt",
    href: "/admin/moderation",
    icon: Flag,
    description: "Quản lý báo cáo và đánh giá",
  },
]

export function getAdminPageTitle(pathname: string): string {
  const item = adminNavItems.find((item) => item.href === pathname)
  return item?.label || "Admin Dashboard"
}

export function getAdminBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const breadcrumbs: { label: string; href: string }[] = [{ label: "Admin", href: "/admin" }]

  if (pathname === "/admin") {
    return breadcrumbs
  }

  if (pathname.startsWith("/admin/sessions/")) {
    breadcrumbs.push({ label: "Review Queue", href: "/admin/review-queue" })
    const sessionId = pathname.split("/")[3]
    breadcrumbs.push({ label: `Session #${sessionId}`, href: pathname })
    return breadcrumbs
  }

  if (pathname.startsWith("/admin/bids/")) {
    const sessionId = pathname.split("/")[3]
    breadcrumbs.push({ label: "Review Queue", href: "/admin/review-queue" })
    breadcrumbs.push({ label: `Session #${sessionId}`, href: `/admin/sessions/${sessionId}` })
    breadcrumbs.push({ label: "Bids Monitor", href: pathname })
    return breadcrumbs
  }

  const item = adminNavItems.find((item) => item.href === pathname)
  if (item) {
    breadcrumbs.push({ label: item.label, href: item.href })
  }

  return breadcrumbs
}
