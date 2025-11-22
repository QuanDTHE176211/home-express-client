import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function POST(request: NextRequest, { params }: { params: Promise<{ bidId: string }> }) {
  const { bidId } = await params
  return proxyBackend(request, `/admin/bids/${bidId}/reject`)
}

