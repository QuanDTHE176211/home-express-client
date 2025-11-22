"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSort: { key: string; direction: "asc" | "desc" } | null
  onSort: (key: string) => void
}

export function SortableHeader({ label, sortKey, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey
  const direction = currentSort?.direction

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 font-medium transition-colors",
        "hover:bg-accent/50 hover:text-accent-foreground",
        "data-[state=open]:bg-accent",
        isActive && "text-primary",
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="font-semibold">{label}</span>
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="ml-2 h-3.5 w-3.5 text-primary" />
        ) : (
          <ArrowDown className="ml-2 h-3.5 w-3.5 text-primary" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
      )}
    </Button>
  )
}
