"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Home,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { getPasswordStrength } from "@/lib/validators"
import { normalizeVNPhone } from "@/utils/phone"
import { useVietnameseAddress } from "@/hooks/use-vietnamese-address"
import {
  signupStep2Schema,
  signupStep3Schema,
  signupTransportCompanySchema,
  type SignupStep2FormData,
  type SignupStep3FormData,
  type SignupTransportCompanyFormData,
} from "@/lib/schemas"

type StepKey = "role" | "contact" | "company" | "security"
type Role = "customer" | "transport"

// Component for Vietnamese address selection (Province/District/Ward)
interface CompanyAddressSelectsProps {
  companyForm: ReturnType<typeof useForm<SignupTransportCompanyFormData>>
  translations: any
}

function CompanyAddressSelects({ companyForm, translations }: CompanyAddressSelectsProps) {
  const currentValues = companyForm.watch()

  const {
    provinces,
    districts,
    wards,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards,
    provincesError,
    districtsError,
    wardsError,
  } = useVietnameseAddress(currentValues.city, currentValues.district)

  // Debug logging
  useEffect(() => {
    console.log("🔍 CompanyAddressSelects Debug:", {
      provinces: provinces?.length || 0,
      districts: districts?.length || 0,
      wards: wards?.length || 0,
      isLoadingProvinces,
      isLoadingDistricts,
      isLoadingWards,
      provincesError: provincesError?.message,
      districtsError: districtsError?.message,
      wardsError: wardsError?.message,
      currentValues: {
        city: currentValues.city,
        district: currentValues.district,
        ward: currentValues.ward,
      }
    })
  }, [provinces, districts, wards, isLoadingProvinces, isLoadingDistricts, isLoadingWards, provincesError, districtsError, wardsError, currentValues])

  const handleProvinceChange = (code: string) => {
    console.log("Province selected:", code)
    companyForm.setValue("city", code)
    companyForm.setValue("district", "")
    companyForm.setValue("ward", "")
  }

  const handleDistrictChange = (code: string) => {
    console.log("District selected:", code)
    companyForm.setValue("district", code)
    companyForm.setValue("ward", "")
  }

  const handleWardChange = (code: string) => {
    console.log("Ward selected:", code)
    companyForm.setValue("ward", code)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Province Select */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-semibold text-neutral-700">
          {translations.city}
        </Label>
        <Select
          value={currentValues.city || ""}
          onValueChange={handleProvinceChange}
          disabled={isLoadingProvinces}
        >
          <SelectTrigger
            id="city"
            className={`h-14 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.city
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-black focus:ring-black/5"
              }`}
          >
            <SelectValue placeholder={isLoadingProvinces ? "Đang tải..." : translations.cityPlaceholder || "Chọn Tỉnh/Thành phố"} />
          </SelectTrigger>
          <SelectContent>
            {provincesError ? (
              <SelectItem value="error" disabled>
                Lỗi tải dữ liệu
              </SelectItem>
            ) : provinces.length === 0 ? (
              <SelectItem value="empty" disabled>
                Không có dữ liệu
              </SelectItem>
            ) : (
              provinces.map((province) => (
                <SelectItem key={province.code} value={province.code}>
                  {province.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {companyForm.formState.errors.city && (
          <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
            {companyForm.formState.errors.city.message}
          </p>
        )}
      </div>

      {/* District Select */}
      <div className="space-y-2">
        <Label htmlFor="district" className="text-sm font-semibold text-neutral-700">
          {translations.district} <span className="text-muted-foreground text-xs">({translations.optionalLabel})</span>
        </Label>
        <Select
          value={currentValues.district || ""}
          onValueChange={handleDistrictChange}
          disabled={!currentValues.city || isLoadingDistricts}
        >
          <SelectTrigger
            id="district"
            className={`h-14 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.district
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-black focus:ring-black/5"
              }`}
          >
            <SelectValue placeholder={
              !currentValues.city
                ? "Chọn Tỉnh/TP trước"
                : isLoadingDistricts
                  ? "Đang tải..."
                  : translations.districtPlaceholder || "Chọn Quận/Huyện"
            } />
          </SelectTrigger>
          <SelectContent>
            {districtsError ? (
              <SelectItem value="error" disabled>
                Lỗi tải dữ liệu
              </SelectItem>
            ) : districts.length === 0 ? (
              <SelectItem value="empty" disabled>
                Không có dữ liệu
              </SelectItem>
            ) : (
              districts.map((district) => (
                <SelectItem key={district.code} value={district.code}>
                  {district.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {companyForm.formState.errors.district && (
          <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
            {companyForm.formState.errors.district.message}
          </p>
        )}
      </div>

      {/* Ward Select */}
      <div className="space-y-2">
        <Label htmlFor="ward" className="text-sm font-semibold text-neutral-700">
          {translations.ward || "Phường/Xã"} <span className="text-muted-foreground text-xs">({translations.optionalLabel})</span>
        </Label>
        <Select
          value={currentValues.ward || ""}
          onValueChange={handleWardChange}
          disabled={!currentValues.district || isLoadingWards}
        >
          <SelectTrigger
            id="ward"
            className={`h-14 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.ward
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-200 focus:border-black focus:ring-black/5"
              }`}
          >
            <SelectValue placeholder={
              !currentValues.district
                ? "Chọn Quận/Huyện trước"
                : isLoadingWards
                  ? "Đang tải..."
                  : translations.wardPlaceholder || "Chọn Phường/Xã"
            } />
          </SelectTrigger>
          <SelectContent>
            {wardsError ? (
              <SelectItem value="error" disabled>
                Lỗi tải dữ liệu
              </SelectItem>
            ) : wards.length === 0 ? (
              <SelectItem value="empty" disabled>
                Không có dữ liệu
              </SelectItem>
            ) : (
              wards.map((ward) => (
                <SelectItem key={ward.code} value={ward.code}>
                  {ward.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {companyForm.formState.errors.ward && (
          <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
            {companyForm.formState.errors.ward.message}
          </p>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const translations = t.signup

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const contactForm = useForm<SignupStep2FormData>({
    resolver: zodResolver(signupStep2Schema),
    mode: "onBlur",
  })

  const companyForm = useForm<SignupTransportCompanyFormData>({
    resolver: zodResolver(signupTransportCompanySchema),
    mode: "onBlur",
  })

  const securityForm = useForm<SignupStep3FormData>({
    resolver: zodResolver(signupStep3Schema),
    mode: "onChange",
  })


  const urlRole: Role | null = (() => {
    const roleParam = searchParams.get("role")
    return roleParam === "customer" || roleParam === "transport" ? (roleParam as Role) : null
  })()

  const computedRole: Role = selectedRole ?? urlRole ?? "customer"
  const stepKeys: StepKey[] =
    computedRole === "transport" ? ["role", "contact", "company", "security"] : ["role", "contact", "security"]
  const totalSteps = stepKeys.length
  const clampedStep = Math.min(currentStep, totalSteps)
  const currentStepKey = stepKeys[clampedStep - 1] ?? "role"

  const password = useWatch({ control: securityForm.control, name: "password" }) || ""
  const passwordStrength = getPasswordStrength(password)

  const getStepMeta = useCallback((key: StepKey) => {
    switch (key) {
      case "role":
        return {
          title: translations.step1Title,
          desc: translations.step1Desc,
          progressTitle: translations.progressStep1,
          progressDesc: translations.progressStep1Desc,
        }
      case "contact":
        return {
          title: translations.step2Title,
          desc: translations.step2Desc,
          progressTitle: translations.progressStep2,
          progressDesc: translations.progressStep2Desc,
        }
      case "company":
        return {
          title: translations.companyStepTitle,
          desc: translations.companyStepDesc,
          progressTitle: translations.progressStepCompany,
          progressDesc: translations.progressStepCompanyDesc,
        }
      case "security":
      default:
        return {
          title: translations.securityStepTitle,
          desc: translations.securityStepDesc,
          progressTitle: translations.progressStepSecurity,
          progressDesc: translations.progressStepSecurityDesc,
        }
    }
  }, [translations])

  const currentMeta = getStepMeta(currentStepKey)
  const progress = (clampedStep / totalSteps) * 100
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const isSecurityStep = currentStepKey === "security"
  const isFinalStep = clampedStep === totalSteps

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setCurrentStep(1)
    setError("")
    if (role !== "transport") {
      companyForm.reset()
    }
  }

  const handleNextStep = async () => {
    if (currentStepKey === "role") {
      if (!selectedRole) {
        setError(translations.roleSelectionError)
        return
      }
    }

    if (currentStepKey === "contact") {
      const isValid = await contactForm.trigger()
      if (!isValid) return
    }

    if (currentStepKey === "company") {
      const isValid = await companyForm.trigger()
      if (!isValid) return
    }

    setError("")
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const handlePrevStep = () => {
    setError("")
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data: SignupStep3FormData) => {
    setError("")

    if (!selectedRole) {
      setError(translations.roleSelectionError)
      return
    }

    // Parse contact data to get Zod-transformed values (including normalized phone)
    const contactRawData = contactForm.getValues()
    const contactResult = signupStep2Schema.safeParse(contactRawData)

    if (!contactResult.success) {
      setError("Thông tin liên hệ không hợp lệ")
      return
    }

    const contactData = contactResult.data

    try {
      if (selectedRole === "customer") {
        await registerUser({
          role: "CUSTOMER",
          email: contactData.email,
          password: data.password,
          fullName: contactData.fullName,
          phone: contactData.phone,
        })
      } else {
        const companyData = companyForm.getValues()
        await registerUser({
          role: "TRANSPORT",
          email: contactData.email,
          password: data.password,
          fullName: contactData.fullName,
          phone: contactData.phone,
          companyName: companyData.companyName,
          businessLicenseNumber: companyData.businessLicenseNumber,
          taxCode: companyData.taxCode || undefined,
          address: companyData.address,
          city: companyData.city,
          district: companyData.district || undefined,
          ward: companyData.ward || undefined,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.genericError)
    }
  }

  const stepItems = stepKeys.map((key, index) => ({
    number: index + 1,
    meta: getStepMeta(key),
  }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center gap-8 w-full max-w-[1400px] relative z-10">
        <div className="signup-container flex-1 max-w-[720px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 relative animate-fade-in-up">
          <Link
            href="/"
            className="back-button absolute top-6 left-6 w-11 h-11 rounded-xl bg-white border-2 border-neutral-200 hover:border-black hover:bg-neutral-50 flex items-center justify-center transition-all hover:-translate-x-1 hover:shadow-lg group"
            aria-label={translations.back || "Go back"}
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-black transition-colors" />
          </Link>

          <div className="text-center mb-10 mt-4 animate-fade-in-down">
            <h1 className="text-2xl font-bold mb-6 text-neutral-900">{translations.title}</h1>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-12 h-12 bg-gradient-to-br from-black to-neutral-800 text-white rounded-xl flex items-center justify-center shadow-lg"
                aria-hidden="true"
              >
                <Home className="w-6 h-6" />
              </div>
              <div className="text-xl font-black bg-gradient-to-r from-black to-neutral-700 bg-clip-text text-transparent">
                HOME EXPRESS
              </div>
            </div>

            <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-black via-neutral-800 to-neutral-600 bg-clip-text text-transparent">
              {currentMeta.title}
            </h2>
            <p className="text-neutral-600 text-sm">{currentMeta.desc}</p>
          </div>

          <div
            className="flex justify-center gap-4 mb-10"
            role="progressbar"
            aria-valuenow={clampedStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Step ${clampedStep} of ${totalSteps}`}
          >
            {stepItems.map((item) => {
              const isCompleted = item.number < currentStep
              const isCurrent = item.number === currentStep
              return (
                <div
                  key={item.number}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${isCurrent
                      ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-xl scale-110 ring-4 ring-black/10"
                      : isCompleted
                        ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-md"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${item.number}${isCompleted ? " completed" : isCurrent ? " current" : ""}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : item.number}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-black animate-ping opacity-20" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 animate-shake" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentStepKey === "role" && (
            <div
              className="space-y-4 animate-fade-in-up max-w-[580px] mx-auto"
              role="radiogroup"
              aria-label="Select account type"
            >
              <button
                type="button"
                onClick={() => handleRoleSelect("customer")}
                role="radio"
                aria-checked={selectedRole === "customer"}
                className={`role-card w-full border-2 rounded-2xl p-6 flex items-center gap-6 cursor-pointer transition-all duration-300 ${selectedRole === "customer"
                    ? "border-black bg-gradient-to-br from-neutral-50 via-white to-neutral-100 shadow-xl scale-[1.02] ring-4 ring-black/5"
                    : "border-neutral-200 hover:border-black hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] bg-white"
                  }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedRole === "customer"
                      ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-neutral-100 to-neutral-200 text-black group-hover:scale-105"
                    }`}
                  aria-hidden="true"
                >
                  <User className="w-8 h-8" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg text-black mb-1">{translations.customerRole}</div>
                  <div className="text-neutral-600 text-sm">{translations.customerDesc}</div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full border-2 relative flex-shrink-0 transition-all flex items-center justify-center ${selectedRole === "customer" ? "border-black bg-black" : "border-neutral-300"
                    }`}
                  aria-hidden="true"
                >
                  {selectedRole === "customer" && <Check className="w-4 h-4 text-white animate-scale-in" strokeWidth={3} />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("transport")}
                role="radio"
                aria-checked={selectedRole === "transport"}
                className={`role-card w-full border-2 rounded-2xl p-6 flex items-center gap-6 cursor-pointer transition-all duration-300 ${selectedRole === "transport"
                    ? "border-black bg-gradient-to-br from-neutral-50 via-white to-neutral-100 shadow-xl scale-[1.02] ring-4 ring-black/5"
                    : "border-neutral-200 hover:border-black hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] bg-white"
                  }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedRole === "transport"
                      ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-neutral-100 to-neutral-200 text-black"
                    }`}
                  aria-hidden="true"
                >
                  <Truck className="w-8 h-8" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg text-black mb-1">{translations.transportRole}</div>
                  <div className="text-neutral-600 text-sm">{translations.transportDesc}</div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full border-2 relative flex-shrink-0 transition-all flex items-center justify-center ${selectedRole === "transport" ? "border-black bg-black" : "border-neutral-300"
                    }`}
                  aria-hidden="true"
                >
                  {selectedRole === "transport" && (
                    <Check className="w-4 h-4 text-white animate-scale-in" strokeWidth={3} />
                  )}
                </div>
              </button>
            </div>
          )}

          {currentStepKey === "contact" && (
            <form className="space-y-5 animate-fade-in-up max-w-[520px] mx-auto">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-neutral-700">
                  {translations.fullName}
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={translations.fullNamePlaceholder}
                    autoComplete="name"
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${contactForm.formState.errors.fullName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...contactForm.register("fullName")}
                  />
                </div>
                {contactForm.formState.errors.fullName && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {contactForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-neutral-700">
                  {translations.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={translations.emailPlaceholder}
                    autoComplete="email"
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${contactForm.formState.errors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...contactForm.register("email")}
                  />
                </div>
                {contactForm.formState.errors.email && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {contactForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-neutral-700">
                  {translations.phone}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={translations.phonePlaceholder}
                    autoComplete="tel"
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${contactForm.formState.errors.phone
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...contactForm.register("phone")}
                    onBlur={(e) => {
                      const normalized = normalizeVNPhone(e.target.value)
                      contactForm.setValue("phone", normalized, { shouldValidate: true, shouldDirty: true })
                    }}
                  />
                </div>
                {contactForm.formState.errors.phone && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {contactForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </form>
          )}

          {selectedRole === "transport" && currentStepKey === "company" && (
            <form className="space-y-5 animate-fade-in-up max-w-[520px] mx-auto">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold text-neutral-700">
                  {translations.companyName}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder={translations.companyNamePlaceholder}
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.companyName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...companyForm.register("companyName")}
                  />
                </div>
                {companyForm.formState.errors.companyName && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {companyForm.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessLicenseNumber" className="text-sm font-semibold text-neutral-700">
                  {translations.businessLicense}
                </Label>
                <div className="relative">
                  <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="businessLicenseNumber"
                    type="text"
                    placeholder={translations.businessLicensePlaceholder}
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.businessLicenseNumber
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...companyForm.register("businessLicenseNumber")}
                  />
                </div>
                {companyForm.formState.errors.businessLicenseNumber && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {companyForm.formState.errors.businessLicenseNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxCode" className="text-sm font-semibold text-neutral-700">
                  {translations.taxCode} <span className="text-muted-foreground text-xs">({translations.optionalLabel})</span>
                </Label>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="taxCode"
                    type="text"
                    placeholder={translations.taxCodePlaceholder}
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.taxCode
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...companyForm.register("taxCode")}
                  />
                </div>
                {companyForm.formState.errors.taxCode && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {companyForm.formState.errors.taxCode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-neutral-700">
                  {translations.address}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="address"
                    type="text"
                    placeholder={translations.addressPlaceholder}
                    className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${companyForm.formState.errors.address
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...companyForm.register("address")}
                  />
                </div>
                {companyForm.formState.errors.address && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {companyForm.formState.errors.address.message}
                  </p>
                )}
              </div>

              {/* Vietnamese Address Selects (Province/District/Ward) */}
              <CompanyAddressSelects
                companyForm={companyForm}
                translations={translations}
              />

              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-semibold text-neutral-700">
                  {translations.ward} <span className="text-muted-foreground text-xs">({translations.optionalLabel})</span>
                </Label>
                <Input
                  id="ward"
                  type="text"
                  placeholder={translations.wardPlaceholder}
                  className="h-14 px-4 text-base border-2 transition-all rounded-xl border-neutral-200 focus:border-black focus:ring-black/5"
                  {...companyForm.register("ward")}
                />
              </div>
            </form>
          )}

          {isSecurityStep && (
            <form
              onSubmit={securityForm.handleSubmit(onSubmit)}
              className="space-y-5 animate-fade-in-up max-w-[520px] mx-auto"
            >
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-neutral-700">
                  {translations.password}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={securityForm.formState.isSubmitting}
                    className={`pr-12 pl-12 h-14 text-base border-2 transition-all rounded-xl ${securityForm.formState.errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...securityForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                    disabled={securityForm.formState.isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {securityForm.formState.errors.password && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {securityForm.formState.errors.password.message}
                  </p>
                )}

                {password && (
                  <div className="space-y-2 animate-fade-in-up">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">{translations.passwordStrength}</span>
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            passwordStrength.level === "strong"
                              ? "oklch(0.55 0.15 145)"
                              : passwordStrength.level === "medium"
                                ? "oklch(0.75 0.15 85)"
                                : "oklch(0.55 0.22 29)",
                        }}
                      >
                        {passwordStrength.level === "strong"
                          ? translations.passwordStrong
                          : passwordStrength.level === "medium"
                            ? translations.passwordMedium
                            : translations.passwordWeak}
                      </span>
                    </div>
                    <div
                      className="h-2 bg-neutral-200 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={passwordStrength.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Password strength"
                    >
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${passwordStrength.score}%`,
                          backgroundColor:
                            passwordStrength.level === "strong"
                              ? "oklch(0.55 0.15 145)"
                              : passwordStrength.level === "medium"
                                ? "oklch(0.75 0.15 85)"
                                : "oklch(0.55 0.22 29)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-neutral-700">
                  {translations.confirmPassword}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={securityForm.formState.isSubmitting}
                    className={`pr-12 pl-12 h-14 text-base border-2 transition-all rounded-xl ${securityForm.formState.errors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-neutral-200 focus:border-black focus:ring-black/5"
                      }`}
                    {...securityForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                    disabled={securityForm.formState.isSubmitting}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {securityForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                    {securityForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </form>
          )}

          <div className="mt-8 space-y-4 max-w-[520px] mx-auto">
            {!isFinalStep ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepKey === "role" && !selectedRole}
                className="w-full h-14 text-base bg-gradient-to-r from-black to-neutral-800 hover:from-neutral-800 hover:to-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg group"
              >
                {translations.next}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={securityForm.handleSubmit(onSubmit)}
                disabled={securityForm.formState.isSubmitting}
                className="w-full h-14 text-base bg-gradient-to-r from-black to-neutral-800 hover:from-neutral-800 hover:to-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                {securityForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {translations.registering}
                  </>
                ) : (
                  <>
                    {translations.complete}
                    <CheckCircle2 className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  </>
                )}
              </Button>
            )}

            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="outline"
                className="w-full h-14 text-base border-2 border-neutral-200 hover:border-black hover:bg-neutral-50 font-semibold rounded-xl bg-transparent transition-all group"
              >
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                {translations.back}
              </Button>
            )}
          </div>

          <p className="text-sm text-center text-neutral-600 mt-6">
            {translations.haveAccount}{" "}
            <Link href="/login" className="font-semibold hover:underline transition-all text-cyan-700">
              {translations.signIn}
            </Link>
          </p>
        </div>

        <div className="progress-sidebar w-[320px] hidden xl:block flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all hover:-translate-y-1 animate-fade-in">
            <div className="w-[120px] h-[120px] mx-auto mb-6 relative">
              <svg width="120" height="120" className="-rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="54" stroke="oklch(0.95 0 0)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.2 0 0)" />
                    <stop offset="100%" stopColor="oklch(0.4 0 0)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold bg-gradient-to-br from-black to-neutral-700 bg-clip-text text-transparent">
                {Math.round(progress)}%
              </div>
            </div>

            <h3 className="font-bold text-lg mb-6 text-center text-black">{translations.progressTitle}</h3>

            <div className="space-y-4">
              {stepItems.map((item) => {
                const isCompleted = item.number < clampedStep
                const isCurrent = item.number === clampedStep
                return (
                  <div key={item.number} className="flex items-center gap-4 group">
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${isCurrent
                          ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-xl scale-110 ring-4 ring-black/10"
                          : isCompleted
                            ? "bg-gradient-to-br from-black to-neutral-800 text-white shadow-md"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : item.number}
                      {isCurrent && <div className="absolute inset-0 rounded-full bg-black animate-ping opacity-20" />}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-semibold text-sm mb-0.5 transition-colors ${item.number <= currentStep ? "text-black" : "text-neutral-400"
                          }`}
                      >
                        {item.meta.progressTitle}
                      </div>
                      <div
                        className={`text-xs transition-colors ${item.number <= currentStep ? "text-neutral-600" : "text-neutral-400"
                          }`}
                      >
                        {item.meta.progressDesc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
