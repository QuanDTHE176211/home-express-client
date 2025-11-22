/**
 * Encrypted Stats Card Component
 * 
 * Displays financial statistics with encrypted data support
 * Shows masked values by default, with option to reveal decrypted data for authorized users
 */

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Lock, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface EncryptedStatsCardProps {
  title: string
  maskedValue: string
  decryptedValue?: string | number
  icon: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  canViewEncrypted: boolean
  trend?: string
  className?: string
}

export function EncryptedStatsCard({
  title,
  maskedValue,
  decryptedValue,
  icon,
  variant = "default",
  canViewEncrypted,
  trend,
  className,
}: EncryptedStatsCardProps) {
  const [showDecrypted, setShowDecrypted] = useState(false)

  const variantStyles = {
    default: "border-border",
    success: "border-green-500/20 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20",
    danger: "border-red-500/20 bg-red-50/50 dark:bg-red-950/20",
  }

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  }

  const displayValue = showDecrypted && decryptedValue !== undefined 
    ? typeof decryptedValue === 'number' 
      ? decryptedValue.toLocaleString('vi-VN') + ' VND'
      : decryptedValue
    : maskedValue

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {!canViewEncrypted && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className={cn(
                "text-2xl font-bold",
                showDecrypted ? "text-foreground" : "text-muted-foreground"
              )}>
                {displayValue}
              </p>
              {trend && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {trend}
                </span>
              )}
            </div>

            {canViewEncrypted && decryptedValue !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDecrypted(!showDecrypted)}
                className="h-7 text-xs gap-1"
              >
                {showDecrypted ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Ẩn
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Hiện
                  </>
                )}
              </Button>
            )}
          </div>

          <div className={cn("p-3 rounded-lg bg-background/50", iconStyles[variant])}>
            {icon}
          </div>
        </div>

        {/* Encryption indicator */}
        {canViewEncrypted && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Dữ liệu được mã hóa AES-256</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

