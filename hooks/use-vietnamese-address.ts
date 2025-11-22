"use client"

import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import type { ProvinceOption, DistrictOption, WardOption } from "@/types"

/**
 * Fetches Vietnamese administrative divisions from backend.
 * Works with externally controlled province/district codes.
 */
export function useVietnameseAddress(provinceCode?: string, districtCode?: string) {
  const normalizedProvince = provinceCode?.trim() ?? ""
  const normalizedDistrict = districtCode?.trim() ?? ""

  const {
    data: provinces = [],
    isLoading: isLoadingProvinces,
    error: provincesError,
  } = useSWR<ProvinceOption[]>("locations/provinces", async () => {
    console.log("🌍 useVietnameseAddress: Fetching provinces...")
    const result = await apiClient.getProvinces()
    console.log("useVietnameseAddress: Provinces fetched:", result?.length || 0, "items")
    return result
  })

  const {
    data: districts = [],
    isLoading: isLoadingDistricts,
    error: districtsError,
  } = useSWR<DistrictOption[]>(
    normalizedProvince ? ["locations/districts", normalizedProvince] : null,
    () => apiClient.getDistricts(normalizedProvince),
    {
      keepPreviousData: true,
    },
  )

  const {
    data: wards = [],
    isLoading: isLoadingWards,
    error: wardsError,
  } = useSWR<WardOption[]>(
    normalizedDistrict ? ["locations/wards", normalizedDistrict] : null,
    () => apiClient.getWards(normalizedDistrict),
    {
      keepPreviousData: true,
    },
  )

  return {
    provinces,
    districts,
    wards,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards,
    provincesError,
    districtsError,
    wardsError,
    error: provincesError || districtsError || wardsError || null,
  }
}
