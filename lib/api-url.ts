/**
 * API URL utilities
 *
 * Provides helpers to build consistent backend URLs without accidentally
 * duplicating path segments such as `/api/v1` or introducing double slashes.
 */

const DEFAULT_BASE_URL = "http://localhost:8084/api/v1"

/**
 * Normalised API base URL derived from `NEXT_PUBLIC_API_URL`.
 * Trailing slashes are trimmed to make path concatenation predictable.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "")

/**
 * Build a fully-qualified API URL from a path fragment.
 *
 * - Handles missing leading slash in `path`.
 * - Ignores work if `path` is already an absolute URL.
 *
 * @param path relative API path (e.g. `/transport/events`)
 * @returns absolute API URL pointing at the backend
 */
export function buildApiUrl(path: string): string {
  if (!path) {
    return API_BASE_URL
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseWithSlash = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`
  const normalisedPath = path.startsWith("/") ? path.slice(1) : path

  return new URL(normalisedPath, baseWithSlash).toString()
}
