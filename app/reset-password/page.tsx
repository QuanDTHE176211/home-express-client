"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validatePassword } from "@/lib/validators"
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter"
import { Eye, EyeOff, Loader2, CheckCircle2, Home, Lock, Shield } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const translations = t.resetPassword

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      setError("Link đặt lại mật khẩu không hợp lệ")
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!validatePassword(password)) {
      setError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số")
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    try {
      await apiClient.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại")
    } finally {
      setLoading(false)
    }
  }

  if (!token && !error) {
    return null
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* LEFT SIDE - RESET PASSWORD FORM */}
      <div className="relative flex flex-col justify-center bg-white lg:flex-[0_0_52%] w-full lg:w-auto px-6 sm:px-12 lg:px-20 py-12 animate-fade-in-up z-10 lg:clip-path-angled lg:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.12)]">
        <Link
          href="/login"
          className="absolute top-6 left-6 sm:top-8 sm:left-8 w-11 h-11 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-all duration-300 hover:-translate-x-1 hover:shadow-md group"
        >
          <Home className="w-5 h-5 text-gray-600 group-hover:text-foreground transition-colors" />
        </Link>

        {/* Content Container */}
        <div className="max-w-[440px] mx-auto w-full">
          <div className="mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green/10 to-accent-green/5 mb-6 shadow-lg shadow-accent-green/5">
              <Lock className="w-8 h-8 text-accent-green" />
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
              <Alert className="border-green-200 bg-green-50 text-green-900 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="ml-2">
                  <strong className="font-semibold">{translations.successMessage}</strong>
                </AlertDescription>
              </Alert>
            ) : (
              token && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-neutral-700">
                      {translations.newPassword}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none z-10" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-12 pr-12 h-13 border-2 border-gray-200 rounded-xl focus:border-foreground focus:ring-4 focus:ring-foreground/5 transition-all duration-300 hover:border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 z-10"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && <PasswordStrengthMeter password={password} />}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-neutral-700">
                      {translations.confirmPassword}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none z-10" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-12 pr-12 h-13 border-2 border-gray-200 rounded-xl focus:border-foreground focus:ring-4 focus:ring-foreground/5 transition-all duration-300 hover:border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 z-10"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 hover:from-gray-900 hover:via-foreground hover:to-gray-900 text-background font-semibold rounded-xl shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md mt-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {translations.resetting}
                      </>
                    ) : (
                      translations.resetButton
                    )}
                  </Button>
                </>
              )
            )}
          </form>
        </div>
      </div>

      {/* RIGHT SIDE - SECURITY FEATURES */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-foreground via-gray-900 to-gray-800 text-background relative overflow-hidden animate-fade-in-up ml-[-3%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_100%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-20 w-full">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 animate-float shadow-2xl shadow-black/20 border border-white/10">
            <Shield className="w-12 h-12" />
          </div>

          <h2
            className="text-[1.75rem] font-bold mb-4 leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Bảo mật tài khoản
          </h2>

          <p
            className="text-[0.9375rem] leading-relaxed text-white/90 mb-12 max-w-md animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            Mật khẩu mới của bạn sẽ được mã hóa và bảo mật tuyệt đối
          </p>

          <div className="flex flex-col items-center gap-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Lock className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">Mã hóa an toàn</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <Shield className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">Bảo vệ dữ liệu</div>
            </div>

            <div className="flex items-center gap-5 group cursor-default">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:bg-white/20 group-hover:shadow-xl group-hover:shadow-black/20 border border-white/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="text-[1rem] font-semibold">Xác thực nhanh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
