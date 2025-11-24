/**
 * Authentication Context Module
 *
 * Provides global authentication state management for the entire application.
 * Handles user login, registration, logout, and automatic session restoration.
 *
 * Features:
 * - Global authentication state
 * - Automatic session restoration on page load
 * - Role-based redirects after authentication
 * - Type-safe user data
 *
 * @module contexts/auth-context
 */

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "@/lib/api-client"
import { useRouter, usePathname } from "next/navigation"

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/unauthorized",
  "/",
]

// Enable verbose auth logging only in local dev by setting NEXT_PUBLIC_LOG_AUTH=true
const AUTH_DEBUG = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_LOG_AUTH === "true"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User data structure matching Spring Boot backend
 */
interface User {
  user_id?: number
  userId?: number
  email: string
  role: "CUSTOMER" | "TRANSPORT" | "MANAGER"
  is_active?: boolean
  isActive?: boolean
  is_verified?: boolean
  isVerified?: boolean
  [key: string]: any
}

/**
 * Registration data for customers
 */
interface CustomerRegisterData {
  email: string
  password: string
  role: "CUSTOMER"
  fullName: string
  phone: string
  address?: string
}

interface TransportRegisterData {
  email: string
  password: string
  role: "TRANSPORT"
  fullName: string
  phone: string
  companyName: string
  businessLicenseNumber: string
  taxCode?: string
  address: string
  city: string
  district?: string
  ward?: string
}

type RegisterData = CustomerRegisterData | TransportRegisterData

/**
 * Authentication context value type
 */
interface AuthContextType {
  /** Current authenticated user (null if not logged in) */
  user: User | null
  /** Loading state during initial auth check */
  loading: boolean
  /** Login function */
  login: (email: string, password: string) => Promise<void>
  /** Registration function */
  register: (data: RegisterData) => Promise<void>
  /** Logout function */
  logout: () => Promise<void>
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

/** Authentication context instance */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide global authentication state.
 * Automatically checks for existing session on mount.
 *
 * @param children - Child components to wrap
 *
 * @example
 * // In app/layout.tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check on public routes to prevent redirect loop
      if (PUBLIC_ROUTES.some((route) => pathname?.startsWith(route))) {
        setLoading(false)
        return
      }

      // If user already exists in state, don't re-check on every route change
      // This prevents overwriting user state during navigation
      if (user) {
        setLoading(false)
        return
      }

      try {
        console.log("🔄 Checking auth state...")
        const userData = await apiClient.request<User>("/auth/me")
        console.log("✅ Auth check success:", userData)
        setUser(userData)
      } catch (error) {
        console.error("❌ Auth check failed:", error)
        setUser(null)
        // Don't redirect here - let the api-client handle it
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [pathname, user])

  /**
   * Authenticates user and redirects based on role
   *
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if credentials are invalid
   */
  const login = async (email: string, password: string) => {
    if (AUTH_DEBUG) console.log("🔐 Login attempt:", email)
    try {
      const response = await apiClient.login(email, password)
      if (AUTH_DEBUG) console.log("Login successful for:", response.user.email)

      // Update user state immediately
      setUser(response.user)

      // Role-based redirect mapping
      const redirectMap = {
        CUSTOMER: "/customer",
        TRANSPORT: "/transport",
        MANAGER: "/admin",
      }
      const redirectPath = redirectMap[response.user.role]
      if (AUTH_DEBUG) console.log("🚀 Redirecting to:", redirectPath)

      // Use router.push instead of window.location to preserve state
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push(redirectPath)
    } catch (error) {
      console.error("❌ Login error:", error)
      throw error
    }
  }

  /**
   * Registers new user and redirects to verification page
   *
   * @param data - Registration data
   * @throws Error if email already exists or validation fails
   */
  const register = async (data: RegisterData) => {
    const response = await apiClient.register(data)

    // Don't set user state yet, as they are not verified/logged in
    // setUser(response.user)

    // Redirect to verification page
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
  }

  /**
   * Logs out current user and redirects to login page
   */
  const logout = async () => {
    await apiClient.logout()
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access authentication context
 *
 * Provides current user, loading state, and auth functions.
 * Must be used within an AuthProvider.
 *
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 *
 * @example
 * function MyComponent() {
 *   const { user, login, logout } = useAuth()
 *   if (!user) return <LoginForm onLogin={login} />
 *   return <div>Welcome {user.email}</div>
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
