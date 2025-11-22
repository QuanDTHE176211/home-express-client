"use client"

import type React from "react"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateEmail } from "@/lib/validators"
import Link from "next/link"
import { Loader2, CheckCircle2, ChevronLeft, Mail, Shield, Clock, Truck } from "lucide-react"

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const translations = t.forgotPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!validateEmail(email)) {
      setError("Email không hợp lệ")
      return
    }

    setLoading(true)
    try {
      await apiClient.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi email thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      <div className="relative flex flex-col justify-center bg-white lg:flex-[0_0_52%] w-full lg:w-auto px-6 sm:px-12 lg:px-20 py-12 animate-fade-in-up z-10 lg:clip-path-angled lg:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.12)]">
        <Link
          href="/login"
          className="absolute top-6 left-6 sm:top-8 sm:left-8 w-11 h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all duration-300 hover:-translate-x-1 hover:shadow-md group"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-foreground transition-colors" />
        </Link>

        <div className="max-w-[440px] mx-auto w-full">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green/10 to-accent-green/5 mb-6 shadow-lg shadow-accent-green/5">
              <Mail className="w-8 h-8 text-accent-green" />
            </div>
            <h1 className="text-[2rem] font-extrabold mb-2 leading-tight bg-gradient-to-br from-foreground via-gray-800 to-gray-600 bg-clip-text text-transparent">
              {translations.title}
            </h1>
            <p className="text-muted-foreground text-[0.9375rem]">{translations.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {error && (
              <Alert variant="destructive" className="animate-shake">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="space-y-6 animate-fade-in">
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <strong className="font-semibold">{translations.successTitle}</strong>
                    <br />
                    {translations.successMessage}
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 space-y-4 border border-gray-200">
                  <h3 className="font-semibold text-neutral-900">{translations.noEmailTitle}</h3>
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

                <Button
                  asChild
                  className="w-full h-13 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 hover:from-gray-900 hover:via-foreground hover:to-gray-900 text-background font-semibold rounded-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Link href="/login">{translations.backToLogin}</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={translations.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-12 h-13 border-2 border-gray-200 rounded-xl focus:border-foreground focus:ring-4 focus:ring-foreground/5 transition-all duration-300 hover:border-gray-300"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-13 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 hover:from-gray-900 hover:via-foreground hover:to-gray-900 text-background font-semibold rounded-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {translations.sending}
                    </>
                  ) : (
                    translations.sendButton
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-accent-green hover:text-accent-green-dark hover:underline underline-offset-2 transition-colors"
                  >
                    {translations.backToLogin}
                  </Link>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 text-background relative overflow-hidden animate-fade-in-up ml-[-3%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-20 w-full">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 animate-float shadow-2xl shadow-black/20 border border-white/10">
            <Shield className="w-12 h-12" />
          </div>

          {/* Title */}
          <h2
            className="text-[1.75rem] font-bold mb-4 leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {translations.securityTitle}
          </h2>

          {/* Description */}
          <p
            className="text-[0.9375rem] leading-relaxed text-white/90 mb-12 max-w-md animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {translations.securityDesc}
          </p>

          <div className="flex flex-col items-center gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Mail className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature1Title}</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Clock className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature2Title}</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Shield className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">{translations.feature3Title}</div>
            </div>
          </div>

          <div className="absolute bottom-12 right-12 opacity-10">
            <Truck className="w-48 h-48 animate-float" />
          </div>
        </div>
      </div>
    </div>
  )
}
