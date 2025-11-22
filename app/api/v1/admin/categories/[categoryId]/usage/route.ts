import { type NextRequest } from "next/server"
import { proxyBackend } from "@/app/api/_lib/backend"

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  return proxyBackend(request, `/admin/categories/${params.categoryId}/usage`)
}
