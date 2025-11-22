/**
 * Role Utilities
 *
 * Helper functions for role-based access control
 */

export type UserRole = "CUSTOMER" | "TRANSPORT" | "MANAGER"

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Check if user is admin/manager
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "MANAGER"
}

/**
 * Check if user is transport company
 */
export function isTransport(userRole: UserRole): boolean {
  return userRole === "TRANSPORT"
}

/**
 * Check if user is customer
 */
export function isCustomer(userRole: UserRole): boolean {
  return userRole === "CUSTOMER"
}

/**
 * Get default redirect path for role
 */
export function getDefaultRedirect(userRole: UserRole): string {
  const redirectMap: Record<UserRole, string> = {
    CUSTOMER: "/customer",
    TRANSPORT: "/transport",
    MANAGER: "/admin",
  }
  return redirectMap[userRole]
}

/**
 * Get role display name
 */
export function getRoleDisplayName(userRole: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    CUSTOMER: "Khách hàng",
    TRANSPORT: "Nhà vận chuyển",
    MANAGER: "Quản trị viên",
  }
  return displayNames[userRole]
}
