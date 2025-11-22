/**
 * Password Strength Meter Component
 *
 * Visual indicator of password strength with requirements checklist
 */

"use client"

import { calculatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@/lib/validation"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordStrengthMeterProps {
  password: string
  showRequirements?: boolean
}

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password)
  const label = getPasswordStrengthLabel(strength)

  const requirements = [
    { label: "Ít nhất 8 ký tự", met: password.length >= 8 },
    { label: "Chữ hoa và chữ thường", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Có số", met: /\d/.test(password) },
    { label: "Ký tự đặc biệt (@$!%*?&#)", met: /[@$!%*?&#]/.test(password) },
  ]

  return (
    <div className="space-y-3">
      {/* Strength bars */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                level < strength ? getPasswordStrengthColor(strength) : "bg-gray-200",
              )}
            />
          ))}
        </div>
        {password && (
          <p className="text-xs text-muted-foreground">
            Độ mạnh: <span className="font-medium">{label}</span>
          </p>
        )}
      </div>

      {/* Requirements checklist */}
      {showRequirements && password && (
        <div className="space-y-1.5">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check className="h-3.5 w-3.5 text-accent-green" />
              ) : (
                <X className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span className={cn("transition-colors", req.met ? "text-accent-green" : "text-muted-foreground")}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
