"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Download, FileText, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import type { BookingStatus, ExportFormat } from "@/types"

interface ExportBookingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportBookingsDialog({ open, onOpenChange }: ExportBookingsDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("CSV")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<BookingStatus | "all">("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Build export parameters
      const params: any = {
        sortBy,
        sortOrder,
      }

      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (status !== "all") params.status = status

      // Call appropriate export method based on format
      let blob: Blob
      if (format === "CSV") {
        blob = await apiClient.exportBookingsAsCSV(params)
      } else if (format === "PDF") {
        blob = await apiClient.exportBookingsAsPDF(params)
      } else {
        blob = await apiClient.exportBookingsAsExcel(params)
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
      const extension = format === "CSV" ? "csv" : format === "PDF" ? "pdf" : "xlsx"
      link.download = `bookings_export_${timestamp}.${extension}`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Xuất dữ liệu thành công", {
        description: `Đã tải xuống file ${format}`,
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Export error:", error)
      toast.error("Xuất dữ liệu thất bại", {
        description: error.message || "Vui lòng thử lại sau",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Xuất dữ liệu chuyến đi
          </DialogTitle>
          <DialogDescription>
            Chọn định dạng và bộ lọc để xuất dữ liệu chuyến đi của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Định dạng xuất</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV (Excel)</SelectItem>
                <SelectItem value="PDF" disabled>
                  PDF (Chưa hỗ trợ)
                </SelectItem>
                <SelectItem value="EXCEL" disabled>
                  Excel (Chưa hỗ trợ)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Từ ngày</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Đến ngày</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as BookingStatus | "all")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                <SelectItem value="QUOTED">Đã báo giá</SelectItem>
                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang vận chuyển</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CONFIRMED_BY_CUSTOMER">Đã xác nhận bởi khách</SelectItem>
                <SelectItem value="REVIEWED">Đã đánh giá</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sắp xếp theo</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="preferredDate">Ngày vận chuyển</SelectItem>
                  <SelectItem value="finalPrice">Giá cuối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Thứ tự</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "ASC" | "DESC")}>
                <SelectTrigger id="sortOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Mới nhất</SelectItem>
                  <SelectItem value="ASC">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-accent-green hover:bg-accent-green-dark">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Xuất dữ liệu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

