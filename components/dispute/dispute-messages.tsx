"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DisputeMessage } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface DisputeMessagesProps {
  disputeId: number
  currentUserId?: number
}

const roleColors: Record<string, string> = {
  CUSTOMER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TRANSPORT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MANAGER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export function DisputeMessages({ disputeId, currentUserId }: DisputeMessagesProps) {
  const [messages, setMessages] = useState<DisputeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [disputeId])

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getDisputeMessages(disputeId)
      setMessages(response.messages)
    } catch (err: any) {
      console.error("Failed to load messages:", err)
      setError(err.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (newMessage.length > 2000) {
      toast.error("Message must not exceed 2000 characters")
      return
    }

    try {
      setSubmitting(true)
      const response = await apiClient.addDisputeMessage(disputeId, {
        messageText: newMessage.trim(),
      })
      
      // Add new message to list
      setMessages([...messages, response])
      setNewMessage("")
      toast.success("Message sent successfully")
    } catch (err: any) {
      console.error("Failed to send message:", err)
      toast.error(err.message || "Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages ({messages.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Messages List */}
        <ScrollArea className="h-[400px] pr-4 mb-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = currentUserId === message.senderUserId
                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      } rounded-lg p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {message.senderName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${roleColors[message.senderRole] || ""}`}
                        >
                          {message.senderRole}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.messageText}
                      </p>
                      <p className="text-xs opacity-70 mt-2">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={submitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {newMessage.length}/2000 characters
            </span>
            <Button type="submit" disabled={submitting || !newMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

