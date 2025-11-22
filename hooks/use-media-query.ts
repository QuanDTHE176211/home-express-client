"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const getMatches = (q: string) => (typeof window !== "undefined" ? window.matchMedia(q).matches : false)
  const [matches, setMatches] = useState<boolean>(() => getMatches(query))

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)

    media.addEventListener("change", onChange)
    // Defer initial sync to avoid synchronous setState in effect body
    const id = setTimeout(onChange, 0)

    return () => {
      clearTimeout(id)
      media.removeEventListener("change", onChange)
    }
  }, [query])

  return matches
}
