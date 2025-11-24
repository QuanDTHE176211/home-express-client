"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanText, Plus, X } from "lucide-react"
import type { ItemCandidate, OCRResult } from "@/types"
import { apiClient } from "@/lib/api-client"

interface OCRTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

export function OCRTab({ onAddCandidates }: OCRTabProps) {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<OCRResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleOCR = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      const response = await apiClient.ocrImages(files)
      setResults({
        extracted_text: response.data.extractedText,
        items: response.data.candidates.map((c: any) => ({
          name: c.name,
          quantity: c.quantity || 1,
          category: c.category_name || null,
          confidence: c.confidence || 0.8,
        })),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddAll = () => {
    if (!results) return

    const candidates: ItemCandidate[] = results.items.map((item: any, index: number) => ({
      id: `ocr-${Date.now()}-${index}`,
      name: item.name,
      category_id: null,
      category_name: item.category,
      size: null,
      weight_kg: null,
      dimensions: null,
      quantity: item.quantity,
      is_fragile: false,
      requires_disassembly: false,
      requires_packaging: false,
      source: "ocr",
      confidence: item.confidence,
      image_url: null,
      notes: null,
      metadata: null,
    }))

    onAddCandidates(candidates)
    setFiles([])
    setResults(null)
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {files.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
          >
            <input {...getInputProps()} />
            <ScanText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tải ảnh chứa văn bản (ghi chú, danh sách...)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <Image
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={`OCR ${index + 1}`}
                  width={192}
                  height={128}
                  className="h-32 w-full rounded-lg border object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleOCR} disabled={files.length === 0 || isProcessing} className="w-full">
          <ScanText className="h-4 w-4 mr-2" />
          Trích xuất văn bản
        </Button>

        {results && (
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Văn bản trích xuất:</h4>
              <p className="text-sm whitespace-pre-wrap">{results.extracted_text}</p>
            </div>

            {results.items.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Đã phát hiện {results.items.length} vật phẩm</h4>
                  <Button size="sm" onClick={handleAddAll}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm tất cả
                  </Button>
                </div>
                <div className="space-y-2">
                  {results.items.map((item: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity}
                          {item.category && ` • ${item.category}`}
                        </div>
                      </div>
                      <Badge variant="secondary">{Math.round(item.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
