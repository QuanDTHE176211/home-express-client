"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  FileText, 
  Download, 
  X, 
  Image as ImageIcon, 
  File, 
  Calendar,
  User,
  Filter
} from "lucide-react"
import type { BookingEvidence, EvidenceType } from "@/types"
import { formatDate } from "@/lib/format"

interface EvidenceGalleryProps {
  evidence: BookingEvidence[]
  isLoading?: boolean
  onDelete?: (evidenceId: number) => void
  canDelete?: boolean
}

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  PICKUP_PHOTO: "Ảnh lấy hàng",
  DELIVERY_PHOTO: "Ảnh giao hàng",
  DAMAGE_PHOTO: "Ảnh hư hỏng",
  SIGNATURE: "Chữ ký",
  INVOICE: "Hóa đơn",
  OTHER: "Khác",
}

const EVIDENCE_TYPE_COLORS: Record<EvidenceType, string> = {
  PICKUP_PHOTO: "bg-blue-100 text-blue-700 border-blue-200",
  DELIVERY_PHOTO: "bg-green-100 text-green-700 border-green-200",
  DAMAGE_PHOTO: "bg-red-100 text-red-700 border-red-200",
  SIGNATURE: "bg-purple-100 text-purple-700 border-purple-200",
  INVOICE: "bg-amber-100 text-amber-700 border-amber-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
}

export function EvidenceGallery({ 
  evidence, 
  isLoading, 
  onDelete, 
  canDelete = false 
}: EvidenceGalleryProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<BookingEvidence | null>(null)
  const [filterType, setFilterType] = useState<string>("ALL")

  // Filter evidence by type
  const filteredEvidence = filterType === "ALL" 
    ? evidence 
    : evidence.filter(e => e.evidenceType === filterType)

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Check if file is an image
  const isImage = (evidence: BookingEvidence) => {
    return evidence.fileType === "IMAGE" || 
           evidence.mimeType?.startsWith("image/")
  }

  // Get file icon
  const getFileIcon = (evidence: BookingEvidence) => {
    if (isImage(evidence)) return <ImageIcon className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (evidence.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có minh chứng nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Minh chứng sẽ được tải lên bởi khách hàng hoặc nhà vận chuyển
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Minh chứng ({filteredEvidence.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="PICKUP_PHOTO">Ảnh lấy hàng</SelectItem>
                  <SelectItem value="DELIVERY_PHOTO">Ảnh giao hàng</SelectItem>
                  <SelectItem value="DAMAGE_PHOTO">Ảnh hư hỏng</SelectItem>
                  <SelectItem value="SIGNATURE">Chữ ký</SelectItem>
                  <SelectItem value="INVOICE">Hóa đơn</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map((item) => (
              <div
                key={item.evidenceId}
                className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedEvidence(item)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {isImage(item) ? (
                    <Image
                      src={item.fileUrl}
                      alt={item.fileName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {getFileIcon(item)}
                    </div>
                  )}
                  
                  {/* Delete button */}
                  {canDelete && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.evidenceId)
                      }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Metadata */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={EVIDENCE_TYPE_COLORS[item.evidenceType]}>
                      {EVIDENCE_TYPE_LABELS[item.evidenceType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.fileSizeBytes)}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium truncate" title={item.fileName}>
                    {item.fileName}
                  </p>
                  
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{item.uploaderName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedEvidence?.fileName}</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedEvidence?.fileUrl}
                  download={selectedEvidence?.fileName}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống
                  </Button>
                </a>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvidence && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                {isImage(selectedEvidence) ? (
                  <div className="relative w-full" style={{ minHeight: "400px" }}>
                    <Image
                      src={selectedEvidence.fileUrl}
                      alt={selectedEvidence.fileName}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    {getFileIcon(selectedEvidence)}
                    <p className="mt-4 text-sm text-muted-foreground">
                      Không thể xem trước file này
                    </p>
                    <a
                      href={selectedEvidence.fileUrl}
                      download={selectedEvidence.fileName}
                      className="mt-2"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống để xem
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Loại minh chứng</p>
                  <Badge className={EVIDENCE_TYPE_COLORS[selectedEvidence.evidenceType]}>
                    {EVIDENCE_TYPE_LABELS[selectedEvidence.evidenceType]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Kích thước</p>
                  <p className="font-medium">{formatFileSize(selectedEvidence.fileSizeBytes)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Người tải lên</p>
                  <p className="font-medium">{selectedEvidence.uploaderName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày tải lên</p>
                  <p className="font-medium">{formatDate(selectedEvidence.uploadedAt)}</p>
                </div>
                {selectedEvidence.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Mô tả</p>
                    <p className="font-medium">{selectedEvidence.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

