/**
 * Validation Utilities for Vietnamese Market
 *
 * Provides validation functions for phone, tax code, etc.
 */

/**
 * Validate Vietnamese phone number
 * Format: 0[1-9][0-9]{8}
 */
export function isValidPhone(phone: string): boolean {
  return /^0[1-9][0-9]{8}$/.test(phone)
}

/**
 * Validate Vietnamese tax code (MST)
 * Format: 10 digits
 */
export function isValidTaxCode(taxCode: string): boolean {
  return /^[0-9]{10}$/.test(taxCode)
}

/**
 * Calculate password strength (0-4)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[@$!%*?&#]/.test(password)) strength++
  return strength
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ["Rất yếu", "Yếu", "Trung bình", "Tốt", "Rất mạnh"]
  return labels[strength] || labels[0]
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"]
  return colors[strength] || colors[0]
}
