"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Sparkles, AlertCircle, X } from "lucide-react"
import type { ItemCandidate } from "@/types"
import { apiClient } from "@/lib/api-client"

interface ImageUploadTabProps {
  sessionId: number
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

export function ImageUploadTab({ sessionId, onAddCandidates }: ImageUploadTabProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles.map((f) => {
          if (f.errors?.some((e: any) => e.code === "file-too-large")) return "File quá lớn (>10MB)"
          if (f.errors?.some((e: any) => e.code === "file-invalid-type")) return "Định dạng không hợp lệ"
          return "File không hợp lệ"
        }).join(", ")
        setError(`Một số file không hợp lệ: ${reasons}. Vui lòng chỉ tải ảnh JPG, PNG hoặc WebP.`)
        return
      }
      if (acceptedFiles.length === 0) {
        return
      }
      setFiles((prev) => {
        const total = prev.length + acceptedFiles.length
        if (total > 10) {
          setError("Tối đa 10 ảnh. Vui lòng xóa một số ảnh trước khi thêm mới.")
          return prev
        }
        setError(null)
        return [...prev, ...acceptedFiles]
      })
    },
    [],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setError(null)
    setProgress(20)

    try {
      const data = await apiClient.analyzeImages(files)
      setProgress(60)

      // Validate response structure
      if (!data || !data.data || !Array.isArray(data.data.candidates)) {
        throw new Error("Dữ liệu phản hồi không hợp lệ")
      }

      if (data.data.candidates.length === 0) {
        setError("Không phát hiện được vật phẩm nào trong ảnh. Vui lòng thử lại với ảnh khác.")
        setProgress(0)
        setIsProcessing(false)
        return
      }

      setProgress(80)

      const candidates: ItemCandidate[] = data.data.candidates.map((item: any, index: number) => {
        // Handle dimensions - backend uses snake_case for JSON
        let dimensions = null
        if (item.dimensions) {
          dimensions = {
            width_cm: item.dimensions.width_cm ?? item.dimensions.widthCm ?? null,
            height_cm: item.dimensions.height_cm ?? item.dimensions.heightCm ?? null,
            depth_cm: item.dimensions.depth_cm ?? item.dimensions.depthCm ?? null,
          }
        }

        return {
          id: item.id || `img-${Date.now()}-${index}`,
          name: item.name || "Vật phẩm không xác định",
          category_id: item.category_id ?? item.categoryId ?? null,
          category_name: item.category_name ?? item.categoryName ?? null,
          size: (item.size || "M") as "S" | "M" | "L",
          weight_kg: item.weight_kg ?? item.weightKg ?? null,
          dimensions: dimensions,
          quantity: item.quantity || 1,
          is_fragile: item.is_fragile ?? item.isFragile ?? false,
          requires_disassembly: item.requires_disassembly ?? item.requiresDisassembly ?? false,
          requires_packaging: item.requires_packaging ?? item.requiresPackaging ?? false,
          source: item.source || "image",
          confidence: item.confidence ?? null,
          image_url: item.image_url ?? item.imageUrl ?? null,
          notes: item.notes ?? null,
          metadata: item.metadata ?? null,
        }
      })

      setProgress(100)
      onAddCandidates(candidates)
      setFiles([])
      
      // Show success message
      const { toast } = await import("sonner")
      toast.success(`Đã phát hiện ${candidates.length} vật phẩm`)
    } catch (err: any) {
      console.error("Error analyzing images:", err)
      
      let errorMessage = "Có lỗi xảy ra khi phân tích ảnh"
      
      // Try to extract error message from various error formats
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.error) {
        errorMessage = typeof err.error === "string" ? err.error : err.error.message || errorMessage
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.response?.data?.error) {
        errorMessage = typeof err.response.data.error === "string" 
          ? err.response.data.error 
          : err.response.data.error.message || errorMessage
      } else if (typeof err === "string") {
        errorMessage = err
      } else if (err?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      } else if (err?.status === 403) {
        errorMessage = "Bạn không có quyền thực hiện thao tác này."
      } else if (err?.status === 413) {
        errorMessage = "File quá lớn. Vui lòng chọn file nhỏ hơn 10MB."
      } else if (err?.status === 500) {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau."
      } else if (err?.status >= 400) {
        errorMessage = `Lỗi ${err.status}: ${errorMessage}`
      }
      
      setError(errorMessage)
      setProgress(0)
      
      // Also show toast notification for better UX
      const { toast } = await import("sonner")
      toast.error("Không thể phân tích ảnh", {
        description: errorMessage,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {files.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kéo thả ảnh vào đây hoặc click để chọn</p>
            <p className="text-xs text-muted-foreground mt-2">Tối đa 10 ảnh, mỗi ảnh &lt; 10MB</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    width={192}
                    height={128}
                    className="h-32 w-full rounded-lg border object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{files.length}/10 ảnh</p>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Đang phân tích...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Button 
          onClick={handleProcess} 
          disabled={files.length === 0 || isProcessing} 
          className="w-full"
          variant={files.length === 0 ? "secondary" : "default"}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isProcessing ? "Đang phân tích..." : "Phân tích ảnh"}
        </Button>
      </CardContent>
    </Card>
  )
}
