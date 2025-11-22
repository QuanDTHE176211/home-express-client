"use client"

import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  mobileLabel?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  onRowClick?: (item: T) => void
}

export function ResponsiveTable<T>({ data, columns, keyExtractor, onRowClick }: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4 space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.mobileLabel || column.label}:
                  </span>
                  <div className="text-sm text-right">{column.render(item)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <TableCell key={column.key}>{column.render(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
