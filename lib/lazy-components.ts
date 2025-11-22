/**
 * Lazy Component Loader
 *
 * Centralized lazy loading configuration for code splitting
 */
import { lazy } from "react"

// Dashboard components (heavy, load on demand)
export const LazyCustomerDashboard = lazy(() => import("@/app/customer/page"))
export const LazyAdminDashboard = lazy(() => import("@/app/admin/page"))
export const LazyTransportDashboard = lazy(() => import("@/app/transport/page"))

// Booking components
export const LazyBookingCreate = lazy(() => import("@/app/customer/bookings/create/page"))
export const LazyBookingDetail = lazy(() => import("@/app/customer/bookings/[id]/page"))
export const LazyQuotationComparison = lazy(() => import("@/app/customer/bookings/[id]/quotations/page"))

// Vehicle management
export const LazyVehicleManagement = lazy(() => import("@/app/transport/vehicles/page"))
export const LazyVehiclePricing = lazy(() => import("@/app/transport/vehicles/[id]/pricing/page"))

// Admin components
export const LazyAdminCategories = lazy(() => import("@/app/admin/categories/page"))
export const LazyAdminUsers = lazy(() => import("@/app/admin/users/page"))

// Modals (load on demand)
export const LazyAddVehicleModal = lazy(() => import("@/components/vehicle/add-vehicle-modal"))
export const LazyEditVehicleModal = lazy(() => import("@/components/vehicle/edit-vehicle-modal"))
export const LazyAddCategoryModal = lazy(() => import("@/components/category/add-category-modal"))
