
import { LayoutDashboard, Package, FileText, Truck, DollarSign, Star } from "lucide-react"

export interface TransportNavItem {
  label: string
  href: string
  icon: any
  description?: string
}

export const transportNavItems: TransportNavItem[] = [
  { label: "Tổng quan", href: "/transport", icon: LayoutDashboard },
  { label: "Công việc", href: "/transport/jobs", icon: Package },
  { label: "Báo giá", href: "/transport/quotations", icon: FileText },
  { label: "Xe", href: "/transport/vehicles", icon: Truck },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: DollarSign },
  { label: "Hồ sơ", href: "/transport/profile", icon: Star },
]
