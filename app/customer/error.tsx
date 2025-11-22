"use client"

import { useEffect } from "react"

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto max-w-xl p-6 text-center">
      <h2 className="text-lg font-semibold">Đã có lỗi xảy ra</h2>
      <p className="text-sm text-muted-foreground my-2">{error.message}</p>
      <button onClick={() => reset()} className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-white">
        Thử lại
      </button>
    </div>
  )
}
