"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, FileText, Calendar, User, CheckCircle, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Dispute, DisputeStatus } from "@/types"
import { format } from "date-fns"
import { DisputeMessages } from "./dispute-messages"

interface DisputeDetailProps {
  disputeId: number
  currentUserId?: number
  onAttachEvidence?: () => void
}

const disputeStatusConfig: Record<DisputeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  PENDING: { label: "Pending", variant: "default", icon: AlertCircle },
  UNDER_REVIEW: { label: "Under Review", variant: "secondary", icon: FileText },
  RESOLVED: { label: "Resolved", variant: "outline", icon: CheckCircle },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
  ESCALATED: { label: "Escalated", variant: "default", icon: AlertCircle },
}

const disputeTypeLabels: Record<string, string> = {
  PRICING_DISPUTE: "Pricing Dispute",
  DAMAGE_CLAIM: "Damage Claim",
  SERVICE_QUALITY: "Service Quality",
  DELIVERY_ISSUE: "Delivery Issue",
  PAYMENT_ISSUE: "Payment Issue",
  OTHER: "Other",
}

export function DisputeDetail({ disputeId, currentUserId, onAttachEvidence }: DisputeDetailProps) {
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDispute()
  }, [disputeId])

  const loadDispute = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getDisputeById(disputeId)
      setDispute(response)
    } catch (err: any) {
      console.error("Failed to load dispute:", err)
      setError(err.message || "Failed to load dispute")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error || "Dispute not found"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatusIcon = disputeStatusConfig[dispute.status].icon

  return (
    <div className="space-y-6">
      {/* Dispute Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={disputeStatusConfig[dispute.status].variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {disputeStatusConfig[dispute.status].label}
                </Badge>
                <Badge variant="outline">
                  {disputeTypeLabels[dispute.disputeType] || dispute.disputeType}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{dispute.title}</CardTitle>
              <CardDescription className="mt-2">
                Dispute #{dispute.disputeId} • Booking #{dispute.bookingId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filed By Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Filed By
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span>{dispute.filedByUserName}</span>
              <Badge variant="outline" className="text-xs">
                {dispute.filedByUserRole}
              </Badge>
              <span className="text-muted-foreground">
                • {format(new Date(dispute.createdAt), "PPp")}
              </span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {dispute.description}
            </p>
          </div>

          {/* Requested Resolution */}
          {dispute.requestedResolution && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Requested Resolution</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {dispute.requestedResolution}
                </p>
              </div>
            </>
          )}

          {/* Resolution Information */}
          {(dispute.status === "RESOLVED" || dispute.status === "REJECTED") && dispute.resolutionNotes && (
            <>
              <Separator />
              <div className={`p-4 rounded-lg ${
                dispute.status === "RESOLVED" 
                  ? "bg-green-50 dark:bg-green-950" 
                  : "bg-red-50 dark:bg-red-950"
              }`}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {dispute.status === "RESOLVED" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Resolution
                </h3>
                <p className="text-sm mb-2 whitespace-pre-wrap">
                  {dispute.resolutionNotes}
                </p>
                {dispute.resolvedByUserName && dispute.resolvedAt && (
                  <p className="text-xs text-muted-foreground">
                    Resolved by {dispute.resolvedByUserName} on {format(new Date(dispute.resolvedAt), "PPp")}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Evidence & Messages Count */}
          <Separator />
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{dispute.evidenceCount} evidence {dispute.evidenceCount === 1 ? "item" : "items"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Last updated {format(new Date(dispute.updatedAt), "PPp")}</span>
            </div>
          </div>

          {/* Actions */}
          {onAttachEvidence && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onAttachEvidence}>
                <FileText className="h-4 w-4 mr-2" />
                Attach Evidence
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Section */}
      <DisputeMessages disputeId={disputeId} currentUserId={currentUserId} />
    </div>
  )
}

