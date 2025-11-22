import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return proxyBackend(request, `/admin/bids/session/${sessionId}`)
}

