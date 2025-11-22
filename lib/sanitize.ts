/**
 * Sanitize user input to prevent XSS attacks
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "")

  // Limit length to prevent DoS
  const MAX_LENGTH = 10000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  return sanitized
}

/**
 * Sanitize string for form submission (includes trimming)
 */
export function sanitizeStringForSubmission(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "")

  // Trim whitespace for submission
  sanitized = sanitized.trim()

  // Limit length to prevent DoS
  const MAX_LENGTH = 10000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  return sanitized
}

/**
 * Sanitize phone number - only allow digits, spaces, +, -, ()
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s+\-()]/g, "")
}

/**
 * Sanitize email - basic validation and sanitization
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize URL - ensure it's a valid HTTP/HTTPS URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return ""
    }
    return parsed.toString()
  } catch {
    return ""
  }
}

/**
 * Sanitize file name - remove path traversal attempts
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  let sanitized = fileName.replace(/[/\\.\0]/g, "_")

  // Remove leading/trailing spaces and dots
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "")

  // Limit length
  const MAX_LENGTH = 255
  if (sanitized.length > MAX_LENGTH) {
    const ext = sanitized.split(".").pop()
    const name = sanitized.substring(0, MAX_LENGTH - (ext ? ext.length + 1 : 0))
    sanitized = ext ? `${name}.${ext}` : name
  }

  return sanitized || "unnamed"
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: string | number): number {
  const num = typeof input === "string" ? Number.parseFloat(input) : input
  return isNaN(num) ? 0 : num
}
