import { NextRequest, NextResponse } from "next/server"
import { requestBackend } from "@/app/api/_lib/backend"
import {
  mapDetectedToBackendCandidate,
  normalizeBackendCandidates,
} from "@/app/api/_lib/intake"
import type { DetectedItem } from "@/lib/types/scan"

type ItemsPayload = {
  items?: unknown
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  try {
    const backendResponse = await requestBackend(request, `/intake/session/${sessionId}`, {
      method: "GET",
    })

    const rawBody = await backendResponse.text()
    let data: any = {}
    if (rawBody) {
      try {
        data = JSON.parse(rawBody)
      } catch {
        data = { message: rawBody }
      }
    }

    if (!backendResponse.ok) {
      if (!data || typeof data !== "object") {
        data = { error: "Unable to load intake session items" }
      }
      return NextResponse.json(data, { status: backendResponse.status })
    }

    const candidates = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.candidates)
        ? data.candidates
        : []
    const items = normalizeBackendCandidates(sessionId, candidates)

    return NextResponse.json({ sessionId, items, count: items.length })
  } catch (error) {
    console.error("Failed to read scan session items", error)
    return NextResponse.json({ error: "Unable to load scan session items" }, { status: 502 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  let parsedBody: ItemsPayload
  try {
    parsedBody = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!Array.isArray(parsedBody.items) || parsedBody.items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 })
  }

  const detectedItems = parsedBody.items as DetectedItem[]
  const backendPayload = {
    candidates: detectedItems.map((item) => mapDetectedToBackendCandidate(item)),
  }

  try {
    const backendResponse = await requestBackend(
      request,
      `/intake/merge?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "POST",
        body: JSON.stringify(backendPayload),
        headers: { "Content-Type": "application/json" },
      },
    )

    const rawBody = await backendResponse.text()
    let data: any = {}
    if (rawBody) {
      try {
        data = JSON.parse(rawBody)
      } catch {
        data = { message: rawBody }
      }
    }

    if (!backendResponse.ok) {
      if (!data || typeof data !== "object") {
        data = { error: "Unable to save intake items" }
      }
      return NextResponse.json(data, { status: backendResponse.status })
    }

    return NextResponse.json({
      sessionId,
      itemCount: data.itemCount ?? backendPayload.candidates.length,
      message: data.message ?? "Items saved successfully",
    })
  } catch (error) {
    console.error("Failed to persist scan session items", error)
    return NextResponse.json({ error: "Unable to save scan session items" }, { status: 502 })
  }
}
