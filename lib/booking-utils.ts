import type { BookingStatus } from "@/types"

/**
 * Utility functions for booking state machine and business logic
 */

// Valid state transitions
const STATE_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["QUOTED", "CANCELLED"],
  QUOTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["REVIEWED"],
  REVIEWED: [],
  CANCELLED: [],
}

/**
 * Check if state transition is valid
 */
export function isValidStateTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
  return STATE_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

/**
 * Get status order for timeline
 */
export function getStatusOrder(status: BookingStatus): number {
  const order: Record<BookingStatus, number> = {
    PENDING: 1,
    QUOTED: 2,
    CONFIRMED: 3,
    IN_PROGRESS: 4,
    COMPLETED: 5,
    REVIEWED: 6,
    CANCELLED: 0,
  }
  return order[status] || 0
}

/**
 * Calculate cancellation fee based on booking status and scheduled time
 */
export function calculateCancellationFee(
  status: BookingStatus,
  finalPrice: number | null,
  scheduledDatetime: string | null,
): { refundAmount: number | null; cancellationFee: number | null } {
  // Free cancellation for PENDING or QUOTED
  if (status === "PENDING" || status === "QUOTED") {
    return { refundAmount: null, cancellationFee: null }
  }

  // Cannot cancel if IN_PROGRESS or COMPLETED
  if (status === "IN_PROGRESS" || status === "COMPLETED") {
    return { refundAmount: null, cancellationFee: null }
  }

  // CONFIRMED status - check time until scheduled
  if (status === "CONFIRMED" && finalPrice && scheduledDatetime) {
    const now = new Date()
    const scheduled = new Date(scheduledDatetime)
    const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntil > 24) {
      // More than 24h: 50% refund
      return {
        refundAmount: Math.floor(finalPrice * 0.5),
        cancellationFee: Math.floor(finalPrice * 0.5),
      }
    } else if (hoursUntil > 0) {
      // Less than 24h but before scheduled: No refund
      return {
        refundAmount: 0,
        cancellationFee: finalPrice,
      }
    }
  }

  return { refundAmount: null, cancellationFee: null }
}

/**
 * Check if booking can be cancelled
 */
export function canCancelBooking(status: BookingStatus): boolean {
  return ["PENDING", "QUOTED", "CONFIRMED"].includes(status)
}

/**
 * Check if quotation can be accepted
 */
export function canAcceptQuotation(bookingStatus: BookingStatus): boolean {
  return bookingStatus === "QUOTED"
}

/**
 * Check if job can be started
 */
export function canStartJob(bookingStatus: BookingStatus, isAssignedTransport: boolean): boolean {
  return bookingStatus === "CONFIRMED" && isAssignedTransport
}

/**
 * Check if job can be completed
 */
export function canCompleteJob(bookingStatus: BookingStatus): boolean {
  return bookingStatus === "IN_PROGRESS"
}

/**
 * Format location string from address components
 */
export function formatLocation(district: string | null, province: string | null): string {
  if (district && province) {
    return `${district}, ${province}`
  }
  return province || district || "Chưa xác định"
}

/**
 * Check if quotation is expired
 */
export function isQuotationExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false
  }
  const bufferMs = 5 * 60 * 1000 // 5 minutes
  const expiryTime = new Date(expiresAt).getTime()
  if (Number.isNaN(expiryTime)) {
    return false
  }
  return expiryTime - bufferMs < new Date().getTime()
}

/**
 * Calculate time remaining until expiration
 */
export function getTimeUntilExpiration(expiresAt: string | null | undefined): string {
  if (!expiresAt) {
    return "Không xác định"
  }
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (Number.isNaN(diff)) {
    return "Không xác định"
  }

  if (diff <= 0) return "Đã hết hạn"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
