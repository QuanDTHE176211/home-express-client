export type ScanStatus =
  | "DRAFT"
  | "UPLOADING"
  | "PROCESSING"
  | "NEEDS_REVIEW"
  | "REVIEWED"
  | "QUOTED"
  | "BIDDING"
  | "DEPOSIT_PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export interface ScanSession {
  id: string
  userId: string
  status: ScanStatus
  mediaCount: number
  confidence: number
  createdAt: string
  updatedAt: string
}

export interface DetectedItem {
  id: string
  sessionId: string
  name: string
  displayName: string
  category: string
  size: "S" | "M" | "L"
  quantity: number
  weight: number
  volume: number
  fragile: boolean
  needsDisassembly: boolean
  confidence: number
  imageUrl?: string
}

export interface SSEEvent {
  type: "PROGRESS" | "STATUS" | "DETECTIONS_READY" | "QUOTE_READY" | "BIDS_UPDATE" | "JOB_STATUS" | "PAYMENT_STATUS"
  value?: any
  count?: number
  quote?: any
  bids?: any[]
}

export interface QuoteData {
  total: number
  breakdown: {
    basePrice: number
    laborCost: number
    vehicleCost: number
    packagingCost: number
    disassemblyCost: number
    fragileCost: number
  }
  vehicle: {
    type: string
    capacity: string
  }
  labor: {
    workers: number
    hours: number
  }
  estimatedDuration: string
}
