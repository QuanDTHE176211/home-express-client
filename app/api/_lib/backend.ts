import { NextRequest, NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/api-url"

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
])

export type ProxyInit = {
  method?: string
  body?: BodyInit | null
  headers?: HeadersInit
}

function mergeHeaders(request: NextRequest, overrides?: HeadersInit) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return
    if (lower === "content-length") return
    headers.set(key, value)
  })

  if (overrides) {
    new Headers(overrides).forEach((value, key) => {
      headers.set(key, value)
    })
  }

  return headers
}

function shouldIncludeBody(method: string) {
  const upper = method.toUpperCase()
  return upper !== "GET" && upper !== "HEAD"
}

export async function requestBackend(
  request: NextRequest,
  path: string,
  init: ProxyInit = {},
) {
  const targetUrl = buildApiUrl(path)
  const method = init.method ?? request.method
  let body = init.body ?? null

  if (body === null && shouldIncludeBody(method)) {
    const buffer = await request.arrayBuffer()
    if (buffer.byteLength > 0) {
      body = buffer
    }
  }

  const headers = mergeHeaders(request, init.headers)

  return fetch(targetUrl, {
    method,
    headers,
    body: body ?? undefined,
    cache: "no-store",
    redirect: "manual",
  })
}

export async function proxyBackend(request: NextRequest, path: string, init: ProxyInit = {}) {
  try {
    const backendResponse = await requestBackend(request, path, init)

    const responseHeaders = new Headers()
    backendResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding" && value.toLowerCase() === "chunked") {
        return
      }
      responseHeaders.append(key, value)
    })

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Proxy to backend failed", error)
    return NextResponse.json(
      { success: false, error: "Unable to reach backend service" },
      { status: 502 },
    )
  }
}
