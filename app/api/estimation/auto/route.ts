import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function POST(request: NextRequest) {
  return proxyBackend(request, "/estimation/auto")
}

