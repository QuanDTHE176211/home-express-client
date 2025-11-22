"use client"

import { useEffect, useState } from "react"
import { fetchProvinceName, fetchDistrictName, fetchWardName } from "@/lib/location-cache"

interface LocationCodes {
  provinceCode?: string | null
  districtCode?: string | null
  wardCode?: string | null
}

interface LocationNames {
  provinceName: string
  districtName: string
  wardName: string
  isLoading: boolean
}

export function useLocationNames({ provinceCode, districtCode, wardCode }: LocationCodes): LocationNames {
  const [names, setNames] = useState({
    provinceName: "",
    districtName: "",
    wardName: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!provinceCode && !districtCode && !wardCode) {
        setNames({ provinceName: "", districtName: "", wardName: "" })
        return
      }

      setIsLoading(true)
      try {
        const [provinceName, districtName, wardName] = await Promise.all([
          fetchProvinceName(provinceCode),
          fetchDistrictName(provinceCode, districtCode),
          fetchWardName(districtCode, wardCode),
        ])

        if (!cancelled) {
          setNames({ provinceName, districtName, wardName })
        }
      } catch (error) {
        if (!cancelled) {
          setNames({ provinceName: "", districtName: "", wardName: "" })
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [provinceCode, districtCode, wardCode])

  return { ...names, isLoading }
}
