"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ArrowLeft, Home, Mail, Lock, ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/lib/schemas"

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    try {
      await login(data.email, data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
    }
  }

  const translations = t.login

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[580px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 relative z-10 animate-fade-in-up">
        <Link
          href="/"
          className="absolute top-6 left-6 w-11 h-11 rounded-xl bg-white border-2 border-neutral-200 hover:border-black hover:bg-neutral-50 flex items-center justify-center transition-all hover:-translate-x-1 hover:shadow-lg group"
          aria-label="Quay lại trang chủ"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 group-hover:text-black transition-colors" />
        </Link>

        <div className="text-center mb-12 mt-4 animate-fade-in-down">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-black to-neutral-800 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-7 h-7" />
            </div>
            <div className="text-2xl font-black bg-gradient-to-r from-black to-neutral-700 bg-clip-text text-transparent">
              HOME EXPRESS
            </div>
          </div>

          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-black via-neutral-800 to-neutral-600 bg-clip-text text-transparent">
            {translations.welcomeBack}
          </h1>
          <p className="text-neutral-600 text-base">{translations.subtitle}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 animate-shake" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          method="post"
          autoComplete="off"
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-neutral-700">
              {translations.emailPlaceholder}
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                placeholder={translations.emailPlaceholder}
                autoComplete="email"
                disabled={isSubmitting}
                className={`h-14 pl-12 pr-4 text-base border-2 transition-all rounded-xl ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-black focus:ring-black/5 hover:border-neutral-300"
                }`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-neutral-700">
                {translations.passwordPlaceholder}
              </Label>
              <Link href="/forgot-password" className="text-xs font-semibold text-black hover:underline transition-all">
                {translations.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={translations.passwordPlaceholder}
                autoComplete="current-password"
                disabled={isSubmitting}
                className={`pr-12 pl-12 h-14 text-base border-2 transition-all rounded-xl ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-black focus:ring-black/5 hover:border-neutral-300"
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
                disabled={isSubmitting}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 animate-fade-in-up" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-base bg-gradient-to-r from-black to-neutral-800 hover:from-neutral-800 hover:to-black text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group mt-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {translations.signingIn}
              </>
            ) : (
              <>
                {translations.signIn}
                <ArrowRight
                  className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-center text-neutral-600 mt-8">
          {translations.noAccount}{" "}
          <Link href="/signup" className="font-semibold hover:underline transition-all text-black">
            {translations.signUp}
          </Link>
        </p>

        <div className="mt-8 pt-8 border-t border-neutral-200">
          <p className="text-xs text-center text-neutral-500">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Link href="/terms" className="text-black hover:underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="text-black hover:underline">
              Chính sách bảo mật
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


