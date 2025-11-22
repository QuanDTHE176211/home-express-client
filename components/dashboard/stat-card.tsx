"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  variant?: "default" | "success" | "warning" | "error"
  className?: string
  href?: string
}

export function StatCard({ title, value, icon, trend, variant = "default", className, href }: StatCardProps) {
  const cardContent = (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
        href && "cursor-pointer hover:border-accent-green",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-semibold flex items-center gap-1",
                  trend.startsWith("+") ? "text-success" : "text-error",
                )}
              >
                {trend.startsWith("+") ? "↑" : "↓"}
                {trend}
              </p>
            )}
          </div>

          
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}
