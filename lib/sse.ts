"use client"

import { useEffect, useRef, useState } from "react"

export function useSSE(url: string | null, onMessage?: (data: any) => void) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const retryRef = useRef(0)

  useEffect(() => {
    if (!url) return

    let es: EventSource | null = null
    let closed = false

    const connect = () => {
      es = new EventSource(url, { withCredentials: true } as any)

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          setData(parsed)
          onMessage?.(parsed)
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to parse SSE message", err)
          }
        }
      }

      es.onerror = () => {
        setError(new Error("SSE connection error"))
        if (closed) return
        es?.close()
        const delay = Math.min(1000 * (retryRef.current + 1), 10000)
        setTimeout(connect, delay)
        retryRef.current += 1
      }
    }

    connect()

    return () => {
      closed = true
      es?.close()
    }
  }, [url, onMessage])

  return { data, error }
}
