"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, AlertCircle, Loader2, FileText } from "lucide-react"
import type { EvidenceType, FileType } from "@/types"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface EvidenceUploadProps {
  bookingId: number
  onSuccess?: () => void
  onCancel?: () => void
}

interface FileWithPreview extends File {
  preview?: string
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
}

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: "PICKUP_PHOTO", label: "Ảnh lấy hàng" },
  { value: "DELIVERY_PHOTO", label: "Ảnh giao hàng" },
  { value: "DAMAGE_PHOTO", label: "Ảnh hư hỏng" },
  { value: "SIGNATURE", label: "Chữ ký" },
  { value: "INVOICE", label: "Hóa đơn" },
  { value: "OTHER", label: "Khác" },
]

export function EvidenceUpload({ bookingId, onSuccess, onCancel }: EvidenceUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [evidenceType, setEvidenceType] = useState<EvidenceType | "">("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        if (errors.some((e: any) => e.code === "file-too-large")) {
          return `${file.name}: File quá lớn (tối đa 20MB)`
        }
        if (errors.some((e: any) => e.code === "file-invalid-type")) {
          return `${file.name}: Định dạng không hợp lệ (chỉ chấp nhận JPG, PNG, PDF)`
        }
        return `${file.name}: Lỗi không xác định`
      })
      setError(errors.join(", "))
      return
    }

    // Add preview URLs for images
    const filesWithPreview = acceptedFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview
      if (file.type.startsWith("image/")) {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      return fileWithPreview
    })

    setFiles((prev) => [...prev, ...filesWithPreview])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      // Revoke preview URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn ít nhất một file")
      return
    }

    if (!evidenceType) {
      setError("Vui lòng chọn loại minh chứng")
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Upload each file
      const totalFiles = files.length
      let uploadedCount = 0

      for (const file of files) {
        // Determine file type
        const fileType: FileType = file.type.startsWith("image/")
          ? "IMAGE"
          : file.type === "application/pdf"
            ? "DOCUMENT"
            : "DOCUMENT"

        // Upload file to server first
        const uploadResult = await apiClient.uploadFile(file, "evidence")

        // Create evidence record with uploaded file URL
        await apiClient.uploadBookingEvidence(bookingId, {
          evidenceType,
          fileType,
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          mimeType: uploadResult.mimeType,
          fileSizeBytes: uploadResult.fileSizeBytes,
          description: description || undefined,
        })

        uploadedCount++
        setUploadProgress((uploadedCount / totalFiles) * 100)
      }

      toast.success("Tải lên thành công", {
        description: `Đã tải lên ${files.length} file minh chứng`,
      })

      // Reset form
      setFiles([])
      setEvidenceType("")
      setDescription("")
      setUploadProgress(0)

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Không thể tải lên minh chứng")
      toast.error("Lỗi tải lên", {
        description: "Không thể tải lên minh chứng. Vui lòng thử lại.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const isImage = (file: FileWithPreview) => file.type.startsWith("image/")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tải lên minh chứng</CardTitle>
        <CardDescription>
          Tải lên ảnh hoặc tài liệu liên quan đến đơn hàng (tối đa 20MB mỗi file)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evidence Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="evidenceType">
            Loại minh chứng <span className="text-destructive">*</span>
          </Label>
          <Select value={evidenceType} onValueChange={(value) => setEvidenceType(value as EvidenceType)}>
            <SelectTrigger id="evidenceType">
              <SelectValue placeholder="Chọn loại minh chứng" />
            </SelectTrigger>
            <SelectContent>
              {EVIDENCE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Area */}
        {files.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Thả file vào đây..."
                : "Kéo thả file vào đây hoặc click để chọn"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Hỗ trợ: JPG, PNG, PDF (tối đa 20MB mỗi file)
            </p>
          </div>
        ) : (
          <>
            {/* File Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    {isImage(file) && file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2 px-2 truncate w-full text-center">
                          {file.name}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50"
            >
              <input {...getInputProps()} />
              <p className="text-sm text-muted-foreground">
                + Thêm file ({files.length} đã chọn)
              </p>
            </div>
          </>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả (tùy chọn)</Label>
          <Textarea
            id="description"
            placeholder="Thêm mô tả về minh chứng..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500 ký tự
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Đang tải lên...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
            >
              Hủy
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !evidenceType}
            className="bg-accent-green hover:bg-accent-green-dark"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Tải lên ({files.length})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

