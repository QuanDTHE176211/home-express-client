export interface CustomerNavItem {
  label: string
  href: string
  icon: string
  description?: string
  variant?: "default" | "primary"
}

export const customerNavItems: CustomerNavItem[] = [
  {
    label: "Tổng quan",
    href: "/customer",
    icon: "LayoutDashboard",
    description: "Dashboard và thống kê tổng quan",
  },
  {
    label: "Tạo đơn mới",
    href: "/customer/bookings/create",
    icon: "Plus",
    description: "Tạo chuyến đi mới",
    variant: "primary",
  },
  {
    label: "Đồ của tôi",
    href: "/customer/saved-items",
    icon: "Archive",
    description: "Quản lý đồ đạc đã lưu",
  },
  {
    label: "Chuyến đi",
    href: "/customer/bookings",
    icon: "Package",
    description: "Quản lý các chuyến đi",
  },
  {
    label: "Hợp đồng",
    href: "/customer/contracts",
    icon: "FileText",
    description: "Xem hợp đồng đã ký",
  },
  {
    label: "Yêu thích",
    href: "/customer/favorites",
    icon: "Heart",
    description: "Đơn vị vận chuyển yêu thích",
  },
  {
    label: "Đánh giá",
    href: "/customer/reviews",
    icon: "Star",
    description: "Quản lý đánh giá của bạn",
  },
]

export const navItems = customerNavItems

export function getCustomerPageTitle(pathname: string): string {
  const item = customerNavItems.find((item) => item.href === pathname)
  return item?.label || "Customer Dashboard"
}

export function getCustomerBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const breadcrumbs: { label: string; href: string }[] = [{ label: "Customer", href: "/customer" }]

  if (pathname === "/customer") {
    return breadcrumbs
  }

  const item = customerNavItems.find((item) => item.href === pathname)
  if (item) {
    breadcrumbs.push({ label: item.label, href: item.href })
  }

  return breadcrumbs
}
