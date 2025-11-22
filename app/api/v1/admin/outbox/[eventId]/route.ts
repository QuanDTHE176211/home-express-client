import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return proxyBackend(request, `/admin/outbox/${eventId}`)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  return proxyBackend(request, `/admin/outbox/${eventId}`)
}

