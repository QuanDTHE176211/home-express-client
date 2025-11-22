"use client"

import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Step {
  number: number
  label: string
  href?: string
}

interface BookingFlowBreadcrumbProps {
  currentStep: number
  onBack?: () => void
  showBackButton?: boolean
}

export function BookingFlowBreadcrumb({ currentStep, onBack, showBackButton = true }: BookingFlowBreadcrumbProps) {
  const router = useRouter()

  const steps: Step[] = [
    { number: 1, label: "Tạo đơn", href: "/customer/bookings/create" },
    { number: 2, label: "Xác nhận", href: "/customer/review" },
    { number: 3, label: "Chọn nhà xe", href: "/customer/bids" },
    { number: 4, label: "Thanh toán", href: "/customer/checkout" },
  ]

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="mb-6 space-y-4">
      {showBackButton && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      )}

      <nav aria-label="Progress">
        <ol className="flex items-center gap-2 text-sm overflow-x-auto">
          {steps.map((step, index) => (
            <li key={step.number} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 ${
                  step.number === currentStep
                    ? "text-foreground font-semibold"
                    : step.number < currentStep
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    step.number === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.number < currentStep
                        ? "bg-accent-green text-white"
                        : "bg-muted"
                  }`}
                >
                  {step.number < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && <div className="h-px w-8 bg-border hidden sm:block" />}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
