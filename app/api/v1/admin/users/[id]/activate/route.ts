import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyBackend(request, `/admin/users/${params.id}/activate`)
}
