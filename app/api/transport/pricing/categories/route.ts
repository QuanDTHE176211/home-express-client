import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(request: NextRequest) {
  return proxyBackend(request, `/transport/pricing/categories${request.nextUrl.search}`)
}

export async function POST(request: NextRequest) {
  return proxyBackend(request, "/transport/pricing/categories")
}

