/**
 * API Client Module
 *
 * Provides a centralized HTTP client for all API communications with automatic
 * token refresh, error handling, and type-safe request/response handling.
 *
 * Features:
 * - Automatic JWT token refresh on 401 errors
 * - HTTP-only cookie-based authentication (access + refresh tokens)
 * - Type-safe API methods
 * - Centralized error handling
 *
 * @module lib/api-client
 */

import { API_BASE_URL, buildApiUrl } from "@/lib/api-url"
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  BookingListItem,
  BookingDetailResponse,
  BookingDetail,
  QuotationDetail,
  QuotationSummary,
  AvailableBooking,
  SubmitQuotationRequest,
  AdminDashboardStats,
  PerformanceMetrics,
  PerformanceTrend,
  CategoryPerformance,
  VehicleUtilization,
  CustomerStats,
  Notification as NotificationType,
  ProvinceOption,
  DistrictOption,
  WardOption,
  CounterOffer,
  CreateCounterOfferRequest,
  RespondToCounterOfferRequest,
  User as DomainUser,
  Customer as DomainCustomer,
  Transport as DomainTransport,
  Manager as DomainManager,
} from "@/types"

// ============================================================================
// CONFIGURATION
// ============================================================================

type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

type NotificationDto = {
  notificationId: number
  type: string
  title: string
  message: string
  referenceType?: string | null
  referenceId?: number | null
  actionUrl?: string | null
  isRead: boolean
  readAt?: string | null
  priority?: string | null
  createdAt: string
}

type NotificationSummaryPayload = {
  total_unread: number
  by_type: Record<string, number>
  latest_notifications: NotificationType[]
}

type NotificationPagination = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

/** Endpoints that should NEVER trigger a refresh attempt when they 401 */
const NO_REFRESH_ENDPOINTS = new Set<string>([
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/logout",
])

/** Retry configuration for failed requests */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================


interface Customer {
  customer_id: number
  full_name: string
  phone: string
  address: string | null
  date_of_birth: string | null
  avatar_url: string | null
  preferred_language: string
  created_at: string
  updated_at: string
}



/**
 * Manager profile data
 */
interface Manager {
  manager_id: number
  full_name: string
  phone: string
  employee_id: string | null
  department: string | null
  permissions: string[] | null
  created_at: string
  updated_at: string
}

interface CustomerSettingsDto {
  customer_id: number
  language: string
  email_notifications: boolean
  booking_updates: boolean
  quotation_alerts: boolean
  promotions: boolean
  newsletter: boolean
  profile_visibility: "public" | "private"
  show_phone: boolean
  show_email: boolean
}

interface CustomerSettings {
  language: string
  emailNotifications: boolean
  bookingUpdates: boolean
  quotationAlerts: boolean
  promotions: boolean
  newsletter: boolean
  profileVisibility: "public" | "private"
  showPhone: boolean
  showEmail: boolean
}

interface AdminSettings {
  managerId: number
  fullName: string
  phone: string
  emailNotifications: boolean
  systemAlerts: boolean
  userRegistrations: boolean
  transportVerifications: boolean
  bookingAlerts: boolean
  reviewModeration: boolean
  twoFactorEnabled: boolean
  sessionTimeoutMinutes: number
  loginNotifications: boolean
  theme: "light" | "dark" | "system"
  dateFormat: string
  timezone: string
  maintenanceMode: boolean
  autoBackup: boolean
  backupFrequency: "hourly" | "daily" | "weekly" | "monthly"
  emailProvider: "smtp" | "sendgrid" | "mailgun"
  smtpHost: string | null
  smtpPort: string | null
  smtpUsername: string | null
}

interface TransportSettingsDto {
  autoAcceptJobs?: boolean | null
  searchRadiusKm?: number | string | null
  minJobValueVnd?: number | string | null
  responseTimeHours?: number | string | null
  emailNotifications?: boolean | null
  newJobAlerts?: boolean | null
  quotationUpdates?: boolean | null
  paymentNotifications?: boolean | null
  reviewNotifications?: boolean | null
}

interface TransportSettings {
  autoAcceptJobs: boolean
  searchRadiusKm: number
  minJobValueVnd: number
  responseTimeHours: number
  emailNotifications: boolean
  newJobAlerts: boolean
  quotationUpdates: boolean
  paymentNotifications: boolean
  reviewNotifications: boolean
}

type UpdateTransportSettingsPayload = Partial<Omit<TransportSettings, "searchRadiusKm" | "minJobValueVnd" | "responseTimeHours">> & {
  searchRadiusKm?: number
  minJobValueVnd?: number
  responseTimeHours?: number
}

type UpdateCustomerSettingsPayload = Partial<CustomerSettings>

type UpdateProfilePayload = Partial<{
  email: string
  fullName: string
  full_name: string
  phone: string
  avatar: string
  address: string
  city: string
  district: string
  ward: string
  dateOfBirth: string
  date_of_birth: string
  preferredLanguage: string
  preferred_language: string
  companyName: string
  company_name: string
  taxCode: string
  tax_code: string
  bankName: string
  bank_name: string
  bankCode: string
  bank_code: string
  bankAccountNumber: string
  bank_account_number: string
  bankAccountHolder: string
  bank_account_holder: string
}>

interface AdminDashboardStatsDto {
  totalUsers: number
  totalCustomers: number
  totalTransports: number
  totalManagers: number
  activeUsers: number
  inactiveUsers: number
  verifiedUsers: number
  verifiedTransports: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  userGrowthRate: string
  pendingTransportVerifications: number
  topTransports: Array<{
    transportId: number | null
    companyName: string | null
    averageRating: number | null
    completedBookings: number | null
  }>
}

/**
 * Standard API error response structure
 */
interface ApiError {
  error: string
  message?: string
}
type BookingStatus = "PENDING" | "QUOTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "REVIEWED" | "CANCELLED"

interface QuotationResponseDto {
  quotationId: number
  bookingId: number
  transportId: number
  quotedPrice: number
  basePrice?: number | null
  distancePrice?: number | null
  itemsPrice?: number | null
  additionalFees?: number | null
  discount?: number | null
  priceBreakdown?: unknown
  notes?: string | null
  validityPeriod?: number | null
  expiresAt?: string | null
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"
  respondedAt?: string | null
  acceptedBy?: number | null
  acceptedAt?: string | null
  createdAt: string
}

type QuotationStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED"

interface Category {
  categoryId: number
  name: string
}

type ContractStatus = "DRAFT" | "AWAITING_SIGNATURE" | "SIGNED"

// Define RegisterData type for the register function
type RegisterRole = "CUSTOMER" | "TRANSPORT"

interface BaseRegisterData {
  email: string
  password: string
  phone: string
  fullName: string
  role: RegisterRole
}

interface CustomerRegisterData extends BaseRegisterData {
  role: "CUSTOMER"
  address?: string
}

interface TransportRegisterData extends BaseRegisterData {
  role: "TRANSPORT"
  companyName: string
  businessLicenseNumber: string
  taxCode?: string
  address: string
  city: string
  district?: string
  ward?: string
}

type RegisterData = CustomerRegisterData | TransportRegisterData

// ============================================================================
// API CLIENT CLASS
// ============================================================================

/**
 * Main API client class handling all HTTP communications
 * Implements automatic token refresh and error handling
 */
class ApiClient {
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
  }> = []

  // Helper methods for common HTTP operations
  private async get<T>(endpoint: string, params?: Record<string, string | number | boolean>) {
    const queryParams = params ? new URLSearchParams(params as any).toString() : ""
    return this.request<T>(`${endpoint}${queryParams ? `?${queryParams}` : ""}`)
  }

  private async post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  private async put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  private async delete<T>(endpoint: string, body?: any) {
    const options: RequestInit = { method: "DELETE" }
    if (body) {
      options.body = JSON.stringify(body)
      options.headers = { "Content-Type": "application/json" }
    }
    return this.request<T>(endpoint, options)
  }

  // --------------------------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------------------------

  /**
   * Retry helper with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = RETRY_CONFIG.maxRetries,
    delay = RETRY_CONFIG.retryDelay,
  ): Promise<T> {
    try {
      return await fn()
    } catch (error: any) {
      if (retries === 0) throw error

      // Check if error is retryable
      const isRetryable = error.status && RETRY_CONFIG.retryableStatuses.includes(error.status)

      if (!isRetryable) throw error

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry with increased delay
      return this.retryWithBackoff(fn, retries - 1, delay * 2)
    }
  }

  /**
   * Generic HTTP request method with automatic token refresh
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.retryWithBackoff(async () => {
      const url = buildApiUrl(endpoint)

      const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData

      // Get access token from localStorage (fallback if cookies don't work cross-origin)
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // [DEBUG] Log for notifications endpoint to debug 403 error
      if (endpoint.includes("/notifications") || endpoint.includes("notifications")) {
        console.groupCollapsed(`🔍 [API Debug] Requesting: ${endpoint}`)
        console.log("Token in localStorage:", accessToken ? `Present (${accessToken.substring(0, 15)}...)` : "MISSING ❌")
        console.log("Headers:", {
          ...options.headers,
          Authorization: accessToken ? "Bearer [HIDDEN]" : "None"
        })
        console.groupEnd()
      }

      const config: RequestInit = {
        ...options,
        credentials: "include", // Send cookies with every request
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          // Add Authorization header if token exists (for cross-origin requests)
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers,
        },
      }

      try {
        const response = await fetch(url, config)

        // Handle 401 Unauthorized - attempt token refresh (skip for auth endpoints)
        if (response.status === 401 && endpoint !== "/auth/refresh" && !NO_REFRESH_ENDPOINTS.has(endpoint)) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => this.request<T>(endpoint, options))
          }

          this.isRefreshing = true

          try {
            // Try to get refresh token from localStorage if cookies don't work
            const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
            const refreshBody = refreshToken ? JSON.stringify({ refreshToken }) : undefined

            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: refreshBody,
              credentials: "include", // Send refresh token cookie
            })

            if (!refreshResponse.ok) {
              throw new Error("Refresh failed")
            }

            // Parse and save new tokens
            const refreshData = await refreshResponse.json()
            if (typeof window !== "undefined" && refreshData) {
              const token = refreshData.accessToken || refreshData.token
              const newRefreshToken = refreshData.refreshToken

              if (token) {
                localStorage.setItem("access_token", token)
              }
              if (newRefreshToken) {
                localStorage.setItem("refresh_token", newRefreshToken)
              }
            }

            this.failedQueue.forEach(({ resolve }) => resolve())
            this.failedQueue = []

            return this.request<T>(endpoint, options)
          } catch (refreshError) {
            this.failedQueue.forEach(({ reject }) => reject(refreshError))
            this.failedQueue = []

            // Clear tokens if refresh failed
            if (typeof window !== "undefined") {
              localStorage.removeItem("access_token")
              localStorage.removeItem("refresh_token")

              // Only redirect if not already on login page (prevent infinite loop)
              if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login"
              }
            }

            throw new Error("Session expired. Please login again.")
          } finally {
            this.isRefreshing = false
          }
        }

        // Robustly handle responses that may not be valid JSON (e.g., empty 401/204 bodies)
        const rawText = await response.text()
        let data: any
        try {
          data = rawText ? JSON.parse(rawText) : {}
        } catch {
          data = rawText ? { message: rawText } : {}
        }

        if (!response.ok) {
          // Try to extract meaningful error message from various common formats
          // Spring Boot 3 Problem Details uses "title" and "detail"
          // Standard JSON error uses "error" or "message"
          const errorMsg = 
            data.error || 
            data.message || 
            data.detail || 
            data.title || 
            (response.status === 401 ? "Unauthorized" : 
             response.status === 403 ? "Forbidden" : 
             response.statusText) || 
            `Request failed with status ${response.status}`

          const error: any = new Error(errorMsg)
          error.status = response.status
          error.data = data // Attach data for debugging
          throw error
        }

        return data as T
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.name === "TypeError" &&
            typeof window !== "undefined" &&
            typeof navigator !== "undefined" &&
            navigator.onLine === false
          ) {
            throw new Error("No internet connection. Please check your connection and try again.")
          }
          throw error
        }
        throw new Error("Network error occurred")
      }
    })
  }

  private unwrapData<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data as T
    }
    return payload as T
  }

  private toNumber(value: number | string | null | undefined, fallback: number): number {
    if (value === null || value === undefined) {
      return fallback
    }
    const parsed = typeof value === "string" ? Number(value) : value
    return Number.isFinite(parsed) ? parsed : fallback
  }

  private toBoolean(value: boolean | null | undefined, fallback: boolean): boolean {
    if (value === null || value === undefined) {
      return fallback
    }
    return Boolean(value)
  }

  private mapNotification(dto: NotificationDto): NotificationType {
    const referenceType = dto.referenceType ?? null
    const referenceId = dto.referenceId ?? null

    return {
      notification_id: dto.notificationId ?? 0,
      user_id: 0,
      type: (dto.type as NotificationType["type"]) ?? "SYSTEM_ANNOUNCEMENT",
      title: dto.title ?? "",
      message: dto.message ?? "",
      booking_id: referenceType === "BOOKING" ? referenceId ?? null : null,
      quotation_id: referenceType === "QUOTATION" ? referenceId ?? null : null,
      review_id: referenceType === "REVIEW" ? referenceId ?? null : null,
      data: {
        referenceType,
        referenceId,
        priority: dto.priority ?? null,
      },
      is_read: Boolean(dto.isRead),
      read_at: dto.readAt ?? null,
      action_url: dto.actionUrl ?? null,
      created_at:
        typeof dto.createdAt === "string" ? dto.createdAt : new Date(dto.createdAt ?? Date.now()).toISOString(),
      expires_at: null,
    }
  }

  private mapCustomerSettings(dto?: CustomerSettingsDto | null): CustomerSettings {
    return {
      language: dto?.language ?? "vi",
      emailNotifications: this.toBoolean(dto?.email_notifications, true),
      bookingUpdates: this.toBoolean(dto?.booking_updates, true),
      quotationAlerts: this.toBoolean(dto?.quotation_alerts, true),
      promotions: this.toBoolean(dto?.promotions, false),
      newsletter: this.toBoolean(dto?.newsletter, false),
      profileVisibility: (dto?.profile_visibility as "public" | "private") ?? "public",
      showPhone: this.toBoolean(dto?.show_phone, true),
      showEmail: this.toBoolean(dto?.show_email, false),
    }
  }

  private mapTransportSettings(dto?: TransportSettingsDto | null): TransportSettings {
    return {
      autoAcceptJobs: this.toBoolean(dto?.autoAcceptJobs, false),
      searchRadiusKm: this.toNumber(dto?.searchRadiusKm, 10),
      minJobValueVnd: this.toNumber(dto?.minJobValueVnd, 0),
      responseTimeHours: this.toNumber(dto?.responseTimeHours, 2),
      emailNotifications: this.toBoolean(dto?.emailNotifications, true),
      newJobAlerts: this.toBoolean(dto?.newJobAlerts, true),
      quotationUpdates: this.toBoolean(dto?.quotationUpdates, true),
      paymentNotifications: this.toBoolean(dto?.paymentNotifications, true),
      reviewNotifications: this.toBoolean(dto?.reviewNotifications, true),
    }
  }

  private mapAdminSettings(dto: Partial<AdminSettings> | null | undefined): AdminSettings {
    return {
      managerId: dto?.managerId ?? 0,
      fullName: dto?.fullName ?? "",
      phone: dto?.phone ?? "",
      emailNotifications: this.toBoolean(dto?.emailNotifications, true),
      systemAlerts: this.toBoolean(dto?.systemAlerts, true),
      userRegistrations: this.toBoolean(dto?.userRegistrations, true),
      transportVerifications: this.toBoolean(dto?.transportVerifications, true),
      bookingAlerts: this.toBoolean(dto?.bookingAlerts, true),
      reviewModeration: this.toBoolean(dto?.reviewModeration, true),
      twoFactorEnabled: this.toBoolean(dto?.twoFactorEnabled, false),
      sessionTimeoutMinutes: this.toNumber(dto?.sessionTimeoutMinutes ?? null, 30),
      loginNotifications: this.toBoolean(dto?.loginNotifications, false),
      theme: dto?.theme ?? "system",
      dateFormat: dto?.dateFormat ?? "DD/MM/YYYY",
      timezone: dto?.timezone ?? "Asia/Ho_Chi_Minh",
      maintenanceMode: this.toBoolean(dto?.maintenanceMode, false),
      autoBackup: this.toBoolean(dto?.autoBackup, true),
      backupFrequency: (dto?.backupFrequency as AdminSettings["backupFrequency"]) ?? "daily",
      emailProvider: (dto?.emailProvider as AdminSettings["emailProvider"]) ?? "smtp",
      smtpHost: dto?.smtpHost ?? null,
      smtpPort: dto?.smtpPort ?? null,
      smtpUsername: dto?.smtpUsername ?? null,
    }
  }

  private safeParseJson(value: unknown): any {
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === "object") {
      return value
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  }

  private mapQuotationDetail(dto: QuotationResponseDto): QuotationDetail {
    return {
      quotation_id: dto.quotationId,
      booking_id: dto.bookingId,
      transport_id: dto.transportId,
      base_price: this.toNumber(dto.basePrice ?? null, 0),
      distance_price: this.toNumber(dto.distancePrice ?? null, 0),
      item_handling_price: this.toNumber(dto.itemsPrice ?? null, 0),
      additional_services_price: this.toNumber(dto.additionalFees ?? null, 0),
      total_price: this.toNumber(dto.quotedPrice, 0),
      includes_packaging: false,
      includes_disassembly: false,
      includes_insurance: false,
      insurance_value: null,
      transporter_name: dto.transportId ? `Transport #${dto.transportId}` : "Unknown transport",
      transporter_avatar: null,
      transporter_rating: 0,
      transporter_completed_jobs: 0,
      estimated_duration_hours: null,
      estimated_start_time: null,
      status: dto.status,
      is_selected: dto.status === "ACCEPTED",
      expires_at: dto.expiresAt ?? null,
      notes: dto.notes ?? null,
      metadata: this.safeParseJson(dto.priceBreakdown),
      created_at: dto.createdAt,
      updated_at: dto.respondedAt ?? dto.createdAt,
      accepted_at: dto.acceptedAt ?? null,
      rejected_at: dto.status === "REJECTED" ? dto.respondedAt ?? null : null,
    }
  }

  private buildQuotationSummary(quotations: QuotationDetail[]): QuotationSummary {
    if (!quotations.length) {
      return {
        totalQuotations: 0,
        lowestPrice: 0,
        highestPrice: 0,
        averagePrice: 0,
      }
    }

    const prices = quotations.map((item) => item.total_price ?? 0)
    const total = prices.reduce((acc, price) => acc + price, 0)

    return {
      totalQuotations: quotations.length,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      averagePrice: Math.round(total / prices.length),
    }
  }

  private buildProfileRequestPayload(data: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc
      const normalizedKey = key.includes("_") ? key : key.replace(/([A-Z])/g, "_$1").toLowerCase()
      acc[normalizedKey] = value
      return acc
    }, {})
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Authenticates user with email and password
   */
  async login(email: string, password: string) {
    const response = await this.request<{
      token?: string
      accessToken?: string
      refreshToken?: string
      user: DomainUser
      message?: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    // Backend sets cookies, but also returns tokens in response body for cross-origin support
    // Store tokens in localStorage as fallback for cross-origin requests
    if (typeof window !== "undefined") {
      // [DEBUG] Log login response structure
      console.groupCollapsed("🔐 [API Debug] Login Response Processing")
      console.log("Raw response keys:", Object.keys(response))
      
      const token = response.accessToken || response.token
      const refreshToken = response.refreshToken
      
      console.log("Extracted Token:", token ? "Found ✅" : "Not Found ❌")
      console.log("Extracted Refresh Token:", refreshToken ? "Found ✅" : "Not Found ❌")

      if (token) {
        localStorage.setItem("access_token", token)
        console.log("Saved access_token to localStorage")
      } else {
        console.warn("⚠️ No access token found in login response to save!")
      }
      
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken)
      }
      console.groupEnd()
    }

    return response
  }

  /**
   * Registers a new user
   */
  async register(data: RegisterData) {
    const response = await this.request<{
      token?: string
      accessToken?: string
      refreshToken?: string
      user: DomainUser
      message?: string
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })

    // NOTE: Tokens are no longer returned here. Verification is required.
    return response
  }

  /**
   * Verifies user registration OTP and logs them in
   */
  async verifyRegistration(email: string, code: string) {
    const response = await this.request<{
      token?: string
      accessToken?: string
      refreshToken?: string
      user: DomainUser
      message?: string
    }>("/auth/verify-registration", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })

    // Store tokens in localStorage for cross-origin support
    if (typeof window !== "undefined") {
      const token = response.accessToken || response.token
      const refreshToken = response.refreshToken

      if (token) {
        localStorage.setItem("access_token", token)
      }
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken)
      }
    }

    return response
  }

  /**
   * Resends verification OTP
   */
  async resendVerificationOtp(email: string) {
    return this.request<{ message: string }>("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  /**
   * Logs out the current user
   */
  async logout() {
    try {
      await this.request<{ message: string }>("/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      // Ignore errors during logout - we still want to clear tokens
      // The user is logging out anyway, so failures are not critical
      console.warn("Logout request failed, but tokens will be cleared:", error)
    } finally {
      // Always clear tokens from localStorage, even if logout request failed
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      }
    }
  }

  /**
   * Initiates password reset process
   */
  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  /**
   * Verifies OTP code
   */
  async verifyOtp(email: string, code: string) {
    return this.request<{ message: string; verified: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })
  }

  /**
   * Resets user password using OTP code
   */
  async resetPassword(email: string, otpCode: string, newPassword: string) {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otpCode, newPassword }),
    })
  }

  /**
   * Verifies user email using verification token
   */
  async verifyEmail(token: string) {
    return this.request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  }

  // --------------------------------------------------------------------------
  // USER PROFILE ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Fetches current authenticated user's profile
   */
  async getProfile() {
    return this.request<{
      user: DomainUser
      customer?: DomainCustomer
      transport?: DomainTransport
      manager?: DomainManager
    }>("/users/profile")
  }

  /**
   * Updates user profile
   */
  async updateProfile(data: UpdateProfilePayload) {
    const payload = this.buildProfileRequestPayload(data as Record<string, unknown>)
    return this.request<{
      user: DomainUser
      profile: DomainCustomer | DomainTransport | DomainManager
    }>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  /**
   * Uploads a new avatar for the authenticated user
   */
  async uploadAvatar(data: FormData) {
    return this.request<{ avatar_url: string }>("/users/profile/avatar", {
      method: "POST",
      body: data,
    })
  }

  /**
   * Changes user password
   */
  async changePassword(current_password: string, new_password: string) {
    return this.request<{ message: string }>("/users/change-password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    })
  }

  // --------------------------------------------------------------------------
  // CUSTOMER SETTINGS ENDPOINTS
  // --------------------------------------------------------------------------

  async getCustomerSettings(): Promise<CustomerSettings> {
    const response = await this.request<CustomerSettingsDto | { success: boolean; data: CustomerSettingsDto }>(
      "/customer/settings",
    )
    const dto = this.unwrapData<CustomerSettingsDto>(response)
    return this.mapCustomerSettings(dto)
  }

  async updateCustomerSettings(data: UpdateCustomerSettingsPayload): Promise<CustomerSettings> {
    const body = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc
      acc[key] = value
      return acc
    }, {})

    const response = await this.request<CustomerSettingsDto | { success: boolean; data: CustomerSettingsDto }>(
      "/customer/settings",
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    )
    const dto = this.unwrapData<CustomerSettingsDto>(response)
    return this.mapCustomerSettings(dto)
  }

  // --------------------------------------------------------------------------
  // ADMIN ENDPOINTS (MANAGER role only)
  // --------------------------------------------------------------------------

  /**
   * Fetches admin dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const dto = await this.request<AdminDashboardStatsDto>("/admin/dashboard/stats")
    return {
      totalUsers: dto.totalUsers ?? 0,
      totalCustomers: dto.totalCustomers ?? 0,
      totalTransports: dto.totalTransports ?? 0,
      totalManagers: dto.totalManagers ?? 0,
      activeUsers: dto.activeUsers ?? 0,
      inactiveUsers: dto.inactiveUsers ?? 0,
      verifiedUsers: dto.verifiedUsers ?? 0,
      verifiedTransports: dto.verifiedTransports ?? 0,
      newUsersToday: dto.newUsersToday ?? 0,
      newUsersThisWeek: dto.newUsersThisWeek ?? 0,
      newUsersThisMonth: dto.newUsersThisMonth ?? 0,
      userGrowthRate: parseFloat(dto.userGrowthRate ?? "0"),
      pendingTransportVerifications: dto.pendingTransportVerifications ?? 0,
      topTransports:
        dto.topTransports?.map((item) => ({
          transportId: item.transportId ?? 0,
          companyName: item.companyName ?? "",
          averageRating: item.averageRating ?? 0,
          completedBookings: item.completedBookings ?? 0,
        })) ?? [],
    }
  }

  async getAdminSettings(): Promise<AdminSettings> {
    const response = await this.request<Partial<AdminSettings> | { success: boolean; data: Partial<AdminSettings> }>(
      "/admin/settings",
    )
    const dto = this.unwrapData<Partial<AdminSettings>>(response)
    return this.mapAdminSettings(dto)
  }

  async updateAdminSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
    const body = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc
      acc[key] = value
      return acc
    }, {})

    const response = await this.request<Partial<AdminSettings> | { success: boolean; data: Partial<AdminSettings> }>(
      "/admin/settings",
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    )
    const dto = this.unwrapData<Partial<AdminSettings>>(response)
    return this.mapAdminSettings(dto)
  }

  /**
   * Fetches paginated list of users with filters
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.role) queryParams.append("role", params.role)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.search) queryParams.append("search", params.search)

    const response = await this.request<{
      users: Array<{
        user: any
        profile: any
      }>
      pagination: {
        current_page: number
        total_pages: number
        total_items: number
        items_per_page: number
      }
    }>(`/admin/users?${queryParams.toString()}`)

    return {
      users: response.users.map((item) => ({
        user: {
          userId: item.user.user_id,
          email: item.user.email,
          role: item.user.role,
          isActive: item.user.is_active,
          isVerified: item.user.is_verified,
          avatarUrl: item.user.avatar_url,
          phone: item.user.phone,
          createdAt: item.user.created_at,
        } as DomainUser,
        profile: this.mapUserProfile(item.profile, item.user.role),
      })),
      pagination: response.pagination,
    }
  }

  /**
   * Get user details by ID (Admin only)
   */
  async getUserById(userId: number) {
    const response = await this.request<any>(`/admin/users/${userId}`)

    // Handle both wrapped (success/data) and unwrapped (direct map) responses
    const data = response.data || response
    const userObj = data.user
    const profileObj = data.profile

    return {
      success: true,
      data: {
        user: {
          userId: userObj.user_id,
          email: userObj.email,
          role: userObj.role,
          isActive: userObj.is_active,
          isVerified: userObj.is_verified,
          avatarUrl: userObj.avatar_url,
          phone: userObj.phone,
          createdAt: userObj.created_at,
        } as DomainUser,
        profile: this.mapUserProfile(profileObj, userObj.role),
      },
    }
  }

  async getAdminTransportVehicles(
    transportId: number,
    params?: {
      status?: string
      page?: number
      size?: number
    },
  ) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.size) queryParams.append("size", params.size.toString())

    const queryString = queryParams.toString()
    const response = await this.request<any>(
      `/admin/transports/${transportId}/vehicles${queryString ? `?${queryString}` : ""}`,
    )
    const data = response?.data || response

    return {
      vehicles: data?.vehicles ?? [],
      pagination: data?.pagination,
    }
  }

  private mapUserProfile(profile: any, role: string): DomainCustomer | DomainTransport | DomainManager {
    if (!profile) return {} as any

    if (role === "CUSTOMER") {
      return {
        customerId: profile.customer_id,
        fullName: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: profile.date_of_birth,
        avatarUrl: profile.avatar_url,
        preferredLanguage: profile.preferred_language,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } as DomainCustomer
    } else if (role === "TRANSPORT") {
      return {
        transportId: profile.transport_id,
        companyName: profile.company_name,
        businessLicenseNumber: profile.business_license_number,
        taxCode: profile.tax_code,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        district: profile.district,
        verificationStatus: profile.verification_status,
        verifiedAt: profile.verified_at,
        totalBookings: profile.total_bookings,
        completedBookings: profile.completed_bookings,
        averageRating: profile.average_rating,
        createdAt: profile.created_at,
      } as DomainTransport
    } else if (role === "MANAGER") {
      return {
        managerId: profile.manager_id,
        fullName: profile.full_name,
        phone: profile.phone,
        employeeId: profile.employee_id,
        department: profile.department,
        permissions: profile.permissions,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } as DomainManager
    }
    return {} as any
  }

  /**
   * Check if user has active bookings before deactivation
   */
  async checkUserActiveBookings(userId: number) {
    return this.request<{
      success: boolean
      data: {
        hasActiveBookings: boolean
        activeBookingsCount: number
        bookings: Array<{
          booking_id: number
          status: string
          pickup_address: string
          delivery_address: string
        }>
      }
    }>(`/admin/users/${userId}/active-bookings`)
  }

  /**
   * Activates a user account
   */
  async activateUser(userId: number) {
    return this.request<{ message: string }>(`/admin/users/${userId}/activate`, {
      method: "PUT",
    })
  }

  /**
   * Deactivates a user account
   */
  async deactivateUser(userId: number, reason: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/deactivate`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    })
  }

  /**
   * Verifies or rejects a transport company
   */
  async verifyTransport(transportId: number, status: "APPROVED" | "REJECTED", notes?: string) {
    return this.request<{ message: string }>(`/admin/transports/${transportId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({
        isVerified: status === "APPROVED",
        verificationNotes: notes,
      }),
    })
  }

  // Admin Moderation APIs
  async getReportedReviews(status?: string) {
    const params = status ? `?status=${status}` : ""
    return this.get(`/admin/moderation/reviews${params}`)
  }

  async moderateReview(reviewId: number, action: { action: string; reason?: string; notifyUser?: boolean }) {
    return this.post(`/admin/moderation/reviews/${reviewId}`, action)
  }

  async updateReportStatus(reportId: number, status: string, adminNotes?: string) {
    return this.put(`/admin/moderation/reports/${reportId}`, { status, admin_notes: adminNotes })
  }

  /**
   * Fetch transports by verification status
   */
  async getTransportsByStatus(
    status?: "PENDING" | "APPROVED" | "REJECTED",
    params?: {
      page?: number
      limit?: number
      search?: string
    },
  ) {
    const queryParams = new URLSearchParams()
    if (status) queryParams.append("status", status)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)

    return this.request<{
      data: { transport: DomainTransport; user: Omit<DomainUser, 'role'> }[]
      total?: number
      page?: number
      limit?: number
      totalPages?: number
      pagination?: {
        totalItems?: number
        totalPages?: number
        itemsPerPage?: number
        currentPage?: number
      }
    }>(`/admin/transports/verification?${queryParams}`)
  }

  // --------------------------------------------------------------------------
  // CUSTOMER BOOKING ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Create new booking
   */
  async createBooking(data: CreateBookingRequest) {
    return this.request<CreateBookingResponse>("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get customer's bookings list
   */
  async getBookings(params?: {
    page?: number
    limit?: number
    status?: BookingStatus
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    return this.request<{
      data: BookingListItem[]
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/bookings?${queryParams.toString()}`)
  }

  /**
   * Get booking details
   */
  async getBookingDetail(bookingId: number) {
    return this.request<BookingDetailResponse>(`/bookings/${bookingId}`)
  }

  /**
   * Update booking (only if status = PENDING)
   */
  async updateBooking(bookingId: number, data: { notes?: string; specialRequirements?: string }) {
    return this.request<{ message: string; booking: BookingDetail }>(`/bookings/${bookingId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: number, cancellationReason: string) {
    return this.request<{
      message: string
      refundAmount: number | null
      cancellationFee: number | null
    }>(`/bookings/${bookingId}`, {
      method: "DELETE",
      body: JSON.stringify({ cancellationReason }),
    })
  }

  // --------------------------------------------------------------------------
  // QUOTATION ENDPOINTS (Customer View)
  // --------------------------------------------------------------------------

  /**
   * Get all quotations for a booking
   */
  async getBookingQuotations(bookingId: number) {
    const result = await this.request<SpringPage<QuotationResponseDto>>(
      `/quotations?bookingId=${bookingId}&size=50`,
    )

    const quotations = result.content.map((item) => this.mapQuotationDetail(item))
    const summary = this.buildQuotationSummary(quotations)

    return { quotations, summary }
  }

  /**
   * Accept a quotation (creates contract)
   */
  async acceptQuotation(quotationId: number) {
    return this.request<{
      message: string
      contractId: number | null
      contractNumber: string | null
      contractPdfUrl: string | null
      booking: {
        bookingId: number
        status: BookingStatus
        finalTransportId: number | null
        finalPrice: number | null
      }
    }>(`/quotations/${quotationId}/accept`, {
      method: "POST",
    })
  }

  /**
   * Reject a quotation
   */
  async rejectQuotation(quotationId: number, reason?: string) {
    return this.request<{ message: string }>(`/quotations/${quotationId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // --------------------------------------------------------------------------
  // TRANSPORT QUOTATION ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Get bookings available for quotation (Transport view)
   */
  async getAvailableBookings(params?: {
    page?: number
    limit?: number
    maxDistance?: number
    preferredDate?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.maxDistance) queryParams.append("maxDistance", params.maxDistance.toString())
    if (params?.preferredDate) queryParams.append("preferredDate", params.preferredDate)

    return this.request<{
      data: AvailableBooking[]
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/transport/bookings/available?${queryParams.toString()}`)
  }

  /**
   * Submit quotation for a booking
   */
  async submitQuotation(data: SubmitQuotationRequest) {
    return this.request<{
      quotationId: number
      message: string
      totalPrice: number
      expiresAt: string
    }>("/transport/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get transport's submitted quotations
   */
  async getMyQuotations(params?: { page?: number; limit?: number; status?: QuotationStatus }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)

    return this.request<{
      data: Array<{
        quotationId: number
        bookingId: number
        pickupLocation: string
        deliveryLocation: string
        preferredDate: string
        myQuotePrice: number
        status: QuotationStatus
        competitorQuotesCount: number
        lowestCompetitorPrice: number | null
        myRank: number
        expiresAt: string
        submittedAt: string
      }>
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/transport/quotations?${queryParams.toString()}`)
  }

  /**
   * Start job (CONFIRMED → IN_PROGRESS)
   */
  async startJob(bookingId: number) {
    return this.request<{
      message: string
      booking: {
        bookingId: number
        status: BookingStatus
        scheduledDatetime: string
      }
    }>(`/transport/bookings/${bookingId}/start`, {
      method: "PUT",
    })
  }

  /**
   * Complete job (IN_PROGRESS → COMPLETED)
   */
  async completeJob(bookingId: number, data: { completionNotes?: string; completionPhotos?: string[] }) {
    return this.request<{
      message: string
      booking: {
        bookingId: number
        status: BookingStatus
        completedDatetime: string
      }
    }>(`/transport/bookings/${bookingId}/complete`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // --------------------------------------------------------------------------
  // CONTRACT ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Get contract details
   */
  async getContract(contractId: number) {
    return this.request<{
      contractId: number
      contractNumber: string
      bookingId: number
      customer: {
        name: string
        email: string
        phone: string
      }
      transport: {
        companyName: string
        email: string
        phone: string
      }
      totalAmount: number
      termsAndConditions: string
      paymentTerms: string
      cancellationPolicy: string
      contractPdfUrl: string
      completionDate: string | null
      customerSigned: boolean
      customerSignedAt: string | null
      transportSigned: boolean
      transportSignedAt: string | null
      status: ContractStatus
      effectiveDate: string
      createdAt: string
    }>(`/contracts/${contractId}`)
  }

  /**
   * Get contract by booking ID
   */
  async getContractByBooking(bookingId: number) {
    return this.request<{
      contractId: number
      contractNumber: string
      bookingId: number
      customer: {
        name: string
        email: string
        phone: string
      }
      transport: {
        companyName: string
        email: string
        phone: string
      }
      totalAmount: number
      termsAndConditions: string
      paymentTerms: string
      cancellationPolicy: string
      contractPdfUrl: string
      completionDate: string | null
      customerSigned: boolean
      customerSignedAt: string | null
      transportSigned: boolean
      transportSignedAt: string | null
      status: ContractStatus
      effectiveDate: string
      createdAt: string
    }>(`/bookings/${bookingId}/contract`)
  }

  /**
   * List contracts for authenticated customer
   */
  async getCustomerContracts() {
    return this.request<Array<{
      contractId: number
      contractNumber: string
      bookingId: number
      status: ContractStatus
      totalAmount: number
      customerSigned: boolean
      transportSigned: boolean
      contractPdfUrl: string | null
      createdAt: string
      effectiveDate: string | null
      transport: {
        companyName: string
        email: string
        phone: string
      }
    }>>("/customer/contracts")
  }

  /**
   * Customer favorite transports
   */
  async getFavoriteTransports() {
    return this.request<Array<{
      transportId: number
      companyName: string
      logoUrl: string | null
      isVerified: boolean
      averageRating: number
      totalReviews: number
      completedBookings: number
      completionRate: number
      city: string
      phone: string
      email: string
    }>>("/customer/favorites")
  }

  /**
   * Remove favorite transport
   */
  async removeFavoriteTransport(transportId: number) {
    return this.request<{ success: boolean }>(`/customer/favorites/${transportId}`, {
      method: "DELETE",
    })
  }

  /**
   * Get item categories
   */
  async getCategories() {
    return this.request<Category[]>("/categories")
  }

  // --------------------------------------------------------------------------
  // CUSTOMER DASHBOARD METHODS
  // --------------------------------------------------------------------------

  /**
   * Fetches customer dashboard statistics
   */
  async getCustomerStats() {
    return this.request<CustomerStats & { average_rating: number }>("/customer/dashboard/stats")
  }

  /**
   * Fetches customer bookings
   */
  async getCustomerBookings() {
    return this.request<
      {
        booking_id: number
        customer_id: number
        transport_id: number
        booking_date: string
        status: string
      }[]
    >("/customer/bookings")
  }

  // --------------------------------------------------------------------------
  // TRANSPORT DASHBOARD METHODS
  // --------------------------------------------------------------------------

  /**
   * Fetches transport dashboard statistics
   */
  async getTransportStats() {
    return this.request<{
      total_bookings: number
      completed_bookings: number
      cancelled_bookings: number
      average_rating: number
    }>("/transport/dashboard/stats")
  }

  /**
   * Fetches encrypted transport dashboard statistics with role-based access
   */
  async getEncryptedTransportStats() {
    return this.request<{
      transportId: number
      completedBookings: number
      inProgressBookings: number
      pendingQuotations: number
      averageRating: number
      totalReviews: number
      completionRate: number
      encryptedTotalIncome: string
      encryptedMonthlyRevenue: string
      encryptedPendingSettlements: string
      maskedTotalIncome: string
      maskedMonthlyRevenue: string
      totalIncome?: number
      monthlyRevenue?: number
      pendingSettlements?: number
      monthlyRevenueSeries: Array<{
        month: string
        encryptedRevenue: string
        maskedRevenue: string
        revenue?: number
      }>
      canViewEncryptedData: boolean
      canExportData: boolean
    }>("/transport/dashboard/stats/encrypted")
  }

  /**
   * Fetch active jobs assigned to the transport
   */
  async getTransportActiveJobs() {
    return this.request<any[]>("/transport/active-jobs")
  }

  /**
   * Fetch detail for a specific active job
   */
  async getTransportActiveJobDetail(bookingId: number) {
    return this.request<any>(`/transport/active-jobs/${bookingId}`)
  }

  /**
   * Fetches earnings statistics for transport
   */
  async getEarningsStats() {

    return this.request<{
      total_earnings: number
      current_balance: number
      this_month_earnings: number
      this_month_bookings: number
      pending_amount: number
      pending_transactions: number
      average_per_booking: number
      total_bookings: number
      growth_rate: string
      monthly_breakdown: Array<{
        month: string
        revenue: number
        bookings: number
      }>
    }>("/transport/earnings/stats")
  }

  /**
   * Fetches transaction history for transport
   */
  async getTransactions() {
    return this.request<
      Array<{
        transaction_id: string
        booking_id: number
        customer_name: string
        amount: number
        status: "COMPLETED" | "PENDING" | "FAILED"
        payment_method: string
        created_at: string
        expected_date: string
      }>
    >("/transport/transactions")
  }

  /**
   * Fetches wallet report for transport
   */
  async getWalletReport(days: number = 30) {
    return this.request<{
      snapshot: {
        current_balance_vnd: number
        total_earned_vnd: number
        total_withdrawn_vnd: number
        last_transaction_at: string
      }
      cashflow: Array<{
        transaction_id: number
        amount_vnd: number
        inflow: boolean
        created_at: string
      }>
      daily_balances: Array<{
        date: string
        closing_balance_vnd: number
      }>
    }>(`/transport/earnings/wallet-report?days=${days}`)
  }

  /**
   * Request a payout for all ready settlements
   */
  async requestPayout() {
    return this.request<any>("/transport/payouts/request", {
      method: "POST",
    })
  }

  /**
   * Fetches pending quotations for transport
   */
  async getTransportQuotations() {
    return this.request<
      {
        quotation_id: number
        transport_id: number
        customer_id: number
        quotation_date: string
        status: string
      }[]
    >("/transport/quotations")
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: VEHICLE MANAGEMENT ENDPOINTS (Transport)
  // --------------------------------------------------------------------------

  /**
   * Register new vehicle
   */
  async createVehicle(data: {
    type: string
    model: string
    licensePlate: string
    capacityKg: number
    capacityM3?: number
    year?: number
    color?: string
    hasTailLift?: boolean
    hasTools?: boolean
    description?: string
    imageUrl?: string
  }) {
    return this.request<{
      success: boolean
      message?: string
      data: {
        vehicleId: number
        vehicle: any
      }
    }>("/transport/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get transport's vehicles
   */
  async getVehicles(params?: {
    status?: string
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.page !== undefined) queryParams.append("page", params.page.toString())
    if (params?.size) queryParams.append("size", params.size.toString())
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    return this.request<{
      success: boolean
      data: {
        vehicles: any[]
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/transport/vehicles?${queryParams.toString()}`)
  }

  /**
   * Get vehicle details
   */
  async getVehicle(vehicleId: number) {
    return this.request<{
      success: boolean
      data: any
    }>(`/transport/vehicles/${vehicleId}`)
  }

  /**
   * Update vehicle info
   */
  async updateVehicle(vehicleId: number, data: any) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>(`/transport/vehicles/${vehicleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(vehicleId: number, status: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/transport/vehicles/${vehicleId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(vehicleId: number) {
    return this.request<{
      success: boolean
      message: string
    }>(`/transport/vehicles/${vehicleId}`, {
      method: "DELETE",
    })
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: PRICING CONFIGURATION ENDPOINTS (Transport)
  // --------------------------------------------------------------------------

  /**
   * Get pricing rules for categories
   */
  async getCategoryPricing(transportId?: number) {
    const params = transportId ? `?transportId=${transportId}` : ""
    return this.request<{
      success: boolean
      data: {
        pricingRules: any[]
      }
    }>(`/transport/pricing/categories${params}`)
  }

  /**
   * Set pricing for category
   */
  async setCategoryPricing(data: {
    transportId: number
    categoryId: number
    pricePerUnitVnd: number
    fragileMultiplier: number
    disassemblyMultiplier: number
    heavyMultiplier: number
    heavyThresholdKg: number
    validFrom: string
    validTo?: string
  }) {
    return this.request<{
      success: boolean
      message: string
    }>("/transport/pricing/categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }


  /**
   * Get rate cards
   */
  async getRateCards(transportId: number) {
    return this.request<{
      success: boolean
      data: any[]
    }>(`/transport/pricing/rate-cards?transportId=${transportId}`)
  }

  /**
   * Create or update rate card
   */
  async createRateCard(transportId: number, data: {
    categoryId: number
    basePrice: number
    pricePerKm: number
    pricePerHour: number
    minimumCharge: number
    validFrom: string
    validUntil: string
    additionalRules?: Record<string, any>
  }) {
    return this.request<{
      success: boolean
      data: any
    }>(`/transport/pricing/rate-cards?transportId=${transportId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete rate card
   */
  async deleteRateCard(transportId: number, rateCardId: number) {
    return this.request<{
      success: boolean
      data: any
    }>(`/transport/pricing/rate-cards/${rateCardId}?transportId=${transportId}`, {
      method: "DELETE",
    })
  }


  /**
   * Get pricing rules by vehicle type (Option A)
   */
  async getVehiclePricing(transportId?: number) {
    const params = transportId ? `?transportId=${transportId}` : ""
    return this.request<{
      success: boolean
      data: { pricingRules: any[] }
    }>(`/transport/pricing/vehicles${params}`)
  }

  /**
   * Set pricing by vehicle type (Option A)
   */
  async setVehiclePricing(
    data:
      | {
        vehicleId: number
        basePrice: number
        perKmFirst4km: number
        perKm5To40km: number
        perKmAfter40km: number
        peakHourMultiplier: number
        weekendMultiplier: number
        holidayMultiplier: number
        noElevatorFee: number
        elevatorDiscount: number
      }
      | {
        transportId: number
        vehicleType: string
        basePriceVnd: number
        perKmFirst4KmVnd: number
        perKm5To40KmVnd: number
        perKmAfter40KmVnd: number
        minChargeVnd: number
        elevatorBonusVnd: number
        noElevatorFeePerFloorVnd: number
        noElevatorFloorThreshold: number
        peakHourMultiplier: number
        weekendMultiplier: number
        validFrom: string
      },
  ) {
    return this.request<{ success: boolean; message?: string; data?: { pricingId?: number } }>("/transport/pricing/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: TRANSPORT SETTINGS ENDPOINTS
  // --------------------------------------------------------------------------

  async getTransportSettings(): Promise<TransportSettings> {
    const response = await this.request<TransportSettingsDto | { success: boolean; data: TransportSettingsDto }>(
      "/transport/settings",
    )
    const dto = this.unwrapData<TransportSettingsDto>(response)
    return this.mapTransportSettings(dto)
  }

  async updateTransportSettings(data: UpdateTransportSettingsPayload): Promise<TransportSettings> {
    const body = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc
      acc[key] = value
      return acc
    }, {})

    const response = await this.request<TransportSettingsDto | { success: boolean; data: TransportSettingsDto }>(
      "/transport/settings",
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    )
    const dto = this.unwrapData<TransportSettingsDto>(response)
    return this.mapTransportSettings(dto)
  }

  async saveTransportSettings(data: UpdateTransportSettingsPayload) {
    return this.updateTransportSettings(data)
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: CATEGORY MANAGEMENT ENDPOINTS (Admin)
  // --------------------------------------------------------------------------

  /**
   * Get all categories
   */
  async getAllCategories(params?: { isActive?: boolean; page?: number; size?: number }) {
    const buildQuery = (options?: { isActive?: boolean; page?: number; size?: number }) => {
      const queryParams = new URLSearchParams()
      if (options?.isActive !== undefined) {
        // Transport endpoint expects "isActive", admin endpoint uses "activeOnly"
        queryParams.append("isActive", options.isActive.toString())
        queryParams.append("activeOnly", options.isActive.toString())
      }
      if (options?.page !== undefined) queryParams.append("page", options.page.toString())
      if (options?.size) queryParams.append("size", options.size.toString())
      return queryParams.toString()
    }

    const query = buildQuery(params)

    const normalizeResponse = (response: any) => {
      if (!response) return []
      if (Array.isArray(response)) return response
      if (response.data?.categories) return response.data.categories
      if (response.categories) return response.categories
      if (response.data && Array.isArray(response.data)) return response.data
      return []
    }

    const fetchCategories = async (queryString: string) => {
      // Prefer transport-facing endpoint (correct snake_case payload), fall back to admin if unavailable
      try {
        return await this.request<any>(`/transport/categories${queryString ? `?${queryString}` : ""}`)
      } catch (error) {
        return await this.request<any>(`/admin/categories${queryString ? `?${queryString}` : ""}`)
      }
    }

    let primaryResponse = await fetchCategories(query)
    let categories = normalizeResponse(primaryResponse)

    // If filtering by active returns empty, refetch without the active filter to avoid blank screens
    if (params?.isActive && categories.length === 0) {
      const fallbackQuery = buildQuery({ ...params, isActive: undefined })
      const fallbackResponse = await fetchCategories(fallbackQuery)
      categories = normalizeResponse(fallbackResponse)
    }

    return {
      data: {
        categories,
      },
    }
  }

  /**
   * Create category
   */
  async createCategory(data: {
    name: string
    nameEn?: string
    description?: string
    icon?: string
    defaultWeightKg?: number
    defaultVolumeM3?: number
    defaultLengthCm?: number
    defaultWidthCm?: number
    defaultHeightCm?: number
    isFragileDefault?: boolean
    requiresDisassemblyDefault?: boolean
    displayOrder: number
  }) {
    return this.request<{
      success: boolean
      message: string
      data: { categoryId: number }
    }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: number, data: any) {
    return this.request<{
      success: boolean
      message: string
    }>(`/admin/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: number) {
    return this.request<{
      success: boolean
      message: string
    }>(`/admin/categories/${categoryId}`, {
      method: "DELETE",
    })
  }

  /**
   * Check if category is in use before deletion
   */
  async checkCategoryUsage(categoryId: number) {
    return this.request<{
      success: boolean
      data: {
        isInUse: boolean
        usageCount: number
        activeBookings: number
        totalItems: number
      }
    }>(`/admin/categories/${categoryId}/usage`)
  }

  /**
   * Add size to category
   */
  async addCategorySize(
    categoryId: number,
    data: {
      name: string
      weightKg: number
      heightCm?: number
      widthCm?: number
      depthCm?: number
      priceMultiplier: number
    },
  ) {
    return this.request<{
      success: boolean
      message: string
      data: { sizeId: number }
    }>(`/admin/categories/${categoryId}/sizes`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: DISTANCE API ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Calculate distance between two addresses
   */
  async calculateDistance(data: { originAddress: string; destinationAddress: string }) {
    return this.request<{
      success: boolean
      data: {
        distanceKm: number
        durationMinutes: number
        originAddress: string
        destinationAddress: string
        cached: boolean
        apiProvider: string
      }
    }>("/distance/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // --------------------------------------------------------------------------
  // MEMBER 3: PRICING & ESTIMATION ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Calculate price for specific transport
   */
  async calculatePrice(data: {
    transportId: number
    vehicleId: number
    distanceKm: number
    items: Array<{
      categoryId: number
      quantity: number
      isFragile: boolean
      requiresDisassembly: boolean
      weight: number
    }>
    pickupFloor: number
    pickupHasElevator: boolean
    deliveryFloor: number
    deliveryHasElevator: boolean
    scheduledDateTime: string
  }) {
    return this.request<{
      success: boolean
      data: any
    }>("/pricing/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Auto-estimate prices for all suitable transports
   */
  async autoEstimate(data: {
    pickupAddress: string
    deliveryAddress: string
    items: Array<{
      categoryId: number
      quantity: number
      isFragile: boolean
      requiresDisassembly: boolean
      weight: number
    }>
    pickupFloor: number
    pickupHasElevator: boolean
    deliveryFloor: number
    deliveryHasElevator: boolean
    scheduledDateTime: string
  }) {
    return this.request<{
      success: boolean
      data: any
    }>("/estimation/auto", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // --------------------------------------------------------------------------
  // MEMBER 4: REVIEW SYSTEM ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Submit a review for a completed booking
   */
  async submitReview(data: {
    bookingId: number
    rating: number
    title?: string
    comment?: string
    photoUrls?: string[]
  }) {

    return this.request<{
      success: boolean
      message: string
      data: {
        reviewId: number
        rating: number
      }
    }>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Update an existing review created by the current user
   */
  async updateReview(
    reviewId: number,
    data: { rating: number; title?: string; comment?: string; photoUrls?: string[] },
  ) {
    return this.request<{ success: boolean; message: string }>(`/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get reviews for a user (as reviewee)
   */
  async getMyReviews(params?: {
    page?: number
    limit?: number
    rating?: number
    hasResponse?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.rating) queryParams.append("rating", params.rating.toString())
    if (params?.hasResponse !== undefined) queryParams.append("hasResponse", params.hasResponse.toString())

    return this.request<{
      success: boolean
      data: {
        reviews: any[]
        stats: any
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/reviews/me?${queryParams.toString()}`)
  }

  /**
   * Get reviews written by current user
   */
  async getMySubmittedReviews(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    return this.request<{
      success: boolean
      data: {
        reviews: any[]
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/reviews/submitted?${queryParams.toString()}`)
  }

  /**
   * Get reviews for a specific user/transport
   */
  async getUserReviews(userId: number, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    return this.request<{
      success: boolean
      data: {
        reviews: any[]
        stats: any
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/reviews/user/${userId}?${queryParams.toString()}`)
  }

  /**
   * Respond to a review
   */
  async respondToReview(reviewId: number, response: string) {

    return this.request<{
      success: boolean
      message: string
    }>(`/reviews/${reviewId}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    })
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: number, data: { reason: string; details?: string }) {

    return this.request<{
      success: boolean
      message: string
    }>(`/reviews/${reviewId}/report`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete a review created by the current user
   */
  async deleteReview(reviewId: number) {
    return this.request<{ success: boolean; message: string }>(`/reviews/${reviewId}`, {
      method: "DELETE",
    })
  }

  /**
   * Check if user can review a booking
   */
  async canReviewBooking(bookingId: number) {

    return this.request<{
      success: boolean
      data: {
        canReview: boolean
        reason: string | null
      }
    }>(`/reviews/can-review/${bookingId}`)
  }

  // --------------------------------------------------------------------------
  // MEMBER 4: NOTIFICATION SYSTEM ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Get user's notifications
   */
  async getNotifications(params?: {
    page?: number
    limit?: number
    isRead?: boolean
    type?: string
  }): Promise<{
    notifications: NotificationType[]
    summary: NotificationSummaryPayload
    pagination: NotificationPagination
  }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.isRead !== undefined) queryParams.append("isRead", params.isRead.toString())
    if (params?.type) queryParams.append("type", params.type)

    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    const page = await this.request<SpringPage<NotificationDto>>(endpoint)
    const notifications = (page.content ?? []).map((dto) => this.mapNotification(dto))

    const summary = {
      total_unread: notifications.filter((n) => !n.is_read).length,
      by_type: notifications.reduce<Record<string, number>>((acc, notification) => {
        const key = notification.type
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {}),
      latest_notifications: notifications.slice(0, 5),
    }

    const pagination = {
      currentPage: (page.number ?? 0) + 1,
      totalPages: page.totalPages ?? 1,
      totalItems: page.totalElements ?? notifications.length,
      itemsPerPage: page.size ?? notifications.length,
    }

    return { notifications, summary, pagination }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number): Promise<NotificationType> {
    const dto = await this.request<NotificationDto>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    })
    return this.mapNotification(dto)
  }

  /**
   * Mark multiple notifications as read
   */
  async markNotificationsAsRead(notificationIds: number[]): Promise<void> {
    if (!notificationIds.length) return
    await this.request<void>("/notifications/mark-read", {
      method: "PATCH",
      body: JSON.stringify({ notificationIds }),
    })
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    await this.request<{ message?: string }>(`/notifications/${notificationId}`, {
      method: "DELETE",
    })
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {

    return this.request<{
      success: boolean
      data: any
    }>("/notifications/preferences")
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(data: any) {
    return this.request<{
      success: boolean
      message: string
    }>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    const response = await this.request<{ unreadCount?: number; count?: number }>("/notifications/unread-count")
    const count = response?.unreadCount ?? response?.count
    return typeof count === "number" ? count : Number(count ?? 0) || 0
  }

  /**
   * Get performance metrics for transport
   */
  async getPerformanceMetrics(days = 30): Promise<PerformanceMetrics> {
    const metrics = await this.request<PerformanceMetrics>(`/transport/analytics/metrics?days=${days}`)
    return {
      acceptance_rate: this.toNumber(metrics.acceptance_rate, 0),
      acceptance_rate_change: this.toNumber(metrics.acceptance_rate_change, 0),
      avg_response_time_minutes: this.toNumber(metrics.avg_response_time_minutes, 0),
      response_time_change: this.toNumber(metrics.response_time_change, 0),
      customer_satisfaction: this.toNumber(metrics.customer_satisfaction, 0),
      satisfaction_change: this.toNumber(metrics.satisfaction_change, 0),
      on_time_delivery_rate: this.toNumber(metrics.on_time_delivery_rate, 0),
      on_time_change: this.toNumber(metrics.on_time_change, 0),
      completion_rate: this.toNumber(metrics.completion_rate, 0),
      completion_change: this.toNumber(metrics.completion_change, 0),
      revenue_per_job: this.toNumber(metrics.revenue_per_job, 0),
      revenue_change: this.toNumber(metrics.revenue_change, 0),
      total_jobs: this.toNumber(metrics.total_jobs, 0),
      jobs_change: this.toNumber(metrics.jobs_change, 0),
      active_vehicles: this.toNumber(metrics.active_vehicles, 0),
    }
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(days = 30): Promise<PerformanceTrend[]> {
    const trends = await this.request<PerformanceTrend[]>(`/transport/analytics/trends?days=${days}`)
    return trends.map((trend) => ({
      date: trend.date,
      jobs_completed: this.toNumber(trend.jobs_completed, 0),
      acceptance_rate: this.toNumber(trend.acceptance_rate, 0),
      avg_response_time: this.toNumber(trend.avg_response_time, 0),
      revenue: this.toNumber(trend.revenue, 0),
      satisfaction_score: this.toNumber(trend.satisfaction_score, 0),
    }))
  }

  /**
   * Get category performance breakdown
   */
  async getCategoryPerformance(days = 30): Promise<CategoryPerformance[]> {
    const categories = await this.request<CategoryPerformance[]>(`/transport/analytics/categories?days=${days}`)
    return categories.map((category) => ({
      category: category.category,
      jobs: this.toNumber(category.jobs, 0),
      revenue: this.toNumber(category.revenue, 0),
      avg_rating: this.toNumber(category.avg_rating, 0),
    }))
  }

  /**
   * Get vehicle utilization rates
   */
  async getVehicleUtilization(days = 30): Promise<VehicleUtilization[]> {
    const vehicles = await this.request<VehicleUtilization[]>(`/transport/analytics/vehicles?days=${days}`)
    return vehicles.map((vehicle) => ({
      vehicle_name: vehicle.vehicle_name,
      utilization_rate: this.toNumber(vehicle.utilization_rate, 0),
      jobs_completed: this.toNumber(vehicle.jobs_completed, 0),
      revenue: this.toNumber(vehicle.revenue, 0),
    }))
  }

  /**
   * Get contracts for transport
   */
  async getTransportContracts(params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.search) queryParams.append("search", params.search)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    return this.request<{
      contracts: any[]
      stats: {
        total_contracts: number
        active_contracts: number
        total_value: number
        average_value: number
      }
      pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
      }
    }>(`/transport/contracts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
  }

  // --------------------------------------------------------------------------
  // MEMBER 5: INCIDENT REPORTING & EVIDENCE ENDPOINTS
  // --------------------------------------------------------------------------

  /**
   * Report an incident during a booking
   */
  async reportIncident(data: {
    bookingId: number
    type: string
    severity: string
    title: string
    description: string
    occurredAt: string
    location?: string
    photoUrls: string[]
    videoUrls?: string[]
  }) {

    return this.request<{
      success: boolean
      message: string
      data: {
        incidentId: number
        requiresManagerAction: boolean
      }
    }>("/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get incidents for a booking
   */
  async getBookingIncidents(bookingId: number) {

    return this.request<{
      success: boolean
      data: {
        incidents: any[]
      }
    }>(`/bookings/${bookingId}/incidents`)
  }

  /**
   * Get all incidents (Transport/Manager view)
   */
  async getIncidents(params?: {
    page?: number
    limit?: number
    status?: string
    severity?: string
    type?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.severity) queryParams.append("severity", params.severity)
    if (params?.type) queryParams.append("type", params.type)

    return this.request<{
      success: boolean
      data: {
        incidents: any[]
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/incidents?${queryParams.toString()}`)
  }

  /**
   * Update incident status (Manager only)
   */
  async updateIncident(
    incidentId: number,
    data: {
      status?: string
      resolutionNotes?: string
      assignedTo?: number
    },
  ) {
    return this.request<{
      success: boolean
      message: string
    }>(`/incidents/${incidentId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }




  // --------------------------------------------------------------------------
  // MEMBER 5: EXCEPTION HANDLING & MANAGER ALERTS
  // --------------------------------------------------------------------------

  /**
   * Get exceptions (Manager view)
   */
  async getExceptions(params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    type?: string
  }) {

    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.priority) queryParams.append("priority", params.priority)
    if (params?.type) queryParams.append("type", params.type)

    return this.request<{
      success: boolean
      data: {
        exceptions: any[]
        stats: any
        pagination: {
          currentPage: number
          totalPages: number
          totalItems: number
          itemsPerPage: number
        }
      }
    }>(`/admin/exceptions?${queryParams.toString()}`)
  }

  /**
   * Create exception (System or Manager)
   */
  async createException(data: {
    bookingId?: number
    incidentId?: number
    type: string
    priority: string
    title: string
    description: string
    metadata?: any
  }) {

    return this.request<{
      success: boolean
      message: string
      data: {
        exceptionId: number
      }
    }>("/admin/exceptions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Update exception (Manager only)
   */
  async updateException(
    exceptionId: number,
    data: {
      status?: string
      assignedTo?: number
      resolutionNotes?: string
    },
  ) {

    return this.request<{
      success: boolean
      message: string
    }>(`/admin/exceptions/${exceptionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * Get exception details
   */
  async getException(exceptionId: number) {

    return this.request<{
      success: boolean
      data: any
    }>(`/admin/exceptions/${exceptionId}`)
  }

  /**
   * Search for places using Goong Maps
   */
  async searchPlaces(query: string) {
    // This should call your backend proxy or Goong API directly if you expose the key (not recommended)
    // For now, let's assume there's a backend endpoint for this to keep keys safe
    return this.request<Array<{ description: string; placeId: string }>>(
      `/map/autocomplete?query=${encodeURIComponent(query)}`
    )
  }

  /**
   * Get place details from Goong Maps
   */
  async getPlaceDetails(placeId: string) {
    return this.request<{
      placeId: string
      description: string
      latitude: number
      longitude: number
      provinceCode?: string
      districtCode?: string
      wardCode?: string
    }>(`/map/details?placeId=${placeId}`)
  }

  /**
   * Get location from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(lat: number, lng: number) {
    return this.request<{
      placeId: string
      description: string
      latitude: number
      longitude: number
    }>(`/map/reverse?lat=${lat}&lng=${lng}`)
  }

  // --------------------------------------------------------------------------
  // LOCATION METHODS (Vietnam administrative divisions)
  // --------------------------------------------------------------------------

  async getProvinces() {
    console.log("🔌 API Client: Fetching provinces from /locations/provinces")
    try {
      const result = await this.request<ProvinceOption[]>("/locations/provinces")
      console.log("API Client: Provinces response:", result?.length || 0, "items")
      return result
    } catch (error) {
      console.error("❌ API Client: Error fetching provinces:", error)
      throw error
    }
  }

  async getDistricts(provinceCode: string) {
    console.log("🔌 API Client: Fetching districts for province:", provinceCode)
    try {
      const result = await this.request<DistrictOption[]>(
        `/locations/provinces/${encodeURIComponent(provinceCode)}/districts`,
      )
      console.log("API Client: Districts response:", result?.length || 0, "items")
      return result
    } catch (error) {
      console.error("❌ API Client: Error fetching districts:", error)
      throw error
    }
  }

  async getWards(districtCode: string) {
    console.log("🔌 API Client: Fetching wards for district:", districtCode)
    try {
      const result = await this.request<WardOption[]>(`/locations/districts/${encodeURIComponent(districtCode)}/wards`)
      console.log("API Client: Wards response:", result?.length || 0, "items")
      return result
    } catch (error) {
      console.error("❌ API Client: Error fetching wards:", error)
      throw error
    }
  }

  // --------------------------------------------------------------------------
  // PAYMENT METHODS (deposit & status tracking)
  // --------------------------------------------------------------------------

  /**
   * Initiate deposit payment for a booking
   */
  async initiateDeposit(data: {
    bookingId: number
    method: string
  }) {
    return this.request<{
      success: boolean
      paymentId?: string
      paymentUrl?: string
      bookingId: number
      message?: string
    }>("/customer/payments/deposit/initiate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Initiate remaining payment (70% + optional tip) for a booking
   */
  async initiateRemainingPayment(data: {
    bookingId: number
    method: string
    tipAmountVnd?: number
    returnUrl?: string
    cancelUrl?: string
  }) {
    return this.request<{
      success: boolean
      paymentId?: string
      paymentUrl?: string
      bookingId: number
      remainingAmountVnd?: number
      tipAmountVnd?: number
      totalAmountVnd?: number
      message?: string
    }>("/customer/payments/remaining/initiate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * Customer confirms booking completion after service is done
   */
  async confirmBookingCompletion(bookingId: number, data?: {
    feedback?: string
    rating?: number
  }) {
    return this.request<{
      message: string
      booking: any
    }>(`/bookings/${bookingId}/confirm-completion`, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(params: {
    bookingId: number
    paymentId?: string
  }) {
    const queryParams = new URLSearchParams()
    queryParams.append("bookingId", params.bookingId.toString())
    if (params.paymentId) {
      queryParams.append("paymentId", params.paymentId)
    }

    return this.request<{
      success: boolean
      status: "PENDING" | "AWAITING_CUSTOMER" | "DEPOSIT_PAID" | "FULL_PAID" | "FAILED" | "CANCELLED"
      message?: string
    }>(`/customer/payments/status?${queryParams.toString()}`)
  }

  /**
   * Get bank transfer information
   */
  async getBankInfo() {
    return this.request<{
      bank: string
      accountNumber: string
      accountName: string
      branch?: string
    }>("/customer/payments/bank-info")
  }

  // --------------------------------------------------------------------------
  // INTAKE METHODS (for scan flow)
  // --------------------------------------------------------------------------

  /**
   * Analyze uploaded images to detect items
   */
  async analyzeImages(images: File[]) {
    const formData = new FormData()
    images.forEach((image) => formData.append("images", image))

    return this.request<{
      success: boolean
      data: {
        candidates: any[]
      }
    }>("/intake/analyze-images", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  /**
   * Search for product brands
   */
  async searchBrands(query: string) {
    return this.request<{
      brands: string[]
    }>(`/product-models/brands/search?q=${encodeURIComponent(query)}`)
  }

  /**
   * Search for product models by brand and model name
   */
  async searchModels(query: string, brand?: string) {
    const params = new URLSearchParams({ q: query })
    if (brand) params.append('brand', brand)
    return this.request<{
      models: Array<{
        modelId: number
        brand: string
        model: string
        productName: string
        categoryId: number | null
        weightKg: number | null
        dimensionsMm: string | null
        source: string
        sourceUrl: string | null
        usageCount: number
      }>
    }>(`/product-models/models/search?${params}`)
  }

  /**
   * Save or update a product model
   */
  async saveProductModel(data: {
    brand: string
    model: string
    productName?: string
    categoryId?: number
    weightKg?: number
    dimensionsMm?: string
    source?: string
    sourceUrl?: string
  }) {
    return this.request<any>('/product-models', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Record usage of a product model
   */
  async recordModelUsage(modelId: number) {
    return this.request<void>(`/product-models/${modelId}/use`, {
      method: 'POST',
    })
  }

  // ========== Customer Saved Items (Đồ của tôi) ==========

  /**
   * Get all saved items for current customer
   */
  async getSavedItems() {
    return this.request<{
      items: Array<{
        savedItemId: number
        customerId: number
        name: string
        brand: string | null
        model: string | null
        categoryId: number | null
        size: string | null
        weightKg: number | null
        dimensions: string | null
        declaredValueVnd: number | null
        quantity: number
        isFragile: boolean
        requiresDisassembly: boolean
        requiresPackaging: boolean
        notes: string | null
        metadata: string | null
        createdAt: string
        updatedAt: string
      }>
      count: number
    }>('/customer/saved-items')
  }

  /**
   * Get count of saved items
   */
  async getSavedItemsCount() {
    return this.request<{ count: number }>('/customer/saved-items/count')
  }

  /**
   * Save a single item to storage
   */
  async saveItemToStorage(item: {
    name: string
    brand?: string
    model?: string
    categoryId?: number
    size?: string
    weightKg?: number
    dimensions?: string
    declaredValueVnd?: number
    quantity: number
    isFragile?: boolean
    requiresDisassembly?: boolean
    requiresPackaging?: boolean
    notes?: string
    metadata?: string
  }) {
    return this.request<any>('/customer/saved-items', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  /**
   * Save multiple items to storage (batch)
   */
  async saveItemsToStorage(items: any[]) {
    return this.request<{
      items: any[]
      count: number
      message: string
    }>('/customer/saved-items/batch', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  }

  /**
   * Update a saved item
   */
  async updateSavedItem(id: number, updates: any) {
    return this.request<any>(`/customer/saved-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Delete a saved item
   */
  async deleteSavedItem(id: number) {
    return this.request<{ message: string }>(`/customer/saved-items/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Delete multiple saved items (batch)
   */
  async deleteSavedItems(ids: number[]) {
    return this.request<{ message: string }>('/customer/saved-items/batch', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    })
  }

  /**
   * Delete all saved items
   */
  async deleteAllSavedItems() {
    return this.request<{ message: string }>('/customer/saved-items', {
      method: 'DELETE',
    })
  }

  /**
   * Parse pasted text to extract items
   */
  async parseText(text: string) {
    return this.request<{
      success: boolean
      data: { candidates: any[] }
    }>("/intake/parse-text", {
      method: "POST",
      body: JSON.stringify({ text }),
    })
  }

  /**
   * OCR images to extract text and parse items
   */
  async ocrImages(images: File[]) {
    const formData = new FormData()
    images.forEach((image) => formData.append("images", image))

    return this.request<{
      success: boolean
      data: {
        extractedText: string
        candidates: any[]
      }
    }>("/intake/ocr", {
      method: "POST",
      body: formData,
      headers: {},
    })
  }

  /**
   * Parse uploaded documents (PDF, DOCX, XLSX)
   */
  async parseDocument(file: File) {
    const formData = new FormData()
    formData.append("document", file)

    return this.request<{
      success: boolean
      data: { candidates: any[] }
    }>("/intake/parse-document", {
      method: "POST",
      body: formData,
      headers: {},
    })
  }

  // ========== Evidence Management ==========

  /**
   * Get all evidence for a booking
   * @param bookingId - The booking ID
   * @param filterType - Optional evidence type filter
   */
  async getBookingEvidence(bookingId: number, filterType?: string) {
    const params = filterType ? `?type=${filterType}` : ''
    return this.request<{
      bookingId: number
      evidence: Array<{
        evidenceId: number
        bookingId: number
        uploadedByUserId: number
        uploaderName?: string
        uploaderRole?: string
        evidenceType: string
        fileType: string
        fileUrl: string
        fileName: string
        mimeType?: string
        fileSizeBytes?: number
        description?: string
        uploadedAt: string
      }>
      count: number
    }>(`/bookings/${bookingId}/evidence${params}`)
  }

  /**
   * Upload evidence for a booking
   * @param bookingId - The booking ID
   * @param evidenceData - Evidence data to upload
   */
  async uploadBookingEvidence(bookingId: number, evidenceData: {
    evidenceType: string
    fileType: string
    fileUrl: string
    fileName: string
    mimeType?: string
    fileSizeBytes?: number
    description?: string
  }) {
    return this.request<{
      message: string
      evidence: {
        evidenceId: number
        bookingId: number
        uploadedByUserId: number
        uploaderName?: string
        uploaderRole?: string
        evidenceType: string
        fileType: string
        fileUrl: string
        fileName: string
        mimeType?: string
        fileSizeBytes?: number
        description?: string
        uploadedAt: string
      }
    }>(`/bookings/${bookingId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidenceData),
    })
  }

  /**
   * Delete evidence
   * @param evidenceId - The evidence ID to delete
   */
  async deleteBookingEvidence(evidenceId: number) {
    return this.request<{
      message: string
    }>(`/bookings/evidence/${evidenceId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Upload file to server (for evidence, avatars, etc.)
   * @param file - The file to upload
   * @param type - The type of upload (evidence, avatar, etc.)
   */
  async uploadFile(file: File, type: string = 'evidence') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await this.request<{
      success?: boolean
      data?: {
        fileUrl: string
        filePath?: string
        fileName: string
        fileSizeBytes: number
        mimeType: string
      }
      fileUrl?: string
      fileName?: string
      fileSizeBytes?: number
      mimeType?: string
    }>('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    })

    return this.unwrapData<{
      fileUrl: string
      filePath?: string
      fileName: string
      fileSizeBytes: number
      mimeType: string
    }>(response)
  }

  // ============================================================================
  // DISPUTE METHODS
  // ============================================================================

  /**
   * Create a new dispute for a booking
   * @param bookingId - The booking ID
   * @param disputeData - Dispute data
   */
  async createDispute(bookingId: number, disputeData: {
    disputeType: string
    title: string
    description: string
    requestedResolution?: string
    evidenceIds?: number[]
  }) {
    return this.request<{
      disputeId: number
      bookingId: number
      bookingStatus?: string
      filedByUserId: number
      filedByUserName: string
      filedByUserRole: string
      disputeType: string
      status: string
      title: string
      description: string
      requestedResolution?: string
      resolutionNotes?: string
      resolvedByUserId?: number
      resolvedByUserName?: string
      resolvedAt?: string
      messageCount: number
      evidenceCount: number
      createdAt: string
      updatedAt: string
    }>(`/customer/bookings/${bookingId}/disputes`, {
      method: 'POST',
      body: JSON.stringify(disputeData),
    })
  }

  /**
   * Get all disputes for a booking
   * @param bookingId - The booking ID
   */
  async getBookingDisputes(bookingId: number) {
    return this.request<{
      disputes: Array<{
        disputeId: number
        bookingId: number
        bookingStatus?: string
        filedByUserId: number
        filedByUserName: string
        filedByUserRole: string
        disputeType: string
        status: string
        title: string
        description: string
        requestedResolution?: string
        resolutionNotes?: string
        resolvedByUserId?: number
        resolvedByUserName?: string
        resolvedAt?: string
        messageCount: number
        evidenceCount: number
        createdAt: string
        updatedAt: string
      }>
      count: number
    }>(`/customer/bookings/${bookingId}/disputes`)
  }

  /**
   * Get a single dispute by ID
   * @param disputeId - The dispute ID
   */
  async getDisputeById(disputeId: number) {
    return this.request<{
      disputeId: number
      bookingId: number
      bookingStatus?: string
      filedByUserId: number
      filedByUserName: string
      filedByUserRole: string
      disputeType: string
      status: string
      title: string
      description: string
      requestedResolution?: string
      resolutionNotes?: string
      resolvedByUserId?: number
      resolvedByUserName?: string
      resolvedAt?: string
      messageCount: number
      evidenceCount: number
      createdAt: string
      updatedAt: string
    }>(`/customer/disputes/${disputeId}`)
  }

  /**
   * Add a message to a dispute thread
   * @param disputeId - The dispute ID
   * @param messageData - Message data
   */
  async addDisputeMessage(disputeId: number, messageData: {
    messageText: string
  }) {
    return this.request<{
      messageId: number
      disputeId: number
      senderUserId: number
      senderName: string
      senderRole: string
      messageText: string
      createdAt: string
    }>(`/customer/disputes/${disputeId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    })
  }

  /**
   * Get all messages for a dispute
   * @param disputeId - The dispute ID
   */
  async getDisputeMessages(disputeId: number) {
    return this.request<{
      messages: Array<{
        messageId: number
        disputeId: number
        senderUserId: number
        senderName: string
        senderRole: string
        messageText: string
        createdAt: string
      }>
      count: number
    }>(`/customer/disputes/${disputeId}/messages`)
  }

  /**
   * Attach evidence to a dispute
   * @param disputeId - The dispute ID
   * @param evidenceId - The evidence ID to attach
   */
  async attachEvidenceToDispute(disputeId: number, evidenceId: number) {
    return this.request<{
      message: string
      disputeId: string
      evidenceId: string
    }>(`/customer/disputes/${disputeId}/evidence/${evidenceId}`, {
      method: 'POST',
    })
  }

  /**
   * Get auto-generated estimation from backend
   * @param data - Estimation request data
   */
  async getAutoEstimations(data: {
    pickup_address: string
    delivery_address: string
    items: any[]
    pickup_floor?: number | null
    delivery_floor?: number | null
    has_elevator_pickup?: boolean
    has_elevator_delivery?: boolean
    pickup_datetime?: string
  }) {
    return this.request<{
      success: boolean
      estimations?: Array<{
        transport_id: number
        transport_name: string
        rating: number
        completed_jobs: number
        vehicle_id: number
        vehicle_type: string
        vehicle_name: string
        license_plate: string
        total_price: number
        estimated_duration: number
        rank_score: number
        breakdown: {
          base_price: number
          distance_price: number
          items_price: number
          floor_fees: number
          subtotal: number
          multiplier: number
        }
      }>
      price_range?: {
        lowest: number
        highest: number
        average: number
      }
      distance_km?: number
      estimated_weight_kg?: number
      recommended_vehicle_type?: string
      message?: string
      error?: string
    }>("/estimation/auto", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  /**
   * Export bookings as CSV
   * @param params - Export parameters (filters, sorting, etc.)
   */
  async exportBookingsAsCSV(params?: {
    startDate?: string
    endDate?: string
    status?: string
    transportId?: number
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.transportId) queryParams.append("transportId", params.transportId.toString())
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    const url = buildApiUrl(`/bookings/export/csv?${queryParams.toString()}`)
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "text/csv",
      },
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }

  /**
   * Export bookings as PDF (placeholder)
   */
  async exportBookingsAsPDF(params?: {
    startDate?: string
    endDate?: string
    status?: string
    transportId?: number
  }): Promise<Blob> {
    throw new Error("PDF export is not yet implemented. Please use CSV export instead.")
  }

  /**
   * Export bookings as Excel (placeholder)
   */
  async exportBookingsAsExcel(params?: {
    startDate?: string
    endDate?: string
    status?: string
    transportId?: number
  }): Promise<Blob> {
    throw new Error("Excel export is not yet implemented. Please use CSV export instead.")
  }

  // ============================================================================
  // COUNTER-OFFER METHODS
  // ============================================================================

  /**
   * Create a counter-offer for a quotation
   */
  async createCounterOffer(
    quotationId: number,
    request: Omit<CreateCounterOfferRequest, "quotationId">
  ): Promise<CounterOffer> {
    const url = buildApiUrl(`/customer/quotations/${quotationId}/counter-offers`)
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create counter-offer")
    }

    const data = await response.json()
    return data.counterOffer
  }

  /**
   * Get all counter-offers for a quotation
   */
  async getCounterOffersByQuotation(quotationId: number): Promise<CounterOffer[]> {
    const url = buildApiUrl(`/customer/quotations/${quotationId}/counter-offers`)
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch counter-offers")
    }

    const data = await response.json()
    return data.counterOffers
  }

  /**
   * Get a single counter-offer by ID
   */
  async getCounterOfferById(counterOfferId: number): Promise<CounterOffer> {
    const url = buildApiUrl(`/customer/quotations/counter-offers/${counterOfferId}`)
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch counter-offer")
    }

    const data = await response.json()
    return data.counterOffer
  }

  /**
   * Respond to a counter-offer (accept or reject)
   */
  async respondToCounterOffer(
    counterOfferId: number,
    request: RespondToCounterOfferRequest
  ): Promise<CounterOffer> {
    const url = buildApiUrl(`/customer/quotations/counter-offers/${counterOfferId}/respond`)
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to respond to counter-offer")
    }

    const data = await response.json()
    return data.counterOffer
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    action: string
    targetType: string
    targetId?: number
    details?: Record<string, any>
  }) {
    return this.request<void>("/audit-logs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance of API client
 */
export const apiClient = new ApiClient()




