import { NextRequest, NextResponse } from "next/server"
import { mapFrontCandidateToBackend } from "@/app/api/_lib/intake"
import { requestBackend } from "@/app/api/_lib/backend"
import type { ItemCandidate } from "@/types"

type MergeRequestBody = {
  candidates?: unknown
}

export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  let parsedBody: MergeRequestBody
  try {
    parsedBody = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!Array.isArray(parsedBody.candidates) || parsedBody.candidates.length === 0) {
    return NextResponse.json({ error: "candidates array is required" }, { status: 400 })
  }

  const backendPayload = {
    candidates: parsedBody.candidates.map((candidate) =>
      mapFrontCandidateToBackend(candidate as ItemCandidate),
    ),
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
        data = { error: "Failed to merge intake items" }
      }
      return NextResponse.json(data, { status: backendResponse.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Intake merge proxy failed", error)
    return NextResponse.json({ error: "Unable to save intake items" }, { status: 502 })
  }
}
