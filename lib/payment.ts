"use client"

import { useEffect, useState } from "react"
import { http } from "@/lib/http"

export type PaymentStatus = "PENDING" | "REQUIRES_ACTION" | "CANCELLED" | "FAILED" | "DEPOSIT_PAID"

export function usePaymentStatus(sessionId: number, paymentId?: string) {
  const [status, setStatus] = useState<PaymentStatus>("PENDING")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function tick() {
      try {
        const s = await http<{ status: PaymentStatus }>(`/api/payments/${paymentId || sessionId}/status`, {
          timeoutMs: 8000,
        })
        if (!mounted) return
        setStatus(s.status)
      } catch (e: any) {
        if (!mounted) return
        setError(e.message)
      }
    }

    tick()
    const id = setInterval(tick, 2500)

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [sessionId, paymentId])

  return { status, error }
}
