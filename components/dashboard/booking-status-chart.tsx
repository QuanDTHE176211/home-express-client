"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  bookings: {
    label: "Đơn hàng",
  },
  completed: {
    label: "Hoàn thành",
    color: "var(--color-accent-green)",
  },
  inProgress: {
    label: "Đang thực hiện",
    color: "var(--color-accent-teal)",
  },
} satisfies ChartConfig

interface BookingStatusChartProps {
  completed: number
  inProgress: number
}

export function BookingStatusChart({ completed, inProgress }: BookingStatusChartProps) {
  const chartData = React.useMemo(() => [
    { browser: "completed", visitors: completed, fill: "var(--color-accent-green)" },
    { browser: "inProgress", visitors: inProgress, fill: "var(--color-accent-teal)" },
  ], [completed, inProgress])

  const totalBookings = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Trạng thái đơn hàng</CardTitle>
        <CardDescription>Tổng quan đơn hàng</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalBookings.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Đơn hàng
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground text-center">
          Hiển thị tổng số đơn hàng hoàn thành và đang thực hiện
        </div>
      </CardFooter>
    </Card>
  )
}
