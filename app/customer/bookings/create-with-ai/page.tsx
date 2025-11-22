"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { Upload, Camera, X, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { navItems } from "@/lib/customer-nav-config"

interface UploadedImage {
  id: string
  file: File
  preview: string
  status: "uploading" | "uploaded" | "analyzing" | "analyzed" | "error"
  progress: number
}

interface DetectedItem {
  id: string
  aiLabel: string
  confidence: number
  categoryId: number
  categoryName: string
  estimatedWeight?: number
  isFragile?: boolean
  requiresDisassembly?: boolean
  requiresPackaging?: boolean
  imageUrl: string
}

export default function CreateBookingWithAIPage() {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState<"idle" | "uploading" | "detecting" | "categorizing" | "complete">(
    "idle",
  )
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    router.replace("/customer/bookings/create")
  }, [router])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} không phải là file ảnh`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} quá lớn (tối đa 5MB)`)
        return false
      }
      return true
    })

    // Create preview URLs
    const newImages: UploadedImage[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "uploading",
      progress: 0,
    }))

    setImages((prev) => [...prev, ...newImages])

    // Simulate upload progress
    newImages.forEach((img) => {
      simulateUpload(img.id)
    })
  }

  // Simulate upload progress
  const simulateUpload = (imageId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                progress,
                status: progress >= 100 ? "uploaded" : "uploading",
              }
            : img,
        ),
      )
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 200)
  }

  // Remove image
  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === imageId)
      if (img) {
        URL.revokeObjectURL(img.preview)
      }
      return prev.filter((i) => i.id !== imageId)
    })
  }

  // Start AI analysis
  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 ảnh")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysisStep("uploading")
    setAnalysisProgress(0)

    try {
      // Step 1: Upload to cloud (25%)
      setAnalysisProgress(25)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 2: AI Detection (50%)
      setAnalysisStep("detecting")
      setAnalysisProgress(50)

      // Simulate AI detection API call
      const mockDetectedItems: DetectedItem[] = [
        {
          id: "1",
          aiLabel: "Refrigerator",
          confidence: 0.95,
          categoryId: 1,
          categoryName: "T? l?nh",
          estimatedWeight: 80,
          isFragile: false,
          requiresDisassembly: false,
          requiresPackaging: true,
          imageUrl: images[0]?.preview || "",
        },
        {
          id: "2",
          aiLabel: "Sofa",
          confidence: 0.92,
          categoryId: 2,
          categoryName: "Sofa",
          estimatedWeight: 50,
          isFragile: false,
          requiresDisassembly: true,
          requiresPackaging: false,
          imageUrl: images[1]?.preview || "",
        },
        {
          id: "3",
          aiLabel: "Television",
          confidence: 0.88,
          categoryId: 3,
          categoryName: "TV",
          estimatedWeight: 15,
          isFragile: true,
          requiresDisassembly: false,
          requiresPackaging: true,
          imageUrl: images[2]?.preview || "",
        },
      ]

      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 3: Categorize (75%)
      setAnalysisStep("categorizing")
      setAnalysisProgress(75)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 4: Complete (100%)
      setAnalysisStep("complete")
      setAnalysisProgress(100)
      setDetectedItems(mockDetectedItems)

      toast.success(`Phát hiện ${mockDetectedItems.length} món đồ thành công!`)
    } catch (err) {
      setError("Có lỗi xảy ra khi phân tích ảnh. Vui lòng thử lại.")
      toast.error("Phân tích thất bại")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleContinue = () => {
    // Store detected items in session storage
    sessionStorage.setItem("aiDetectedItems", JSON.stringify(detectedItems))
    // Redirect to booking creation page
    router.push("/customer/bookings/create")
  }

  const allImagesUploaded = images.length > 0 && images.every((img) => img.status === "uploaded")

  return (
    <DashboardLayout navItems={navItems} title="Create Booking with AI">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Tạo booking với AI</h1>
          </div>
          <p className="text-lg text-muted-foreground">Chụp ảnh đồ đạc, AI sẽ tự động nhận diện và tính giá cho bạn.</p>
        </div>

        {/* Benefits */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Nhanh chóng</h3>
                  <p className="text-sm text-muted-foreground">Chỉ 3 phút thay vì 15 phút</p>
                </div>
              </div>
                </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Chính xác</h3>
                  <p className="text-sm text-muted-foreground">AI nhận diện với độ chính xác trên 85%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Dễ dùng</h3>
                  <p className="text-sm text-muted-foreground">Không cần biết tên đồ đạc</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {analysisStep === "idle" ? (
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Tải ảnh đồ đạc</CardTitle>
              <CardDescription>Chụp hoặc tải lên 5-10 ảnh các món đồ cần vận chuyển</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isAnalyzing}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Kéo thả ảnh vào đây hoặc click để chọn</p>
                  <p className="text-sm text-muted-foreground">Hỗ trợ: JPG, PNG, HEIC, WebP (tối đa 5MB/ảnh)</p>
                </label>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={image.preview || "/placeholder.svg"}
                          alt="Preview"
                          width={320}
                          height={320}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Status Overlay */}
                      {image.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <div className="text-sm font-medium mb-2">{image.progress}%</div>
                            <Progress value={image.progress} className="w-20 h-1" />
                          </div>
                        </div>
                      )}

                      {image.status === "uploaded" && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-success text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đã tải
                          </Badge>
                        </div>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(image.id)}
                        disabled={isAnalyzing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mẹo:</strong> Chụp ảnh rõ nét, đủ ánh sáng, mỗi ảnh 1-2 món đồ để AI nhận diện chính xác nhất
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Quay l?i
              </Button>
              <Button onClick={handleAnalyze} disabled={!allImagesUploaded || isAnalyzing}>
                {isAnalyzing ? "Đang phân tích..." : "Phân tích ảnh với AI"}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            {/* AI Analysis Progress */}
            {analysisStep !== "complete" && (
              <Card>
                <CardHeader>
                  <CardTitle>Bước 2: AI đang phân tích ảnh</CardTitle>
                  <CardDescription>Vui lòng đợi trong giây lát...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {analysisStep === "uploading" && "Đang tải ảnh lên cloud..."}
                        {analysisStep === "detecting" && "Đang nhận diện vật phẩm..."}
                        {analysisStep === "categorizing" && "Đang phân loại và tính toán..."}
                      </span>
                      <span className="text-sm font-medium">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>

                  {/* Processing Steps */}
                  <div className="space-y-2">
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        analysisStep === "uploading" && "bg-primary/10",
                        analysisProgress > 25 && "bg-success/10",
                      )}
                    >
                      {analysisProgress > 25 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="font-medium">Tải ảnh lên hệ thống</span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        analysisStep === "detecting" && "bg-primary/10",
                        analysisProgress > 50 && "bg-success/10",
                      )}
                    >
                      {analysisProgress > 50 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : analysisProgress > 25 ? (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                      <span className="font-medium">Nhận diện vật phẩm bằng AI</span>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        analysisStep === "categorizing" && "bg-primary/10",
                        analysisProgress > 75 && "bg-success/10",
                      )}
                    >
                      {analysisProgress > 75 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : analysisProgress > 50 ? (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                      <span className="font-medium">Phân loại và ghép với cơ sở dữ liệu</span>
                  </div>
                    </div>
                </CardContent>
              </Card>
            )}

            {/* Detection Results */}
            {analysisStep === "complete" && detectedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    Phát hiện {detectedItems.length} món đồ
                  </CardTitle>
                  <CardDescription>AI đã nhận diện thành công các món đồ từ ảnh của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {detectedItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.categoryName}
                              width={320}
                              height={320}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{item.categoryName}</h4>
                              <Badge variant="secondary">{Math.round(item.confidence * 100)}%</Badge>
                            </div>

                            <div className="text-sm space-y-1">
                              {item.estimatedWeight && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Khối lượng:</span>
                                  <span className="font-medium">{item.estimatedWeight}kg</span>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.isFragile && (
                                  <Badge variant="outline" className="text-xs">
                                    Dễ vỡ
                                  </Badge>
                                )}
                                {item.requiresDisassembly && (
                                  <Badge variant="outline" className="text-xs">
                                    Cần tháo lắp
                                  </Badge>
                                )}
                                {item.requiresPackaging && (
                                  <Badge variant="outline" className="text-xs">
                                    Cần đóng gói
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setAnalysisStep("idle")}>
                    Ch?p l?i
                  </Button>
                  <Button onClick={handleContinue} className="bg-success hover:bg-success/90">
                    Ti?p t?c t?o booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}







