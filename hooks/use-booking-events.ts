"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"

export interface BookingEvent {
  type: string
  message: string
  timestamp: string
  data?: any
}

export interface BookingStatusChangeEvent {
  bookingId: number
  oldStatus: string
  newStatus: string
  message: string
}

export interface NewQuotationEvent {
  bookingId: number
  quotationId: number
  transportId: number
  transportName: string
  priceVnd: number
}

export interface PaymentUpdateEvent {
  bookingId: number
  paymentId: number
  paymentType: string
  amountVnd: number
  status: string
}

export interface TransportAssignmentEvent {
  bookingId: number
  transportId: number
  transportName: string
  contactPhone: string
}

export interface DisputeUpdateEvent {
  disputeId: number
  bookingId: number
  eventType: "dispute_created" | "dispute_status_changed" | "dispute_message_added"
  message: string
}

export interface CounterOfferEvent {
  bookingId: number
  counterOfferId: number
  action: "created" | "accepted" | "rejected"
}

export interface UseBookingEventsOptions {
  bookingId: number | null
  onStatusChange?: (event: BookingStatusChangeEvent) => void
  onNewQuotation?: (event: NewQuotationEvent) => void
  onPaymentUpdate?: (event: PaymentUpdateEvent) => void
  onTransportAssignment?: (event: TransportAssignmentEvent) => void
  onDisputeUpdate?: (event: DisputeUpdateEvent) => void
  onCounterOfferUpdate?: (event: CounterOfferEvent) => void
  showToasts?: boolean
  autoReconnect?: boolean
}

export function useBookingEvents({
  bookingId,
  onStatusChange,
  onNewQuotation,
  onPaymentUpdate,
  onTransportAssignment,
  onDisputeUpdate,
  onCounterOfferUpdate,
  showToasts = true,
  autoReconnect = true,
}: UseBookingEventsOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastEvent, setLastEvent] = useState<BookingEvent | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 10
  const closedRef = useRef(false)

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback(() => {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxDelay)
    return delay
  }, [])

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!bookingId || closedRef.current) return

    const url = `/api/v1/customer/bookings/${bookingId}/events`
    
    try {
      const es = new EventSource(url, { withCredentials: true } as any)
      eventSourceRef.current = es

      // Connection opened
      es.addEventListener("connected", (event) => {
        setIsConnected(true)
        setError(null)
        retryCountRef.current = 0
        
        try {
          const data = JSON.parse(event.data)
          console.log("[SSE] Connected to booking events:", data)
        } catch (err) {
          console.error("[SSE] Failed to parse connected event:", err)
        }
      })

      // Booking status changed
      es.addEventListener("booking:status_changed", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)
          
          if (parsed.data) {
            const statusEvent: BookingStatusChangeEvent = parsed.data
            onStatusChange?.(statusEvent)
            
            if (showToasts) {
              toast.success("Trạng thái đơn hàng đã thay đổi", {
                description: parsed.message || `Trạng thái mới: ${statusEvent.newStatus}`,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse status change event:", err)
        }
      })

      // New quotation received
      es.addEventListener("booking:quotation_received", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)
          
          if (parsed.data) {
            const quotationEvent: NewQuotationEvent = parsed.data
            onNewQuotation?.(quotationEvent)
            
            if (showToasts) {
              toast.info("Báo giá mới", {
                description: `${quotationEvent.transportName} đã gửi báo giá: ${quotationEvent.priceVnd.toLocaleString('vi-VN')} VND`,
                duration: 5000,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse quotation event:", err)
        }
      })

      // Payment completed
      es.addEventListener("booking:payment_completed", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)
          
          if (parsed.data) {
            const paymentEvent: PaymentUpdateEvent = parsed.data
            onPaymentUpdate?.(paymentEvent)
            
            if (showToasts) {
              const paymentTypeText = paymentEvent.paymentType === "DEPOSIT" 
                ? "Đặt cọc" 
                : paymentEvent.paymentType === "REMAINING_PAYMENT"
                ? "Thanh toán phần còn lại"
                : "Thanh toán"
              
              toast.success(`${paymentTypeText} thành công`, {
                description: `Số tiền: ${paymentEvent.amountVnd.toLocaleString('vi-VN')} VND`,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse payment event:", err)
        }
      })

      // Transport assigned
      es.addEventListener("booking:transport_assigned", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const transportEvent: TransportAssignmentEvent = parsed.data
            onTransportAssignment?.(transportEvent)

            if (showToasts) {
              toast.success("Đã chọn nhà vận chuyển", {
                description: `${transportEvent.transportName} - ${transportEvent.contactPhone}`,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse transport assignment event:", err)
        }
      })

      // Dispute created
      es.addEventListener("dispute_created", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const disputeEvent: DisputeUpdateEvent = parsed.data
            onDisputeUpdate?.(disputeEvent)

            if (showToasts) {
              toast.info("New Dispute Filed", {
                description: parsed.message || "A new dispute has been filed for this booking",
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse dispute created event:", err)
        }
      })

      // Dispute status changed
      es.addEventListener("dispute_status_changed", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const disputeEvent: DisputeUpdateEvent = parsed.data
            onDisputeUpdate?.(disputeEvent)

            if (showToasts) {
              toast.info("Dispute Status Updated", {
                description: parsed.message || "A dispute status has been updated",
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse dispute status changed event:", err)
        }
      })

      // Dispute message added
      es.addEventListener("dispute_message_added", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const disputeEvent: DisputeUpdateEvent = parsed.data
            onDisputeUpdate?.(disputeEvent)

            if (showToasts) {
              toast.info("New Dispute Message", {
                description: parsed.message || "A new message has been added to a dispute",
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse dispute message added event:", err)
        }
      })

      // Counter-offer created
      es.addEventListener("counter_offer:created", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const counterOfferEvent: CounterOfferEvent = parsed.data
            onCounterOfferUpdate?.(counterOfferEvent)

            if (showToasts) {
              toast.info("Đề xuất giá mới", {
                description: "Một đề xuất giá mới đã được tạo",
                duration: 5000,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse counter-offer created event:", err)
        }
      })

      // Counter-offer accepted
      es.addEventListener("counter_offer:accepted", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const counterOfferEvent: CounterOfferEvent = parsed.data
            onCounterOfferUpdate?.(counterOfferEvent)

            if (showToasts) {
              toast.success("Đề xuất giá được chấp nhận", {
                description: "Đề xuất giá đã được chấp nhận",
                duration: 5000,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse counter-offer accepted event:", err)
        }
      })

      // Counter-offer rejected
      es.addEventListener("counter_offer:rejected", (event) => {
        try {
          const parsed: BookingEvent = JSON.parse(event.data)
          setLastEvent(parsed)

          if (parsed.data) {
            const counterOfferEvent: CounterOfferEvent = parsed.data
            onCounterOfferUpdate?.(counterOfferEvent)

            if (showToasts) {
              toast.error("Đề xuất giá bị từ chối", {
                description: "Đề xuất giá đã bị từ chối",
                duration: 5000,
              })
            }
          }
        } catch (err) {
          console.error("[SSE] Failed to parse counter-offer rejected event:", err)
        }
      })

      // Heartbeat (keep-alive)
      es.addEventListener("heartbeat", (event) => {
        // Silent heartbeat, just log in dev mode
        if (process.env.NODE_ENV !== "production") {
          console.log("[SSE] Heartbeat received")
        }
      })

      // Connection error
      es.onerror = (err) => {
        console.error("[SSE] Connection error:", err)
        setIsConnected(false)
        setError(new Error("SSE connection error"))
        
        es.close()
        eventSourceRef.current = null

        // Retry with exponential backoff
        if (autoReconnect && !closedRef.current && retryCountRef.current < maxRetries) {
          const delay = getRetryDelay()
          retryCountRef.current += 1
          
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`)
          
          setTimeout(() => {
            if (!closedRef.current) {
              connect()
            }
          }, delay)
        } else if (retryCountRef.current >= maxRetries) {
          console.error("[SSE] Max retries reached, giving up")
          if (showToasts) {
            toast.error("Mất kết nối", {
              description: "Không thể kết nối đến máy chủ. Vui lòng tải lại trang.",
            })
          }
        }
      }

    } catch (err) {
      console.error("[SSE] Failed to create EventSource:", err)
      setError(err as Error)
    }
  }, [bookingId, onStatusChange, onNewQuotation, onPaymentUpdate, onTransportAssignment, onDisputeUpdate, onCounterOfferUpdate, showToasts, autoReconnect, getRetryDelay])

  // Setup connection
  useEffect(() => {
    closedRef.current = false
    connect()

    return () => {
      closedRef.current = true
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
    }
  }, [connect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    retryCountRef.current = 0
    closedRef.current = false
    connect()
  }, [connect])

  return {
    isConnected,
    error,
    lastEvent,
    reconnect,
  }
}

