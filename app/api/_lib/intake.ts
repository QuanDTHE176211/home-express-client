import type { ItemCandidate } from "@/types"
import type { DetectedItem } from "@/lib/types/scan"

type BackendDimensions =
  | {
      widthCm?: number | null
      heightCm?: number | null
      depthCm?: number | null
      width_cm?: number | null
      height_cm?: number | null
      depth_cm?: number | null
    }
  | null
  | undefined

type BackendCandidate = {
  id?: string | null
  name?: string | null
  categoryId?: number | null
  categoryName?: string | null
  size?: string | null
  weightKg?: number | null
  dimensions?: BackendDimensions
  quantity?: number | null
  isFragile?: boolean | null
  requiresDisassembly?: boolean | null
  requiresPackaging?: boolean | null
  source?: string | null
  confidence?: number | null
  imageUrl?: string | null
  notes?: string | null
  metadata?: unknown
}

const DEFAULT_SIZE: DetectedItem["size"] = "M"

const SIZE_WEIGHTS: Record<NonNullable<DetectedItem["size"]>, number> = {
  S: 12,
  M: 28,
  L: 55,
}

const SIZE_VOLUMES: Record<NonNullable<DetectedItem["size"]>, number> = {
  S: 0.25,
  M: 0.48,
  L: 0.85,
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function extractDimensionValue(dimensions: BackendDimensions, key: "width" | "height" | "depth") {
  if (!dimensions) return null
  const camelKey = `${key.charAt(0)}${key.slice(1)}Cm` as const
  const snakeKey = `${key}_cm` as const
  const value =
    (dimensions as Record<typeof camelKey | typeof snakeKey, number | null | undefined>)[camelKey] ??
    (dimensions as Record<typeof camelKey | typeof snakeKey, number | null | undefined>)[snakeKey]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function computeVolume(
  dimensions: BackendDimensions,
  fallbackSize: DetectedItem["size"] | null | undefined,
): number {
  const width = extractDimensionValue(dimensions, "width")
  const height = extractDimensionValue(dimensions, "height")
  const depth = extractDimensionValue(dimensions, "depth")

  if (width && height && depth) {
    return round((width * height * depth) / 1_000_000, 3)
  }

  const size = (fallbackSize ?? DEFAULT_SIZE) as NonNullable<DetectedItem["size"]>
  return SIZE_VOLUMES[size] ?? SIZE_VOLUMES[DEFAULT_SIZE]
}

function computeWeight(
  weightKg: number | null | undefined,
  fallbackSize: DetectedItem["size"] | null | undefined,
): number {
  if (typeof weightKg === "number" && Number.isFinite(weightKg) && weightKg > 0) {
    return round(weightKg, 2)
  }

  const size = (fallbackSize ?? DEFAULT_SIZE) as NonNullable<DetectedItem["size"]>
  return SIZE_WEIGHTS[size] ?? SIZE_WEIGHTS[DEFAULT_SIZE]
}

function ensureSize(value: string | null | undefined): NonNullable<DetectedItem["size"]> {
  if (value === "S" || value === "M" || value === "L") {
    return value
  }
  return DEFAULT_SIZE
}

export function mapFrontCandidateToBackend(candidate: ItemCandidate) {
  return {
    id: candidate.id,
    name: candidate.name,
    categoryId: candidate.category_id ?? null,
    categoryName: candidate.category_name ?? null,
    size: candidate.size ?? DEFAULT_SIZE,
    weightKg: candidate.weight_kg ?? null,
    dimensions: candidate.dimensions
      ? {
          widthCm: candidate.dimensions.width_cm ?? null,
          heightCm: candidate.dimensions.height_cm ?? null,
          depthCm: candidate.dimensions.depth_cm ?? null,
        }
      : null,
    quantity: candidate.quantity ?? 1,
    isFragile: candidate.is_fragile ?? false,
    requiresDisassembly: candidate.requires_disassembly ?? false,
    requiresPackaging: candidate.requires_packaging ?? false,
    source: candidate.source ?? "manual",
    confidence: candidate.confidence ?? null,
    imageUrl: candidate.image_url ?? null,
    notes: candidate.notes ?? null,
    metadata: candidate.metadata ?? null,
  }
}

export function mapDetectedToBackendCandidate(item: DetectedItem) {
  const size = ensureSize(item.size)
  const weightKg = computeWeight(item.weight, size)
  let dimensions: { widthCm: number; heightCm: number; depthCm: number } | null = null

  if (item.volume && item.volume > 0) {
    const edgeMeters = Math.cbrt(item.volume)
    if (Number.isFinite(edgeMeters)) {
      const edgeCm = round(edgeMeters * 100, 1)
      dimensions = { widthCm: edgeCm, heightCm: edgeCm, depthCm: edgeCm }
    }
  }

  return {
    id: item.id,
    name: item.displayName || item.name || "Item",
    categoryId: null,
    categoryName: item.category ?? null,
    size,
    weightKg,
    dimensions,
    quantity: item.quantity ?? 1,
    isFragile: item.fragile ?? false,
    requiresDisassembly: item.needsDisassembly ?? false,
    requiresPackaging: false,
    source: "manual",
    confidence: item.confidence ?? 1,
    imageUrl: item.imageUrl ?? null,
    notes: null,
    metadata: null,
  }
}

export function mapBackendCandidateToDetected(
  sessionId: string,
  candidate: BackendCandidate,
): DetectedItem {
  const size = ensureSize(candidate.size)
  const weight = computeWeight(candidate.weightKg ?? null, size)
  const volume = computeVolume(candidate.dimensions, size)

  return {
    id: candidate.id ?? `candidate-${Date.now()}`,
    sessionId,
    name: candidate.name ?? candidate.categoryName ?? "Item",
    displayName: candidate.name ?? candidate.categoryName ?? "Item",
    category: candidate.categoryName ?? "unknown",
    size,
    quantity: candidate.quantity && candidate.quantity > 0 ? candidate.quantity : 1,
    weight,
    volume,
    fragile: candidate.isFragile ?? false,
    needsDisassembly: candidate.requiresDisassembly ?? false,
    confidence: candidate.confidence && candidate.confidence > 0 ? candidate.confidence : 1,
    imageUrl: candidate.imageUrl ?? undefined,
  }
}

export function normalizeBackendCandidates(
  sessionId: string,
  candidates: BackendCandidate[] | null | undefined,
): DetectedItem[] {
  if (!Array.isArray(candidates)) {
    return []
  }

  return candidates.map((candidate) => mapBackendCandidateToDetected(sessionId, candidate))
}
