import { apiClient } from "@/lib/api-client"
import type { ProvinceOption, DistrictOption, WardOption } from "@/types"

const provinceCache = new Map<string, ProvinceOption>()
const districtCache = new Map<string, DistrictOption>()
const wardCache = new Map<string, WardOption>()

let provincesPromise: Promise<void> | null = null
const districtPromises = new Map<string, Promise<void>>() // key: province code
const wardPromises = new Map<string, Promise<void>>() // key: district code

const hasWindow = () => typeof window !== "undefined"

const normalizeCode = (code?: string | null) => (code ? code.trim() : "")

async function ensureProvincesLoaded() {
  if (!hasWindow()) return
  if (!provincesPromise) {
    provincesPromise = apiClient
      .getProvinces()
      .then((list) => {
        list.forEach((province) => {
          provinceCache.set(province.code, province)
        })
      })
      .catch((error) => {
        provincesPromise = null
        console.error("Failed to load provinces", error)
        throw error
      })
  }
  await provincesPromise
}

async function ensureDistrictsLoaded(provinceCode: string) {
  if (!hasWindow()) return
  if (!districtPromises.has(provinceCode)) {
    const promise = apiClient
      .getDistricts(provinceCode)
      .then((list) => {
        list.forEach((district) => {
          districtCache.set(district.code, district)
        })
      })
      .catch((error) => {
        districtPromises.delete(provinceCode)
        console.error(`Failed to load districts for province ${provinceCode}`, error)
        throw error
      })
    districtPromises.set(provinceCode, promise)
  }
  await districtPromises.get(provinceCode)
}

async function ensureWardsLoaded(districtCode: string) {
  if (!hasWindow()) return
  if (!wardPromises.has(districtCode)) {
    const promise = apiClient
      .getWards(districtCode)
      .then((list) => {
        list.forEach((ward) => {
          wardCache.set(ward.code, ward)
        })
      })
      .catch((error) => {
        wardPromises.delete(districtCode)
        console.error(`Failed to load wards for district ${districtCode}`, error)
        throw error
      })
    wardPromises.set(districtCode, promise)
  }
  await wardPromises.get(districtCode)
}

export async function fetchProvinceName(code?: string | null): Promise<string> {
  const normalized = normalizeCode(code)
  if (!normalized) return ""

  if (!provinceCache.has(normalized)) {
    await ensureProvincesLoaded()
  }

  return provinceCache.get(normalized)?.name ?? ""
}

export async function fetchDistrictName(
  provinceCode?: string | null,
  districtCode?: string | null,
): Promise<string> {
  const normalizedDistrict = normalizeCode(districtCode)
  if (!normalizedDistrict) return ""

  if (!districtCache.has(normalizedDistrict)) {
    const normalizedProvince = normalizeCode(provinceCode)
    if (normalizedProvince) {
      await ensureDistrictsLoaded(normalizedProvince)
    }
  }

  return districtCache.get(normalizedDistrict)?.name ?? ""
}

export async function fetchWardName(districtCode?: string | null, wardCode?: string | null): Promise<string> {
  const normalizedWard = normalizeCode(wardCode)
  if (!normalizedWard) return ""

  if (!wardCache.has(normalizedWard)) {
    const normalizedDistrict = normalizeCode(districtCode)
    if (normalizedDistrict) {
      await ensureWardsLoaded(normalizedDistrict)
    }
  }

  return wardCache.get(normalizedWard)?.name ?? ""
}
