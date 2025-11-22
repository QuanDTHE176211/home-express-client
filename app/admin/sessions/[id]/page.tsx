"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { http } from "@/lib/http"
import { useSSE } from "@/lib/sse"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, Send, Trash2, Plus, CheckCircle, Loader2, ArrowLeft } from "lucide-react"
import type { ScanSessionWithCustomer, ItemCandidate } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { adminNavItems } from "@/lib/admin-nav-config"
import { formatVND } from "@/lib/format"
import Link from "next/link"
import Image from "next/image"

export default function SessionDetailPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const sessionId = params.id as string

    const [session, setSession] = useState<ScanSessionWithCustomer | null>(null)
    const [items, setItems] = useState<ItemCandidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [forceQuotePrice, setForceQuotePrice] = useState("")
    const [forceQuoteNotes, setForceQuoteNotes] = useState("")
    const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; level: string }>>([])

    // SSE for realtime logs
    const { data: sseData, error: sseError } = useSSE(isRerunning ? `/api/v1/admin/sessions/${sessionId}/events` : null)

    // Audit logging helper
    const logAudit = useCallback(async (action: string, details: any) => {
        try {
            await http(`/api/v1/admin/audit-logs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    resource_type: "scan_session",
                    resource_id: sessionId,
                    details,
                    performed_by: user?.email,
                }),
            })
        } catch (error) {
            console.error("Failed to log audit:", error)
        }
    }, [sessionId, user])

    const fetchSession = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await http<{ session: ScanSessionWithCustomer }>(`/api/v1/admin/sessions/${sessionId}`)
            setSession(response.session)
            setItems(response.session.items || [])
            setForceQuotePrice(response.session.forced_quote_price?.toString() || "")
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin phiên scan",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, toast])

    useEffect(() => {
        if (!loading && (!user || user.role !== "MANAGER")) {
            router.push("/login")
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user?.role === "MANAGER") {
            fetchSession()
        }
    }, [user, fetchSession])

    useEffect(() => {
        if (sseData) {
            const newLog = {
                timestamp: new Date().toISOString(),
                message: sseData.message || JSON.stringify(sseData),
                level: sseData.level || "info",
            }
            setLogs((prev) => [...prev, newLog])

            // Update session status if processing complete
            if (sseData.type === "PROCESSING_COMPLETE") {
                fetchSession()
                setIsRerunning(false)
            }
        }
    }, [sseData, fetchSession])

    // SSE error handling
    useEffect(() => {
        if (sseError) {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: `SSE Error: ${sseError.message || "Connection failed"}`,
                level: "error",
            }
            setLogs((prev) => [...prev, errorLog])
            toast({
                title: "Lỗi kết nối",
                description: "Mất kết nối realtime. Logs có thể không cập nhật.",
                variant: "destructive",
            })
        }
    }, [sseError, toast])

    const handleSaveItems = async () => {
        // Validate items
        const invalidItems = items.filter((item, idx) => {
            if (!item.name || item.name.trim() === "") return true
            if (item.quantity <= 0) return true
            if (item.weight_kg !== null && item.weight_kg <= 0) return true
            return false
        })

        if (invalidItems.length > 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng điền đầy đủ thông tin hợp lệ cho tất cả items",
                variant: "destructive",
            })
            return
        }

        try {
            setIsSaving(true)
            await http(`/api/v1/admin/sessions/${sessionId}/items`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            })
            await logAudit("SAVE_ITEMS", { item_count: items.length, items })
            toast({
                title: "Thành công",
                description: "Đã lưu danh sách items",
            })
            await fetchSession()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể lưu items",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleRerunAI = async () => {
        try {
            setIsRerunning(true)
            setLogs([])
            await http(`/api/v1/admin/sessions/${sessionId}/rerun`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ forceReprocess: true }),
            })
            await logAudit("RERUN_AI", { forceReprocess: true })
            toast({
                title: "Đang xử lý",
                description: "AI đang phân tích lại ảnh. Xem logs bên dưới.",
            })
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể chạy lại AI",
                variant: "destructive",
            })
            setIsRerunning(false)
        }
    }

    const handleForceQuote = async () => {
        if (!forceQuotePrice || Number.parseFloat(forceQuotePrice) <= 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập giá hợp lệ",
                variant: "destructive",
            })
            return
        }

        try {
            const price = Number.parseFloat(forceQuotePrice)
            await http(`/api/v1/admin/sessions/${sessionId}/force-quote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    price,
                    notes: forceQuoteNotes,
                }),
            })
            await logAudit("FORCE_QUOTE", { price, notes: forceQuoteNotes })
            toast({
                title: "Thành công",
                description: "Đã tạo báo giá cưỡng chế",
            })
            await fetchSession()
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tạo báo giá",
                variant: "destructive",
            })
        }
    }

    const handlePublish = async () => {
        try {
            setIsPublishing(true)
            await http(`/api/v1/admin/sessions/${sessionId}/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expiresInHours: 48 }),
            })
            await logAudit("PUBLISH_BIDDING", { expiresInHours: 48 })
            toast({
                title: "Thành công",
                description: "Đã publish phiên đấu giá",
            })
            router.push(`/admin/bids/${sessionId}`)
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể publish",
                variant: "destructive",
            })
        } finally {
            setIsPublishing(false)
        }
    }

    const handleUpdateItem = (index: number, field: keyof ItemCandidate, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleDeleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                id: `new-${Date.now()}`,
                name: "",
                category_id: null,
                category_name: null,
                size: null,
                weight_kg: null,
                dimensions: null,
                quantity: 1,
                is_fragile: false,
                requires_disassembly: false,
                requires_packaging: false,
                source: "manual",
                confidence: null,
                image_url: null,
                notes: null,
                metadata: null,
            },
        ])
    }

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
            </div>
        )
    }

    if (!user || !session) return null

    return (
        <DashboardLayout navItems={adminNavItems} title="Session Detail">
            <div className="space-y-6">
                <AdminBreadcrumbs />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/review-queue">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Session #{session.session_id}</h1>
                            <p className="text-muted-foreground mt-1">
                                Khách hàng: {session.customer_name} • {session.image_count} ảnh
                            </p>
                        </div>
                    </div>
                    <Badge variant={session.status === "NEEDS_REVIEW" ? "default" : "secondary"}>{session.status}</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Image Gallery */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Ảnh ({session.image_count})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {session.image_urls.map((url, index) => (
                                    <div
                                        key={index}
                                        className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                        onClick={() => setSelectedImage(url)}
                                    >
                                        <Image src={url || "/placeholder.svg"} alt={`Image ${index + 1}`} fill className="object-cover" />
                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {session.average_confidence && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Độ tin cậy AI</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${session.average_confidence * 100}%` }} />
                                        </div>
                                        <span className="text-sm font-medium">{Math.round(session.average_confidence * 100)}%</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Items Editor & Actions */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Items Editor</CardTitle>
                                <div className="flex gap-2">
                                    <Button onClick={handleAddItem} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Thêm item
                                    </Button>
                                    <Button onClick={handleSaveItems} disabled={isSaving} size="sm">
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Lưu
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="items">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
                                    <TabsTrigger value="quote">Báo giá</TabsTrigger>
                                    <TabsTrigger value="logs">Logs</TabsTrigger>
                                </TabsList>

                                <TabsContent value="items" className="space-y-4 mt-4">
                                    {items.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Chưa có items nào. Nhấn &quot;Thêm item&quot; để bắt đầu.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                            {items.map((item, index) => (
                                                <div key={item.id} className="p-4 border rounded-lg space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label>Tên item</Label>
                                                                <Input
                                                                    value={item.name}
                                                                    onChange={(e) => handleUpdateItem(index, "name", e.target.value)}
                                                                    placeholder="Tủ lạnh, Máy giặt..."
                                                                    className={!item.name || item.name.trim() === "" ? "border-red-500" : ""}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Số lượng</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        handleUpdateItem(index, "quantity", Number.parseInt(e.target.value) || 1)
                                                                    }
                                                                    min={1}
                                                                    className={item.quantity <= 0 ? "border-red-500" : ""}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Trọng lượng (kg)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.weight_kg || ""}
                                                                    onChange={(e) =>
                                                                        handleUpdateItem(index, "weight_kg", Number.parseFloat(e.target.value) || null)
                                                                    }
                                                                    placeholder="50"
                                                                    className={item.weight_kg !== null && item.weight_kg <= 0 ? "border-red-500" : ""}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Kích thước</Label>
                                                                <Input
                                                                    value={item.size || ""}
                                                                    onChange={(e) => handleUpdateItem(index, "size", e.target.value)}
                                                                    placeholder="S, M, L"
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteItem(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    {item.confidence && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            AI: {Math.round(item.confidence * 100)}% confidence
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="quote" className="space-y-4 mt-4">
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Giá ước tính hệ thống</Label>
                                            <div className="text-2xl font-bold text-green-600">
                                                {session.estimated_price ? formatVND(session.estimated_price) : "Chưa có"}
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <Label>Force Quote (Báo giá cưỡng chế)</Label>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <div>
                                                    <Input
                                                        type="number"
                                                        value={forceQuotePrice}
                                                        onChange={(e) => setForceQuotePrice(e.target.value)}
                                                        placeholder="2500000"
                                                    />
                                                </div>
                                                <Button onClick={handleForceQuote} variant="outline">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Áp dụng
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={forceQuoteNotes}
                                                onChange={(e) => setForceQuoteNotes(e.target.value)}
                                                placeholder="Ghi chú lý do force quote..."
                                                className="mt-2"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="border-t pt-4 space-y-3">
                                            <Button
                                                onClick={handleRerunAI}
                                                disabled={isRerunning}
                                                variant="outline"
                                                className="w-full bg-transparent"
                                            >
                                                {isRerunning ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                )}
                                                Rerun AI
                                            </Button>
                                            <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                                                {isPublishing ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4 mr-2" />
                                                )}
                                                Publish Bidding
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="logs" className="mt-4">
                                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[400px] overflow-y-auto">
                                        {sseError && (
                                            <div className="mb-2 p-2 bg-red-900/30 border border-red-500 rounded">
                                                <span className="text-red-400">⚠ SSE Error: {sseError.message || "Connection lost"}</span>
                                            </div>
                                        )}
                                        {logs.length === 0 ? (
                                            <p className="text-gray-500">Chưa có logs. Nhấn &quot;Rerun AI&quot; để xem logs xử lý.</p>
                                        ) : (
                                            logs.map((log, index) => (
                                                <div key={index} className="mb-1">
                                                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                                                    <span className={log.level === "error" ? "text-red-400" : ""}>{log.message}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <Image
                            src={selectedImage || "/placeholder.svg"}
                            alt="Zoomed"
                            width={1200}
                            height={800}
                            className="object-contain"
                        />
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-4 right-4"
                            onClick={() => setSelectedImage(null)}
                        >
                            ✕
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
