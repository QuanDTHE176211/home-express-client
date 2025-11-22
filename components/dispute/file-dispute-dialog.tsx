"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DisputeType, BookingEvidence } from "@/types"
import { toast } from "sonner"

interface FileDisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: number
  onSuccess?: () => void
}

const disputeTypes: { value: DisputeType; label: string; description: string }[] = [
  {
    value: "PRICING_DISPUTE",
    label: "Pricing Dispute",
    description: "Issues with pricing or billing",
  },
  {
    value: "DAMAGE_CLAIM",
    label: "Damage Claim",
    description: "Items were damaged during transport",
  },
  {
    value: "SERVICE_QUALITY",
    label: "Service Quality",
    description: "Issues with service quality or professionalism",
  },
  {
    value: "DELIVERY_ISSUE",
    label: "Delivery Issue",
    description: "Problems with delivery timing or location",
  },
  {
    value: "PAYMENT_ISSUE",
    label: "Payment Issue",
    description: "Payment processing or refund issues",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other types of disputes",
  },
]

export function FileDisputeDialog({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: FileDisputeDialogProps) {
  const [disputeType, setDisputeType] = useState<DisputeType | "">("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requestedResolution, setRequestedResolution] = useState("")
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>([])
  const [evidence, setEvidence] = useState<BookingEvidence[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadEvidence()
      // Reset form
      setDisputeType("")
      setTitle("")
      setDescription("")
      setRequestedResolution("")
      setSelectedEvidenceIds([])
      setErrors({})
    }
  }, [open, bookingId])

  const loadEvidence = async () => {
    try {
      setLoadingEvidence(true)
      const response = await apiClient.getBookingEvidence(bookingId)
      setEvidence(response.evidence)
    } catch (err: any) {
      console.error("Failed to load evidence:", err)
      toast.error("Failed to load evidence")
    } finally {
      setLoadingEvidence(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!disputeType) {
      newErrors.disputeType = "Please select a dispute type"
    }
    if (!title.trim()) {
      newErrors.title = "Title is required"
    } else if (title.length > 200) {
      newErrors.title = "Title must not exceed 200 characters"
    }
    if (!description.trim()) {
      newErrors.description = "Description is required"
    } else if (description.length > 5000) {
      newErrors.description = "Description must not exceed 5000 characters"
    }
    if (requestedResolution && requestedResolution.length > 2000) {
      newErrors.requestedResolution = "Requested resolution must not exceed 2000 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setSubmitting(true)
      await apiClient.createDispute(bookingId, {
        disputeType: disputeType as DisputeType,
        title: title.trim(),
        description: description.trim(),
        requestedResolution: requestedResolution.trim() || undefined,
        evidenceIds: selectedEvidenceIds.length > 0 ? selectedEvidenceIds : undefined,
      })

      toast.success("Dispute filed successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error("Failed to file dispute:", err)
      toast.error(err.message || "Failed to file dispute")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleEvidence = (evidenceId: number) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(evidenceId)
        ? prev.filter((id) => id !== evidenceId)
        : [...prev, evidenceId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a Dispute</DialogTitle>
          <DialogDescription>
            Submit a dispute for booking #{bookingId}. Please provide detailed information to help us resolve your issue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dispute Type */}
          <div className="space-y-2">
            <Label htmlFor="disputeType">
              Dispute Type <span className="text-destructive">*</span>
            </Label>
            <Select value={disputeType} onValueChange={(value) => setDisputeType(value as DisputeType)}>
              <SelectTrigger id="disputeType">
                <SelectValue placeholder="Select dispute type" />
              </SelectTrigger>
              <SelectContent>
                {disputeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.disputeType && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.disputeType}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{title.length}/200 characters</span>
            </div>
            {errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={6}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{description.length}/5000 characters</span>
            </div>
            {errors.description && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Requested Resolution */}
          <div className="space-y-2">
            <Label htmlFor="requestedResolution">Requested Resolution (Optional)</Label>
            <Textarea
              id="requestedResolution"
              placeholder="What would you like us to do to resolve this issue?"
              value={requestedResolution}
              onChange={(e) => setRequestedResolution(e.target.value)}
              maxLength={2000}
              rows={4}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{requestedResolution.length}/2000 characters</span>
            </div>
            {errors.requestedResolution && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.requestedResolution}
              </p>
            )}
          </div>

          {/* Evidence Selection */}
          <div className="space-y-2">
            <Label>Attach Evidence (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Select evidence items to attach to this dispute
            </p>
            {loadingEvidence ? (
              <p className="text-sm text-muted-foreground">Loading evidence...</p>
            ) : evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence available for this booking</p>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div key={item.evidenceId} className="flex items-start gap-3">
                      <Checkbox
                        id={`evidence-${item.evidenceId}`}
                        checked={selectedEvidenceIds.includes(item.evidenceId)}
                        onCheckedChange={() => toggleEvidence(item.evidenceId)}
                      />
                      <label
                        htmlFor={`evidence-${item.evidenceId}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.fileName}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.evidenceType}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedEvidenceIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedEvidenceIds.length} {selectedEvidenceIds.length === 1 ? "item" : "items"} selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Filing..." : "File Dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

