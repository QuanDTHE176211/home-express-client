/**
 * Validation Utilities Module
 *
 * Provides validation functions for Vietnamese market-specific requirements
 * including phone numbers, emails, passwords, and formatting utilities.
 *
 * @module lib/validators
 */

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates Vietnamese phone number format
 *
 * Vietnamese phone numbers must:
 * - Start with 0
 * - Followed by exactly 9 digits
 * - Total length: 10 digits
 *
 * @param phone - Phone number string to validate
 * @returns true if valid Vietnamese phone number, false otherwise
 *
 * @example
 * validateVietnamesePhone("0912345678") // true
 * validateVietnamesePhone("912345678")  // false (missing leading 0)
 * validateVietnamesePhone("09123456")   // false (too short)
 */
export function validateVietnamesePhone(phone: string): boolean {
  // Regex: ^0 (starts with 0) + \d{9} (exactly 9 more digits) + $ (end)
  const phoneRegex = /^0\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * Validates email address format
 *
 * Checks for basic email structure: local@domain.tld
 *
 * @param email - Email address string to validate
 * @returns true if valid email format, false otherwise
 *
 * @example
 * validateEmail("user@example.com")     // true
 * validateEmail("invalid.email")        // false
 * validateEmail("user@domain")          // false (missing TLD)
 */
export function validateEmail(email: string): boolean {
  // Basic email regex: local part + @ + domain + . + TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength with enhanced security requirements
 *
 * Password requirements:
 * - Minimum 10 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Cannot contain username or email
 * - Cannot have more than 3 consecutive repeating characters
 *
 * @param password - Password string to validate
 * @param username - Optional username/email to check against
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validatePassword("Pass1234!")           // { isValid: true }
 * validatePassword("password")            // { isValid: false, error: "..." }
 * validatePassword("Pass1234", "pass")    // { isValid: false, error: "..." }
 */
export function validatePassword(password: string, username?: string): { isValid: boolean; error?: string } {
  if (password.length < 10) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 10 ký tự" }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 1 chữ hoa" }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 1 chữ thường" }
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 1 chữ số" }
  }

  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    return { isValid: false, error: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)" }
  }

  if (username) {
    const usernameLower = username.toLowerCase()
    const passwordLower = password.toLowerCase()
    const emailPrefix = usernameLower.split("@")[0]

    if (passwordLower.includes(usernameLower) || passwordLower.includes(emailPrefix)) {
      return { isValid: false, error: "Mật khẩu không được chứa tên đăng nhập hoặc email" }
    }
  }

  if (/(.)\1{3,}/.test(password)) {
    return { isValid: false, error: "Mật khẩu không được có quá 3 ký tự giống nhau liên tiếp" }
  }

  return { isValid: true }
}

/**
 * Gets password strength level and score
 *
 * @param password - Password string to evaluate
 * @returns Object with strength level (weak/medium/strong) and score (0-100)
 *
 * @example
 * getPasswordStrength("Pass1234!")  // { level: "strong", score: 85 }
 * getPasswordStrength("pass123")    // { level: "weak", score: 30 }
 */
export function getPasswordStrength(password: string): {
  level: "weak" | "medium" | "strong"
  score: number
} {
  let score = 0

  // Length scoring
  if (password.length >= 10) score += 20
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/\d/.test(password)) score += 15
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score += 15

  // Bonus for multiple special chars or numbers
  const specialCount = (password.match(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/g) || []).length
  const numberCount = (password.match(/\d/g) || []).length
  if (specialCount >= 2) score += 5
  if (numberCount >= 2) score += 5

  // Penalty for repeating characters
  if (/(.)\1{2,}/.test(password)) score -= 10

  // Determine level
  let level: "weak" | "medium" | "strong"
  if (score >= 70) level = "strong"
  else if (score >= 50) level = "medium"
  else level = "weak"

  return { level, score: Math.max(0, Math.min(100, score)) }
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats number as Vietnamese currency (VND)
 *
 * Uses Vietnamese locale formatting with proper currency symbol
 *
 * @param amount - Numeric amount to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 *
 * @example
 * formatVND(1000000)  // "1.000.000 ₫"
 * formatVND(500)      // "500 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

/**
 * Formats date in Vietnamese format (DD/MM/YYYY)
 *
 * @param date - Date object or ISO date string
 * @returns Formatted date string (e.g., "25/12/2024")
 *
 * @example
 * formatVietnameseDate(new Date())           // "25/12/2024"
 * formatVietnameseDate("2024-12-25")         // "25/12/2024"
 */
export function formatVietnameseDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}
