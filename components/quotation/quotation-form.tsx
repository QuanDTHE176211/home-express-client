"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Calculator, CheckCircle2, Info, Package, Shield, Truck, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"
import { formatVND } from "@/lib/format"
import type { BookingDetailResponse } from "@/types"

interface BookingItemForQuote {
  id: string
  name: string
  quantity: number
  weight?: number
  volume?: number
  is_fragile?: boolean
  requires_disassembly?: boolean
  category_id?: number
}

interface BookingForQuote {
  id: number
  pickup_floor: number
  has_elevator: boolean
  distance_km?: number | null
  preferred_date: string
  items: BookingItemForQuote[]
}

interface VehiclePricing {
  basePrice: number
  perKmFirst4km: number
  perKm5To40km: number
  perKmAfter40km: number
  fragileMultiplier?: number
  disassemblyMultiplier?: number
  heavyMultiplier?: number
  noElevatorFee?: number
  elevatorDiscount?: number
}

interface Vehicle {
  vehicle_id: number
  model: string
  license_plate: string
  capacity_kg: number
  capacity_m3: number
  has_tail_lift: boolean
  has_tools: boolean
  pricing?: VehiclePricing
}

interface CategoryPricing {
  categoryId: number
  pricePerUnit: number
  fragileMultiplier: number
  disassemblyMultiplier: number
  heavyMultiplier: number
}

interface QuotationFormProps {
  booking?: BookingForQuote
  bookingId?: number
  onCancel?: () => void
  onSuccess?: () => void
}

function mapBookingDetailToQuote(detail: BookingDetailResponse["booking"]): BookingForQuote {
  const items = (detail.items ?? []).map((item: any) => {
    const height = item.height_cm ?? item.heightCm
    const width = item.width_cm ?? item.widthCm
    const depth = item.depth_cm ?? item.depthCm

    const volume =
      item.volume ?? item.volume_m3 ?? (height && width && depth ? (Number(height) * Number(width) * Number(depth)) / 1_000_000 : undefined)

    return {
      id: item.item_id?.toString() ?? item.id?.toString() ?? `${item.name ?? "item"}-${item.category_id ?? "unknown"}`,
      name: item.name ?? "Item",
      quantity: item.quantity ?? 1,
      weight:
        item.weight ??
        item.weight_kg ??
        (item.weightKg !== undefined ? Number(item.weightKg) : undefined),
      volume: volume !== undefined ? Number(volume) : undefined,
      is_fragile: Boolean(item.is_fragile ?? item.fragile ?? item.isFragile),
      requires_disassembly: Boolean(item.requires_disassembly ?? item.requiresDisassembly),
      category_id: item.category_id ?? item.categoryId,
    }
  })

  return {
    id: detail.booking_id ?? 0,
    pickup_floor: detail.pickup_floor ?? 0,
    has_elevator: Boolean(detail.pickup_has_elevator),
    distance_km: detail.distance_km ?? null,
    preferred_date: detail.preferred_date ?? "",
    items,
  }
}

export function QuotationForm({ booking, bookingId, onCancel, onSuccess }: QuotationFormProps) {
  const router = useRouter()

  const [formBooking, setFormBooking] = useState<BookingForQuote | null>(booking ?? null)
  const [bookingLoading, setBookingLoading] = useState(!booking && Boolean(bookingId))
  const [bookingError, setBookingError] = useState<string | null>(null)

  const [eligibleVehicles, setEligibleVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [categoryPricing, setCategoryPricing] = useState<CategoryPricing[]>([])

  const [basePrice, setBasePrice] = useState(0)
  const [distancePrice, setDistancePrice] = useState(0)
  const [itemHandlingPrice, setItemHandlingPrice] = useState(0)
  const [referencePrice, setReferencePrice] = useState(0)

  const [services, setServices] = useState({
    packaging: false,
    disassembly: false,
    insurance: false,
    storage: false,
  })

  const [servicePrices, setServicePrices] = useState({
    packaging: 0,
    disassembly: 0,
    insurance: 0,
    storage: 0,
  })

  const [estimatedDuration, setEstimatedDuration] = useState(2)
  const [startTime, setStartTime] = useState("")
  const [notes, setNotes] = useState("")

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (booking) {
      setFormBooking(booking)
      setBookingLoading(false)
      setBookingError(null)
    }
  }, [booking])

  useEffect(() => {
    if (!booking && bookingId) {
      let mounted = true
      setBookingLoading(true)
      setBookingError(null)

      apiClient
        .getBookingDetail(bookingId)
        .then((response) => {
          if (!mounted) return
          setFormBooking(mapBookingDetailToQuote(response.booking))
        })
        .catch((error: any) => {
          if (!mounted) return
          setBookingError(error?.message || "Unable to load booking detail")
          setFormBooking(null)
        })
        .finally(() => {
          if (mounted) setBookingLoading(false)
        })

      return () => {
        mounted = false
      }
    }
  }, [booking, bookingId])

  const totalWeight = useMemo(
    () => formBooking?.items?.reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 1), 0) || 0,
    [formBooking],
  )

  const totalVolume = useMemo(
    () => formBooking?.items?.reduce((sum, item) => sum + (item.volume || 0) * (item.quantity || 1), 0) || 0,
    [formBooking],
  )

  useEffect(() => {
    const loadPricingData = async () => {
      if (!formBooking) return

      try {
        setLoadingVehicles(true)

        const requiresTailLift = (formBooking.pickup_floor || 0) > 3 && !formBooking.has_elevator
        const requiresTools = formBooking.items?.some((item) => item.requires_disassembly) || false

        const vehicleResponse = await apiClient.request<{
          success: boolean
          data: Vehicle[]
        }>("/transport/vehicles/eligible", {
          method: "POST",
          body: JSON.stringify({
            totalWeight,
            totalVolume,
            requiresTailLift,
            requiresTools,
          }),
        })

        const vehicles = vehicleResponse.data || []
        setEligibleVehicles(vehicles)
        if (vehicles.length > 0) {
          setSelectedVehicleId(vehicles[0].vehicle_id)
        }

        const categoryResponse = await apiClient.request<{
          success: boolean
          data: { pricingRules: CategoryPricing[] }
        }>("/transport/pricing/categories")

        setCategoryPricing(categoryResponse.data?.pricingRules || [])
      } catch (error) {
        console.error("Failed to load pricing data", error)
      } finally {
        setLoadingVehicles(false)
      }
    }

    loadPricingData()
  }, [formBooking, totalWeight, totalVolume])

  useEffect(() => {
    if (!formBooking || !selectedVehicleId) return

    const vehicle = eligibleVehicles.find((v) => v.vehicle_id === selectedVehicleId)
    if (!vehicle || !vehicle.pricing) return

    const pricing = vehicle.pricing
    const distance = formBooking.distance_km ?? 0

    let calculatedBase = pricing.basePrice

    let calculatedDistance = 0
    if (distance <= 4) {
      calculatedDistance = distance * pricing.perKmFirst4km
    } else if (distance <= 40) {
      calculatedDistance = 4 * pricing.perKmFirst4km + (distance - 4) * pricing.perKm5To40km
    } else {
      calculatedDistance =
        4 * pricing.perKmFirst4km + 36 * pricing.perKm5To40km + (distance - 40) * pricing.perKmAfter40km
    }

    let calculatedItemHandling = 0
    formBooking.items?.forEach((item) => {
      const categoryRule = categoryPricing.find((rule) => rule.categoryId === item.category_id)
      if (!categoryRule) return

      let itemPrice = categoryRule.pricePerUnit
      if (item.is_fragile) {
        itemPrice *= categoryRule.fragileMultiplier
      }
      if (item.requires_disassembly) {
        itemPrice *= categoryRule.disassemblyMultiplier
      }
      if (item.weight && item.weight > 100) {
        itemPrice *= categoryRule.heavyMultiplier
      }

      calculatedItemHandling += itemPrice * (item.quantity || 1)
    })

    if (formBooking.pickup_floor > 3 && !formBooking.has_elevator && pricing.noElevatorFee) {
      calculatedBase += pricing.noElevatorFee
    } else if (formBooking.has_elevator && pricing.elevatorDiscount) {
      calculatedBase -= pricing.elevatorDiscount
    }

    setBasePrice(Math.round(calculatedBase))
    setDistancePrice(Math.round(calculatedDistance))
    setItemHandlingPrice(Math.round(calculatedItemHandling))
    setReferencePrice(Math.round(calculatedBase + calculatedDistance + calculatedItemHandling))
  }, [formBooking, selectedVehicleId, eligibleVehicles, categoryPricing])

  const additionalServicesPrice = useMemo(() => {
    return (
      (services.packaging ? servicePrices.packaging : 0) +
      (services.disassembly ? servicePrices.disassembly : 0) +
      (services.insurance ? servicePrices.insurance : 0) +
      (services.storage ? servicePrices.storage : 0)
    )
  }, [services, servicePrices])

  const totalPrice = basePrice + distancePrice + itemHandlingPrice + additionalServicesPrice
  const priceDeltaPercent = referencePrice > 0 ? ((totalPrice - referencePrice) / referencePrice) * 100 : 0
  const requiresExplanation = referencePrice > 0 && priceDeltaPercent > 20 && notes.trim().length === 0

  const bookingData = formBooking

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setLoading(true)

    try {
      if (!bookingData) {
        throw new Error("Booking information is missing")
      }

      if (!selectedVehicleId) {
        throw new Error("Please choose a vehicle")
      }

      if (totalPrice < 100000) {
        throw new Error("Total quotation must be at least 100,000 VND")
      }

      if (!startTime) {
        throw new Error("Please choose a proposed start time")
      }

      if (estimatedDuration < 1) {
        throw new Error("Estimated duration must be at least 1 hour")
      }

      if (requiresExplanation) {
        throw new Error("Please explain why the price is more than 20% above reference")
      }

      if (!selectedVehicleId) {
        throw new Error("Please select a vehicle")
      }

      await apiClient.submitQuotation({
        bookingId: bookingData.id,
        vehicleId: selectedVehicleId,
        basePrice,
        distancePrice,
        itemHandlingPrice,
        additionalServicesPrice,
        includesPackaging: services.packaging,
        includesDisassembly: services.disassembly,
        includesInsurance: services.insurance,
        insuranceValue: services.insurance ? servicePrices.insurance : undefined,
        estimatedDurationHours: estimatedDuration,
        estimatedStartTime: startTime,
        notes: notes.trim() ? notes.trim() : undefined,
      })

      setSuccess(true)

      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          router.push("/transport/quotations")
        }, 1500)
      }
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to submit quotation")
    } finally {
      setLoading(false)
    }
  }

  if (bookingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading booking information...</p>
      </div>
    )
  }

  if (bookingError || !bookingData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{bookingError ?? "Unable to load booking detail."}</AlertDescription>
      </Alert>
    )
  }

  if (success && !onSuccess) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Quotation submitted successfully! Redirecting to your quotations...
        </AlertDescription>
      </Alert>
    )
  }

  if (loadingVehicles) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading vehicles and pricing...</p>
      </div>
    )
  }

  if (eligibleVehicles.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">No suitable vehicle found for this booking</p>
          <p className="text-sm text-muted-foreground">
            Total weight {totalWeight.toFixed(1)}kg, total volume {totalVolume.toFixed(2)}m³. Update your vehicle list to
            continue.
          </p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/transport/vehicles")}>
            Manage vehicles
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const selectedVehicle = eligibleVehicles.find((v) => v.vehicle_id === selectedVehicleId) ?? eligibleVehicles[0]

  const handleServiceToggle = (key: keyof typeof services) => (checked: boolean) => {
    setServices((prev) => ({ ...prev, [key]: checked }))
  }

  const handleServicePriceChange = (key: keyof typeof servicePrices) => (value: string) => {
    const numeric = Number(value || 0)
    if (Number.isNaN(numeric)) return
    setServicePrices((prev) => ({ ...prev, [key]: Math.max(0, numeric) }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Choose vehicle
          </CardTitle>
          <CardDescription>Select a vehicle that will perform this booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle</Label>
            <Select value={String(selectedVehicle?.vehicle_id ?? "")} onValueChange={(value) => setSelectedVehicleId(Number(value))}>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {eligibleVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.vehicle_id} value={String(vehicle.vehicle_id)}>
                    {vehicle.model} ({vehicle.license_plate}) - {vehicle.capacity_kg}kg / {vehicle.capacity_m3}m³
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVehicle && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span>
                  Tail lift: {selectedVehicle.has_tail_lift ? "Yes" : "No"} · Tools: {selectedVehicle.has_tools ? "Yes" : "No"}
                </span>
              </div>
              <div>
                Capacity: {selectedVehicle.capacity_kg}kg / {selectedVehicle.capacity_m3}m³ · License: {selectedVehicle.license_plate}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pricing details
          </CardTitle>
          <CardDescription>Adjust the pricing components if needed</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base price (vehicle)</Label>
            <Input
              id="basePrice"
              type="number"
              min={0}
              value={basePrice}
              onChange={(event) => setBasePrice(Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="distancePrice">Distance price</Label>
            <Input
              id="distancePrice"
              type="number"
              min={0}
              value={distancePrice}
              onChange={(event) => setDistancePrice(Number(event.target.value || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemHandlingPrice">Item handling</Label>
            <Input
              id="itemHandlingPrice"
              type="number"
              min={0}
              value={itemHandlingPrice}
              onChange={(event) => setItemHandlingPrice(Number(event.target.value || 0))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Additional services
          </CardTitle>
          <CardDescription>Select optional services and enter their costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "packaging", label: "Packaging", icon: Package },
            { key: "disassembly", label: "Disassembly", icon: Wrench },
            { key: "insurance", label: "Insurance", icon: Shield },
            { key: "storage", label: "Storage", icon: Truck },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Checkbox id={`service-${key}`} checked={services[key as keyof typeof services]} onCheckedChange={(checked) => handleServiceToggle(key as keyof typeof services)(Boolean(checked))} />
                <Label htmlFor={`service-${key}`} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </Label>
              </div>
              <Input
                type="number"
                className="w-32"
                min={0}
                disabled={!services[key as keyof typeof services]}
                value={servicePrices[key as keyof typeof servicePrices]}
                onChange={(event) => handleServicePriceChange(key as keyof typeof servicePrices)(event.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Schedule & notes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Proposed start time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={estimatedDuration}
              onChange={(event) => setEstimatedDuration(Number(event.target.value || 1))}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">Notes for customer</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Explain important details about your quotation..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle>Total summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Base price</span>
            <span>{formatVND(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Distance</span>
            <span>{formatVND(distancePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Item handling</span>
            <span>{formatVND(itemHandlingPrice)}</span>
          </div>
          {additionalServicesPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>Additional services</span>
              <span>{formatVND(additionalServicesPrice)}</span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total quotation</span>
            <span className={priceDeltaPercent > 20 ? "text-destructive" : "text-primary"}>
              {formatVND(totalPrice)}
            </span>
          </div>
          {referencePrice > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delta vs reference</span>
              <span className={priceDeltaPercent > 20 ? "text-destructive font-semibold" : undefined}>
                {priceDeltaPercent > 0 ? "+" : ""}
                {priceDeltaPercent.toFixed(1)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onCancel) {
              onCancel()
            } else {
              router.back()
            }
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Submitting..." : "Submit quotation"}
        </Button>
      </div>
    </form>
  )
}

