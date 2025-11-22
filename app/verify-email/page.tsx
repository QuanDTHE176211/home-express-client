"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, CheckCircle2, XCircle, Mail, Shield, Clock, Home } from "lucide-react"
import { apiClient } from "@/lib/api-client"

/**
 * Email Verification Page
 *
 * Automatically verifies email using token from URL query parameter.
 * Shows loading, success, or error states with appropriate UI.
 *
 * @route /verify-email?token=xxx
 */
export default function VerifyEmailPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  const translations = t.verifyEmail

  // Automatically verify email on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token")

      // Check if token exists in URL
      if (!token) {
        setStatus("error")
        setMessage("Token xác thực không hợp lệ. Vui lòng kiểm tra link trong email.")
        return
      }

      try {
        // Call API to verify email with token
        await apiClient.verifyEmail(token)
        setStatus("success")
        setMessage("Email của bạn đã được xác thực thành công!")

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Xác thực email thất bại. Token có thể đã hết hạn.")
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* LEFT SIDE - VERIFICATION STATUS */}
      <div className="relative flex flex-col justify-center bg-white lg:flex-[0_0_52%] w-full lg:w-auto px-6 sm:px-12 lg:px-20 py-12 animate-fade-in-up z-10 lg:clip-path-angled lg:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.12)]">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 sm:top-8 sm:left-8 w-11 h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all duration-300 hover:-translate-x-1 hover:shadow-md group"
        >
          <Home className="w-5 h-5 text-gray-600 group-hover:text-foreground transition-colors" />
        </Link>

        {/* Content Container */}
        <div className="max-w-[440px] mx-auto w-full">
          {/* Status Icon */}
          <div className="mb-8 animate-fade-in-up flex flex-col items-center text-center">
            {status === "loading" && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 mb-6 shadow-lg shadow-blue-500/5">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 mb-6 shadow-lg shadow-green-500/5 animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            )}
            {status === "error" && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 mb-6 shadow-lg shadow-red-500/5 animate-shake">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            )}

            {/* Title */}
            <h1 className="text-[2rem] font-extrabold mb-2 leading-tight bg-gradient-to-br from-foreground via-gray-800 to-gray-600 bg-clip-text text-transparent">
              {translations.title}
            </h1>

            {/* Subtitle based on status */}
            <p className="text-muted-foreground text-[0.9375rem]">
              {status === "loading" && translations.verifying}
              {status === "success" && translations.successSubtitle}
              {status === "error" && translations.errorSubtitle}
            </p>
          </div>

          {/* Status Message */}
          <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {status === "loading" && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <AlertDescription className="ml-2">{translations.pleaseWait}</AlertDescription>
              </Alert>
            )}

            {status === "success" && (
              <>
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <strong className="font-semibold">{translations.successTitle}</strong>
                    <br />
                    {message}
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 space-y-4 border border-gray-200">
                  <h3 className="font-semibold text-neutral-900">{translations.nextStepsTitle}</h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.step1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.step2}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.step3}</span>
                    </li>
                  </ul>
                </div>

                <Button
                  asChild
                  className="w-full h-13 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 hover:from-gray-900 hover:via-foreground hover:to-gray-900 text-background font-semibold rounded-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Link href="/login">{translations.goToLogin}</Link>
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <Alert variant="destructive" className="animate-shake">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <strong className="font-semibold">{translations.errorTitle}</strong>
                    <br />
                    {message}
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 space-y-4 border border-gray-200">
                  <h3 className="font-semibold text-neutral-900">{translations.troubleshootTitle}</h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.tip1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.tip2}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 font-bold">•</span>
                      <span>{translations.tip3}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-13 border-2 border-gray-200 hover:border-foreground rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-transparent"
                  >
                    <Link href="/signup">{translations.signUpAgain}</Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 h-13 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 hover:from-gray-900 hover:via-foreground hover:to-gray-900 text-background font-semibold rounded-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Link href="/login">{translations.goToLogin}</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FEATURES */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 text-background relative overflow-hidden animate-fade-in-up ml-[-3%]">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-20 w-full">
          {/* Floating Icon */}
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 animate-float shadow-2xl shadow-black/20 border border-white/10">
            <Mail className="w-12 h-12" />
          </div>

          {/* Title */}
          <h2
            className="text-[1.75rem] font-bold mb-4 leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {translations.featuresTitle}
          </h2>

          {/* Description */}
          <p
            className="text-[0.9375rem] leading-relaxed text-white/90 mb-12 max-w-md animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {translations.featuresDesc}
          </p>

          {/* Feature Cards */}
          <div className="flex flex-col items-center gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Shield className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature1}</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Clock className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature2}</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Mail className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature3}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
