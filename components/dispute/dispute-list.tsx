"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, MessageSquare, FileText, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Dispute, DisputeStatus } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface DisputeListProps {
  bookingId: number
  onDisputeClick?: (dispute: Dispute) => void
}

const disputeStatusConfig: Record<DisputeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "default" },
  UNDER_REVIEW: { label: "Under Review", variant: "secondary" },
  RESOLVED: { label: "Resolved", variant: "outline" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  ESCALATED: { label: "Escalated", variant: "default" },
}

const disputeTypeLabels: Record<string, string> = {
  PRICING_DISPUTE: "Pricing Dispute",
  DAMAGE_CLAIM: "Damage Claim",
  SERVICE_QUALITY: "Service Quality",
  DELIVERY_ISSUE: "Delivery Issue",
  PAYMENT_ISSUE: "Payment Issue",
  OTHER: "Other",
}

export function DisputeList({ bookingId, onDisputeClick }: DisputeListProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadDisputes()
  }, [bookingId])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredDisputes(disputes)
    } else {
      setFilteredDisputes(disputes.filter(d => d.status === statusFilter))
    }
  }, [statusFilter, disputes])

  const loadDisputes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getBookingDisputes(bookingId)
      setDisputes(response.disputes)
      setFilteredDisputes(response.disputes)
    } catch (err: any) {
      console.error("Failed to load disputes:", err)
      setError(err.message || "Failed to load disputes")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
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

  if (disputes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Disputes Filed</h3>
            <p className="text-muted-foreground">
              There are no disputes for this booking yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by status:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ESCALATED">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredDisputes.length} {filteredDisputes.length === 1 ? "dispute" : "disputes"}
        </span>
      </div>

      {/* Dispute List */}
      {filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No disputes found with the selected filter.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredDisputes.map((dispute) => (
          <Card
            key={dispute.disputeId}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onDisputeClick?.(dispute)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={disputeStatusConfig[dispute.status].variant}>
                      {disputeStatusConfig[dispute.status].label}
                    </Badge>
                    <Badge variant="outline">
                      {disputeTypeLabels[dispute.disputeType] || dispute.disputeType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{dispute.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Filed {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })} by {dispute.filedByUserName}
                  </CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {dispute.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{dispute.messageCount} {dispute.messageCount === 1 ? "message" : "messages"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{dispute.evidenceCount} {dispute.evidenceCount === 1 ? "evidence" : "evidence items"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

