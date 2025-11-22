"use client"

export type HttpInit = RequestInit & {
  timeoutMs?: number
  retries?: number
}

type HttpMethod = <T = any>(url: string, init?: Omit<HttpInit, "method">) => Promise<T>

type HttpClient = {
  <T = any>(url: string, init?: HttpInit): Promise<T>
  get: HttpMethod
  post: HttpMethod
  put: HttpMethod
  patch: HttpMethod
  delete: HttpMethod
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function baseRequest<T = any>(url: string, init: HttpInit = {}): Promise<T> {
  const { timeoutMs = 10000, retries = 0, ...rest } = init
  let lastErr: any

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...rest,
        credentials: "include",
        signal: ctrl.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status} ${text}`)
      }

      const ct = res.headers.get("content-type") || ""
      if (ct.includes("application/json")) {
        return (await res.json()) as T
      }

      const txt = await res.text()
      return (txt ? JSON.parse(txt) : {}) as T
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      if (attempt < retries) {
        await sleep(300 * (attempt + 1))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr
}

export const http = Object.assign(baseRequest, {
  get: <T = any>(url: string, init?: Omit<HttpInit, "method">) =>
    baseRequest<T>(url, { ...init, method: "GET" }),
  post: <T = any>(url: string, init?: Omit<HttpInit, "method">) =>
    baseRequest<T>(url, { ...init, method: "POST" }),
  put: <T = any>(url: string, init?: Omit<HttpInit, "method">) =>
    baseRequest<T>(url, { ...init, method: "PUT" }),
  patch: <T = any>(url: string, init?: Omit<HttpInit, "method">) =>
    baseRequest<T>(url, { ...init, method: "PATCH" }),
  delete: <T = any>(url: string, init?: Omit<HttpInit, "method">) =>
    baseRequest<T>(url, { ...init, method: "DELETE" }),
}) as HttpClient
