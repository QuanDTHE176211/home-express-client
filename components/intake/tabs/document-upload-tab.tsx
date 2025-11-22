"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUp, Plus, X, FileText } from "lucide-react"
import type { ItemCandidate } from "@/types"
import { apiClient } from "@/lib/api-client"

interface DocumentUploadTabProps {
  onAddCandidates: (candidates: ItemCandidate[]) => void
}

export function DocumentUploadTab({ onAddCandidates }: DocumentUploadTabProps) {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: true,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    try {
      const data = await apiClient.parseDocument(files[0])
      setResults(data.data.candidates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddAll = () => {
    const candidates: ItemCandidate[] = results.map((item, index) => ({
      id: `doc-${Date.now()}-${index}`,
      name: item.name,
      category_id: null,
      category_name: item.category,
      size: null,
      weight_kg: null,
      dimensions: null,
      quantity: item.quantity || 1,
      is_fragile: false,
      requires_disassembly: false,
      requires_packaging: false,
      source: "document",
      confidence: item.confidence,
      image_url: null,
      notes: null,
      metadata: null,
    }))

    onAddCandidates(candidates)
    setFiles([])
    setResults([])
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
            <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tải file PDF, DOCX hoặc XLSX</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button onClick={() => removeFile(index)} className="text-destructive hover:text-destructive/80">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleProcess} disabled={files.length === 0 || isProcessing} className="w-full">
          <FileUp className="h-4 w-4 mr-2" />
          Xử lý file
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Đã phát hiện {results.length} vật phẩm</h4>
              <Button size="sm" onClick={handleAddAll}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm tất cả
              </Button>
            </div>
            <div className="space-y-2">
              {results.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Số lượng: {item.quantity || 1}
                      {item.category && ` • ${item.category}`}
                    </div>
                  </div>
                  {item.confidence && <Badge variant="secondary">{Math.round(item.confidence * 100)}%</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
