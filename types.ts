export interface CategoryWithSizes {
  category_id: number
  name: string
  name_en: string | null
  icon: string | null
  description?: string | null
  default_weight_kg: number | null
  default_volume_m3: number | null
  default_length_cm?: number | null
  default_width_cm?: number | null
  default_height_cm?: number | null
  is_fragile_default?: boolean
  requires_disassembly_default?: boolean
  is_active: boolean
  display_order: number | null
  [key: string]: any
}

export interface ItemCandidate {
  id: string
  name: string
  category_id: number | null
  category_name: string | null
  size: "S" | "M" | "L" | null
  weight_kg: number | null
  dimensions: any | null
  quantity: number
  is_fragile: boolean
  requires_disassembly: boolean
  requires_packaging: boolean
  source: string
  confidence: number | null
  image_url: string | null
  notes: string | null
  metadata: any | null
  [key: string]: any
}

export interface BookingEvidence {
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

export type DisputeStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED"
  | string

export type DisputeType =
  | "PRICING_DISPUTE"
  | "DAMAGE_CLAIM"
  | "SERVICE_QUALITY"
  | "DELIVERY_ISSUE"
  | "PAYMENT_ISSUE"
  | "OTHER"
  | string

export interface Dispute {
  disputeId: number
  bookingId: number
  status: DisputeStatus
  disputeType: string
  title: string
  description: string
  requestedResolution?: string
  filedByUserName: string
  filedByUserRole: string
  createdAt: string
  updatedAt: string
  messageCount: number
  evidenceCount: number
  resolutionNotes?: string
  resolvedByUserName?: string
  resolvedAt?: string
  [key: string]: any
}

export interface DisputeMessage {
  messageId: number
  disputeId: number
  senderUserId: number
  senderName: string
  senderRole: string
  messageText: string
  createdAt: string
  [key: string]: any
}

export interface CounterOffer {
  counterOfferId: number
  quotationId: number
  originalPrice: number
  offeredPrice: number
  priceDifference: number
  percentageChange: number
  reason?: string
  message?: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "SUPERSEDED"
  offeredByUserName: string
  createdAt: string
  expiresAt: string
  isExpired: boolean
  hoursUntilExpiration?: number
  canRespond: boolean
  respondedAt?: string
  respondedByUserName?: string
  responseMessage?: string
}

export type BookingStatus = string

export type ExceptionPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW"
export type ExceptionStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED"

export interface ExceptionWithDetails {
  exception_id: number
  title: string
  type: string
  description: string
  status: ExceptionStatus
  priority: ExceptionPriority
  resolution_notes?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by_name?: string
  assigned_to_name?: string
  metadata?: any
  incident_id?: number
  booking_info?: {
    booking_id: number
    customer_name: string
    transport_name?: string
    pickup_location: string
    delivery_location: string
  }
  [key: string]: any
}

export interface Customer {
  customerId: number
  fullName: string
  phone: string
  address: string | null
  dateOfBirth: string | null
  avatarUrl: string | null
  preferredLanguage: string
  createdAt: string
  updatedAt: string
  [key: string]: any
}

export interface Manager {
  managerId: number
  fullName: string
  phone: string
  employeeId: string | null
  department: string | null
  permissions: string[] | null
  createdAt: string
  updatedAt: string
  [key: string]: any
}

export interface AdminDashboardStats {
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
  userGrowthRate: number
  pendingTransportVerifications: number
  topTransports: Array<{
    transportId: number
    companyName: string
    averageRating: number
    completedBookings: number
  }>
}

export interface User {
  userId: number
  user_id?: number
  email: string
  fullName?: string // UserInfo in backend doesn't have fullName, but frontend uses it. Let's keep it optional or map it if possible. Backend UserInfo has email, isActive, isVerified. The User entity has fullName.
  role: "CUSTOMER" | "TRANSPORT" | "MANAGER" // UserInfo doesn't have role? Wait, TransportWithUser response has UserInfo which has: userId, email, isActive, isVerified, createdAt. It MISSING role and fullName.
  avatarUrl?: string | null
  phone?: string | null
  isActive?: boolean
  is_active?: boolean
  isVerified?: boolean
  is_verified?: boolean
  createdAt?: string
  [key: string]: any
}

export interface Transport {
  transportId: number
  companyName: string
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED"
  businessLicenseNumber?: string
  taxCode?: string
  phone?: string
  address?: string
  district?: string
  city?: string
  nationalIdType?: string
  nationalIdNumber?: string
  bankAccountNumber?: string
  bankCode?: string
  bankName?: string
  bankAccountHolder?: string
  licensePhotoUrl?: string
  insurancePhotoUrl?: string
  nationalIdPhotoFrontUrl?: string
  nationalIdPhotoBackUrl?: string
  verifiedAt?: string
  verificationNotes?: string
  verifiedBy?: number
  totalBookings?: number
  completedBookings?: number
  averageRating?: number | null
  createdAt?: string
  [key: string]: any
}

export interface ScanSessionWithCustomer {
  session_id: number
  customer_name: string
  customer_email: string
  customer_avatar: string | null
  image_count: number
  average_confidence: number | null
  items?: any[]
  created_at: string
  status: string
  forced_quote_price?: number | null
  image_urls: string[]
  estimated_price?: number | null
}

export interface Notification {
  notification_id: number
  user_id: number
  type: string
  title: string
  message: string
  booking_id: number | null
  quotation_id: number | null
  review_id: number | null
  data: any
  is_read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
  expires_at: string | null
}

export interface ProvinceOption {
  code: string
  name: string
  value?: string
  label?: string
  [key: string]: any
}

export interface DistrictOption {
  code: string
  name: string
  province_code?: string
  value?: string
  label?: string
  [key: string]: any
}

export interface WardOption {
  code: string
  name: string
  district_code?: string
  value?: string
  label?: string
  [key: string]: any
}

export type VehicleType = string

export interface VehiclePricing {
  base_price: number
  per_km_first_4km: number
  per_km_5_to_40km: number
  per_km_after_40km: number
  peak_hour_multiplier: number
  weekend_multiplier: number
  holiday_multiplier: number
  no_elevator_fee: number
  elevator_discount?: number
  [key: string]: any
}

export interface CategoryPricing {
  category_id?: number
  price_per_unit: number
  fragile_multiplier?: number
  disassembly_multiplier?: number
  heavy_multiplier?: number
  [key: string]: any
}

export type BookingItem = {
  item_id?: number
  name?: string
  quantity: number
  weight?: number
  volume?: number
  category_id?: number
  is_fragile?: boolean
  requires_disassembly?: boolean
  [key: string]: any
}

export type Vehicle = {
  vehicleId?: number
  vehicle_id?: number
  model: string
  license_plate: string
  vehicleType?: string
  capacityKg?: number
  capacity_kg?: number
  capacity_m3?: number
  status?: string
  pricing?: VehiclePricing
  [key: string]: any
}

export interface Booking {
  [key: string]: any
}

export interface BookingListItem {
  [key: string]: any
}

export interface BookingStatusHistory {
  status: BookingStatus
  changedAt?: string
  [key: string]: any
}

export interface BookingDetail {
  booking: Booking
  [key: string]: any
}

export interface BookingDetailResponse {
  booking: Booking
  quotation?: any
  statusHistory?: BookingStatusHistory[]
  payments?: any[]
  [key: string]: any
}

export type PaymentMethod = string

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | string

export interface BankInfo {
  bankCode?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  [key: string]: any
}

export interface Quotation {
  [key: string]: any
}

export interface QuotationDetail {
  [key: string]: any
}

export interface QuotationSummary {
  [key: string]: any
}

export interface Bid {
  [key: string]: any
}

export interface AvailableBooking {
  [key: string]: any
}

export interface SubmitQuotationRequest {
  [key: string]: any
}

export interface CreateBookingRequest {
  [key: string]: any
}

export interface CreateBookingResponse {
  [key: string]: any
}

export interface CreateCounterOfferRequest {
  [key: string]: any
}

export interface RespondToCounterOfferRequest {
  [key: string]: any
}

export interface PerformanceMetrics {
  acceptance_rate: number
  acceptance_rate_change: number
  avg_response_time_minutes: number
  response_time_change: number
  customer_satisfaction: number
  satisfaction_change: number
  on_time_delivery_rate: number
  on_time_change: number
  completion_rate: number
  completion_change: number
  revenue_per_job: number
  revenue_change: number
  total_jobs: number
  jobs_change: number
  active_vehicles: number
  [key: string]: any
}

export interface PerformanceTrend {
  date: string
  jobs_completed: number
  acceptance_rate: number
  avg_response_time: number
  revenue: number
  satisfaction_score: number
  [key: string]: any
}

export interface CategoryPerformance {
  category: string
  jobs: number
  revenue: number
  avg_rating: number
  [key: string]: any
}

export interface VehicleUtilization {
  vehicle_name: string
  utilization_rate: number
  jobs_completed: number
  revenue: number
  [key: string]: any
}

export interface CustomerStats {
  [key: string]: any
}

export interface TransportStats {
  [key: string]: any
}

export interface EarningsStats {
  [key: string]: any
}

export interface Transaction {
  [key: string]: any
}

export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING" | "FLEXIBLE" | string

export interface ReviewWithDetails {
  [key: string]: any
}

export type ReviewRating = number

export type EvidenceType = string

export type FileType = string

export type ExportFormat = "CSV" | "PDF" | "EXCEL" | string

export type OCRResult = {
  [key: string]: any
}

export type IncidentType = string

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string
