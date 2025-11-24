"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatVND } from "@/lib/format"

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--color-accent-green)",
  },
} satisfies ChartConfig

interface RevenueChartProps {
  data: { month: string; revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo tháng</CardTitle>
        <CardDescription>Biểu đồ doanh thu trong năm qua</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(value: number) => formatVND(Number(value))} />}
            />
            <Bar dataKey="revenue" fill="var(--color-accent-green)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
