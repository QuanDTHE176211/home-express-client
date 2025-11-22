import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(request: NextRequest) {
  // Admin users endpoint - proxy directly as backend now matches frontend expectations
  return proxyBackend(request, `/admin/users${request.nextUrl.search}`)
}
