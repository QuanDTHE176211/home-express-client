"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface WebSocketContextType {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (type: string, data: any) => void
  subscribe: (type: string, callback: (data: any) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

const WS_URL = process.env.NEXT_PUBLIC_WS_URL
const ENABLE_WEBSOCKET = !!WS_URL && WS_URL !== "ws://localhost:8084/ws"
const RECONNECT_INTERVAL = 5000
const HEARTBEAT_INTERVAL = 30000

export function WebSocketProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())
  const connectRef = useRef<() => void>(() => { })

  const connect = useCallback(() => {
    if (!ENABLE_WEBSOCKET || !userId || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const ws = new WebSocket(`${WS_URL}?token=${token}`)

      ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        setIsConnected(true)

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }))
          }
        }, HEARTBEAT_INTERVAL)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("[v0] WebSocket message received:", message.type)

          setLastMessage(message)

          // Notify subscribers
          const subscribers = subscribersRef.current.get(message.type)
          if (subscribers) {
            subscribers.forEach((callback) => callback(message.data))
          }

          // Notify wildcard subscribers
          const wildcardSubscribers = subscribersRef.current.get("*")
          if (wildcardSubscribers) {
            wildcardSubscribers.forEach((callback) => callback(message))
          }
        } catch (error) {
          console.error("[v0] Failed to parse WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }

      ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        setIsConnected(false)

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // Attempt reconnection
        if (userId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[v0] Attempting to reconnect WebSocket...")
            connectRef.current()
          }, RECONNECT_INTERVAL)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error("[v0] Failed to create WebSocket connection:", error)
    }
  }, [userId])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      )
    } else {
      console.warn("[v0] WebSocket is not connected. Cannot send message.")
    }
  }, [])

  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set())
    }

    subscribersRef.current.get(type)!.add(callback)

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(type)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          subscribersRef.current.delete(type)
        }
      }
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      if (ENABLE_WEBSOCKET && userId) {
        connectRef.current()
      } else {
        disconnect()
      }
    }, 0)

    return () => {
      clearTimeout(id)
      disconnect()
    }
  }, [userId, disconnect])

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
