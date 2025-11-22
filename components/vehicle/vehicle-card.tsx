"use client"

import { Package, Check, X, Edit, Trash, Settings, MoreVertical } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { vehicleTypeLabels, vehicleTypeIcons, vehicleStatusLabels, vehicleStatusColors } from "@/lib/vehicle-utils"
import type { Vehicle } from "@/types"

interface VehicleCardProps {
  vehicle: Vehicle
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicleId: number) => void
  onConfigurePricing: (vehicleId: number) => void
  onStatusChange: (vehicleId: number, status: string) => void
}

export function VehicleCard({ vehicle, onEdit, onDelete, onConfigurePricing, onStatusChange }: VehicleCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{vehicleTypeIcons[vehicle.type]}</div>
            <div>
              <h3 className="font-semibold text-lg">{vehicle.model}</h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.license_plate} • {vehicleTypeLabels[vehicle.type]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={vehicleStatusColors[vehicle.status]}>{vehicleStatusLabels[vehicle.status]}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thay đổi trạng thái</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange(vehicle.vehicle_id, "available")}>
                  Sẵn sàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(vehicle.vehicle_id, "in_use")}>
                  Đang dùng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(vehicle.vehicle_id, "maintenance")}>
                  Bảo trì
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(vehicle.vehicle_id, "inactive")}>
                  Không hoạt động
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>
              {vehicle.capacity_kg}kg {vehicle.capacity_m3 && `/ ${vehicle.capacity_m3}m³`}
            </span>
          </div>

          <div className="flex gap-4 text-sm">
            {vehicle.has_tools ? (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-4 w-4" /> Dụng cụ
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <X className="h-4 w-4" /> Dụng cụ
              </span>
            )}
            {vehicle.has_tail_lift ? (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-4 w-4" /> Thang nâng
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <X className="h-4 w-4" /> Thang nâng
              </span>
            )}
          </div>

          {vehicle.description && <p className="text-sm text-muted-foreground">{vehicle.description}</p>}

          {(vehicle.year || vehicle.color) && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              {vehicle.year && <span>Năm: {vehicle.year}</span>}
              {vehicle.color && <span>Màu: {vehicle.color}</span>}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onConfigurePricing(vehicle.vehicle_id)}>
          <Settings className="mr-2 h-4 w-4" />
          Cài đặt giá
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(vehicle)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(vehicle.vehicle_id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
