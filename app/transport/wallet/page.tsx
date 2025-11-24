"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, FileText, Truck, Star, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, Wallet } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { label: "Tổng quan", href: "/transport", icon: "LayoutDashboard" },
  { label: "Ví của tôi", href: "/transport/wallet", icon: "CreditCard" },
  { label: "Công việc", href: "/transport/jobs", icon: "Package" },
  { label: "Báo giá", href: "/transport/quotations", icon: "FileText" },
  { label: "Xe", href: "/transport/vehicles", icon: "Truck" },
  { label: "Giá cả", href: "/transport/pricing/categories", icon: "DollarSign" },
  { label: "Hồ sơ", href: "/transport/profile", icon: "Star" },
]

export default function TransportWalletPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [walletReport, setWalletReport] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [earningsStats, setEarningsStats] = useState<any>(null)

  const [isRequestingPayout, setIsRequestingPayout] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== "TRANSPORT")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "TRANSPORT") return

      try {
        setIsLoading(true)
        const [reportData, statsData, transactionsData] = await Promise.all([
          apiClient.getWalletReport(30),
          apiClient.getEarningsStats(),
          apiClient.getTransactions(),
        ])
        
        setWalletReport(reportData)
        setEarningsStats(statsData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Failed to load wallet data", error)
        toast({
          title: "Lỗi tải dữ liệu",
          description: "Không thể tải thông tin ví. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleRequestPayout = async () => {
    setIsRequestingPayout(true)
    try {
      await apiClient.requestPayout()
      toast({
        title: "Thành công",
        description: "Yêu cầu rút tiền đã được gửi thành công.",
      })
      // Refresh data
      const [reportData, statsData, transactionsData] = await Promise.all([
        apiClient.getWalletReport(30),
        apiClient.getEarningsStats(),
        apiClient.getTransactions(),
      ])
      setWalletReport(reportData)
      setEarningsStats(statsData)
      setTransactions(transactionsData)
    } catch (error: any) {
      toast({
        title: "Không thể tạo yêu cầu",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsRequestingPayout(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green" />
      </div>
    )
  }

  if (!user || user.role !== "TRANSPORT") return null

  return (
    <DashboardLayout navItems={navItems} title="Ví của tôi">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ví của tôi</h1>
            <p className="text-muted-foreground mt-1">Quản lý thu nhập, số dư và lịch sử giao dịch</p>
          </div>
          <Button 
            className="bg-accent-green hover:bg-accent-green-dark" 
            onClick={handleRequestPayout}
            disabled={isRequestingPayout || !walletReport?.snapshot?.current_balance_vnd || walletReport?.snapshot?.current_balance_vnd <= 0}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            {isRequestingPayout ? "Đang xử lý..." : "Yêu cầu rút tiền"}
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-accent-green text-white border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-accent-green-light font-medium">Số dư khả dụng</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {formatVND(walletReport?.snapshot?.current_balance_vnd || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-sm text-accent-green-light">
                Có thể rút về tài khoản ngân hàng
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground font-medium">Đang chờ xử lý</p>
                  <h3 className="text-2xl font-bold mt-2 text-amber-600">
                    {formatVND(earningsStats?.pending_amount || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {earningsStats?.pending_transactions || 0} giao dịch đang chờ đối soát
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground font-medium">Tổng đã rút</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatVND(walletReport?.snapshot?.total_withdrawn_vnd || 0)}
                  </h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <ArrowUpRight className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Tổng tiền đã chuyển về ngân hàng
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>Danh sách các giao dịch gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="inflow">Tiền vào</TabsTrigger>
                <TabsTrigger value="outflow">Tiền ra</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <TransactionTable transactions={transactions} />
              </TabsContent>
              <TabsContent value="inflow" className="space-y-4">
                <TransactionTable transactions={transactions.filter(t => t.amount > 0)} />
              </TabsContent>
              <TabsContent value="outflow" className="space-y-4">
                <TransactionTable transactions={transactions.filter(t => t.amount < 0)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function TransactionTable({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Chưa có giao dịch nào</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã GD</TableHead>
            <TableHead>Nội dung</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.transaction_id}>
              <TableCell className="font-medium">{tx.transaction_id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {tx.booking_id ? `Thanh toán đơn hàng #${tx.booking_id}` : 
                     tx.customer_name?.startsWith("Payout") ? "Rút tiền về ngân hàng" : 
                     tx.customer_name || "Giao dịch"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.payment_method === "SETTLEMENT" ? "Đối soát tự động" : 
                     tx.payment_method === "PAYOUT" ? "Chuyển khoản ngân hàng" : 
                     tx.payment_method}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatDate(tx.created_at)}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={
                    tx.status === "COMPLETED" || tx.status === "SETTLEMENT_CREDIT" || tx.status === "PAYOUT_DEBIT" 
                      ? "border-transparent bg-success/10 text-success hover:bg-success/20" 
                      : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }
                >
                  {tx.status === "SETTLEMENT_CREDIT" ? "Hoàn thành" :
                   tx.status === "PAYOUT_DEBIT" ? "Hoàn thành" :
                   tx.status === "COMPLETED" ? "Hoàn thành" : tx.status}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-bold ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                {tx.amount >= 0 ? "+" : ""}{formatVND(tx.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
