/**
 * Formatting Utilities for Vietnamese Market
 *
 * Provides currency, phone, date formatting functions
 */

import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

/**
 * Format number as Vietnamese currency (VND)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Format: 0901234567 -> 090 123 4567
  if (phone.length === 10) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
  }
  return phone
}

/**
 * Format date for Vietnamese locale
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date

  if (includeTime) {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: vi,
  })
}
